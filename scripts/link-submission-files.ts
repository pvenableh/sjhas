/**
 * Phase 3b: fill the form_submissions_files junction for existing submissions.
 *
 * Reads data.uploaded_files[].file_id on every form_submissions row (the source
 * of truth) and creates any junction row that is missing. It only ever creates
 * rows: it never updates or deletes, so it is safe to re-run, and re-running
 * also repairs links that a failed write at submit time left out.
 * Files that no longer exist in directus_files are skipped and reported.
 *
 * Run scripts/setup-submission-files-relation.ts --apply first.
 *
 * Dry run by default (reads only):
 *   pnpm tsx scripts/link-submission-files.ts
 * Apply:
 *   pnpm tsx scripts/link-submission-files.ts --apply
 *
 * Required environment variables:
 *   DIRECTUS_URL          - Your Directus instance URL
 *   DIRECTUS_STATIC_TOKEN - Admin token with full permissions
 */

import "dotenv/config";

const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN;
const apply = process.argv.includes("--apply");

if (!DIRECTUS_URL || !DIRECTUS_TOKEN) {
  console.error("Missing required environment variables: DIRECTUS_URL and DIRECTUS_STATIC_TOKEN");
  process.exit(1);
}

const JUNCTION = "form_submissions_files";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PAGE = 200;
const headers = { Authorization: `Bearer ${DIRECTUS_TOKEN}`, "Content-Type": "application/json" };

async function api(method: string, path: string, body?: unknown) {
  const res = await fetch(`${DIRECTUS_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} failed (${res.status}): ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

const key = (submissionId: number, fileId: string) => `${submissionId}:${fileId.toLowerCase()}`;

async function main() {
  console.log(apply ? "APPLY mode: missing links will be created.\n" : "DRY RUN: nothing will be changed. Re-run with --apply.\n");

  // 1. Junction rows that already exist
  const existing = new Set<string>();
  const collectionRes = await fetch(`${DIRECTUS_URL}/collections/${JUNCTION}`, { headers });
  const junctionExists = collectionRes.ok;
  if (!junctionExists) {
    if (apply) {
      console.error(`Collection ${JUNCTION} does not exist. Run scripts/setup-submission-files-relation.ts --apply first.`);
      process.exit(1);
    }
    console.log(`Note: collection ${JUNCTION} does not exist yet; counting every link as missing.\n`);
  } else {
    for (let offset = 0; ; offset += PAGE) {
      const { data } = await api(
        "GET",
        `/items/${JUNCTION}?fields=form_submissions_id,directus_files_id&limit=${PAGE}&offset=${offset}&sort=id`
      );
      for (const row of data) {
        if (row.form_submissions_id && row.directus_files_id) existing.add(key(row.form_submissions_id, row.directus_files_id));
      }
      if (data.length < PAGE) break;
    }
  }

  // 2. Links wanted, from every submission's data.uploaded_files
  let scanned = 0, withFiles = 0, invalid = 0;
  const wanted = new Map<string, { form_submissions_id: number; directus_files_id: string; upload_field: string | null }>();
  for (let offset = 0; ; offset += PAGE) {
    const { data } = await api("GET", `/items/form_submissions?fields=id,data&limit=${PAGE}&offset=${offset}&sort=id`);
    for (const sub of data) {
      scanned++;
      const files = Array.isArray(sub.data?.uploaded_files) ? sub.data.uploaded_files : [];
      if (files.length > 0) withFiles++;
      for (const f of files) {
        if (!UUID_RE.test(String(f?.file_id))) {
          invalid++;
          continue;
        }
        const k = key(sub.id, f.file_id);
        if (!wanted.has(k)) {
          wanted.set(k, { form_submissions_id: sub.id, directus_files_id: f.file_id, upload_field: f.field ?? null });
        }
      }
    }
    if (data.length < PAGE) break;
  }

  const toCheck = [...wanted.entries()].filter(([k]) => !existing.has(k));
  const already = wanted.size - toCheck.length;

  // 3. Skip links whose file no longer exists (the foreign key would reject them)
  const ids = [...new Set(toCheck.map(([, row]) => row.directus_files_id))];
  const found = new Set<string>();
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const { data } = await api("GET", `/files?fields=id&limit=-1&filter[id][_in]=${chunk.join(",")}`);
    for (const f of data) found.add(String(f.id).toLowerCase());
  }
  const toCreate = toCheck.filter(([, row]) => found.has(row.directus_files_id.toLowerCase())).map(([, row]) => row);
  const missingFile = toCheck.filter(([, row]) => !found.has(row.directus_files_id.toLowerCase()));
  for (const [, row] of missingFile) {
    console.log(`  - submission ${row.form_submissions_id}: file ${row.directus_files_id} no longer exists, skipped`);
  }

  for (const row of toCreate) {
    console.log(`  - submission ${row.form_submissions_id} -> file ${row.directus_files_id}: ${apply ? "linking" : "would link"}`);
  }

  // 4. Create, in batches
  let created = 0, failed = 0;
  if (apply) {
    for (let i = 0; i < toCreate.length; i += 50) {
      const batch = toCreate.slice(i, i + 50);
      try {
        await api("POST", `/items/${JUNCTION}`, batch);
        created += batch.length;
      } catch (error) {
        console.error(`  batch starting at ${i} FAILED:`, (error as Error).message);
        failed += batch.length;
      }
    }
  }

  console.log(
    `\nSubmissions scanned: ${scanned} | with files: ${withFiles} | links wanted: ${wanted.size}` +
      ` | already linked: ${already} | ${apply ? "created" : "to create"}: ${apply ? created : toCreate.length}` +
      ` | skipped (file missing): ${missingFile.length} | skipped (invalid id): ${invalid} | failed: ${failed}`
  );
  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

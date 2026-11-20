/**
 * Phase 3b: create the many-to-many between form_submissions and directus_files.
 *
 * Creates (only what is missing):
 *   - collection form_submissions_files (hidden junction) with fields
 *       id, form_submissions_id, directus_files_id, upload_field
 *   - relation form_submissions_files.form_submissions_id -> form_submissions (ON DELETE CASCADE)
 *       with the alias field form_submissions.files (m2m)
 *   - relation form_submissions_files.directus_files_id -> directus_files (ON DELETE CASCADE)
 *       (no reverse alias on directus_files: the admin Files page reads the junction)
 *
 * data.uploaded_files on each submission stays the source of truth; the
 * junction is an index for going from a file back to its submission.
 * Fill it for existing submissions with scripts/link-submission-files.ts.
 *
 * Dry run by default (reads only, prints what would be created):
 *   pnpm tsx scripts/setup-submission-files-relation.ts
 * Apply (saves a schema snapshot to scripts/.backups/ first):
 *   pnpm tsx scripts/setup-submission-files-relation.ts --apply
 * Rollback (dry run, then with --apply). Removes the alias field and the
 * junction collection with all its rows; submissions and files are untouched:
 *   pnpm tsx scripts/setup-submission-files-relation.ts --remove
 *   pnpm tsx scripts/setup-submission-files-relation.ts --remove --apply
 *
 * Required environment variables:
 *   DIRECTUS_URL          - Your Directus instance URL
 *   DIRECTUS_STATIC_TOKEN - Admin token with full permissions
 */

import "dotenv/config";
import { mkdirSync, writeFileSync } from "node:fs";

const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN;
const apply = process.argv.includes("--apply");
const remove = process.argv.includes("--remove");

if (!DIRECTUS_URL || !DIRECTUS_TOKEN) {
  console.error("Missing required environment variables: DIRECTUS_URL and DIRECTUS_STATIC_TOKEN");
  process.exit(1);
}

const JUNCTION = "form_submissions_files";
const ALIAS = "files";
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

// GET that returns null on 403/404 (Directus answers 403 for things that don't exist)
async function tryGet(path: string) {
  const res = await fetch(`${DIRECTUS_URL}${path}`, { headers });
  if (res.status === 404 || res.status === 403) return null;
  if (!res.ok) throw new Error(`GET ${path} failed (${res.status}): ${await res.text()}`);
  return (await res.json()).data ?? null;
}

const JUNCTION_FIELDS = [
  {
    field: "id",
    type: "integer",
    schema: { is_primary_key: true, has_auto_increment: true },
    meta: { hidden: true, readonly: true },
  },
  {
    field: "form_submissions_id",
    type: "integer",
    schema: { is_nullable: true },
    meta: { hidden: true },
  },
  {
    field: "directus_files_id",
    type: "uuid",
    schema: { is_nullable: true },
    meta: { hidden: true },
  },
  {
    field: "upload_field",
    type: "string",
    schema: { is_nullable: true },
    meta: { interface: "input", note: "Form field the file was uploaded through" },
  },
];

const SUBMISSION_RELATION = {
  collection: JUNCTION,
  field: "form_submissions_id",
  related_collection: "form_submissions",
  meta: { one_field: ALIAS, junction_field: "directus_files_id", sort_field: null, one_deselect_action: "delete" },
  schema: { on_delete: "CASCADE" },
};

const FILE_RELATION = {
  collection: JUNCTION,
  field: "directus_files_id",
  related_collection: "directus_files",
  meta: { one_field: null, junction_field: "form_submissions_id", sort_field: null, one_deselect_action: "nullify" },
  schema: { on_delete: "CASCADE" },
};

const ALIAS_FIELD = {
  field: ALIAS,
  type: "alias",
  meta: {
    special: ["files"],
    interface: "files",
    note: "Files uploaded with this submission (index of data.uploaded_files)",
    width: "full",
  },
};

async function snapshotBackup() {
  const snap = await api("GET", "/schema/snapshot");
  const dir = new URL("./.backups/", import.meta.url);
  mkdirSync(dir, { recursive: true });
  const file = new URL(`schema-snapshot-${new Date().toISOString().replace(/[:.]/g, "-")}.json`, dir);
  writeFileSync(file, JSON.stringify(snap.data, null, 2));
  console.log(`Schema snapshot saved: ${file.pathname}\n`);
}

async function setup() {
  const collection = await tryGet(`/collections/${JUNCTION}`);
  const existingFields = new Set<string>(
    collection ? ((await tryGet(`/fields/${JUNCTION}`)) || []).map((f: any) => f.field) : []
  );
  const relations: any[] = collection ? (await tryGet(`/relations/${JUNCTION}`)) || [] : [];
  const hasRelation = (field: string) => relations.some((r) => r.field === field);
  const alias = await tryGet(`/fields/form_submissions/${ALIAS}`);

  const steps: { label: string; run: () => Promise<unknown> }[] = [];

  if (!collection) {
    steps.push({
      label: `create collection ${JUNCTION} with fields ${JUNCTION_FIELDS.map((f) => f.field).join(", ")}`,
      run: () =>
        api("POST", "/collections", {
          collection: JUNCTION,
          meta: { hidden: true, icon: "import_export", note: "Links form submissions to their uploaded files" },
          schema: {},
          fields: JUNCTION_FIELDS,
        }),
    });
  } else {
    for (const f of JUNCTION_FIELDS) {
      if (existingFields.has(f.field)) continue;
      steps.push({ label: `create field ${JUNCTION}.${f.field}`, run: () => api("POST", `/fields/${JUNCTION}`, f) });
    }
  }
  if (!alias) {
    steps.push({
      label: `create alias field form_submissions.${ALIAS} (m2m)`,
      run: () => api("POST", "/fields/form_submissions", ALIAS_FIELD),
    });
  }
  if (!hasRelation("form_submissions_id")) {
    steps.push({
      label: `create relation ${JUNCTION}.form_submissions_id -> form_submissions (ON DELETE CASCADE)`,
      run: () => api("POST", "/relations", SUBMISSION_RELATION),
    });
  }
  if (!hasRelation("directus_files_id")) {
    steps.push({
      label: `create relation ${JUNCTION}.directus_files_id -> directus_files (ON DELETE CASCADE)`,
      run: () => api("POST", "/relations", FILE_RELATION),
    });
  }

  if (steps.length === 0) {
    console.log("Nothing to do: the relation already exists.");
    return;
  }
  console.log(`${apply ? "Applying" : "Would apply"} ${steps.length} step(s):`);
  for (const s of steps) console.log(`  - ${s.label}`);
  if (!apply) return;

  await snapshotBackup();
  for (const s of steps) {
    await s.run();
    console.log(`  done: ${s.label}`);
  }
}

async function teardown() {
  const alias = await tryGet(`/fields/form_submissions/${ALIAS}`);
  const collection = await tryGet(`/collections/${JUNCTION}`);
  let rows = 0;
  if (collection) {
    const agg = await api("GET", `/items/${JUNCTION}?aggregate[count]=*`);
    rows = Number(agg.data?.[0]?.count) || 0;
  }

  const steps: { label: string; run: () => Promise<unknown> }[] = [];
  if (alias) {
    steps.push({ label: `delete alias field form_submissions.${ALIAS}`, run: () => api("DELETE", `/fields/form_submissions/${ALIAS}`) });
  }
  if (collection) {
    steps.push({
      label: `delete collection ${JUNCTION} (${rows} link row(s); its relations go with it)`,
      run: () => api("DELETE", `/collections/${JUNCTION}`),
    });
  }

  if (steps.length === 0) {
    console.log("Nothing to remove.");
    return;
  }
  console.log(`${apply ? "Removing" : "Would remove"}:`);
  for (const s of steps) console.log(`  - ${s.label}`);
  console.log("form_submissions rows, data.uploaded_files and the files themselves are not touched.");
  if (!apply) return;

  await snapshotBackup();
  for (const s of steps) {
    await s.run();
    console.log(`  done: ${s.label}`);
  }
}

async function main() {
  console.log(
    apply
      ? `APPLY mode (${remove ? "remove" : "setup"}): Directus schema will be changed.\n`
      : `DRY RUN (${remove ? "remove" : "setup"}): nothing will be changed. Re-run with --apply.\n`
  );
  await (remove ? teardown() : setup());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

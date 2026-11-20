/**
 * One-off: move files already submitted through the website forms into
 * "Form Submissions/<form title>" folders in Directus, so they are no longer
 * in the folder the Public role can read.
 *
 * Files are found by reading data.uploaded_files[].file_id on every row in
 * form_submissions. Nothing else in Directus is touched.
 *
 * Dry run by default (prints what would move, creates nothing):
 *   pnpm tsx scripts/move-submission-files.ts
 * Apply:
 *   pnpm tsx scripts/move-submission-files.ts --apply
 *
 * Required environment variables:
 *   DIRECTUS_URL          - Your Directus instance URL
 *   DIRECTUS_STATIC_TOKEN - Admin token with full permissions
 */

import "dotenv/config";
import { getSubmissionFolderId } from "../server/utils/submissionFolders";

const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN;
const apply = process.argv.includes("--apply");

if (!DIRECTUS_URL || !DIRECTUS_TOKEN) {
  console.error("Missing required environment variables: DIRECTUS_URL and DIRECTUS_STATIC_TOKEN");
  process.exit(1);
}

const conn = { url: DIRECTUS_URL, token: DIRECTUS_TOKEN };
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

async function main() {
  console.log(apply ? "APPLY mode: files will be moved.\n" : "DRY RUN: nothing will be changed. Re-run with --apply to move files.\n");

  // 1. Collect file IDs per form title from every submission
  const byForm = new Map<string, Set<string>>();
  const pageSize = 200;
  for (let offset = 0; ; offset += pageSize) {
    const { data } = await api(
      "GET",
      `/items/form_submissions?fields=id,data,form.title&limit=${pageSize}&offset=${offset}&sort=id`
    );
    for (const sub of data) {
      const files = Array.isArray(sub.data?.uploaded_files) ? sub.data.uploaded_files : [];
      if (files.length === 0) continue;
      const title = sub.form?.title || "Untitled Form";
      if (!byForm.has(title)) byForm.set(title, new Set());
      for (const f of files) if (f?.file_id) byForm.get(title)!.add(f.file_id);
    }
    if (data.length < pageSize) break;
  }

  const total = [...byForm.values()].reduce((n, s) => n + s.size, 0);
  console.log(`Found ${total} submitted file(s) across ${byForm.size} form(s).\n`);

  let moved = 0, already = 0, missing = 0, failed = 0;

  // 2. Move them
  for (const [title, ids] of byForm) {
    const folderId = await getSubmissionFolderId(conn, title, apply);
    console.log(`Form Submissions/${title}  (${ids.size} file(s))${folderId ? "" : "  [folder would be created]"}`);

    for (const id of ids) {
      try {
        const res = await fetch(`${DIRECTUS_URL}/files/${id}?fields=id,filename_download,folder`, { headers });
        if (res.status === 404 || res.status === 403) {
          console.log(`  - ${id}: not found (deleted?), skipped`);
          missing++;
          continue;
        }
        if (!res.ok) throw new Error(`lookup failed (${res.status})`);
        const file = (await res.json()).data;

        if (folderId && file.folder === folderId) {
          already++;
          continue;
        }
        console.log(`  - ${file.filename_download || id}: ${apply ? "moving" : "would move"}`);
        if (apply) await api("PATCH", `/files/${id}`, { folder: folderId });
        moved++;
      } catch (error) {
        console.error(`  - ${id}: FAILED`, (error as Error).message);
        failed++;
      }
    }
  }

  console.log(
    `\n${apply ? "Moved" : "Would move"}: ${moved} | already in place: ${already} | missing: ${missing} | failed: ${failed}`
  );
  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

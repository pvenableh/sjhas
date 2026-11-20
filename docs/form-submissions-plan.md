# Form submissions: make them easy for Steve to track and manage

Written 2026-11-20. Site: sjhas.com (Nuxt). CMS: admin.sjhas.com (Directus).

## Decision

Finish the existing Nuxt admin. Do not customize Directus Studio.

- The Nuxt admin already exists: `app/pages/admin/submissions/index.vue` has status tabs, search, a form filter, CSV export and a notification bell.
- The real problem is the notification email. Each file's "View" link points to `admin.sjhas.com/assets/<id>` (`server/api/forms/submit.post.ts:324`): a raw file on a different login, with no link to the submission and no way to mark it handled.
- Studio is a poor fit because uploaded files are stored as IDs inside the submission's JSON (`data.uploaded_files`), not as a relation. Studio can only show that as raw JSON without a schema change and data migration.

## Phases at a glance

| Phase | Work | Model |
|---|---|---|
| 0 | Permission checks in Directus Studio | None (Peter, about 5 minutes) |
| 1 | Email lands in the admin; role guard | Sonnet 5.5 |
| 1b | Lock down submitted files (only if Phase 0 finds them public) | Sonnet 5.5, plus one Studio step by Peter |
| 2a | List polish | Haiku 5.5 |
| 2b | List features | Sonnet 5.5 |
| 3a | File hygiene and save-failure handling | Sonnet 5.5 |
| 3b | Optional files-to-submissions relation | Opus 5.5 |

Order: 0, then 1, then 1b if needed. After that 2a, 2b and 3a in any order, except 2a and 2b both edit the submissions page so not at the same time. 3b last, if at all.

Run each phase in a fresh session on the listed model. Do not use Fable.

## Phase 0: checks in Directus Studio (Peter)

Not verifiable from the codebase. Record the answers here before starting Phase 1.

Answered 2026-11-20:

- [x] Can the **Public** role read `directus_files`? **Yes.** Every emailed asset link opens a client's tax document for anyone holding the link, so Phase 1b is required.
- [x] Can the **client** role (accounts created by public registration) read `form_submissions` rows that are not their own? **No**, only their own.
- [x] Which Directus folder(s) hold website images (home page, about image, etc.)? **All of this project's files are in the `SJHAS` folder (`a9dc8d10-5e90-4e4b-8b8a-616b6c4e8c1d`), with no nested folders.** Phase 1b must therefore move submitted files out of that folder (or into a separate folder) before limiting Public read to it.
- [x] What is the admin role's name or ID? **Administrator**, `a665acc8-7350-453a-a678-4ac731109e26`. Set `ADMIN_ROLE_ID` to this ID in Vercel (and `.env` locally); the Phase 1 guard allows only roles listed there, and nobody is admin if it is unset.

## Phase 1: the email lands in the admin (Sonnet 5.5)

1. **Email button.** In `server/api/forms/submit.post.ts`, keep the new submission ID (already returned at line 242) and pass it to `sendNotificationEmail`. Replace the per-file Directus links (line 324) with one "View submission" button to `<site url>/admin/submissions/<id>`. Keep the filename list, without links. If the save failed and there is no ID, link to `/admin/submissions`. The template source is `emails/adminNotification.mjml`, compiled by `emails/compile.ts` into `server/utils/emails/templates/adminNotification.ts`.
2. **Detail page.** Add `app/pages/admin/submissions/[id].vue` showing submitter, received date, responses, files, status actions and notes. Reuse the markup from the expanded row in `app/pages/admin/submissions/index.vue` and link each list row to it. The login redirect in `app/middleware/auth.ts` already preserves the destination.
3. **File proxy.** Add `server/api/files/[id].get.ts` that requires a session, fetches `<directus url>/assets/<id>` with the session's Directus token (`getSessionAccessToken` in `server/utils/session.ts`; follow the pattern in `server/api/directus/files.post.ts`) and streams it back with the right content type. Support a download flag. Point the links in `app/pages/admin/submissions/index.vue:328` and `app/pages/admin/files/index.vue` at it.
4. **Admin-role guard.** `app/middleware/auth.ts` only checks that someone is logged in, and public registration exists. Add an admin check for all `/admin` pages, and enforce the same check server-side in the new file proxy and in `server/api/forms/export.get.ts` (confirm whether export uses the session token or the static token; if static, the role check there is essential).

Done when: a test submission's email opens the submission on sjhas.com after login, files download with only the sjhas.com login, and a client account is refused on `/admin` and on the proxy.

Afterwards run `/security-review` on Sonnet 5.5.

## Phase 1b: lock down submitted files (only if Phase 0 finds Public can read files)

Order matters. Do not start until Phase 1 is live, or Steve loses access to files from his emails.

1. **Sonnet 5.5:** move the folder step up from Phase 3a. New uploads in `server/api/forms/submit.post.ts` go into a `Form Submissions/<form title>` folder (find or create), with the file title set to the submitter's name.
2. **Sonnet 5.5:** one-off script in `scripts/` that moves existing submitted files into that folder. Find them by reading `data.uploaded_files[].file_id` across all `form_submissions`. Dry-run mode first.
3. **Peter, in Studio:** limit the Public role's file read to the website image folder(s) from Phase 0. Do not switch Public read off entirely; the site's own images would break.

Done when: an old emailed asset link returns 403 while logged out, the site's images still load, and Steve can still open files through the admin.

## Phase 2a: list polish (Haiku 5.5)

All in `app/pages/admin/submissions/index.vue`.

- Show the received date. `date_created` is missing from the fetched fields (line 33); `formatDate` already exists and is unused.
- File-count badge on each row, so documents are visible without expanding.
- Editable internal notes. The `notes` field exists in the schema with no UI.

## Phase 2b: list features (Sonnet 5.5)

- Inline preview for PDFs and images, via the Phase 1 file proxy.
- "Download all" as a zip per submission (new server route).
- Server-side paging and search, including search inside responses. The list is currently capped at 100 and filtered in the browser.

## Phase 3a: file hygiene and save failures (Sonnet 5.5)

- Upload folder and file titles, if not already done in Phase 1b.
- Silent save failure: if saving to Directus fails, the form still reports success and the email is the only record (`server/api/forms/submit.post.ts:238-247`). At minimum, flag the failure prominently in the admin email; consider returning an error to the submitter.

## Phase 3b: optional files-to-submissions relation (Opus 5.5)

A real many-to-many between `form_submissions` and `directus_files`, plus migrating existing submissions. Schema change and production data migration. Only do this if Steve needs to go from a file in `/admin/files` back to its submission.

### Phase 3b as built

- Junction `form_submissions_files` (`id`, `form_submissions_id` → `form_submissions`, `directus_files_id` → `directus_files`, both ON DELETE CASCADE, plus `upload_field`), with the m2m alias `form_submissions.files`. No reverse alias on `directus_files`.
- `data.uploaded_files` stays the source of truth. The junction is an index from a file back to its submission. `submit.post.ts` writes it after a successful save; a failed write is only logged.
- `/admin/files` shows a "Submission #id · name" link and a "From form submissions" filter.
- Rollout, each step dry-run first, then `--apply`:
  1. `pnpm tsx scripts/setup-submission-files-relation.ts` (saves a schema snapshot to `scripts/.backups/` before applying)
  2. `pnpm tsx scripts/link-submission-files.ts` (only creates missing rows; safe to re-run)
  3. Deploy.
- Rollback: `pnpm tsx scripts/setup-submission-files-relation.ts --remove` (then `--apply`), and revert the code. Nothing in `form_submissions` or the files changes.

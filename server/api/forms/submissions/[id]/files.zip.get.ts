// server/api/forms/submissions/[id]/files.zip.get.ts
/**
 * Download every file uploaded with one submission as a single zip.
 *
 * Admin-only. Only files listed in the submission's own `uploaded_files` are
 * included, so this cannot be used to fetch arbitrary Directus files. Each file
 * is fetched from Directus with the signed-in user's token (same as the
 * /api/files/[id] proxy) and streamed into the zip one at a time, so memory
 * use is bounded by the largest single file rather than the whole archive.
 */
import { Zip, ZipPassThrough } from "fflate";
import { Readable } from "node:stream";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Make a filename safe to use as a zip entry (no paths, no control chars).
function safeEntryName(name: string): string {
  const base = String(name || "file").split(/[\\/]/).pop() || "file";
  const cleaned = base.replace(/[\u0000-\u001f<>:"|?*]/g, "_").trim();
  return cleaned && cleaned !== "." && cleaned !== ".." ? cleaned.slice(0, 200) : "file";
}

// Ensure unique names inside the zip: "a.pdf", "a (2).pdf", ...
function uniqueName(name: string, used: Set<string>): string {
  if (!used.has(name.toLowerCase())) {
    used.add(name.toLowerCase());
    return name;
  }
  const dot = name.lastIndexOf(".");
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  for (let i = 2; ; i++) {
    const candidate = `${stem} (${i})${ext}`;
    if (!used.has(candidate.toLowerCase())) {
      used.add(candidate.toLowerCase());
      return candidate;
    }
  }
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const idParam = getRouterParam(event, "id") || "";
  if (!/^\d+$/.test(idParam)) {
    throw createError({ statusCode: 400, message: "Invalid submission ID" });
  }

  // requireAdmin refreshes an expiring token, so read the session afterwards.
  const session = await getUserSession(event);
  const token = getSessionAccessToken(session);
  if (!token) {
    throw createError({ statusCode: 401, message: "No authentication token available" });
  }

  const directus = await getUserDirectus(event);
  let submission: any;
  try {
    submission = await directus.request(
      readItem("form_submissions", idParam, { fields: ["id", "data"] })
    );
  } catch (error: any) {
    const statusCode = getDirectusHttpStatus(error);
    throw createError({ statusCode, message: getDirectusErrorMessage(error) });
  }

  const files = (Array.isArray(submission?.data?.uploaded_files) ? submission.data.uploaded_files : [])
    .filter((f: any) => f && UUID_RE.test(String(f.file_id)));
  if (files.length === 0) {
    throw createError({ statusCode: 404, message: "This submission has no uploaded files" });
  }

  const config = useRuntimeConfig();
  const baseUrl = config.directus.url;

  // Fetch the first file before sending headers so a total failure is a
  // proper error response rather than a truncated zip.
  const fetchFile = async (fileId: string) => {
    const res = await fetch(`${baseUrl}/assets/${fileId}?download`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Directus returned ${res.status}`);
    return new Uint8Array(await res.arrayBuffer());
  };

  let first: Uint8Array;
  try {
    first = await fetchFile(files[0].file_id);
  } catch (error) {
    console.error("[/api/forms/submissions/files.zip] First file failed:", (error as any)?.message);
    throw createError({ statusCode: 502, message: "Could not retrieve files from storage" });
  }

  const used = new Set<string>();
  const skipped: string[] = [];

  const stream = new Readable({ read() {} });
  const zip = new Zip((err, chunk, final) => {
    if (err) {
      stream.destroy(err);
      return;
    }
    stream.push(Buffer.from(chunk));
    if (final) stream.push(null);
  });

  const addEntry = (name: string, data: Uint8Array) => {
    // Uploaded types are already compressed (pdf/jpg/png), so store without deflate.
    const entry = new ZipPassThrough(uniqueName(safeEntryName(name), used));
    zip.add(entry);
    entry.push(data, true);
  };

  // Build the archive in the background while the response streams out.
  (async () => {
    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        try {
          const data = i === 0 ? first : await fetchFile(f.file_id);
          addEntry(f.filename, data);
        } catch (error) {
          console.error("[/api/forms/submissions/files.zip] Skipping file:", f.file_id, (error as any)?.message);
          skipped.push(String(f.filename || f.file_id));
        }
      }
      if (skipped.length > 0) {
        addEntry(
          "_MISSING_FILES.txt",
          new TextEncoder().encode(
            `These files could not be retrieved and are not in this zip:\n${skipped.join("\n")}\n`
          )
        );
      }
      zip.end();
    } catch (error) {
      zip.terminate();
      stream.destroy(error as Error);
    }
  })();

  setResponseHeaders(event, {
    "Content-Type": "application/zip",
    "Content-Disposition": `attachment; filename="submission-${idParam}-files.zip"`,
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "private, no-store",
  });

  return sendStream(event, stream);
});

// server/api/files/[id].get.ts
/**
 * Authenticated file proxy for admin users.
 *
 * Streams /assets/<id> from Directus using the signed-in user's Directus token,
 * so files never need a public link and the only login needed is sjhas.com.
 *
 * Query params:
 *   - download (optional): any truthy value forces a download instead of inline view
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Only these types may render inline on our origin; everything else is
// forced to download so an uploaded HTML/SVG file can never run as a page.
const INLINE_SAFE = /^(application\/pdf|image\/(png|jpe?g|gif|webp|avif)|text\/plain)(;|$)/i;

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = getRouterParam(event, "id") || "";
  if (!UUID_RE.test(id)) {
    throw createError({ statusCode: 400, message: "Invalid file ID" });
  }

  // requireAdmin refreshes an expiring token, so read the session afterwards.
  const session = await getUserSession(event);
  const token = getSessionAccessToken(session);
  if (!token) {
    throw createError({ statusCode: 401, message: "No authentication token available" });
  }

  const config = useRuntimeConfig();
  const wantsDownload = !!getQuery(event).download;
  const upstreamUrl = `${config.directus.url}/assets/${id}${wantsDownload ? "?download" : ""}`;

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    console.error("[/api/files] Upstream fetch failed:", (error as any)?.message);
    throw createError({ statusCode: 502, message: "Could not reach file storage" });
  }

  if (!upstream.ok || !upstream.body) {
    const status = [401, 403, 404].includes(upstream.status) ? upstream.status : 502;
    throw createError({
      statusCode: status,
      message: status === 404 ? "File not found" : "Unable to retrieve file",
    });
  }

  const contentType = upstream.headers.get("content-type") || "application/octet-stream";
  const upstreamDisposition = upstream.headers.get("content-disposition") || "";
  const filenameMatch = upstreamDisposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  const disposition =
    wantsDownload || !INLINE_SAFE.test(contentType)
      ? "attachment"
      : "inline";

  setResponseHeaders(event, {
    "Content-Type": contentType,
    "Content-Disposition": filenameMatch
      ? `${disposition}; filename="${filenameMatch[1].replace(/"/g, "")}"`
      : disposition,
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "private, no-store",
  });
  const length = upstream.headers.get("content-length");
  if (length) setResponseHeader(event, "Content-Length", length);

  return sendStream(event, upstream.body);
});

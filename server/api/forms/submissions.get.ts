// server/api/forms/submissions.get.ts
/**
 * Paged, filtered list of form submissions for the admin list page.
 *
 * Query params:
 *   - page (default 1), limit (default 25, max 100)
 *   - status: new | reviewed | archived | all
 *   - form_id: numeric form ID
 *   - q: search text. Matches submitter name/email, notes, form title, and the
 *     text answers inside the JSON `data` column.
 *
 * Response: { items, total, counts: { all, new, reviewed, archived }, responseSearch }
 * `counts` ignore the status filter (so the tabs stay accurate) but respect
 * form and search. `responseSearch` is "ok" (Directus `_json` filter), "scan"
 * (Directus too old for `_json`; responses scanned in Node) or "off" (no q).
 *
 * How response search works: Directus' `search` param and `_icontains` don't
 * look inside JSON columns, but newer versions support the `_json` filter
 * operator with explicit paths. Paths can't be wildcarded, so we OR one path
 * per field name defined on the relevant form(s). No schema or index change.
 * Answers stored as arrays (checkbox groups) and the uploaded_files list are
 * not matched by `_json`. Older Directus versions reject `_json`; for those we
 * read id+data of the candidate rows and match in Node (searches every text
 * value, arrays included), which is fine at this volume.
 */

const STATUSES = ["new", "reviewed", "archived"] as const;
const SAFE_KEY = /^[A-Za-z0-9_-]{1,64}$/;
const MAX_JSON_KEYS = 150;

// Remembered after the first rejection so we skip the doomed _json attempt.
let jsonFilterSupported = true;

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const query = getQuery(event);
  const page = Math.max(1, parseInt(String(query.page || "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || "25"), 10) || 25));
  const status = String(query.status || "all");
  const formIdRaw = String(query.form_id || "");
  const formId = /^\d+$/.test(formIdRaw) ? Number(formIdRaw) : null;
  const q = String(query.q || "").trim().slice(0, 100);

  if (status !== "all" && !(STATUSES as readonly string[]).includes(status)) {
    throw createError({ statusCode: 400, message: "Invalid status" });
  }

  const directus = await getUserDirectus(event);

  const buildFilter = async (includeJson: boolean, includeStatus: boolean, matchedIds: number[] = []) => {
    const and: any[] = [];
    if (formId !== null) and.push({ form: { _eq: formId } });
    if (includeStatus && status !== "all") and.push({ status: { _eq: status } });

    if (q) {
      const or: any[] = [
        { submitter_name: { _icontains: q } },
        { submitter_email: { _icontains: q } },
        { notes: { _icontains: q } },
        { form: { title: { _icontains: q } } },
      ];
      if (matchedIds.length) or.push({ id: { _in: matchedIds } });
      if (includeJson) {
        const forms = (await directus.request(
          readItems("forms", {
            fields: ["id", "fields"],
            ...(formId !== null ? { filter: { id: { _eq: formId } } } : {}),
            limit: -1,
          })
        )) as any[];
        const keys = new Set<string>();
        for (const f of forms) {
          for (const field of Array.isArray(f.fields) ? f.fields : []) {
            if (field?.name && SAFE_KEY.test(field.name)) keys.add(field.name);
          }
        }
        for (const key of [...keys].slice(0, MAX_JSON_KEYS)) {
          or.push({ data: { _json: { [key]: { _icontains: q } } } });
        }
      }
      and.push({ _or: or });
    }
    return and.length ? { _and: and } : {};
  };

  const run = async (includeJson: boolean, matchedIds: number[] = []) => {
    const [items, countRows] = await Promise.all([
      directus.request(
        readItems("form_submissions", {
          filter: await buildFilter(includeJson, true, matchedIds),
          sort: ["-id"],
          fields: [
            "id", "form.id", "form.title", "form.slug", "status", "data",
            "submitter_email", "submitter_name", "notes", "date_created",
          ] as any,
          limit,
          page,
        })
      ),
      directus.request(
        aggregate("form_submissions", {
          aggregate: { count: "*" },
          groupBy: ["status"],
          query: { filter: await buildFilter(includeJson, false, matchedIds) },
        } as any)
      ),
    ]);
    return { items: items as any[], countRows: countRows as any[] };
  };

  try {
    let result;
    let responseSearch: "ok" | "scan" | "off" = q ? "ok" : "off";
    try {
      if (q && !jsonFilterSupported) throw Object.assign(new Error("skip"), { skipJson: true });
      result = await run(!!q);
    } catch (error: any) {
      // Older Directus versions reject `_json`. Scan responses in Node instead.
      const code = getDirectusHttpStatus(error);
      if (!q || (!error.skipJson && code !== 400)) throw error;
      if (!error.skipJson) jsonFilterSupported = false;
      if (!error.skipJson) console.warn("[/api/forms/submissions] _json filter rejected, scanning responses in Node:", getDirectusErrorMessage(error));
      const rows = (await directus.request(
        readItems("form_submissions", {
          fields: ["id", "data"],
          ...(formId !== null ? { filter: { form: { _eq: formId } } } : {}),
          limit: -1,
        })
      )) as any[];
      const needle = q.toLowerCase();
      const matchedIds = rows
        .filter((r) => dataContains(r.data, needle))
        .map((r) => r.id as number);
      result = await run(false, matchedIds);
      responseSearch = "scan";
    }

    const counts = { all: 0, new: 0, reviewed: 0, archived: 0 };
    for (const row of result.countRows) {
      const n = Number(row.count) || 0;
      if (row.status in counts) (counts as any)[row.status] = n;
      counts.all += n;
    }
    const total = status === "all" ? counts.all : (counts as any)[status];

    return { items: result.items, total, counts, responseSearch };
  } catch (error: any) {
    if (error.statusCode) throw error;
    const statusCode = getDirectusHttpStatus(error);
    const message = getDirectusErrorMessage(error);
    console.error("[/api/forms/submissions] Error:", message);
    throw createError({ statusCode, message });
  }
});

// True when any string/number value in the responses contains the needle
// (lowercase). Skips the uploaded_files list; recurses into arrays/objects.
function dataContains(data: unknown, needle: string): boolean {
  if (data === null || data === undefined) return false;
  if (typeof data === "string") return data.toLowerCase().includes(needle);
  if (typeof data === "number") return String(data).includes(needle);
  if (Array.isArray(data)) return data.some((v) => dataContains(v, needle));
  if (typeof data === "object") {
    return Object.entries(data as Record<string, unknown>).some(
      ([k, v]) => k !== "uploaded_files" && dataContains(v, needle)
    );
  }
  return false;
}

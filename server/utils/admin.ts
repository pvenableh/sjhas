// server/utils/admin.ts
// Server-side admin-role check shared by admin-only API routes.
//
// A user counts as an admin only when their Directus role ID is listed in
// ADMIN_ROLE_ID (comma-separated). If ADMIN_ROLE_ID is not set, nobody is an
// admin. (Directus 11 keeps `admin_access` on policies, not roles, so it is not
// used here.) The role is always looked up from Directus with the user's own
// token rather than trusted from the session cookie, so a role change takes
// effect quickly and the cookie contents never decide access.

import type { H3Event } from "h3";

const CACHE_TTL_MS = 60_000;
const adminCache = new Map<string, { isAdmin: boolean; expires: number }>();

export async function isAdminUser(event: H3Event): Promise<boolean> {
  const session = await getUserSession(event);
  const userId = session?.user?.id as string | undefined;
  if (!userId) return false;

  const cached = adminCache.get(userId);
  if (cached && cached.expires > Date.now()) return cached.isAdmin;

  const allowedIds = String(useRuntimeConfig().adminRoleIds || "")
    .split(",")
    .map((id) => id.trim().toLowerCase())
    .filter(Boolean);
  if (allowedIds.length === 0) {
    console.warn("[admin] ADMIN_ROLE_ID is not set; no user can access admin features");
    return false;
  }

  let isAdmin = false;
  try {
    const directus = await getUserDirectus(event);
    const me = (await directus.request(
      readMe({ fields: ["id", "role.id"] as any })
    )) as any;
    const roleId = me?.role?.id;
    isAdmin = !!roleId && allowedIds.includes(String(roleId).toLowerCase());
  } catch (error) {
    // Fail closed: an unverifiable role is never treated as admin.
    console.warn("[admin] Role check failed:", (error as any)?.message);
    return false;
  }

  adminCache.set(userId, { isAdmin, expires: Date.now() + CACHE_TTL_MS });
  return isAdmin;
}

/**
 * Throw 401 when there is no session and 403 when the user is not an admin.
 * Returns the session on success.
 */
export async function requireAdmin(event: H3Event) {
  const session = await getUserSession(event);
  if (!session?.user) {
    throw createError({ statusCode: 401, message: "Authentication required" });
  }
  if (!(await isAdminUser(event))) {
    throw createError({ statusCode: 403, message: "Admin access required" });
  }
  return session;
}

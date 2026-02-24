// server/api/directus/users/index.get.ts
/**
 * Server API route for listing users
 * GET: List users with optional query parameters
 *
 * System collections like directus_users require the dedicated
 * readUsers() SDK function — readItems('directus_users') does NOT work
 * because the SDK targets /items/directus_users instead of /users.
 */

import { readUsers } from "@directus/sdk";

export default defineEventHandler(async (event) => {
  try {
    const directus = await getUserDirectus(event);
    const query = getQuery(event);

    // Parse fields from comma-separated string
    const fields = query.fields
      ? (query.fields as string).split(",")
      : ["*", "role.*"];

    // Parse sort from comma-separated string
    const sort = query.sort
      ? (query.sort as string).split(",")
      : undefined;

    // Parse limit
    const limit = query.limit ? Number(query.limit) : undefined;

    // Parse filter from JSON string
    let filter: Record<string, any> | undefined;
    if (query.filter) {
      try {
        filter = JSON.parse(query.filter as string);
      } catch {
        // ignore malformed filter
      }
    }

    const users = await directus.request(
      readUsers({
        fields,
        ...(sort && { sort }),
        ...(limit !== undefined && { limit }),
        ...(filter && { filter }),
      })
    );

    return users;
  } catch (error: any) {
    const statusCode = getDirectusHttpStatus(error);
    const message = getDirectusErrorMessage(error);
    console.error("User list error:", { message, statusCode });

    throw createError({ statusCode, message });
  }
});

// server/api/directus/users/accept-invite.post.ts
/**
 * Server API route for accepting user invitations
 * POST: Accept invitation and set password
 */

import { acceptUserInvite } from "@directus/sdk";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { token, password } = body;

    if (!token || !password) {
      throw createError({
        statusCode: 400,
        message: "Token and password are required",
      });
    }

    // Use public client since user isn't authenticated yet
    const directus = getPublicDirectus();

    // Accept invitation using SDK
    await directus.request(acceptUserInvite(token, password));

    return {
      success: true,
      message: "Invitation accepted successfully",
    };
  } catch (error: any) {
    console.error("Accept invitation error:", error);

    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to accept invitation",
    });
  }
});

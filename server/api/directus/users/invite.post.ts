// server/api/directus/users/invite.post.ts
/**
 * Server API route for user invitations
 * POST: Invite a new user to Directus
 */

import { inviteUser } from "@directus/sdk";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { email, role, invite_url, ...additionalData } = body;

    if (!email || !role) {
      throw createError({
        statusCode: 400,
        message: "Email and role are required",
      });
    }

    const directus = await getUserDirectus(event);
    const config = useRuntimeConfig();

    // Invite user using SDK
    const result = await directus.request(
      inviteUser(email, role, {
        invite_url: invite_url || `${config.public.siteUrl}/accept-invite`,
        ...additionalData,
      })
    );

    return {
      success: true,
      message: "Invitation sent successfully",
      data: result,
    };
  } catch (error: any) {
    const statusCode = getDirectusHttpStatus(error);
    const message = getDirectusErrorMessage(error);
    console.error("User invitation error:", { message, statusCode });

    throw createError({ statusCode, message });
  }
});

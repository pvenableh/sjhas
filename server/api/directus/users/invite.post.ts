// server/api/directus/users/invite.post.ts
/**
 * Server API route for user invitations
 * POST: Invite a new user to Directus
 *
 * Uses the admin client (static token) because the Directus invite
 * endpoint requires admin privileges.
 *
 * NOTE: To use a custom invite URL (so the email links to your app's
 * /accept-invite page instead of the Directus Data Studio), you must
 * configure USER_INVITE_URL_ALLOW_LIST on the Directus server.
 * See: https://directus.io/docs/api/users#invite-user
 */

import { inviteUser, updateUser } from "@directus/sdk";

export default defineEventHandler(async (event) => {
  try {
    // Verify the caller is authenticated
    const session = await getUserSession(event);
    if (!session?.user) {
      throw createError({
        statusCode: 401,
        message: "Authentication required",
      });
    }

    const body = await readBody(event);
    const { email, role, invite_url, first_name, last_name } = body;

    if (!email || !role) {
      throw createError({
        statusCode: 400,
        message: "Email and role are required",
      });
    }

    const config = useRuntimeConfig();

    // Use admin client — inviting users requires admin privileges
    const directus = getTypedDirectus();

    // Build the custom invite URL that links to our accept-invite page.
    // IMPORTANT: Directus requires USER_INVITE_URL_ALLOW_LIST to include
    // this URL, otherwise it rejects with a 400 INVALID_PAYLOAD error.
    // The Directus allowlist should contain: {SITE_URL}/auth/user-invite
    const customInviteUrl =
      invite_url || `${config.public.siteUrl}/auth/user-invite`;

    // Try with custom invite URL first, fall back to no URL if Directus
    // rejects it (e.g. USER_INVITE_URL_ALLOW_LIST not configured).
    let usedCustomUrl = false;
    try {
      await directus.request(inviteUser(email, role, customInviteUrl));
      usedCustomUrl = true;
    } catch (urlError: any) {
      const urlErrorMsg = getDirectusErrorMessage(urlError);
      const isUrlRejection =
        urlErrorMsg.toLowerCase().includes("url") ||
        urlErrorMsg.toLowerCase().includes("invite_url") ||
        urlErrorMsg.toLowerCase().includes("can't be used");

      if (isUrlRejection) {
        // The custom URL was rejected — retry without it so the invite
        // still goes through (email will link to Directus Data Studio).
        console.warn(
          `Custom invite URL rejected by Directus ("${customInviteUrl}"). ` +
            "Retrying without invite_url. To fix this, add the URL to " +
            "USER_INVITE_URL_ALLOW_LIST in your Directus environment."
        );
        await directus.request(inviteUser(email, role));
      } else {
        // Not a URL issue — rethrow the original error
        throw urlError;
      }
    }

    // If first_name or last_name were provided, update the newly created
    // user record.  Directus creates the user with status "invited" when
    // the invite is sent, so we can look them up by email.
    if (first_name || last_name) {
      try {
        const { readUsers } = await import("@directus/sdk");
        const users = await directus.request(
          readUsers({
            filter: { email: { _eq: email } },
            fields: ["id"],
            limit: 1,
          })
        );

        if (users.length > 0) {
          const updates: Record<string, string> = {};
          if (first_name) updates.first_name = first_name;
          if (last_name) updates.last_name = last_name;
          await directus.request(updateUser(users[0].id, updates));
        }
      } catch (updateError) {
        // Non-critical — the invite was sent successfully.
        // The user can set their name when they accept the invitation.
        console.warn(
          "Could not set name on invited user:",
          (updateError as Error).message
        );
      }
    }

    return {
      success: true,
      message: "Invitation sent successfully",
      usedCustomUrl,
    };
  } catch (error: any) {
    const statusCode = getDirectusHttpStatus(error);
    const message = getDirectusErrorMessage(error);
    console.error("User invitation error:", {
      message,
      statusCode,
      errors: error.errors,
    });

    throw createError({ statusCode, message });
  }
});

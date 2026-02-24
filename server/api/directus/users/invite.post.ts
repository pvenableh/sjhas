// server/api/directus/users/invite.post.ts
/**
 * Server API route for user invitations
 * POST: Invite a new user to Directus
 *
 * Uses the admin client (static token) because the Directus invite
 * endpoint requires admin privileges.  The invite_url must be passed
 * as a plain string — the SDK signature is:
 *   inviteUser(email, role, invite_url?)
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

    // The SDK's inviteUser() expects (email, role, invite_url_string).
    // Passing an object here previously caused a 400 error from Directus.
    const resolvedInviteUrl =
      invite_url || `${config.public.siteUrl}/accept-invite`;

    await directus.request(inviteUser(email, role, resolvedInviteUrl));

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
    };
  } catch (error: any) {
    const statusCode = getDirectusHttpStatus(error);
    const message = getDirectusErrorMessage(error);
    console.error("User invitation error:", { message, statusCode });

    throw createError({ statusCode, message });
  }
});

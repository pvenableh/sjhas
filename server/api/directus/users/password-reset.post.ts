// server/api/directus/users/password-reset.post.ts
/**
 * Server API route for password reset
 * POST: Reset password with token
 */

import { passwordReset } from "@directus/sdk";

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

    // Use public client for password reset
    const directus = getPublicDirectus();

    await directus.request(passwordReset(token, password));

    return {
      success: true,
      message: "Password reset successfully",
    };
  } catch (error: any) {
    const statusCode = getDirectusHttpStatus(error);
    const message = getDirectusErrorMessage(error);
    console.error("Password reset error:", { message, statusCode });

    throw createError({ statusCode, message });
  }
});

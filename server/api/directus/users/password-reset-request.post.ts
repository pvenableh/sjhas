// server/api/directus/users/password-reset-request.post.ts
/**
 * Server API route for password reset request
 * POST: Request password reset email
 */

import { passwordRequest } from "@directus/sdk";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { email, reset_url } = body;

    if (!email) {
      throw createError({
        statusCode: 400,
        message: "Email is required",
      });
    }

    // Use admin client to send password reset
    const directus = getTypedDirectus();
    const config = useRuntimeConfig();

    await directus.request(
      passwordRequest(email, reset_url || `${config.public.siteUrl}/auth/password-reset`)
    );

    return {
      success: true,
      message: "Password reset email sent",
    };
  } catch (error: any) {
    console.error("Password reset request error:", error);

    // Don't reveal if email exists or not for security
    return {
      success: true,
      message: "If that email exists, a password reset link has been sent",
    };
  }
});

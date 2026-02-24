// server/api/directus/users/password-reset.post.ts
/**
 * Server API route for password reset
 * POST: Verify the HMAC-signed token and update the user's password
 *       via the Directus admin API.
 */

import crypto from "node:crypto";

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

    // Decode and verify the HMAC token: base64url(userId.expiresAt.signature)
    const config = useRuntimeConfig();
    const secret = config.sessionPassword;

    let decoded: string;
    try {
      decoded = Buffer.from(token, "base64url").toString("utf-8");
    } catch {
      throw createError({ statusCode: 400, message: "Invalid reset token" });
    }

    const parts = decoded.split(".");
    if (parts.length !== 3) {
      throw createError({ statusCode: 400, message: "Invalid reset token" });
    }

    const [userId, expiresAtStr, signature] = parts;
    const expiresAt = Number(expiresAtStr);

    // Verify signature
    const payload = `${userId}.${expiresAtStr}`;
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      throw createError({ statusCode: 400, message: "Invalid reset token" });
    }

    // Check expiry
    if (Date.now() > expiresAt) {
      throw createError({
        statusCode: 400,
        message: "Reset token has expired. Please request a new one.",
      });
    }

    // Update the user's password via Directus admin API
    const directus = getTypedDirectus();
    await directus.request(updateUser(userId, { password }));

    return {
      success: true,
      message: "Password reset successfully",
    };
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    const message = error.message || "Failed to reset password";
    console.error("Password reset error:", { message, statusCode });

    throw createError({ statusCode, message });
  }
});

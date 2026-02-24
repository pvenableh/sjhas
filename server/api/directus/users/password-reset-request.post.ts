// server/api/directus/users/password-reset-request.post.ts
/**
 * Server API route for password reset request
 * POST: Generate a reset token and send the email via SendGrid
 *
 * This bypasses Directus's built-in SMTP email (which requires a working
 * EMAIL_TRANSPORT on the Directus instance) and sends the reset email
 * through SendGrid instead.
 */

import crypto from "node:crypto";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { email } = body;

    if (!email) {
      throw createError({
        statusCode: 400,
        message: "Email is required",
      });
    }

    const config = useRuntimeConfig();

    // Look up the user by email via the admin API
    const directus = getTypedDirectus();
    let user: { id: string; first_name?: string; email: string } | null = null;

    try {
      const users = await directus.request(
        readUsers({
          filter: { email: { _eq: email.toLowerCase().trim() } },
          fields: ["id", "first_name", "email"],
          limit: 1,
        })
      );
      user = (users as any[])?.[0] ?? null;
    } catch {
      // Ignore — treat as "no user found"
    }

    if (user) {
      // Generate an HMAC-signed token: userId.expiry.signature
      const secret = config.sessionPassword; // reuse the 32+ char session secret
      const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
      const payload = `${user.id}.${expiresAt}`;
      const signature = crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("hex");
      const token = Buffer.from(`${payload}.${signature}`).toString("base64url");

      const resetUrl = `${config.public.siteUrl}/auth/password-reset?token=${token}`;

      // Send email via SendGrid
      if (config.sendgridApiKey) {
        const sgMail = await import("@sendgrid/mail");
        sgMail.default.setApiKey(config.sendgridApiKey);

        const displayName = user.first_name || email.split("@")[0];

        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
            <div style="background: linear-gradient(135deg, #141e30 0%, #243b55 100%); padding: 32px; border-radius: 16px 16px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 500; letter-spacing: 0.02em;">SJHAS, Inc.</h1>
              <p style="color: rgba(255,255,255,0.7); margin: 6px 0 0 0; font-size: 13px; letter-spacing: 0.04em;">Accounting &amp; Tax Services</p>
            </div>

            <div style="background: #ffffff; padding: 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 16px 16px;">
              <p style="color: #0f172a; font-size: 16px; font-weight: 500; margin: 0 0 8px 0;">
                Hi ${displayName},
              </p>

              <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
                We received a request to reset your password. Click the button below to choose a new password.
              </p>

              <div style="text-align: center; margin-bottom: 28px;">
                <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #243b55 0%, #1a2c43 100%); color: white; text-decoration: none; padding: 14px 36px; border-radius: 12px; font-size: 15px; font-weight: 500; letter-spacing: 0.02em;">
                  Reset Password
                </a>
              </div>

              <p style="color: #94a3b8; font-size: 13px; margin: 0 0 20px 0;">
                Or copy this link: <a href="${resetUrl}" style="color: #243b55;">${resetUrl}</a>
              </p>

              <p style="color: #94a3b8; font-size: 13px; margin: 0 0 4px 0;">
                This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
              </p>

              <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                  SJHAS, Inc. &middot; P.O. Box 6623, Ithaca, NY 14850
                </p>
              </div>
            </div>
          </body>
          </html>
        `;

        await sgMail.default.send({
          to: user.email,
          from: config.sendgridFromEmail,
          replyTo: config.notificationEmail,
          subject: "Reset Your Password — SJHAS, Inc.",
          html: htmlContent,
        });
      } else {
        console.error("SendGrid API key not configured — cannot send password reset email");
      }
    }

    // Always return success to avoid revealing if email exists
    return {
      success: true,
      message: "If that email exists, a password reset link has been sent",
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

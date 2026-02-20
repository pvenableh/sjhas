export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const { formId, recipientEmail, recipientName, message } = body

  if (!formId || !recipientEmail) {
    throw createError({
      statusCode: 400,
      message: 'Form ID and recipient email are required',
    })
  }

  // Fetch the form to get its details
  try {
    const formResponse = await fetch(
      `${config.directus.url}/items/forms/${formId}?fields=id,title,slug,description`,
      {
        headers: {
          Authorization: `Bearer ${config.directus.staticToken}`,
        },
      }
    )

    if (!formResponse.ok) {
      throw createError({ statusCode: 404, message: 'Form not found' })
    }

    const formResult = await formResponse.json()
    const form = formResult.data

    if (!form) {
      throw createError({ statusCode: 404, message: 'Form not found' })
    }

    // Build the form URL
    const siteUrl = config.public.siteUrl || 'http://localhost:3000'
    const formUrl = `${siteUrl}/f/${form.slug}`

    // Send the email
    if (!config.sendgridApiKey) {
      throw createError({ statusCode: 500, message: 'Email service not configured' })
    }

    const sgMail = await import('@sendgrid/mail')
    sgMail.default.setApiKey(config.sendgridApiKey)

    const displayName = recipientName || recipientEmail.split('@')[0]
    const customMessage = message
      ? `<p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">${message.replace(/\n/g, '<br>')}</p>`
      : ''

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
            We have a form ready for you to complete. Please click the button below to get started.
          </p>

          ${customMessage}

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
            <p style="color: #0f172a; font-size: 15px; font-weight: 500; margin: 0 0 4px 0;">${form.title}</p>
            ${form.description ? `<p style="color: #64748b; font-size: 14px; margin: 0;">${form.description}</p>` : ''}
          </div>

          <div style="text-align: center; margin-bottom: 28px;">
            <a href="${formUrl}" style="display: inline-block; background: linear-gradient(135deg, #243b55 0%, #1a2c43 100%); color: white; text-decoration: none; padding: 14px 36px; border-radius: 12px; font-size: 15px; font-weight: 500; letter-spacing: 0.02em;">
              Open Form
            </a>
          </div>

          <p style="color: #94a3b8; font-size: 13px; margin: 0;">
            Or copy this link: <a href="${formUrl}" style="color: #243b55;">${formUrl}</a>
          </p>

          <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              This email was sent by SJHAS, Inc. If you have questions, reply to this email or call (607) 216-8033.
            </p>
          </div>
        </div>
      </body>
      </html>
    `

    await sgMail.default.send({
      to: recipientEmail,
      from: config.sendgridFromEmail,
      replyTo: config.notificationEmail,
      subject: `Action Required: ${form.title} — SJHAS, Inc.`,
      html: htmlContent,
    })

    return { success: true, message: 'Email sent successfully' }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Send form email error:', error)
    throw createError({ statusCode: 500, message: 'Failed to send email' })
  }
})

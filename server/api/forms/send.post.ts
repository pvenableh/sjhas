import { formInvitationTemplate } from '../../utils/emails/templates/formInvitation'
import { renderTemplate } from '../../utils/emails/render'

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

    const displayName = recipientName || recipientEmail.split('@')[0] || recipientEmail
    const customMessage = message
      ? message.replace(/\n/g, '<br>')
      : ''
    const formDescription = form.description
      ? `<p style="color: #64748b; font-size: 14px; margin: 0;">${form.description}</p>`
      : ''

    const htmlContent = renderTemplate(formInvitationTemplate, {
      displayName,
      customMessage,
      formTitle: form.title,
      formDescription,
      formUrl,
    })

    await sgMail.default.send({
      to: recipientEmail,
      from: { email: config.sendgridFromEmail, name: 'SJH Accounting' },
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

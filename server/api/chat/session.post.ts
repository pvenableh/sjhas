// server/api/chat/session.post.ts
// Public endpoint to create a chat session (captures visitor info)

import { chatNotificationTemplate } from '../../utils/emails/templates/chatNotification'
import { renderTemplate } from '../../utils/emails/render'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const { name, email, phone, message } = body

  if (!name || !email) {
    throw createError({
      statusCode: 400,
      message: 'Name and email are required',
    })
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid email address',
    })
  }

  try {
    const directus = getTypedDirectus()

    // Create chat session
    const session = await directus.request(
      createItem('chat_sessions' as any, {
        visitor_name: name,
        visitor_email: email,
        visitor_phone: phone || null,
        status: 'active',
        last_message_at: new Date().toISOString(),
      })
    )

    // Create initial message if provided
    if (message) {
      await directus.request(
        createItem('chat_messages' as any, {
          session: (session as any).id,
          sender: 'visitor',
          message,
          read: false,
        })
      )
    }

    // Send email notification to Stephen
    try {
      await sendChatNotification(name, email, phone, message)
    } catch (emailError) {
      console.warn('[chat/session] Email notification failed:', emailError)
    }

    return {
      sessionId: (session as any).id,
      success: true,
    }
  } catch (error: any) {
    console.error('[chat/session] Error creating session:', error.message)
    throw createError({
      statusCode: 500,
      message: 'Failed to create chat session',
    })
  }
})

/**
 * Send email notification about new chat session
 */
async function sendChatNotification(
  name: string,
  email: string,
  phone: string | null,
  message: string | null
) {
  const config = useRuntimeConfig()

  if (!config.sendgridApiKey) return

  const sgMail = await import('@sendgrid/mail').then((m) => m.default)
  sgMail.setApiKey(config.sendgridApiKey)

  const phoneLine = phone
    ? `<p style="font-weight: 400; font-size: 13px; line-height: 1.6em; margin: 0; padding: 0;" class="avenir"><strong>Phone:</strong> <a href="tel:${phone}" style="color: rgba(255,255,255,0.8); text-decoration: underline;">${phone}</a></p>`
    : ''

  const messageSection = message
    ? `<div style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 16px 20px;"><p style="font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: rgba(255,255,255,0.5); margin: 0 0 6px 0; padding: 0;" class="avenir">Initial Message</p><p style="font-weight: 400; font-size: 13px; line-height: 1.6em; margin: 0; padding: 0;" class="avenir">${message}</p></div>`
    : ''

  const htmlContent = renderTemplate(chatNotificationTemplate, {
    visitorName: name,
    visitorEmail: email,
    phoneLine,
    messageSection,
  })

  await sgMail.send({
    to: config.notificationEmail,
    from: config.sendgridFromEmail,
    bcc: 'huestudios.com@gmail.com',
    subject: `New Chat Message from ${name}`,
    html: htmlContent,
  })
}

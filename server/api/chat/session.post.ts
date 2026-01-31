// server/api/chat/session.post.ts
// Public endpoint to create a chat session (captures visitor info)

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

  const phoneLine = phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''
  const messageLine = message ? `<p><strong>Message:</strong> ${message}</p>` : ''

  await sgMail.send({
    to: config.notificationEmail,
    from: config.sendgridFromEmail,
    subject: `New Chat Message from ${name}`,
    html: `
      <h2>New Chat Session</h2>
      <p>A visitor has started a chat on your website.</p>
      <hr>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      ${phoneLine}
      ${messageLine}
      <hr>
      <p>Log in to your admin panel to respond.</p>
    `,
  })
}

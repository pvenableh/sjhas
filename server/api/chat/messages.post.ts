// server/api/chat/messages.post.ts
// Public endpoint to send/receive chat messages

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { sessionId, message, sender, operation } = body

  if (!sessionId) {
    throw createError({
      statusCode: 400,
      message: 'Session ID is required',
    })
  }

  const directus = getTypedDirectus()

  try {
    // Send a new message
    if (operation === 'send') {
      if (!message) {
        throw createError({
          statusCode: 400,
          message: 'Message is required',
        })
      }

      const validSender = sender === 'admin' ? 'admin' : 'visitor'

      const newMessage = await directus.request(
        createItem('chat_messages' as any, {
          session: sessionId,
          sender: validSender,
          message,
          read: false,
        })
      )

      // Update session last_message_at
      await directus.request(
        updateItem('chat_sessions' as any, sessionId, {
          last_message_at: new Date().toISOString(),
        })
      )

      return newMessage
    }

    // Fetch messages for a session
    if (operation === 'list') {
      const messages = await directus.request(
        readItems('chat_messages' as any, {
          filter: { session: { _eq: sessionId } },
          sort: ['date_created'],
          fields: ['id', 'sender', 'message', 'date_created', 'read'],
        })
      )

      return messages
    }

    throw createError({
      statusCode: 400,
      message: 'Invalid operation. Use "send" or "list".',
    })
  } catch (error: any) {
    console.error('[chat/messages] Error:', error.message)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to process chat message',
    })
  }
})

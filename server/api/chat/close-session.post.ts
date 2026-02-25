// server/api/chat/close-session.post.ts
// Admin endpoint to close a chat session
// Directus WebSocket subscribers are notified automatically when session status changes

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      message: 'Authentication required',
    })
  }

  const body = await readBody(event)
  const { sessionId } = body

  if (!sessionId) {
    throw createError({
      statusCode: 400,
      message: 'sessionId is required',
    })
  }

  try {
    const directus = getTypedDirectus()

    await directus.request(
      updateItem('chat_sessions' as any, sessionId, {
        status: 'closed',
      })
    )

    return { success: true }
  } catch (error: any) {
    console.error('[chat/close-session] Error:', error.message)
    throw createError({
      statusCode: 500,
      message: 'Failed to close session',
    })
  }
})

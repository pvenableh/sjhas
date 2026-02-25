// server/api/chat/session.get.ts
// Public endpoint to validate if a chat session is still active
// Used by the visitor to restore a persisted session after page navigation

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const sessionId = Number(query.id)

  if (!sessionId) {
    throw createError({
      statusCode: 400,
      message: 'Session ID is required',
    })
  }

  try {
    const directus = getTypedDirectus()

    const session = await directus.request(
      readItem('chat_sessions' as any, sessionId, {
        fields: ['id', 'status', 'visitor_name', 'visitor_email'],
      })
    )

    if (!session) {
      throw createError({
        statusCode: 404,
        message: 'Session not found',
      })
    }

    return {
      valid: (session as any).status === 'active',
      sessionId: (session as any).id,
      status: (session as any).status,
    }
  } catch (error: any) {
    if (error.statusCode === 404) throw error

    console.error('[chat/session] Error validating session:', error.message)
    throw createError({
      statusCode: 500,
      message: 'Failed to validate session',
    })
  }
})

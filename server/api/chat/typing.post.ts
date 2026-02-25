// server/api/chat/typing.post.ts

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { sessionId, sender, isTyping } = body

  if (!sessionId || !sender) {
    throw createError({
      statusCode: 400,
      message: 'sessionId and sender are required',
    })
  }

  const field = sender === 'admin' ? 'admin_typing_at' : 'visitor_typing_at'
  const value = isTyping ? new Date().toISOString() : null

  try {
    const directus = getTypedDirectus()
    await directus.request(
      updateItem('chat_sessions' as any, sessionId, {
        [field]: value,
      })
    )
    return { success: true }
  } catch (error: any) {
    console.warn('[chat/typing] Failed to update:', error.message)
    return { success: false }
  }
})

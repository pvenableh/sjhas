// server/api/chat/status.post.ts
// Admin endpoint to toggle online/offline status
// Requires authentication (admin user)
// Falls back to Nitro storage if Directus chat_settings collection is unavailable
// Broadcasts status change to all connected WebSocket clients via shared chatBroadcast utility

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      message: 'Authentication required',
    })
  }

  const body = await readBody(event)
  const { online } = body

  if (typeof online !== 'boolean') {
    throw createError({
      statusCode: 400,
      message: 'online (boolean) is required',
    })
  }

  // Try Directus first, fall back to Nitro storage
  // chat_settings is a singleton — use updateSingleton (no create/ID needed)
  try {
    const directus = getTypedDirectus()

    await directus.request(
      updateSingleton('chat_settings' as any, {
        admin_online: online,
      })
    )

    // Broadcast status change to all connected WS clients
    broadcastStatusChange(online)

    return { success: true, online }
  } catch (directusError: any) {
    // Directus collection may not exist — use Nitro storage as fallback
    console.warn('[chat/status] Directus unavailable, using storage fallback:', directusError.message)

    try {
      const storage = useStorage('data')
      const current = await storage.getItem<Record<string, any>>('chat_settings') || {}
      await storage.setItem('chat_settings', {
        ...current,
        admin_online: online,
        welcome_message: current.welcome_message || 'Hi! How can we help you today?',
        offline_message: current.offline_message || "Stephen is currently offline. Please leave your contact info and we'll get back to you shortly!",
      })

      // Broadcast status change to all connected WS clients
      broadcastStatusChange(online)

      return { success: true, online }
    } catch (storageError: any) {
      console.error('[chat/status] Storage fallback also failed:', storageError.message)
      throw createError({
        statusCode: 500,
        message: 'Failed to update chat status',
      })
    }
  }
})

// server/api/chat/status.post.ts
// Admin endpoint to toggle online/offline status
// Requires authentication (admin user)

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

  try {
    const directus = getTypedDirectus()

    // Try to read existing settings
    const existing = await directus.request(
      readItems('chat_settings' as any, { limit: 1 })
    )

    const settings = Array.isArray(existing) ? existing[0] : existing

    if (settings?.id) {
      // Update existing
      await directus.request(
        updateItem('chat_settings' as any, settings.id, {
          admin_online: online,
        })
      )
    } else {
      // Create new settings record
      await directus.request(
        createItem('chat_settings' as any, {
          admin_online: online,
          welcome_message: 'Hi! How can we help you today?',
          offline_message: "Stephen is currently offline. Please leave your contact info and we'll get back to you shortly!",
        })
      )
    }

    return { success: true, online }
  } catch (error: any) {
    console.error('[chat/status] Error updating status:', error.message)
    throw createError({
      statusCode: 500,
      message: 'Failed to update chat status',
    })
  }
})

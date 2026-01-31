// server/api/chat/status.get.ts
// Public endpoint to check if admin (Stephen) is online

export default defineEventHandler(async () => {
  try {
    const directus = getTypedDirectus()

    // Try to read chat_settings singleton
    const settings = await directus.request(
      readItems('chat_settings' as any, {
        limit: 1,
      })
    )

    const chatSettings = Array.isArray(settings) ? settings[0] : settings

    return {
      online: chatSettings?.admin_online ?? false,
      welcomeMessage: chatSettings?.welcome_message ?? 'Hi! How can we help you today?',
      offlineMessage: chatSettings?.offline_message ?? "Stephen is currently offline. Please leave your contact info and we'll get back to you shortly!",
    }
  } catch (error: any) {
    // If collection doesn't exist yet, default to offline
    console.warn('[chat/status] Could not fetch chat settings:', error.message)
    return {
      online: false,
      welcomeMessage: 'Hi! How can we help you today?',
      offlineMessage: "Stephen is currently offline. Please leave your contact info and we'll get back to you shortly!",
    }
  }
})

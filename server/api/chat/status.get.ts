// server/api/chat/status.get.ts
// Public endpoint to check if admin (Stephen) is online
// Falls back to Nitro storage if Directus chat_settings collection is unavailable

export default defineEventHandler(async () => {
  const defaults = {
    online: false,
    welcomeMessage: 'Hi! How can we help you today?',
    offlineMessage: "Stephen is currently offline. Please leave your contact info and we'll get back to you shortly!",
  }

  // Try Directus first
  try {
    const directus = getTypedDirectus()

    const settings = await directus.request(
      readItems('chat_settings' as any, {
        limit: 1,
      })
    )

    const chatSettings = Array.isArray(settings) ? settings[0] : settings

    return {
      online: chatSettings?.admin_online ?? defaults.online,
      welcomeMessage: chatSettings?.welcome_message ?? defaults.welcomeMessage,
      offlineMessage: chatSettings?.offline_message ?? defaults.offlineMessage,
    }
  } catch {
    // Directus collection may not exist — try Nitro storage fallback
    try {
      const storage = useStorage('data')
      const stored = await storage.getItem<Record<string, any>>('chat_settings')

      if (stored) {
        return {
          online: stored.admin_online ?? defaults.online,
          welcomeMessage: stored.welcome_message ?? defaults.welcomeMessage,
          offlineMessage: stored.offline_message ?? defaults.offlineMessage,
        }
      }
    } catch {
      // Storage also unavailable
    }

    return defaults
  }
})

// server/api/chat/status.get.ts
// Public endpoint to check if admin (Stephen) is online
// Falls back to Nitro storage if Directus chat_settings collection is unavailable

export default defineEventHandler(async () => {
  const defaults = {
    online: false,
    welcomeMessage: 'Hi! How can we help you today?',
    offlineMessage: "Stephen is currently offline. Please leave your contact info and we'll get back to you shortly!",
  }

  // Try Directus first (chat_settings is a singleton)
  try {
    const directus = getTypedDirectus()

    const chatSettings = await directus.request(
      readSingleton('chat_settings' as any)
    )

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

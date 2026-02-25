// server/api/chat/poll.post.ts

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { sessionId, since, role } = body

  const directus = getTypedDirectus()
  const result: Record<string, any> = {}

  // 1. Admin online/offline status
  try {
    const chatSettings = await directus.request(
      readSingleton('chat_settings' as any)
    )
    result.online = chatSettings?.admin_online ?? false
    result.welcomeMessage = chatSettings?.welcome_message || 'Hi! How can we help you today?'
    result.offlineMessage = chatSettings?.offline_message || "Stephen is currently offline. Please leave your contact info and we'll get back to you shortly!"
  } catch {
    try {
      const storage = useStorage('data')
      const stored = await storage.getItem<Record<string, any>>('chat_settings')
      result.online = stored?.admin_online ?? false
      result.welcomeMessage = stored?.welcome_message || 'Hi! How can we help you today?'
      result.offlineMessage = stored?.offline_message || "Stephen is currently offline. Please leave your contact info and we'll get back to you shortly!"
    } catch {
      result.online = false
      result.welcomeMessage = 'Hi! How can we help you today?'
      result.offlineMessage = "Stephen is currently offline. Please leave your contact info and we'll get back to you shortly!"
    }
  }

  // 2. Session-specific data
  if (sessionId) {
    try {
      const session = await directus.request(
        readItem('chat_sessions' as any, sessionId, {
          fields: ['id', 'status', 'admin_typing_at', 'visitor_typing_at'],
        })
      ) as any

      result.sessionStatus = session?.status || 'active'

      const now = Date.now()
      if (role === 'visitor') {
        const at = session?.admin_typing_at ? new Date(session.admin_typing_at).getTime() : 0
        result.otherTyping = (now - at) < 4000
      } else {
        const at = session?.visitor_typing_at ? new Date(session.visitor_typing_at).getTime() : 0
        result.otherTyping = (now - at) < 4000
      }

      const filter: any = { session: { _eq: sessionId } }
      if (since) {
        filter.date_created = { _gt: since }
      }

      result.messages = await directus.request(
        readItems('chat_messages' as any, {
          filter,
          sort: ['date_created'],
          fields: ['id', 'sender', 'message', 'date_created', 'read'],
        })
      )
    } catch (error: any) {
      console.error('[chat/poll] Error:', error.message)
      result.messages = []
      result.sessionStatus = 'unknown'
      result.otherTyping = false
    }
  }

  return result
})

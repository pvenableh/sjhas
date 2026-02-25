// composables/useAdminChatRealtime.ts
import { createDirectus, realtime, authentication } from '@directus/sdk'

interface ChatMessage {
  id: number
  sender: 'visitor' | 'admin'
  message: string
  date_created: string
  read: boolean
}

type NewMessageHandler = (message: ChatMessage) => void

export function useAdminChatRealtime() {
  const config = useRuntimeConfig()

  const isConnected = ref(false)
  const visitorTyping = ref(false)
  const messages = ref<ChatMessage[]>([])
  const connectionMode = ref<'ws' | 'poll' | 'none'>('none')

  let client: any = null
  let currentSessionId: number | null = null
  let lastMessageTimestamp: string | null = null
  let typingDebounce: ReturnType<typeof setTimeout> | null = null
  let typingClearTimer: ReturnType<typeof setTimeout> | null = null
  let pollTimer: ReturnType<typeof setInterval> | null = null

  const newMessageCbs: NewMessageHandler[] = []

  function getWsUrl(): string {
    const publicWsUrl = (config.public.directus as any).websocketUrl
    if (publicWsUrl) return publicWsUrl
    const baseUrl = config.public.directus.url
    const protocol = baseUrl.startsWith('https') ? 'wss://' : 'ws://'
    const host = baseUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
    return `${protocol}${host}/websocket`
  }

  async function connect(sessionId: number) {
    if (currentSessionId !== sessionId) {
      messages.value = []
      lastMessageTimestamp = null
      visitorTyping.value = false
    }
    currentSessionId = sessionId

    if (isConnected.value && connectionMode.value === 'ws') {
      await subscribeMessages(sessionId)
      await subscribeSession(sessionId)
      return
    }

    try {
      await connectWebSocket()
      connectionMode.value = 'ws'
      await subscribeMessages(sessionId)
      await subscribeSession(sessionId)
    } catch (err: any) {
      console.warn('[admin-chat-rt] WS failed, using polling:', err.message)
      connectionMode.value = 'poll'
      startPolling()
    }
  }

  async function connectWebSocket() {
    const wsUrl = getWsUrl()
    const { token } = await $fetch<{ token: string }>('/api/websocket/token')

    if (!token) {
      throw new Error('No access token available')
    }

    client = createDirectus(wsUrl)
      .with(realtime())
      .with(authentication('json'))

    await Promise.race([
      client.connect(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout')), 5000)
      ),
    ])

    await client.sendMessage({ type: 'auth', access_token: token })

    isConnected.value = true

    client.onWebSocket('close', () => {
      isConnected.value = false
      if (connectionMode.value === 'ws' && currentSessionId) {
        connectionMode.value = 'poll'
        startPolling()
      }
    })
  }

  async function subscribeMessages(sessionId: number) {
    if (!client || !isConnected.value) return

    try {
      const { subscription } = await client.subscribe('chat_messages', {
        query: {
          fields: ['id', 'sender', 'message', 'date_created', 'read'],
          filter: { session: { _eq: sessionId } },
          sort: ['date_created'],
        },
      })

      ;(async () => {
        try {
          for await (const event of subscription) {
            if (event.event === 'init') {
              messages.value = event.data || []
            } else if (event.event === 'create') {
              const newMsgs = Array.isArray(event.data) ? event.data : [event.data]
              for (const msg of newMsgs) {
                if (!msg) continue
                const exists = messages.value.some(m => m.id === msg.id)
                if (!exists) {
                  messages.value = [...messages.value, msg]
                  newMessageCbs.forEach(cb => cb(msg))
                }
              }
            }
          }
        } catch {}
      })()
    } catch (err: any) {
      console.warn('[admin-chat-rt] Messages subscription error:', err.message)
    }
  }

  async function subscribeSession(sessionId: number) {
    if (!client || !isConnected.value) return

    try {
      const { subscription } = await client.subscribe('chat_sessions', {
        query: {
          fields: ['id', 'visitor_typing_at'],
          filter: { id: { _eq: sessionId } },
        },
      })

      ;(async () => {
        try {
          for await (const event of subscription) {
            if (event.event === 'update') {
              const data = Array.isArray(event.data) ? event.data[0] : event.data
              if (!data) continue

              if ('visitor_typing_at' in data) {
                const typingAt = data.visitor_typing_at
                  ? new Date(data.visitor_typing_at).getTime()
                  : 0
                visitorTyping.value = (Date.now() - typingAt) < 4000

                if (typingClearTimer) clearTimeout(typingClearTimer)
                if (visitorTyping.value) {
                  typingClearTimer = setTimeout(() => {
                    visitorTyping.value = false
                  }, 4000)
                }
              }
            }
          }
        } catch {}
      })()
    } catch (err: any) {
      console.warn('[admin-chat-rt] Session subscription error:', err.message)
    }
  }

  function startPolling() {
    if (pollTimer) return
    isConnected.value = true
    doPoll()
    pollTimer = setInterval(doPoll, 2500)
  }

  function stopPolling() {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
  }

  async function doPoll() {
    if (!currentSessionId) return

    try {
      const body: Record<string, any> = {
        sessionId: currentSessionId,
        role: 'admin',
      }
      if (lastMessageTimestamp) body.since = lastMessageTimestamp

      const result = await $fetch('/api/chat/poll', { method: 'POST', body }) as any

      visitorTyping.value = !!result.otherTyping

      if (result.messages?.length > 0) {
        if (lastMessageTimestamp) {
          const newMsgs = (result.messages as ChatMessage[]).filter(
            m => !messages.value.some(e => e.id === m.id)
          )
          if (newMsgs.length > 0) {
            messages.value = [...messages.value, ...newMsgs]
            newMsgs.forEach(m => newMessageCbs.forEach(cb => cb(m)))
          }
        } else {
          messages.value = result.messages
        }
        const lastMsg = result.messages[result.messages.length - 1]
        if (lastMsg) lastMessageTimestamp = lastMsg.date_created
      }
    } catch {}
  }

  function sendTyping(isTyping: boolean) {
    if (!currentSessionId) return

    if (isTyping) {
      if (!typingDebounce) {
        $fetch('/api/chat/typing', {
          method: 'POST',
          body: { sessionId: currentSessionId, sender: 'admin', isTyping: true },
        }).catch(() => {})
      }
      if (typingDebounce) clearTimeout(typingDebounce)
      typingDebounce = setTimeout(() => {
        $fetch('/api/chat/typing', {
          method: 'POST',
          body: { sessionId: currentSessionId, sender: 'admin', isTyping: false },
        }).catch(() => {})
        typingDebounce = null
      }, 1500)
    } else {
      if (typingDebounce) { clearTimeout(typingDebounce); typingDebounce = null }
      $fetch('/api/chat/typing', {
        method: 'POST',
        body: { sessionId: currentSessionId, sender: 'admin', isTyping: false },
      }).catch(() => {})
    }
  }

  function disconnect() {
    stopPolling()
    if (typingDebounce) clearTimeout(typingDebounce)
    if (typingClearTimer) clearTimeout(typingClearTimer)
    if (client) {
      try { client.disconnect() } catch {}
      client = null
    }
    isConnected.value = false
    connectionMode.value = 'none'
    currentSessionId = null
  }

  function onNewMessage(cb: NewMessageHandler) { newMessageCbs.push(cb) }

  return {
    visitorTyping: readonly(visitorTyping),
    messages: readonly(messages),
    isConnected: readonly(isConnected),
    connectionMode: readonly(connectionMode),
    connect,
    disconnect,
    sendTyping,
    onNewMessage,
  }
}

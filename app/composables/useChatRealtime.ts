// composables/useChatRealtime.ts
import { createDirectus, realtime } from '@directus/sdk'

interface ChatMessage {
  id: number
  sender: 'visitor' | 'admin'
  message: string
  date_created: string
  read: boolean
  session?: number
}

type NewMessageHandler = (message: ChatMessage) => void
type StatusChangeHandler = (online: boolean) => void
type SessionClosedHandler = () => void

export function useChatRealtime() {
  const config = useRuntimeConfig()

  const isConnected = ref(false)
  const isConnecting = ref(false)
  const adminOnline = ref(false)
  const adminTyping = ref(false)
  const messages = ref<ChatMessage[]>([])
  const connectionMode = ref<'ws' | 'poll' | 'none'>('none')
  const connectionError = ref<string | null>(null)

  let client: any = null
  let currentSessionId: number | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let reconnectAttempts = 0
  const maxReconnectAttempts = 8
  let typingDebounce: ReturnType<typeof setTimeout> | null = null
  let typingClearTimer: ReturnType<typeof setTimeout> | null = null

  let pollTimer: ReturnType<typeof setInterval> | null = null
  let lastMessageTimestamp: string | null = null
  let lastOnlineState: boolean | null = null

  const newMessageCbs: NewMessageHandler[] = []
  const statusChangeCbs: StatusChangeHandler[] = []
  const sessionClosedCbs: SessionClosedHandler[] = []

  function getWsUrl(): string {
    const publicWsUrl = (config.public.directus as any).websocketUrl
    if (publicWsUrl) return publicWsUrl
    const baseUrl = config.public.directus.url
    const protocol = baseUrl.startsWith('https') ? 'wss://' : 'ws://'
    const host = baseUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
    return `${protocol}${host}/websocket`
  }

  // ═══ CONNECT — tries WebSocket first, falls back to polling ═══

  async function connect() {
    if (isConnected.value || isConnecting.value) return
    isConnecting.value = true
    connectionError.value = null

    try {
      await connectWebSocket()
      connectionMode.value = 'ws'
      console.log('[chat-rt] Connected via Directus WebSocket')
    } catch (err: any) {
      console.warn('[chat-rt] WebSocket failed, falling back to polling:', err.message)
      connectionMode.value = 'poll'
      startPolling()
    } finally {
      isConnecting.value = false
    }
  }

  async function connectWebSocket() {
    const wsUrl = getWsUrl()
    client = createDirectus(wsUrl).with(realtime())

    await Promise.race([
      client.connect(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('WebSocket connection timeout')), 5000)
      ),
    ])

    isConnected.value = true
    reconnectAttempts = 0

    await subscribeStatus()

    client.onWebSocket('close', () => {
      isConnected.value = false
      if (connectionMode.value === 'ws') {
        attemptReconnect()
      }
    })

    client.onWebSocket('error', () => {
      isConnected.value = false
    })
  }

  async function subscribeStatus() {
    if (!client) return

    try {
      const { subscription } = await client.subscribe('chat_settings', {
        query: {
          fields: ['admin_online', 'welcome_message', 'offline_message'],
        },
      })

      ;(async () => {
        try {
          for await (const event of subscription) {
            if (event.event === 'init') {
              const items = event.data || []
              if (items.length > 0) {
                adminOnline.value = !!items[0].admin_online
              }
            } else if (event.event === 'update') {
              const data = Array.isArray(event.data) ? event.data[0] : event.data
              if (data && 'admin_online' in data) {
                const prev = adminOnline.value
                adminOnline.value = !!data.admin_online
                if (prev !== adminOnline.value) {
                  statusChangeCbs.forEach(cb => cb(adminOnline.value))
                }
              }
            }
          }
        } catch {
          // Iterator ended (disconnected)
        }
      })()
    } catch (err: any) {
      console.warn('[chat-rt] Status subscription error:', err.message)
    }
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
      console.warn('[chat-rt] Messages subscription error:', err.message)
    }
  }

  async function subscribeSession(sessionId: number) {
    if (!client || !isConnected.value) return

    try {
      const { subscription } = await client.subscribe('chat_sessions', {
        query: {
          fields: ['id', 'status', 'admin_typing_at'],
          filter: { id: { _eq: sessionId } },
        },
      })

      ;(async () => {
        try {
          for await (const event of subscription) {
            if (event.event === 'update') {
              const data = Array.isArray(event.data) ? event.data[0] : event.data
              if (!data) continue

              if ('admin_typing_at' in data) {
                const typingAt = data.admin_typing_at
                  ? new Date(data.admin_typing_at).getTime()
                  : 0
                adminTyping.value = (Date.now() - typingAt) < 4000

                if (typingClearTimer) clearTimeout(typingClearTimer)
                if (adminTyping.value) {
                  typingClearTimer = setTimeout(() => {
                    adminTyping.value = false
                  }, 4000)
                }
              }

              if (data.status === 'closed') {
                sessionClosedCbs.forEach(cb => cb())
              }
            }
          }
        } catch {}
      })()
    } catch (err: any) {
      console.warn('[chat-rt] Session subscription error:', err.message)
    }
  }

  function attemptReconnect() {
    if (reconnectAttempts >= maxReconnectAttempts) {
      console.warn('[chat-rt] Max reconnect attempts reached, switching to polling')
      connectionMode.value = 'poll'
      startPolling()
      return
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 15000)
    reconnectAttempts++

    reconnectTimer = setTimeout(async () => {
      try {
        await connectWebSocket()
        if (currentSessionId) {
          await subscribeMessages(currentSessionId)
          await subscribeSession(currentSessionId)
        }
      } catch {
        attemptReconnect()
      }
    }, delay)
  }

  // ═══ Polling fallback ═══

  function startPolling() {
    if (pollTimer) return
    isConnected.value = true
    doPoll()
    const interval = currentSessionId ? 2500 : 8000
    pollTimer = setInterval(doPoll, interval)
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  function restartPolling() {
    stopPolling()
    if (connectionMode.value === 'poll') {
      startPolling()
    }
  }

  async function doPoll() {
    try {
      const body: Record<string, any> = { role: 'visitor' }
      if (currentSessionId) {
        body.sessionId = currentSessionId
        if (lastMessageTimestamp) body.since = lastMessageTimestamp
      }

      const result = await $fetch('/api/chat/poll', {
        method: 'POST',
        body,
      }) as any

      const newOnline = !!result.online
      if (lastOnlineState !== null && lastOnlineState !== newOnline) {
        statusChangeCbs.forEach(cb => cb(newOnline))
      }
      lastOnlineState = newOnline
      adminOnline.value = newOnline

      if (currentSessionId) {
        adminTyping.value = !!result.otherTyping

        if (result.sessionStatus === 'closed') {
          sessionClosedCbs.forEach(cb => cb())
        }

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
      }
    } catch {}
  }

  // ═══ PUBLIC API ═══

  async function joinSession(sessionId: number) {
    currentSessionId = sessionId
    lastMessageTimestamp = null

    if (connectionMode.value === 'ws' && client && isConnected.value) {
      await subscribeMessages(sessionId)
      await subscribeSession(sessionId)
    } else if (connectionMode.value === 'poll') {
      restartPolling()
    }
  }

  function leaveSession() {
    currentSessionId = null
    messages.value = []
    lastMessageTimestamp = null
    adminTyping.value = false
    if (connectionMode.value === 'poll') {
      restartPolling()
    }
  }

  function sendTyping(isTyping: boolean) {
    if (!currentSessionId) return

    if (isTyping) {
      if (!typingDebounce) {
        $fetch('/api/chat/typing', {
          method: 'POST',
          body: { sessionId: currentSessionId, sender: 'visitor', isTyping: true },
        }).catch(() => {})
      }
      if (typingDebounce) clearTimeout(typingDebounce)
      typingDebounce = setTimeout(() => {
        $fetch('/api/chat/typing', {
          method: 'POST',
          body: { sessionId: currentSessionId, sender: 'visitor', isTyping: false },
        }).catch(() => {})
        typingDebounce = null
      }, 1500)
    } else {
      if (typingDebounce) {
        clearTimeout(typingDebounce)
        typingDebounce = null
      }
      $fetch('/api/chat/typing', {
        method: 'POST',
        body: { sessionId: currentSessionId, sender: 'visitor', isTyping: false },
      }).catch(() => {})
    }
  }

  function disconnect() {
    stopPolling()
    if (reconnectTimer) clearTimeout(reconnectTimer)
    if (typingDebounce) clearTimeout(typingDebounce)
    if (typingClearTimer) clearTimeout(typingClearTimer)

    if (client) {
      try { client.disconnect() } catch {}
      client = null
    }

    isConnected.value = false
    connectionMode.value = 'none'
  }

  function onNewMessage(cb: NewMessageHandler) { newMessageCbs.push(cb) }
  function onStatusChange(cb: StatusChangeHandler) { statusChangeCbs.push(cb) }
  function onSessionClosed(cb: SessionClosedHandler) { sessionClosedCbs.push(cb) }

  return {
    isConnected: readonly(isConnected),
    adminOnline: readonly(adminOnline),
    adminTyping: readonly(adminTyping),
    messages: readonly(messages),
    connectionMode: readonly(connectionMode),
    connect,
    joinSession,
    leaveSession,
    sendTyping,
    disconnect,
    onNewMessage,
    onStatusChange,
    onSessionClosed,
  }
}

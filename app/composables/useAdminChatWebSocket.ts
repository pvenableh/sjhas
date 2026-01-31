// composables/useAdminChatWebSocket.ts
/**
 * useAdminChatWebSocket - Admin-side real-time chat via Nitro WebSocket
 *
 * Same WebSocket endpoint as the visitor composable, but sends messages
 * as 'admin' and supports switching between sessions.
 */

interface ChatMessage {
  id: number
  sender: 'visitor' | 'admin'
  message: string
  date_created: string
  read: boolean
}

type NewMessageHandler = (message: ChatMessage) => void

export function useAdminChatWebSocket() {
  const isConnected = ref(false)
  const isConnecting = ref(false)
  const visitorTyping = ref(false)
  const messages = ref<ChatMessage[]>([])
  const connectionError = ref<string | null>(null)

  let ws: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let reconnectAttempts = 0
  const maxReconnectAttempts = 10
  let currentSessionId: number | null = null
  let typingTimeout: ReturnType<typeof setTimeout> | null = null
  let adminTypingDebounce: ReturnType<typeof setTimeout> | null = null

  const onNewMessageCallbacks: NewMessageHandler[] = []

  function getWsUrl() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}/_ws/chat`
  }

  function connect(sessionId: number) {
    // If already connected to a different session, switch
    if (currentSessionId !== null && currentSessionId !== sessionId && ws?.readyState === WebSocket.OPEN) {
      currentSessionId = sessionId
      messages.value = []
      visitorTyping.value = false
      ws.send(JSON.stringify({ type: 'join', sessionId }))
      return
    }

    if (isConnected.value || isConnecting.value) return
    currentSessionId = sessionId
    isConnecting.value = true
    connectionError.value = null

    try {
      ws = new WebSocket(getWsUrl())

      ws.onopen = () => {
        isConnected.value = true
        isConnecting.value = false
        reconnectAttempts = 0
        connectionError.value = null
        ws!.send(JSON.stringify({ type: 'join', sessionId }))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          handleServerMessage(data)
        } catch {
          // Invalid JSON
        }
      }

      ws.onclose = () => {
        isConnected.value = false
        isConnecting.value = false
        attemptReconnect()
      }

      ws.onerror = () => {
        connectionError.value = 'Connection error'
        isConnected.value = false
        isConnecting.value = false
      }
    } catch (error: any) {
      isConnecting.value = false
      connectionError.value = error.message || 'Failed to connect'
    }
  }

  function handleServerMessage(data: any) {
    switch (data.type) {
      case 'messages':
        messages.value = data.messages || []
        break

      case 'new_message':
        if (data.message) {
          const exists = messages.value.some((m) => m.id === data.message.id)
          if (!exists) {
            messages.value = [...messages.value, data.message]
          }
          onNewMessageCallbacks.forEach((cb) => cb(data.message))
        }
        break

      case 'typing':
        if (data.sender === 'visitor') {
          visitorTyping.value = data.isTyping
          if (typingTimeout) clearTimeout(typingTimeout)
          if (data.isTyping) {
            typingTimeout = setTimeout(() => {
              visitorTyping.value = false
            }, 3000)
          }
        }
        break

      case 'error':
        console.error('[admin-chat-ws] Server error:', data.message)
        break
    }
  }

  function sendMessage(message: string) {
    if (!ws || ws.readyState !== WebSocket.OPEN || !currentSessionId) return

    ws.send(JSON.stringify({
      type: 'message',
      sessionId: currentSessionId,
      sender: 'admin',
      message,
    }))
  }

  function sendTyping(isTyping: boolean) {
    if (!ws || ws.readyState !== WebSocket.OPEN || !currentSessionId) return

    if (isTyping) {
      if (!adminTypingDebounce) {
        ws.send(JSON.stringify({
          type: 'typing',
          sessionId: currentSessionId,
          sender: 'admin',
          isTyping: true,
        }))
      }
      if (adminTypingDebounce) clearTimeout(adminTypingDebounce)
      adminTypingDebounce = setTimeout(() => {
        ws?.send(JSON.stringify({
          type: 'typing',
          sessionId: currentSessionId,
          sender: 'admin',
          isTyping: false,
        }))
        adminTypingDebounce = null
      }, 1200)
    } else {
      if (adminTypingDebounce) {
        clearTimeout(adminTypingDebounce)
        adminTypingDebounce = null
      }
      ws.send(JSON.stringify({
        type: 'typing',
        sessionId: currentSessionId,
        sender: 'admin',
        isTyping: false,
      }))
    }
  }

  function onNewMessage(callback: NewMessageHandler) {
    onNewMessageCallbacks.push(callback)
  }

  function attemptReconnect() {
    if (reconnectAttempts >= maxReconnectAttempts || !currentSessionId) return
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 15000)
    reconnectAttempts++
    reconnectTimer = setTimeout(() => {
      if (currentSessionId) connect(currentSessionId)
    }, delay)
  }

  function disconnect() {
    if (reconnectTimer) clearTimeout(reconnectTimer)
    if (typingTimeout) clearTimeout(typingTimeout)
    if (adminTypingDebounce) clearTimeout(adminTypingDebounce)
    reconnectAttempts = maxReconnectAttempts
    if (ws) {
      ws.close()
      ws = null
    }
    isConnected.value = false
    isConnecting.value = false
    currentSessionId = null
  }

  onUnmounted(() => {
    disconnect()
  })

  return {
    isConnected: readonly(isConnected),
    isConnecting: readonly(isConnecting),
    connectionError: readonly(connectionError),
    messages: readonly(messages),
    visitorTyping: readonly(visitorTyping),

    connect,
    disconnect,
    sendMessage,
    sendTyping,
    onNewMessage,
  }
}

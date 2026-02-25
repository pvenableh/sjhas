// composables/useChatWebSocket.ts
/**
 * useChatWebSocket - Real-time chat via Nitro WebSocket
 *
 * Connects to the server-side WebSocket handler which relays
 * Directus messages. Supports typing indicators and live status updates.
 *
 * Usage:
 * const { connect, sendMessage, messages, adminTyping, adminOnline, isConnected } = useChatWebSocket()
 */

interface ChatMessage {
  id: number
  sender: 'visitor' | 'admin'
  message: string
  date_created: string
  read: boolean
}

type NewMessageHandler = (message: ChatMessage) => void
type StatusChangeHandler = (online: boolean) => void
type SessionClosedHandler = () => void

export function useChatWebSocket() {
  const isConnected = ref(false)
  const isConnecting = ref(false)
  const adminTyping = ref(false)
  const adminOnline = ref<boolean | null>(null)
  const messages = ref<ChatMessage[]>([])
  const connectionError = ref<string | null>(null)

  let ws: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let reconnectAttempts = 0
  const maxReconnectAttempts = 10
  let currentSessionId: number | null = null
  let typingTimeout: ReturnType<typeof setTimeout> | null = null
  let visitorTypingDebounce: ReturnType<typeof setTimeout> | null = null

  // Custom event handlers
  const onNewMessageCallbacks: NewMessageHandler[] = []
  const onStatusChangeCallbacks: StatusChangeHandler[] = []
  const onSessionClosedCallbacks: SessionClosedHandler[] = []

  function getWsUrl() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}/_ws/chat`
  }

  /**
   * Connect to the chat WebSocket.
   * If sessionId is provided, joins the session for messaging.
   * If no sessionId, connects for status updates only.
   */
  function connect(sessionId?: number) {
    if (isConnected.value || isConnecting.value) return
    currentSessionId = sessionId ?? null
    isConnecting.value = true
    connectionError.value = null

    try {
      ws = new WebSocket(getWsUrl())

      ws.onopen = () => {
        isConnected.value = true
        isConnecting.value = false
        reconnectAttempts = 0
        connectionError.value = null

        // Check currentSessionId at open time (may have been set by joinSession
        // while the WS handshake was in progress)
        if (currentSessionId) {
          ws!.send(JSON.stringify({
            type: 'join',
            sessionId: currentSessionId,
          }))
        } else {
          // Subscribe to status updates only
          ws!.send(JSON.stringify({
            type: 'subscribe_status',
          }))
        }
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          handleServerMessage(data)
        } catch {
          console.error('[chat-ws] Invalid message from server')
        }
      }

      ws.onclose = () => {
        isConnected.value = false
        isConnecting.value = false
        attemptReconnect()
      }

      ws.onerror = (error) => {
        console.error('[chat-ws] WebSocket error:', error)
        connectionError.value = 'Connection error'
        isConnected.value = false
        isConnecting.value = false
      }
    } catch (error: any) {
      isConnecting.value = false
      connectionError.value = error.message || 'Failed to connect'
    }
  }

  /**
   * Join a session on an already-connected WebSocket
   */
  function joinSession(sessionId: number) {
    currentSessionId = sessionId
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'join',
        sessionId,
      }))
    }
  }

  function handleServerMessage(data: any) {
    switch (data.type) {
      case 'messages':
        // Full message list from server
        messages.value = data.messages || []
        break

      case 'new_message':
        // A single new message
        if (data.message) {
          // Avoid duplicates
          const exists = messages.value.some((m) => m.id === data.message.id)
          if (!exists) {
            messages.value = [...messages.value, data.message]
          }
          // Notify handlers
          onNewMessageCallbacks.forEach((cb) => cb(data.message))
        }
        break

      case 'typing':
        if (data.sender === 'admin') {
          adminTyping.value = data.isTyping
          // Auto-clear typing after 3s if no update
          if (typingTimeout) clearTimeout(typingTimeout)
          if (data.isTyping) {
            typingTimeout = setTimeout(() => {
              adminTyping.value = false
            }, 3000)
          }
        }
        break

      case 'status_change':
        // Admin online/offline status changed
        adminOnline.value = !!data.online
        onStatusChangeCallbacks.forEach((cb) => cb(!!data.online))
        break

      case 'session_closed':
        // Admin closed this chat session
        onSessionClosedCallbacks.forEach((cb) => cb())
        break

      case 'error':
        console.error('[chat-ws] Server error:', data.message)
        break
    }
  }

  /**
   * Send a chat message
   */
  function sendMessage(message: string) {
    if (!ws || ws.readyState !== WebSocket.OPEN || !currentSessionId) return

    ws.send(JSON.stringify({
      type: 'message',
      sessionId: currentSessionId,
      sender: 'visitor',
      message,
    }))
  }

  /**
   * Notify server that visitor is typing (debounced)
   */
  function sendTyping(isTyping: boolean) {
    if (!ws || ws.readyState !== WebSocket.OPEN || !currentSessionId) return

    // Debounce: only send "typing" once, then "stopped" after 1s of inactivity
    if (isTyping) {
      if (!visitorTypingDebounce) {
        ws.send(JSON.stringify({
          type: 'typing',
          sessionId: currentSessionId,
          sender: 'visitor',
          isTyping: true,
        }))
      }
      if (visitorTypingDebounce) clearTimeout(visitorTypingDebounce)
      visitorTypingDebounce = setTimeout(() => {
        ws?.send(JSON.stringify({
          type: 'typing',
          sessionId: currentSessionId,
          sender: 'visitor',
          isTyping: false,
        }))
        visitorTypingDebounce = null
      }, 1200)
    } else {
      if (visitorTypingDebounce) {
        clearTimeout(visitorTypingDebounce)
        visitorTypingDebounce = null
      }
      ws.send(JSON.stringify({
        type: 'typing',
        sessionId: currentSessionId,
        sender: 'visitor',
        isTyping: false,
      }))
    }
  }

  /**
   * Register a callback for new messages (useful for scroll-to-bottom, notifications)
   */
  function onNewMessage(callback: NewMessageHandler) {
    onNewMessageCallbacks.push(callback)
  }

  /**
   * Register a callback for admin online/offline status changes
   */
  function onStatusChange(callback: StatusChangeHandler) {
    onStatusChangeCallbacks.push(callback)
  }

  /**
   * Register a callback for when the admin closes this session
   */
  function onSessionClosed(callback: SessionClosedHandler) {
    onSessionClosedCallbacks.push(callback)
  }

  function attemptReconnect() {
    if (reconnectAttempts >= maxReconnectAttempts) return

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 15000)
    reconnectAttempts++

    reconnectTimer = setTimeout(() => {
      if (currentSessionId) {
        connect(currentSessionId)
      } else {
        // Reconnect for status-only mode
        connect()
      }
    }, delay)
  }

  /**
   * Disconnect from WebSocket
   */
  function disconnect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    if (typingTimeout) {
      clearTimeout(typingTimeout)
      typingTimeout = null
    }
    if (visitorTypingDebounce) {
      clearTimeout(visitorTypingDebounce)
      visitorTypingDebounce = null
    }
    reconnectAttempts = maxReconnectAttempts // Prevent reconnect
    if (ws) {
      ws.close()
      ws = null
    }
    isConnected.value = false
    isConnecting.value = false
    currentSessionId = null
  }

  // Auto-cleanup on unmount
  onUnmounted(() => {
    disconnect()
  })

  return {
    // State
    isConnected: readonly(isConnected),
    isConnecting: readonly(isConnecting),
    connectionError: readonly(connectionError),
    messages: readonly(messages),
    adminTyping: readonly(adminTyping),
    adminOnline: readonly(adminOnline),

    // Actions
    connect,
    joinSession,
    disconnect,
    sendMessage,
    sendTyping,
    onNewMessage,
    onStatusChange,
    onSessionClosed,
  }
}

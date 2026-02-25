// server/routes/_ws/chat.ts
/**
 * Nitro WebSocket handler for real-time chat
 *
 * Protocol:
 * Client sends:
 *   { type: "join", sessionId: number }
 *   { type: "subscribe_status" }           -- subscribe to admin online/offline changes
 *   { type: "status_change", online: boolean } -- admin broadcasts status change
 *   { type: "message", sessionId: number, message: string }
 *   { type: "typing", sessionId: number, isTyping: boolean }
 *
 * Server sends:
 *   { type: "messages", messages: ChatMessage[] }
 *   { type: "new_message", message: ChatMessage }
 *   { type: "typing", sender: "admin"|"visitor", isTyping: boolean }
 *   { type: "status_change", online: boolean }
 *   { type: "session_closed", sessionId: number }
 *   { type: "error", message: string }
 */

import {
  createDirectus,
  rest,
  staticToken,
  readItems,
  createItem,
  updateItem,
} from '@directus/sdk'

interface ChatPeer {
  sessionId: number | null
  lastMessageCount: number
}

// Track connected peers and their sessions (local to this handler)
const peerSessions = new Map<any, ChatPeer>()

// Track active session poll intervals
const sessionPolls = new Map<number, ReturnType<typeof setInterval>>()

function getDirectusClient() {
  const config = useRuntimeConfig()
  return createDirectus(config.directus.url)
    .with(staticToken(config.directus.staticToken))
    .with(rest())
}

async function fetchMessages(sessionId: number) {
  const directus = getDirectusClient()
  return await directus.request(
    readItems('chat_messages' as any, {
      filter: { session: { _eq: sessionId } },
      sort: ['date_created'],
      fields: ['id', 'sender', 'message', 'date_created', 'read'],
    })
  )
}

function startSessionPoll(sessionId: number) {
  if (sessionPolls.has(sessionId)) return

  let lastKnownCount = 0

  const interval = setInterval(async () => {
    if (!hasSessionPeers(sessionId)) {
      clearInterval(interval)
      sessionPolls.delete(sessionId)
      return
    }

    try {
      const messages = await fetchMessages(sessionId) as any[]
      if (messages.length > lastKnownCount) {
        lastKnownCount = messages.length

        const peers = getSessionPeers(sessionId)
        for (const peer of peers) {
          try {
            peer.send(JSON.stringify({
              type: 'messages',
              messages,
            }))
          } catch {
            // Peer disconnected
          }
        }
      }
    } catch (error) {
      console.error(`[ws/chat] Poll error for session ${sessionId}:`, error)
    }
  }, 1500)

  sessionPolls.set(sessionId, interval)
}

export default defineWebSocketHandler({
  open(peer) {
    peerSessions.set(peer, { sessionId: null, lastMessageCount: 0 })
    addChatPeer(peer)
  },

  async message(peer, msg) {
    let data: any
    try {
      data = JSON.parse(msg.text())
    } catch {
      peer.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }))
      return
    }

    const peerState = peerSessions.get(peer)
    if (!peerState) return

    switch (data.type) {
      case 'subscribe_status': {
        // Peer wants status updates only — already tracked via addChatPeer() in open()
        break
      }

      case 'status_change': {
        // Admin broadcasting a status change via WS
        broadcastStatusChange(!!data.online, peer)
        break
      }

      case 'join': {
        const sessionId = Number(data.sessionId)
        if (!sessionId) {
          peer.send(JSON.stringify({ type: 'error', message: 'Invalid session ID' }))
          return
        }

        // Remove from old session if switching
        if (peerState.sessionId && peerState.sessionId !== sessionId) {
          removePeerFromSession(peerState.sessionId, peer)
        }

        peerState.sessionId = sessionId
        addPeerToSession(sessionId, peer)

        // Send existing messages
        try {
          const messages = await fetchMessages(sessionId) as any[]
          peerState.lastMessageCount = messages.length
          peer.send(JSON.stringify({ type: 'messages', messages }))
        } catch (error) {
          peer.send(JSON.stringify({ type: 'error', message: 'Failed to load messages' }))
        }

        // Start polling for this session
        startSessionPoll(sessionId)
        break
      }

      case 'message': {
        const sessionId = peerState.sessionId || Number(data.sessionId)
        if (!sessionId) {
          peer.send(JSON.stringify({ type: 'error', message: 'Not joined to a session' }))
          return
        }

        if (!data.message?.trim()) {
          peer.send(JSON.stringify({ type: 'error', message: 'Empty message' }))
          return
        }

        try {
          const directus = getDirectusClient()

          const newMessage = await directus.request(
            createItem('chat_messages' as any, {
              session: sessionId,
              sender: data.sender || 'visitor',
              message: data.message.trim(),
              read: false,
            })
          )

          // Update session timestamp
          await directus.request(
            updateItem('chat_sessions' as any, sessionId, {
              last_message_at: new Date().toISOString(),
            })
          )

          // Broadcast to all peers in this session
          const peers = getSessionPeers(sessionId)
          const msgPayload = JSON.stringify({
            type: 'new_message',
            message: newMessage,
          })
          for (const p of peers) {
            try {
              p.send(msgPayload)
            } catch {
              // Peer disconnected
            }
          }
        } catch (error) {
          console.error('[ws/chat] Failed to save message:', error)
          peer.send(JSON.stringify({ type: 'error', message: 'Failed to send message' }))
        }
        break
      }

      case 'typing': {
        const sessionId = peerState.sessionId
        if (!sessionId) return

        const peers = getSessionPeers(sessionId)
        const typingPayload = JSON.stringify({
          type: 'typing',
          sender: data.sender || 'visitor',
          isTyping: !!data.isTyping,
        })
        for (const p of peers) {
          if (p !== peer) {
            try {
              p.send(typingPayload)
            } catch {
              // Peer disconnected
            }
          }
        }
        break
      }
    }
  },

  close(peer) {
    const peerState = peerSessions.get(peer)
    if (peerState?.sessionId) {
      removePeerFromSession(peerState.sessionId, peer)
    }
    peerSessions.delete(peer)
    removeChatPeer(peer)
  },

  error(peer, error) {
    console.error('[ws/chat] WebSocket error:', error)
    const peerState = peerSessions.get(peer)
    if (peerState?.sessionId) {
      removePeerFromSession(peerState.sessionId, peer)
    }
    peerSessions.delete(peer)
    removeChatPeer(peer)
  },
})

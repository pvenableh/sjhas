// server/routes/_ws/chat.ts
/**
 * Nitro WebSocket handler for real-time chat
 *
 * Protocol:
 * Client sends:
 *   { type: "join", sessionId: number }
 *   { type: "message", sessionId: number, message: string }
 *   { type: "typing", sessionId: number, isTyping: boolean }
 *
 * Server sends:
 *   { type: "messages", messages: ChatMessage[] }
 *   { type: "new_message", message: ChatMessage }
 *   { type: "typing", sender: "admin", isTyping: boolean }
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

// Track connected peers and their sessions
const peerSessions = new Map<any, ChatPeer>()

// Track admin typing state per session (set by admin via a separate mechanism)
const adminTyping = new Map<number, boolean>()

// Track active session poll intervals
const sessionPolls = new Map<number, ReturnType<typeof setInterval>>()

// Peers per session for broadcasting
const sessionPeers = new Map<number, Set<any>>()

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
    const peers = sessionPeers.get(sessionId)
    if (!peers || peers.size === 0) {
      // No more connected peers, stop polling
      clearInterval(interval)
      sessionPolls.delete(sessionId)
      sessionPeers.delete(sessionId)
      return
    }

    try {
      const messages = await fetchMessages(sessionId) as any[]
      if (messages.length > lastKnownCount) {
        lastKnownCount = messages.length

        // Broadcast new messages to all peers in this session
        const newMessages = messages.slice(-Math.max(messages.length - lastKnownCount + (messages.length - lastKnownCount), 1))
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
  }, 1500) // Poll every 1.5s server-side (faster than client-side polling)

  sessionPolls.set(sessionId, interval)
}

export default defineWebSocketHandler({
  open(peer) {
    peerSessions.set(peer, { sessionId: null, lastMessageCount: 0 })
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
      case 'join': {
        const sessionId = Number(data.sessionId)
        if (!sessionId) {
          peer.send(JSON.stringify({ type: 'error', message: 'Invalid session ID' }))
          return
        }

        peerState.sessionId = sessionId

        // Track peer in session group
        if (!sessionPeers.has(sessionId)) {
          sessionPeers.set(sessionId, new Set())
        }
        sessionPeers.get(sessionId)!.add(peer)

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
          const peers = sessionPeers.get(sessionId)
          if (peers) {
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

        // Broadcast typing indicator to other peers in the session
        const peers = sessionPeers.get(sessionId)
        if (peers) {
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
        }
        break
      }
    }
  },

  close(peer) {
    const peerState = peerSessions.get(peer)
    if (peerState?.sessionId) {
      const peers = sessionPeers.get(peerState.sessionId)
      if (peers) {
        peers.delete(peer)
        if (peers.size === 0) {
          sessionPeers.delete(peerState.sessionId)
          // Poll cleanup happens automatically in the interval
        }
      }
    }
    peerSessions.delete(peer)
  },

  error(peer, error) {
    console.error('[ws/chat] WebSocket error:', error)
    const peerState = peerSessions.get(peer)
    if (peerState?.sessionId) {
      const peers = sessionPeers.get(peerState.sessionId)
      if (peers) {
        peers.delete(peer)
      }
    }
    peerSessions.delete(peer)
  },
})

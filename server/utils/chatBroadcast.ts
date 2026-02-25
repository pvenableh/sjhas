// server/utils/chatBroadcast.ts
// Shared state for WebSocket broadcasts across chat endpoints.
// This allows the status.post endpoint to broadcast to all connected WS clients.

// All connected WebSocket peers (for global broadcasts like status changes)
const allChatPeers = new Set<any>()

// Peers grouped by session (for session-specific broadcasts)
const sessionChatPeers = new Map<number, Set<any>>()

/**
 * Register a new peer in the global peer set
 */
export function addChatPeer(peer: any) {
  allChatPeers.add(peer)
}

/**
 * Remove a peer from the global peer set
 */
export function removeChatPeer(peer: any) {
  allChatPeers.delete(peer)
}

/**
 * Add a peer to a session group
 */
export function addPeerToSession(sessionId: number, peer: any) {
  if (!sessionChatPeers.has(sessionId)) {
    sessionChatPeers.set(sessionId, new Set())
  }
  sessionChatPeers.get(sessionId)!.add(peer)
}

/**
 * Remove a peer from a session group
 */
export function removePeerFromSession(sessionId: number, peer: any) {
  const peers = sessionChatPeers.get(sessionId)
  if (peers) {
    peers.delete(peer)
    if (peers.size === 0) {
      sessionChatPeers.delete(sessionId)
    }
  }
}

/**
 * Get all peers in a session
 */
export function getSessionPeers(sessionId: number): Set<any> {
  return sessionChatPeers.get(sessionId) || new Set()
}

/**
 * Check if a session has connected peers
 */
export function hasSessionPeers(sessionId: number): boolean {
  const peers = sessionChatPeers.get(sessionId)
  return !!peers && peers.size > 0
}

/**
 * Broadcast admin online/offline status to all connected peers
 */
export function broadcastStatusChange(online: boolean, excludePeer?: any) {
  const payload = JSON.stringify({ type: 'status_change', online })
  for (const peer of allChatPeers) {
    if (peer === excludePeer) continue
    try {
      peer.send(payload)
    } catch {
      // Peer disconnected
    }
  }
}

/**
 * Broadcast session_closed to all peers in a session
 */
export function broadcastSessionClosed(sessionId: number) {
  const peers = sessionChatPeers.get(sessionId)
  if (!peers) return
  const payload = JSON.stringify({ type: 'session_closed', sessionId })
  for (const peer of peers) {
    try {
      peer.send(payload)
    } catch {
      // Peer disconnected
    }
  }
}

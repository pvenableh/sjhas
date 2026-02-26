/**
 * Shared notification bell state.
 *
 * Uses Nuxt `useState` so every component that calls this composable
 * (admin layout header, notifications page, etc.) reads and writes the
 * same reactive refs. Archiving or marking-as-read from *any* page
 * instantly updates the bell badge and dropdown everywhere.
 */
export function useNotificationBell() {
  const submissions = useDirectusItems('form_submissions')
  const chatSessions = useDirectusItems('chat_sessions')

  // ── shared reactive state ────────────────────────────────────────
  const newSubmissions = useState<any[]>('bell-new-submissions', () => [])
  const activeChatSessions = useState<any[]>('bell-active-chats', () => [])
  const readSubmissions = useState<any[]>('bell-read-submissions', () => [])
  const closedChatSessions = useState<any[]>('bell-closed-chats', () => [])
  const isLoading = useState<boolean>('bell-loading', () => true)

  // ── derived counts ───────────────────────────────────────────────
  const newCount = computed(() =>
    newSubmissions.value.length + activeChatSessions.value.length,
  )

  const readCount = computed(() =>
    readSubmissions.value.length + closedChatSessions.value.length,
  )

  // ── fetch from Directus ──────────────────────────────────────────
  async function refresh() {
    try {
      const [newSubs, activeChats, reviewedSubs, doneChats] = await Promise.all([
        submissions.list({
          filter: { status: { _eq: 'new' } },
          sort: ['-date_created'],
          limit: 5,
          fields: ['id', 'submitter_name', 'submitter_email', 'date_created', 'form', 'status'],
        }),
        chatSessions.list({
          filter: { status: { _eq: 'active' } },
          sort: ['-last_message_at'],
          limit: 5,
          fields: ['id', 'visitor_name', 'last_message_at', 'status'],
        }),
        // "Read" bucket includes both reviewed AND archived
        submissions.list({
          filter: { status: { _in: ['reviewed', 'archived'] } },
          sort: ['-date_created'],
          limit: 5,
          fields: ['id', 'submitter_name', 'submitter_email', 'date_created', 'form', 'status'],
        }),
        chatSessions.list({
          filter: { status: { _in: ['closed', 'archived'] } },
          sort: ['-last_message_at'],
          limit: 5,
          fields: ['id', 'visitor_name', 'last_message_at', 'status'],
        }),
      ])

      newSubmissions.value = newSubs
      activeChatSessions.value = activeChats
      readSubmissions.value = reviewedSubs
      closedChatSessions.value = doneChats
    } catch {
      // Non-critical — bell is secondary UI
    } finally {
      isLoading.value = false
    }
  }

  // ── actions ──────────────────────────────────────────────────────
  async function markAsRead(subId: number) {
    const sub = newSubmissions.value.find((s: any) => s.id === subId)
    if (!sub) return
    try {
      await submissions.update(subId, { status: 'reviewed' } as any)
      newSubmissions.value = newSubmissions.value.filter((s: any) => s.id !== subId)
      readSubmissions.value = [{ ...sub, status: 'reviewed' }, ...readSubmissions.value].slice(0, 5)
    } catch {
      // Non-critical
    }
  }

  return {
    newSubmissions,
    activeChatSessions,
    readSubmissions,
    closedChatSessions,
    isLoading,
    newCount,
    readCount,
    refresh,
    markAsRead,
  }
}

<script setup lang="ts">
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'vue-sonner'

definePageMeta({
  middleware: 'auth',
  layout: 'admin',
})

useSeoMeta({
  title: 'Notifications - Admin - SJHAS, Inc.',
})

const submissions = useDirectusItems('form_submissions')
const chatSessions = useDirectusItems('chat_sessions')
const router = useRouter()

// Directus Realtime
const { subscribe, connect: rtConnect } = useDirectusRealtime()

// State
const isLoading = ref(true)
const statusFilter = ref<'all' | 'new' | 'reviewed' | 'archived'>('all')

const allSubmissions = ref<any[]>([])
const allChatSessions = ref<any[]>([])

// Merged + sorted notification list
const notifications = computed(() => {
  const items: any[] = []

  for (const sub of allSubmissions.value) {
    items.push({
      id: `sub-${sub.id}`,
      rawId: sub.id,
      type: 'submission' as const,
      title: sub.submitter_name
        ? `Form submission from ${sub.submitter_name}`
        : 'New form submission',
      subtitle: sub.submitter_email || 'No email provided',
      status: sub.status,
      date: sub.date_created,
      icon: 'lucide:inbox',
      iconBg: sub.status === 'new' ? 'bg-blue-100' : 'bg-slate-100',
      iconColor: sub.status === 'new' ? 'text-blue-600' : 'text-slate-400',
    })
  }

  for (const chat of allChatSessions.value) {
    items.push({
      id: `chat-${chat.id}`,
      rawId: chat.id,
      type: 'chat' as const,
      title: `Chat with ${chat.visitor_name}`,
      subtitle: chat.status === 'active' ? 'Live conversation' : 'Session ended',
      status: chat.status === 'active' ? 'new' : chat.status === 'closed' ? 'reviewed' : chat.status,
      date: chat.last_message_at || chat.date_created,
      icon: 'lucide:message-circle',
      iconBg: chat.status === 'active' ? 'bg-green-100' : 'bg-slate-100',
      iconColor: chat.status === 'active' ? 'text-green-600' : 'text-slate-400',
    })
  }

  // Sort by date descending
  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return items
})

// Filtered list
const filteredNotifications = computed(() => {
  if (statusFilter.value === 'all') return notifications.value
  return notifications.value.filter((n) => n.status === statusFilter.value)
})

// Counts
const newCount = computed(() => notifications.value.filter((n) => n.status === 'new').length)
const readCount = computed(() => notifications.value.filter((n) => n.status === 'reviewed').length)
const archivedCount = computed(() => notifications.value.filter((n) => n.status === 'archived').length)

async function fetchAll() {
  isLoading.value = true
  try {
    const [subs, chats] = await Promise.all([
      submissions.list({
        sort: ['-date_created'],
        limit: 50,
        fields: ['id', 'submitter_name', 'submitter_email', 'date_created', 'status'],
      }),
      chatSessions.list({
        sort: ['-last_message_at', '-date_created'],
        limit: 50,
        fields: ['id', 'visitor_name', 'last_message_at', 'date_created', 'status'],
      }),
    ])
    allSubmissions.value = subs
    allChatSessions.value = chats
  } catch {
    toast.error('Failed to load notifications')
  } finally {
    isLoading.value = false
  }
}

// Mark submission as reviewed
async function markAsRead(notif: any) {
  if (notif.type === 'submission' && notif.status === 'new') {
    try {
      await submissions.update(notif.rawId, { status: 'reviewed' } as any)
      const sub = allSubmissions.value.find((s: any) => s.id === notif.rawId)
      if (sub) sub.status = 'reviewed'
      toast.success('Marked as read')
    } catch {
      toast.error('Failed to update')
    }
  }
}

// Archive a notification
async function archiveNotif(notif: any) {
  try {
    if (notif.type === 'submission') {
      await submissions.update(notif.rawId, { status: 'archived' } as any)
      const sub = allSubmissions.value.find((s: any) => s.id === notif.rawId)
      if (sub) sub.status = 'archived'
    } else if (notif.type === 'chat') {
      await chatSessions.update(notif.rawId, { status: 'archived' } as any)
      const chat = allChatSessions.value.find((c: any) => c.id === notif.rawId)
      if (chat) chat.status = 'archived'
    }
    toast.success('Archived')
  } catch {
    toast.error('Failed to archive')
  }
}

// Navigate to the related item
function goToNotification(notif: any) {
  if (notif.type === 'submission') {
    router.push('/admin/submissions')
  } else {
    router.push('/admin/chat')
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return ''
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
}

function statusLabel(status: string) {
  switch (status) {
    case 'new': return 'New'
    case 'reviewed': return 'Read'
    case 'archived': return 'Archived'
    case 'active': return 'Active'
    case 'closed': return 'Closed'
    default: return status
  }
}

function statusBadgeClass(status: string) {
  switch (status) {
    case 'new': return 'bg-blue-100 text-blue-700'
    case 'reviewed': return 'bg-slate-100 text-slate-600'
    case 'archived': return 'bg-slate-50 text-slate-400'
    default: return 'bg-slate-100 text-slate-600'
  }
}

onMounted(async () => {
  await fetchAll()

  try {
    await rtConnect()

    await subscribe('form_submissions', () => fetchAll(), {
      fields: ['id', 'submitter_name', 'submitter_email', 'date_created', 'status'],
    })

    await subscribe('chat_sessions', () => fetchAll(), {
      fields: ['id', 'visitor_name', 'last_message_at', 'date_created', 'status'],
    })
  } catch {
    // Fallback polling
    const interval = setInterval(fetchAll, 30000)
    onUnmounted(() => clearInterval(interval))
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Notifications</h1>
        <p class="text-slate-600 mt-1">All form submissions and chat session activity</p>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div class="flex gap-2">
      <button
        v-for="tab in [
          { value: 'all', label: 'All', count: notifications.length },
          { value: 'new', label: 'New', count: newCount },
          { value: 'reviewed', label: 'Read', count: readCount },
          { value: 'archived', label: 'Archived', count: archivedCount },
        ] as const"
        :key="tab.value"
        class="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors"
        :class="statusFilter === tab.value
          ? 'bg-slate-900 text-white'
          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'"
        @click="statusFilter = tab.value"
      >
        {{ tab.label }}
        <span
          class="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-medium"
          :class="statusFilter === tab.value
            ? 'bg-white/20 text-white'
            : 'bg-slate-100 text-slate-500'"
        >
          {{ tab.count }}
        </span>
      </button>
    </div>

    <!-- Notifications List -->
    <div class="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <!-- Loading -->
      <div v-if="isLoading" class="p-6 space-y-4">
        <div v-for="i in 6" :key="i" class="flex items-center gap-4">
          <div class="h-10 w-10 rounded-full bg-slate-100 animate-pulse shrink-0" />
          <div class="flex-1 space-y-2">
            <div class="h-4 w-3/4 bg-slate-100 rounded animate-pulse" />
            <div class="h-3 w-1/2 bg-slate-100 rounded animate-pulse" />
          </div>
        </div>
      </div>

      <!-- Empty -->
      <div
        v-else-if="filteredNotifications.length === 0"
        class="flex flex-col items-center justify-center py-16 text-center"
      >
        <Icon name="lucide:bell-off" class="w-12 h-12 text-slate-300 mb-4" />
        <h3 class="text-lg font-medium text-slate-500">No {{ statusFilter === 'all' ? '' : statusFilter }} notifications</h3>
        <p class="text-sm text-slate-400 mt-1">
          {{ statusFilter === 'new'
            ? 'All caught up!'
            : statusFilter === 'archived'
            ? 'No archived notifications yet'
            : 'Nothing to show here' }}
        </p>
      </div>

      <!-- List -->
      <div v-else class="divide-y divide-slate-100">
        <div
          v-for="notif in filteredNotifications"
          :key="notif.id"
          class="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group"
        >
          <!-- Icon -->
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            :class="notif.iconBg"
          >
            <Icon :name="notif.icon" class="w-4.5 h-4.5" :class="notif.iconColor" />
          </div>

          <!-- Content (clickable) -->
          <button
            class="flex-1 min-w-0 text-left"
            @click="goToNotification(notif)"
          >
            <p
              class="text-sm truncate"
              :class="notif.status === 'new' ? 'font-medium text-slate-900' : 'text-slate-600'"
            >
              {{ notif.title }}
            </p>
            <p class="text-xs text-slate-500 truncate">{{ notif.subtitle }}</p>
          </button>

          <!-- Status badge -->
          <span
            class="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
            :class="statusBadgeClass(notif.status)"
          >
            {{ statusLabel(notif.status) }}
          </span>

          <!-- Date -->
          <span class="shrink-0 text-xs text-slate-400 w-24 text-right">
            {{ formatDate(notif.date) }}
          </span>

          <!-- Actions -->
          <div class="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              v-if="notif.status === 'new' && notif.type === 'submission'"
              class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              title="Mark as read"
              @click.stop="markAsRead(notif)"
            >
              <Icon name="lucide:check" class="w-4 h-4" />
            </button>
            <button
              v-if="notif.status !== 'archived'"
              class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              title="Archive"
              @click.stop="archiveNotif(notif)"
            >
              <Icon name="lucide:archive" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

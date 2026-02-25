<script setup lang="ts">
import { format, formatDistanceToNow } from 'date-fns'
import { toast } from 'vue-sonner'
import type { ChatSession } from '~/types/directus'

definePageMeta({
  middleware: 'auth',
  layout: 'admin',
})

useSeoMeta({
  title: 'Chat Dashboard - Admin - SJHAS, Inc.',
})

const sessions = useDirectusItems<ChatSession>('chat_sessions')

// Directus Realtime for live message + session updates
const {
  subscribe,
  isConnected,
  connect: rtConnect,
} = useDirectusRealtime()

// State
const sessionsList = ref<ChatSession[]>([])
const isLoading = ref(true)
const selectedSessionId = ref<number | null>(null)
const adminOnline = ref(false)
const togglingStatus = ref(false)
const replyText = ref('')
const messagesContainer = ref<HTMLElement | null>(null)
const statusFilter = ref<'active' | 'closed' | 'all'>('active')
const messages = ref<any[]>([])

let messageUnsubscribe: (() => void) | null = null

// Selected session object
const selectedSession = computed(() =>
  sessionsList.value.find((s) => s.id === selectedSessionId.value) || null
)

// Filtered sessions
const filteredSessions = computed(() => {
  if (statusFilter.value === 'all') return sessionsList.value
  return sessionsList.value.filter((s) => s.status === statusFilter.value)
})

// Fetch sessions
async function fetchSessions() {
  isLoading.value = true
  try {
    const result = await sessions.list({
      sort: ['-last_message_at', '-date_created'],
      fields: [
        'id', 'visitor_name', 'visitor_email', 'visitor_phone',
        'status', 'date_created', 'last_message_at',
      ],
    })
    sessionsList.value = result
  } catch (error) {
    console.error('Failed to fetch chat sessions:', error)
    toast.error('Failed to load chat sessions')
  } finally {
    isLoading.value = false
  }
}

// Fetch messages for a session via server endpoint
async function fetchMessages(sessionId: number) {
  try {
    const result = await $fetch('/api/chat/messages', {
      method: 'POST',
      body: { sessionId, operation: 'list' },
    })
    messages.value = result as any[]
  } catch (error) {
    console.error('Failed to fetch messages:', error)
    toast.error('Failed to load messages')
  }
}

// Subscribe to new messages for the selected session
async function subscribeToMessages(sessionId: number) {
  // Unsubscribe from previous session's messages
  if (messageUnsubscribe) {
    messageUnsubscribe()
    messageUnsubscribe = null
  }

  try {
    messageUnsubscribe = await subscribe('chat_messages', (event, data) => {
      if (event === 'create') {
        const newMessages = Array.isArray(data) ? data : [data]
        for (const msg of newMessages) {
          // Only add messages for the current session
          if (msg.session === sessionId || msg.session?.id === sessionId) {
            const exists = messages.value.some((m: any) => m.id === msg.id)
            if (!exists) {
              messages.value = [...messages.value, msg]
              scrollToBottom()
            }
          }
        }
      }
    }, {
      fields: ['id', 'session', 'sender', 'message', 'date_created', 'read'],
      filter: { session: { _eq: sessionId } },
    })
  } catch (error) {
    console.error('Failed to subscribe to messages:', error)
  }
}

// Subscribe to session changes for the session list
async function subscribeToSessions() {
  try {
    await subscribe('chat_sessions', () => {
      fetchSessions()
    }, {
      fields: ['id', 'visitor_name', 'visitor_email', 'visitor_phone', 'status', 'date_created', 'last_message_at'],
    })
  } catch (error) {
    console.error('Failed to subscribe to sessions:', error)
  }
}

// Fetch chat settings (online status)
async function fetchChatStatus() {
  try {
    const status = await $fetch('/api/chat/status')
    adminOnline.value = status.online
  } catch {
    adminOnline.value = false
  }
}

// Toggle online/offline status
async function toggleOnlineStatus() {
  togglingStatus.value = true
  try {
    await $fetch('/api/chat/status', {
      method: 'POST',
      body: { online: !adminOnline.value },
    })
    adminOnline.value = !adminOnline.value
    toast.success(adminOnline.value ? 'You are now online' : 'You are now offline')
  } catch (error: any) {
    const msg = error?.data?.message || error?.message || 'Failed to update status'
    toast.error(msg)
    console.error('[chat] Toggle status error:', error)
  } finally {
    togglingStatus.value = false
  }
}

// Select a session — load messages + subscribe to realtime updates
async function selectSession(sessionId: number) {
  selectedSessionId.value = sessionId
  messages.value = []
  await fetchMessages(sessionId)
  await subscribeToMessages(sessionId)
  nextTick(() => scrollToBottom())
}

// Send admin reply via server endpoint
async function sendReply() {
  if (!replyText.value.trim() || !selectedSessionId.value) return

  const messageText = replyText.value.trim()
  replyText.value = ''

  try {
    await $fetch('/api/chat/messages', {
      method: 'POST',
      body: {
        sessionId: selectedSessionId.value,
        sender: 'admin',
        message: messageText,
        operation: 'send',
      },
    })
    scrollToBottom()
  } catch (error) {
    toast.error('Failed to send message')
    replyText.value = messageText
  }
}

function handleReplyKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendReply()
  }
}

// Close/archive a session
async function closeSession(sessionId: number) {
  try {
    await sessions.update(sessionId, { status: 'closed' } as any)
    toast.success('Session closed')
    await fetchSessions()
    if (selectedSessionId.value === sessionId) {
      selectedSessionId.value = null
      messages.value = []
    }
  } catch {
    toast.error('Failed to close session')
  }
}

async function reopenSession(sessionId: number) {
  try {
    await sessions.update(sessionId, { status: 'active' } as any)
    toast.success('Session reopened')
    await fetchSessions()
  } catch {
    toast.error('Failed to reopen session')
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

function formatTime(dateStr: string) {
  return format(new Date(dateStr), 'h:mm a')
}

function formatSessionTime(dateStr: string | null) {
  if (!dateStr) return ''
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Load data on mount, then connect to Directus realtime
onMounted(async () => {
  await Promise.all([fetchSessions(), fetchChatStatus()])

  // Connect to Directus realtime and subscribe to session changes
  try {
    await rtConnect()
    await subscribeToSessions()
  } catch (error) {
    console.error('Failed to connect to realtime:', error)
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Chat Dashboard</h1>
        <p class="text-slate-600 mt-1">Manage visitor conversations in real time</p>
      </div>

      <!-- Online Toggle -->
      <button
        :disabled="togglingStatus"
        class="inline-flex items-center gap-3 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all"
        :class="adminOnline
          ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'"
        @click="toggleOnlineStatus"
      >
        <span
          class="inline-block h-2.5 w-2.5 rounded-full"
          :class="adminOnline ? 'bg-green-500' : 'bg-slate-400'"
        />
        {{ adminOnline ? 'Online' : 'Offline' }}
        <span class="text-xs opacity-60">(click to toggle)</span>
      </button>
    </div>

    <!-- Main Chat Layout -->
    <div class="flex gap-4 rounded-xl border border-slate-200 bg-white overflow-hidden" style="height: calc(100vh - 14rem);">

      <!-- Session List (Left Panel) -->
      <div class="w-80 shrink-0 border-r border-slate-200 flex flex-col">
        <!-- Filter Tabs -->
        <div class="flex border-b border-slate-200">
          <button
            v-for="tab in [
              { value: 'active', label: 'Active' },
              { value: 'closed', label: 'Closed' },
              { value: 'all', label: 'All' },
            ] as const"
            :key="tab.value"
            class="flex-1 px-3 py-2.5 text-xs font-medium transition-colors"
            :class="statusFilter === tab.value
              ? 'text-slate-900 border-b-2 border-slate-900'
              : 'text-slate-500 hover:text-slate-700'"
            @click="statusFilter = tab.value"
          >
            {{ tab.label }}
            <span
              v-if="tab.value !== 'all'"
              class="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px]"
            >
              {{ sessionsList.filter((s) => tab.value === 'all' || s.status === tab.value).length }}
            </span>
          </button>
        </div>

        <!-- Sessions -->
        <div class="flex-1 overflow-y-auto">
          <div v-if="isLoading" class="p-4 space-y-3">
            <div v-for="i in 4" :key="i" class="h-16 rounded-lg bg-slate-100 animate-pulse" />
          </div>

          <div v-else-if="filteredSessions.length === 0" class="flex flex-col items-center justify-center p-8 text-center">
            <Icon name="lucide:message-square-off" class="w-10 h-10 text-slate-300 mb-3" />
            <p class="text-sm text-slate-500">No {{ statusFilter === 'all' ? '' : statusFilter }} conversations</p>
          </div>

          <div v-else>
            <button
              v-for="session in filteredSessions"
              :key="session.id"
              class="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors border-b border-slate-100"
              :class="selectedSessionId === session.id
                ? 'bg-slate-100'
                : 'hover:bg-slate-50'"
              @click="selectSession(session.id)"
            >
              <!-- Avatar -->
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                :class="session.status === 'active'
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-slate-100 text-slate-500'"
              >
                {{ getInitials(session.visitor_name) }}
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-medium text-slate-900 truncate">
                    {{ session.visitor_name }}
                  </p>
                  <span
                    v-if="session.status === 'active'"
                    class="ml-2 inline-block h-2 w-2 shrink-0 rounded-full bg-green-500"
                  />
                </div>
                <p class="text-xs text-slate-500 truncate">{{ session.visitor_email }}</p>
                <p class="text-[10px] text-slate-400 mt-0.5">
                  {{ formatSessionTime(session.last_message_at || session.date_created) }}
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Conversation Panel (Right) -->
      <div class="flex-1 flex flex-col">
        <!-- No session selected -->
        <div
          v-if="!selectedSession"
          class="flex flex-1 flex-col items-center justify-center text-center p-8"
        >
          <Icon name="lucide:message-square" class="w-16 h-16 text-slate-200 mb-4" />
          <h3 class="text-lg font-medium text-slate-500">Select a conversation</h3>
          <p class="text-sm text-slate-400 mt-1">Choose a session from the left to view messages</p>
        </div>

        <!-- Session selected -->
        <template v-else>
          <!-- Conversation Header -->
          <div class="flex items-center justify-between border-b border-slate-200 px-5 py-3">
            <div class="flex items-center gap-3">
              <div class="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
                {{ getInitials(selectedSession.visitor_name) }}
              </div>
              <div>
                <p class="text-sm font-semibold text-slate-900">{{ selectedSession.visitor_name }}</p>
                <div class="flex items-center gap-2 text-xs text-slate-500">
                  <span>{{ selectedSession.visitor_email }}</span>
                  <span v-if="selectedSession.visitor_phone" class="before:content-['·'] before:mr-2">
                    {{ selectedSession.visitor_phone }}
                  </span>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <!-- Connection status -->
              <span
                class="inline-block h-2 w-2 rounded-full"
                :class="isConnected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'"
                :title="isConnected ? 'Realtime connected' : 'Connecting...'"
              />

              <!-- Close/Reopen -->
              <button
                v-if="selectedSession.status === 'active'"
                class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                @click="closeSession(selectedSession.id)"
              >
                Close
              </button>
              <button
                v-else
                class="rounded-lg border border-green-200 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50 transition-colors"
                @click="reopenSession(selectedSession.id)"
              >
                Reopen
              </button>
            </div>
          </div>

          <!-- Messages -->
          <div
            ref="messagesContainer"
            class="flex-1 overflow-y-auto px-5 py-4 space-y-3"
          >
            <!-- Session started notice -->
            <div class="flex justify-center">
              <span class="rounded-full bg-slate-100 px-3 py-1 text-[10px] text-slate-500">
                {{ selectedSession.visitor_name }} started a conversation &middot;
                {{ format(new Date(selectedSession.date_created), 'MMM d, h:mm a') }}
              </span>
            </div>

            <!-- Messages -->
            <div
              v-for="msg in messages"
              :key="msg.id"
              class="flex"
              :class="msg.sender === 'admin' ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-[70%] rounded-2xl px-4 py-2.5 text-sm"
                :class="msg.sender === 'admin'
                  ? 'rounded-br-md bg-primary-600 text-white'
                  : 'rounded-bl-md bg-slate-100 text-slate-900'"
              >
                <p class="whitespace-pre-wrap">{{ msg.message }}</p>
                <p
                  class="mt-1 text-[10px] opacity-60"
                  :class="msg.sender === 'admin' ? 'text-right' : 'text-left'"
                >
                  {{ formatTime(msg.date_created) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Reply Input -->
          <div class="border-t border-slate-200 px-5 py-3">
            <div class="flex items-end gap-3">
              <Textarea
                v-model="replyText"
                placeholder="Type your reply..."
                rows="2"
                class="flex-1 resize-none text-sm"
                @keydown="handleReplyKeydown"
              />
              <Button
                :disabled="!replyText.trim()"
                class="shrink-0"
                @click="sendReply"
              >
                <Icon name="lucide:send" class="w-4 h-4" />
                Send
              </Button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

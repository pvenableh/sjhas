<script setup lang="ts">
/**
 * ChatWidget - Floating chat widget for visitor engagement
 *
 * When Stephen is online: Real-time messaging via Nitro WebSocket (relays Directus)
 * When offline: Captures visitor name, email, phone + stores message
 * Supports typing indicators in both directions.
 */

const { trackChatOpen, trackChatSessionStart, trackChatMessageSent } = useAnalytics()

const isOpen = ref(false)
const isMinimized = ref(false)

// Chat status
const adminOnline = ref(false)
const welcomeMessage = ref('')
const offlineMessage = ref('')
const statusLoaded = ref(false)

// Visitor info form
const visitorName = ref('')
const visitorEmail = ref('')
const visitorPhone = ref('')
const initialMessage = ref('')
const formError = ref('')
const formSubmitting = ref(false)
const formSubmitted = ref(false)

// Chat session
const sessionId = ref<number | null>(null)
const newMessage = ref('')
const sendingMessage = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)
const hasUnread = ref(false)

// WebSocket composable for real-time messaging
const {
  connect: wsConnect,
  disconnect: wsDisconnect,
  sendMessage: wsSendMessage,
  sendTyping,
  messages,
  adminTyping,
  isConnected,
  onNewMessage,
} = useChatWebSocket()

// Scroll + unread dot on new messages
onNewMessage(() => {
  scrollToBottom()
  if (!isOpen.value) {
    hasUnread.value = true
  }
})

// Fetch chat status on mount
onMounted(async () => {
  try {
    const status = await $fetch('/api/chat/status')
    adminOnline.value = status.online
    welcomeMessage.value = status.welcomeMessage
    offlineMessage.value = status.offlineMessage
  } catch {
    adminOnline.value = false
    welcomeMessage.value = 'Hi! How can we help you today?'
    offlineMessage.value = "Stephen is currently offline. Please leave your contact info and we'll get back to you shortly!"
  } finally {
    statusLoaded.value = true
  }
})

onUnmounted(() => {
  wsDisconnect()
})

function toggleChat() {
  if (isOpen.value) {
    isOpen.value = false
    isMinimized.value = false
  } else {
    isOpen.value = true
    isMinimized.value = false
    hasUnread.value = false
    trackChatOpen()
  }
}

function minimizeChat() {
  isMinimized.value = true
  isOpen.value = false
}

/**
 * Submit visitor info form (offline mode or start of online chat)
 */
async function submitVisitorInfo() {
  formError.value = ''

  if (!visitorName.value.trim()) {
    formError.value = 'Please enter your name'
    return
  }
  if (!visitorEmail.value.trim()) {
    formError.value = 'Please enter your email'
    return
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(visitorEmail.value)) {
    formError.value = 'Please enter a valid email address'
    return
  }

  formSubmitting.value = true

  try {
    const result = await $fetch('/api/chat/session', {
      method: 'POST',
      body: {
        name: visitorName.value.trim(),
        email: visitorEmail.value.trim(),
        phone: visitorPhone.value.trim() || null,
        message: initialMessage.value.trim() || null,
      },
    })

    sessionId.value = result.sessionId
    trackChatSessionStart(adminOnline.value ? 'online' : 'offline')

    if (adminOnline.value) {
      // Connect to WebSocket for live chat
      wsConnect(result.sessionId)
    } else {
      formSubmitted.value = true
    }
  } catch (error: any) {
    formError.value = error.data?.message || 'Something went wrong. Please try again.'
  } finally {
    formSubmitting.value = false
  }
}

/**
 * Send a chat message via WebSocket
 */
function sendMessage() {
  if (!newMessage.value.trim() || !sessionId.value || sendingMessage.value) return

  const messageText = newMessage.value.trim()
  newMessage.value = ''
  sendingMessage.value = true

  wsSendMessage(messageText)
  sendTyping(false)
  trackChatMessageSent()

  setTimeout(() => {
    sendingMessage.value = false
  }, 200)

  scrollToBottom()
}

/**
 * Handle input for typing indicator
 */
function handleInput() {
  if (newMessage.value.trim()) {
    sendTyping(true)
  } else {
    sendTyping(false)
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Whether we're in live chat mode (session created + admin online)
const isLiveChat = computed(() => sessionId.value !== null && adminOnline.value)
</script>

<template>
  <!-- Chat Toggle Button -->
  <button
    class="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2"
    :class="[
      isOpen
        ? 'bg-secondary-700 text-white hover:bg-secondary-800 focus:ring-secondary-500'
        : 'bg-[var(--theme-accent)] text-white hover:opacity-90 focus:ring-[var(--theme-accent)]'
    ]"
    :aria-label="isOpen ? 'Close chat' : 'Open chat'"
    @click="toggleChat"
  >
    <!-- Close icon -->
    <svg v-if="isOpen" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
    <!-- Chat icon -->
    <svg v-else class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>

    <!-- Notification dot for unread messages -->
    <span
      v-if="!isOpen && hasUnread"
      class="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 border-2 border-white animate-pulse"
    />
  </button>

  <!-- Chat Window -->
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 translate-y-4 scale-95"
    enter-to-class="opacity-100 translate-y-0 scale-100"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0 scale-100"
    leave-to-class="opacity-0 translate-y-4 scale-95"
  >
    <div
      v-if="isOpen"
      class="fixed bottom-24 right-6 z-50 flex w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl shadow-2xl border"
      style="height: min(520px, calc(100vh - 8rem)); background: var(--theme-bg-primary); border-color: var(--theme-border);"
    >
      <!-- Header -->
      <div
        class="flex items-center gap-3 px-5 py-4"
        style="background: var(--theme-accent); color: white;"
      >
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-lg font-semibold t-heading">
          S
        </div>
        <div class="flex-1">
          <p class="text-sm font-semibold tracking-wide t-heading">Stephen Haskell</p>
          <div class="flex items-center gap-1.5">
            <span
              class="inline-block h-2 w-2 rounded-full"
              :class="adminOnline ? 'bg-green-400' : 'bg-gray-300'"
            />
            <span class="text-xs opacity-90">
              {{ adminTyping ? 'Typing...' : adminOnline ? 'Online' : 'Offline' }}
            </span>
          </div>
        </div>
        <div class="flex items-center gap-1">
          <!-- Connection indicator (live chat only) -->
          <span
            v-if="isLiveChat"
            class="mr-1 inline-block h-2 w-2 rounded-full"
            :class="isConnected ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'"
            :title="isConnected ? 'Connected' : 'Reconnecting...'"
          />
          <button
            class="rounded-lg p-1.5 transition-colors hover:bg-white/20 focus:outline-none"
            aria-label="Minimize chat"
            @click="minimizeChat"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Body -->
      <div class="flex flex-1 flex-col overflow-hidden">

        <!-- OFFLINE: Visitor Capture Form (before session created) -->
        <div
          v-if="!isLiveChat && !formSubmitted"
          class="flex-1 overflow-y-auto px-5 py-4"
        >
          <!-- Welcome/Offline message -->
          <div
            class="mb-4 rounded-xl px-4 py-3 text-sm"
            style="background: var(--theme-bg-secondary); color: var(--theme-text-secondary);"
          >
            <p>{{ adminOnline ? welcomeMessage : offlineMessage }}</p>
          </div>

          <!-- Form -->
          <form class="space-y-3" @submit.prevent="submitVisitorInfo">
            <div>
              <label class="mb-1 block text-xs font-medium" style="color: var(--theme-text-secondary);">
                Name <span class="text-red-500">*</span>
              </label>
              <input
                v-model="visitorName"
                type="text"
                placeholder="Your name"
                class="t-input w-full rounded-lg px-3 py-2.5 text-sm"
                required
              />
            </div>

            <div>
              <label class="mb-1 block text-xs font-medium" style="color: var(--theme-text-secondary);">
                Email <span class="text-red-500">*</span>
              </label>
              <input
                v-model="visitorEmail"
                type="email"
                placeholder="you@example.com"
                class="t-input w-full rounded-lg px-3 py-2.5 text-sm"
                required
              />
            </div>

            <div>
              <label class="mb-1 block text-xs font-medium" style="color: var(--theme-text-secondary);">
                Phone
              </label>
              <input
                v-model="visitorPhone"
                type="tel"
                placeholder="(555) 123-4567"
                class="t-input w-full rounded-lg px-3 py-2.5 text-sm"
              />
            </div>

            <div>
              <label class="mb-1 block text-xs font-medium" style="color: var(--theme-text-secondary);">
                {{ adminOnline ? 'Start the conversation' : 'Your message' }}
              </label>
              <textarea
                v-model="initialMessage"
                :placeholder="adminOnline ? 'Type your question...' : 'How can we help you?'"
                rows="3"
                class="t-input w-full resize-none rounded-lg px-3 py-2.5 text-sm"
              />
            </div>

            <!-- Error -->
            <p v-if="formError" class="text-xs text-red-600">{{ formError }}</p>

            <!-- Submit -->
            <button
              type="submit"
              :disabled="formSubmitting"
              class="t-btn w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 disabled:opacity-50"
            >
              <span v-if="formSubmitting" class="flex items-center justify-center gap-2">
                <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Sending...
              </span>
              <span v-else>{{ adminOnline ? 'Start Chat' : 'Send Message' }}</span>
            </button>
          </form>
        </div>

        <!-- OFFLINE: Thank You (form submitted, admin offline) -->
        <div
          v-else-if="formSubmitted && !adminOnline"
          class="flex flex-1 flex-col items-center justify-center px-5 py-8 text-center"
        >
          <div
            class="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
            style="background: var(--theme-bg-secondary);"
          >
            <svg class="h-8 w-8" style="color: var(--theme-accent);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 class="mb-2 text-lg font-semibold t-heading" style="color: var(--theme-text-primary);">
            Message Sent!
          </h3>
          <p class="text-sm" style="color: var(--theme-text-secondary);">
            Thanks, {{ visitorName }}! Stephen will get back to you at
            <span class="font-medium">{{ visitorEmail }}</span> as soon as possible.
          </p>
        </div>

        <!-- ONLINE: Live Chat Messages -->
        <template v-else-if="isLiveChat">
          <!-- Messages List -->
          <div
            ref="messagesContainer"
            class="flex-1 overflow-y-auto px-4 py-4 space-y-3"
          >
            <!-- System welcome -->
            <div class="flex justify-start">
              <div
                class="max-w-[80%] rounded-2xl rounded-bl-md px-4 py-2.5 text-sm"
                style="background: var(--theme-bg-secondary); color: var(--theme-text-primary);"
              >
                {{ welcomeMessage }}
              </div>
            </div>

            <!-- Messages -->
            <div
              v-for="msg in messages"
              :key="msg.id"
              class="flex"
              :class="msg.sender === 'visitor' ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm"
                :class="msg.sender === 'visitor'
                  ? 'rounded-br-md text-white'
                  : 'rounded-bl-md'"
                :style="msg.sender === 'visitor'
                  ? 'background: var(--theme-accent);'
                  : 'background: var(--theme-bg-secondary); color: var(--theme-text-primary);'"
              >
                <p>{{ msg.message }}</p>
                <p
                  class="mt-1 text-[10px] opacity-60"
                  :class="msg.sender === 'visitor' ? 'text-right' : 'text-left'"
                >
                  {{ formatTime(msg.date_created) }}
                </p>
              </div>
            </div>

            <!-- Admin typing indicator (bouncing dots) -->
            <div v-if="adminTyping" class="flex justify-start">
              <div
                class="flex items-center gap-1.5 rounded-2xl rounded-bl-md px-4 py-3"
                style="background: var(--theme-bg-secondary);"
              >
                <span class="inline-block h-2 w-2 animate-bounce rounded-full opacity-60 [animation-delay:0ms]" style="background: var(--theme-text-muted);" />
                <span class="inline-block h-2 w-2 animate-bounce rounded-full opacity-60 [animation-delay:150ms]" style="background: var(--theme-text-muted);" />
                <span class="inline-block h-2 w-2 animate-bounce rounded-full opacity-60 [animation-delay:300ms]" style="background: var(--theme-text-muted);" />
              </div>
            </div>
          </div>

          <!-- Message Input -->
          <div
            class="border-t px-4 py-3"
            style="border-color: var(--theme-border);"
          >
            <div class="flex items-end gap-2">
              <textarea
                v-model="newMessage"
                placeholder="Type a message..."
                rows="1"
                class="t-input flex-1 resize-none rounded-xl px-3 py-2.5 text-sm"
                @keydown="handleKeydown"
                @input="handleInput"
              />
              <button
                :disabled="!newMessage.trim() || sendingMessage"
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-200 disabled:opacity-40"
                style="background: var(--theme-accent); color: white;"
                @click="sendMessage"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </template>
      </div>

    </div>
  </Transition>
</template>

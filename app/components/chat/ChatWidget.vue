<script setup lang="ts">
/**
 * ChatWidget - Floating chat widget for visitor engagement
 *
 * Real-time via Directus WebSocket (direct browser → Directus connection).
 * Falls back to HTTP polling if WS is unavailable.
 * Writes (send message, start session) go through Vercel Nuxt API.
 */

const STORAGE_KEY = "sjh-chat-session";

const { trackChatOpen, trackChatSessionStart, trackChatMessageSent } =
  useAnalytics();

const isOpen = ref(false);
const isMinimized = ref(false);
const sessionRestoring = ref(false);

// Chat status
const adminOnline = ref(false);
const welcomeMessage = ref("");
const offlineMessage = ref("");
const statusLoaded = ref(false);

// Visitor info form
const visitorName = ref("");
const visitorEmail = ref("");
const visitorPhone = ref("");
const initialMessage = ref("");
const formError = ref("");
const formSubmitting = ref(false);
const formSubmitted = ref(false);

// Chat session
const sessionId = ref<number | null>(null);
const sessionClosed = ref(false);
const newMessage = ref("");
const sendingMessage = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);
const hasUnread = ref(false);
const messages = ref<any[]>([]);

// ─── Real-time composable (Directus WS + polling fallback) ────
const {
  isConnected,
  adminOnline: rtAdminOnline,
  adminTyping,
  connectionMode,
  connect: rtConnect,
  joinSession: rtJoinSession,
  leaveSession: rtLeaveSession,
  sendTyping,
  disconnect: rtDisconnect,
  onNewMessage,
  onStatusChange,
  onSessionClosed,
} = useChatRealtime();

// Sync real-time admin status → local ref
watch(rtAdminOnline, (online) => {
  adminOnline.value = online;
});

// Auto-scroll when admin starts typing so indicator is visible
watch(adminTyping, (typing) => {
  if (typing) scrollToBottom();
});

// Merge new messages from real-time
onNewMessage((msg) => {
  const exists = messages.value.some((m: any) => m.id === (msg as any).id);
  if (!exists) {
    messages.value = [...messages.value, msg as any];
    scrollToBottom();
    if (!isOpen.value) {
      hasUnread.value = true;
    }
  }
});

// Admin comes online/goes offline
onStatusChange(async (online) => {
  adminOnline.value = online;
  if (online && !sessionId.value && !sessionClosed.value) {
    await restoreSession();
  }
});

// Session closed by admin
onSessionClosed(() => {
  sessionClosed.value = true;
  clearPersistedSession();
});

// ─── Session persistence ──────────────────────────────────────

function persistSession(sid: number) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        sessionId: sid,
        visitorName: visitorName.value,
        visitorEmail: visitorEmail.value,
        visitorPhone: visitorPhone.value,
        timestamp: Date.now(),
      }),
    );
  } catch {}
}

function clearPersistedSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

async function restoreSession(): Promise<boolean> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;

    const data = JSON.parse(stored);
    if (!data.sessionId) return false;

    const ageMs = Date.now() - (data.timestamp || 0);
    if (ageMs > 24 * 60 * 60 * 1000) {
      clearPersistedSession();
      return false;
    }

    const result = await $fetch("/api/chat/session", {
      method: "GET",
      params: { id: data.sessionId },
    });

    if (!result.valid) {
      clearPersistedSession();
      return false;
    }

    sessionId.value = data.sessionId;
    visitorName.value = data.visitorName || "";
    visitorEmail.value = data.visitorEmail || "";
    visitorPhone.value = data.visitorPhone || "";

    await loadMessages(data.sessionId);
    rtJoinSession(data.sessionId);

    return true;
  } catch {
    clearPersistedSession();
    return false;
  }
}

// ─── Lifecycle ────────────────────────────────────────────────

onMounted(async () => {
  rtConnect();

  try {
    const status = await $fetch("/api/chat/status");
    adminOnline.value = status.online;
    welcomeMessage.value = status.welcomeMessage;
    offlineMessage.value = status.offlineMessage;
  } catch {
    adminOnline.value = false;
    welcomeMessage.value = "Hi! How can we help you today?";
    offlineMessage.value =
      "Stephen is currently offline. Please leave your contact info and we'll get back to you shortly!";
  } finally {
    statusLoaded.value = true;
  }

  sessionRestoring.value = true;
  try {
    await restoreSession();
  } finally {
    sessionRestoring.value = false;
  }
});

onUnmounted(() => {
  rtDisconnect();
});

// ─── UI Actions ───────────────────────────────────────────────

function toggleChat() {
  if (isOpen.value) {
    isOpen.value = false;
    isMinimized.value = false;
  } else {
    isOpen.value = true;
    isMinimized.value = false;
    hasUnread.value = false;
    trackChatOpen();
  }
}

function minimizeChat() {
  isMinimized.value = true;
  isOpen.value = false;
}

async function loadMessages(sid: number) {
  try {
    const result = await $fetch("/api/chat/messages", {
      method: "POST",
      body: { sessionId: sid, operation: "list" },
    });
    messages.value = result as any[];
  } catch {}
}

async function submitVisitorInfo() {
  formError.value = "";

  if (!visitorName.value.trim()) {
    formError.value = "Please enter your name";
    return;
  }
  if (!visitorEmail.value.trim()) {
    formError.value = "Please enter your email";
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(visitorEmail.value)) {
    formError.value = "Please enter a valid email address";
    return;
  }

  formSubmitting.value = true;

  try {
    const result = await $fetch("/api/chat/session", {
      method: "POST",
      body: {
        name: visitorName.value.trim(),
        email: visitorEmail.value.trim(),
        phone: visitorPhone.value.trim() || null,
        message: initialMessage.value.trim() || null,
      },
    });

    sessionId.value = result.sessionId;
    trackChatSessionStart(adminOnline.value ? "online" : "offline");

    if (adminOnline.value) {
      persistSession(result.sessionId);
      await loadMessages(result.sessionId);
      rtJoinSession(result.sessionId);
    } else {
      formSubmitted.value = true;
    }
  } catch (error: any) {
    formError.value =
      error.data?.message || "Something went wrong. Please try again.";
  } finally {
    formSubmitting.value = false;
  }
}

async function sendMessage() {
  if (!newMessage.value.trim() || !sessionId.value || sendingMessage.value)
    return;

  const messageText = newMessage.value.trim();
  newMessage.value = "";
  sendingMessage.value = true;
  sendTyping(false);

  try {
    const result = await $fetch("/api/chat/messages", {
      method: "POST",
      body: {
        sessionId: sessionId.value,
        sender: "visitor",
        message: messageText,
        operation: "send",
      },
    });
    const msg = result as any;
    const exists = messages.value.some((m: any) => m.id === msg.id);
    if (!exists) {
      messages.value = [...messages.value, msg];
    }
    trackChatMessageSent();
  } catch {
    newMessage.value = messageText;
  } finally {
    sendingMessage.value = false;
  }

  scrollToBottom();
}

function startNewChat() {
  sessionClosed.value = false;
  sessionId.value = null;
  messages.value = [];
  visitorName.value = "";
  visitorEmail.value = "";
  visitorPhone.value = "";
  initialMessage.value = "";
  formSubmitted.value = false;
  rtLeaveSession();
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  } else {
    sendTyping(true);
  }
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const isLiveChat = computed(
  () => sessionId.value !== null && adminOnline.value && !sessionClosed.value,
);
</script>

<template>
  <!-- Chat Toggle Button -->
  <button
    class="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2"
    :class="[
      isOpen
        ? 'bg-secondary-700 text-white hover:bg-secondary-800 focus:ring-secondary-500'
        : 'bg-[var(--theme-accent)] text-white hover:opacity-90 focus:ring-[var(--theme-accent)]',
    ]"
    :aria-label="isOpen ? 'Close chat' : 'Open chat'"
    @click="toggleChat"
  >
    <!-- Close icon -->
    <svg
      v-if="isOpen"
      class="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
    <!-- Chat icon -->
    <svg
      v-else
      class="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
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
      style="
        height: min(520px, calc(100vh - 8rem));
        background: var(--theme-bg-primary);
        border-color: var(--theme-border);
      "
    >
      <!-- Header -->
      <div
        class="flex items-center gap-3 px-5 py-4"
        style="background: var(--theme-accent); color: white"
      >
        <div
          class="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-lg font-semibold t-heading"
        >
          S
        </div>
        <div class="flex-1">
          <p class="text-sm font-semibold tracking-wide t-heading">
            Stephen Hoffman
          </p>
          <div class="flex items-center gap-1.5">
            <span
              class="inline-block h-2 w-2 rounded-full transition-colors duration-300"
              :class="adminOnline ? 'bg-green-400' : 'bg-gray-300'"
            />
            <span class="text-xs opacity-90">
              {{ adminOnline ? "Online" : "Offline" }}
            </span>
          </div>
        </div>
        <div class="flex items-center gap-1">
          <!-- Connection indicator (live chat only) -->
          <span
            v-if="isLiveChat"
            class="mr-1 inline-block h-2 w-2 rounded-full"
            :class="
              isConnected ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'
            "
            :title="isConnected ? 'Connected' : 'Reconnecting...'"
          />
          <button
            class="rounded-lg p-1.5 transition-colors hover:bg-white/20 focus:outline-none"
            aria-label="Minimize chat"
            @click="minimizeChat"
          >
            <svg
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Body -->
      <div class="flex flex-1 flex-col overflow-hidden">
        <!-- Session closed by admin -->
        <div
          v-if="sessionClosed"
          class="flex flex-1 flex-col items-center justify-center px-5 py-8 text-center"
        >
          <div
            class="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
            style="background: var(--theme-bg-secondary)"
          >
            <svg
              class="h-8 w-8"
              style="color: var(--theme-text-secondary)"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3
            class="mb-2 text-lg font-semibold t-heading"
            style="color: var(--theme-text-primary)"
          >
            Chat Ended
          </h3>
          <p class="text-sm mb-4" style="color: var(--theme-text-secondary)">
            This conversation has been closed. Thank you for chatting with us!
          </p>
          <button
            class="t-btn rounded-lg px-4 py-2 text-sm font-medium"
            @click="startNewChat"
          >
            Start New Chat
          </button>
        </div>

        <!-- Restoring session spinner -->
        <div
          v-else-if="sessionRestoring"
          class="flex flex-1 flex-col items-center justify-center px-5 py-8"
        >
          <svg
            class="h-8 w-8 animate-spin mb-3"
            style="color: var(--theme-accent)"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p class="text-sm" style="color: var(--theme-text-secondary)">
            Restoring your conversation...
          </p>
        </div>

        <!-- OFFLINE: Visitor Capture Form (before session created) -->
        <div
          v-else-if="!isLiveChat && !formSubmitted"
          class="flex-1 overflow-y-auto px-5 py-4"
        >
          <!-- Welcome/Offline message -->
          <div
            class="mb-4 rounded-xl px-4 py-3 text-sm"
            style="
              background: var(--theme-bg-secondary);
              color: var(--theme-text-secondary);
            "
          >
            <p>{{ adminOnline ? welcomeMessage : offlineMessage }}</p>
          </div>

          <!-- Form -->
          <form class="space-y-3" @submit.prevent="submitVisitorInfo">
            <div>
              <label
                class="mb-1 block text-xs font-medium"
                style="color: var(--theme-text-secondary)"
              >
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
              <label
                class="mb-1 block text-xs font-medium"
                style="color: var(--theme-text-secondary)"
              >
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
              <label
                class="mb-1 block text-xs font-medium"
                style="color: var(--theme-text-secondary)"
              >
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
              <label
                class="mb-1 block text-xs font-medium"
                style="color: var(--theme-text-secondary)"
              >
                {{ adminOnline ? "Start the conversation" : "Your message" }}
              </label>
              <textarea
                v-model="initialMessage"
                :placeholder="
                  adminOnline ? 'Type your question...' : 'How can we help you?'
                "
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
              <span
                v-if="formSubmitting"
                class="flex items-center justify-center gap-2"
              >
                <svg
                  class="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Sending...
              </span>
              <span v-else>{{
                adminOnline ? "Start Chat" : "Send Message"
              }}</span>
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
            style="background: var(--theme-bg-secondary)"
          >
            <svg
              class="h-8 w-8"
              style="color: var(--theme-accent)"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3
            class="mb-2 text-lg font-semibold t-heading"
            style="color: var(--theme-text-primary)"
          >
            Message Sent!
          </h3>
          <p class="text-sm" style="color: var(--theme-text-secondary)">
            Thanks, {{ visitorName }}! Stephen will get back to you at
            <span class="font-medium">{{ visitorEmail }}</span> as soon as
            possible.
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
                style="
                  background: var(--theme-bg-secondary);
                  color: var(--theme-text-primary);
                "
              >
                {{ welcomeMessage }}
              </div>
            </div>

            <!-- Messages -->
            <div
              v-for="msg in messages"
              :key="msg.id"
              class="flex"
              :class="
                msg.sender === 'visitor' ? 'justify-end' : 'justify-start'
              "
            >
              <div
                class="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm"
                :class="
                  msg.sender === 'visitor'
                    ? 'rounded-br-md text-white'
                    : 'rounded-bl-md'
                "
                :style="
                  msg.sender === 'visitor'
                    ? 'background: var(--theme-accent);'
                    : 'background: var(--theme-bg-secondary); color: var(--theme-text-primary);'
                "
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

            <!-- Admin typing indicator -->
            <div v-if="adminTyping" class="flex justify-start">
              <div
                class="rounded-2xl rounded-bl-md px-4 py-3"
                style="background: var(--theme-bg-secondary)"
              >
                <div class="flex items-center gap-1">
                  <span class="typing-dot h-2 w-2 rounded-full" style="background: var(--theme-text-secondary)" />
                  <span class="typing-dot h-2 w-2 rounded-full" style="background: var(--theme-text-secondary); animation-delay: 0.2s" />
                  <span class="typing-dot h-2 w-2 rounded-full" style="background: var(--theme-text-secondary); animation-delay: 0.4s" />
                </div>
              </div>
            </div>
          </div>

          <!-- Session Closed State -->
          <template v-if="sessionClosed">
            <div class="border-t px-4 py-4 text-center" style="border-color: var(--theme-border)">
              <div
                class="mb-3 flex items-center justify-center gap-2 text-sm"
                style="color: var(--theme-text-secondary)"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                This conversation has been closed.
              </div>
              <button
                class="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
                style="background: var(--theme-accent)"
                @click="startNewChat"
              >
                Start New Chat
              </button>
            </div>
          </template>

          <!-- Normal Message Input -->
          <template v-else>
            <div
              class="border-t px-4 py-3"
              style="border-color: var(--theme-border)"
            >
              <div class="flex items-end gap-2">
                <textarea
                  v-model="newMessage"
                  placeholder="Type a message..."
                  rows="1"
                  class="t-input flex-1 resize-none rounded-xl px-3 py-2.5 text-sm"
                  @keydown="handleKeydown"
                />
                <button
                  :disabled="!newMessage.trim() || sendingMessage"
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-200 disabled:opacity-40"
                  style="background: var(--theme-accent); color: white"
                  @click="sendMessage"
                >
                  <svg
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </template>
        </template>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
@keyframes typing-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-4px); opacity: 1; }
}
.typing-dot {
  animation: typing-bounce 1.4s ease-in-out infinite;
}
</style>

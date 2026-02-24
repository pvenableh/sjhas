<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const { user, logout } = useDirectusAuth()
const { trackLogout } = useAnalytics()
const router = useRouter()

const isSidebarOpen = ref(false)
const isProfileMenuOpen = ref(false)
const isNotificationsOpen = ref(false)

// Notifications state
const submissions = useDirectusItems('form_submissions')
const chatSessions = useDirectusItems('chat_sessions')
const newSubmissions = ref<any[]>([])
const activeChatSessions = ref<any[]>([])
const notifLoading = ref(true)

const notificationCount = computed(() =>
  newSubmissions.value.length + activeChatSessions.value.length
)

async function fetchNotifications() {
  try {
    const [subs, chats] = await Promise.all([
      submissions.list({
        filter: { status: { _eq: 'new' } },
        sort: ['-date_created'],
        limit: 5,
        fields: ['id', 'submitter_name', 'submitter_email', 'date_created', 'form'],
      }),
      chatSessions.list({
        filter: { status: { _eq: 'active' } },
        sort: ['-last_message_at'],
        limit: 5,
        fields: ['id', 'visitor_name', 'last_message_at'],
      }),
    ])
    newSubmissions.value = subs
    activeChatSessions.value = chats
  } catch {
    // Silently fail — notifications are non-critical
  } finally {
    notifLoading.value = false
  }
}

let notifInterval: ReturnType<typeof setInterval>
onMounted(() => {
  fetchNotifications()
  notifInterval = setInterval(fetchNotifications, 30000)
})
onUnmounted(() => clearInterval(notifInterval))

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: 'lucide:layout-dashboard' },
  { name: 'Form Builder', href: '/admin/forms', icon: 'lucide:file-text' },
  { name: 'Chat', href: '/admin/chat', icon: 'lucide:message-circle' },
  { name: 'Submissions', href: '/admin/submissions', icon: 'lucide:inbox' },
  { name: 'Clients', href: '/admin/clients', icon: 'lucide:users' },
  { name: 'Files', href: '/admin/files', icon: 'lucide:folder' },
  { name: 'Settings', href: '/admin/settings', icon: 'lucide:settings' },
]

const handleLogout = async () => {
  try {
    trackLogout()
    await logout()
    router.push('/auth/login')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}

const closeSidebar = () => {
  isSidebarOpen.value = false
}
</script>

<template>
  <div class="min-h-screen bg-slate-100">
    <!-- Mobile sidebar backdrop -->
    <Transition
      enter-active-class="transition-opacity duration-300"
      leave-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isSidebarOpen"
        class="fixed inset-0 z-40 bg-black/50 lg:hidden"
        @click="closeSidebar"
      />
    </Transition>

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 transform transition-transform duration-300 lg:translate-x-0',
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
    >
      <!-- Logo -->
      <div class="flex items-center gap-2 h-16 px-6 border-b border-slate-800">
        <div class="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center">
          <span class="text-white font-extralight text-base t-heading">S</span>
        </div>
        <span class="font-sans text-lg font-semibold text-white">Admin Panel</span>
      </div>

      <!-- Navigation -->
      <nav class="p-4 space-y-1">
        <NuxtLink
          v-for="item in navigation"
          :key="item.name"
          :to="item.href"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
          :class="[
            $route.path.startsWith(item.href) && (item.href === '/admin' ? $route.path === '/admin' : true)
              ? 'bg-slate-800 text-white'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          ]"
          @click="closeSidebar"
        >
          <Icon :name="item.icon" class="w-5 h-5" />
          {{ item.name }}
        </NuxtLink>
      </nav>

      <!-- Bottom links -->
      <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
        <NuxtLink
          to="/"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <Icon name="lucide:globe" class="w-5 h-5" />
          View Website
        </NuxtLink>
      </div>
    </aside>

    <!-- Main content -->
    <div class="lg:pl-64">
      <!-- Top header -->
      <header class="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div class="flex items-center justify-between h-16 px-4 lg:px-8">
          <!-- Mobile menu button -->
          <button
            class="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100"
            @click="isSidebarOpen = true"
          >
            <Icon name="lucide:menu" class="w-6 h-6 text-slate-600" />
          </button>

          <!-- Breadcrumb / Title -->
          <div class="hidden lg:block">
            <h1 class="text-lg font-semibold text-slate-900">
              {{ $route.meta.title || 'Admin' }}
            </h1>
          </div>

          <!-- Right side -->
          <div class="flex items-center gap-4">
            <!-- Notifications -->
            <div class="relative">
              <button
                class="p-2 rounded-lg hover:bg-slate-100 relative"
                @click="isNotificationsOpen = !isNotificationsOpen; isProfileMenuOpen = false"
              >
                <Icon name="lucide:bell" class="w-5 h-5 text-slate-600" />
                <span
                  v-if="notificationCount > 0"
                  class="absolute top-1 right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white px-1"
                >
                  {{ notificationCount > 9 ? '9+' : notificationCount }}
                </span>
              </button>

              <Transition
                enter-active-class="transition duration-100 ease-out"
                leave-active-class="transition duration-75 ease-in"
                enter-from-class="opacity-0 scale-95"
                leave-to-class="opacity-0 scale-95"
              >
                <div
                  v-if="isNotificationsOpen"
                  class="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-50 overflow-hidden"
                  @click="isNotificationsOpen = false"
                >
                  <div class="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <p class="text-sm font-semibold text-slate-900">Notifications</p>
                    <span v-if="notificationCount > 0" class="text-xs text-slate-500">{{ notificationCount }} new</span>
                  </div>

                  <div v-if="notifLoading" class="p-4">
                    <div v-for="i in 3" :key="i" class="h-10 bg-slate-100 rounded animate-pulse mb-2" />
                  </div>

                  <div v-else-if="notificationCount === 0" class="px-4 py-8 text-center">
                    <Icon name="lucide:bell-off" class="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p class="text-sm text-slate-500">No new notifications</p>
                  </div>

                  <div v-else class="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    <!-- New submissions -->
                    <NuxtLink
                      v-for="sub in newSubmissions"
                      :key="'sub-' + sub.id"
                      to="/admin/submissions"
                      class="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                    >
                      <div class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100">
                        <Icon name="lucide:inbox" class="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <div class="min-w-0">
                        <p class="text-sm text-slate-900 truncate">
                          New submission{{ sub.submitter_name ? ' from ' + sub.submitter_name : '' }}
                        </p>
                        <p class="text-xs text-slate-500">Form submission</p>
                      </div>
                    </NuxtLink>

                    <!-- Active chat sessions -->
                    <NuxtLink
                      v-for="chat in activeChatSessions"
                      :key="'chat-' + chat.id"
                      to="/admin/chat"
                      class="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                    >
                      <div class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100">
                        <Icon name="lucide:message-circle" class="w-3.5 h-3.5 text-green-600" />
                      </div>
                      <div class="min-w-0">
                        <p class="text-sm text-slate-900 truncate">
                          Active chat with {{ chat.visitor_name }}
                        </p>
                        <p class="text-xs text-slate-500">Live conversation</p>
                      </div>
                    </NuxtLink>
                  </div>

                  <div class="px-4 py-2.5 border-t border-slate-100 bg-slate-50">
                    <NuxtLink
                      to="/admin/submissions"
                      class="text-xs font-medium text-primary-600 hover:text-primary-700"
                    >
                      View all submissions →
                    </NuxtLink>
                  </div>
                </div>
              </Transition>
            </div>

            <!-- User menu -->
            <div class="relative">
              <button
                class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                @click="isProfileMenuOpen = !isProfileMenuOpen; isNotificationsOpen = false"
              >
                <div class="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
                  <span class="text-sm font-medium text-white">
                    {{ user?.first_name?.[0] || 'A' }}
                  </span>
                </div>
                <span class="hidden sm:block text-sm font-medium text-slate-700">
                  {{ user?.first_name || 'Admin' }}
                </span>
              </button>

              <!-- Dropdown -->
              <Transition
                enter-active-class="transition duration-100 ease-out"
                leave-active-class="transition duration-75 ease-in"
                enter-from-class="opacity-0 scale-95"
                leave-to-class="opacity-0 scale-95"
              >
                <div
                  v-if="isProfileMenuOpen"
                  class="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50"
                  @click="isProfileMenuOpen = false"
                >
                  <div class="px-4 py-3 border-b border-slate-100">
                    <p class="text-sm font-medium text-slate-900">
                      {{ user?.first_name }} {{ user?.last_name }}
                    </p>
                    <p class="text-sm text-slate-500 truncate">{{ user?.email }}</p>
                  </div>
                  <NuxtLink
                    to="/admin/settings"
                    class="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    <Icon name="lucide:settings" class="w-4 h-4" />
                    Settings
                  </NuxtLink>
                  <button
                    class="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    @click="handleLogout"
                  >
                    <Icon name="lucide:log-out" class="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </header>

      <!-- Page content -->
      <main class="p-4 lg:p-8">
        <slot />
      </main>
    </div>
  </div>
</template>

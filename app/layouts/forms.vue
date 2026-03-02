<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'

const { user, logout, loggedIn } = useDirectusAuth()
const { trackLogout } = useAnalytics()
const router = useRouter()

const isSidebarOpen = ref(false)
const isProfileMenuOpen = ref(false)

const navigation = [
  { name: 'Dashboard', href: '/forms', icon: 'lucide:layout-dashboard' },
  { name: 'My Submissions', href: '/forms/submissions', icon: 'lucide:file-text' },
  { name: 'My Files', href: '/forms/files', icon: 'lucide:folder' },
]

const formLinks = [
  { name: 'Upload Documents', href: '/upload', icon: 'lucide:upload' },
  { name: 'Tax Services Questionnaire', href: '/tax-planning', icon: 'lucide:clipboard-list' },
]

const handleLogout = async () => {
  try {
    trackLogout()
    await logout()
    toast.success('You have been signed out')
    router.push('/auth/login')
  } catch (error) {
    console.error('Logout failed:', error)
    toast.error('Logout failed. Please try again.')
  }
}

const closeSidebar = () => {
  isSidebarOpen.value = false
}

// Close profile menu when clicking outside
const closeProfileMenu = () => {
  isProfileMenuOpen.value = false
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-secondary-900">
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
        'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-secondary-800 border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-300 lg:translate-x-0',
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
    >
      <!-- Logo -->
      <div class="flex items-center gap-2 h-16 px-6 border-b border-slate-200 dark:border-slate-700">
        <div class="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center">
          <span class="text-white font-extralight text-base t-heading">S</span>
        </div>
        <span class="font-sans text-lg font-semibold text-slate-900 dark:text-slate-100">My Forms</span>
      </div>

      <!-- Navigation -->
      <nav class="p-4 space-y-1">
        <NuxtLink
          v-for="item in navigation"
          :key="item.name"
          :to="item.href"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
          :class="[
            $route.path === item.href
              ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-secondary-700 hover:text-slate-900 dark:hover:text-slate-100'
          ]"
          @click="closeSidebar"
        >
          <Icon :name="item.icon" class="w-5 h-5" />
          {{ item.name }}
        </NuxtLink>

        <!-- Forms section -->
        <div class="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
          <p class="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Forms</p>
          <NuxtLink
            v-for="item in formLinks"
            :key="item.name"
            :to="item.href"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-secondary-700 hover:text-slate-900 dark:hover:text-slate-100"
            @click="closeSidebar"
          >
            <Icon :name="item.icon" class="w-5 h-5" />
            {{ item.name }}
          </NuxtLink>
        </div>
      </nav>

      <!-- Bottom links -->
      <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-700">
        <NuxtLink
          to="/"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-secondary-700 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <Icon name="lucide:arrow-left" class="w-5 h-5" />
          Back to Website
        </NuxtLink>
      </div>
    </aside>

    <!-- Main content -->
    <div class="lg:pl-64">
      <!-- Top header -->
      <header class="sticky top-0 z-30 bg-white dark:bg-secondary-800 border-b border-slate-200 dark:border-slate-700">
        <div class="flex items-center justify-between h-16 px-4 lg:px-8">
          <!-- Mobile menu button -->
          <button
            class="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-secondary-700"
            @click="isSidebarOpen = true"
          >
            <Icon name="lucide:menu" class="w-6 h-6 text-slate-600 dark:text-slate-400" />
          </button>

          <!-- Page title - hidden on mobile -->
          <div class="hidden lg:block">
            <h1 class="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {{ $route.meta.title || 'Dashboard' }}
            </h1>
          </div>

          <!-- User menu -->
          <div class="relative">
            <button
              class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-secondary-700 transition-colors"
              @click="isProfileMenuOpen = !isProfileMenuOpen"
            >
              <div class="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <span class="text-sm font-medium text-primary-700 dark:text-primary-400">
                  {{ user?.first_name?.[0] || user?.email?.[0] || '?' }}
                </span>
              </div>
              <span class="hidden sm:block text-sm font-medium text-slate-700 dark:text-slate-200">
                {{ user?.first_name || user?.email }}
              </span>
              <Icon name="lucide:chevron-down" class="w-4 h-4 text-slate-400 dark:text-slate-500" />
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
                class="absolute right-0 mt-2 w-56 bg-white dark:bg-secondary-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50"
                @click="closeProfileMenu"
              >
                <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                  <p class="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {{ user?.first_name }} {{ user?.last_name }}
                  </p>
                  <p class="text-sm text-slate-500 dark:text-slate-400 truncate">{{ user?.email }}</p>
                </div>
                <NuxtLink
                  to="/forms/profile"
                  class="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-secondary-700"
                >
                  <Icon name="lucide:user" class="w-4 h-4" />
                  Profile Settings
                </NuxtLink>
                <button
                  class="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  @click="handleLogout"
                >
                  <Icon name="lucide:log-out" class="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </Transition>
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

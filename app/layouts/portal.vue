<script setup lang="ts">
import { ref } from 'vue'

const { user, logout, loggedIn } = useDirectusAuth()
const router = useRouter()

const isSidebarOpen = ref(false)
const isProfileMenuOpen = ref(false)

const navigation = [
  { name: 'Dashboard', href: '/portal', icon: 'lucide:layout-dashboard' },
  { name: 'My Submissions', href: '/portal/submissions', icon: 'lucide:file-text' },
  { name: 'My Files', href: '/portal/files', icon: 'lucide:folder' },
  { name: 'Upload', href: '/upload', icon: 'lucide:upload' },
  { name: 'Tax Planning', href: '/tax-planning', icon: 'lucide:clipboard-list' },
]

const handleLogout = async () => {
  try {
    await logout()
    router.push('/portal/login')
  } catch (error) {
    console.error('Logout failed:', error)
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
  <div class="min-h-screen bg-slate-50">
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
        'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 lg:translate-x-0',
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
    >
      <!-- Logo -->
      <div class="flex items-center gap-2 h-16 px-6 border-b border-slate-200">
        <div class="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
          <span class="text-white font-bold text-sm">S</span>
        </div>
        <span class="font-serif text-lg text-slate-900">Client Portal</span>
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
              ? 'bg-primary-50 text-primary-700'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          ]"
          @click="closeSidebar"
        >
          <Icon :name="item.icon" class="w-5 h-5" />
          {{ item.name }}
        </NuxtLink>
      </nav>

      <!-- Bottom links -->
      <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
        <NuxtLink
          to="/"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        >
          <Icon name="lucide:arrow-left" class="w-5 h-5" />
          Back to Website
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

          <!-- Page title - hidden on mobile -->
          <div class="hidden lg:block">
            <h1 class="text-lg font-semibold text-slate-900">
              {{ $route.meta.title || 'Dashboard' }}
            </h1>
          </div>

          <!-- User menu -->
          <div class="relative">
            <button
              class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition-colors"
              @click="isProfileMenuOpen = !isProfileMenuOpen"
            >
              <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                <span class="text-sm font-medium text-primary-700">
                  {{ user?.first_name?.[0] || user?.email?.[0] || '?' }}
                </span>
              </div>
              <span class="hidden sm:block text-sm font-medium text-slate-700">
                {{ user?.first_name || user?.email }}
              </span>
              <Icon name="lucide:chevron-down" class="w-4 h-4 text-slate-400" />
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
                @click="closeProfileMenu"
              >
                <div class="px-4 py-3 border-b border-slate-100">
                  <p class="text-sm font-medium text-slate-900">
                    {{ user?.first_name }} {{ user?.last_name }}
                  </p>
                  <p class="text-sm text-slate-500 truncate">{{ user?.email }}</p>
                </div>
                <NuxtLink
                  to="/portal/profile"
                  class="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  <Icon name="lucide:user" class="w-4 h-4" />
                  Profile Settings
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
      </header>

      <!-- Page content -->
      <main class="p-4 lg:p-8">
        <slot />
      </main>
    </div>
  </div>
</template>

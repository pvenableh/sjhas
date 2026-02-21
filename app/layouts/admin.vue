<script setup lang="ts">
import { ref } from 'vue'

const { user, logout } = useDirectusAuth()
const router = useRouter()

const isSidebarOpen = ref(false)
const isProfileMenuOpen = ref(false)

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
    await logout()
    router.push('/admin/login')
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
            <button class="p-2 rounded-lg hover:bg-slate-100 relative">
              <Icon name="lucide:bell" class="w-5 h-5 text-slate-600" />
              <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            <!-- User menu -->
            <div class="relative">
              <button
                class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                @click="isProfileMenuOpen = !isProfileMenuOpen"
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

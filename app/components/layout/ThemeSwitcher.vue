<script setup lang="ts">
import { cn } from '~/lib/utils'

const { themeStyle, isDark, setThemeStyle, toggleDarkMode } = useTheme()

const isOpen = ref(false)

const themes = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Timeless & warm',
    icon: 'lucide:crown',
    colors: {
      light: { bg: '#FDFCFA', accent: '#B8976A' },
      dark: { bg: '#161412', accent: '#C9A96E' }
    }
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Refined & sophisticated',
    icon: 'lucide:sparkles',
    colors: {
      light: { bg: '#FAF9F7', accent: '#8B6F47' },
      dark: { bg: '#121110', accent: '#C4A87A' }
    }
  }
] as const

function selectTheme(id: 'classic' | 'modern') {
  setThemeStyle(id)
  isOpen.value = false
}

// Close dropdown when clicking outside
const dropdownRef = ref<HTMLElement | null>(null)

onClickOutside(dropdownRef, () => {
  isOpen.value = false
})
</script>

<template>
  <div ref="dropdownRef" class="relative">
    <!-- Toggle Button -->
    <button
      type="button"
      class="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200 t-hover-bg"
      :class="[
        't-text-secondary hover:t-text'
      ]"
      aria-label="Change theme"
      @click="isOpen = !isOpen"
    >
      <Icon 
        :name="themeStyle === 'classic' ? 'lucide:crown' : 'lucide:sparkles'" 
        class="w-4 h-4"
      />
      <span class="text-sm font-medium hidden sm:inline">{{ themeStyle === 'classic' ? 'Classic' : 'Modern' }}</span>
      <Icon 
        name="lucide:chevron-down" 
        class="w-3.5 h-3.5 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <!-- Dropdown Panel -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 scale-95 -translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 -translate-y-1"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 top-full mt-2 w-64 rounded-xl t-bg-elevated t-shadow-lg border t-border overflow-hidden z-50"
      >
        <!-- Theme Options -->
        <div class="p-2">
          <p class="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider t-text-muted">
            Theme Style
          </p>
          
          <button
            v-for="theme in themes"
            :key="theme.id"
            type="button"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150"
            :class="[
              themeStyle === theme.id 
                ? 't-bg-alt' 
                : 'hover:t-bg-alt'
            ]"
            @click="selectTheme(theme.id)"
          >
            <!-- Color Preview -->
            <div class="relative w-8 h-8 rounded-lg overflow-hidden border t-border flex-shrink-0">
              <div 
                class="absolute inset-0"
                :style="{ backgroundColor: isDark ? theme.colors.dark.bg : theme.colors.light.bg }"
              />
              <div 
                class="absolute bottom-0 right-0 w-3 h-3 rounded-tl-md"
                :style="{ backgroundColor: isDark ? theme.colors.dark.accent : theme.colors.light.accent }"
              />
            </div>
            
            <!-- Theme Info -->
            <div class="flex-1 text-left">
              <div class="flex items-center gap-1.5">
                <span class="text-sm font-medium t-text">{{ theme.name }}</span>
                <Icon
                  v-if="themeStyle === theme.id"
                  name="lucide:check"
                  class="w-3.5 h-3.5 t-text-accent"
                />
              </div>
              <span class="text-xs t-text-muted">{{ theme.description }}</span>
            </div>
          </button>
        </div>

        <!-- Divider -->
        <div class="h-px t-divider-bg mx-2" />

        <!-- Dark Mode Toggle -->
        <div class="p-2">
          <button
            type="button"
            class="w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors duration-150 hover:t-bg-alt"
            @click="toggleDarkMode"
          >
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg t-bg-alt flex items-center justify-center">
                <Icon 
                  :name="isDark ? 'lucide:moon' : 'lucide:sun'" 
                  class="w-4 h-4 t-text-accent"
                />
              </div>
              <div class="text-left">
                <span class="text-sm font-medium t-text">{{ isDark ? 'Dark Mode' : 'Light Mode' }}</span>
                <p class="text-xs t-text-muted">{{ isDark ? 'Switch to light' : 'Switch to dark' }}</p>
              </div>
            </div>
            
            <!-- Toggle Switch -->
            <div 
              class="relative w-10 h-6 rounded-full transition-colors duration-200"
              :class="isDark ? 't-bg-accent' : 't-bg-subtle'"
            >
              <div 
                class="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
                :class="isDark ? 'translate-x-5' : 'translate-x-1'"
              />
            </div>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

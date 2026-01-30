<script setup lang="ts">
/**
 * Simple dark mode toggle button
 * Use ThemeSwitcher for full theme controls (Classic/Modern + light/dark)
 */

export interface DarkModeToggleProps {
  size?: 'sm' | 'md' | 'lg'
}

withDefaults(defineProps<DarkModeToggleProps>(), {
  size: 'sm',
})

const { isDark, toggleDarkMode } = useTheme()

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-9 h-9',
  lg: 'w-10 h-10',
}

const iconSizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
}
</script>

<template>
  <ClientOnly>
    <button
      type="button"
      :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
      :class="[
        'rounded-full flex items-center justify-center transition-colors duration-200',
        sizeClasses[size],
        't-text-secondary hover:t-bg-alt hover:t-text'
      ]"
      @click="toggleDarkMode"
    >
      <Icon
        :name="isDark ? 'lucide:moon' : 'lucide:sun'"
        :class="iconSizeClasses[size]"
      />
    </button>
    <template #fallback>
      <div :class="sizeClasses[size]" />
    </template>
  </ClientOnly>
</template>

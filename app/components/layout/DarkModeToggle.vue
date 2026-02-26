<script setup lang="ts">
const { isDark, toggleDarkMode } = useTheme();
</script>

<template>
  <ClientOnly>
    <button
      type="button"
      class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      :class="isDark ? 'bg-slate-600' : 'bg-slate-300'"
      role="switch"
      :aria-checked="isDark"
      aria-label="Toggle dark mode"
      @click="toggleDarkMode()"
    >
      <span
        class="pointer-events-none flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-lg ring-0 transition-transform p-0.5"
        :class="isDark ? 'translate-x-4' : 'translate-x-0'"
      >
        <Icon
          :name="isDark ? 'lucide:moon' : 'lucide:sun'"
          class="h-2.5 w-2.5 text-slate-400"
        />
      </span>
    </button>
    <template #fallback>
      <div class="h-5 w-9" />
    </template>
  </ClientOnly>
</template>

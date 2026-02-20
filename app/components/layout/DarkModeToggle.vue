<script setup lang="ts">
const { isDark, toggleDarkMode } = useTheme()
</script>

<template>
  <ClientOnly>
    <Switch
      :checked="isDark"
      :class="[
        isDark
          ? 'data-[state=checked]:bg-slate-600'
          : 'data-[state=unchecked]:bg-slate-300',
      ]"
      aria-label="Toggle dark mode"
      @update:checked="toggleDarkMode"
    >
      <Icon
        :name="isDark ? 'lucide:moon' : 'lucide:sun'"
        class="h-2.5 w-2.5 transition-colors"
        :class="isDark ? 'text-blue-300' : 'text-amber-500'"
      />
    </Switch>
    <template #fallback>
      <div class="h-5 w-9" />
    </template>
  </ClientOnly>
</template>

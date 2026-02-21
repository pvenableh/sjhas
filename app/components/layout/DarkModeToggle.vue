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
        class="h-2.5 w-2.5 text-slate-700 dark:text-yellow-300"
      />
    </Switch>
    <template #fallback>
      <div class="h-5 w-9" />
    </template>
  </ClientOnly>
</template>

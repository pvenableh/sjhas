<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { SelectIcon, SelectTrigger, type SelectTriggerProps } from 'reka-ui'
import { cn } from '~/utils/cn'

const props = defineProps<SelectTriggerProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})
</script>

<template>
  <SelectTrigger
    v-bind="delegatedProps"
    :class="cn(
      'flex h-12 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-secondary-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 transition-all duration-200',
      'placeholder:text-slate-400 dark:placeholder:text-slate-500',
      'focus:border-primary-600 dark:focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-600/15 dark:focus:ring-primary-400/20',
      'disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-secondary-900 disabled:opacity-50',
      '[&>span]:line-clamp-1',
      props.class
    )"
  >
    <slot />
    <SelectIcon as-child>
      <Icon name="lucide:chevron-down" class="size-4 opacity-50" />
    </SelectIcon>
  </SelectTrigger>
</template>

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
      'flex h-12 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition-all duration-200',
      'placeholder:text-slate-400',
      'focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/15',
      'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-50',
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

<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { cn } from '~/utils/cn'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div
    :class="cn('rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-secondary-800 shadow-sm', props.class)"
  >
    <slot />
  </div>
</template>

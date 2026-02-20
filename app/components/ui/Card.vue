<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { cn } from '~/utils/cn'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div
    :class="cn('rounded-2xl border border-slate-200/80 bg-white shadow-sm', props.class)"
  >
    <slot />
  </div>
</template>

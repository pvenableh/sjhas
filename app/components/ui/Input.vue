<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { cn } from '~/utils/cn'

const props = defineProps<{
  class?: HTMLAttributes['class']
  modelValue?: string | number
  defaultValue?: string | number
}>()

const emits = defineEmits<{
  'update:modelValue': [value: string]
}>()

const modelValue = computed({
  get: () => props.modelValue,
  set: (value) => emits('update:modelValue', value as string),
})
</script>

<template>
  <input
    v-model="modelValue"
    :default-value="defaultValue"
    :class="
      cn(
        'flex h-12 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-secondary-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 transition-all duration-200',
        'placeholder:text-slate-400 dark:placeholder:text-slate-500',
        'focus:border-primary-600 dark:focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-600/15 dark:focus:ring-primary-400/20',
        'disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-secondary-900 disabled:opacity-50',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        props.class
      )
    "
  />
</template>

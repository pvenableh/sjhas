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
        'flex h-11 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 transition-colors duration-200',
        'placeholder:text-slate-400',
        'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
        'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-50',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        props.class
      )
    "
  />
</template>

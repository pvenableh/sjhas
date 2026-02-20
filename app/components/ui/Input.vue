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
        'flex h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition-all duration-200',
        'placeholder:text-slate-400',
        'focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/15',
        'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-50',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        props.class
      )
    "
  />
</template>

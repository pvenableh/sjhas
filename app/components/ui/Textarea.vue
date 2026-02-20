<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { cn } from '~/utils/cn'

const props = defineProps<{
  class?: HTMLAttributes['class']
  modelValue?: string
  defaultValue?: string
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
  <textarea
    v-model="modelValue"
    :default-value="defaultValue"
    :class="
      cn(
        'flex min-h-[120px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 transition-all duration-200 resize-y',
        'placeholder:text-slate-400',
        'focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/15',
        'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-50',
        props.class
      )
    "
  />
</template>

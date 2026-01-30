<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { RadioGroupIndicator, RadioGroupItem, type RadioGroupItemProps } from 'reka-ui'
import { cn } from '~/utils/cn'

const props = defineProps<RadioGroupItemProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})
</script>

<template>
  <RadioGroupItem
    v-bind="delegatedProps"
    :class="cn(
      'aspect-square h-5 w-5 rounded-full border border-slate-300 bg-white transition-colors duration-200',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'data-[state=checked]:border-primary-600',
      props.class
    )"
  >
    <RadioGroupIndicator class="flex items-center justify-center">
      <span class="h-2.5 w-2.5 rounded-full bg-primary-600" />
    </RadioGroupIndicator>
  </RadioGroupItem>
</template>

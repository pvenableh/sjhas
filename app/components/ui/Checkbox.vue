<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { CheckboxIndicator, CheckboxRoot, type CheckboxRootEmits, type CheckboxRootProps } from 'reka-ui'
import { cn } from '~/utils/cn'

const props = defineProps<CheckboxRootProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<CheckboxRootEmits>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})
</script>

<template>
  <CheckboxRoot
    v-bind="delegatedProps"
    :class="cn(
      'peer h-5 w-5 shrink-0 rounded border border-slate-300 bg-white transition-colors duration-200',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'data-[state=checked]:bg-primary-600 data-[state=checked]:border-primary-600 data-[state=checked]:text-white',
      props.class
    )"
    @update:checked="emits('update:checked', $event)"
  >
    <CheckboxIndicator class="flex items-center justify-center text-current">
      <Icon name="lucide:check" class="size-3.5" />
    </CheckboxIndicator>
  </CheckboxRoot>
</template>

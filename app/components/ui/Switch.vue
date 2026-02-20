<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { SwitchRoot, type SwitchRootEmits, type SwitchRootProps, SwitchThumb } from 'reka-ui'
import { cn } from '~/utils/cn'

const props = defineProps<SwitchRootProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<SwitchRootEmits>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})
</script>

<template>
  <SwitchRoot
    v-bind="delegatedProps"
    :class="cn(
      'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'data-[state=checked]:bg-primary-600 data-[state=unchecked]:bg-slate-200',
      props.class,
    )"
    @update:checked="emits('update:checked', $event)"
  >
    <SwitchThumb
      :class="cn(
        'pointer-events-none flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-lg ring-0 transition-transform',
        'data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0',
      )"
    >
      <slot />
    </SwitchThumb>
  </SwitchRoot>
</template>

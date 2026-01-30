<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { SelectItem, SelectItemIndicator, type SelectItemProps, SelectItemText } from 'reka-ui'
import { cn } from '~/utils/cn'

const props = defineProps<SelectItemProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})
</script>

<template>
  <SelectItem
    v-bind="delegatedProps"
    :class="cn(
      'relative flex w-full cursor-default select-none items-center rounded-md py-2 pl-8 pr-2 text-sm outline-none',
      'focus:bg-slate-100 focus:text-slate-900',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      props.class
    )"
  >
    <span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectItemIndicator>
        <Icon name="lucide:check" class="size-4" />
      </SelectItemIndicator>
    </span>
    <SelectItemText>
      <slot />
    </SelectItemText>
  </SelectItem>
</template>

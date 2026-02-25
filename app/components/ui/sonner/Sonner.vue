<script lang="ts" setup>
import type { ToasterProps } from "vue-sonner"
import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon, XIcon } from "lucide-vue-next"
import { Toaster as Sonner } from "vue-sonner"
import { cn } from '~/lib/utils'

const props = defineProps<ToasterProps>()
</script>

<template>
  <Sonner
    :class="cn('toaster group', props.class)"
    :style="{
      '--normal-bg': 'var(--theme-bg-elevated, #ffffff)',
      '--normal-text': 'var(--theme-text-primary, #0f172a)',
      '--normal-border': 'var(--theme-border-primary, #e2e8f0)',
      '--border-radius': 'var(--radius, 0.625rem)',
    }"
    v-bind="props"
  >
    <template #success-icon>
      <CircleCheckIcon class="size-4" />
    </template>
    <template #info-icon>
      <InfoIcon class="size-4" />
    </template>
    <template #warning-icon>
      <TriangleAlertIcon class="size-4" />
    </template>
    <template #error-icon>
      <OctagonXIcon class="size-4" />
    </template>
    <template #loading-icon>
      <div>
        <Loader2Icon class="size-4 animate-spin" />
      </div>
    </template>
    <template #close-icon>
      <XIcon class="size-4" />
    </template>
  </Sonner>
</template>

<style>
/* Ensure Sonner toasts are always fixed-positioned and above all other content.
   This prevents them from rendering inline below page content. */
[data-sonner-toaster] {
  position: fixed !important;
  z-index: 99999 !important;
}

[data-sonner-toast] {
  --normal-bg: var(--theme-bg-elevated, #ffffff);
  --normal-text: var(--theme-text-primary, #0f172a);
  --normal-border: var(--theme-border-primary, #e2e8f0);
  font-family: var(--theme-body-font, inherit);
}

[data-sonner-toast][data-type="success"] {
  --success-bg: #f0fdf4;
  --success-text: #166534;
  --success-border: #bbf7d0;
}

[data-sonner-toast][data-type="error"] {
  --error-bg: #fef2f2;
  --error-text: #991b1b;
  --error-border: #fecaca;
}

[data-sonner-toast][data-type="warning"] {
  --warning-bg: #fffbeb;
  --warning-text: #92400e;
  --warning-border: #fde68a;
}

[data-sonner-toast][data-type="info"] {
  --info-bg: #eff6ff;
  --info-text: #1e40af;
  --info-border: #bfdbfe;
}
</style>

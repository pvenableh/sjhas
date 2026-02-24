<script setup lang="ts">
import { Toaster } from 'vue-sonner'

// ── Analytics: identify user + scroll depth ───────────────────────
const { user, loggedIn } = useDirectusAuth()
const { identifyUser, clearUser, trackScrollDepth } = useAnalytics()

// Identify / clear user whenever auth state changes
watch(
  () => [loggedIn.value, user.value] as const,
  ([isLoggedIn, currentUser]) => {
    if (isLoggedIn && currentUser) {
      identifyUser(currentUser as any)
    } else {
      clearUser()
    }
  },
  { immediate: true },
)

// Track scroll depth milestones on every page
const route = useRoute()
let cleanupScroll: (() => void) | undefined

watch(
  () => route.fullPath,
  () => {
    cleanupScroll?.()
    // Wait for content to render before attaching scroll listener
    nextTick(() => {
      cleanupScroll = trackScrollDepth()
    })
  },
  { immediate: true },
)

onUnmounted(() => {
  cleanupScroll?.()
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <Toaster position="top-right" :duration="5000" rich-colors />
</template>

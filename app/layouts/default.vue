<script setup lang="ts">
// Fetch site settings
const { data: settings } = await useAsyncData('site-settings', async () => {
  try {
    return await useSiteSettings()
  } catch (error) {
    console.error('Failed to fetch site settings:', error)
    return null
  }
})

const config = useRuntimeConfig()
const logoUrl = computed(() => {
  if (settings.value?.logo) {
    const logoId = typeof settings.value.logo === 'string'
      ? settings.value.logo
      : settings.value.logo.id
    return `${config.public.directus.url}/assets/${logoId}`
  }
  return null
})
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <LayoutHeader
      :logo="logoUrl || undefined"
      :site-name="settings?.site_name"
      :booking-url="settings?.booking_url"
    />

    <main class="flex-1" style="padding-top: calc(5rem + env(safe-area-inset-top, 0px));">
      <slot />
    </main>

    <LayoutFooter :settings="settings" />

    <!-- Chat Widget -->
    <ClientOnly>
      <ChatWidget />
    </ClientOnly>
  </div>
</template>

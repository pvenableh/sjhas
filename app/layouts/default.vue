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
    />

    <main class="flex-1 pt-20">
      <slot />
    </main>

    <LayoutFooter :settings="settings" />

    <!-- Chat Widget -->
    <ClientOnly>
      <ChatWidget />
    </ClientOnly>
  </div>
</template>

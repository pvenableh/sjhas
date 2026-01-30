<script setup lang="ts">
// Fetch CMS data
const { data: homePage } = await useAsyncData('home-page', async () => {
  try {
    return await useHomePage()
  } catch (error) {
    console.error('Failed to fetch home page:', error)
    return null
  }
})

const { data: services } = await useAsyncData('services', async () => {
  try {
    return await useServices()
  } catch (error) {
    console.error('Failed to fetch services:', error)
    return null
  }
})

const { data: testimonials } = await useAsyncData('testimonials', async () => {
  try {
    return await useTestimonials(true)
  } catch (error) {
    console.error('Failed to fetch testimonials:', error)
    return null
  }
})

const { data: settings } = await useAsyncData('settings-contact', async () => {
  try {
    return await useSiteSettings()
  } catch (error) {
    console.error('Failed to fetch settings:', error)
    return null
  }
})

const config = useRuntimeConfig()

const aboutImageUrl = computed(() => {
  if (homePage.value?.about_image) {
    const imageId = typeof homePage.value.about_image === 'string'
      ? homePage.value.about_image
      : homePage.value.about_image.id
    return `${config.public.directusUrl}/assets/${imageId}`
  }
  return null
})

// SEO
useSeoMeta({
  title: 'SJHAS, Inc. - Accounting & Tax Services in Ithaca, NY',
  description: 'SJHAS Inc. provides personalized tax returns, accounting, and payroll services throughout Ithaca, Elmira, and Central New York since 2000.',
})
</script>

<template>
  <div>
    <HomeHeroSection
      :title="homePage?.hero_title"
      :subtitle="homePage?.hero_subtitle"
      :cta-text="homePage?.hero_cta_text"
      :cta-link="homePage?.hero_cta_link"
    />

    <HomeServicesSection
      :title="homePage?.services_title"
      :services="services || undefined"
    />

    <HomeAboutSection
      :title="homePage?.about_title"
      :content="homePage?.about_content"
      :image="aboutImageUrl || undefined"
    />

    <HomeTestimonialsSection
      :title="homePage?.testimonials_title"
      :testimonials="testimonials || undefined"
    />

    <HomeContactSection
      :title="homePage?.contact_title"
      :settings="settings"
    />
  </div>
</template>

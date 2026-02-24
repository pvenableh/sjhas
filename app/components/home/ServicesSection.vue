<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { Service } from '~/types/directus'

const props = defineProps<{
  title?: string
  subtitle?: string
  services?: Service[]
  bookingUrl?: string
}>()

const { trackCtaClick, trackBookingClick } = useAnalytics()

const hasContent = computed(() => props.title || props.subtitle || props.services?.length)

const sectionRef = ref<HTMLElement | null>(null)

onMounted(() => {
  if (import.meta.client && sectionRef.value) {
    gsap.registerPlugin(ScrollTrigger)

    const header = sectionRef.value.querySelector('.section-header')
    if (header) {
      gsap.fromTo(
        header,
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
          force3D: true,
          scrollTrigger: {
            trigger: sectionRef.value,
            start: 'top bottom',
          },
        }
      )
    }

    const grid = sectionRef.value.querySelector('.services-grid')
    const cards = sectionRef.value.querySelectorAll('.service-card')
    if (grid && cards.length) {
      gsap.fromTo(
        cards,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.07,
          ease: 'power3.out',
          force3D: true,
          scrollTrigger: {
            trigger: grid,
            start: 'top bottom',
          },
        }
      )
    }
  }
})
</script>

<template>
  <section
    v-if="hasContent"
    id="services"
    ref="sectionRef"
    class="py-28 lg:py-40 t-section"
  >
    <div class="container-wide section-padding">
      <!-- Section header -->
      <div class="section-header text-center max-w-2xl mx-auto mb-24">
        <div v-if="title" class="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full t-badge text-xs font-medium tracking-[0.1em] uppercase mb-8">
          <Icon name="lucide:briefcase" class="w-3.5 h-3.5" />
          <span>What We Do</span>
        </div>
        <h2 v-if="title" class="text-3xl sm:text-4xl lg:text-[2.75rem] t-heading t-text mb-6 tracking-tight leading-[1.15]">
          {{ title }}
        </h2>
        <p v-if="subtitle" class="text-lg t-text-secondary leading-[1.7]">
          {{ subtitle }}
        </p>
      </div>

      <!-- Services grid -->
      <div v-if="services?.length" class="services-grid grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
        <div
          v-for="(service, index) in services"
          :key="service.title"
          class="service-card group relative rounded-2xl p-10 lg:p-12 border t-section-card t-section-card-hover hover:shadow-lg transition-all duration-500"
        >
          <!-- Icon -->
          <div class="w-14 h-14 rounded-2xl t-icon-box t-icon-box-group-hover flex items-center justify-center mb-8 transition-colors duration-300">
            <Icon
              :name="(service.icon as string) || 'lucide:file-text'"
              class="w-7 h-7 t-icon-color-group-hover transition-colors duration-300"
            />
          </div>

          <!-- Content -->
          <h3 class="text-xl font-medium t-heading t-text mb-4 tracking-wide">
            {{ service.title }}
          </h3>
          <p class="text-sm t-text-secondary mb-8 leading-[1.8]">
            {{ service.short_description }}
          </p>

          <!-- CTA -->
          <NuxtLink
            v-if="service.cta_link"
            :to="service.cta_link"
            class="inline-flex items-center gap-2.5 t-text-accent font-medium text-sm tracking-wide t-link transition-colors"
            @click="trackCtaClick(service.cta_text || 'Learn more', service.cta_link, 'services_section')"
          >
            {{ service.cta_text || 'Learn more' }}
            <Icon name="lucide:arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </NuxtLink>

          <!-- Decorative number -->
          <div class="absolute top-8 right-8 text-6xl font-extralight t-heading transition-colors duration-300 select-none" style="color: var(--theme-border-light);">
            {{ String(index + 1).padStart(2, '0') }}
          </div>
        </div>
      </div>

      <!-- Bottom CTA -->
      <div v-if="bookingUrl" class="mt-20 text-center">
        <Button as="a" :href="bookingUrl" target="_blank" size="lg" class="tracking-wide" @click="trackBookingClick('services_section')">
          Book an Appointment
          <Icon name="lucide:calendar" class="w-4 h-4" />
        </Button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { Service } from '~/types/directus'

const props = defineProps<{
  title?: string
  services?: Service[]
}>()

// Default services if none provided from CMS
const defaultServices: Partial<Service>[] = [
  {
    title: 'Personal Tax Preparation',
    short_description: 'We offer one on one help to make sure you have a Personal Tax Strategy and are prepared for the tax year.',
    icon: 'lucide:user',
    cta_text: 'Contact us for a quote',
    cta_link: '#contact',
  },
  {
    title: 'Business Tax Preparation',
    short_description: 'We offer Business Tax Strategy & Preparation (C-Corp, S-Corp, Partnership) and support for Legal Incorporation & Organization Services.',
    icon: 'lucide:building-2',
    cta_text: 'Contact us for a quote',
    cta_link: '#contact',
  },
  {
    title: 'Payroll Services',
    short_description: 'Have payroll processing needs? Let us take care of them, freeing up your time for more important matters.',
    icon: 'lucide:wallet',
    cta_text: 'Contact us for a quote',
    cta_link: '#contact',
  },
]

const displayServices = computed(() => props.services?.length ? props.services : defaultServices)

const sectionRef = ref<HTMLElement | null>(null)

onMounted(() => {
  if (import.meta.client && sectionRef.value) {
    gsap.registerPlugin(ScrollTrigger)

    gsap.fromTo(
      sectionRef.value.querySelector('.section-header'),
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.value,
          start: 'top 80%',
        },
      }
    )

    gsap.fromTo(
      sectionRef.value.querySelectorAll('.service-card'),
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.15,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.value.querySelector('.services-grid'),
          start: 'top 80%',
        },
      }
    )
  }
})
</script>

<template>
  <section
    id="services"
    ref="sectionRef"
    class="py-20 lg:py-28 t-section"
  >
    <div class="container-wide section-padding">
      <!-- Section header -->
      <div class="section-header text-center max-w-2xl mx-auto mb-16">
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full t-badge text-sm font-medium mb-4">
          <Icon name="lucide:briefcase" class="w-4 h-4" />
          <span>What We Do</span>
        </div>
        <h2 class="text-3xl sm:text-4xl t-heading t-text mb-4">
          {{ title || 'Our Services' }}
        </h2>
        <p class="text-lg t-text-secondary">
          Comprehensive financial services tailored to your personal and business needs.
        </p>
      </div>

      <!-- Services grid -->
      <div class="services-grid grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        <div
          v-for="(service, index) in displayServices"
          :key="service.title"
          class="service-card group relative rounded-2xl p-8 border t-section-card t-section-card-hover hover:shadow-lg transition-all duration-300"
        >
          <!-- Icon -->
          <div class="w-14 h-14 rounded-xl t-icon-box t-icon-box-group-hover flex items-center justify-center mb-6 transition-colors duration-300">
            <Icon
              :name="(service.icon as string) || 'lucide:file-text'"
              class="w-7 h-7 t-icon-color-group-hover transition-colors duration-300"
            />
          </div>

          <!-- Content -->
          <h3 class="text-xl font-semibold t-text mb-3">
            {{ service.title }}
          </h3>
          <p class="t-text-secondary mb-6 leading-relaxed">
            {{ service.short_description }}
          </p>

          <!-- CTA -->
          <NuxtLink
            v-if="service.cta_link"
            :to="service.cta_link"
            class="inline-flex items-center gap-2 t-text-accent font-medium t-link transition-colors"
          >
            {{ service.cta_text || 'Learn more' }}
            <Icon name="lucide:arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </NuxtLink>

          <!-- Decorative number -->
          <div class="absolute top-6 right-6 text-6xl font-bold transition-colors duration-300 select-none" style="color: var(--theme-border-light);">
            {{ String(index + 1).padStart(2, '0') }}
          </div>
        </div>
      </div>

      <!-- Bottom CTA -->
      <div class="mt-12 text-center">
        <Button as="a" href="https://app.reclaim.ai/m/sjhas/quick-meeting" target="_blank" size="lg">
          Book an Appointment
          <Icon name="lucide:calendar" class="w-5 h-5" />
        </Button>
      </div>
    </div>
  </section>
</template>

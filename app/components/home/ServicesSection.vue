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
        duration: 0.7,
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
        duration: 0.6,
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
    class="py-24 lg:py-32 t-section"
  >
    <div class="container-wide section-padding">
      <!-- Section header -->
      <div class="section-header text-center max-w-2xl mx-auto mb-20">
        <div class="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full t-badge text-xs font-medium tracking-widest uppercase mb-6">
          <Icon name="lucide:briefcase" class="w-3.5 h-3.5" />
          <span>What We Do</span>
        </div>
        <h2 class="text-3xl sm:text-4xl lg:text-[2.75rem] t-heading t-text mb-5 tracking-tight">
          {{ title || 'Our Services' }}
        </h2>
        <p class="text-lg t-text-secondary leading-relaxed">
          Comprehensive financial services tailored to your personal and business needs.
        </p>
      </div>

      <!-- Services grid -->
      <div class="services-grid grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
        <div
          v-for="(service, index) in displayServices"
          :key="service.title"
          class="service-card group relative rounded-2xl p-10 border t-section-card t-section-card-hover hover:shadow-lg transition-all duration-500"
        >
          <!-- Icon -->
          <div class="w-14 h-14 rounded-xl t-icon-box t-icon-box-group-hover flex items-center justify-center mb-8 transition-colors duration-300">
            <Icon
              :name="(service.icon as string) || 'lucide:file-text'"
              class="w-7 h-7 t-icon-color-group-hover transition-colors duration-300"
            />
          </div>

          <!-- Content -->
          <h3 class="text-xl font-medium t-heading t-text mb-4 tracking-wide">
            {{ service.title }}
          </h3>
          <p class="t-text-secondary mb-8 leading-relaxed">
            {{ service.short_description }}
          </p>

          <!-- CTA -->
          <NuxtLink
            v-if="service.cta_link"
            :to="service.cta_link"
            class="inline-flex items-center gap-2 t-text-accent font-medium text-sm tracking-wide t-link transition-colors"
          >
            {{ service.cta_text || 'Learn more' }}
            <Icon name="lucide:arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </NuxtLink>

          <!-- Decorative number -->
          <div class="absolute top-8 right-8 text-6xl font-light t-heading transition-colors duration-300 select-none" style="color: var(--theme-border-light);">
            {{ String(index + 1).padStart(2, '0') }}
          </div>
        </div>
      </div>

      <!-- Bottom CTA -->
      <div class="mt-16 text-center">
        <Button as="a" href="https://app.reclaim.ai/m/sjhas/quick-meeting" target="_blank" size="lg" class="tracking-wide">
          Book an Appointment
          <Icon name="lucide:calendar" class="w-4 h-4" />
        </Button>
      </div>
    </div>
  </section>
</template>

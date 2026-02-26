<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const sectionRef = ref<HTMLElement | null>(null)

const quickLinks = [
  {
    title: 'Upload Files',
    description: 'Securely upload tax documents and financial records directly to our team.',
    icon: 'lucide:upload-cloud',
    href: '/upload',
    external: false,
  },
  {
    title: 'Client Portal',
    description: 'Access your account, view documents, and manage your financial information.',
    icon: 'lucide:layout-dashboard',
    href: 'https://sjhas.clientportal.com/',
    external: true,
  },
  {
    title: 'Services Questionnaire',
    description: 'Complete our questionnaire to help us prepare for your tax planning session.',
    icon: 'lucide:clipboard-list',
    href: '/tax-planning',
    external: false,
  },
]

onMounted(() => {
  if (import.meta.client && sectionRef.value) {
    gsap.registerPlugin(ScrollTrigger)

    const cards = sectionRef.value.querySelectorAll('.quick-access-card')
    if (cards.length) {
      gsap.fromTo(
        cards,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.08,
          ease: 'power3.out',
          force3D: true,
          scrollTrigger: {
            trigger: sectionRef.value,
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
    ref="sectionRef"
    class="py-16 lg:py-24 t-section-alt"
  >
    <div class="container-wide section-padding">
      <div class="grid sm:grid-cols-3 gap-5 lg:gap-8">
        <template v-for="link in quickLinks" :key="link.title">
          <a
            v-if="link.external"
            :href="link.href"
            target="_blank"
            rel="noopener noreferrer"
            class="quick-access-card group relative rounded-2xl p-8 lg:p-10 border t-section-card t-section-card-hover hover:shadow-lg transition-all duration-500"
          >
            <div class="w-12 h-12 rounded-2xl t-icon-box t-icon-box-group-hover flex items-center justify-center mb-6 transition-colors duration-300">
              <Icon
                :name="link.icon"
                class="w-6 h-6 t-icon-color-group-hover transition-colors duration-300"
              />
            </div>
            <h3 class="text-lg font-medium t-heading t-text mb-2 tracking-wide">
              {{ link.title }}
            </h3>
            <p class="text-sm t-text-secondary leading-[1.7]">
              {{ link.description }}
            </p>
            <div class="mt-5 inline-flex items-center gap-2 t-text-accent font-medium text-sm tracking-wide t-link transition-colors">
              Get Started
              <Icon name="lucide:arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </a>
          <NuxtLink
            v-else
            :to="link.href"
            class="quick-access-card group relative rounded-2xl p-8 lg:p-10 border t-section-card t-section-card-hover hover:shadow-lg transition-all duration-500"
          >
            <div class="w-12 h-12 rounded-2xl t-icon-box t-icon-box-group-hover flex items-center justify-center mb-6 transition-colors duration-300">
              <Icon
                :name="link.icon"
                class="w-6 h-6 t-icon-color-group-hover transition-colors duration-300"
              />
            </div>
            <h3 class="text-lg font-medium t-heading t-text mb-2 tracking-wide">
              {{ link.title }}
            </h3>
            <p class="text-sm t-text-secondary leading-[1.7]">
              {{ link.description }}
            </p>
            <div class="mt-5 inline-flex items-center gap-2 t-text-accent font-medium text-sm tracking-wide t-link transition-colors">
              Get Started
              <Icon name="lucide:arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </NuxtLink>
        </template>
      </div>
    </div>
  </section>
</template>

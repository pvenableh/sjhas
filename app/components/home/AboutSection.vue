<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const props = defineProps<{
  title?: string
  content?: string
  image?: string
}>()

const sectionRef = ref<HTMLElement | null>(null)

const defaultContent = `SJHAS Inc. has been providing clients personalized tax returns, accounting, and payroll services throughout Ithaca, Elmira, and the Central New York area since 2000.

With years of expansive financial knowledge, we are equipped to handle all of your accounting needs, no matter how complex. Whether you require assistance at the corporate or personal level, Stephen is ready to serve as your business consultant, financial and tax planner, payroll processor, and accounting advisor.`

onMounted(() => {
  if (import.meta.client && sectionRef.value) {
    gsap.registerPlugin(ScrollTrigger)

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.value,
        start: 'top 70%',
      },
    })

    tl.fromTo(
      sectionRef.value.querySelector('.about-image'),
      { opacity: 0, x: -50 },
      { opacity: 1, x: 0, duration: 0.7, ease: 'power2.out' }
    )
      .fromTo(
        sectionRef.value.querySelector('.about-content'),
        { opacity: 0, x: 50 },
        { opacity: 1, x: 0, duration: 0.7, ease: 'power2.out' },
        '-=0.4'
      )
  }
})
</script>

<template>
  <section
    id="about"
    ref="sectionRef"
    class="py-20 lg:py-28 t-section-alt"
  >
    <div class="container-wide section-padding">
      <div class="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <!-- Image -->
        <div class="about-image relative">
          <div class="relative aspect-[4/3] rounded-2xl overflow-hidden">
            <!-- Placeholder if no image -->
            <div
              v-if="!image"
              class="absolute inset-0 t-hero"
            >
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-center t-hero-text">
                  <Icon name="lucide:building-2" class="w-20 h-20 mx-auto mb-4 opacity-50" />
                  <p class="text-xl t-heading opacity-80">SJHAS, Inc.</p>
                </div>
              </div>
            </div>
            <img
              v-else
              :src="image"
              alt="About SJHAS Inc."
              class="w-full h-full object-cover"
            />

            <!-- Decorative elements -->
            <div class="absolute -bottom-6 -right-6 w-32 h-32 rounded-2xl -z-10" style="background-color: var(--theme-accent-primary); opacity: 0.6;" />
            <div class="absolute -top-6 -left-6 w-24 h-24 rounded-2xl -z-10" style="background-color: var(--theme-accent-secondary); opacity: 0.4;" />
          </div>

          <!-- Stats card -->
          <div class="absolute -bottom-8 left-8 right-8 lg:right-auto lg:w-64 t-bg-elevated rounded-xl t-shadow-lg p-6">
            <div class="grid grid-cols-2 gap-4">
              <div class="text-center">
                <p class="text-3xl font-bold t-text-accent">24+</p>
                <p class="text-sm t-text-muted">Years Experience</p>
              </div>
              <div class="text-center">
                <p class="text-3xl font-bold t-text-accent">100%</p>
                <p class="text-sm t-text-muted">Client Focus</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="about-content lg:pl-8">
          <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full t-badge text-sm font-medium mb-4">
            <Icon name="lucide:info" class="w-4 h-4" />
            <span>About Us</span>
          </div>

          <h2 class="text-3xl sm:text-4xl t-heading t-text mb-6">
            {{ title || 'SJHAS, Inc.' }}
          </h2>

          <div class="prose-accounting space-y-4 mb-8">
            <p
              v-for="(paragraph, i) in (content || defaultContent).split('\n\n')"
              :key="i"
              class="t-text-secondary leading-relaxed"
            >
              {{ paragraph }}
            </p>
          </div>

          <!-- Features list -->
          <div class="space-y-3 mb-8">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg t-icon-box flex items-center justify-center">
                <Icon name="lucide:check" class="w-4 h-4" />
              </div>
              <span class="t-text-secondary">Personal & Business Tax Services</span>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg t-icon-box flex items-center justify-center">
                <Icon name="lucide:check" class="w-4 h-4" />
              </div>
              <span class="t-text-secondary">Comprehensive Payroll Processing</span>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg t-icon-box flex items-center justify-center">
                <Icon name="lucide:check" class="w-4 h-4" />
              </div>
              <span class="t-text-secondary">Financial Planning & Consulting</span>
            </div>
          </div>

          <Button as="a" href="#contact">
            Get in Touch
            <Icon name="lucide:arrow-right" class="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  </section>
</template>

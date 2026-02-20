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

const defaultContent = `Stephen J. Hoffman has been providing clients personalized tax returns, accounting, and payroll services throughout Ithaca, Elmira, and the Central New York area since 2000.

With years of expansive financial knowledge, he is equipped to handle all of your accounting needs, no matter how complex. Whether you require assistance at the corporate or personal level, Stephen is ready to serve as your business consultant, financial and tax planner, payroll processor, and accounting advisor.`

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
      { opacity: 1, x: 0, duration: 0.8, ease: 'power2.out' }
    )
      .fromTo(
        sectionRef.value.querySelector('.about-content'),
        { opacity: 0, x: 50 },
        { opacity: 1, x: 0, duration: 0.8, ease: 'power2.out' },
        '-=0.4'
      )
  }
})
</script>

<template>
  <section
    id="about"
    ref="sectionRef"
    class="py-24 lg:py-32 t-section-alt"
  >
    <div class="container-wide section-padding">
      <div class="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
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
                  <Icon name="lucide:building-2" class="w-20 h-20 mx-auto mb-4 opacity-40" />
                  <p class="text-xl t-heading opacity-70 tracking-wider">SJHAS, Inc.</p>
                </div>
              </div>
            </div>
            <img
              v-else
              :src="image"
              alt="About SJHAS Inc."
              class="w-full h-full object-cover"
            />

            <!-- Refined decorative elements -->
            <div class="absolute -bottom-5 -right-5 w-28 h-28 rounded-2xl -z-10" style="background-color: var(--theme-accent-primary); opacity: 0.15;" />
            <div class="absolute -top-5 -left-5 w-20 h-20 rounded-2xl -z-10" style="background-color: var(--theme-accent-secondary); opacity: 0.1;" />
          </div>

          <!-- Stats card -->
          <div class="absolute -bottom-8 left-8 right-8 lg:right-auto lg:w-64 t-bg-elevated rounded-xl t-shadow-lg p-7">
            <div class="grid grid-cols-2 gap-4">
              <div class="text-center">
                <p class="text-3xl font-light t-heading t-text-accent">26+</p>
                <p class="text-xs t-text-muted tracking-wider uppercase mt-1">Years Experience</p>
              </div>
              <div class="text-center">
                <p class="text-3xl font-light t-heading t-text-accent">100%</p>
                <p class="text-xs t-text-muted tracking-wider uppercase mt-1">Client Focus</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="about-content lg:pl-8">
          <div class="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full t-badge text-xs font-medium tracking-widest uppercase mb-6">
            <Icon name="lucide:info" class="w-3.5 h-3.5" />
            <span>About Us</span>
          </div>

          <h2 class="text-3xl sm:text-4xl lg:text-[2.75rem] t-heading t-text mb-7 tracking-tight">
            {{ title || 'SJHAS, Inc.' }}
          </h2>

          <div class="prose-accounting space-y-5 mb-10">
            <p
              v-for="(paragraph, i) in (content || defaultContent).split('\n\n')"
              :key="i"
              class="t-text-secondary leading-[1.8]"
            >
              {{ paragraph }}
            </p>
          </div>

          <!-- Features list -->
          <div class="space-y-4 mb-10">
            <div class="flex items-center gap-4">
              <div class="w-8 h-8 rounded-lg t-icon-box flex items-center justify-center flex-shrink-0">
                <Icon name="lucide:check" class="w-4 h-4" />
              </div>
              <span class="t-text-secondary">Personal & Business Tax Services</span>
            </div>
            <div class="flex items-center gap-4">
              <div class="w-8 h-8 rounded-lg t-icon-box flex items-center justify-center flex-shrink-0">
                <Icon name="lucide:check" class="w-4 h-4" />
              </div>
              <span class="t-text-secondary">Comprehensive Payroll Processing</span>
            </div>
            <div class="flex items-center gap-4">
              <div class="w-8 h-8 rounded-lg t-icon-box flex items-center justify-center flex-shrink-0">
                <Icon name="lucide:check" class="w-4 h-4" />
              </div>
              <span class="t-text-secondary">Financial Planning & Consulting</span>
            </div>
          </div>

          <Button as="a" href="#contact" class="tracking-wide">
            Get in Touch
            <Icon name="lucide:arrow-right" class="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  </section>
</template>

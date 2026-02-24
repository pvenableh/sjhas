<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { gsap } from 'gsap'

const { trackCtaClick, trackBookingClick } = useAnalytics()

const props = defineProps<{
  title?: string
  subtitle?: string
  ctaText?: string
  ctaLink?: string
  badgeText?: string
  bookingUrl?: string
}>()

const heroRef = ref<HTMLElement | null>(null)

onMounted(() => {
  if (heroRef.value) {
    const tl = gsap.timeline()

    tl.fromTo(
      heroRef.value.querySelector('.hero-badge'),
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
    )
      .fromTo(
        heroRef.value.querySelector('.hero-title'),
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
        '-=0.2'
      )
      .fromTo(
        heroRef.value.querySelector('.hero-subtitle'),
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' },
        '-=0.4'
      )
      .fromTo(
        heroRef.value.querySelector('.hero-cta'),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
        '-=0.3'
      )
      .fromTo(
        heroRef.value.querySelector('.hero-visual'),
        { opacity: 0, scale: 0.97 },
        { opacity: 1, scale: 1, duration: 0.9, ease: 'power2.out' },
        '-=0.5'
      )
  }
})
</script>

<template>
  <section
    ref="heroRef"
    class="relative min-h-[92vh] flex items-center overflow-hidden t-section"
  >
    <!-- Subtle gradient background -->
    <div class="absolute inset-0" style="background: linear-gradient(170deg, var(--theme-bg-secondary) 0%, var(--theme-bg-elevated) 40%, var(--theme-bg-secondary) 100%);" />

    <!-- Refined decorative line -->
    <div class="absolute top-0 left-0 right-0 h-px" style="background: linear-gradient(to right, transparent, var(--theme-border-primary), transparent);" />

    <div class="relative container-wide section-padding py-28 lg:py-40">
      <div class="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        <!-- Content -->
        <div class="max-w-xl">
          <div v-if="badgeText" class="hero-badge inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full t-badge text-xs font-medium tracking-[0.1em] uppercase mb-10">
            <Icon name="lucide:building-2" class="w-3.5 h-3.5" />
            <span>{{ badgeText }}</span>
          </div>

          <h1 v-if="title" class="hero-title text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-[4rem] t-heading t-text leading-[1.08] tracking-tight mb-8">
            {{ title }}
          </h1>

          <p v-if="subtitle" class="hero-subtitle text-lg sm:text-xl t-text-secondary leading-[1.7] mb-12 max-w-md">
            {{ subtitle }}
          </p>

          <div class="hero-cta flex flex-col sm:flex-row gap-4">
            <Button
              v-if="ctaText || ctaLink || bookingUrl"
              as="a"
              :href="ctaLink || bookingUrl"
              target="_blank"
              size="lg"
              class="group"
              @click="trackBookingClick('hero')"
            >
              {{ ctaText || 'Book a Consultation' }}
              <Icon name="lucide:arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              as="a"
              href="#services"
              variant="secondary"
              size="lg"
              @click="trackCtaClick('Our Services', '#services', 'hero')"
            >
              Our Services
            </Button>
          </div>
        </div>

        <!-- Visual -->
        <div class="hero-visual relative">
          <div class="relative aspect-square max-w-lg mx-auto">
            <!-- Subtle decorative glow -->
            <div class="absolute -top-8 -right-8 w-80 h-80 rounded-full blur-[80px]" style="background-color: var(--theme-accent-primary); opacity: 0.08;" />
            <div class="absolute -bottom-8 -left-8 w-72 h-72 rounded-full blur-[80px]" style="background-color: var(--theme-accent-secondary); opacity: 0.06;" />

            <!-- Main card -->
            <div class="relative t-bg-elevated rounded-3xl t-shadow-lg border t-border p-12 transform rotate-1 hover:rotate-0 transition-all duration-700 ease-out">
              <div class="flex items-center gap-5 mb-10">
                <div class="w-16 h-16 rounded-2xl t-icon-box flex items-center justify-center">
                  <Icon name="lucide:calculator" class="w-7 h-7" />
                </div>
                <div>
                  <h3 class="font-medium t-text tracking-wide">Expert Tax Planning</h3>
                  <p class="text-sm t-text-muted mt-1">Personalized strategies</p>
                </div>
              </div>

              <div class="space-y-6">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-xl t-icon-box flex items-center justify-center flex-shrink-0">
                    <Icon name="lucide:check" class="w-5 h-5" />
                  </div>
                  <span class="t-text-secondary">Personal Tax Preparation</span>
                </div>
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-xl t-icon-box flex items-center justify-center flex-shrink-0">
                    <Icon name="lucide:check" class="w-5 h-5" />
                  </div>
                  <span class="t-text-secondary">Business Tax Strategy</span>
                </div>
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-xl t-icon-box flex items-center justify-center flex-shrink-0">
                    <Icon name="lucide:check" class="w-5 h-5" />
                  </div>
                  <span class="t-text-secondary">Payroll Processing</span>
                </div>
              </div>
            </div>

            <!-- Floating badge -->
            <div class="absolute -bottom-6 -left-6 t-bg-elevated rounded-2xl t-shadow-lg border t-border p-6 transform -rotate-2">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-full t-icon-box flex items-center justify-center">
                  <Icon name="lucide:star" class="w-6 h-6" />
                </div>
                <div>
                  <p class="text-2xl font-light t-heading t-text">26+</p>
                  <p class="text-xs t-text-muted tracking-[0.1em] uppercase">Years Experience</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

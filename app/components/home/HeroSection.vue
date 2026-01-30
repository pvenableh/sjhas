<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { gsap } from 'gsap'

const props = defineProps<{
  title?: string
  subtitle?: string
  ctaText?: string
  ctaLink?: string
}>()

const heroRef = ref<HTMLElement | null>(null)

onMounted(() => {
  if (heroRef.value) {
    const tl = gsap.timeline()

    tl.fromTo(
      heroRef.value.querySelector('.hero-badge'),
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
    )
      .fromTo(
        heroRef.value.querySelector('.hero-title'),
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' },
        '-=0.2'
      )
      .fromTo(
        heroRef.value.querySelector('.hero-subtitle'),
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
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
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out' },
        '-=0.5'
      )
  }
})
</script>

<template>
  <section
    ref="heroRef"
    class="relative min-h-[90vh] flex items-center overflow-hidden"
  >
    <!-- Background pattern -->
    <div class="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-primary-50/30" />
    <div class="absolute inset-0 opacity-[0.03]" style="background-image: url(&quot;data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E&quot;)" />

    <div class="relative container-wide section-padding py-20 lg:py-32">
      <div class="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <!-- Content -->
        <div class="max-w-xl">
          <div class="hero-badge inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6">
            <Icon name="lucide:building-2" class="w-4 h-4" />
            <span>Serving Central NY Since 2000</span>
          </div>

          <h1 class="hero-title text-4xl sm:text-5xl lg:text-6xl font-serif text-slate-900 leading-tight mb-6">
            {{ title || 'It\'s not just about the numbers.' }}
          </h1>

          <p class="hero-subtitle text-lg sm:text-xl text-slate-600 leading-relaxed mb-8">
            {{ subtitle || 'Personalized tax returns, accounting, and payroll services that make a difference for your business and personal finances.' }}
          </p>

          <div class="hero-cta flex flex-col sm:flex-row gap-4">
            <Button
              as="a"
              :href="ctaLink || 'https://app.reclaim.ai/m/sjhas/quick-meeting'"
              target="_blank"
              size="lg"
              class="group"
            >
              {{ ctaText || 'Book a Consultation' }}
              <Icon name="lucide:arrow-right" class="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              as="a"
              href="#services"
              variant="secondary"
              size="lg"
            >
              Our Services
            </Button>
          </div>
        </div>

        <!-- Visual -->
        <div class="hero-visual relative">
          <div class="relative aspect-square max-w-lg mx-auto">
            <!-- Decorative circles -->
            <div class="absolute -top-4 -right-4 w-72 h-72 bg-primary-200/40 rounded-full blur-3xl" />
            <div class="absolute -bottom-4 -left-4 w-64 h-64 bg-accent-200/40 rounded-full blur-3xl" />

            <!-- Main card -->
            <div class="relative bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 transform rotate-2 hover:rotate-0 transition-transform duration-500">
              <div class="flex items-center gap-4 mb-6">
                <div class="w-16 h-16 rounded-xl bg-primary-100 flex items-center justify-center">
                  <Icon name="lucide:calculator" class="w-8 h-8 text-primary-600" />
                </div>
                <div>
                  <h3 class="font-semibold text-slate-900">Expert Tax Planning</h3>
                  <p class="text-sm text-slate-500">Personalized strategies</p>
                </div>
              </div>

              <div class="space-y-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <Icon name="lucide:check" class="w-5 h-5 text-green-600" />
                  </div>
                  <span class="text-slate-700">Personal Tax Preparation</span>
                </div>
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <Icon name="lucide:check" class="w-5 h-5 text-green-600" />
                  </div>
                  <span class="text-slate-700">Business Tax Strategy</span>
                </div>
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <Icon name="lucide:check" class="w-5 h-5 text-green-600" />
                  </div>
                  <span class="text-slate-700">Payroll Processing</span>
                </div>
              </div>
            </div>

            <!-- Floating badge -->
            <div class="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg border border-slate-200 p-4 transform -rotate-3">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-full bg-accent-100 flex items-center justify-center">
                  <Icon name="lucide:star" class="w-6 h-6 text-accent-600" />
                </div>
                <div>
                  <p class="text-2xl font-bold text-slate-900">24+</p>
                  <p class="text-sm text-slate-500">Years Experience</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

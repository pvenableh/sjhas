<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const props = defineProps<{
  title?: string
  content?: string
  image?: string
  features?: string[]
  ctaText?: string
  ctaLink?: string
}>()

const sectionRef = ref<HTMLElement | null>(null)

const hasContent = computed(() => props.title || props.content || props.image || props.features?.length)

onMounted(() => {
  if (import.meta.client && sectionRef.value) {
    gsap.registerPlugin(ScrollTrigger)

    const image = sectionRef.value.querySelector('.about-image')
    const content = sectionRef.value.querySelector('.about-content')
    if (!image && !content) return

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.value,
        start: 'top bottom',
      },
    })

    if (image) {
      tl.fromTo(image, { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out', force3D: true })
    }
    if (content) {
      tl.fromTo(content, { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out', force3D: true }, '-=0.4')
    }
  }
})
</script>

<template>
  <section
    v-if="hasContent"
    id="about"
    ref="sectionRef"
    class="py-28 lg:py-40 t-section-alt"
  >
    <div class="container-wide section-padding">
      <div class="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        <!-- Image -->
        <div class="about-image relative">
          <div class="relative aspect-[4/3] rounded-3xl overflow-hidden">
            <!-- Placeholder if no image -->
            <div
              v-if="!image"
              class="absolute inset-0 t-hero"
            >
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-center t-hero-text">
                  <Icon name="lucide:building-2" class="w-20 h-20 mx-auto mb-5 opacity-40" />
                  <p class="text-xl t-heading opacity-70 tracking-[0.08em]">SJHAS, Inc.</p>
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
            <div class="absolute -bottom-5 -right-5 w-28 h-28 rounded-3xl -z-10" style="background-color: var(--theme-accent-primary); opacity: 0.12;" />
            <div class="absolute -top-5 -left-5 w-20 h-20 rounded-2xl -z-10" style="background-color: var(--theme-accent-secondary); opacity: 0.08;" />
          </div>

          <!-- Stats card -->
          <div class="absolute -bottom-8 left-8 right-8 lg:right-auto lg:w-64 t-bg-elevated rounded-2xl t-shadow-lg p-8">
            <div class="grid grid-cols-2 gap-4">
              <div class="text-center">
                <p class="text-3xl font-extralight t-heading t-text-accent">26+</p>
                <p class="text-[10px] t-text-muted tracking-[0.1em] uppercase mt-1.5">Years Experience</p>
              </div>
              <div class="text-center">
                <p class="text-3xl font-extralight t-heading t-text-accent">100%</p>
                <p class="text-[10px] t-text-muted tracking-[0.1em] uppercase mt-1.5">Client Focus</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="about-content lg:pl-4">
          <div class="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full t-badge text-xs font-medium tracking-[0.1em] uppercase mb-8">
            <Icon name="lucide:info" class="w-3.5 h-3.5" />
            <span>About Us</span>
          </div>

          <h2 v-if="title" class="text-3xl sm:text-4xl lg:text-[2.75rem] t-heading t-text mb-8 tracking-tight leading-[1.15]">
            {{ title }}
          </h2>

          <div v-if="content" class="prose-accounting space-y-5 mb-12">
            <p
              v-for="(paragraph, i) in content.split('\n\n')"
              :key="i"
              class="t-text-secondary leading-[1.8] text-[0.95rem]"
            >
              {{ paragraph }}
            </p>
          </div>

          <!-- Features list -->
          <div v-if="features?.length" class="space-y-5 mb-12">
            <div
              v-for="(feature, i) in features"
              :key="i"
              class="flex items-center gap-4"
            >
              <div class="w-9 h-9 rounded-xl t-icon-box flex items-center justify-center flex-shrink-0">
                <Icon name="lucide:check" class="w-4 h-4" />
              </div>
              <span class="t-text-secondary text-sm tracking-wide">{{ feature }}</span>
            </div>
          </div>

          <Button v-if="ctaText || ctaLink" as="a" :href="ctaLink || '#contact'" class="tracking-wide">
            {{ ctaText || 'Get in Touch' }}
            <Icon name="lucide:arrow-right" class="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  </section>
</template>

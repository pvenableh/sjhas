<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { Testimonial } from '~/types/directus'

const props = defineProps<{
  title?: string
  subtitle?: string
  testimonials?: Testimonial[]
}>()

const hasContent = computed(() => props.title || props.subtitle || props.testimonials?.length)

const sectionRef = ref<HTMLElement | null>(null)

onMounted(() => {
  if (import.meta.client && sectionRef.value) {
    gsap.registerPlugin(ScrollTrigger)

    const carousel = sectionRef.value.querySelector('.testimonials-carousel')
    if (carousel) {
      gsap.fromTo(
        carousel,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
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
    v-if="hasContent"
    ref="sectionRef"
    class="py-28 lg:py-40 t-hero t-force-dark relative overflow-hidden"
  >
    <!-- Subtle background texture -->
    <div class="absolute inset-0 opacity-[0.06]">
      <div class="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px]" style="background-color: var(--theme-hero-text); opacity: 0.2;" />
      <div class="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-[120px]" style="background-color: var(--theme-accent-primary); opacity: 0.2;" />
    </div>

    <div class="relative container-wide section-padding">
      <!-- Section header -->
      <div class="text-center max-w-2xl mx-auto mb-24">
        <div class="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full t-hero-badge text-xs font-medium tracking-[0.1em] uppercase mb-8">
          <Icon name="lucide:message-square-quote" class="w-3.5 h-3.5" />
          <span>Testimonials</span>
        </div>
        <h2 v-if="title" class="text-3xl sm:text-4xl lg:text-[2.75rem] t-heading t-hero-text mb-6 tracking-tight leading-[1.15]">
          {{ title }}
        </h2>
        <p v-if="subtitle" class="text-lg t-hero-text-secondary leading-[1.7]">
          {{ subtitle }}
        </p>
      </div>

      <!-- Testimonials Carousel -->
      <div v-if="testimonials?.length" class="testimonials-carousel max-w-4xl mx-auto">
        <Carousel class="w-full" :opts="{ loop: true }">
          <CarouselContent class="pt-8">
            <CarouselItem v-for="testimonial in testimonials" :key="testimonial.id">
              <div
                class="relative t-bg-elevated rounded-3xl p-10 md:p-16 t-shadow-lg"
              >
                <!-- Quote icon -->
                <div class="absolute -top-6 left-10 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style="background-color: var(--theme-accent-primary);">
                  <Icon name="lucide:quote" class="w-6 h-6" style="color: var(--theme-text-inverse);" />
                </div>

                <!-- Quote -->
                <blockquote class="text-lg md:text-xl t-text-secondary leading-[1.85] mb-12 italic">
                  "{{ testimonial.quote }}"
                </blockquote>

                <!-- Divider -->
                <div class="w-16 h-px mb-8" style="background-color: var(--theme-accent-primary); opacity: 0.3;" />

                <!-- Author -->
                <div class="flex items-center gap-5">
                  <div
                    v-if="testimonial.author_image"
                    class="w-14 h-14 rounded-full overflow-hidden"
                  >
                    <img
                      :src="typeof testimonial.author_image === 'string' ? testimonial.author_image : ''"
                      :alt="testimonial.author_name"
                      class="w-full h-full object-cover"
                    />
                  </div>
                  <div
                    v-else
                    class="w-14 h-14 rounded-full t-icon-box flex items-center justify-center"
                  >
                    <span class="text-xl t-heading">
                      {{ testimonial.author_name?.charAt(0) }}
                    </span>
                  </div>
                  <div>
                    <p class="font-medium t-text tracking-wide">{{ testimonial.author_name }}</p>
                    <p v-if="testimonial.author_title" class="text-sm t-text-muted tracking-wide mt-0.5">
                      {{ testimonial.author_title }}
                    </p>
                  </div>
                </div>

                <!-- Decorative stars -->
                <div class="absolute top-12 right-12 flex gap-1.5">
                  <Icon
                    v-for="i in 5"
                    :key="i"
                    name="lucide:star"
                    class="w-4 h-4 t-text-accent"
                    style="fill: var(--theme-accent-primary);"
                  />
                </div>
              </div>
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </div>
  </section>
</template>

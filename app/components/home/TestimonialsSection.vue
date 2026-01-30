<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { Testimonial } from '~/types/directus'

const props = defineProps<{
  title?: string
  testimonials?: Testimonial[]
}>()

const defaultTestimonials: Partial<Testimonial>[] = [
  {
    quote: 'Stephen was the accountant for the previous owners of our realty co. We "inherited" him and we are so happy that we did! He does all of our tax filings for our property management/real estate corp. and our personal taxes. He\'s extremely honest and we have enjoyed working with him for over 10 years now. But, he has always taken a genuine interest as our accountant. We appreciate his knowledge and skill.',
    author_name: 'MH',
    author_title: 'Realtor',
    featured: true,
  },
]

const displayTestimonials = computed(() =>
  props.testimonials?.length ? props.testimonials : defaultTestimonials
)

const sectionRef = ref<HTMLElement | null>(null)

onMounted(() => {
  if (import.meta.client && sectionRef.value) {
    gsap.registerPlugin(ScrollTrigger)

    gsap.fromTo(
      sectionRef.value.querySelector('.testimonial-card'),
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.value,
          start: 'top 70%',
        },
      }
    )
  }
})
</script>

<template>
  <section
    ref="sectionRef"
    class="py-20 lg:py-28 t-hero relative overflow-hidden"
  >
    <!-- Background pattern -->
    <div class="absolute inset-0 opacity-10">
      <div class="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl" style="background-color: var(--theme-hero-text); opacity: 0.3;" />
      <div class="absolute bottom-0 right-1/4 w-80 h-80 rounded-full blur-3xl" style="background-color: var(--theme-accent-primary); opacity: 0.3;" />
    </div>

    <div class="relative container-wide section-padding">
      <!-- Section header -->
      <div class="text-center max-w-2xl mx-auto mb-16">
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full t-hero-badge text-sm font-medium mb-4">
          <Icon name="lucide:message-square-quote" class="w-4 h-4" />
          <span>Testimonials</span>
        </div>
        <h2 class="text-3xl sm:text-4xl t-heading t-hero-text mb-4">
          {{ title || 'What Our Clients Say' }}
        </h2>
        <p class="text-lg t-hero-text-secondary">
          Don't just take our word for it — hear from our valued clients.
        </p>
      </div>

      <!-- Testimonials -->
      <div class="max-w-4xl mx-auto">
        <div
          v-for="testimonial in displayTestimonials"
          :key="testimonial.author_name"
          class="testimonial-card relative t-bg-elevated rounded-2xl p-8 md:p-12 t-shadow-lg"
        >
          <!-- Quote icon -->
          <div class="absolute -top-6 left-8 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style="background-color: var(--theme-accent-primary);">
            <Icon name="lucide:quote" class="w-6 h-6" style="color: var(--theme-text-inverse);" />
          </div>

          <!-- Quote -->
          <blockquote class="text-lg md:text-xl t-text-secondary leading-relaxed mb-8 italic">
            "{{ testimonial.quote }}"
          </blockquote>

          <!-- Author -->
          <div class="flex items-center gap-4">
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
              <span class="text-xl font-semibold">
                {{ testimonial.author_name?.charAt(0) }}
              </span>
            </div>
            <div>
              <p class="font-semibold t-text">{{ testimonial.author_name }}</p>
              <p v-if="testimonial.author_title" class="text-sm t-text-muted">
                {{ testimonial.author_title }}
              </p>
            </div>
          </div>

          <!-- Decorative stars -->
          <div class="absolute top-8 right-8 flex gap-1">
            <Icon
              v-for="i in 5"
              :key="i"
              name="lucide:star"
              class="w-5 h-5 t-text-accent"
              style="fill: var(--theme-accent-primary);"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

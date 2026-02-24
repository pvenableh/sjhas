<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { SiteSettings } from '~/types/directus'

const props = defineProps<{
  title?: string
  subtitle?: string
  settings?: SiteSettings | null
}>()

const contactInfo = computed(() => ({
  email: props.settings?.contact_email,
  phone: props.settings?.contact_phone,
  address: [
    props.settings?.address_line_1,
    props.settings?.address_line_2,
    props.settings?.city || props.settings?.state || props.settings?.zip_code
      ? `${props.settings?.city || ''}${props.settings?.city && props.settings?.state ? ', ' : ''}${props.settings?.state || ''} ${props.settings?.zip_code || ''}`.trim()
      : null,
  ].filter(Boolean) as string[],
}))

const hasContactInfo = computed(() => contactInfo.value.email || contactInfo.value.phone || contactInfo.value.address.length)

const hours = computed(() => {
  const s = props.settings
  if (!s?.hours_monday && !s?.hours_tuesday && !s?.hours_wednesday && !s?.hours_thursday && !s?.hours_friday) return []
  return [
    { day: 'Monday', hours: s?.hours_monday },
    { day: 'Tuesday', hours: s?.hours_tuesday },
    { day: 'Wednesday', hours: s?.hours_wednesday },
    { day: 'Thursday', hours: s?.hours_thursday },
    { day: 'Friday', hours: s?.hours_friday },
  ].filter(item => item.hours) as { day: string; hours: string }[]
})

const bookingUrl = computed(() => props.settings?.booking_url)

const sectionRef = ref<HTMLElement | null>(null)

onMounted(() => {
  if (import.meta.client && sectionRef.value) {
    gsap.registerPlugin(ScrollTrigger)

    gsap.fromTo(
      sectionRef.value.querySelectorAll('.contact-card'),
      { opacity: 0, y: 16 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.06,
        ease: 'power3.out',
        force3D: true,
        scrollTrigger: {
          trigger: sectionRef.value,
          start: 'top bottom',
        },
      }
    )
  }
})
</script>

<template>
  <section
    id="contact"
    ref="sectionRef"
    class="py-28 lg:py-40 t-section"
  >
    <div class="container-wide section-padding">
      <!-- Section header -->
      <div v-if="title || subtitle" class="text-center max-w-2xl mx-auto mb-24">
        <div v-if="title" class="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full t-badge text-xs font-medium tracking-[0.1em] uppercase mb-8">
          <Icon name="lucide:phone" class="w-3.5 h-3.5" />
          <span>Get in Touch</span>
        </div>
        <h2 v-if="title" class="text-3xl sm:text-4xl lg:text-[2.75rem] t-heading t-text mb-6 tracking-tight leading-[1.15]">
          {{ title }}
        </h2>
        <p v-if="subtitle" class="text-lg t-text-secondary leading-[1.7]">
          {{ subtitle }}
        </p>
      </div>

      <!-- Contact cards -->
      <div v-if="hasContactInfo" class="grid md:grid-cols-3 gap-8 lg:gap-10 max-w-5xl mx-auto">
        <!-- Email -->
        <a
          v-if="contactInfo.email"
          :href="`mailto:${contactInfo.email}`"
          class="contact-card group rounded-2xl p-10 lg:p-12 border t-section-card t-section-card-hover hover:shadow-lg transition-all duration-500 text-center"
        >
          <div class="w-16 h-16 rounded-2xl t-icon-box t-icon-box-group-hover flex items-center justify-center mx-auto mb-8 transition-colors duration-300">
            <Icon name="lucide:mail" class="w-7 h-7 t-icon-color-group-hover transition-colors duration-300" />
          </div>
          <h3 class="font-medium t-text mb-2.5 tracking-wide">Email</h3>
          <p class="t-text-accent font-medium text-sm tracking-wide">{{ contactInfo.email }}</p>
        </a>

        <!-- Phone -->
        <a
          v-if="contactInfo.phone"
          :href="`tel:${contactInfo.phone.replace(/[^0-9]/g, '')}`"
          class="contact-card group rounded-2xl p-10 lg:p-12 border t-section-card t-section-card-hover hover:shadow-lg transition-all duration-500 text-center"
        >
          <div class="w-16 h-16 rounded-2xl t-icon-box t-icon-box-group-hover flex items-center justify-center mx-auto mb-8 transition-colors duration-300">
            <Icon name="lucide:phone" class="w-7 h-7 t-icon-color-group-hover transition-colors duration-300" />
          </div>
          <h3 class="font-medium t-text mb-2.5 tracking-wide">Phone / Text</h3>
          <p class="t-text-accent font-medium text-sm tracking-wide">{{ contactInfo.phone }}</p>
        </a>

        <!-- Location -->
        <div v-if="contactInfo.address.length" class="contact-card rounded-2xl p-10 lg:p-12 border t-section-card text-center">
          <div class="w-16 h-16 rounded-2xl t-icon-box flex items-center justify-center mx-auto mb-8">
            <Icon name="lucide:map-pin" class="w-7 h-7" />
          </div>
          <h3 class="font-medium t-text mb-2.5 tracking-wide">Location</h3>
          <p class="t-text-secondary text-sm leading-[1.7]">
            <span v-for="(line, i) in contactInfo.address" :key="i" class="block">
              {{ line }}
            </span>
          </p>
        </div>
      </div>

      <!-- Hours & CTA -->
      <div v-if="hours.length || bookingUrl" class="mt-20 grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <!-- Hours -->
        <div v-if="hours.length" class="contact-card rounded-2xl p-10 lg:p-12 border t-section-card">
          <h3 class="font-medium t-text mb-8 flex items-center gap-2.5 tracking-wide">
            <Icon name="lucide:clock" class="w-5 h-5 t-text-accent" />
            Office Hours
          </h3>
          <div class="space-y-3">
            <div
              v-for="item in hours"
              :key="item.day"
              class="flex justify-between items-center py-3 border-b t-border last:border-0"
            >
              <span class="t-text-secondary text-sm tracking-wide">{{ item.day }}</span>
              <span
                class="text-sm tracking-wide"
                :class="item.hours === 'Closed'
                  ? 't-text-muted'
                  : 't-text font-medium'
                "
              >
                {{ item.hours }}
              </span>
            </div>
          </div>
        </div>

        <!-- Quick actions -->
        <div v-if="bookingUrl" class="contact-card t-hero rounded-2xl p-10 lg:p-12">
          <h3 class="font-medium mb-5 text-lg t-hero-text t-heading tracking-wide">Ready to Get Started?</h3>
          <p class="t-hero-text-secondary mb-10 leading-[1.7] text-sm">
            Book an appointment or upload your documents to get started with our services.
          </p>
          <div class="space-y-3">
            <Button
              as="a"
              :href="bookingUrl"
              target="_blank"
              variant="secondary"
              class="w-full justify-center tracking-wide"
            >
              <Icon name="lucide:calendar" class="w-4 h-4" />
              Book an Appointment
            </Button>
            <Button
              as-child
              class="w-full justify-center tracking-wide"
              style="background-color: rgba(255, 255, 255, 0.08); color: var(--theme-hero-text); border-color: rgba(255, 255, 255, 0.15);"
            >
              <NuxtLink to="/upload">
                <Icon name="lucide:upload" class="w-4 h-4" />
                Upload Documents
              </NuxtLink>
            </Button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

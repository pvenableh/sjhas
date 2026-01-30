<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { SiteSettings } from '~/types/directus'

const props = defineProps<{
  title?: string
  settings?: SiteSettings | null
}>()

const contactInfo = computed(() => ({
  email: props.settings?.contact_email || 'sjh@sjhas.com',
  phone: props.settings?.contact_phone || '(607) 216-8033',
  address: [
    props.settings?.address_line_1 || 'P.O. Box 6623',
    props.settings?.address_line_2 || '139 E. King Road',
    `${props.settings?.city || 'Ithaca'}, ${props.settings?.state || 'NY'} ${props.settings?.zip_code || '14850'}`,
  ].filter(Boolean),
}))

const hours = computed(() => [
  { day: 'Monday', hours: props.settings?.hours_monday || '1pm - 5pm' },
  { day: 'Tuesday', hours: props.settings?.hours_tuesday || '9am - 4:30pm' },
  { day: 'Wednesday', hours: props.settings?.hours_wednesday || 'Closed' },
  { day: 'Thursday', hours: props.settings?.hours_thursday || '9am - 4:30pm' },
  { day: 'Friday', hours: props.settings?.hours_friday || '9am - 1:30pm' },
])

const sectionRef = ref<HTMLElement | null>(null)

onMounted(() => {
  if (import.meta.client && sectionRef.value) {
    gsap.registerPlugin(ScrollTrigger)

    gsap.fromTo(
      sectionRef.value.querySelectorAll('.contact-card'),
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.1,
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
    id="contact"
    ref="sectionRef"
    class="py-20 lg:py-28 t-section"
  >
    <div class="container-wide section-padding">
      <!-- Section header -->
      <div class="text-center max-w-2xl mx-auto mb-16">
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full t-badge text-sm font-medium mb-4">
          <Icon name="lucide:phone" class="w-4 h-4" />
          <span>Get in Touch</span>
        </div>
        <h2 class="text-3xl sm:text-4xl t-heading t-text mb-4">
          {{ title || 'Contact Us' }}
        </h2>
        <p class="text-lg t-text-secondary">
          Ready to get started? We'd love to hear from you.
        </p>
      </div>

      <!-- Contact cards -->
      <div class="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
        <!-- Email -->
        <a
          :href="`mailto:${contactInfo.email}`"
          class="contact-card group rounded-2xl p-8 border t-section-card t-section-card-hover hover:shadow-lg transition-all duration-300 text-center"
        >
          <div class="w-16 h-16 rounded-2xl t-icon-box t-icon-box-group-hover flex items-center justify-center mx-auto mb-6 transition-colors duration-300">
            <Icon name="lucide:mail" class="w-8 h-8 t-icon-color-group-hover transition-colors duration-300" />
          </div>
          <h3 class="font-semibold t-text mb-2">Email</h3>
          <p class="t-text-accent font-medium">{{ contactInfo.email }}</p>
        </a>

        <!-- Phone -->
        <a
          :href="`tel:${contactInfo.phone.replace(/[^0-9]/g, '')}`"
          class="contact-card group rounded-2xl p-8 border t-section-card t-section-card-hover hover:shadow-lg transition-all duration-300 text-center"
        >
          <div class="w-16 h-16 rounded-2xl t-icon-box t-icon-box-group-hover flex items-center justify-center mx-auto mb-6 transition-colors duration-300">
            <Icon name="lucide:phone" class="w-8 h-8 t-icon-color-group-hover transition-colors duration-300" />
          </div>
          <h3 class="font-semibold t-text mb-2">Phone / Text</h3>
          <p class="t-text-accent font-medium">{{ contactInfo.phone }}</p>
        </a>

        <!-- Location -->
        <div class="contact-card rounded-2xl p-8 border t-section-card text-center">
          <div class="w-16 h-16 rounded-2xl t-icon-box flex items-center justify-center mx-auto mb-6">
            <Icon name="lucide:map-pin" class="w-8 h-8" />
          </div>
          <h3 class="font-semibold t-text mb-2">Location</h3>
          <p class="t-text-secondary">
            <span v-for="(line, i) in contactInfo.address" :key="i" class="block">
              {{ line }}
            </span>
          </p>
        </div>
      </div>

      <!-- Hours & CTA -->
      <div class="mt-16 grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <!-- Hours -->
        <div class="contact-card rounded-2xl p-8 border t-section-card">
          <h3 class="font-semibold t-text mb-6 flex items-center gap-2">
            <Icon name="lucide:clock" class="w-5 h-5 t-text-accent" />
            Office Hours
          </h3>
          <div class="space-y-3">
            <div
              v-for="item in hours"
              :key="item.day"
              class="flex justify-between items-center py-2 border-b t-border last:border-0"
            >
              <span class="t-text-secondary">{{ item.day }}</span>
              <span
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
        <div class="contact-card t-hero rounded-2xl p-8">
          <h3 class="font-semibold mb-4 text-lg t-hero-text">Ready to Get Started?</h3>
          <p class="t-hero-text-secondary mb-6">
            Book an appointment or upload your documents to get started with our services.
          </p>
          <div class="space-y-3">
            <Button
              as="a"
              href="https://app.reclaim.ai/m/sjhas/quick-meeting"
              target="_blank"
              variant="secondary"
              class="w-full justify-center"
            >
              <Icon name="lucide:calendar" class="w-4 h-4" />
              Book an Appointment
            </Button>
            <Button
              as="NuxtLink"
              to="/upload"
              class="w-full justify-center"
              style="background-color: rgba(255, 255, 255, 0.1); color: var(--theme-hero-text); border-color: rgba(255, 255, 255, 0.2);"
            >
              <Icon name="lucide:upload" class="w-4 h-4" />
              Upload Documents
            </Button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

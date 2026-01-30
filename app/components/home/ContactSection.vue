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
        duration: 0.6,
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
    class="py-24 lg:py-32 t-section"
  >
    <div class="container-wide section-padding">
      <!-- Section header -->
      <div class="text-center max-w-2xl mx-auto mb-20">
        <div class="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full t-badge text-xs font-medium tracking-widest uppercase mb-6">
          <Icon name="lucide:phone" class="w-3.5 h-3.5" />
          <span>Get in Touch</span>
        </div>
        <h2 class="text-3xl sm:text-4xl lg:text-[2.75rem] t-heading t-text mb-5 tracking-tight">
          {{ title || 'Contact Us' }}
        </h2>
        <p class="text-lg t-text-secondary leading-relaxed">
          Ready to get started? We'd love to hear from you.
        </p>
      </div>

      <!-- Contact cards -->
      <div class="grid md:grid-cols-3 gap-8 lg:gap-10 max-w-5xl mx-auto">
        <!-- Email -->
        <a
          :href="`mailto:${contactInfo.email}`"
          class="contact-card group rounded-2xl p-10 border t-section-card t-section-card-hover hover:shadow-lg transition-all duration-500 text-center"
        >
          <div class="w-16 h-16 rounded-2xl t-icon-box t-icon-box-group-hover flex items-center justify-center mx-auto mb-7 transition-colors duration-300">
            <Icon name="lucide:mail" class="w-7 h-7 t-icon-color-group-hover transition-colors duration-300" />
          </div>
          <h3 class="font-medium t-text mb-2 tracking-wide">Email</h3>
          <p class="t-text-accent font-medium text-sm">{{ contactInfo.email }}</p>
        </a>

        <!-- Phone -->
        <a
          :href="`tel:${contactInfo.phone.replace(/[^0-9]/g, '')}`"
          class="contact-card group rounded-2xl p-10 border t-section-card t-section-card-hover hover:shadow-lg transition-all duration-500 text-center"
        >
          <div class="w-16 h-16 rounded-2xl t-icon-box t-icon-box-group-hover flex items-center justify-center mx-auto mb-7 transition-colors duration-300">
            <Icon name="lucide:phone" class="w-7 h-7 t-icon-color-group-hover transition-colors duration-300" />
          </div>
          <h3 class="font-medium t-text mb-2 tracking-wide">Phone / Text</h3>
          <p class="t-text-accent font-medium text-sm">{{ contactInfo.phone }}</p>
        </a>

        <!-- Location -->
        <div class="contact-card rounded-2xl p-10 border t-section-card text-center">
          <div class="w-16 h-16 rounded-2xl t-icon-box flex items-center justify-center mx-auto mb-7">
            <Icon name="lucide:map-pin" class="w-7 h-7" />
          </div>
          <h3 class="font-medium t-text mb-2 tracking-wide">Location</h3>
          <p class="t-text-secondary text-sm leading-relaxed">
            <span v-for="(line, i) in contactInfo.address" :key="i" class="block">
              {{ line }}
            </span>
          </p>
        </div>
      </div>

      <!-- Hours & CTA -->
      <div class="mt-16 grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <!-- Hours -->
        <div class="contact-card rounded-2xl p-10 border t-section-card">
          <h3 class="font-medium t-text mb-7 flex items-center gap-2.5 tracking-wide">
            <Icon name="lucide:clock" class="w-5 h-5 t-text-accent" />
            Office Hours
          </h3>
          <div class="space-y-3">
            <div
              v-for="item in hours"
              :key="item.day"
              class="flex justify-between items-center py-2.5 border-b t-border last:border-0"
            >
              <span class="t-text-secondary text-sm">{{ item.day }}</span>
              <span
                class="text-sm"
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
        <div class="contact-card t-hero rounded-2xl p-10">
          <h3 class="font-medium mb-4 text-lg t-hero-text t-heading tracking-wide">Ready to Get Started?</h3>
          <p class="t-hero-text-secondary mb-8 leading-relaxed">
            Book an appointment or upload your documents to get started with our services.
          </p>
          <div class="space-y-3">
            <Button
              as="a"
              href="https://app.reclaim.ai/m/sjhas/quick-meeting"
              target="_blank"
              variant="secondary"
              class="w-full justify-center tracking-wide"
            >
              <Icon name="lucide:calendar" class="w-4 h-4" />
              Book an Appointment
            </Button>
            <Button
              as="NuxtLink"
              to="/upload"
              class="w-full justify-center tracking-wide"
              style="background-color: rgba(255, 255, 255, 0.08); color: var(--theme-hero-text); border-color: rgba(255, 255, 255, 0.15);"
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

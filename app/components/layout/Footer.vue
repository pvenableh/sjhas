<script setup lang="ts">
import type { SiteSettings } from '~/types/directus'

const props = defineProps<{
  settings?: SiteSettings | null
}>()

const currentYear = new Date().getFullYear()

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

const quickLinks = [
  { label: 'Home', href: '/', external: false },
  { label: 'Services', href: '/#services', external: false },
  { label: 'About', href: '/#about', external: false },
  { label: 'Contact', href: '/#contact', external: false },
  { label: 'Client Portal', href: 'https://sjhas.clientportal.com/#/login', external: true },
]
</script>

<template>
  <footer class="t-footer">
    <!-- Decorative top line -->
    <div class="h-px" style="background: linear-gradient(to right, transparent, var(--theme-footer-border), transparent);" />

    <div class="container-wide section-padding py-24">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-14 lg:gap-12">
        <!-- Brand -->
        <div class="lg:col-span-1">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 rounded-xl t-bg-accent flex items-center justify-center">
              <span class="t-text-inverse font-extralight text-lg t-heading">S</span>
            </div>
            <span class="t-heading text-xl t-footer-heading tracking-[0.04em]">SJHAS, Inc.</span>
          </div>
          <p class="text-sm t-footer-text-secondary leading-[1.8]">
            Providing personalized tax returns, accounting, and payroll services throughout Central New York since 2000.
          </p>
        </div>

        <!-- Quick Links -->
        <div>
          <h4 class="t-footer-heading font-medium mb-6 text-[10px] tracking-[0.12em] uppercase">Quick Links</h4>
          <ul class="space-y-3.5">
            <li v-for="link in quickLinks" :key="link.href">
              <a
                v-if="link.external"
                :href="link.href"
                target="_blank"
                rel="noopener noreferrer"
                class="text-sm t-footer-link inline-flex items-center gap-1.5 tracking-wide"
              >
                {{ link.label }}
              </a>
              <NuxtLink
                v-else
                :to="link.href"
                class="text-sm t-footer-link inline-flex items-center gap-1.5 tracking-wide"
              >
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Contact -->
        <div>
          <h4 class="t-footer-heading font-medium mb-6 text-[10px] tracking-[0.12em] uppercase">Contact</h4>
          <ul class="space-y-5">
            <li>
              <a
                :href="`mailto:${contactInfo.email}`"
                class="text-sm t-footer-link flex items-center gap-3"
              >
                <Icon name="lucide:mail" class="w-4 h-4 t-text-accent" />
                {{ contactInfo.email }}
              </a>
            </li>
            <li>
              <a
                :href="`tel:${contactInfo.phone.replace(/[^0-9]/g, '')}`"
                class="text-sm t-footer-link flex items-center gap-3"
              >
                <Icon name="lucide:phone" class="w-4 h-4 t-text-accent" />
                {{ contactInfo.phone }}
              </a>
            </li>
            <li class="flex items-start gap-3">
              <Icon name="lucide:map-pin" class="w-4 h-4 t-text-accent mt-0.5" />
              <div class="text-sm t-footer-text-secondary leading-[1.7]">
                <p v-for="line in contactInfo.address" :key="line">{{ line }}</p>
              </div>
            </li>
          </ul>
        </div>

        <!-- Hours -->
        <div>
          <h4 class="t-footer-heading font-medium mb-6 text-[10px] tracking-[0.12em] uppercase">Office Hours</h4>
          <ul class="space-y-3">
            <li
              v-for="item in hours"
              :key="item.day"
              class="text-sm flex justify-between gap-4"
            >
              <span class="t-footer-text-secondary tracking-wide">{{ item.day }}</span>
              <span class="tracking-wide" :class="item.hours === 'Closed' ? 't-footer-text-muted' : 't-footer-text'">
                {{ item.hours }}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Bottom bar -->
    <div class="border-t t-footer-border">
      <div class="container-wide section-padding py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p class="text-xs t-footer-text-muted tracking-[0.06em]">
          &copy; {{ currentYear }} SJHAS, Inc. All rights reserved.
        </p>
        <p class="text-xs t-footer-text-muted tracking-[0.06em]">
          Website by <a href="https://huestudios.com" target="_blank" rel="noopener noreferrer" class="t-text-accent t-footer-link">Hue Studios</a>
        </p>
      </div>
    </div>
  </footer>
</template>

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
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/#services' },
  { label: 'Upload Documents', href: '/upload' },
  { label: 'Tax Planning', href: '/tax-planning' },
  { label: 'Client Portal', href: 'https://sjhas.clientportal.com/', external: true },
]
</script>

<template>
  <footer class="t-footer text-slate-300">
    <div class="container-wide section-padding py-16">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
        <!-- Brand -->
        <div class="lg:col-span-1">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-10 h-10 rounded-lg t-bg-accent flex items-center justify-center">
              <span class="t-text-inverse font-bold text-lg">S</span>
            </div>
            <span class="t-heading text-xl text-white">SJHAS, Inc.</span>
          </div>
          <p class="text-sm text-slate-400 leading-relaxed">
            Providing personalized tax returns, accounting, and payroll services throughout Central New York since 2000.
          </p>
        </div>

        <!-- Quick Links -->
        <div>
          <h4 class="text-white font-semibold mb-4">Quick Links</h4>
          <ul class="space-y-2">
            <li v-for="link in quickLinks" :key="link.href">
              <component
                :is="link.external ? 'a' : 'NuxtLink'"
                :href="link.external ? link.href : undefined"
                :to="link.external ? undefined : link.href"
                :target="link.external ? '_blank' : undefined"
                :rel="link.external ? 'noopener noreferrer' : undefined"
                class="text-sm text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1"
              >
                {{ link.label }}
                <Icon v-if="link.external" name="lucide:external-link" class="w-3 h-3" />
              </component>
            </li>
          </ul>
        </div>

        <!-- Contact -->
        <div>
          <h4 class="text-white font-semibold mb-4">Contact</h4>
          <ul class="space-y-3">
            <li>
              <a
                :href="`mailto:${contactInfo.email}`"
                class="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2"
              >
                <Icon name="lucide:mail" class="w-4 h-4 t-text-accent" />
                {{ contactInfo.email }}
              </a>
            </li>
            <li>
              <a
                :href="`tel:${contactInfo.phone.replace(/[^0-9]/g, '')}`"
                class="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2"
              >
                <Icon name="lucide:phone" class="w-4 h-4 t-text-accent" />
                {{ contactInfo.phone }}
              </a>
            </li>
            <li class="flex items-start gap-2">
              <Icon name="lucide:map-pin" class="w-4 h-4 t-text-accent mt-0.5" />
              <div class="text-sm text-slate-400">
                <p v-for="line in contactInfo.address" :key="line">{{ line }}</p>
              </div>
            </li>
          </ul>
        </div>

        <!-- Hours -->
        <div>
          <h4 class="text-white font-semibold mb-4">Office Hours</h4>
          <ul class="space-y-1.5">
            <li
              v-for="item in hours"
              :key="item.day"
              class="text-sm flex justify-between gap-4"
            >
              <span class="text-slate-400">{{ item.day }}</span>
              <span :class="item.hours === 'Closed' ? 'text-slate-500' : 'text-slate-300'">
                {{ item.hours }}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Bottom bar -->
    <div class="border-t border-slate-800/50">
      <div class="container-wide section-padding py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p class="text-sm text-slate-500">
          © {{ currentYear }} SJHAS, Inc. All rights reserved.
        </p>
        <p class="text-sm text-slate-600">
          Website by <a href="https://huestudios.com" target="_blank" rel="noopener noreferrer" class="t-text-accent hover:text-white transition-colors">Hue Studios</a>
        </p>
      </div>
    </div>
  </footer>
</template>

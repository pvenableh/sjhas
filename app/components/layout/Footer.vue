<script setup lang="ts">
import type { SiteSettings } from '~/types/directus'
import { toast } from 'vue-sonner'

const props = defineProps<{
  settings?: SiteSettings | null
}>()

const currentYear = new Date().getFullYear()

const { user, loggedIn, logout } = useDirectusAuth()
const router = useRouter()

const isAdmin = computed(() => {
  if (!loggedIn.value || !user.value) return false
  const role = (user.value as any)?.role
  if (typeof role === 'object' && role !== null) {
    return role.admin_access === true || role.name?.toLowerCase().includes('admin')
  }
  return false
})

const handleLogout = async () => {
  try {
    await logout()
    toast.success('You have been signed out')
    router.push('/')
  } catch {
    // session cleared by composable regardless
    toast.error('Logout failed. Please try again.')
  }
}

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

const baseLinks = [
  { label: 'Home', href: '/', external: false },
  { label: 'Services', href: '/#services', external: false },
  { label: 'About', href: '/#about', external: false },
  { label: 'Contact', href: '/#contact', external: false },
  { label: 'Client Portal', href: 'https://sjhas.clientportal.com/#/login', external: true },
]

const quickLinks = computed(() => {
  if (isAdmin.value) {
    return [...baseLinks, { label: 'Admin', href: '/admin', external: false }]
  }
  if (loggedIn.value) {
    return [...baseLinks, { label: 'My Account', href: '/forms', external: false }]
  }
  return [...baseLinks, { label: 'Login', href: '/auth/login', external: false }]
})
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
          <p v-if="settings?.footer_tagline" class="text-sm t-footer-text-secondary leading-[1.8]">
            {{ settings.footer_tagline }}
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
            <li v-if="loggedIn">
              <button
                class="text-sm t-footer-link inline-flex items-center gap-1.5 tracking-wide"
                @click="handleLogout"
              >
                Logout
              </button>
            </li>
          </ul>
        </div>

        <!-- Contact -->
        <div v-if="hasContactInfo">
          <h4 class="t-footer-heading font-medium mb-6 text-[10px] tracking-[0.12em] uppercase">Contact</h4>
          <ul class="space-y-5">
            <li v-if="contactInfo.email">
              <a
                :href="`mailto:${contactInfo.email}`"
                class="text-sm t-footer-link flex items-center gap-3"
              >
                <Icon name="lucide:mail" class="w-4 h-4 t-text-accent" />
                {{ contactInfo.email }}
              </a>
            </li>
            <li v-if="contactInfo.phone">
              <a
                :href="`tel:${contactInfo.phone.replace(/[^0-9]/g, '')}`"
                class="text-sm t-footer-link flex items-center gap-3"
              >
                <Icon name="lucide:phone" class="w-4 h-4 t-text-accent" />
                {{ contactInfo.phone }}
              </a>
            </li>
            <li v-if="contactInfo.address.length" class="flex items-start gap-3">
              <Icon name="lucide:map-pin" class="w-4 h-4 t-text-accent mt-0.5" />
              <div class="text-sm t-footer-text-secondary leading-[1.7]">
                <p v-for="line in contactInfo.address" :key="line">{{ line }}</p>
              </div>
            </li>
          </ul>
        </div>

        <!-- Hours -->
        <div v-if="hours.length">
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
      <div class="container-wide section-padding flex flex-col sm:flex-row items-center justify-between gap-4" style="padding-top: 2rem; padding-bottom: calc(2rem + env(safe-area-inset-bottom, 0px));">
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

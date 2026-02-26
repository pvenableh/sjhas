<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useWindowScroll } from '@vueuse/core'
import { gsap } from 'gsap'
import { cn } from '~/lib/utils'

const props = defineProps<{
  logo?: string
  siteName?: string
  bookingUrl?: string
}>()

const { trackNavClick, trackBookingClick } = useAnalytics()

const { y } = useWindowScroll()
const isScrolled = computed(() => y.value > 20)
const isMobileMenuOpen = ref(false)
const headerRef = ref<HTMLElement | null>(null)

// Check if user is logged in and has admin role
const { user, loggedIn } = useDirectusAuth()
const isAdmin = computed(() => {
  if (!loggedIn.value || !user.value) return false
  const role = (user.value as any)?.role
  // Check for admin role by name or admin_access flag
  if (typeof role === 'object' && role !== null) {
    return role.admin_access === true || role.name?.toLowerCase().includes('admin')
  }
  return false
})

const baseNavLinks = [
  { label: 'Home', href: '/', external: false },
  { label: 'Services', href: '/#services', external: false },
  { label: 'About', href: '/#about', external: false },
  { label: 'Contact', href: '/#contact', external: false },
  { label: 'Portal', href: 'https://sjhas.clientportal.com/', external: true },
]

const navLinks = computed(() => {
  if (isAdmin.value) {
    return [
      ...baseNavLinks,
      { label: 'Admin', href: '/admin', external: false },
    ]
  }
  if (loggedIn.value) {
    return [
      ...baseNavLinks,
      { label: 'My Account', href: '/forms', external: false },
    ]
  }
  return [
    ...baseNavLinks,
    { label: 'Login', href: '/auth/login', external: false },
  ]
})

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value

  if (isMobileMenuOpen.value) {
    gsap.fromTo(
      '.mobile-nav-link',
      { opacity: 0, x: -12 },
      { opacity: 1, x: 0, duration: 0.35, stagger: 0.04, delay: 0.1, ease: 'power2.out' }
    )
  }
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const route = useRoute()
watch(() => route.path, () => {
  closeMobileMenu()
})

onMounted(() => {
  if (headerRef.value) {
    gsap.fromTo(
      headerRef.value,
      { y: -100, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' }
    )
  }
})
</script>

<template>
  <header
    ref="headerRef"
    :class="cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300 safe-area-header',
      isScrolled
        ? 't-header-scrolled shadow-sm border-b t-border'
        : 't-header'
    )"
  >
    <div class="container-wide section-padding">
      <nav class="flex items-center justify-between h-[4.5rem] lg:h-20">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-3">
          <img
            v-if="logo"
            :src="logo"
            :alt="siteName"
            class="h-12 w-auto"
          />
          <div v-else class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl t-bg-accent flex items-center justify-center">
              <span class="t-text-inverse font-extralight text-lg t-heading">S</span>
            </div>
            <span v-if="siteName" class="t-heading text-xl t-text tracking-[0.04em]">{{ siteName }}</span>
          </div>
        </NuxtLink>

        <!-- Desktop Navigation -->
        <div class="hidden lg:flex items-center gap-1">
          <template v-for="link in navLinks" :key="link.href">
            <a
              v-if="link.external"
              :href="link.href"
              target="_blank"
              rel="noopener noreferrer"
              class="px-5 py-2 text-[13px] tracking-[0.02em] t-text-secondary hover:t-text-accent transition-colors rounded-xl t-hover-bg"
              @click="trackNavClick(link.label, link.href)"
            >
              {{ link.label }}
            </a>
            <NuxtLink
              v-else
              :to="link.href"
              class="px-5 py-2 text-[13px] tracking-[0.02em] t-text-secondary hover:t-text-accent transition-colors rounded-xl t-hover-bg"
              @click="trackNavClick(link.label, link.href)"
            >
              {{ link.label }}
            </NuxtLink>
          </template>
        </div>

        <!-- CTA Button & Dark Mode (Desktop) -->
        <div class="hidden lg:flex items-center gap-4">
          <LayoutDarkModeToggle />
          <Button v-if="bookingUrl" as="a" :href="bookingUrl" target="_blank" size="sm" class="tracking-wide" @click="trackBookingClick('header')">
            Book Appointment
          </Button>
        </div>

        <!-- Mobile: Theme & Menu Button -->
        <div class="lg:hidden flex items-center gap-1">
          <LayoutDarkModeToggle />
          <button
            class="p-2.5 rounded-xl t-hover-bg transition-colors"
            :aria-expanded="isMobileMenuOpen"
            aria-label="Toggle menu"
            @click="toggleMobileMenu"
          >
            <Icon
              :name="isMobileMenuOpen ? 'lucide:x' : 'lucide:menu'"
              class="w-5 h-5 t-text-secondary"
            />
          </button>
        </div>
      </nav>
    </div>

    <!-- Mobile backdrop -->
    <Transition
      enter-active-class="transition-opacity duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isMobileMenuOpen"
        class="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        style="top: calc(4.5rem + env(safe-area-inset-top, 0px));"
        @click="closeMobileMenu"
      />
    </Transition>

    <!-- Mobile Menu -->
    <Transition
      enter-active-class="transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
      enter-from-class="opacity-0 -translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-4"
    >
      <div
        v-if="isMobileMenuOpen"
        class="lg:hidden absolute top-full left-0 right-0 z-50 t-bg-elevated border-b t-border t-shadow-lg"
      >
        <div class="section-padding py-5 space-y-1">
          <template v-for="link in navLinks" :key="link.href">
            <a
              v-if="link.external"
              :href="link.href"
              target="_blank"
              rel="noopener noreferrer"
              class="mobile-nav-link block px-5 py-3.5 text-[15px] tracking-wide t-text-secondary hover:t-text-accent t-hover-bg rounded-xl transition-colors"
              @click="trackNavClick(link.label, link.href); closeMobileMenu()"
            >
              {{ link.label }}
            </a>
            <NuxtLink
              v-else
              :to="link.href"
              class="mobile-nav-link block px-5 py-3.5 text-[15px] tracking-wide t-text-secondary hover:t-text-accent t-hover-bg rounded-xl transition-colors"
              @click="trackNavClick(link.label, link.href); closeMobileMenu()"
            >
              {{ link.label }}
            </NuxtLink>
          </template>
          <div v-if="bookingUrl" class="pt-4 px-5">
            <Button
              as="a"
              :href="bookingUrl"
              target="_blank"
              class="w-full tracking-wide"
              @click="trackBookingClick('header_mobile')"
            >
              Book Appointment
            </Button>
          </div>
        </div>
      </div>
    </Transition>
  </header>
</template>

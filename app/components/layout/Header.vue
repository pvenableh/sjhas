<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useWindowScroll } from '@vueuse/core'
import { gsap } from 'gsap'
import { cn } from '~/lib/utils'

const props = defineProps<{
  logo?: string
  siteName?: string
}>()

const { y } = useWindowScroll()
const isScrolled = computed(() => y.value > 20)
const isMobileMenuOpen = ref(false)
const headerRef = ref<HTMLElement | null>(null)

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/#services' },
  { label: 'About', href: '/#about' },
  { label: 'Upload', href: '/upload' },
  { label: 'Tax Planning', href: '/tax-planning' },
  { label: 'Contact', href: '/#contact' },
  { label: 'Client Portal', href: '/portal/login' },
  { label: 'Admin', href: '/admin/chat' },
]

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value

  if (isMobileMenuOpen.value) {
    gsap.fromTo(
      '.mobile-nav-link',
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.3, stagger: 0.05, ease: 'power2.out' }
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
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      isScrolled
        ? 't-header-scrolled shadow-sm border-b t-border'
        : 't-header'
    )"
  >
    <div class="container-wide section-padding">
      <nav class="flex items-center justify-between h-20">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-3">
          <img
            v-if="logo"
            :src="logo"
            :alt="siteName"
            class="h-12 w-auto"
          />
          <div v-else class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-lg t-bg-accent flex items-center justify-center">
              <span class="t-text-inverse font-light text-lg t-heading">S</span>
            </div>
            <span class="t-heading text-xl t-text tracking-wide">{{ siteName || 'SJHAS, Inc.' }}</span>
          </div>
        </NuxtLink>

        <!-- Desktop Navigation -->
        <div class="hidden lg:flex items-center gap-0.5">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.href"
            :to="link.href"
            class="px-4 py-2 text-sm tracking-wide t-text-secondary hover:t-text-accent transition-colors rounded-lg t-hover-bg"
          >
            {{ link.label }}
          </NuxtLink>
        </div>

        <!-- CTA Button & Theme Switcher (Desktop) -->
        <div class="hidden lg:flex items-center gap-3">
          <LayoutThemeSwitcher />
          <Button as="a" href="https://app.reclaim.ai/m/sjhas/quick-meeting" target="_blank" class="tracking-wide">
            Book Appointment
          </Button>
        </div>

        <!-- Mobile: Theme & Menu Button -->
        <div class="lg:hidden flex items-center gap-1">
          <LayoutDarkModeToggle />
          <button
            class="p-2 rounded-lg t-hover-bg transition-colors"
            :aria-expanded="isMobileMenuOpen"
            aria-label="Toggle menu"
            @click="toggleMobileMenu"
          >
            <Icon
              :name="isMobileMenuOpen ? 'lucide:x' : 'lucide:menu'"
              class="w-6 h-6 t-text-secondary"
            />
          </button>
        </div>
      </nav>
    </div>

    <!-- Mobile Menu -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="isMobileMenuOpen"
        class="lg:hidden absolute top-full left-0 right-0 t-bg-elevated border-b t-border t-shadow-lg"
      >
        <div class="section-padding py-4 space-y-1">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.href"
            :to="link.href"
            class="mobile-nav-link block px-4 py-3 text-base tracking-wide t-text-secondary hover:t-text-accent t-hover-bg rounded-lg transition-colors"
            @click="closeMobileMenu"
          >
            {{ link.label }}
          </NuxtLink>
          <!-- Mobile Theme Switcher -->
          <div class="pt-3 px-4 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm t-text-muted tracking-wide">Theme</span>
              <LayoutThemeSwitcher />
            </div>
            <Button
              as="a"
              href="https://app.reclaim.ai/m/sjhas/quick-meeting"
              target="_blank"
              class="w-full tracking-wide"
            >
              Book Appointment
            </Button>
          </div>
        </div>
      </div>
    </Transition>
  </header>
</template>

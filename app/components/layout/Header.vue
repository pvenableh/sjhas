<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useWindowScroll } from '@vueuse/core'
import { gsap } from 'gsap'
import { cn } from '~/utils/cn'

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
]

const externalLinks = [
  { label: 'Client Portal', href: 'https://sjhas.clientportal.com/', external: true },
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
      { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
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
        ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100'
        : 'bg-transparent'
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
          <div v-else class="flex items-center gap-2">
            <div class="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center">
              <span class="text-white font-bold text-lg">S</span>
            </div>
            <span class="font-serif text-xl text-slate-900">{{ siteName || 'SJHAS, Inc.' }}</span>
          </div>
        </NuxtLink>

        <!-- Desktop Navigation -->
        <div class="hidden lg:flex items-center gap-1">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.href"
            :to="link.href"
            class="px-4 py-2 text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors rounded-lg hover:bg-slate-100"
          >
            {{ link.label }}
          </NuxtLink>
          <a
            v-for="link in externalLinks"
            :key="link.href"
            :href="link.href"
            target="_blank"
            rel="noopener noreferrer"
            class="px-4 py-2 text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors rounded-lg hover:bg-slate-100 flex items-center gap-1"
          >
            {{ link.label }}
            <Icon name="lucide:external-link" class="w-3.5 h-3.5" />
          </a>
        </div>

        <!-- CTA Button (Desktop) -->
        <div class="hidden lg:block">
          <Button as="a" href="https://app.reclaim.ai/m/sjhas/quick-meeting" target="_blank">
            Book Appointment
          </Button>
        </div>

        <!-- Mobile Menu Button -->
        <button
          class="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
          :aria-expanded="isMobileMenuOpen"
          aria-label="Toggle menu"
          @click="toggleMobileMenu"
        >
          <Icon
            :name="isMobileMenuOpen ? 'lucide:x' : 'lucide:menu'"
            class="w-6 h-6 text-slate-700"
          />
        </button>
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
        class="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-lg"
      >
        <div class="section-padding py-4 space-y-1">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.href"
            :to="link.href"
            class="mobile-nav-link block px-4 py-3 text-base font-medium text-slate-700 hover:text-primary-600 hover:bg-slate-50 rounded-lg transition-colors"
            @click="closeMobileMenu"
          >
            {{ link.label }}
          </NuxtLink>
          <a
            v-for="link in externalLinks"
            :key="link.href"
            :href="link.href"
            target="_blank"
            rel="noopener noreferrer"
            class="mobile-nav-link flex items-center gap-2 px-4 py-3 text-base font-medium text-slate-700 hover:text-primary-600 hover:bg-slate-50 rounded-lg transition-colors"
          >
            {{ link.label }}
            <Icon name="lucide:external-link" class="w-4 h-4" />
          </a>
          <div class="pt-3 px-4">
            <Button
              as="a"
              href="https://app.reclaim.ai/m/sjhas/quick-meeting"
              target="_blank"
              class="w-full"
            >
              Book Appointment
            </Button>
          </div>
        </div>
      </div>
    </Transition>
  </header>
</template>

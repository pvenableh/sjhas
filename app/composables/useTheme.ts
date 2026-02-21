/**
 * Theme Management Composable
 *
 * Manages the modern theme with light/dark variants.
 * Uses CSS custom properties for all theme values.
 */

export type ThemeMode = 'light' | 'dark' | 'system'

export function useTheme() {
  const colorMode = useColorMode()

  // Resolve the actual mode from the preference
  // colorMode.value may return 'system' when preference is system,
  // so we need to resolve it to 'light' or 'dark'
  function resolveMode(): 'light' | 'dark' {
    const pref = colorMode.preference || colorMode.value
    if (pref === 'dark') return 'dark'
    if (pref === 'light') return 'light'
    // For 'system' preference, check the DOM or media query
    if (import.meta.client) {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    }
    return 'light'
  }

  // Is dark mode active
  const isDark = computed(() => {
    const val = colorMode.value
    if (val === 'dark') return true
    if (val === 'light') return false
    // 'system' or other values - check preference
    const pref = colorMode.preference
    if (pref === 'dark') return true
    if (pref === 'light') return false
    // System preference - check media query
    if (import.meta.client) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  // Computed theme class for the HTML element
  const themeClass = computed(() => {
    return `theme-modern-${isDark.value ? 'dark' : 'light'}`
  })

  // Current full theme name
  const currentTheme = computed(() => {
    return `modern-${isDark.value ? 'dark' : 'light'}`
  })

  // Toggle dark mode
  function toggleDarkMode(value?: boolean) {
    const newDark = typeof value === 'boolean' ? value : !isDark.value
    colorMode.preference = newDark ? 'dark' : 'light'
    nextTick(() => updateHtmlClass())
  }

  // Set dark mode
  function setDarkMode(mode: ThemeMode) {
    colorMode.preference = mode
  }

  // Update HTML element classes
  function updateHtmlClass() {
    if (!import.meta.client) return

    const html = document.documentElement

    // Remove all theme classes
    html.classList.remove(
      'theme-classic-light',
      'theme-classic-dark',
      'theme-modern-light',
      'theme-modern-dark'
    )

    // Add current theme class
    html.classList.add(themeClass.value)
  }

  // Initialize theme
  function initTheme() {
    if (!import.meta.client) return
    updateHtmlClass()
  }

  // Watch for changes and update HTML class
  watch(() => colorMode.value, () => {
    updateHtmlClass()
  })

  // Also watch preference changes
  watch(() => colorMode.preference, () => {
    nextTick(() => updateHtmlClass())
  })

  // Initialize on client
  onMounted(() => {
    initTheme()
  })

  return {
    // State
    themeClass,
    isDark,
    currentTheme,
    colorMode,

    // Actions
    toggleDarkMode,
    setDarkMode,
    initTheme,
  }
}

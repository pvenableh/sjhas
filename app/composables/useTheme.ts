/**
 * Theme Management Composable
 *
 * Manages the modern theme with light/dark variants.
 * Uses CSS custom properties for all theme values.
 */

export type ThemeMode = 'light' | 'dark' | 'system'

export function useTheme() {
  const colorMode = useColorMode()

  // Computed theme class for the HTML element
  const themeClass = computed(() => {
    const isDark = colorMode.value === 'dark'
    return `theme-modern-${isDark ? 'dark' : 'light'}`
  })

  // Is dark mode active
  const isDark = computed(() => colorMode.value === 'dark')

  // Current full theme name
  const currentTheme = computed(() => {
    return `modern-${isDark.value ? 'dark' : 'light'}`
  })

  // Toggle dark mode
  function toggleDarkMode() {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
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

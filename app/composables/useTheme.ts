/**
 * Theme Management Composable
 * 
 * Manages two design themes (Classic & Modern) with light/dark variants each.
 * - Classic: Warm cream, gold accents, Bodoni serif headings
 * - Modern: Sophisticated neutrals, bronze accents, elegant Bodoni + Avenir Next
 */

export type ThemeStyle = 'classic' | 'modern'
export type ThemeMode = 'light' | 'dark' | 'system'

export interface ThemeState {
  style: ThemeStyle
  mode: ThemeMode
}

const THEME_STORAGE_KEY = 'sjh-theme-style'

export function useTheme() {
  const colorMode = useColorMode()
  
  // Theme style state (classic or modern)
  const themeStyle = useState<ThemeStyle>('theme-style', () => 'modern')
  
  // Computed theme class for the HTML element
  const themeClass = computed(() => {
    const isDark = colorMode.value === 'dark'
    return `theme-${themeStyle.value}-${isDark ? 'dark' : 'light'}`
  })
  
  // Is dark mode active
  const isDark = computed(() => colorMode.value === 'dark')
  
  // Current full theme name
  const currentTheme = computed(() => {
    return `${themeStyle.value}-${isDark.value ? 'dark' : 'light'}`
  })
  
  // Set theme style
  function setThemeStyle(style: ThemeStyle) {
    themeStyle.value = style
    if (import.meta.client) {
      localStorage.setItem(THEME_STORAGE_KEY, style)
      updateHtmlClass()
    }
  }
  
  // Toggle between classic and modern
  function toggleThemeStyle() {
    setThemeStyle(themeStyle.value === 'classic' ? 'modern' : 'classic')
  }
  
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
  
  // Initialize theme from localStorage
  function initTheme() {
    if (!import.meta.client) return
    
    const savedStyle = localStorage.getItem(THEME_STORAGE_KEY) as ThemeStyle | null
    if (savedStyle && (savedStyle === 'classic' || savedStyle === 'modern')) {
      themeStyle.value = savedStyle
    }
    
    updateHtmlClass()
  }
  
  // Watch for changes and update HTML class
  watch([themeStyle, () => colorMode.value], () => {
    updateHtmlClass()
  })
  
  // Initialize on client
  onMounted(() => {
    initTheme()
  })
  
  return {
    // State
    themeStyle: readonly(themeStyle),
    themeClass,
    isDark,
    currentTheme,
    colorMode,
    
    // Actions
    setThemeStyle,
    toggleThemeStyle,
    toggleDarkMode,
    setDarkMode,
    initTheme,
  }
}

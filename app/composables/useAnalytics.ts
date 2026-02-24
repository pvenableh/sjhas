/**
 * useAnalytics - Google Analytics composable
 *
 * Wraps nuxt-gtag's useGtag() with typed helpers for:
 * - User identification from Directus session data
 * - Custom event tracking (button clicks, form submissions, chat, etc.)
 * - Scroll depth tracking
 *
 * Usage:
 *   const { identifyUser, trackEvent, trackFormSubmission } = useAnalytics()
 */

export const useAnalytics = () => {
  const { gtag } = useGtag()

  // ─── User identification ────────────────────────────────────────────
  /**
   * Set GA4 user properties from the current Directus session user.
   * Call once when the user logs in or on app mount when already authenticated.
   */
  const identifyUser = (user: {
    id?: string
    first_name?: string | null
    last_name?: string | null
    email?: string | null
    role?: { name?: string } | string | null
    status?: string | null
  }) => {
    if (!user.id) return

    // GA4 user_id (unique identifier — never PII)
    gtag('set', { user_id: user.id })

    // Custom user properties visible in GA4 > User > User properties
    const roleName =
      typeof user.role === 'object' && user.role !== null
        ? user.role.name
        : user.role

    gtag('set', 'user_properties', {
      first_name: user.first_name || undefined,
      last_name: user.last_name || undefined,
      email: user.email || undefined,
      user_role: roleName || undefined,
      account_status: user.status || undefined,
    })
  }

  /**
   * Clear user identity on logout.
   */
  const clearUser = () => {
    gtag('set', { user_id: undefined })
    gtag('set', 'user_properties', {
      first_name: undefined,
      last_name: undefined,
      email: undefined,
      user_role: undefined,
      account_status: undefined,
    })
  }

  // ─── Generic event helper ───────────────────────────────────────────
  const trackEvent = (
    eventName: string,
    params?: Record<string, unknown>,
  ) => {
    gtag('event', eventName, params)
  }

  // ─── Button / CTA clicks ───────────────────────────────────────────
  const trackButtonClick = (
    buttonName: string,
    extra?: Record<string, unknown>,
  ) => {
    trackEvent('button_click', {
      button_name: buttonName,
      ...extra,
    })
  }

  const trackCtaClick = (
    ctaName: string,
    ctaUrl?: string,
    location?: string,
  ) => {
    trackEvent('cta_click', {
      cta_name: ctaName,
      cta_url: ctaUrl,
      cta_location: location,
    })
  }

  // ─── Navigation ─────────────────────────────────────────────────────
  const trackNavClick = (label: string, href: string) => {
    trackEvent('nav_click', {
      link_label: label,
      link_url: href,
    })
  }

  // ─── Form events ───────────────────────────────────────────────────
  const trackFormView = (formName: string, formId?: string | number) => {
    trackEvent('form_view', {
      form_name: formName,
      form_id: formId,
    })
  }

  const trackFormSubmission = (
    formName: string,
    formId?: string | number,
    extra?: Record<string, unknown>,
  ) => {
    trackEvent('form_submission', {
      form_name: formName,
      form_id: formId,
      ...extra,
    })
  }

  const trackFormStepComplete = (
    formName: string,
    stepNumber: number,
    stepLabel?: string,
  ) => {
    trackEvent('form_step_complete', {
      form_name: formName,
      step_number: stepNumber,
      step_label: stepLabel,
    })
  }

  const trackFormError = (
    formName: string,
    errorMessage?: string,
  ) => {
    trackEvent('form_error', {
      form_name: formName,
      error_message: errorMessage,
    })
  }

  // ─── Chat widget ───────────────────────────────────────────────────
  const trackChatOpen = () => {
    trackEvent('chat_open')
  }

  const trackChatMessageSent = () => {
    trackEvent('chat_message_sent')
  }

  const trackChatSessionStart = (mode: 'online' | 'offline') => {
    trackEvent('chat_session_start', { chat_mode: mode })
  }

  // ─── Scroll depth ──────────────────────────────────────────────────
  /**
   * Start tracking scroll depth milestones (25%, 50%, 75%, 90%).
   * Returns a cleanup function to remove the listener.
   */
  const trackScrollDepth = () => {
    if (!import.meta.client) return () => {}

    const milestones = [25, 50, 75, 90]
    const reached = new Set<number>()

    const handler = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      if (scrollHeight <= 0) return

      const percent = Math.round((window.scrollY / scrollHeight) * 100)

      for (const milestone of milestones) {
        if (percent >= milestone && !reached.has(milestone)) {
          reached.add(milestone)
          trackEvent('scroll_depth', {
            depth_percent: milestone,
            page_path: window.location.pathname,
          })
        }
      }
    }

    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }

  // ─── File upload ───────────────────────────────────────────────────
  const trackFileUpload = (fileCount: number) => {
    trackEvent('file_upload', { file_count: fileCount })
  }

  // ─── Auth events ──────────────────────────────────────────────────
  const trackLogin = () => {
    trackEvent('login', { method: 'email' })
  }

  const trackSignUp = () => {
    trackEvent('sign_up', { method: 'email' })
  }

  const trackLogout = () => {
    trackEvent('logout')
  }

  // ─── Booking ──────────────────────────────────────────────────────
  const trackBookingClick = (location: string) => {
    trackEvent('booking_click', { cta_location: location })
  }

  return {
    // User
    identifyUser,
    clearUser,

    // Generic
    trackEvent,

    // UI interactions
    trackButtonClick,
    trackCtaClick,
    trackNavClick,

    // Forms
    trackFormView,
    trackFormSubmission,
    trackFormStepComplete,
    trackFormError,

    // Chat
    trackChatOpen,
    trackChatMessageSent,
    trackChatSessionStart,

    // Scroll
    trackScrollDepth,

    // Files
    trackFileUpload,

    // Auth
    trackLogin,
    trackSignUp,
    trackLogout,

    // Booking
    trackBookingClick,
  }
}

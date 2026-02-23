// plugins/auth-refresh.client.ts
// Client-side plugin that intercepts 401 responses on authenticated API calls.
// When a 401 is received, it attempts to refresh the session once and retry
// the original request. This acts as a safety net for token expiration
// that slips past the server-side proactive refresh.

export default defineNuxtPlugin(() => {
  const { loggedIn, fetch: refreshSession } = useUserSession()

  let refreshPromise: Promise<void> | null = null

  const originalFetch = globalThis.$fetch

  globalThis.$fetch = (async (request: any, opts: any = {}) => {
    try {
      return await originalFetch(request, opts)
    } catch (error: any) {
      // Only intercept 401s for authenticated users on our own API routes
      const is401 = error?.statusCode === 401 || error?.status === 401
      const isApiRoute =
        typeof request === 'string' && request.startsWith('/api/')
      const isAuthRoute =
        typeof request === 'string' && request.startsWith('/api/auth/')

      if (is401 && isApiRoute && !isAuthRoute && loggedIn.value) {
        // Deduplicate: only one refresh at a time
        if (!refreshPromise) {
          refreshPromise = refreshSession().finally(() => {
            refreshPromise = null
          })
        }

        try {
          await refreshPromise
        } catch {
          // Refresh failed — propagate the original error
          throw error
        }

        // Retry the original request once
        return await originalFetch(request, opts)
      }

      throw error
    }
  }) as typeof globalThis.$fetch
})

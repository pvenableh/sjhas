// middleware/guest.ts
/**
 * Guest middleware - redirects authenticated users away from auth pages
 *
 * Usage in pages:
 * definePageMeta({
 *   middleware: 'guest'
 * })
 */

export default defineNuxtRouteMiddleware((to, from) => {
  const { loggedIn } = useUserSession();

  if (loggedIn.value) {
    // Redirect to the appropriate dashboard based on route context
    const dashboardPath = to.fullPath.startsWith("/admin")
      ? "/admin/chat"
      : "/forms";
    return navigateTo(dashboardPath);
  }
});

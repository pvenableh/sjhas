// middleware/auth.ts
/**
 * Auth middleware - protects routes that require authentication
 *
 * Usage in pages:
 * definePageMeta({
 *   middleware: 'auth'
 * })
 */

export default defineNuxtRouteMiddleware((to, from) => {
  const { loggedIn } = useUserSession();

  if (!loggedIn.value) {
    // Redirect to the appropriate login page based on route context
    const loginPath = to.fullPath.startsWith("/admin")
      ? "/admin/chat"
      : "/forms/login";
    return navigateTo({
      path: loginPath,
      query: { redirect: to.fullPath },
    });
  }
});

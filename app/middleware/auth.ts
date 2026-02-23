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
    // Redirect to the login page with a redirect query param
    const loginPath = "/auth/login";
    return navigateTo({
      path: loginPath,
      query: { redirect: to.fullPath },
    });
  }
});

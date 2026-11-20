// middleware/auth.ts
/**
 * Auth middleware - protects routes that require authentication
 *
 * Any /admin page additionally requires an admin role (verified server-side
 * through /api/auth/me). Signed-in non-admins, such as clients who registered
 * publicly, are sent to the client portal.
 *
 * Usage in pages:
 * definePageMeta({
 *   middleware: 'auth'
 * })
 */

export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, user } = useUserSession();

  if (!loggedIn.value) {
    // Redirect to the login page with a redirect query param
    const loginPath = "/auth/login";
    return navigateTo({
      path: loginPath,
      query: { redirect: to.fullPath },
    });
  }

  if (to.path === "/admin" || to.path.startsWith("/admin/")) {
    // Cache the verdict per user for the lifetime of the app instance
    const adminState = useState<{ userId: string; isAdmin: boolean } | null>(
      "auth-admin-check",
      () => null
    );
    const userId = String((user.value as any)?.id ?? "");

    if (adminState.value?.userId !== userId) {
      try {
        const me = await useRequestFetch()<{ isAdmin?: boolean }>("/api/auth/me");
        adminState.value = { userId, isAdmin: me?.isAdmin === true };
      } catch {
        // Fail closed, but don't cache so a transient error can recover
        return navigateTo("/forms");
      }
    }

    if (!adminState.value?.isAdmin) {
      return navigateTo("/forms");
    }
  }
});

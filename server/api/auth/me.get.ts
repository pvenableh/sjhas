// server/api/auth/me.get.ts
/**
 * Get current user endpoint - returns user data from session
 */

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event);

    if (!session?.user) {
      return {
        authenticated: false,
        user: null,
      };
    }

    return {
      authenticated: true,
      user: session.user,
      loggedInAt: (session as any).loggedInAt,
      // Verified server-side against Directus, not read from the cookie
      isAdmin: await isAdminUser(event),
    };
  } catch (error: any) {
    console.error("Get user error:", error);

    return {
      authenticated: false,
      user: null,
    };
  }
});

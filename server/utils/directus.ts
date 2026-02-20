// server/utils/directus.ts
// Server-side Directus clients with automatic token refresh

import {
  createDirectus,
  rest,
  authentication,
  staticToken,
  realtime,
  refresh,
  readMe,
  readItems,
  readItem,
  createItem,
  createItems,
  updateItem,
  updateItems,
  deleteItem,
  deleteItems,
  readUsers,
  readUser,
  createUser,
  updateUser,
  deleteUser,
  uploadFiles,
  importFile,
  readFiles,
  readFile,
  updateFile,
  deleteFile,
  readFolders,
  readFolder,
  createFolder,
  createFolders,
  updateFolder,
  updateFolders,
  deleteFolder,
  deleteFolders,
  readActivities,
  readActivity,
  readRoles,
  readRole,
  aggregate,
  passwordRequest,
  passwordReset,
  inviteUser,
  acceptUserInvite,
} from "@directus/sdk";
import type { H3Event } from "h3";

// Re-export SDK functions for use in API routes
export {
  readMe,
  readItems,
  readItem,
  createItem,
  createItems,
  updateItem,
  updateItems,
  deleteItem,
  deleteItems,
  readUsers,
  readUser,
  createUser,
  updateUser,
  deleteUser,
  uploadFiles,
  importFile,
  readFiles,
  readFile,
  updateFile,
  deleteFile,
  readFolders,
  readFolder,
  createFolder,
  createFolders,
  updateFolder,
  updateFolders,
  deleteFolder,
  deleteFolders,
  readActivities,
  readActivity,
  readRoles,
  readRole,
  aggregate,
  passwordRequest,
  passwordReset,
  inviteUser,
  acceptUserInvite,
};

/**
 * Get a typed Directus client with admin access
 * Uses static token for server-side operations
 */
export function getTypedDirectus() {
  const config = useRuntimeConfig();

  if (!config.directus?.url) {
    throw new Error("DIRECTUS_URL is not configured");
  }

  if (!config.directus?.staticToken) {
    throw new Error("DIRECTUS_STATIC_TOKEN is not configured");
  }

  return createDirectus(config.directus.url)
    .with(staticToken(config.directus.staticToken))
    .with(rest());
}

/**
 * Get a Directus client with user authentication
 * Uses the session token from nuxt-auth-utils
 * Automatically refreshes expired tokens
 */
export async function getUserDirectus(
  event: H3Event,
  forceRefresh: boolean = false
) {
  const config = useRuntimeConfig();

  const session = await getUserSession(event);

  // Check if session exists
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: "No active session",
    });
  }

  // Access token from secure section
  let accessToken = getSessionAccessToken(session);
  const refreshToken = getSessionRefreshToken(session);

  if (!accessToken) {
    throw createError({
      statusCode: 401,
      statusMessage: "No authentication token available",
    });
  }

  // Check if token is expired or about to expire (within 60 seconds)
  const now = Date.now();
  const expiresAt = (session as any).expiresAt;

  // If expiresAt is missing (old session), don't force refresh unless explicitly requested
  const shouldRefresh =
    forceRefresh || (expiresAt && now >= expiresAt - 60000);

  if (shouldRefresh && refreshToken) {
    try {
      const newTokens = await directusRefresh(refreshToken);

      // Update session with new tokens
      await updateSessionTokens(event, session, newTokens);

      accessToken = newTokens.access_token;
    } catch (error) {
      console.error("Token refresh failed:", error);
      // Clear session on refresh failure
      await clearUserSession(event);
      throw createError({
        statusCode: 401,
        statusMessage: "Session expired - please log in again",
      });
    }
  }

  // Create client with current access token
  return createDirectus(config.directus.url)
    .with(staticToken(accessToken))
    .with(rest());
}

/**
 * Get a public Directus client (no authentication)
 * Use this for publicly available data
 */
export function getPublicDirectus() {
  const config = useRuntimeConfig();

  if (!config.directus?.url) {
    throw new Error("DIRECTUS_URL is not configured");
  }

  return createDirectus(config.directus.url).with(rest());
}

// ============================================
// Authentication Helper Functions
// ============================================

interface DirectusTokens {
  access_token: string;
  refresh_token: string;
  expires: number;
}

/**
 * Login user with email and password
 * Returns access and refresh tokens
 */
export async function directusLogin(
  email: string,
  password: string
): Promise<DirectusTokens> {
  const config = useRuntimeConfig();
  const client = createDirectus(config.directus.url)
    .with(authentication("json"))
    .with(rest());

  const result = await client.login({ email, password });
  return result as DirectusTokens;
}

/**
 * Refresh tokens using refresh token
 */
export async function directusRefresh(
  refreshToken: string
): Promise<DirectusTokens> {
  const config = useRuntimeConfig();
  const client = createDirectus(config.directus.url)
    .with(rest())
    .with(authentication("json"));

  const result = await client.request(
    refresh({ mode: "json", refresh_token: refreshToken })
  );
  return result as DirectusTokens;
}

/**
 * Logout user using refresh token
 */
export async function directusLogout(refreshToken: string): Promise<void> {
  const config = useRuntimeConfig();
  const client = createDirectus(config.directus.url)
    .with(authentication("json"))
    .with(rest());

  await client.logout(refreshToken);
}

/**
 * Get current user data using access token
 */
export async function directusGetMe(accessToken: string, fields?: string[]) {
  const config = useRuntimeConfig();
  const client = createDirectus(config.directus.url)
    .with(staticToken(accessToken))
    .with(rest());

  return await client.request(readMe({ fields: fields || ["*"] }));
}

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
  readSingleton,
  updateSingleton,
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
  readSingleton,
  updateSingleton,
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

// Module-level lock to prevent concurrent token refresh race conditions.
// When multiple requests arrive simultaneously and all need a refresh,
// only one refresh is performed; the others wait for its result.
let _refreshPromise: Promise<DirectusTokens> | null = null;
let _refreshingToken: string | null = null;

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
  const loggedInAt = (session as any).loggedInAt;

  // Guard: never refresh tokens obtained within the last 30 seconds.
  // This prevents spurious refresh attempts right after login when
  // expiresAt might be incorrect (e.g. if 'expires' was null or 0).
  const isRecentLogin = loggedInAt && now - loggedInAt < 30_000;

  // Only refresh if expiresAt is a valid future timestamp that falls
  // within the 60-second refresh window, OR if explicitly forced.
  // Skip if the token was just obtained (recent login).
  const shouldRefresh =
    !isRecentLogin &&
    (forceRefresh ||
      (typeof expiresAt === "number" &&
        expiresAt > 0 &&
        now >= expiresAt - 60_000));

  if (shouldRefresh && refreshToken) {
    try {
      let newTokens: DirectusTokens;

      // Deduplicate concurrent refresh attempts: if another request is
      // already refreshing with the same refresh token, reuse its promise.
      if (_refreshPromise && _refreshingToken === refreshToken) {
        newTokens = await _refreshPromise;
      } else {
        _refreshingToken = refreshToken;
        _refreshPromise = directusRefresh(refreshToken);
        try {
          newTokens = await _refreshPromise;
        } finally {
          _refreshPromise = null;
          _refreshingToken = null;
        }
        // Only the request that performed the refresh updates the session
        await updateSessionTokens(event, session, newTokens);
      }

      accessToken = newTokens.access_token;
    } catch (error) {
      // Don't clear the session — the current access token may still be
      // valid and concurrent requests would lose their session.  The
      // caller (executeOperation) already has retry logic for truly
      // expired tokens.
      console.warn(
        "Token refresh failed, continuing with current token:",
        (error as Error).message
      );
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
  /** Token lifetime in **milliseconds** (already converted from the Directus API which returns seconds). */
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

  // The SDK may return expires/refresh_token as null depending on
  // the authentication mode and Directus configuration.  Normalise
  // to safe defaults so downstream code doesn't break.
  //
  // IMPORTANT: The Directus API returns `expires` in **seconds**
  // (e.g. 900 = 15 minutes).  Convert to milliseconds here so the
  // rest of the codebase can use Date.now() arithmetic directly.
  const rawExpires = result.expires;
  const expiresMs =
    typeof rawExpires === "number" && rawExpires > 0
      ? rawExpires * 1000
      : 900_000;

  return {
    access_token: result.access_token ?? "",
    refresh_token: result.refresh_token ?? "",
    expires: expiresMs,
  };
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

  // Directus API returns `expires` in seconds — convert to milliseconds.
  const tokens = result as Record<string, any>;
  const rawExpires = tokens.expires;
  const expiresMs =
    typeof rawExpires === "number" && rawExpires > 0
      ? rawExpires * 1000
      : 900_000;

  return {
    access_token: tokens.access_token ?? "",
    refresh_token: tokens.refresh_token ?? "",
    expires: expiresMs,
  };
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

// ============================================
// Error Handling Utilities
// ============================================

/**
 * Extract the HTTP status code from a Directus SDK error.
 *
 * The SDK rejects with a plain object containing `response` (the raw
 * fetch Response) and `errors` (the Directus API errors array).
 * Errors created by h3's `createError` carry `statusCode` directly.
 */
export function getDirectusHttpStatus(error: any): number {
  // h3 / createError errors already carry statusCode
  if (error.statusCode) return error.statusCode;

  // Directus SDK errors carry the raw fetch Response
  const responseStatus = error.response?.status;
  if (typeof responseStatus === "number" && responseStatus >= 400)
    return responseStatus;

  // Fall back to mapping well-known Directus error codes
  const code = error.errors?.[0]?.extensions?.code;
  switch (code) {
    case "TOKEN_EXPIRED":
    case "INVALID_TOKEN":
      return 401;
    case "FORBIDDEN":
      return 403;
    case "RECORD_NOT_UNIQUE":
    case "FAILED_VALIDATION":
    case "INVALID_PAYLOAD":
      return 400;
    case "CONTENT_TOO_LARGE":
      return 413;
    default:
      return 500;
  }
}

/**
 * Extract a human-readable message from a Directus SDK error.
 */
export function getDirectusErrorMessage(error: any): string {
  return (
    error.errors?.[0]?.message ||
    error.message ||
    "Failed to perform operation"
  );
}

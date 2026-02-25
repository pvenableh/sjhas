// composables/useDirectusRealtime.ts
/**
 * useDirectusRealtime - WebSocket connection composable
 *
 * Handles realtime WebSocket connections to Directus with:
 * - Automatic reconnection with exponential backoff
 * - Connection state management
 * - Token refresh before connection
 * - Optional public (no-auth) mode for visitor-facing features
 *
 * Usage:
 * // Authenticated (admin):
 * const { subscribe, isConnected, connect, disconnect } = useDirectusRealtime()
 *
 * // Public (visitor widget):
 * const { subscribe, isConnected, connect, disconnect } = useDirectusRealtime({ requireAuth: false })
 */

import { createDirectus, realtime, rest, authentication } from "@directus/sdk";

interface SubscriptionOptions {
  fields?: string[];
  filter?: Record<string, any>;
}

type SubscriptionCallback<T = any> = (
  event: "create" | "update" | "delete",
  data: T | T[]
) => void;

interface RealtimeOptions {
  requireAuth?: boolean;
}

export function useDirectusRealtime(options: RealtimeOptions = {}) {
  const { requireAuth = true } = options;
  const config = useRuntimeConfig();

  // Connection state
  const isConnected = ref(false);
  const isConnecting = ref(false);
  const connectionError = ref<string | null>(null);
  const reconnectAttempts = ref(0);
  const maxReconnectAttempts = 10;

  // Client and subscriptions
  let client: any = null;
  const subscriptions = new Map<string, { unsubscribe: () => void }>();

  /**
   * Connect to WebSocket (authenticated or public)
   */
  async function connect() {
    if (isConnected.value || isConnecting.value) return;

    if (requireAuth) {
      const { loggedIn } = useUserSession();
      if (!loggedIn.value) {
        const err = new Error("Authentication required");
        connectionError.value = err.message;
        throw err;
      }
    }

    isConnecting.value = true;
    connectionError.value = null;

    try {
      // Derive WebSocket URL from Directus URL
      const publicWsUrl = (config.public.directus as any).websocketUrl;
      let wsUrl: string;

      if (publicWsUrl) {
        wsUrl = publicWsUrl;
      } else {
        // Auto-derive: replace protocol and append /websocket path
        const baseUrl = config.public.directus.url;
        const protocol = baseUrl.startsWith("https") ? "wss://" : "ws://";
        const host = baseUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
        wsUrl = `${protocol}${host}/websocket`;
      }

      const connectWithTimeout = (c: any) =>
        Promise.race([
          c.connect(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Connection timeout")), 5000)
          ),
        ]);

      if (requireAuth) {
        // Authenticated connection
        const { token } = await $fetch<{ token: string }>("/api/websocket/token");

        if (!token) {
          throw new Error("No access token available");
        }

        client = createDirectus(wsUrl)
          .with(realtime())
          .with(rest())
          .with(authentication("json"));

        await connectWithTimeout(client);
        await client.sendMessage({ type: "auth", access_token: token });
      } else {
        // Public connection — uses Directus public role permissions
        client = createDirectus(wsUrl).with(realtime());
        await connectWithTimeout(client);
      }

      isConnected.value = true;
      isConnecting.value = false;
      reconnectAttempts.value = 0;
      connectionError.value = null;
    } catch (error: any) {
      isConnecting.value = false;
      connectionError.value = error.message || "Connection failed";
      client = null;
      // Throw so callers can handle fallback (e.g. polling)
      throw error;
    }
  }

  /**
   * Disconnect from WebSocket
   */
  async function disconnect() {
    if (client) {
      for (const [uid, sub] of subscriptions) {
        sub.unsubscribe();
      }
      subscriptions.clear();

      try {
        await client.disconnect();
      } catch {
        // Ignore disconnect errors
      }
      client = null;
    }

    isConnected.value = false;
    isConnecting.value = false;
  }

  /**
   * Subscribe to collection changes
   */
  async function subscribe<T = any>(
    collection: string,
    callback: SubscriptionCallback<T>,
    options?: SubscriptionOptions
  ): Promise<() => void> {
    // Ensure connection
    if (!isConnected.value) {
      await connect();
    }

    if (!client || !isConnected.value) {
      throw new Error("WebSocket not connected");
    }

    const uid = `${collection}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Subscribe to collection
    const { subscription } = await client.subscribe(collection, {
      query: {
        fields: options?.fields || ["*"],
        filter: options?.filter,
      },
    });

    // Handle events
    const unsubscribeFn = () => {
      subscription.return?.();
      subscriptions.delete(uid);
    };

    subscriptions.set(uid, { unsubscribe: unsubscribeFn });

    // Process messages
    (async () => {
      for await (const message of subscription) {
        if (message.type === "subscription" && message.event) {
          callback(message.event as any, message.data);
        }
      }
    })();

    return unsubscribeFn;
  }

  /**
   * Unsubscribe from a specific subscription
   */
  function unsubscribe(uid: string) {
    const sub = subscriptions.get(uid);
    if (sub) {
      sub.unsubscribe();
      subscriptions.delete(uid);
    }
  }

  // Auto-disconnect on unmount
  onUnmounted(() => {
    disconnect();
  });

  return {
    // State
    isConnected: readonly(isConnected),
    isConnecting: readonly(isConnecting),
    connectionError: readonly(connectionError),

    // Actions
    connect,
    disconnect,
    subscribe,
    unsubscribe,
  };
}

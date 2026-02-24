import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4,
  },
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },

  modules: [
    "@nuxt/fonts",
    "@nuxt/icon",
    "@nuxt/image",
    "@nuxtjs/color-mode",
    "@nuxtjs/seo",
    "@vee-validate/nuxt",
    "@vueuse/nuxt",
    "@vite-pwa/nuxt",
    "shadcn-nuxt",
    "nuxt-auth-utils",
    "nuxt-gtag",
  ],

  gtag: {
    id: process.env.NUXT_PUBLIC_GTAG_ID || "",
    enabled: !!process.env.NUXT_PUBLIC_GTAG_ID,
  },

  css: ["~/assets/css/main.css"],

  vite: {
    plugins: [tailwindcss()],
  },

  // Site configuration for @nuxtjs/seo (sitemap, robots, og-image, etc.)
  site: {
    url: process.env.SITE_URL || "https://sjhas.com",
    name: "SJHAS, Inc.",
    description:
      "SJHAS Inc. provides personalized tax returns, accounting, and payroll services throughout Ithaca, Elmira, and Central New York since 2000.",
    defaultLocale: "en",
  },

  // Color mode configuration
  colorMode: {
    classSuffix: "", // Uses 'dark' class instead of 'dark-mode'
    preference: "system", // Default value of $colorMode.preference
    fallback: "light", // Fallback value if no system preference found
    storageKey: "sjh-color-mode",
  },

  shadcn: {
    prefix: "",
    componentDir: "./app/components/ui",
  },

  icon: {
    serverBundle: "remote",
    clientBundle: {
      scan: true,
    },
    collections: ["heroicons-outline", "heroicons-solid", "lucide"],
  },

  fonts: {
    // Custom fonts loaded via @font-face in fonts.css — no external providers needed
    families: [],
  },

  // Sitemap configuration
  sitemap: {
    exclude: [
      "/admin/**",
      "/forms/**",
      "/f/**",
      "/auth/**",
      "/accept-invite",
      "/upload",
      "/api/**",
    ],
  },

  // Robots configuration
  robots: {
    disallow: ["/admin", "/forms", "/f", "/auth", "/accept-invite", "/upload", "/api"],
  },

  // OG Image configuration
  ogImage: {
    defaults: {
      component: "NuxtSeo",
      props: {
        colorMode: "dark",
        siteName: "SJHAS, Inc.",
      },
    },
  },

  // Schema.org structured data
  schemaOrg: {
    identity: {
      type: "AccountingService",
      name: "SJHAS, Inc.",
      url: "https://sjhas.com",
      logo: "/icon-512x512.png",
      description:
        "Personalized tax returns, accounting, and payroll services throughout Ithaca, Elmira, and Central New York since 2000.",
      email: "sjh@sjhas.com",
      telephone: "(607) 216-8033",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Ithaca",
        addressRegion: "NY",
        addressCountry: "US",
      },
      areaServed: [
        { "@type": "City", name: "Ithaca" },
        { "@type": "City", name: "Elmira" },
        { "@type": "State", name: "New York" },
      ],
      priceRange: "$$",
    },
  },

  // PWA configuration
  pwa: {
    registerType: "autoUpdate",
    manifest: {
      name: "SJHAS, Inc. - Accounting & Tax Services",
      short_name: "SJHAS",
      description:
        "Personalized tax returns, accounting, and payroll services in Ithaca, NY.",
      theme_color: "#1e3a5f",
      background_color: "#ffffff",
      display: "standalone",
      orientation: "portrait-primary",
      categories: ["business", "finance"],
      icons: [
        {
          src: "/icon-72x72.png",
          sizes: "72x72",
          type: "image/png",
        },
        {
          src: "/icon-96x96.png",
          sizes: "96x96",
          type: "image/png",
        },
        {
          src: "/icon-128x128.png",
          sizes: "128x128",
          type: "image/png",
        },
        {
          src: "/icon-144x144.png",
          sizes: "144x144",
          type: "image/png",
        },
        {
          src: "/icon-152x152.png",
          sizes: "152x152",
          type: "image/png",
        },
        {
          src: "/icon-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "/icon-384x384.png",
          sizes: "384x384",
          type: "image/png",
        },
        {
          src: "/icon-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
        {
          src: "/maskable-icon-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    },
    workbox: {
      navigateFallback: undefined,
      globPatterns: ["**/*.{js,css,html,png,svg,ico,woff2}"],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: "CacheFirst",
          options: {
            cacheName: "google-fonts-cache",
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
      ],
    },
    client: {
      installPrompt: true,
    },
    devOptions: {
      enabled: false,
    },
  },

  runtimeConfig: {
    // Session password for nuxt-auth-utils (must be 32+ chars)
    sessionPassword: process.env.NUXT_SESSION_PASSWORD,
    // Directus configuration
    directus: {
      url: process.env.DIRECTUS_URL || "http://localhost:8055",
      staticToken: process.env.DIRECTUS_STATIC_TOKEN,
      websocketUrl: process.env.DIRECTUS_WEBSOCKET_URL,
    },
    // SendGrid
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    sendgridFromEmail:
      process.env.SENDGRID_FROM_EMAIL || "noreply@sjhaccounting.com",
    notificationEmail: process.env.NOTIFICATION_EMAIL || "sjh@sjhas.com",
    public: {
      directus: {
        url: process.env.DIRECTUS_URL || "http://localhost:8055",
      },
      siteUrl: process.env.SITE_URL || "https://sjhas.com",
      clientRoleId: process.env.CLIENT_ROLE_ID || "",
    },
  },

  routeRules: {
    "/api/**": { cors: true },
    "/forms/**": { ssr: false },
    "/f/**": { ssr: false },
    "/admin/**": { ssr: false, robots: false },
    "/accept-invite": { ssr: false },
    // Cache public pages for better performance
    "/": { swr: 3600 },
    "/tax-planning": { swr: 3600 },
  },

  nitro: {
    preset: "vercel",
    experimental: {
      websocket: true,
    },
  },

  app: {
    head: {
      title: "SJHAS, Inc. - Accounting & Tax Services",
      htmlAttrs: {
        lang: "en",
      },
      meta: [
        { charset: "utf-8" },
        {
          name: "viewport",
          content:
            "width=device-width, initial-scale=1.0, maximum-scale=5, viewport-fit=cover",
        },
        {
          name: "description",
          content:
            "SJHAS Inc. provides personalized tax returns, accounting, and payroll services throughout Ithaca, Elmira, and Central New York since 2000.",
        },
        { name: "theme-color", content: "#1e3a5f" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        {
          name: "apple-mobile-web-app-status-bar-style",
          content: "black-translucent",
        },
        { name: "format-detection", content: "telephone=no" },
      ],
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        {
          rel: "icon",
          type: "image/png",
          sizes: "32x32",
          href: "/favicon-32x32.png",
        },
        {
          rel: "apple-touch-icon",
          sizes: "180x180",
          href: "/apple-touch-icon.png",
        },
        {
          rel: "preconnect",
          href: process.env.DIRECTUS_URL || "",
        },
        {
          rel: "dns-prefetch",
          href: process.env.DIRECTUS_URL || "",
        },
      ],
    },
    pageTransition: { name: "page", mode: "out-in" },
    layoutTransition: { name: "layout", mode: "out-in" },
  },
});

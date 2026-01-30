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
    "shadcn-nuxt",
    "nuxt-auth-utils",
  ],

  css: ["~/assets/css/main.css"],

  vite: {
    plugins: [tailwindcss()],
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
    families: [
      {
        name: "DM Sans",
        provider: "google",
        weights: [400, 500, 600, 700],
      },
      {
        name: "DM Serif Display",
        provider: "google",
        weights: [400],
      },
    ],
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
      siteUrl: process.env.SITE_URL || "http://localhost:3000",
    },
  },

  routeRules: {
    "/api/**": { cors: true },
    "/portal/**": { ssr: false },
    "/admin/**": { ssr: false },
  },

  nitro: {
    preset: "vercel",
  },

  app: {
    head: {
      title: "SJHAS, Inc. - Accounting & Tax Services",
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
      ],
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
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

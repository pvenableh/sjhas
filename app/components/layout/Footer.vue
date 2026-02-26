<script setup lang="ts">
import type { SiteSettings } from "~/types/directus";
import { toast } from "vue-sonner";

const props = defineProps<{
  settings?: SiteSettings | null;
}>();

const currentYear = new Date().getFullYear();

const { user, loggedIn, logout } = useDirectusAuth();
const router = useRouter();

const isAdmin = computed(() => {
  if (!loggedIn.value || !user.value) return false;
  const role = (user.value as any)?.role;
  if (typeof role === "object" && role !== null) {
    return (
      role.admin_access === true || role.name?.toLowerCase().includes("admin")
    );
  }
  return false;
});

const handleLogout = async () => {
  try {
    await logout();
    toast.success("You have been signed out");
    router.push("/");
  } catch {
    // session cleared by composable regardless
    toast.error("Logout failed. Please try again.");
  }
};

const contactInfo = computed(() => ({
  email: props.settings?.contact_email,
  phone: props.settings?.contact_phone,
  address: [
    props.settings?.address_line_1,
    props.settings?.address_line_2,
    props.settings?.city || props.settings?.state || props.settings?.zip_code
      ? `${props.settings?.city || ""}${props.settings?.city && props.settings?.state ? ", " : ""}${props.settings?.state || ""} ${props.settings?.zip_code || ""}`.trim()
      : null,
  ].filter(Boolean) as string[],
}));

const hasContactInfo = computed(
  () =>
    contactInfo.value.email ||
    contactInfo.value.phone ||
    contactInfo.value.address.length,
);

const hours = computed(() => {
  const s = props.settings;
  if (
    !s?.hours_monday &&
    !s?.hours_tuesday &&
    !s?.hours_wednesday &&
    !s?.hours_thursday &&
    !s?.hours_friday
  )
    return [];
  return [
    { day: "Monday", hours: s?.hours_monday },
    { day: "Tuesday", hours: s?.hours_tuesday },
    { day: "Wednesday", hours: s?.hours_wednesday },
    { day: "Thursday", hours: s?.hours_thursday },
    { day: "Friday", hours: s?.hours_friday },
  ].filter((item) => item.hours) as { day: string; hours: string }[];
});

const baseLinks = [
  { label: "Home", href: "/", external: false },
  { label: "Services", href: "/#services", external: false },
  { label: "About", href: "/#about", external: false },
  { label: "Upload Documents", href: "/upload", external: false },
  { label: "Tax Planning", href: "/tax-planning", external: false },
  { label: "Contact", href: "/#contact", external: false },
  {
    label: "Client Portal",
    href: "https://sjhas.clientportal.com/#/login",
    external: true,
  },
];

const quickLinks = computed(() => {
  if (isAdmin.value) {
    return [...baseLinks, { label: "Admin", href: "/admin", external: false }];
  }
  if (loggedIn.value) {
    return [
      ...baseLinks,
      { label: "My Account", href: "/forms", external: false },
    ];
  }
  return [
    ...baseLinks,
    { label: "Login", href: "/auth/login", external: false },
  ];
});
</script>

<template>
  <footer class="t-footer">
    <!-- Decorative top line -->
    <div
      class="h-px"
      style="
        background: linear-gradient(
          to right,
          transparent,
          var(--theme-footer-border),
          transparent
        );
      "
    />

    <div class="container-wide section-padding py-24">
      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-14 lg:gap-12"
      >
        <!-- Brand -->
        <div class="lg:col-span-1">
          <div class="flex items-center gap-3 mb-6">
            <div
              class="w-10 h-10 rounded-xl t-bg-accent flex items-center justify-center"
            >
              <span class="t-text-inverse font-extralight text-lg t-heading"
                >S</span
              >
            </div>
            <span class="t-heading text-xl t-footer-heading tracking-[0.04em]"
              >SJHAS, Inc.</span
            >
          </div>
          <p
            v-if="settings?.footer_tagline"
            class="text-sm t-footer-text-secondary leading-[1.8]"
          >
            {{ settings.footer_tagline }}
          </p>
        </div>

        <!-- Quick Links -->
        <div>
          <h4
            class="t-footer-heading font-medium mb-6 text-[10px] tracking-[0.12em] uppercase"
          >
            Quick Links
          </h4>
          <ul class="space-y-3.5">
            <li v-for="link in quickLinks" :key="link.href">
              <a
                v-if="link.external"
                :href="link.href"
                target="_blank"
                rel="noopener noreferrer"
                class="text-sm t-footer-link inline-flex items-center gap-1.5 tracking-wide"
              >
                {{ link.label }}
              </a>
              <NuxtLink
                v-else
                :to="link.href"
                class="text-sm t-footer-link inline-flex items-center gap-1.5 tracking-wide"
              >
                {{ link.label }}
              </NuxtLink>
            </li>
            <li v-if="loggedIn">
              <button
                class="text-sm t-footer-link inline-flex items-center gap-1.5 tracking-wide"
                @click="handleLogout"
              >
                Logout
              </button>
            </li>
          </ul>
        </div>

        <!-- Contact -->
        <div v-if="hasContactInfo">
          <h4
            class="t-footer-heading font-medium mb-6 text-[10px] tracking-[0.12em] uppercase"
          >
            Contact
          </h4>
          <ul class="space-y-5">
            <li v-if="contactInfo.email">
              <a
                :href="`mailto:${contactInfo.email}`"
                class="text-sm t-footer-link flex items-center gap-3"
              >
                <Icon name="lucide:mail" class="w-4 h-4 t-text-accent" />
                {{ contactInfo.email }}
              </a>
            </li>
            <li v-if="contactInfo.phone">
              <a
                :href="`tel:${contactInfo.phone.replace(/[^0-9]/g, '')}`"
                class="text-sm t-footer-link flex items-center gap-3"
              >
                <Icon name="lucide:phone" class="w-4 h-4 t-text-accent" />
                {{ contactInfo.phone }}
              </a>
            </li>
            <li
              v-if="contactInfo.address.length"
              class="flex items-start gap-3"
            >
              <Icon
                name="lucide:map-pin"
                class="w-4 h-4 t-text-accent mt-0.5"
              />
              <div class="text-sm t-footer-text-secondary leading-[1.7]">
                <p v-for="line in contactInfo.address" :key="line">
                  {{ line }}
                </p>
              </div>
            </li>
          </ul>
        </div>

        <!-- Hours -->
        <div v-if="hours.length">
          <h4
            class="t-footer-heading font-medium mb-6 text-[10px] tracking-[0.12em] uppercase"
          >
            Office Hours
          </h4>
          <ul class="space-y-3">
            <li
              v-for="item in hours"
              :key="item.day"
              class="text-sm flex justify-between gap-4"
            >
              <span class="t-footer-text-secondary tracking-wide">{{
                item.day
              }}</span>
              <span
                class="tracking-wide"
                :class="
                  item.hours === 'Closed'
                    ? 't-footer-text-muted'
                    : 't-footer-text'
                "
              >
                {{ item.hours }}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div class="my-12 flex w-full flex-col items-center justify-center">
      <h5 class="web-designer !font-[var(--theme-body-font)]">
        <a
          href="mailto:contact@huestudios.com"
          target="_blank"
          rel="noopener"
          class="columns body-font shrink !text-white !font-[var(--theme-body-font)]"
        >
          designed by
          <svg
            id="hue-logo"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 98.44 48.62"
          >
            <title>hue Creative Marketing - Maimi Beach | New York</title>
            <path
              class="h"
              d="M347.41,282.12h6.28v19.35c2-3.5,6.14-5.48,10.77-5.48,3.5,0,8.52,1.25,10.44,5.28.66,1.32,1.12,2.91,1.12,7.73v20.74h-3.56c-5.61,0-2.78-19.62-2.78-19.62,0-3,0-9.38-7.13-9.38a8.57,8.57,0,0,0-7.79,4.43c-1.06,1.85-1.06,5-1.06,7v17.57h-6.28Z"
              transform="translate(-347.41 -282.12)"
            />
            <path
              class="h"
              d="M388.17,296.59v21.34c0,3.24.73,7.33,7.07,7.33,3.1,0,6-1.06,7.79-3.7,1.39-2,1.39-4.56,1.39-6.21,0,0-1.87-18.76,2.07-18.76h4.33v27c0,.66.13,4.36.2,6.21h-6.47l-.13-5.68c-1.19,2.31-3.44,6-10.57,6-8.19,0-12-4.69-12-11.23V296.59Z"
              transform="translate(-347.41 -282.12)"
            />
            <path
              class="h"
              d="M422,314.29c-.13,6.87,2.71,12,9.51,12,5.93,0,6.3-6.87,9.67-6.87h4.33a11.26,11.26,0,0,1-2.84,6.94c-1.45,1.65-4.76,4.43-11.43,4.43-10.44,0-15.39-6.47-15.39-17,0-6.54,1.32-12,6.54-15.59,3.17-2.25,7.13-2.44,9.05-2.44,14.86,0,14.53,13.15,14.4,18.56Zm17.51-4.36c.07-3.17-.53-9.78-8.19-9.78-4,0-8.92,2.44-9,9.78Z"
              transform="translate(-347.41 -282.12)"
            />
          </svg>
        </a>
      </h5>
      <h5
        class="!font-[var(--theme-body-font)] copyright tracking-widest uppercase mb-safe-offset-12 !text-white"
      >
        &#169; {{ new Date().getFullYear() }} SJHAS, INC. All rights reserved.
      </h5>
    </div>
  </footer>
</template>
<style>
h5.web-designer {
  margin-top: 0px;
  margin-bottom: 0px;
  letter-spacing: 0.15em;

  a,
  a:link,
  a:visited {
    font-size: 10px;
    color: var(--grey);
    svg {
      width: 35px;
      height: auto;
      display: inline;
      stroke: none;
      margin-top: -11px;
      margin-left: 1px;
      fill: #ffffff;
      path {
        transition: all 0.3s linear;
      }

      path:nth-of-type(1) {
        transition-delay: 0.1s;
      }

      path:nth-of-type(2) {
        transition-delay: 0.2s;
      }

      path:nth-of-type(3) {
        transition-delay: 0.3s;
      }
    }
  }

  a:hover {
    svg path {
      fill: rgb(255, 0, 92);
    }
  }
}

h5.copyright {
  font-size: 7px;
  margin-top: 0px;
  margin-bottom: 50px;
  letter-spacing: 0.25em;
}
</style>

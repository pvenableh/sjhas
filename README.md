# SJHAS, Inc. - Accounting & Tax Services

A modern website and client platform for SJHAS, Inc., an accounting and tax services firm serving Ithaca, Elmira, and Central New York since 2000. Features a visual form builder replacing the previous Cognito Forms system, a client portal with authentication, real-time chat, notification management, and an admin panel. Built with Nuxt 4, Tailwind CSS 4, and Directus CMS.

## Tech Stack

| Category | Technology |
|---|---|
| Framework | Nuxt 4, Vue 3, TypeScript |
| Styling | Tailwind CSS 4, shadcn-vue (Reka UI) |
| CMS | Directus (headless, REST API + WebSocket) |
| Auth | nuxt-auth-utils + Directus |
| Forms | vee-validate + Zod |
| Animations | GSAP, VueUse Motion |
| Email | SendGrid + MJML templates |
| Real-time | Directus WebSocket + HTTP polling fallback |
| Analytics | Google Analytics (nuxt-gtag) |
| PWA | @vite-pwa/nuxt |
| Notifications | vue-sonner (toast) |
| Deployment | Vercel (WebSocket support) |

## Features

- **Marketing Website** -- Responsive landing page with dynamic CMS-driven content (hero, services, about, testimonials carousel, and contact sections). Dark/light mode with system preference detection.
- **Visual Form Builder** -- Drag-and-drop form designer with 12+ field types. Create, preview, publish, and email forms to clients. Quick-start templates for Document Upload, Tax Planning, and Client Intake forms.
- **Public Forms** -- Client-accessible forms at `/f/{slug}` with validation and file uploads.
- **File Uploads** -- Secure document upload with drag-and-drop, type/size validation, stored in Directus.
- **Email System** -- MJML-based branded email templates compiled to HTML. Admin notifications on submission, client confirmation emails, and form invitation emails via SendGrid.
- **Client Portal** -- Authenticated dashboard with submission history, files, and quick actions.
- **Admin Panel** -- Full management dashboard for forms, submissions, clients, files, chat, notifications, and site settings. Includes client user management with invite flow, file browser with search/filter, and profile/site configuration settings.
- **Live Chat** -- Real-time chat between site visitors and admin using Directus WebSocket with automatic HTTP polling fallback. Features typing indicators, session persistence (24-hour localStorage), and admin online/offline status toggling.
- **Notification Center** -- Unified notification hub aggregating form submissions and chat sessions with tabs (All, New, Read, Archived), real-time updates, and batch actions.
- **Toast Notifications** -- In-app toast notifications via Sonner throughout the site for user feedback.
- **Smart Navigation** -- Role-aware header navigation: admins see "Admin", authenticated clients see "My Account", and guests see "Login".
- **SEO & OG Images** -- Built-in optimization with `@nuxtjs/seo`, Schema.org structured data, sitemap, robots.txt, and dynamic OG image generation.
- **PWA Support** -- Installable progressive web app with offline caching, app icons, and auto-update.
- **Google Analytics** -- User tracking and event instrumentation via nuxt-gtag.

## Project Structure

```
app/
  assets/css/           Theme system (CSS custom properties), fonts
  components/
    Auth/               LoginForm, RegisterForm, PasswordResetForm, AcceptInviteForm
    admin/              FormBuilder (drag-and-drop form designer)
    chat/               ChatWidget (Directus WebSocket + polling live chat)
    forms/              DynamicForm, FormField, FileUpload
    home/               Landing page sections (Hero, Services, About, Testimonials carousel, etc.)
    layout/             Header, Footer, DarkModeToggle, ThemeSwitcher
    ui/                 shadcn-vue components (Button, Card, Carousel, Input, Switch, etc.)
  composables/
    useDirectus.ts      Directus SDK client
    useDirectusAuth.ts  Authentication composable
    useDirectusItems.ts CRUD operations
    useDirectusRealtime.ts  Directus WebSocket subscriptions
    useChatRealtime.ts  Visitor-side real-time chat (WS + polling)
    useAdminChatRealtime.ts  Admin-side real-time chat (WS + polling)
    useAnalytics.ts     Google Analytics event tracking
    useTheme.ts         Theme and color mode management
  layouts/              default, admin, forms, auth
  middleware/           auth (requires login), guest (login/register only)
  pages/
    admin/              Dashboard, form builder, submissions, chat, clients, files,
                        notifications, settings
    auth/               Login, register, forgot-password, password-reset
    forms/              Client portal (dashboard, submissions, files, profile)
    f/[slug].vue        Public form rendering
    index.vue           Landing page
    upload.vue          Document upload
    tax-planning.vue    Tax planning questionnaire
    accept-invite.vue   Client invitation acceptance
emails/
  *.mjml                MJML email templates (admin notification, form invitation,
                        submitter confirmation)
  compile.ts            MJML → HTML compilation script
server/
  api/                  Auth, forms (submit, send), directus proxy, chat, websocket
  utils/
    directus.ts         Directus server client
    session.ts          Session helpers
    emails/             Compiled email templates and rendering utilities
scripts/
  setup-directus-collections.ts  Directus schema setup
  setup-client-permissions.ts    Client role permissions
  setup-chat-realtime.ts         Chat WebSocket configuration
  generate-icons.js              PWA icon generation
types/
  directus-schema.ts    Auto-generated Directus type definitions
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- A running Directus instance

### Setup

```bash
# Install dependencies
pnpm install

# Copy and configure environment variables
cp .env.example .env
```

Edit `.env` with your values:

```env
DIRECTUS_URL=http://localhost:8055
DIRECTUS_WEBSOCKET_URL=ws://localhost:8055/websocket
DIRECTUS_STATIC_TOKEN=your-admin-token
NUXT_SESSION_PASSWORD=your-32-char-minimum-session-password
SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_FROM_EMAIL=noreply@sjhaccounting.com
NOTIFICATION_EMAIL=sjh@sjhas.com
NUXT_PUBLIC_GTAG_ID=G-XXXXXXXXXX
SITE_URL=http://localhost:3000
CLIENT_ROLE_ID=
```

```bash
# Generate Directus types (optional, requires running Directus)
pnpm generate:types

# Compile MJML email templates to HTML
pnpm email:compile

# Start development server
pnpm dev
```

### Build & Deploy

```bash
pnpm build
pnpm preview
```

Configured for Vercel deployment via the `vercel` Nitro preset.

## Routes

| Route | Access | Description |
|---|---|---|
| `/` | Public | Marketing website |
| `/upload` | Public | Document upload form |
| `/tax-planning` | Public | Tax planning questionnaire |
| `/f/{slug}` | Public | Dynamic form by slug |
| `/auth/login` | Guest | Client login |
| `/auth/register` | Guest | Client registration |
| `/auth/forgot-password` | Guest | Request password reset |
| `/auth/password-reset` | Guest | Reset password with token |
| `/accept-invite` | Guest | Accept client invitation |
| `/forms` | Auth | Client dashboard |
| `/forms/submissions` | Auth | Client submission history |
| `/forms/files` | Auth | Client file browser |
| `/forms/profile` | Auth | Client profile settings |
| `/admin` | Admin | Admin dashboard with stats and quick actions |
| `/admin/forms` | Admin | Form builder (list) with quick-start templates |
| `/admin/forms/new` | Admin | Create new form |
| `/admin/forms/{id}` | Admin | Edit form |
| `/admin/submissions` | Admin | All submissions |
| `/admin/chat` | Admin | Live chat management with typing indicators |
| `/admin/clients` | Admin | Client user management and invites |
| `/admin/files` | Admin | File browser with search and filtering |
| `/admin/notifications` | Admin | Notification center (submissions + chat) |
| `/admin/settings` | Admin | Profile and site configuration |

## Admin Form Workflow

1. Log in at `/auth/login` with Directus admin credentials
2. Navigate to `/admin/forms`
3. Click **Create Form** (links to `/admin/forms/new`) to open the visual form builder, or use a **quick-start template** (Document Upload, Tax Planning, or Client Intake) to generate a pre-populated draft form
4. Add fields by dragging from the palette or clicking field types
5. Configure each field (label, placeholder, required, width, options)
6. Set form settings (title, slug, notifications, file upload rules)
7. Preview the form, then **Publish**
8. Use **Send to Client** to email a branded form link via SendGrid (MJML template)
9. View submissions at `/admin/submissions` -- mark as reviewed or archived
10. Monitor incoming activity at `/admin/notifications` -- unified view of submissions and chat sessions with status filtering
11. Manage live chat at `/admin/chat` -- respond to visitors in real-time with typing indicators
12. Manage client users at `/admin/clients` -- view user list and send invites
13. Browse all uploaded files at `/admin/files` -- search, filter by type, and download
14. Update your profile and site configuration at `/admin/settings`

## Directus Collections

| Collection | Type | Purpose |
|---|---|---|
| `site_settings` | Singleton | Site name, contact info, office hours |
| `home_page` | Singleton | Landing page content (hero, about, etc.) |
| `services` | Items | Service offerings |
| `testimonials` | Items | Client testimonials |
| `forms` | Items | Form definitions with field JSON |
| `form_submissions` | Items | Submitted form data and file references |
| `pages` | Items | Generic CMS pages |
| `chat_sessions` | Items | Live chat sessions with typing timestamps |
| `chat_messages` | Items | Chat message history |
| `chat_settings` | Singleton | Chat online/offline status, welcome/offline messages |

## Email Templates

The app uses an MJML-based email template system for consistent, branded emails. Source templates live in `emails/` and are compiled to TypeScript modules via `pnpm email:compile`.

| Template | Purpose |
|---|---|
| `adminNotification.mjml` | Sent to admin when a form is submitted |
| `formInvitation.mjml` | Sent to clients with a form link |
| `submitterConfirmation.mjml` | Confirmation sent to form submitter |

Templates support `{{variable}}` placeholders replaced at runtime by `server/utils/emails/render.ts`. All emails are sent with the "SJH Accounting" sender name.

## Theme System

The app uses a CSS custom property-based theme system (`app/assets/css/theme.css`) with light and dark variants. Theme classes (`.theme-modern-light`, `.theme-modern-dark`) are applied to the `<html>` element. Utility classes like `.t-bg`, `.t-text`, `.t-card`, `.t-hero`, etc. map to theme variables for consistent styling across modes. The heading font is Bauer Bodoni (serif), applied via the `.t-heading` class.

Dark mode is toggled via the `DarkModeToggle` component (used in the header and public form pages) and the `ThemeSwitcher` dropdown. The `useTheme` composable manages color mode state, including system preference detection via `@nuxtjs/color-mode`.

## Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm generate:types` | Generate Directus TypeScript types |
| `pnpm generate:icons` | Generate PWA icons from source |
| `pnpm email:compile` | Compile MJML email templates to HTML |

---

Built by [Hue Studios](https://huestudios.com)

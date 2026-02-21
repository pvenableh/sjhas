# SJHAS, Inc. - Accounting & Tax Services

A modern website and client platform for SJHAS, Inc., an accounting and tax services firm serving Ithaca, Elmira, and Central New York since 2000. Features a visual form builder replacing the previous Cognito Forms system, a client portal with authentication, live chat, and an admin panel. Built with Nuxt 4, Tailwind CSS 4, and Directus CMS.

## Tech Stack

| Category | Technology |
|---|---|
| Framework | Nuxt 4, Vue 3, TypeScript |
| Styling | Tailwind CSS 4, shadcn-vue (Reka UI) |
| CMS | Directus (headless, REST API) |
| Auth | nuxt-auth-utils + Directus |
| Forms | vee-validate + Zod |
| Animations | GSAP, VueUse Motion |
| Email | SendGrid |
| Deployment | Vercel (WebSocket support) |

## Features

- **Marketing Website** -- Responsive landing page with hero, services, about, testimonials, and contact sections. Dark/light mode with system preference detection.
- **Visual Form Builder** -- Drag-and-drop form designer with 12+ field types. Create, preview, publish, and email forms to clients. Quick-start templates for Document Upload, Tax Planning, and Client Intake forms.
- **Public Forms** -- Client-accessible forms at `/f/{slug}` with validation and file uploads.
- **File Uploads** -- Secure document upload with drag-and-drop, type/size validation, stored in Directus.
- **Email Notifications** -- Admin notifications on submission and client confirmation emails via SendGrid.
- **Client Portal** -- Authenticated dashboard with submission history, files, and quick actions.
- **Admin Panel** -- Full management dashboard for forms, submissions, clients, files, chat, and site settings. Includes client user management with invite flow, file browser with search/filter, and profile/site configuration settings.
- **Live Chat** -- Real-time WebSocket chat between site visitors and admin with Nitro storage fallback for reliable status toggling.
- **Smart Navigation** -- Role-aware header navigation: admins see "Admin", authenticated clients see "My Account", and guests see "Login".
- **SEO** -- Built-in optimization with `@nuxtjs/seo`.

## Project Structure

```
app/
  assets/css/           Theme system (CSS custom properties), fonts
  components/
    Auth/               LoginForm, RegisterForm, PasswordResetForm, AcceptInviteForm
    admin/              FormBuilder (drag-and-drop form designer)
    chat/               ChatWidget (WebSocket-based live chat)
    forms/              DynamicForm, FormField, FileUpload
    home/               Landing page sections (Hero, Services, About, etc.)
    layout/             Header, Footer, DarkModeToggle, ThemeSwitcher
    ui/                 shadcn-vue components (Button, Card, Input, Switch, etc.)
  composables/          useDirectus, useDirectusAuth, useDirectusItems, useTheme, etc.
  layouts/              default, admin, forms, auth
  middleware/           auth (requires login), guest (login/register only)
  pages/
    admin/              Dashboard, form builder, submissions, chat, clients, files, settings
    forms/              Client portal (login, dashboard, submissions, files, profile)
    f/[slug].vue        Public form rendering
    index.vue           Landing page
    upload.vue          Document upload
    tax-planning.vue    Tax planning questionnaire
server/
  api/                  Auth, forms (submit, send), directus proxy, chat
  routes/               WebSocket routes (_ws)
  utils/                Directus server client, session helpers
types/
  directus.ts           Auto-generated Directus type definitions
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
SITE_URL=http://localhost:3000
```

```bash
# Generate Directus types (optional, requires running Directus)
pnpm generate:types

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
| `/forms/login` | Guest | Client login / register |
| `/forms` | Auth | Client dashboard |
| `/forms/submissions` | Auth | Client submission history |
| `/forms/files` | Auth | Client file browser |
| `/forms/profile` | Auth | Client profile settings |
| `/admin` | Admin | Admin dashboard with stats and quick actions |
| `/admin/forms` | Admin | Form builder (list) with quick-start templates |
| `/admin/forms/new` | Admin | Create new form |
| `/admin/forms/{id}` | Admin | Edit form |
| `/admin/submissions` | Admin | All submissions |
| `/admin/chat` | Admin | Live chat management |
| `/admin/clients` | Admin | Client user management and invites |
| `/admin/files` | Admin | File browser with search and filtering |
| `/admin/settings` | Admin | Profile and site configuration |

## Admin Form Workflow

1. Log in at `/forms/login` with Directus admin credentials
2. Navigate to `/admin/forms`
3. Click **Create Form** (links to `/admin/forms/new`) to open the visual form builder, or use a **quick-start template** (Document Upload, Tax Planning, or Client Intake) to generate a pre-populated draft form
4. Add fields by dragging from the palette or clicking field types
5. Configure each field (label, placeholder, required, width, options)
6. Set form settings (title, slug, notifications, file upload rules)
7. Preview the form, then **Publish**
8. Use **Send to Client** to email a branded form link via SendGrid
9. View submissions at `/admin/submissions` -- mark as reviewed or archived
10. Manage client users at `/admin/clients` -- view user list and send invites
11. Browse all uploaded files at `/admin/files` -- search, filter by type, and download
12. Update your profile and site configuration at `/admin/settings`

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
| `chat_sessions` | Items | Live chat sessions |
| `chat_messages` | Items | Chat message history |
| `chat_settings` | Singleton | Chat online/offline configuration |

## Theme System

The app uses a CSS custom property-based theme system (`app/assets/css/theme.css`) with light and dark variants. Theme classes (`.theme-modern-light`, `.theme-modern-dark`) are applied to the `<html>` element. Utility classes like `.t-bg`, `.t-text`, `.t-card`, `.t-hero`, etc. map to theme variables for consistent styling across modes. The heading font is Bauer Bodoni (serif), applied via the `.t-heading` class.

Dark mode is toggled via the `DarkModeToggle` component (used in the header and public form pages) and the `ThemeSwitcher` dropdown. The `useTheme` composable manages color mode state, including system preference detection via `@nuxtjs/color-mode`.

---

Built by [Hue Studios](https://huestudios.com)

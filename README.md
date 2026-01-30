# SJH Accounting Website

A modern, custom-built website for SJHAS, Inc. accounting firm, featuring a visual form builder to replace Cognito Forms, client portal with authentication, and admin panel. Built with Nuxt 4, Tailwind CSS 4, and Directus CMS.

## 🚀 Features

- **Visual Form Builder**: Drag-and-drop form creation with live preview
- **Client Portal**: Authenticated access for clients to view submissions and files
- **Admin Panel**: Manage forms, submissions, clients, and content
- **Headless CMS**: Directus for content management
- **Email Notifications**: SendGrid integration for form submissions
- **Real-time Updates**: WebSocket support for live data
- **GSAP Animations**: Smooth, professional animations
- **Fully Responsive**: Optimized for all devices
- **SEO Optimized**: Built-in SEO with @nuxtjs/seo

## 🛠️ Technology Stack

| Category | Technology |
|----------|------------|
| Framework | Nuxt 4, Vue 3, TypeScript |
| Styling | Tailwind CSS 4, shadcn-vue |
| CMS | Directus |
| Authentication | nuxt-auth-utils |
| Forms | vee-validate + zod |
| Animations | GSAP |
| Utilities | VueUse |
| Email | SendGrid |

## 📁 Project Structure

```
sjh-accounting/
├── app/
│   ├── components/
│   │   ├── ui/                   # shadcn-vue components
│   │   ├── forms/                # Dynamic form system
│   │   ├── Auth/                 # Authentication forms
│   │   ├── admin/                # Admin components (FormBuilder)
│   │   ├── portal/               # Client portal components
│   │   ├── layout/               # Header, Footer
│   │   └── home/                 # Home page sections
│   ├── composables/              # Vue composables
│   │   ├── useDirectusAuth.ts
│   │   ├── useDirectusItems.ts
│   │   ├── useDirectusFiles.ts
│   │   └── useGsap.ts
│   ├── layouts/
│   │   ├── default.vue           # Public pages
│   │   ├── portal.vue            # Client portal
│   │   ├── admin.vue             # Admin panel
│   │   └── auth.vue              # Login/register
│   ├── middleware/
│   │   ├── auth.ts               # Require authentication
│   │   └── guest.ts              # Redirect if logged in
│   └── pages/
│       ├── index.vue             # Home
│       ├── upload.vue            # Document upload
│       ├── tax-planning.vue      # Tax questionnaire
│       ├── portal/               # Client portal
│       │   ├── login.vue
│       │   └── index.vue
│       └── admin/                # Admin panel
│           ├── forms/
│           │   ├── index.vue     # Form list
│           │   └── [id].vue      # Form editor
│           └── submissions.vue
├── server/
│   ├── api/
│   │   ├── auth/                 # Auth endpoints
│   │   ├── directus/             # Directus proxy
│   │   └── forms/                # Form submission
│   └── utils/
│       ├── directus.ts
│       └── session.ts
├── types/directus.ts
└── scripts/setup-directus-collections.ts
```

## 📦 Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your values

# 3. Set up Directus collections
pnpm tsx scripts/setup-directus-collections.ts

# 4. Start development
pnpm dev
```

## 🔐 Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Marketing website |
| `/upload` | Public | Document upload |
| `/tax-planning` | Public | Tax questionnaire |
| `/portal/login` | Guest | Client login |
| `/portal` | Auth | Client dashboard |
| `/admin/login` | Guest | Admin login |
| `/admin/forms` | Admin | Form builder |

## 🎨 Visual Form Builder

Create forms visually with:
- **12 field types**: Text, Email, Phone, Number, Date, Textarea, Select, Checkbox, Radio, File Upload, Heading, Paragraph
- **Drag-and-drop** field placement
- **Live preview** of forms
- **Field settings**: Label, placeholder, help text, required, width

## 📧 Environment Variables

```env
DIRECTUS_URL=https://your-directus.com
DIRECTUS_WEBSOCKET_URL=wss://your-directus.com/websocket
DIRECTUS_STATIC_TOKEN=your-admin-token
NUXT_SESSION_PASSWORD=32-character-minimum-password
SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_FROM_EMAIL=noreply@sjhaccounting.com
NOTIFICATION_EMAIL=sjh@sjhas.com
SITE_URL=https://sjhaccounting.com
```

## 🚀 Deployment

```bash
# Build
pnpm build

# Preview
pnpm preview

# Production (Node.js)
node .output/server/index.mjs
```

---

Built with ❤️ by [Hue Studios](https://huestudios.com)

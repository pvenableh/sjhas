/**
 * Directus Collections Setup Script
 *
 * This script creates all the necessary collections in Directus for the SJH Accounting website.
 * Run with: pnpm tsx scripts/setup-directus-collections.ts
 *
 * Required environment variables:
 * - DIRECTUS_URL: Your Directus instance URL
 * - DIRECTUS_STATIC_TOKEN: Admin token with full permissions
 */

import 'dotenv/config'

const DIRECTUS_URL = process.env.DIRECTUS_URL
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN

if (!DIRECTUS_URL || !DIRECTUS_TOKEN) {
  console.error('Missing required environment variables: DIRECTUS_URL and DIRECTUS_STATIC_TOKEN')
  process.exit(1)
}

async function createCollection(name: string, schema: any, meta: any = {}) {
  const response = await fetch(`${DIRECTUS_URL}/collections`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DIRECTUS_TOKEN}`,
    },
    body: JSON.stringify({
      collection: name,
      schema,
      meta: {
        icon: 'box',
        ...meta,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    if (error.includes('already exists')) {
      console.log(`  ℹ Collection "${name}" already exists, skipping...`)
      return false
    }
    throw new Error(`Failed to create collection "${name}": ${error}`)
  }

  console.log(`  ✓ Created collection "${name}"`)
  return true
}

async function createField(collection: string, field: any) {
  const response = await fetch(`${DIRECTUS_URL}/fields/${collection}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DIRECTUS_TOKEN}`,
    },
    body: JSON.stringify(field),
  })

  if (!response.ok) {
    const error = await response.text()
    if (error.includes('already exists')) {
      return false
    }
    console.error(`Failed to create field "${field.field}" in "${collection}": ${error}`)
    return false
  }

  return true
}

async function setupCollections() {
  console.log('\n🚀 Setting up Directus collections for SJH Accounting...\n')

  // ============================================
  // Site Settings (Singleton)
  // ============================================
  console.log('📦 Creating site_settings collection...')
  await createCollection('site_settings', { schema: {} }, {
    singleton: true,
    icon: 'settings',
    note: 'Global site settings and contact information',
  })

  const siteSettingsFields = [
    { field: 'site_name', type: 'string', meta: { interface: 'input', width: 'half' }, schema: { default_value: 'SJHAS, Inc.' } },
    { field: 'site_description', type: 'text', meta: { interface: 'input-multiline', width: 'full' } },
    { field: 'logo', type: 'uuid', meta: { interface: 'file-image', width: 'half' }, schema: {} },
    { field: 'contact_email', type: 'string', meta: { interface: 'input', width: 'half' }, schema: { default_value: 'sjh@sjhas.com' } },
    { field: 'contact_phone', type: 'string', meta: { interface: 'input', width: 'half' } },
    { field: 'address_line_1', type: 'string', meta: { interface: 'input', width: 'half' } },
    { field: 'address_line_2', type: 'string', meta: { interface: 'input', width: 'half' } },
    { field: 'city', type: 'string', meta: { interface: 'input', width: 'third' } },
    { field: 'state', type: 'string', meta: { interface: 'input', width: 'third' } },
    { field: 'zip_code', type: 'string', meta: { interface: 'input', width: 'third' } },
    { field: 'hours_monday', type: 'string', meta: { interface: 'input', width: 'half' } },
    { field: 'hours_tuesday', type: 'string', meta: { interface: 'input', width: 'half' } },
    { field: 'hours_wednesday', type: 'string', meta: { interface: 'input', width: 'half' } },
    { field: 'hours_thursday', type: 'string', meta: { interface: 'input', width: 'half' } },
    { field: 'hours_friday', type: 'string', meta: { interface: 'input', width: 'half' } },
    { field: 'hours_saturday', type: 'string', meta: { interface: 'input', width: 'half' } },
    { field: 'hours_sunday', type: 'string', meta: { interface: 'input', width: 'half' } },
  ]

  for (const field of siteSettingsFields) {
    await createField('site_settings', field)
  }

  // ============================================
  // Home Page (Singleton)
  // ============================================
  console.log('📦 Creating home_page collection...')
  await createCollection('home_page', { schema: {} }, {
    singleton: true,
    icon: 'home',
    note: 'Home page content sections',
  })

  const homePageFields = [
    { field: 'hero_title', type: 'string', meta: { interface: 'input', width: 'full' } },
    { field: 'hero_subtitle', type: 'text', meta: { interface: 'input-multiline', width: 'full' } },
    { field: 'hero_cta_text', type: 'string', meta: { interface: 'input', width: 'half' } },
    { field: 'hero_cta_link', type: 'string', meta: { interface: 'input', width: 'half' } },
    { field: 'about_title', type: 'string', meta: { interface: 'input', width: 'full' } },
    { field: 'about_content', type: 'text', meta: { interface: 'input-rich-text-md', width: 'full' } },
    { field: 'about_image', type: 'uuid', meta: { interface: 'file-image', width: 'half' } },
    { field: 'services_title', type: 'string', meta: { interface: 'input', width: 'full' } },
    { field: 'testimonials_title', type: 'string', meta: { interface: 'input', width: 'full' } },
    { field: 'contact_title', type: 'string', meta: { interface: 'input', width: 'full' } },
  ]

  for (const field of homePageFields) {
    await createField('home_page', field)
  }

  // ============================================
  // Services
  // ============================================
  console.log('📦 Creating services collection...')
  await createCollection('services', { schema: {} }, {
    icon: 'work',
    note: 'Services offered by the firm',
    sort_field: 'sort',
  })

  const servicesFields = [
    { field: 'status', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Published', value: 'published' }, { text: 'Draft', value: 'draft' }, { text: 'Archived', value: 'archived' }] }, width: 'half' }, schema: { default_value: 'draft' } },
    { field: 'sort', type: 'integer', meta: { interface: 'input', hidden: true } },
    { field: 'title', type: 'string', meta: { interface: 'input', width: 'full', required: true } },
    { field: 'short_description', type: 'text', meta: { interface: 'input-multiline', width: 'full' } },
    { field: 'full_description', type: 'text', meta: { interface: 'input-rich-text-md', width: 'full' } },
    { field: 'icon', type: 'string', meta: { interface: 'input', width: 'half', note: 'Lucide icon name (e.g., lucide:calculator)' } },
    { field: 'cta_text', type: 'string', meta: { interface: 'input', width: 'half' } },
    { field: 'cta_link', type: 'string', meta: { interface: 'input', width: 'half' } },
  ]

  for (const field of servicesFields) {
    await createField('services', field)
  }

  // ============================================
  // Testimonials
  // ============================================
  console.log('📦 Creating testimonials collection...')
  await createCollection('testimonials', { schema: {} }, {
    icon: 'format_quote',
    note: 'Client testimonials',
    sort_field: 'sort',
  })

  const testimonialsFields = [
    { field: 'status', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Published', value: 'published' }, { text: 'Draft', value: 'draft' }, { text: 'Archived', value: 'archived' }] }, width: 'half' }, schema: { default_value: 'draft' } },
    { field: 'sort', type: 'integer', meta: { interface: 'input', hidden: true } },
    { field: 'quote', type: 'text', meta: { interface: 'input-multiline', width: 'full', required: true } },
    { field: 'author_name', type: 'string', meta: { interface: 'input', width: 'half', required: true } },
    { field: 'author_title', type: 'string', meta: { interface: 'input', width: 'half' } },
    { field: 'author_image', type: 'uuid', meta: { interface: 'file-image', width: 'half' } },
    { field: 'featured', type: 'boolean', meta: { interface: 'boolean', width: 'half' }, schema: { default_value: false } },
  ]

  for (const field of testimonialsFields) {
    await createField('testimonials', field)
  }

  // ============================================
  // Forms
  // ============================================
  console.log('📦 Creating forms collection...')
  await createCollection('forms', { schema: {} }, {
    icon: 'dynamic_form',
    note: 'Dynamic form definitions',
  })

  const formsFields = [
    { field: 'status', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Published', value: 'published' }, { text: 'Draft', value: 'draft' }, { text: 'Archived', value: 'archived' }] }, width: 'half' }, schema: { default_value: 'draft' } },
    { field: 'title', type: 'string', meta: { interface: 'input', width: 'full', required: true } },
    { field: 'slug', type: 'string', meta: { interface: 'input', width: 'half', required: true, note: 'URL-friendly identifier' } },
    { field: 'description', type: 'text', meta: { interface: 'input-multiline', width: 'full' } },
    { field: 'success_message', type: 'text', meta: { interface: 'input-multiline', width: 'full' } },
    { field: 'notify_email', type: 'string', meta: { interface: 'input', width: 'half' } },
    { field: 'notify_on_submission', type: 'boolean', meta: { interface: 'boolean', width: 'half' }, schema: { default_value: true } },
    { field: 'allow_file_uploads', type: 'boolean', meta: { interface: 'boolean', width: 'half' }, schema: { default_value: true } },
    { field: 'max_file_size_mb', type: 'integer', meta: { interface: 'input', width: 'half' }, schema: { default_value: 10 } },
    { field: 'allowed_file_types', type: 'string', meta: { interface: 'input', width: 'full', note: 'Comma-separated list of extensions (e.g., .pdf,.doc,.docx)' } },
    { field: 'fields', type: 'json', meta: { interface: 'input-code', options: { language: 'json' }, width: 'full', note: 'JSON array of form field definitions' } },
  ]

  for (const field of formsFields) {
    await createField('forms', field)
  }

  // ============================================
  // Form Submissions
  // ============================================
  console.log('📦 Creating form_submissions collection...')
  await createCollection('form_submissions', { schema: {} }, {
    icon: 'inbox',
    note: 'Submitted form data',
  })

  const submissionsFields = [
    { field: 'form', type: 'integer', meta: { interface: 'select-dropdown-m2o', width: 'half' } },
    { field: 'data', type: 'json', meta: { interface: 'input-code', options: { language: 'json' }, width: 'full' } },
    { field: 'submitter_email', type: 'string', meta: { interface: 'input', width: 'half' } },
    { field: 'submitter_name', type: 'string', meta: { interface: 'input', width: 'half' } },
    { field: 'ip_address', type: 'string', meta: { interface: 'input', width: 'half', readonly: true } },
    { field: 'user_agent', type: 'string', meta: { interface: 'input', width: 'full', readonly: true } },
    { field: 'status', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'New', value: 'new' }, { text: 'Reviewed', value: 'reviewed' }, { text: 'Archived', value: 'archived' }] }, width: 'half' }, schema: { default_value: 'new' } },
    { field: 'notes', type: 'text', meta: { interface: 'input-multiline', width: 'full' } },
  ]

  for (const field of submissionsFields) {
    await createField('form_submissions', field)
  }

  // ============================================
  // Pages
  // ============================================
  console.log('📦 Creating pages collection...')
  await createCollection('pages', { schema: {} }, {
    icon: 'article',
    note: 'Additional pages',
  })

  const pagesFields = [
    { field: 'status', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Published', value: 'published' }, { text: 'Draft', value: 'draft' }, { text: 'Archived', value: 'archived' }] }, width: 'half' }, schema: { default_value: 'draft' } },
    { field: 'title', type: 'string', meta: { interface: 'input', width: 'full', required: true } },
    { field: 'slug', type: 'string', meta: { interface: 'input', width: 'half', required: true } },
    { field: 'meta_description', type: 'string', meta: { interface: 'input', width: 'full' } },
    { field: 'content', type: 'text', meta: { interface: 'input-rich-text-md', width: 'full' } },
  ]

  for (const field of pagesFields) {
    await createField('pages', field)
  }

  console.log('\n✅ Directus collections setup complete!\n')
  console.log('Next steps:')
  console.log('  1. Log into your Directus admin panel')
  console.log('  2. Set up relationships between collections if needed')
  console.log('  3. Configure public permissions for read access')
  console.log('  4. Add initial content to the site_settings and home_page collections')
  console.log('')
}

// Run the setup
setupCollections().catch((error) => {
  console.error('\n❌ Setup failed:', error.message)
  process.exit(1)
})

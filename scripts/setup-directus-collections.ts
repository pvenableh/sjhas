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

import "dotenv/config";

const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN;

if (!DIRECTUS_URL || !DIRECTUS_TOKEN) {
  console.error(
    "Missing required environment variables: DIRECTUS_URL and DIRECTUS_STATIC_TOKEN",
  );
  process.exit(1);
}

async function createCollection(name: string, schema: any, meta: any = {}) {
  const response = await fetch(`${DIRECTUS_URL}/collections`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DIRECTUS_TOKEN}`,
    },
    body: JSON.stringify({
      collection: name,
      schema,
      meta: {
        icon: "box",
        ...meta,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    if (error.includes("already exists")) {
      console.log(`  ℹ Collection "${name}" already exists, skipping...`);
      return false;
    }
    throw new Error(`Failed to create collection "${name}": ${error}`);
  }

  console.log(`  ✓ Created collection "${name}"`);
  return true;
}

async function createField(collection: string, field: any) {
  const response = await fetch(`${DIRECTUS_URL}/fields/${collection}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DIRECTUS_TOKEN}`,
    },
    body: JSON.stringify(field),
  });

  if (!response.ok) {
    const error = await response.text();
    if (error.includes("already exists")) {
      console.log(`    ℹ Field "${field.field}" already exists, skipping...`);
      return false;
    }
    console.error(
      `    ✗ Failed to create field "${field.field}" in "${collection}": ${error}`,
    );
    return false;
  }

  console.log(`    ✓ Created field "${field.field}"`);
  return true;
}

async function createRelation(relation: any) {
  const response = await fetch(`${DIRECTUS_URL}/relations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DIRECTUS_TOKEN}`,
    },
    body: JSON.stringify(relation),
  });

  if (!response.ok) {
    const error = await response.text();
    if (error.includes("already exists")) {
      console.log(`    ℹ Relation already exists, skipping...`);
      return false;
    }
    console.error(`    ✗ Failed to create relation: ${error}`);
    return false;
  }

  console.log(
    `    ✓ Created relation: ${relation.collection}.${relation.field} -> ${relation.related_collection}`,
  );
  return true;
}

async function setupCollections() {
  console.log("\n🚀 Setting up Directus collections for SJH Accounting...\n");

  // ============================================
  // Site Settings (Singleton)
  // ============================================
  console.log("📦 Creating site_settings collection...");
  await createCollection(
    "site_settings",
    { schema: {} },
    {
      singleton: true,
      icon: "settings",
      note: "Global site settings and contact information",
    },
  );

  const siteSettingsFields = [
    {
      field: "site_name",
      type: "string",
      schema: { default_value: "SJHAS, Inc.", is_nullable: true },
      meta: { interface: "input", width: "half" },
    },
    {
      field: "site_description",
      type: "text",
      schema: { is_nullable: true },
      meta: { interface: "input-multiline", width: "full" },
    },
    {
      field: "logo",
      type: "uuid",
      schema: { is_nullable: true },
      meta: {
        interface: "file-image",
        special: ["file"],
        width: "half",
      },
    },
    {
      field: "contact_email",
      type: "string",
      schema: { default_value: "sjh@sjhas.com", is_nullable: true },
      meta: { interface: "input", width: "half" },
    },
    {
      field: "contact_phone",
      type: "string",
      schema: { is_nullable: true },
      meta: { interface: "input", width: "half" },
    },
    {
      field: "address_line_1",
      type: "string",
      schema: { is_nullable: true },
      meta: { interface: "input", width: "half" },
    },
    {
      field: "address_line_2",
      type: "string",
      schema: { is_nullable: true },
      meta: { interface: "input", width: "half" },
    },
    {
      field: "city",
      type: "string",
      schema: { is_nullable: true },
      meta: { interface: "input", width: "third" },
    },
    {
      field: "state",
      type: "string",
      schema: { is_nullable: true },
      meta: { interface: "input", width: "third" },
    },
    {
      field: "zip_code",
      type: "string",
      schema: { is_nullable: true },
      meta: { interface: "input", width: "third" },
    },
    {
      field: "hours_monday",
      type: "string",
      schema: { is_nullable: true },
      meta: { interface: "input", width: "half" },
    },
    {
      field: "hours_tuesday",
      type: "string",
      schema: { is_nullable: true },
      meta: { interface: "input", width: "half" },
    },
    {
      field: "hours_wednesday",
      type: "string",
      schema: { is_nullable: true },
      meta: { interface: "input", width: "half" },
    },
    {
      field: "hours_thursday",
      type: "string",
      schema: { is_nullable: true },
      meta: { interface: "input", width: "half" },
    },
    {
      field: "hours_friday",
      type: "string",
      schema: { is_nullable: true },
      meta: { interface: "input", width: "half" },
    },
    {
      field: "hours_saturday",
      type: "string",
      schema: { is_nullable: true },
      meta: { interface: "input", width: "half" },
    },
    {
      field: "hours_sunday",
      type: "string",
      schema: { is_nullable: true },
      meta: { interface: "input", width: "half" },
    },
  ];

  console.log("  Creating fields for site_settings...");
  for (const field of siteSettingsFields) {
    await createField("site_settings", field);
  }

  // Create relation for logo -> directus_files
  await createRelation({
    collection: "site_settings",
    field: "logo",
    related_collection: "directus_files",
    meta: { one_field: null },
    schema: { on_delete: "SET NULL" },
  });

  // ============================================
  // Home Page (Singleton)
  // ============================================
  console.log("\n📦 Creating home_page collection...");
  await createCollection(
    "home_page",
    { schema: {} },
    {
      singleton: true,
      icon: "home",
      note: "Home page content sections",
    },
  );

  const homePageFields = [
    {
      field: "hero_title",
      type: "string",
      schema: { is_nullable: true },
      meta: { interface: "input", width: "full" },
    },
    {
      field: "hero_subtitle",
      type: "text",
      schema: { is_nullable: true },
      meta: { interface: "input-multiline", width: "full" },
    },
    {
      field: "hero_cta_text",
      type: "string",
      schema: { is_nullable: true },
      meta: { interface: "input", width: "half" },
    },
    {
      field: "hero_cta_link",
      type: "string",
      schema: { is_nullable: true },
      meta: { interface: "input", width: "half" },
    },
    {
      field: "about_title",
      type: "string",
      schema: { is_nullable: true },
      meta: { interface: "input", width: "full" },
    },
    {
      field: "about_content",
      type: "text",
      schema: { is_nullable: true },
      meta: { interface: "input-rich-text-md", width: "full" },
    },
    {
      field: "about_image",
      type: "uuid",
      schema: { is_nullable: true },
      meta: {
        interface: "file-image",
        special: ["file"],
        width: "half",
      },
    },
    {
      field: "services_title",
      type: "string",
      schema: { is_nullable: true },
      meta: { interface: "input", width: "full" },
    },
    {
      field: "testimonials_title",
      type: "string",
      schema: { is_nullable: true },
      meta: { interface: "input", width: "full" },
    },
    {
      field: "contact_title",
      type: "string",
      schema: { is_nullable: true },
      meta: { interface: "input", width: "full" },
    },
  ];

  console.log("  Creating fields for home_page...");
  for (const field of homePageFields) {
    await createField("home_page", field);
  }

  // Create relation for about_image -> directus_files
  await createRelation({
    collection: "home_page",
    field: "about_image",
    related_collection: "directus_files",
    meta: { one_field: null },
    schema: { on_delete: "SET NULL" },
  });

  // ============================================
  // Services
  // ============================================
  console.log("\n📦 Creating services collection...");
  await createCollection(
    "services",
    { schema: {} },
    {
      icon: "work",
      note: "Services offered by the firm",
      sort_field: "sort",
    },
  );

  const servicesFields = [
    {
      field: "status",
      type: "string",
      schema: { default_value: "draft", is_nullable: false },
      meta: {
        interface: "select-dropdown",
        options: {
          choices: [
            { text: "Published", value: "published" },
            { text: "Draft", value: "draft" },
            { text: "Archived", value: "archived" },
          ],
        },
        width: "half",
      },
    },
    {
      field: "sort",
      type: "integer",
      schema: { is_nullable: true },
      meta: { interface: "input", hidden: true },
    },
    {
      field: "title",
      type: "string",
      schema: { is_nullable: false },
      meta: { interface: "input", width: "full", required: true },
    },
    {
      field: "short_description",
      type: "text",
      schema: { is_nullable: true },
      meta: { interface: "input-multiline", width: "full" },
    },
    {
      field: "full_description",
      type: "text",
      schema: { is_nullable: true },
      meta: { interface: "input-rich-text-md", width: "full" },
    },
    {
      field: "icon",
      type: "string",
      schema: { is_nullable: true },
      meta: {
        interface: "input",
        width: "half",
        note: "Lucide icon name (e.g., lucide:calculator)",
      },
    },
    {
      field: "cta_text",
      type: "string",
      schema: { is_nullable: true },
      meta: { interface: "input", width: "half" },
    },
    {
      field: "cta_link",
      type: "string",
      schema: { is_nullable: true },
      meta: { interface: "input", width: "half" },
    },
  ];

  console.log("  Creating fields for services...");
  for (const field of servicesFields) {
    await createField("services", field);
  }

  // ============================================
  // Testimonials
  // ============================================
  console.log("\n📦 Creating testimonials collection...");
  await createCollection(
    "testimonials",
    { schema: {} },
    {
      icon: "format_quote",
      note: "Client testimonials",
      sort_field: "sort",
    },
  );

  const testimonialsFields = [
    {
      field: "status",
      type: "string",
      schema: { default_value: "draft", is_nullable: false },
      meta: {
        interface: "select-dropdown",
        options: {
          choices: [
            { text: "Published", value: "published" },
            { text: "Draft", value: "draft" },
            { text: "Archived", value: "archived" },
          ],
        },
        width: "half",
      },
    },
    {
      field: "sort",
      type: "integer",
      schema: { is_nullable: true },
      meta: { interface: "input", hidden: true },
    },
    {
      field: "quote",
      type: "text",
      schema: { is_nullable: false },
      meta: { interface: "input-multiline", width: "full", required: true },
    },
    {
      field: "author_name",
      type: "string",
      schema: { is_nullable: false },
      meta: { interface: "input", width: "half", required: true },
    },
    {
      field: "author_title",
      type: "string",
      schema: { is_nullable: true },
      meta: { interface: "input", width: "half" },
    },
    {
      field: "author_image",
      type: "uuid",
      schema: { is_nullable: true },
      meta: {
        interface: "file-image",
        special: ["file"],
        width: "half",
      },
    },
    {
      field: "featured",
      type: "boolean",
      schema: { default_value: false, is_nullable: false },
      meta: { interface: "boolean", width: "half" },
    },
  ];

  console.log("  Creating fields for testimonials...");
  for (const field of testimonialsFields) {
    await createField("testimonials", field);
  }

  // Create relation for author_image -> directus_files
  await createRelation({
    collection: "testimonials",
    field: "author_image",
    related_collection: "directus_files",
    meta: { one_field: null },
    schema: { on_delete: "SET NULL" },
  });

  // ============================================
  // Forms
  // ============================================
  console.log("\n📦 Creating forms collection...");
  await createCollection(
    "forms",
    { schema: {} },
    {
      icon: "dynamic_form",
      note: "Dynamic form definitions",
    },
  );

  const formsFields = [
    {
      field: "status",
      type: "string",
      schema: { default_value: "draft", is_nullable: false },
      meta: {
        interface: "select-dropdown",
        options: {
          choices: [
            { text: "Published", value: "published" },
            { text: "Draft", value: "draft" },
            { text: "Archived", value: "archived" },
          ],
        },
        width: "half",
      },
    },
    {
      field: "title",
      type: "string",
      schema: { is_nullable: false },
      meta: { interface: "input", width: "full", required: true },
    },
    {
      field: "slug",
      type: "string",
      schema: { is_nullable: false, is_unique: true },
      meta: {
        interface: "input",
        width: "half",
        required: true,
        note: "URL-friendly identifier",
      },
    },
    {
      field: "description",
      type: "text",
      schema: { is_nullable: true },
      meta: { interface: "input-multiline", width: "full" },
    },
    {
      field: "success_message",
      type: "text",
      schema: { is_nullable: true },
      meta: { interface: "input-multiline", width: "full" },
    },
    {
      field: "notify_email",
      type: "string",
      schema: { is_nullable: true },
      meta: { interface: "input", width: "half" },
    },
    {
      field: "notify_on_submission",
      type: "boolean",
      schema: { default_value: true, is_nullable: false },
      meta: { interface: "boolean", width: "half" },
    },
    {
      field: "allow_file_uploads",
      type: "boolean",
      schema: { default_value: true, is_nullable: false },
      meta: { interface: "boolean", width: "half" },
    },
    {
      field: "max_file_size_mb",
      type: "integer",
      schema: { default_value: 10, is_nullable: true },
      meta: { interface: "input", width: "half" },
    },
    {
      field: "allowed_file_types",
      type: "string",
      schema: { is_nullable: true },
      meta: {
        interface: "input",
        width: "full",
        note: "Comma-separated list of extensions (e.g., .pdf,.doc,.docx)",
      },
    },
    {
      field: "fields",
      type: "json",
      schema: { is_nullable: true },
      meta: {
        interface: "input-code",
        options: { language: "json" },
        width: "full",
        note: "JSON array of form field definitions",
      },
    },
  ];

  console.log("  Creating fields for forms...");
  for (const field of formsFields) {
    await createField("forms", field);
  }

  // ============================================
  // Form Submissions
  // ============================================
  console.log("\n📦 Creating form_submissions collection...");
  await createCollection(
    "form_submissions",
    { schema: {} },
    {
      icon: "inbox",
      note: "Submitted form data",
    },
  );

  const submissionsFields = [
    {
      field: "form",
      type: "integer",
      schema: { is_nullable: true },
      meta: {
        interface: "select-dropdown-m2o",
        special: ["m2o"],
        width: "half",
        options: {
          template: "{{title}}",
        },
      },
    },
    {
      field: "data",
      type: "json",
      schema: { is_nullable: true },
      meta: {
        interface: "input-code",
        options: { language: "json" },
        width: "full",
      },
    },
    {
      field: "submitter_email",
      type: "string",
      schema: { is_nullable: true },
      meta: { interface: "input", width: "half" },
    },
    {
      field: "submitter_name",
      type: "string",
      schema: { is_nullable: true },
      meta: { interface: "input", width: "half" },
    },
    {
      field: "ip_address",
      type: "string",
      schema: { is_nullable: true },
      meta: { interface: "input", width: "half", readonly: true },
    },
    {
      field: "user_agent",
      type: "string",
      schema: { is_nullable: true },
      meta: { interface: "input", width: "full", readonly: true },
    },
    {
      field: "status",
      type: "string",
      schema: { default_value: "new", is_nullable: false },
      meta: {
        interface: "select-dropdown",
        options: {
          choices: [
            { text: "New", value: "new" },
            { text: "Reviewed", value: "reviewed" },
            { text: "Archived", value: "archived" },
          ],
        },
        width: "half",
      },
    },
    {
      field: "notes",
      type: "text",
      schema: { is_nullable: true },
      meta: { interface: "input-multiline", width: "full" },
    },
  ];

  console.log("  Creating fields for form_submissions...");
  for (const field of submissionsFields) {
    await createField("form_submissions", field);
  }

  // Create M2O relation: form_submissions.form -> forms
  await createRelation({
    collection: "form_submissions",
    field: "form",
    related_collection: "forms",
    meta: {
      one_field: "submissions", // This creates the reverse O2M field on forms
      sort_field: null,
      one_deselect_action: "nullify",
    },
    schema: {
      on_delete: "SET NULL",
    },
  });

  // ============================================
  // Pages
  // ============================================
  console.log("\n📦 Creating pages collection...");
  await createCollection(
    "pages",
    { schema: {} },
    {
      icon: "article",
      note: "Additional pages",
    },
  );

  const pagesFields = [
    {
      field: "status",
      type: "string",
      schema: { default_value: "draft", is_nullable: false },
      meta: {
        interface: "select-dropdown",
        options: {
          choices: [
            { text: "Published", value: "published" },
            { text: "Draft", value: "draft" },
            { text: "Archived", value: "archived" },
          ],
        },
        width: "half",
      },
    },
    {
      field: "title",
      type: "string",
      schema: { is_nullable: false },
      meta: { interface: "input", width: "full", required: true },
    },
    {
      field: "slug",
      type: "string",
      schema: { is_nullable: false, is_unique: true },
      meta: { interface: "input", width: "half", required: true },
    },
    {
      field: "meta_description",
      type: "string",
      schema: { is_nullable: true },
      meta: { interface: "input", width: "full" },
    },
    {
      field: "content",
      type: "text",
      schema: { is_nullable: true },
      meta: { interface: "input-rich-text-md", width: "full" },
    },
  ];

  console.log("  Creating fields for pages...");
  for (const field of pagesFields) {
    await createField("pages", field);
  }

  // ============================================
  // Summary
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("✅ Directus collections setup complete!\n");
  console.log("Collections created:");
  console.log("  • site_settings (singleton)");
  console.log("  • home_page (singleton)");
  console.log("  • services");
  console.log("  • testimonials");
  console.log("  • forms");
  console.log("  • form_submissions");
  console.log("  • pages");
  console.log("");
  console.log("Relationships configured:");
  console.log("  • site_settings.logo -> directus_files");
  console.log("  • home_page.about_image -> directus_files");
  console.log("  • testimonials.author_image -> directus_files");
  console.log("  • form_submissions.form -> forms (M2O)");
  console.log("");
  console.log("Next steps:");
  console.log("  1. Log into your Directus admin panel");
  console.log("  2. Configure public permissions for read access on:");
  console.log(
    "     - site_settings, home_page, services, testimonials, forms, pages",
  );
  console.log(
    "  3. Add initial content to the site_settings and home_page collections",
  );
  console.log("  4. Create some services and testimonials");
  console.log("");
}

// Run the setup
setupCollections().catch((error) => {
  console.error("\n❌ Setup failed:", error.message);
  process.exit(1);
});

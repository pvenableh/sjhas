/**
 * Directus Content Seeding Script
 *
 * This script:
 * 1. Sets up public read permissions for frontend collections
 * 2. Seeds initial content from the existing sjhaccounting.com website
 *
 * Run with: npx tsx scripts/seed-directus-content.ts
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

// ============================================
// Helper Functions
// ============================================

async function apiRequest(
  endpoint: string,
  method: string = "GET",
  body?: any,
  expectJson: boolean = true,
) {
  const response = await fetch(`${DIRECTUS_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DIRECTUS_TOKEN}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API request failed: ${response.status} - ${error}`);
  }

  // Some endpoints return plain text (like /server/ping)
  if (!expectJson) {
    return await response.text();
  }

  const data = await response.json();
  return data.data;
}

async function getPublicRoleId(): Promise<string | null> {
  try {
    const roles = await apiRequest("/roles");
    const publicRole = roles.find(
      (r: any) => r.name === "Public" || r.id === "public",
    );
    return publicRole?.id || null;
  } catch (error) {
    console.error("Failed to get public role:", error);
    return null;
  }
}

async function createPermission(
  roleId: string | null,
  collection: string,
  action: string,
  fields: string = "*",
) {
  try {
    await apiRequest("/permissions", "POST", {
      role: roleId, // null = public
      collection,
      action,
      fields: [fields],
      permissions: {},
      validation: {},
    });
    console.log(`    ✓ Created ${action} permission for ${collection}`);
    return true;
  } catch (error: any) {
    if (
      error.message?.includes("already exists") ||
      error.message?.includes("Duplicate")
    ) {
      console.log(
        `    ℹ Permission already exists for ${collection}.${action}`,
      );
      return false;
    }
    console.error(
      `    ✗ Failed to create permission for ${collection}.${action}:`,
      error.message,
    );
    return false;
  }
}

async function updateSingleton(collection: string, data: any) {
  try {
    // First check if singleton exists
    try {
      await apiRequest(`/items/${collection}`);
      // Update existing
      await apiRequest(`/items/${collection}`, "PATCH", data);
      console.log(`    ✓ Updated ${collection}`);
    } catch {
      // Create new
      await apiRequest(`/items/${collection}`, "POST", data);
      console.log(`    ✓ Created ${collection}`);
    }
    return true;
  } catch (error: any) {
    console.error(`    ✗ Failed to update ${collection}:`, error.message);
    return false;
  }
}

async function createItem(collection: string, data: any) {
  try {
    const result = await apiRequest(`/items/${collection}`, "POST", data);
    console.log(
      `    ✓ Created item in ${collection}: ${data.title || data.author_name || "item"}`,
    );
    return result;
  } catch (error: any) {
    if (
      error.message?.includes("Duplicate") ||
      error.message?.includes("unique")
    ) {
      console.log(`    ℹ Item already exists in ${collection}`);
      return null;
    }
    console.error(
      `    ✗ Failed to create item in ${collection}:`,
      error.message,
    );
    return null;
  }
}

async function getItems(collection: string) {
  try {
    return await apiRequest(`/items/${collection}`);
  } catch {
    return [];
  }
}

// ============================================
// Main Setup Functions
// ============================================

async function setupPermissions() {
  console.log("\n🔐 Setting up public permissions...\n");

  // Collections that need public read access
  const publicReadCollections = [
    "site_settings",
    "home_page",
    "services",
    "testimonials",
    "forms",
    "pages",
  ];

  // Get public role (might be null for truly public access)
  const publicRoleId = await getPublicRoleId();
  console.log(`  Public role ID: ${publicRoleId || "null (anonymous)"}`);

  for (const collection of publicReadCollections) {
    console.log(`\n  Setting permissions for ${collection}...`);
    await createPermission(publicRoleId, collection, "read");
  }

  // Also allow public to read directus_files (for images)
  console.log(`\n  Setting permissions for directus_files...`);
  await createPermission(publicRoleId, "directus_files", "read");

  // Allow public to create form_submissions (for form submissions)
  console.log(`\n  Setting permissions for form_submissions...`);
  await createPermission(publicRoleId, "form_submissions", "create");

  console.log("\n✅ Permissions setup complete!");
}

async function seedContent() {
  console.log("\n📝 Seeding content from sjhaccounting.com...\n");

  // ============================================
  // Site Settings
  // ============================================
  console.log("  Updating site_settings...");
  await updateSingleton("site_settings", {
    site_name: "SJHAS, Inc.",
    site_description:
      "Personalized tax returns, accounting, and payroll services throughout Ithaca, Elmira, and Central New York since 2000.",
    contact_email: "sjh@sjhas.com",
    contact_phone: "(607) 216-8033",
    address_line_1: "P.O. Box 6623",
    address_line_2: "139 E. King Road",
    city: "Ithaca",
    state: "NY",
    zip_code: "14850",
    hours_monday: "1pm - 5pm",
    hours_tuesday: "9am - 4:30pm",
    hours_wednesday: "Closed",
    hours_thursday: "9am - 4:30pm",
    hours_friday: "9am - 1:30pm",
    hours_saturday: "Closed",
    hours_sunday: "Closed",
  });

  // ============================================
  // Home Page
  // ============================================
  console.log("\n  Updating home_page...");
  await updateSingleton("home_page", {
    hero_title: "It's not just about the numbers.",
    hero_subtitle:
      "Personalized tax returns, accounting, and payroll services that make a difference for your business and personal finances.",
    hero_cta_text: "Book a Consultation",
    hero_cta_link: "https://app.reclaim.ai/m/sjhas/quick-meeting",
    about_title: "SJHAS, Inc.",
    about_content: `SJHAS Inc. has been providing clients personalized tax returns, accounting, and payroll services throughout Ithaca, Elmira, and the Central New York area since 2000.

With years of expansive financial knowledge, we are equipped to handle all of your accounting needs, no matter how complex. Whether you require assistance at the corporate or personal level, Stephen is ready to serve as your business consultant, financial and tax planner, payroll processor, and accounting advisor.`,
    services_title: "Our Services",
    testimonials_title: "What Our Clients Say",
    contact_title: "Contact Us",
  });

  // ============================================
  // Services
  // ============================================
  console.log("\n  Creating services...");

  // Check if services already exist
  const existingServices = await getItems("services");
  if (existingServices.length === 0) {
    await createItem("services", {
      status: "published",
      sort: 1,
      title: "Personal Tax Preparation",
      short_description:
        "We offer one on one help to make sure you have a Personal Tax Strategy and are prepared for the tax year.",
      full_description: `We offer one on one help to make sure you have a Personal Tax Strategy and are prepared for the tax year.

Our personal tax services include:
- Individual tax return preparation (Form 1040)
- Tax planning and strategy
- IRS representation and audit support
- State and local tax filings
- Estimated tax payment planning`,
      icon: "lucide:user",
      cta_text: "Contact us for a quote",
      cta_link: "#contact",
    });

    await createItem("services", {
      status: "published",
      sort: 2,
      title: "Business Tax Preparation",
      short_description:
        "We offer Business Tax Strategy & Preparation (C-Corp, S-Corp, Partnership) and support for Legal Incorporation & Organization Services.",
      full_description: `We offer Business Tax Strategy & Preparation (C-Corp, S-Corp, Partnership) and support for Legal Incorporation & Organization Services (INC, LLC, PC, PLLC).

Our business tax services include:
- Corporate tax returns (C-Corp, S-Corp)
- Partnership returns
- LLC tax filings
- Business entity formation guidance
- Tax planning strategies for businesses
- Quarterly estimated tax calculations`,
      icon: "lucide:building-2",
      cta_text: "Contact us for a quote",
      cta_link: "#contact",
    });

    await createItem("services", {
      status: "published",
      sort: 3,
      title: "Payroll Services",
      short_description:
        "Have payroll processing needs? Let us take care of them, freeing up your time for more important matters.",
      full_description: `Have payroll processing needs? Let us take care of them, freeing up your time for more important matters.

Our payroll services include:
- Payroll processing and direct deposit
- Payroll tax filings (941, 940, NYS-45)
- W-2 and 1099 preparation
- New hire reporting
- Workers' compensation audits
- Year-end payroll reconciliation`,
      icon: "lucide:wallet",
      cta_text: "Contact us for a quote",
      cta_link: "#contact",
    });
  } else {
    console.log("    ℹ Services already exist, skipping...");
  }

  // ============================================
  // Testimonials
  // ============================================
  console.log("\n  Creating testimonials...");

  const existingTestimonials = await getItems("testimonials");
  if (existingTestimonials.length === 0) {
    await createItem("testimonials", {
      status: "published",
      sort: 1,
      quote:
        'Stephen was the accountant for the previous owners of our realty co. We "inherited" him and we are so happy that we did! He does all of our tax filings for our property management/real estate corp. and our personal taxes. He\'s extremely honest and we have enjoyed working with him for over 10 years now. But, he has always taken a genuine interest as our accountant. We appreciate his knowledge and skill.',
      author_name: "MH",
      author_title: "Realtor",
      featured: true,
    });
  } else {
    console.log("    ℹ Testimonials already exist, skipping...");
  }

  // ============================================
  // Forms
  // ============================================
  console.log("\n  Creating forms...");

  const existingForms = await getItems("forms");
  if (existingForms.length === 0) {
    // Upload Form
    await createItem("forms", {
      status: "published",
      title: "Upload Files to SJHAS, Inc.",
      slug: "upload",
      description:
        "Upload your documents securely. We accept PDF, Word, Excel, and image files up to 10MB each.",
      success_message:
        "Thank you! Your documents have been uploaded successfully. We will review them and get back to you soon.",
      notify_email: "sjh@sjhas.com",
      notify_on_submission: true,
      allow_file_uploads: true,
      max_file_size_mb: 10,
      allowed_file_types:
        ".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif,.txt",
      fields: JSON.stringify([
        {
          id: "name",
          type: "text",
          label: "Your Name",
          name: "name",
          placeholder: "John Smith",
          required: true,
          width: "half",
          sort: 1,
        },
        {
          id: "email",
          type: "email",
          label: "Email Address",
          name: "email",
          placeholder: "john@example.com",
          help_text: "We'll send a confirmation to this address.",
          required: true,
          width: "half",
          sort: 2,
        },
        {
          id: "phone",
          type: "phone",
          label: "Phone Number",
          name: "phone",
          placeholder: "(607) 555-1234",
          required: false,
          width: "half",
          sort: 3,
        },
        {
          id: "document_type",
          type: "select",
          label: "Document Type",
          name: "document_type",
          placeholder: "Select document type",
          required: true,
          options: [
            { label: "Tax Documents", value: "tax" },
            { label: "W-2 Forms", value: "w2" },
            { label: "1099 Forms", value: "1099" },
            { label: "Business Documents", value: "business" },
            { label: "Payroll Documents", value: "payroll" },
            { label: "Other", value: "other" },
          ],
          width: "half",
          sort: 4,
        },
        {
          id: "files",
          type: "file",
          label: "Upload Documents",
          name: "files",
          help_text:
            "You can upload multiple files. Accepted formats: PDF, Word, Excel, CSV, images (max 10MB each).",
          required: true,
          width: "full",
          sort: 5,
        },
        {
          id: "notes",
          type: "textarea",
          label: "Additional Notes",
          name: "notes",
          placeholder: "Any additional information about these documents...",
          required: false,
          width: "full",
          sort: 6,
        },
      ]),
    });

    // Tax Planning Questionnaire
    await createItem("forms", {
      status: "published",
      title: "Tax Planning Questionnaire",
      slug: "tax-planning",
      description:
        "Please complete this questionnaire to help us prepare for your tax planning session. All information is kept strictly confidential.",
      success_message:
        "Thank you for completing the Tax Planning Questionnaire! We will review your responses and contact you to schedule your planning session.",
      notify_email: "sjh@sjhas.com",
      notify_on_submission: true,
      allow_file_uploads: true,
      max_file_size_mb: 10,
      allowed_file_types: ".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png",
      fields: JSON.stringify([
        // Personal Information
        {
          id: "section-personal",
          type: "heading",
          label: "Personal Information",
          name: "section_personal",
          help_text: "Please provide your contact details.",
          width: "full",
          sort: 1,
        },
        {
          id: "first_name",
          type: "text",
          label: "First Name",
          name: "first_name",
          placeholder: "John",
          required: true,
          width: "half",
          sort: 2,
        },
        {
          id: "last_name",
          type: "text",
          label: "Last Name",
          name: "last_name",
          placeholder: "Smith",
          required: true,
          width: "half",
          sort: 3,
        },
        {
          id: "email",
          type: "email",
          label: "Email Address",
          name: "email",
          placeholder: "john@example.com",
          required: true,
          width: "half",
          sort: 4,
        },
        {
          id: "phone",
          type: "phone",
          label: "Phone Number",
          name: "phone",
          placeholder: "(607) 555-1234",
          required: true,
          width: "half",
          sort: 5,
        },

        // Filing Status
        {
          id: "section-filing",
          type: "heading",
          label: "Filing Status",
          name: "section_filing",
          help_text: "Tell us about your tax filing situation.",
          width: "full",
          sort: 10,
        },
        {
          id: "filing_status",
          type: "select",
          label: "Filing Status",
          name: "filing_status",
          placeholder: "Select your filing status",
          required: true,
          width: "half",
          sort: 11,
          options: [
            { label: "Single", value: "single" },
            { label: "Married Filing Jointly", value: "married_joint" },
            { label: "Married Filing Separately", value: "married_separate" },
            { label: "Head of Household", value: "head_household" },
            { label: "Qualifying Widow(er)", value: "widow" },
          ],
        },
        {
          id: "dependents",
          type: "number",
          label: "Number of Dependents",
          name: "dependents",
          placeholder: "0",
          required: false,
          width: "half",
          sort: 12,
        },

        // Income Sources
        {
          id: "section-income",
          type: "heading",
          label: "Income Sources",
          name: "section_income",
          help_text: "Please indicate all sources of income.",
          width: "full",
          sort: 20,
        },
        {
          id: "has_w2",
          type: "checkbox",
          label: "I have W-2 income (employment)",
          name: "has_w2",
          width: "full",
          sort: 21,
        },
        {
          id: "has_1099",
          type: "checkbox",
          label: "I have 1099 income (self-employment/contract work)",
          name: "has_1099",
          width: "full",
          sort: 22,
        },
        {
          id: "has_investment",
          type: "checkbox",
          label: "I have investment income (dividends, capital gains)",
          name: "has_investment",
          width: "full",
          sort: 23,
        },
        {
          id: "has_rental",
          type: "checkbox",
          label: "I have rental income",
          name: "has_rental",
          width: "full",
          sort: 24,
        },
        {
          id: "has_retirement",
          type: "checkbox",
          label: "I have retirement income (pension, IRA distributions)",
          name: "has_retirement",
          width: "full",
          sort: 25,
        },
        {
          id: "has_social_security",
          type: "checkbox",
          label: "I receive Social Security benefits",
          name: "has_social_security",
          width: "full",
          sort: 26,
        },

        // Life Changes
        {
          id: "section-changes",
          type: "heading",
          label: "Life Changes This Year",
          name: "section_changes",
          help_text: "Have any of the following occurred this year?",
          width: "full",
          sort: 30,
        },
        {
          id: "change_marriage",
          type: "checkbox",
          label: "Got married or divorced",
          name: "change_marriage",
          width: "full",
          sort: 31,
        },
        {
          id: "change_child",
          type: "checkbox",
          label: "Had a child or adopted",
          name: "change_child",
          width: "full",
          sort: 32,
        },
        {
          id: "change_home",
          type: "checkbox",
          label: "Bought or sold a home",
          name: "change_home",
          width: "full",
          sort: 33,
        },
        {
          id: "change_job",
          type: "checkbox",
          label: "Changed jobs or started a business",
          name: "change_job",
          width: "full",
          sort: 34,
        },
        {
          id: "change_retirement",
          type: "checkbox",
          label: "Retired or started receiving retirement income",
          name: "change_retirement",
          width: "full",
          sort: 35,
        },

        // Documents
        {
          id: "section-documents",
          type: "heading",
          label: "Supporting Documents",
          name: "section_documents",
          help_text: "Upload any relevant documents you have available.",
          width: "full",
          sort: 40,
        },
        {
          id: "documents",
          type: "file",
          label: "Upload Documents (Optional)",
          name: "documents",
          help_text: "Upload W-2s, 1099s, or other relevant tax documents.",
          required: false,
          width: "full",
          sort: 41,
        },

        // Additional Notes
        {
          id: "additional_notes",
          type: "textarea",
          label: "Additional Information",
          name: "additional_notes",
          placeholder:
            "Please share any other information that would be helpful for your tax planning session...",
          required: false,
          width: "full",
          sort: 50,
        },
      ]),
    });
  } else {
    console.log("    ℹ Forms already exist, skipping...");
  }

  console.log("\n✅ Content seeding complete!");
}

// ============================================
// Main Execution
// ============================================

async function main() {
  console.log("=".repeat(60));
  console.log("🌱 Directus Content Seeding Script");
  console.log("=".repeat(60));
  console.log(`\nDirectus URL: ${DIRECTUS_URL}`);

  try {
    // Test connection
    console.log("\n🔌 Testing connection...");
    const ping = await apiRequest("/server/ping", "GET", undefined, false);
    console.log(`  ✓ Connected to Directus (${ping})`);

    // Setup permissions
    await setupPermissions();

    // Seed content
    await seedContent();

    console.log("\n" + "=".repeat(60));
    console.log("🎉 All done!");
    console.log("=".repeat(60));
    console.log("\nYour Directus instance is now configured with:");
    console.log("  • Public read permissions for frontend collections");
    console.log("  • Site settings with contact information");
    console.log("  • Home page content");
    console.log("  • 3 services");
    console.log("  • 1 testimonial");
    console.log("  • 2 forms (Upload & Tax Planning)");
    console.log("\nNext steps:");
    console.log("  1. Log into Directus and upload a logo image");
    console.log("  2. Add the about section image");
    console.log("  3. Add more testimonials if desired");
    console.log("  4. Start your Nuxt development server: pnpm dev");
    console.log("");
  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

main();

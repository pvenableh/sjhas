/**
 * Directus Client Role & Permissions Setup Script
 *
 * Creates a "Client" role with an access policy and granular permissions
 * for the client portal. Clients can:
 *   - Read/update their own user profile
 *   - Read their own form submissions
 *   - Read published forms (titles only, for submission context)
 *   - Upload, read, and delete their own files
 *   - Read site_settings (for portal branding)
 *
 * Run with: pnpm tsx scripts/setup-client-permissions.ts
 *
 * Required environment variables:
 *   DIRECTUS_URL          - Your Directus instance URL
 *   DIRECTUS_STATIC_TOKEN - Admin token with full permissions
 *
 * After running, copy the printed CLIENT_ROLE_ID into your .env file.
 */

import "dotenv/config";

const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN;

if (!DIRECTUS_URL || !DIRECTUS_TOKEN) {
  console.error(
    "Missing required environment variables: DIRECTUS_URL and DIRECTUS_STATIC_TOKEN"
  );
  process.exit(1);
}

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${DIRECTUS_TOKEN}`,
};

// ────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────

async function api(
  method: string,
  path: string,
  body?: Record<string, any>
): Promise<any> {
  const res = await fetch(`${DIRECTUS_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();

  if (!res.ok) {
    // Return null for "already exists" so callers can handle gracefully
    if (text.includes("already exists") || text.includes("has to be unique")) {
      return null;
    }
    throw new Error(`${method} ${path} failed (${res.status}): ${text}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// ────────────────────────────────────────────────
// 1. Find or create the Client role
// ────────────────────────────────────────────────

async function findOrCreateRole(): Promise<string> {
  console.log("\n🔑 Setting up Client role...");

  // Check if a "Client" role already exists
  const existing = await api("GET", "/roles?filter[name][_eq]=Client");
  if (existing?.data?.length > 0) {
    const roleId = existing.data[0].id;
    console.log(`  ℹ  Role "Client" already exists: ${roleId}`);
    return roleId;
  }

  // Create the role
  const result = await api("POST", "/roles", {
    name: "Client",
    icon: "supervised_user_circle",
    description: "Authenticated clients with access to the client portal",
    admin_access: false,
    app_access: false,
  });

  const roleId = result.data.id;
  console.log(`  ✓ Created role "Client": ${roleId}`);
  return roleId;
}

// ────────────────────────────────────────────────
// 2. Find or create an access policy for the role
// ────────────────────────────────────────────────

async function findOrCreatePolicy(roleId: string): Promise<string> {
  console.log("\n📋 Setting up Client access policy...");

  // Check if a policy already exists for this role
  const existingAccess = await api(
    "GET",
    `/access?filter[role][_eq]=${roleId}&fields=*,policy.*`
  );
  if (existingAccess?.data?.length > 0) {
    const policyId =
      typeof existingAccess.data[0].policy === "object"
        ? existingAccess.data[0].policy.id
        : existingAccess.data[0].policy;
    console.log(`  ℹ  Policy already linked to role: ${policyId}`);
    return policyId;
  }

  // Create the policy
  const policyResult = await api("POST", "/policies", {
    name: "Client Portal Access",
    icon: "shield",
    description:
      "Permissions for authenticated clients to use the client portal",
    admin_access: false,
    app_access: false,
  });

  const policyId = policyResult.data.id;
  console.log(`  ✓ Created policy "Client Portal Access": ${policyId}`);

  // Link policy to role via access
  await api("POST", "/access", {
    role: roleId,
    policy: policyId,
  });
  console.log(`  ✓ Linked policy to Client role`);

  return policyId;
}

// ────────────────────────────────────────────────
// 3. Create permissions on the policy
// ────────────────────────────────────────────────

interface PermissionDef {
  collection: string;
  action: "create" | "read" | "update" | "delete";
  fields?: string[] | ["*"];
  permissions?: Record<string, any> | {};
  validation?: Record<string, any> | null;
  presets?: Record<string, any> | null;
}

async function createPermission(
  policyId: string,
  perm: PermissionDef
): Promise<void> {
  const label = `${perm.action.toUpperCase()} ${perm.collection}`;

  try {
    await api("POST", "/permissions", {
      policy: policyId,
      collection: perm.collection,
      action: perm.action,
      fields: perm.fields || ["*"],
      permissions: perm.permissions || {},
      validation: perm.validation || null,
      presets: perm.presets || null,
    });
    console.log(`    ✓ ${label}`);
  } catch (error: any) {
    if (error.message?.includes("already exists") || error.message?.includes("Unique")) {
      console.log(`    ℹ  ${label} (already exists)`);
    } else {
      console.error(`    ✗ ${label}: ${error.message}`);
    }
  }
}

async function setupPermissions(policyId: string): Promise<void> {
  console.log("\n🔒 Creating permissions...\n");

  // First, clear any existing permissions on this policy to avoid duplicates
  const existing = await api(
    "GET",
    `/permissions?filter[policy][_eq]=${policyId}&limit=-1`
  );
  if (existing?.data?.length > 0) {
    console.log(
      `  ⚠  Found ${existing.data.length} existing permissions on this policy.`
    );
    console.log(`     Deleting them before re-creating...\n`);
    for (const perm of existing.data) {
      await api("DELETE", `/permissions/${perm.id}`);
    }
  }

  // ── directus_users ──────────────────────────────
  // Clients can read and update ONLY their own user record
  console.log("  directus_users:");

  await createPermission(policyId, {
    collection: "directus_users",
    action: "read",
    fields: [
      "id",
      "first_name",
      "last_name",
      "email",
      "title",
      "description",
      "avatar",
      "language",
      "status",
      "role",
      "last_access",
      "appearance",
    ],
    permissions: {
      id: { _eq: "$CURRENT_USER" },
    },
  });

  await createPermission(policyId, {
    collection: "directus_users",
    action: "update",
    fields: [
      "first_name",
      "last_name",
      "title",
      "description",
      "avatar",
      "language",
      "appearance",
      "password",
    ],
    permissions: {
      id: { _eq: "$CURRENT_USER" },
    },
  });

  // ── directus_files ──────────────────────────────
  // Clients can upload files and manage their own uploads
  console.log("  directus_files:");

  await createPermission(policyId, {
    collection: "directus_files",
    action: "create",
    fields: ["*"],
    permissions: {},
    presets: {
      uploaded_by: "$CURRENT_USER",
    },
  });

  await createPermission(policyId, {
    collection: "directus_files",
    action: "read",
    fields: [
      "id",
      "filename_disk",
      "filename_download",
      "title",
      "type",
      "folder",
      "uploaded_by",
      "created_on",
      "filesize",
      "width",
      "height",
      "description",
      "tags",
      "uploaded_on",
    ],
    permissions: {
      uploaded_by: { _eq: "$CURRENT_USER" },
    },
  });

  await createPermission(policyId, {
    collection: "directus_files",
    action: "update",
    fields: ["title", "description", "tags", "folder"],
    permissions: {
      uploaded_by: { _eq: "$CURRENT_USER" },
    },
  });

  await createPermission(policyId, {
    collection: "directus_files",
    action: "delete",
    permissions: {
      uploaded_by: { _eq: "$CURRENT_USER" },
    },
  });

  // ── form_submissions ────────────────────────────
  // Clients can read their own submissions (matched by email)
  console.log("  form_submissions:");

  await createPermission(policyId, {
    collection: "form_submissions",
    action: "read",
    fields: ["id", "form", "data", "status", "submitter_email", "submitter_name"],
    permissions: {
      submitter_email: { _eq: "$CURRENT_USER.email" },
    },
  });

  // ── forms ───────────────────────────────────────
  // Clients can read published forms (needed to resolve form titles in submissions)
  console.log("  forms:");

  await createPermission(policyId, {
    collection: "forms",
    action: "read",
    fields: ["id", "title", "slug", "description", "status"],
    permissions: {
      status: { _eq: "published" },
    },
  });

  // ── site_settings ───────────────────────────────
  // Clients can read site settings (branding in portal)
  console.log("  site_settings:");

  await createPermission(policyId, {
    collection: "site_settings",
    action: "read",
    fields: [
      "id",
      "site_name",
      "site_description",
      "logo",
      "contact_email",
      "contact_phone",
    ],
    permissions: {},
  });

  // ── directus_roles ──────────────────────────────
  // Needed so the role relation resolves when reading the user
  console.log("  directus_roles:");

  await createPermission(policyId, {
    collection: "directus_roles",
    action: "read",
    fields: ["id", "name", "icon", "admin_access"],
    permissions: {},
  });
}

// ────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────

async function main() {
  console.log("=".repeat(60));
  console.log("  Directus Client Role & Permissions Setup");
  console.log("=".repeat(60));

  const roleId = await findOrCreateRole();
  const policyId = await findOrCreatePolicy(roleId);
  await setupPermissions(policyId);

  console.log("\n" + "=".repeat(60));
  console.log("✅ Client permissions setup complete!\n");
  console.log("Role & Policy:");
  console.log(`  Role ID:   ${roleId}`);
  console.log(`  Policy ID: ${policyId}`);
  console.log("");
  console.log("Permissions created:");
  console.log("  • directus_users  — read/update own record");
  console.log("  • directus_files  — create, read/update/delete own files");
  console.log("  • form_submissions — read own (by email)");
  console.log("  • forms           — read published");
  console.log("  • site_settings   — read");
  console.log("  • directus_roles  — read (for role resolution)");
  console.log("");
  console.log("┌─────────────────────────────────────────────────┐");
  console.log("│  Add this to your .env file:                    │");
  console.log(`│  CLIENT_ROLE_ID=${roleId}  │`);
  console.log("└─────────────────────────────────────────────────┘");
  console.log("");
}

main().catch((error) => {
  console.error("\n❌ Setup failed:", error.message);
  process.exit(1);
});

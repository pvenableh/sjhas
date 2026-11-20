// server/utils/submissionFolders.ts
// Find-or-create the Directus folders that hold submitted files:
//   Form Submissions / <form title>
//
// Kept free of Nitro auto-imports (plain fetch, explicit config) so the
// one-off scripts/move-submission-files.ts can import it too.

export const SUBMISSIONS_ROOT_FOLDER = 'Form Submissions'

interface DirectusConn {
  url: string
  token: string
}

async function findOrCreateFolder(
  conn: DirectusConn,
  name: string,
  parent: string | null,
  create = true
): Promise<string | null> {
  const headers = { Authorization: `Bearer ${conn.token}`, 'Content-Type': 'application/json' }

  const params = new URLSearchParams({ limit: '1', fields: 'id' })
  params.set('filter[name][_eq]', name)
  if (parent) params.set('filter[parent][_eq]', parent)
  else params.set('filter[parent][_null]', 'true')

  const found = await fetch(`${conn.url}/folders?${params}`, { headers })
  if (!found.ok) throw new Error(`Folder lookup failed (${found.status}): ${await found.text()}`)
  const existing = (await found.json()).data?.[0]?.id
  if (existing) return existing as string
  if (!create) return null

  const created = await fetch(`${conn.url}/folders`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name, parent }),
  })
  if (!created.ok) throw new Error(`Folder create failed (${created.status}): ${await created.text()}`)
  return (await created.json()).data.id as string
}

/**
 * Returns the ID of `Form Submissions/<formTitle>`.
 * With create=false (dry runs) it returns null for folders that don't exist yet.
 */
export async function getSubmissionFolderId(
  conn: DirectusConn,
  formTitle: string,
  create = true
): Promise<string | null> {
  const title = (formTitle || '').trim().slice(0, 255) || 'Untitled Form'
  const root = await findOrCreateFolder(conn, SUBMISSIONS_ROOT_FOLDER, null, create)
  if (!root) return null
  return findOrCreateFolder(conn, title, root, create)
}

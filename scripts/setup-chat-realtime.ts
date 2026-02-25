/**
 * Setup Directus for real-time chat via WebSocket
 *
 * This script:
 * 1. Adds public read permissions for chat collections (so visitors can subscribe via WS)
 * 2. Adds typing indicator timestamp fields to chat_sessions
 *
 * Run with: npx tsx scripts/setup-chat-realtime.ts
 *
 * Required env: DIRECTUS_URL, DIRECTUS_STATIC_TOKEN
 */

import 'dotenv/config'

const DIRECTUS_URL = process.env.DIRECTUS_URL
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN

if (!DIRECTUS_URL || !DIRECTUS_TOKEN) {
  console.error('❌ Missing DIRECTUS_URL or DIRECTUS_STATIC_TOKEN')
  process.exit(1)
}

async function api(endpoint: string, method = 'GET', body?: any) {
  const res = await fetch(`${DIRECTUS_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DIRECTUS_TOKEN}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${res.status}: ${text}`)
  }
  const contentType = res.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    return (await res.json()).data
  }
  return await res.text()
}

async function setupPermissions() {
  console.log('\n🔐 Setting up public read permissions for chat collections...\n')

  let policyId: string | null = null

  try {
    const policies = await api('/policies')
    const publicPolicy = policies?.find((p: any) =>
      p.name === 'Public' || p.admin_access === false
    )
    if (publicPolicy) {
      policyId = publicPolicy.id
      console.log(`  Found public policy: ${policyId}`)
    }
  } catch {
    try {
      const roles = await api('/roles')
      const publicRole = roles?.find((r: any) => r.name === 'Public')
      if (publicRole) {
        policyId = publicRole.id
        console.log(`  Found public role: ${policyId}`)
      }
    } catch (e: any) {
      console.warn('  Could not find public role/policy:', e.message)
    }
  }

  const chatPermissions = [
    {
      collection: 'chat_messages',
      action: 'read',
      fields: ['id', 'sender', 'message', 'date_created', 'read', 'session'],
    },
    {
      collection: 'chat_sessions',
      action: 'read',
      fields: ['id', 'status', 'admin_typing_at', 'visitor_typing_at'],
    },
    {
      collection: 'chat_settings',
      action: 'read',
      fields: ['admin_online', 'welcome_message', 'offline_message'],
    },
  ]

  for (const perm of chatPermissions) {
    try {
      await api('/permissions', 'POST', {
        role: policyId,
        policy: policyId,
        collection: perm.collection,
        action: perm.action,
        fields: perm.fields,
        permissions: perm.collection === 'chat_messages'
          ? { session: { _nnull: true } }
          : {},
        validation: {},
      })
      console.log(`  ✅ ${perm.collection}: ${perm.action} [${perm.fields.join(', ')}]`)
    } catch (e: any) {
      if (e.message?.includes('already') || e.message?.includes('Duplicate') || e.message?.includes('UNIQUE')) {
        console.log(`  ⏭  ${perm.collection}: permission already exists`)
      } else {
        console.error(`  ❌ ${perm.collection}: ${e.message}`)
      }
    }
  }
}

async function addTypingFields() {
  console.log('\n⌨️  Adding typing indicator fields to chat_sessions...\n')

  const fields = [
    { field: 'admin_typing_at', note: 'Last time admin was typing' },
    { field: 'visitor_typing_at', note: 'Last time visitor was typing' },
  ]

  for (const { field, note } of fields) {
    try {
      const res = await fetch(`${DIRECTUS_URL}/fields/chat_sessions/${field}`, {
        headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` },
      })

      if (res.ok) {
        console.log(`  ⏭  "${field}" already exists`)
        continue
      }

      await api('/fields/chat_sessions', 'POST', {
        field,
        type: 'timestamp',
        meta: {
          interface: 'datetime',
          display: 'datetime',
          display_options: { relative: true },
          hidden: true,
          note,
        },
        schema: {
          is_nullable: true,
          default_value: null,
        },
      })
      console.log(`  ✅ Added "${field}"`)
    } catch (e: any) {
      console.error(`  ❌ "${field}": ${e.message}`)
    }
  }
}

async function verifyWebSocket() {
  console.log('\n🔌 Verifying Directus WebSocket...\n')

  try {
    const ping = await fetch(`${DIRECTUS_URL}/server/ping`, {
      headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` },
    })
    const pingText = await ping.text()
    console.log(`  Server ping: ${pingText}`)

    const wsCheck = await fetch(`${DIRECTUS_URL}/websocket`, {
      headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` },
    })
    console.log(`  WebSocket endpoint status: ${wsCheck.status} (non-200 like 426 is expected/fine)`)

    if (wsCheck.status === 404) {
      console.warn('\n  ⚠️  WebSocket endpoint returned 404!')
      console.warn('  Make sure WEBSOCKETS_ENABLED=true and WEBSOCKETS_REST_ENABLED=true in Directus config.')
    } else {
      console.log('  ✅ WebSocket endpoint is reachable')
    }
  } catch (e: any) {
    console.error(`  ❌ Could not reach Directus: ${e.message}`)
  }
}

async function main() {
  console.log('═══════════════════════════════════════════')
  console.log('  Directus Chat Realtime Setup')
  console.log(`  URL: ${DIRECTUS_URL}`)
  console.log('═══════════════════════════════════════════')

  await verifyWebSocket()
  await addTypingFields()
  await setupPermissions()

  console.log('\n✅ Setup complete!\n')
}

main().catch(console.error)

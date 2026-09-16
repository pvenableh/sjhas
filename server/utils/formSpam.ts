// server/utils/formSpam.ts
// Spam protection for public form submissions:
// - signed timestamp tokens (rejects instant bot submissions and forged tokens)
// - honeypot field check
// - per-IP rate limiting (best-effort, per server instance)
// - content heuristics (links in names, link-stuffed text, malformed emails)

import { createHmac, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'

export const HONEYPOT_FIELD = 'contact_website'

const MIN_FILL_MS = 3_000 // humans can't fill out a form in under 3 seconds
const MAX_TOKEN_AGE_MS = 24 * 60 * 60 * 1000

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const RATE_LIMIT_MAX = 5

function getSecret(): string {
  const config = useRuntimeConfig()
  const secret = config.sessionPassword || config.directus.staticToken
  if (!secret) throw new Error('No secret configured for form token signing')
  return `form-token:${secret}`
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('base64url')
}

export function createFormToken(): string {
  const issuedAt = Date.now().toString()
  return `${issuedAt}.${sign(issuedAt)}`
}

export type FormTokenCheck = 'ok' | 'invalid' | 'too_fast' | 'expired'

export function verifyFormToken(token: unknown): FormTokenCheck {
  if (typeof token !== 'string') return 'invalid'
  const [issuedAt, signature] = token.split('.')
  if (!issuedAt || !signature || !/^\d+$/.test(issuedAt)) return 'invalid'

  const expected = Buffer.from(sign(issuedAt))
  const actual = Buffer.from(signature)
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return 'invalid'

  const age = Date.now() - Number(issuedAt)
  if (age < MIN_FILL_MS) return 'too_fast'
  if (age > MAX_TOKEN_AGE_MS) return 'expired'
  return 'ok'
}

const submissionsByIp = new Map<string, number[]>()

/** Returns true if this IP is over the limit; otherwise records the attempt. */
export function isRateLimited(event: H3Event): boolean {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const now = Date.now()
  const recent = (submissionsByIp.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS)

  if (recent.length >= RATE_LIMIT_MAX) {
    submissionsByIp.set(ip, recent)
    return true
  }

  recent.push(now)
  submissionsByIp.set(ip, recent)

  // Keep the map from growing unbounded
  if (submissionsByIp.size > 5000) {
    for (const [key, times] of submissionsByIp) {
      if (times.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) submissionsByIp.delete(key)
    }
  }
  return false
}

const LINK_PATTERN = /https?:\/\/|www\.|\[url|<a\s/gi

function countLinks(value: string): number {
  return value.match(LINK_PATTERN)?.length || 0
}

/** Returns a reason string if the submitted values look like spam, otherwise null. */
export function detectSpamContent(data: Record<string, unknown>): string | null {
  for (const key of ['name', 'first_name', 'last_name', 'taxpayer_name']) {
    const value = data[key]
    if (typeof value === 'string' && (countLinks(value) > 0 || value.length > 100)) {
      return `suspicious ${key}`
    }
  }

  let linkCount = 0
  for (const value of Object.values(data)) {
    if (typeof value === 'string') linkCount += countLinks(value)
  }
  if (linkCount > 3) return 'too many links'

  const email = data.email
  if (email !== undefined && email !== null && email !== '') {
    if (typeof email !== 'string' || email.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) {
      return 'invalid email'
    }
  }

  return null
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

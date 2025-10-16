import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Masks a secret string by keeping the first and last visibleLength characters
export function maskSecret(secret: string | undefined | null, visibleLength: number = 4): string {
  if (!secret) return ''
  if (secret.length <= visibleLength * 2) return '*'.repeat(Math.max(4, secret.length))
  const start = secret.slice(0, visibleLength)
  const end = secret.slice(-visibleLength)
  return `${start}${'*'.repeat(secret.length - visibleLength * 2)}${end}`
}

// Returns a shallow-cloned headers object with common secret headers masked
export function maskHeaders(headers: Record<string, unknown>): Record<string, unknown> {
  const SENSITIVE_KEYS = new Set([
    'authorization',
    'x-api-key',
    'x-organization-id',
    'x-user-id',
    'x-author-id',
    'user-id',
    'api-key',
    'apikey',
  ])

  const masked: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(headers)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      masked[key] = typeof value === 'string' ? maskSecret(value) : '[masked]'
    } else {
      masked[key] = value
    }
  }
  return masked
}

// Masks known secret-like fields in a JSON-serializable body for safe logging
export function maskBody(body: unknown): unknown {
  try {
    if (body == null) return body
    if (typeof body !== 'object') return body

    const SENSITIVE_FIELDS = new Set([
      'apiKey', 'apikey', 'key', 'token', 'accessToken', 'authorization', 'password',
      'secret', 'userId', 'authorId', 'uploadedBy', 'orgId', 'organizationId'
    ])

    if (Array.isArray(body)) {
      const maskedArray: unknown[] = []
      for (const item of body) {
        if (item && typeof item === 'object') {
          maskedArray.push(maskBody(item))
        } else {
          maskedArray.push(item)
        }
      }
      return maskedArray
    }

    const maskedObject: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
      if (SENSITIVE_FIELDS.has(k)) {
        maskedObject[k] = typeof v === 'string' ? maskSecret(v) : '[masked]'
      } else if (v && typeof v === 'object') {
        maskedObject[k] = maskBody(v)
      } else {
        maskedObject[k] = v
      }
    }
    return maskedObject
  } catch {
    return '[unserializable]'
  }
}

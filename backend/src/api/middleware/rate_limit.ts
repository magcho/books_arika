/**
 * Rate limiting middleware
 * Prevents abuse by limiting requests per IP address
 */

import { Context, Next } from 'hono'
import { HTTPException } from 'hono/http-exception'

// Skip rate limiting in test environment
// Note: In Cloudflare Workers, we check for test environment via globalThis
// For local development, we can use a flag in .dev.vars
const SKIP_RATE_LIMIT = 
  (typeof globalThis !== 'undefined' && (globalThis as any).NODE_ENV === 'test') ||
  (typeof process !== 'undefined' && (process.env.NODE_ENV === 'test' || process.env.SKIP_RATE_LIMIT === 'true'))

interface RateLimitStore {
  [key: string]: {
    count: number
    resetAt: number
  }
}

// In-memory store (for MVP, use Cloudflare KV in production)
const store: RateLimitStore = {}

// Configuration
const WINDOW_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS = 100 // 100 requests per minute per IP

/**
 * Get client IP address from request
 */
function getClientIP(c: Context): string {
  // Cloudflare Workers provides CF-Connecting-IP header
  const cfIP = c.req.header('CF-Connecting-IP')
  if (cfIP) {
    return cfIP
  }

  // Fallback to X-Forwarded-For or X-Real-IP
  const forwarded = c.req.header('X-Forwarded-For')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIP = c.req.header('X-Real-IP')
  if (realIP) {
    return realIP
  }

  // Default fallback
  return 'unknown'
}

/**
 * Rate limiting middleware
 */
export async function rateLimit(c: Context, next: Next) {
  // Skip rate limiting in test environment
  if (SKIP_RATE_LIMIT) {
    await next()
    return
  }

  const clientIP = getClientIP(c)
  const now = Date.now()

  // Clean up expired entries (simple cleanup, can be optimized)
  if (Object.keys(store).length > 1000) {
    // Only cleanup if store is getting large
    for (const key in store) {
      if (store[key].resetAt < now) {
        delete store[key]
      }
    }
  }

  // Get or create rate limit entry
  let entry = store[clientIP]

  if (!entry || entry.resetAt < now) {
    // Create new window
    entry = {
      count: 0,
      resetAt: now + WINDOW_MS,
    }
    store[clientIP] = entry
  }

  // Increment counter
  entry.count++

  // Check if limit exceeded
  if (entry.count > MAX_REQUESTS) {
    throw new HTTPException(429, {
      message: JSON.stringify({
        error: {
          message: 'リクエストが多すぎます。しばらく待ってから再度お試しください。',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((entry.resetAt - now) / 1000),
        },
      }),
    })
  }

  // Add rate limit headers
  c.res.headers.set('X-RateLimit-Limit', String(MAX_REQUESTS))
  c.res.headers.set('X-RateLimit-Remaining', String(Math.max(0, MAX_REQUESTS - entry.count)))
  c.res.headers.set('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)))

  await next()
}

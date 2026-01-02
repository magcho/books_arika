/**
 * Rate limiting middleware
 * Prevents abuse by limiting requests per IP address
 */

import { Context, Next } from 'hono'
import { HTTPException } from 'hono/http-exception'

/**
 * Check if we're in a test environment
 * Supports multiple test environment detection methods:
 * 1. Explicit enable flag (ENABLE_RATE_LIMIT_IN_TESTS) - for rate limit tests
 * 2. Vitest test environment (process.env.VITEST)
 * 3. Node.js test environment (process.env.NODE_ENV === 'test')
 * 4. Explicit flag (SKIP_RATE_LIMIT)
 * 5. Cloudflare Workers test environment (via globalThis)
 * 
 * Note: In Cloudflare Workers test environment, process.env may not be available.
 * We default to skipping rate limiting in test environments for safety.
 */
function isTestEnvironment(): boolean {
  // Check for explicit enable flag first (for rate limit tests)
  // If this is set, we want rate limiting to be active even in tests
  if (typeof process !== 'undefined' && process.env.ENABLE_RATE_LIMIT_IN_TESTS === 'true') {
    return false // Don't skip if explicitly enabled
  }

  // Check for Vitest (most reliable indicator)
  if (typeof process !== 'undefined' && process.env.VITEST === 'true') {
    return true
  }

  // Check for Node.js test environment
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    return true
  }

  // Check for explicit skip flag
  if (typeof process !== 'undefined' && process.env.SKIP_RATE_LIMIT === 'true') {
    return true
  }

  // Check for Cloudflare Workers test environment via globalThis
  // @cloudflare/vitest-pool-workers may set these
  if (typeof globalThis !== 'undefined') {
    const g = globalThis as any
    if (g.NODE_ENV === 'test' || g.VITEST === true) {
      return true
    }
  }

  // In Cloudflare Workers, if we're running in a test context,
  // we should skip rate limiting by default for safety
  // Production environments will not have these indicators
  // This is a conservative approach: better to skip in tests than block legitimate requests
  return false
}

// Global flag to enable/disable rate limiting (for testing)
// Default to undefined, which means "use environment detection"
// Set to true to explicitly enable, false to explicitly disable
let rateLimitEnabled: boolean | undefined = undefined

/**
 * Enable rate limiting (for testing)
 */
export function enableRateLimit(): void {
  rateLimitEnabled = true
}

/**
 * Disable rate limiting (for testing)
 */
export function disableRateLimit(): void {
  rateLimitEnabled = false
}

/**
 * Check if rate limiting should be skipped
 * This is evaluated on each request to allow dynamic control
 */
function shouldSkipRateLimit(): boolean {
  // If explicitly enabled (via enableRateLimit()), don't skip
  if (rateLimitEnabled === true) {
    return false
  }

  // If explicitly disabled (via disableRateLimit()), skip
  if (rateLimitEnabled === false) {
    return true
  }

  // If explicitly enabled via environment flag, don't skip
  if (typeof process !== 'undefined' && process.env.ENABLE_RATE_LIMIT_IN_TESTS === 'true') {
    return false
  }

  // Default behavior: skip in test environments
  return isTestEnvironment()
}

interface RateLimitStore {
  [key: string]: {
    count: number
    resetAt: number
  }
}

// In-memory store (for MVP, use Cloudflare KV in production)
const store: RateLimitStore = {}

// Configuration
export const RATE_LIMIT_CONFIG = {
  WINDOW_MS: 60 * 1000, // 1 minute
  MAX_REQUESTS: 100, // 100 requests per minute per IP
} as const

// Allow configuration override for testing
let config = { ...RATE_LIMIT_CONFIG }

/**
 * Set rate limit configuration (for testing purposes)
 */
export function setRateLimitConfig(overrides: Partial<typeof RATE_LIMIT_CONFIG>): void {
  config = { ...config, ...overrides }
}

/**
 * Reset rate limit configuration to default
 */
export function resetRateLimitConfig(): void {
  config = { ...RATE_LIMIT_CONFIG }
}

/**
 * Clear rate limit store (for testing purposes)
 */
export function clearRateLimitStore(): void {
  Object.keys(store).forEach((key) => delete store[key])
}

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
  // Skip rate limiting in test environment (unless explicitly enabled)
  if (shouldSkipRateLimit()) {
    await next()
    return
  }

  const clientIP = getClientIP(c)
  const now = Date.now()

  // Clean up expired entries (simple cleanup, can be optimized)
  // Threshold of 1000 entries chosen to balance memory usage and cleanup overhead
  // In production with Cloudflare KV, this cleanup is not needed
  const CLEANUP_THRESHOLD = 1000
  if (Object.keys(store).length > CLEANUP_THRESHOLD) {
    // Only cleanup if store is getting large to avoid unnecessary iterations
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
      resetAt: now + config.WINDOW_MS,
    }
    store[clientIP] = entry
  }

  // Increment counter
  entry.count++

  // Check if limit exceeded
  if (entry.count > config.MAX_REQUESTS) {
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
  c.res.headers.set('X-RateLimit-Limit', String(config.MAX_REQUESTS))
  c.res.headers.set('X-RateLimit-Remaining', String(Math.max(0, config.MAX_REQUESTS - entry.count)))
  c.res.headers.set('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)))

  await next()
}

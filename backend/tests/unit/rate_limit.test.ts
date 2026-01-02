/**
 * Rate limiting middleware unit tests
 * Tests the rate limiting functionality in isolation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Hono } from 'hono'
import {
  rateLimit,
  setRateLimitConfig,
  resetRateLimitConfig,
  clearRateLimitStore,
  enableRateLimit,
  disableRateLimit,
  RATE_LIMIT_CONFIG,
} from '../../src/api/middleware/rate_limit'

describe('RateLimit Middleware', () => {
  let app: Hono

  beforeEach(() => {
    // Enable rate limiting for these tests
    enableRateLimit()

    // Create a fresh app instance for each test
    app = new Hono()
    app.use('*', rateLimit)
    app.get('/test', (c) => c.json({ message: 'ok' }))

    // Clear store and reset config before each test
    clearRateLimitStore()
    resetRateLimitConfig()
  })

  afterEach(() => {
    // Disable rate limiting after tests (for other tests)
    disableRateLimit()
    clearRateLimitStore()
    resetRateLimitConfig()
  })

  describe('正常系', () => {
    it('should allow requests within the limit', async () => {
      // Make requests up to the limit
      for (let i = 0; i < RATE_LIMIT_CONFIG.MAX_REQUESTS; i++) {
        const request = new Request('http://localhost/test', {
          headers: { 'CF-Connecting-IP': '192.168.1.1' },
        })
        const response = await app.fetch(request)
        expect(response.status).toBe(200)
      }
    })

    it('should set rate limit headers correctly', async () => {
      const request = new Request('http://localhost/test', {
        headers: { 'CF-Connecting-IP': '192.168.1.2' },
      })
      const response = await app.fetch(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('X-RateLimit-Limit')).toBe(String(RATE_LIMIT_CONFIG.MAX_REQUESTS))
      expect(response.headers.get('X-RateLimit-Remaining')).toBe(String(RATE_LIMIT_CONFIG.MAX_REQUESTS - 1))
      expect(response.headers.get('X-RateLimit-Reset')).toBeTruthy()
    })

    it('should track requests per IP address separately', async () => {
      // Make requests from different IPs
      const ip1 = '192.168.1.10'
      const ip2 = '192.168.1.20'

      // Exhaust limit for IP1
      for (let i = 0; i < RATE_LIMIT_CONFIG.MAX_REQUESTS; i++) {
        const request = new Request('http://localhost/test', {
          headers: { 'CF-Connecting-IP': ip1 },
        })
        const response = await app.fetch(request)
        expect(response.status).toBe(200)
      }

      // IP1 should be rate limited
      const ip1Request = new Request('http://localhost/test', {
        headers: { 'CF-Connecting-IP': ip1 },
      })
      const ip1Response = await app.fetch(ip1Request)
      expect(ip1Response.status).toBe(429)

      // IP2 should still be able to make requests
      const ip2Request = new Request('http://localhost/test', {
        headers: { 'CF-Connecting-IP': ip2 },
      })
      const ip2Response = await app.fetch(ip2Request)
      expect(ip2Response.status).toBe(200)
    })
  })

  describe('異常系', () => {
    it('should return 429 when limit is exceeded', async () => {
      const ip = '192.168.1.100'

      // Make requests up to the limit
      for (let i = 0; i < RATE_LIMIT_CONFIG.MAX_REQUESTS; i++) {
        const request = new Request('http://localhost/test', {
          headers: { 'CF-Connecting-IP': ip },
        })
        await app.fetch(request)
      }

      // Next request should be rate limited
      const request = new Request('http://localhost/test', {
        headers: { 'CF-Connecting-IP': ip },
      })
      const response = await app.fetch(request)

      expect(response.status).toBe(429)
      const data = await response.json()
      expect(data.error.code).toBe('RATE_LIMIT_EXCEEDED')
      expect(data.error.message).toContain('リクエストが多すぎます')
      expect(data.error.retryAfter).toBeGreaterThan(0)
    })

    it('should include retryAfter in error response', async () => {
      const ip = '192.168.1.200'

      // Exhaust limit
      for (let i = 0; i < RATE_LIMIT_CONFIG.MAX_REQUESTS; i++) {
        const request = new Request('http://localhost/test', {
          headers: { 'CF-Connecting-IP': ip },
        })
        await app.fetch(request)
      }

      // Get rate limited response
      const request = new Request('http://localhost/test', {
        headers: { 'CF-Connecting-IP': ip },
      })
      const response = await app.fetch(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error.retryAfter).toBeGreaterThan(0)
      expect(data.error.retryAfter).toBeLessThanOrEqual(60) // Should be within 1 minute
    })
  })

  describe('IP address detection', () => {
    it('should use CF-Connecting-IP header when available', async () => {
      const request = new Request('http://localhost/test', {
        headers: { 'CF-Connecting-IP': '203.0.113.1' },
      })
      const response = await app.fetch(request)
      expect(response.status).toBe(200)
    })

    it('should fallback to X-Forwarded-For header', async () => {
      const request = new Request('http://localhost/test', {
        headers: { 'X-Forwarded-For': '203.0.113.2' },
      })
      const response = await app.fetch(request)
      expect(response.status).toBe(200)
    })

    it('should fallback to X-Real-IP header', async () => {
      const request = new Request('http://localhost/test', {
        headers: { 'X-Real-IP': '203.0.113.3' },
      })
      const response = await app.fetch(request)
      expect(response.status).toBe(200)
    })

    it('should use "unknown" as fallback when no IP header is present', async () => {
      const request = new Request('http://localhost/test')
      const response = await app.fetch(request)
      expect(response.status).toBe(200)

      // All requests without IP should share the same limit
      for (let i = 0; i < RATE_LIMIT_CONFIG.MAX_REQUESTS; i++) {
        const req = new Request('http://localhost/test')
        await app.fetch(req)
      }

      // Next request should be rate limited
      const limitedRequest = new Request('http://localhost/test')
      const limitedResponse = await app.fetch(limitedRequest)
      expect(limitedResponse.status).toBe(429)
    })
  })

  describe('Configuration', () => {
    it('should respect custom MAX_REQUESTS configuration', async () => {
      const customLimit = 5
      setRateLimitConfig({ MAX_REQUESTS: customLimit })

      const ip = '192.168.1.300'

      // Make requests up to custom limit
      for (let i = 0; i < customLimit; i++) {
        const request = new Request('http://localhost/test', {
          headers: { 'CF-Connecting-IP': ip },
        })
        const response = await app.fetch(request)
        expect(response.status).toBe(200)
      }

      // Next request should be rate limited
      const request = new Request('http://localhost/test', {
        headers: { 'CF-Connecting-IP': ip },
      })
      const response = await app.fetch(request)
      expect(response.status).toBe(429)
    })

    it('should reset configuration correctly', async () => {
      // Set custom config
      setRateLimitConfig({ MAX_REQUESTS: 5 })
      clearRateLimitStore()

      const ip = '192.168.1.400'

      // Exhaust custom limit
      for (let i = 0; i < 5; i++) {
        const request = new Request('http://localhost/test', {
          headers: { 'CF-Connecting-IP': ip },
        })
        await app.fetch(request)
      }

      // Reset to default
      resetRateLimitConfig()
      clearRateLimitStore()

      // Should now allow default limit
      for (let i = 0; i < RATE_LIMIT_CONFIG.MAX_REQUESTS; i++) {
        const request = new Request('http://localhost/test', {
          headers: { 'CF-Connecting-IP': ip },
        })
        const response = await app.fetch(request)
        expect(response.status).toBe(200)
      }
    })
  })

  describe('Store management', () => {
    it('should clear store correctly', async () => {
      const ip = '192.168.1.500'

      // Exhaust limit
      for (let i = 0; i < RATE_LIMIT_CONFIG.MAX_REQUESTS; i++) {
        const request = new Request('http://localhost/test', {
          headers: { 'CF-Connecting-IP': ip },
        })
        await app.fetch(request)
      }

      // Should be rate limited
      let request = new Request('http://localhost/test', {
        headers: { 'CF-Connecting-IP': ip },
      })
      let response = await app.fetch(request)
      expect(response.status).toBe(429)

      // Clear store
      clearRateLimitStore()

      // Should be able to make requests again
      request = new Request('http://localhost/test', {
        headers: { 'CF-Connecting-IP': ip },
      })
      response = await app.fetch(request)
      expect(response.status).toBe(200)
    })
  })
})


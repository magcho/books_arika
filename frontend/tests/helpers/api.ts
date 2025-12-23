/**
 * API mocking helpers
 * Utilities for mocking API responses in tests
 */

import { vi } from 'vitest'

/**
 * Mock fetch with a response
 */
export function mockFetchResponse(data: unknown, status: number = 200) {
  global.fetch = vi.fn().mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: new Headers({
      'content-type': 'application/json',
    }),
    json: async () => data,
  })
}

/**
 * Mock fetch with an error
 */
export function mockFetchError(error: Error) {
  global.fetch = vi.fn().mockRejectedValueOnce(error)
}

/**
 * Reset fetch mock
 */
export function resetFetchMock() {
  vi.restoreAllMocks()
}


/**
 * Hono app test helpers
 * Utilities for testing Hono applications
 */

import type { Env } from '../../src/types/db'
import type { D1Database } from '@cloudflare/workers-types'
import app from '../../src/api/index'

/**
 * Create a test environment for the Hono app
 */
export function createTestEnv(db: D1Database, env?: Partial<Env>): Env {
  return {
    DB: db,
    GOOGLE_BOOKS_API_KEY: env?.GOOGLE_BOOKS_API_KEY || 'test-api-key',
    ...env,
  }
}

/**
 * Create a test request handler
 */
export async function handleTestRequest(
  request: Request,
  db: D1Database,
  env?: Partial<Env>
): Promise<Response> {
  const testEnv = createTestEnv(db, env)
  return app.fetch(request, testEnv)
}


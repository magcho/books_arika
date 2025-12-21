/**
 * Database types for Cloudflare D1
 * Defines the D1 database binding type
 */

import type { D1Database } from '@cloudflare/workers-types'

export interface Env {
  DB: D1Database
  GOOGLE_BOOKS_API_KEY?: string
}

/**
 * Helper type for database query results
 */
export type D1Result<T> = {
  results: T[]
  success: boolean
  meta: {
    duration: number
    rows_read: number
    rows_written: number
  }
}


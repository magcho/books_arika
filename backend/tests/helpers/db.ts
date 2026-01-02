/**
 * Database test helpers
 * Utilities for setting up and tearing down test database
 */

import type { D1Database } from '@cloudflare/workers-types'
import { env } from 'cloudflare:test'

/**
 * Get D1 database from test environment
 * In @cloudflare/vitest-pool-workers, D1 is available via cloudflare:test env
 */
export function getTestDatabase(): D1Database {
  return env.DB as D1Database
}

/**
 * Initialize test database with schema
 */
export async function setupTestDatabase(db: D1Database): Promise<void> {
  // Create tables - use prepare().run() instead of exec() to avoid internal API issues
  await db.prepare('CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)').run()

  await db.prepare('CREATE TABLE IF NOT EXISTS books (isbn TEXT PRIMARY KEY, title TEXT NOT NULL, author TEXT, thumbnail_url TEXT, is_doujin INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)').run()

  await db.prepare('CREATE TABLE IF NOT EXISTS locations (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, name TEXT NOT NULL, type TEXT NOT NULL CHECK(type IN (\'Physical\', \'Digital\')), created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, UNIQUE(user_id, name))').run()

  await db.prepare('CREATE TABLE IF NOT EXISTS ownerships (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, isbn TEXT NOT NULL, location_id INTEGER NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (isbn) REFERENCES books(isbn) ON DELETE CASCADE, FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE, UNIQUE(user_id, isbn, location_id))').run()

  // Insert default user
  await db
    .prepare('INSERT OR IGNORE INTO users (id, name) VALUES (?, ?)')
    .bind('default-user', 'Default User')
    .run()
}

/**
 * Clean up test database (remove all data)
 */
export async function cleanupTestDatabase(db: D1Database): Promise<void> {
  // Delete from each table separately, ignoring errors if tables don't exist
  const tables = ['ownerships', 'locations', 'books', 'users']
  for (const table of tables) {
    try {
      // Use prepare().run() instead of exec() to avoid internal API issues
      await db.prepare(`DELETE FROM ${table}`).run()
    } catch (error) {
      // Ignore errors if table doesn't exist
      if (error instanceof Error && error.message.includes('no such table')) {
        continue
      }
      // Ignore duration-related errors from wrangler internal API
      if (error instanceof Error && error.message.includes('duration')) {
        continue
      }
      throw error
    }
  }
}

/**
 * Reset test database (cleanup and setup)
 */
export async function resetTestDatabase(db: D1Database): Promise<void> {
  await cleanupTestDatabase(db)
  await setupTestDatabase(db)
}

/**
 * Create a test user
 */
export async function createTestUser(
  db: D1Database,
  user_id: string,
  name: string
): Promise<void> {
  await db
    .prepare('INSERT OR REPLACE INTO users (id, name) VALUES (?, ?)')
    .bind(user_id, name)
    .run()
}

/**
 * Create a test location
 */
export async function createTestLocation(
  db: D1Database,
  user_id: string,
  name: string,
  type: 'Physical' | 'Digital'
): Promise<{ id: number }> {
  const result = await db
    .prepare('INSERT OR REPLACE INTO locations (user_id, name, type) VALUES (?, ?, ?)')
    .bind(user_id, name, type)
    .run()

  if (!result.meta.last_row_id) {
    throw new Error('Failed to create test location')
  }

  return { id: result.meta.last_row_id }
}


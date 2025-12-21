/**
 * Database test helpers
 * Utilities for setting up and tearing down test database
 */

import type { D1Database } from '@cloudflare/workers-types'

/**
 * Get D1 database from test environment
 * In @cloudflare/vitest-pool-workers, D1 is available via getMiniflareD1Database
 */
export async function getTestDatabase(): Promise<D1Database> {
  // Dynamic import to avoid module resolution issues
  const { getMiniflareD1Database } = await import('@cloudflare/vitest-pool-workers')
  return getMiniflareD1Database('DB')
}

/**
 * Initialize test database with schema
 */
export async function setupTestDatabase(db: D1Database): Promise<void> {
  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS books (
      isbn TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT,
      thumbnail_url TEXT,
      is_doujin INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('Physical', 'Digital')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, name)
    );

    CREATE TABLE IF NOT EXISTS ownerships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      isbn TEXT NOT NULL,
      location_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (isbn) REFERENCES books(isbn) ON DELETE CASCADE,
      FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
      UNIQUE(user_id, isbn, location_id)
    );
  `)

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
  await db.exec(`
    DELETE FROM ownerships;
    DELETE FROM locations;
    DELETE FROM books;
    DELETE FROM users;
  `)
}

/**
 * Reset test database (cleanup and setup)
 */
export async function resetTestDatabase(db: D1Database): Promise<void> {
  await cleanupTestDatabase(db)
  await setupTestDatabase(db)
}


-- Books Arika Database Schema
-- Based on data-model.md specification

-- Users table
-- Note: For MVP, we'll use a default user. This table supports future multi-user expansion.
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Books table
-- Note: ISBN can be NULL for doujin books. We'll use UUID for non-ISBN books.
-- SQLite doesn't allow NULL in PRIMARY KEY, so we'll handle this in application logic.
CREATE TABLE IF NOT EXISTS books (
    isbn TEXT PRIMARY KEY,  -- Will contain ISBN or UUID for non-ISBN books
    title TEXT NOT NULL,
    author TEXT,
    thumbnail_url TEXT,
    is_doujin INTEGER DEFAULT 0,  -- 0 = false, 1 = true
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Locations table
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

-- Ownerships table
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);
CREATE INDEX IF NOT EXISTS idx_locations_user_id ON locations(user_id);
CREATE INDEX IF NOT EXISTS idx_ownerships_user_id ON ownerships(user_id);
CREATE INDEX IF NOT EXISTS idx_ownerships_isbn ON ownerships(isbn);
CREATE INDEX IF NOT EXISTS idx_ownerships_location_id ON ownerships(location_id);

-- Insert default user for MVP
INSERT OR IGNORE INTO users (id, name) VALUES ('default-user', 'Default User');


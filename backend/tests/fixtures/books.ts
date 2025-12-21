/**
 * Book test fixtures
 * Mock book data factories for testing
 */

import type { Book, BookCreateInput } from '../../src/models/book'

/**
 * Create a mock book with default values
 */
export function createMockBook(overrides?: Partial<Book>): Book {
  const now = new Date().toISOString()
  return {
    isbn: '9784123456789',
    title: 'Test Book',
    author: 'Test Author',
    thumbnail_url: 'https://example.com/thumbnail.jpg',
    is_doujin: false,
    created_at: now,
    updated_at: now,
    ...overrides,
  }
}

/**
 * Create a mock book input for creation
 */
export function createMockBookInput(overrides?: Partial<BookCreateInput>): BookCreateInput {
  return {
    isbn: '9784123456789',
    title: 'Test Book',
    author: 'Test Author',
    thumbnail_url: 'https://example.com/thumbnail.jpg',
    is_doujin: false,
    ...overrides,
  }
}

/**
 * Create a mock doujin book (without ISBN)
 */
export function createMockDoujinBook(overrides?: Partial<Book>): Book {
  const now = new Date().toISOString()
  return {
    isbn: crypto.randomUUID(),
    title: '同人誌タイトル',
    author: '同人作家',
    thumbnail_url: null,
    is_doujin: true,
    created_at: now,
    updated_at: now,
    ...overrides,
  }
}

/**
 * Create a mock book input for doujin book
 */
export function createMockDoujinBookInput(overrides?: Partial<BookCreateInput>): BookCreateInput {
  return {
    isbn: null,
    title: '同人誌タイトル',
    author: '同人作家',
    thumbnail_url: null,
    is_doujin: true,
    ...overrides,
  }
}


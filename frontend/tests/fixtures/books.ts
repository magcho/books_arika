/**
 * Book test fixtures
 * Mock book data for frontend tests
 * 
 * Note: Backend tests use separate fixtures in backend/tests/fixtures/books.ts
 * due to different type definitions (BookCreateInput vs BookCreateRequest).
 * The core Book type is shared, but API request types differ between backend and frontend.
 */

import type { Book, BookSearchResult, BookCreateRequest } from '../../src/types'

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
 * Create a mock book search result
 */
export function createMockBookSearchResult(
  overrides?: Partial<BookSearchResult>
): BookSearchResult {
  return {
    isbn: '9784123456789',
    title: 'Test Book',
    author: 'Test Author',
    thumbnail_url: 'https://example.com/thumbnail.jpg',
    description: 'Test description',
    ...overrides,
  }
}

/**
 * Create a mock book create request
 */
export function createMockBookCreateRequest(
  overrides?: Partial<BookCreateRequest>
): BookCreateRequest {
  return {
    user_id: 'default-user',
    isbn: '9784123456789',
    title: 'Test Book',
    author: 'Test Author',
    thumbnail_url: 'https://example.com/thumbnail.jpg',
    is_doujin: false,
    ...overrides,
  }
}


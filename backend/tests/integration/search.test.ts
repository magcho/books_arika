/**
 * Search API integration tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { D1Database } from '@cloudflare/workers-types'
import { handleTestRequest } from '../helpers/app'
import { getTestDatabase, setupTestDatabase, cleanupTestDatabase } from '../helpers/db'

describe('GET /api/search/books', () => {
  let db: D1Database

  beforeEach(async () => {
    db = getTestDatabase()
    await setupTestDatabase(db)
    // Mock global fetch for Google Books API
    global.fetch = vi.fn()
  })

  afterEach(async () => {
    await cleanupTestDatabase(db)
    vi.restoreAllMocks()
  })

  it('should search books using Google Books API', async () => {
    const mockResponse = {
      items: [
        {
          id: '1',
          volumeInfo: {
            title: 'Test Book',
            authors: ['Test Author'],
            industryIdentifiers: [
              { type: 'ISBN_13', identifier: '9784123456789' },
            ],
            imageLinks: {
              thumbnail: 'http://example.com/thumb.jpg',
            },
          },
        },
      ],
    }

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const request = new Request('http://localhost/api/search/books?q=Test Book', {
      method: 'GET',
    })
    const response = await handleTestRequest(request, db, {
      GOOGLE_BOOKS_API_KEY: 'test-api-key',
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.items).toHaveLength(1)
    expect(data.items[0].title).toBe('Test Book')
  })

  it('should return 400 when query parameter is missing', async () => {
    const request = new Request('http://localhost/api/search/books', {
      method: 'GET',
    })
    const response = await handleTestRequest(request, db, {
      GOOGLE_BOOKS_API_KEY: 'test-api-key',
    })

    expect(response.status).toBe(400)
  })

  it('should handle Google Books API errors', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
    })

    const request = new Request('http://localhost/api/search/books?q=Test Book', {
      method: 'GET',
    })
    const response = await handleTestRequest(request, db, {
      GOOGLE_BOOKS_API_KEY: 'test-api-key',
    })

    expect(response.status).toBe(500)
  })
})

describe('POST /api/search/barcode', () => {
  let db: D1Database

  beforeEach(async () => {
    db = getTestDatabase()
    await setupTestDatabase(db)
    // Mock global fetch for Google Books API
    global.fetch = vi.fn()
  })

  afterEach(async () => {
    await cleanupTestDatabase(db)
    vi.restoreAllMocks()
  })

  it('should search book by ISBN barcode', async () => {
    const mockResponse = {
      items: [
        {
          id: '1',
          volumeInfo: {
            title: 'Test Book',
            authors: ['Test Author'],
            industryIdentifiers: [
              { type: 'ISBN_13', identifier: '9784123456789' },
            ],
            imageLinks: {
              thumbnail: 'http://example.com/thumb.jpg',
            },
          },
        },
      ],
    }

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const request = new Request('http://localhost/api/search/barcode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        isbn: '9784123456789',
      }),
    })
    const response = await handleTestRequest(request, db, {
      GOOGLE_BOOKS_API_KEY: 'test-api-key',
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.title).toBe('Test Book')
    expect(data.isbn).toBe('9784123456789')
  })

  it('should return 400 when ISBN is missing', async () => {
    const request = new Request('http://localhost/api/search/barcode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const response = await handleTestRequest(request, db, {
      GOOGLE_BOOKS_API_KEY: 'test-api-key',
    })

    expect(response.status).toBe(400)
  })

  it('should return 404 when book not found', async () => {
    const mockResponse = { items: [] }

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const request = new Request('http://localhost/api/search/barcode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        isbn: '9784123456789',
      }),
    })
    const response = await handleTestRequest(request, db, {
      GOOGLE_BOOKS_API_KEY: 'test-api-key',
    })

    expect(response.status).toBe(404)
  })
})


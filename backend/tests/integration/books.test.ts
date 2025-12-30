/**
 * Books API integration tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { D1Database } from '@cloudflare/workers-types'
import { handleTestRequest } from '../helpers/app'
import { getTestDatabase, setupTestDatabase, cleanupTestDatabase } from '../helpers/db'

describe('POST /api/books', () => {
  let db: D1Database

  beforeEach(async () => {
    db = getTestDatabase()
    await setupTestDatabase(db)
  })

  afterEach(async () => {
    await cleanupTestDatabase(db)
  })

  it('should create a book successfully', async () => {
    const request = new Request('http://localhost/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'default-user',
        title: 'Test Book',
        author: 'Test Author',
        isbn: '9784123456789',
      }),
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(201)
    const book = await response.json()
    expect(book.title).toBe('Test Book')
    expect(book.author).toBe('Test Author')
    expect(book.isbn).toBe('9784123456789')
  })

  it('should return 400 when required fields are missing', async () => {
    const request = new Request('http://localhost/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'default-user',
        // title is missing
      }),
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(400)
  })

  it('should return 409 when duplicate book is created', async () => {
    // Create first book
    const request1 = new Request('http://localhost/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'default-user',
        title: 'Test Book',
        author: 'Test Author',
        isbn: '9784123456789',
      }),
    })
    await handleTestRequest(request1, db)

    // Try to create duplicate
    const request2 = new Request('http://localhost/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'default-user',
        title: 'Test Book',
        author: 'Test Author',
        isbn: '9784123456789',
      }),
    })

    const response = await handleTestRequest(request2, db)
    expect(response.status).toBe(409)
  })

  it('should create a doujin book without ISBN', async () => {
    const request = new Request('http://localhost/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'default-user',
        title: '同人誌タイトル',
        author: '同人作家',
        is_doujin: true,
      }),
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(201)
    const book = await response.json()
    expect(book.title).toBe('同人誌タイトル')
    expect(book.is_doujin).toBe(true)
    expect(book.isbn).toBeDefined() // UUID should be generated
  })
})

describe('GET /api/books', () => {
  let db: D1Database

  beforeEach(async () => {
    db = getTestDatabase()
    await setupTestDatabase(db)
  })

  afterEach(async () => {
    await cleanupTestDatabase(db)
  })

  it('should list all books', async () => {
    // Create some books
    const request1 = new Request('http://localhost/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'default-user',
        title: 'Book 1',
        isbn: '9784123456789',
      }),
    })
    await handleTestRequest(request1, db)

    const request2 = new Request('http://localhost/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'default-user',
        title: 'Book 2',
        isbn: '9784123456790',
      }),
    })
    await handleTestRequest(request2, db)

    const request = new Request('http://localhost/api/books?user_id=default-user', {
      method: 'GET',
    })
    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.books).toHaveLength(2)
  })

  it('should return empty array when no books exist', async () => {
    const request = new Request('http://localhost/api/books?user_id=default-user', {
      method: 'GET',
    })
    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.books).toEqual([])
  })

  it('should search books by title', async () => {
    // Create books
    await handleTestRequest(
      new Request('http://localhost/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'default-user',
          title: 'JavaScript入門',
          author: '山田太郎',
          isbn: '9784123456789',
        }),
      }),
      db
    )

    await handleTestRequest(
      new Request('http://localhost/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'default-user',
          title: 'Python基礎',
          author: '佐藤花子',
          isbn: '9784123456790',
        }),
      }),
      db
    )

    const request = new Request('http://localhost/api/books?user_id=default-user&search=JavaScript', {
      method: 'GET',
    })
    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.books).toHaveLength(1)
    expect(data.books[0].title).toBe('JavaScript入門')
  })

  it('should search books by author', async () => {
    // Create books
    await handleTestRequest(
      new Request('http://localhost/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'default-user',
          title: 'JavaScript入門',
          author: '山田太郎',
          isbn: '9784123456789',
        }),
      }),
      db
    )

    await handleTestRequest(
      new Request('http://localhost/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'default-user',
          title: 'Python基礎',
          author: '佐藤花子',
          isbn: '9784123456790',
        }),
      }),
      db
    )

    const request = new Request('http://localhost/api/books?user_id=default-user&search=山田', {
      method: 'GET',
    })
    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.books).toHaveLength(1)
    expect(data.books[0].author).toBe('山田太郎')
  })

  it('should return empty array when search has no matches', async () => {
    await handleTestRequest(
      new Request('http://localhost/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'default-user',
          title: 'JavaScript入門',
          author: '山田太郎',
          isbn: '9784123456789',
        }),
      }),
      db
    )

    const request = new Request('http://localhost/api/books?user_id=default-user&search=存在しない書籍', {
      method: 'GET',
    })
    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.books).toEqual([])
  })

  it('should handle special characters in search query', async () => {
    await handleTestRequest(
      new Request('http://localhost/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'default-user',
          title: 'C++入門',
          author: '山田太郎',
          isbn: '9784123456789',
        }),
      }),
      db
    )

    const request = new Request('http://localhost/api/books?user_id=default-user&search=C%2B%2B', {
      method: 'GET',
    })
    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.books.length).toBeGreaterThan(0)
  })
})

describe('GET /api/books/{isbn}', () => {
  let db: D1Database

  beforeEach(async () => {
    db = getTestDatabase()
    await setupTestDatabase(db)
  })

  afterEach(async () => {
    await cleanupTestDatabase(db)
  })

  it('should get book detail with locations', async () => {
    // Create user and location first
    const { createTestUser, createTestLocation } = await import('../helpers/db')
    await createTestUser(db, 'default-user', 'Test User')
    const location = await createTestLocation(db, 'default-user', '本棚', 'Physical')

    // Create book
    const createRequest = new Request('http://localhost/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'default-user',
        title: 'Test Book',
        author: 'Test Author',
        isbn: '9784123456789',
        location_ids: [location.id],
      }),
    })
    const createResponse = await handleTestRequest(createRequest, db)
    const book = await createResponse.json()

    // Get book detail
    const request = new Request(`http://localhost/api/books/${book.isbn}?user_id=default-user`, {
      method: 'GET',
    })
    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.isbn).toBe('9784123456789')
    expect(data.title).toBe('Test Book')
    expect(data.locations).toBeDefined()
    expect(data.locations.length).toBe(1)
    expect(data.locations[0].name).toBe('本棚')
  })

  it('should return 404 when book not found', async () => {
    const request = new Request('http://localhost/api/books/9784123456789?user_id=default-user', {
      method: 'GET',
    })
    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(404)
  })
})

describe('GET /api/books performance (SC-002)', () => {
  let db: D1Database

  beforeEach(async () => {
    db = getTestDatabase()
    await setupTestDatabase(db)
  })

  afterEach(async () => {
    await cleanupTestDatabase(db)
  })

  it('should return search results within 1 second for 1000+ books (SC-002)', async () => {
    // Create 1000+ books
    const books = []
    for (let i = 0; i < 1000; i++) {
      books.push({
        user_id: 'default-user',
        title: `Book ${i}`,
        author: `Author ${i % 100}`, // 100 unique authors
        isbn: `9784123456${String(i).padStart(3, '0')}`,
      })
    }

    // Create books in batches to avoid timeout
    const batchSize = 100
    for (let i = 0; i < books.length; i += batchSize) {
      const batch = books.slice(i, i + batchSize)
      await Promise.all(
        batch.map((book) =>
          handleTestRequest(
            new Request('http://localhost/api/books', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(book),
            }),
            db
          )
        )
      )
    }

    // Measure search performance
    const startTime = Date.now()
    const request = new Request('http://localhost/api/books?user_id=default-user&search=Book 500', {
      method: 'GET',
    })
    const response = await handleTestRequest(request, db)
    const endTime = Date.now()

    const elapsed = endTime - startTime
    expect(response.status).toBe(200)
    expect(elapsed).toBeLessThan(1000) // SC-002: search results within 1 second

    const data = await response.json()
    expect(data.books.length).toBeGreaterThan(0)
  })
})


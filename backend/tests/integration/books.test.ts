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

    const request = new Request('http://localhost/api/books', {
      method: 'GET',
    })
    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.books).toHaveLength(2)
  })

  it('should return empty array when no books exist', async () => {
    const request = new Request('http://localhost/api/books', {
      method: 'GET',
    })
    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.books).toEqual([])
  })
})


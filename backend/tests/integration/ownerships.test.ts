/**
 * Ownerships API integration tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { D1Database } from '@cloudflare/workers-types'
import { handleTestRequest } from '../helpers/app'
import { getTestDatabase, setupTestDatabase, cleanupTestDatabase } from '../helpers/db'
import { createMockLocationInput } from '../fixtures/locations'
import { createMockBookInput } from '../fixtures/books'
import { LocationService } from '../../src/services/location_service'
import { BookService } from '../../src/services/book_service'

describe('GET /api/ownerships', () => {
  let db: D1Database

  beforeEach(async () => {
    db = getTestDatabase()
    await setupTestDatabase(db)
  })

  afterEach(async () => {
    await cleanupTestDatabase(db)
  })

  it('should list all ownerships for a user', async () => {
    // Setup: Create book, location, and ownership
    const bookService = new BookService(db)
    const locationService = new LocationService(db)

    const book = await bookService.create(createMockBookInput({ isbn: '9784123456789' }))
    const location = await locationService.create(createMockLocationInput({ name: '自宅本棚' }))

    // Create ownership
    const createRequest = new Request('http://localhost/api/ownerships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'default-user',
        isbn: book.isbn,
        location_id: location.id,
      }),
    })
    await handleTestRequest(createRequest, db)

    // List ownerships
    const request = new Request('http://localhost/api/ownerships?user_id=default-user', {
      method: 'GET',
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.ownerships).toBeDefined()
    expect(data.ownerships.length).toBe(1)
    expect(data.ownerships[0].isbn).toBe(book.isbn)
    expect(data.ownerships[0].location_id).toBe(location.id)
  })

  it('should filter ownerships by ISBN', async () => {
    // Setup: Create books, location, and ownerships
    const bookService = new BookService(db)
    const locationService = new LocationService(db)

    const book1 = await bookService.create(createMockBookInput({ isbn: '9784123456789', title: 'Book 1' }))
    const book2 = await bookService.create(createMockBookInput({ isbn: '9784123456790', title: 'Book 2' }))
    const location = await locationService.create(createMockLocationInput({ name: '自宅本棚' }))

    // Create ownerships
    const createRequest1 = new Request('http://localhost/api/ownerships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'default-user',
        isbn: book1.isbn,
        location_id: location.id,
      }),
    })
    await handleTestRequest(createRequest1, db)

    const createRequest2 = new Request('http://localhost/api/ownerships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'default-user',
        isbn: book2.isbn,
        location_id: location.id,
      }),
    })
    await handleTestRequest(createRequest2, db)

    // Filter by ISBN
    const request = new Request(`http://localhost/api/ownerships?user_id=default-user&isbn=${book1.isbn}`, {
      method: 'GET',
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.ownerships.length).toBe(1)
    expect(data.ownerships[0].isbn).toBe(book1.isbn)
  })

  it('should filter ownerships by location_id', async () => {
    // Setup: Create book, locations, and ownerships
    const bookService = new BookService(db)
    const locationService = new LocationService(db)

    const book = await bookService.create(createMockBookInput({ isbn: '9784123456789' }))
    const location1 = await locationService.create(createMockLocationInput({ name: '自宅本棚' }))
    const location2 = await locationService.create(createMockLocationInput({ name: 'Kindle', type: 'Digital' }))

    // Create ownerships
    const createRequest1 = new Request('http://localhost/api/ownerships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'default-user',
        isbn: book.isbn,
        location_id: location1.id,
      }),
    })
    await handleTestRequest(createRequest1, db)

    const createRequest2 = new Request('http://localhost/api/ownerships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'default-user',
        isbn: book.isbn,
        location_id: location2.id,
      }),
    })
    await handleTestRequest(createRequest2, db)

    // Filter by location_id
    const request = new Request(`http://localhost/api/ownerships?user_id=default-user&location_id=${location1.id}`, {
      method: 'GET',
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.ownerships.length).toBe(1)
    expect(data.ownerships[0].location_id).toBe(location1.id)
  })

  it('should return 400 when user_id is missing', async () => {
    const request = new Request('http://localhost/api/ownerships', {
      method: 'GET',
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(400)
  })

  it('should return empty array when user has no ownerships', async () => {
    const request = new Request('http://localhost/api/ownerships?user_id=default-user', {
      method: 'GET',
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.ownerships).toEqual([])
  })
})

describe('POST /api/ownerships', () => {
  let db: D1Database

  beforeEach(async () => {
    db = getTestDatabase()
    await setupTestDatabase(db)
  })

  afterEach(async () => {
    await cleanupTestDatabase(db)
  })

  it('should create an ownership successfully', async () => {
    // Setup: Create book and location
    const bookService = new BookService(db)
    const locationService = new LocationService(db)

    const book = await bookService.create(createMockBookInput({ isbn: '9784123456789' }))
    const location = await locationService.create(createMockLocationInput({ name: '自宅本棚' }))

    // Create ownership
    const request = new Request('http://localhost/api/ownerships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'default-user',
        isbn: book.isbn,
        location_id: location.id,
      }),
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(201)
    const ownership = await response.json()
    expect(ownership.isbn).toBe(book.isbn)
    expect(ownership.location_id).toBe(location.id)
    expect(ownership.user_id).toBe('default-user')
    expect(ownership.id).toBeDefined()
  })

  it('should create multiple ownerships for the same book', async () => {
    // Setup: Create book and locations
    const bookService = new BookService(db)
    const locationService = new LocationService(db)

    const book = await bookService.create(createMockBookInput({ isbn: '9784123456789' }))
    const location1 = await locationService.create(createMockLocationInput({ name: '自宅本棚' }))
    const location2 = await locationService.create(createMockLocationInput({ name: 'Kindle', type: 'Digital' }))

    // Create first ownership
    const request1 = new Request('http://localhost/api/ownerships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'default-user',
        isbn: book.isbn,
        location_id: location1.id,
      }),
    })
    const response1 = await handleTestRequest(request1, db)
    expect(response1.status).toBe(201)

    // Create second ownership for same book
    const request2 = new Request('http://localhost/api/ownerships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'default-user',
        isbn: book.isbn,
        location_id: location2.id,
      }),
    })
    const response2 = await handleTestRequest(request2, db)
    expect(response2.status).toBe(201)

    // Verify both ownerships exist
    const listRequest = new Request(`http://localhost/api/ownerships?user_id=default-user&isbn=${book.isbn}`, {
      method: 'GET',
    })
    const listResponse = await handleTestRequest(listRequest, db)
    const data = await listResponse.json()
    expect(data.ownerships.length).toBe(2)
  })

  it('should return 400 when required fields are missing', async () => {
    const request = new Request('http://localhost/api/ownerships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'default-user',
        // isbn is missing
      }),
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(400)
  })

  it('should return 409 when duplicate ownership is created', async () => {
    // Setup: Create book and location
    const bookService = new BookService(db)
    const locationService = new LocationService(db)

    const book = await bookService.create(createMockBookInput({ isbn: '9784123456789' }))
    const location = await locationService.create(createMockLocationInput({ name: '自宅本棚' }))

    // Create first ownership
    const request1 = new Request('http://localhost/api/ownerships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'default-user',
        isbn: book.isbn,
        location_id: location.id,
      }),
    })
    await handleTestRequest(request1, db)

    // Try to create duplicate
    const request2 = new Request('http://localhost/api/ownerships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'default-user',
        isbn: book.isbn,
        location_id: location.id,
      }),
    })

    const response = await handleTestRequest(request2, db)
    expect(response.status).toBe(409)
  })

  it('should return 403 when location does not belong to user', async () => {
    // Setup: Create user, book, and location
    await db.prepare('INSERT OR IGNORE INTO users (id, name) VALUES (?, ?)').bind('other-user', 'Other User').run()

    const bookService = new BookService(db)
    const locationService = new LocationService(db)

    const book = await bookService.create(createMockBookInput({ isbn: '9784123456789' }))
    const location = await locationService.create(
      createMockLocationInput({ user_id: 'other-user', name: 'Other User Location' })
    )

    // Try to create ownership with wrong user
    const request = new Request('http://localhost/api/ownerships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'default-user',
        isbn: book.isbn,
        location_id: location.id,
      }),
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(403)
  })

  it('should return 404 when book does not exist', async () => {
    const locationService = new LocationService(db)
    const location = await locationService.create(createMockLocationInput({ name: '自宅本棚' }))

    const request = new Request('http://localhost/api/ownerships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'default-user',
        isbn: 'nonexistent-isbn',
        location_id: location.id,
      }),
    })

    const response = await handleTestRequest(request, db)
    // Service throws error, which should be caught and returned as 404
    expect(response.status).toBe(404)
  })
})

describe('DELETE /api/ownerships/:ownership_id', () => {
  let db: D1Database

  beforeEach(async () => {
    db = getTestDatabase()
    await setupTestDatabase(db)
  })

  afterEach(async () => {
    await cleanupTestDatabase(db)
  })

  it('should delete ownership successfully', async () => {
    // Setup: Create book, location, and ownership
    const bookService = new BookService(db)
    const locationService = new LocationService(db)

    const book = await bookService.create(createMockBookInput({ isbn: '9784123456789' }))
    const location = await locationService.create(createMockLocationInput({ name: '自宅本棚' }))

    // Create ownership
    const createRequest = new Request('http://localhost/api/ownerships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'default-user',
        isbn: book.isbn,
        location_id: location.id,
      }),
    })
    const createResponse = await handleTestRequest(createRequest, db)
    const created = await createResponse.json()

    // Delete ownership
    const request = new Request(`http://localhost/api/ownerships/${created.id}?user_id=default-user`, {
      method: 'DELETE',
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(204)

    // Verify ownership is deleted
    const listRequest = new Request('http://localhost/api/ownerships?user_id=default-user', {
      method: 'GET',
    })
    const listResponse = await handleTestRequest(listRequest, db)
    const data = await listResponse.json()
    expect(data.ownerships.length).toBe(0)
  })

  it('should return 403 when deleting another user\'s ownership', async () => {
    // Setup: Create users, book, location, and ownership
    await db.prepare('INSERT OR IGNORE INTO users (id, name) VALUES (?, ?)').bind('other-user', 'Other User').run()

    const bookService = new BookService(db)
    const locationService = new LocationService(db)

    const book = await bookService.create(createMockBookInput({ isbn: '9784123456789' }))
    const location = await locationService.create(
      createMockLocationInput({ user_id: 'other-user', name: 'Other User Location' })
    )

    // Create ownership for other-user
    const createRequest = new Request('http://localhost/api/ownerships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'other-user',
        isbn: book.isbn,
        location_id: location.id,
      }),
    })
    const createResponse = await handleTestRequest(createRequest, db)
    const created = await createResponse.json()

    // Try to delete with different user
    const request = new Request(`http://localhost/api/ownerships/${created.id}?user_id=default-user`, {
      method: 'DELETE',
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(403)
  })

  it('should return 400 when user_id is missing', async () => {
    const request = new Request('http://localhost/api/ownerships/1', {
      method: 'DELETE',
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(400)
  })

  it('should return 404 when ownership not found', async () => {
    const request = new Request('http://localhost/api/ownerships/999?user_id=default-user', {
      method: 'DELETE',
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(404)
  })

  it('should return 400 when ownership_id is not a number', async () => {
    const request = new Request('http://localhost/api/ownerships/invalid?user_id=default-user', {
      method: 'DELETE',
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(400)
  })
})

describe('Multiple locations per book', () => {
  let db: D1Database

  beforeEach(async () => {
    db = getTestDatabase()
    await setupTestDatabase(db)
  })

  afterEach(async () => {
    await cleanupTestDatabase(db)
  })

  it('should allow multiple ownerships for the same book in different locations', async () => {
    // Setup: Create book and locations
    const bookService = new BookService(db)
    const locationService = new LocationService(db)

    const book = await bookService.create(createMockBookInput({ isbn: '9784123456789' }))
    const location1 = await locationService.create(createMockLocationInput({ name: '自宅本棚' }))
    const location2 = await locationService.create(createMockLocationInput({ name: 'Kindle', type: 'Digital' }))

    // Create ownerships
    const request1 = new Request('http://localhost/api/ownerships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'default-user',
        isbn: book.isbn,
        location_id: location1.id,
      }),
    })
    const response1 = await handleTestRequest(request1, db)
    expect(response1.status).toBe(201)

    const request2 = new Request('http://localhost/api/ownerships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'default-user',
        isbn: book.isbn,
        location_id: location2.id,
      }),
    })
    const response2 = await handleTestRequest(request2, db)
    expect(response2.status).toBe(201)

    // Verify both ownerships exist
    const listRequest = new Request(`http://localhost/api/ownerships?user_id=default-user&isbn=${book.isbn}`, {
      method: 'GET',
    })
    const listResponse = await handleTestRequest(listRequest, db)
    const data = await listResponse.json()
    expect(data.ownerships.length).toBe(2)
    expect(data.ownerships.map((o: { location_id: number }) => o.location_id)).toContain(location1.id)
    expect(data.ownerships.map((o: { location_id: number }) => o.location_id)).toContain(location2.id)
  })
})


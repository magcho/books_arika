/**
 * Export API integration tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { D1Database } from '@cloudflare/workers-types'
import { handleTestRequest } from '../helpers/app'
import {
  getTestDatabase,
  setupTestDatabase,
  cleanupTestDatabase,
  createTestUser,
  createTestLocation,
} from '../helpers/db'
import { BookService } from '../../src/services/book_service'
import { OwnershipService } from '../../src/services/ownership_service'
import { createMockBookInput } from '../fixtures/books'

describe('GET /api/export', () => {
  let db: D1Database
  const userId = 'test-user'

  beforeEach(async () => {
    db = getTestDatabase()
    await setupTestDatabase(db)
    await createTestUser(db, userId, 'Test User')
  })

  afterEach(async () => {
    await cleanupTestDatabase(db)
  })

  it('should export all user data successfully', async () => {
    // Setup: Create books, locations, and ownerships
    const bookService = new BookService(db)
    const book1 = await bookService.create(
      createMockBookInput({ isbn: '9784123456789', title: 'Book 1' })
    )
    const book2 = await bookService.create(
      createMockBookInput({ isbn: '9784987654321', title: 'Book 2' })
    )
    const loc = await createTestLocation(db, userId, '自宅本棚', 'Physical')
    const ownershipService = new OwnershipService(db)
    await ownershipService.create({
      user_id: userId,
      isbn: book1.isbn,
      location_id: loc.id,
    })
    await ownershipService.create({
      user_id: userId,
      isbn: book2.isbn,
      location_id: loc.id,
    })

    // Request export
    const request = new Request(`http://localhost/api/export?user_id=${userId}`, {
      method: 'GET',
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(200)

    // Verify response headers
    const contentType = response.headers.get('Content-Type')
    expect(contentType).toContain('application/json')

    const contentDisposition = response.headers.get('Content-Disposition')
    expect(contentDisposition).toContain('attachment')
    expect(contentDisposition).toContain('books_export_')

    // Verify response body
    const exportData = await response.json()
    expect(exportData).toHaveProperty('version')
    expect(exportData).toHaveProperty('exported_at')
    expect(exportData).toHaveProperty('data')
    expect(exportData.data).toHaveProperty('books')
    expect(exportData.data).toHaveProperty('locations')
    expect(exportData.data).toHaveProperty('ownerships')

    // Verify data
    expect(exportData.version).toBe('1.0')
    expect(exportData.data.books).toHaveLength(2)
    expect(exportData.data.locations).toHaveLength(1)
    expect(exportData.data.ownerships).toHaveLength(2)
  })

  it('should export empty data when user has no books', async () => {
    // Request export for user with no data
    const request = new Request(`http://localhost/api/export?user_id=${userId}`, {
      method: 'GET',
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(200)

    const exportData = await response.json()
    expect(exportData.data.books).toHaveLength(0)
    expect(exportData.data.locations).toHaveLength(0)
    expect(exportData.data.ownerships).toHaveLength(0)
  })

  it('should return 400 when user_id is missing', async () => {
    const request = new Request('http://localhost/api/export', {
      method: 'GET',
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(400)

    const error = await response.json()
    expect(error.error).toBeDefined()
    expect(error.error.details).toBeDefined()
    expect(error.error.details.length).toBeGreaterThan(0)
    expect(error.error.details[0].field).toBe('user_id')
    expect(error.error.details[0].message).toContain('user_idは必須です')
  })

  it('should only export books that user owns', async () => {
    // Setup: Create books, but only one has ownership
    const bookService = new BookService(db)
    const book1 = await bookService.create(
      createMockBookInput({ isbn: '9784123456789', title: 'Owned Book' })
    )
    const book2 = await bookService.create(
      createMockBookInput({ isbn: '9784987654321', title: 'Unowned Book' })
    )
    const loc = await createTestLocation(db, userId, '自宅本棚', 'Physical')
    const ownershipService = new OwnershipService(db)
    // Only create ownership for book1
    await ownershipService.create({
      user_id: userId,
      isbn: book1.isbn,
      location_id: loc.id,
    })

    // Request export
    const request = new Request(`http://localhost/api/export?user_id=${userId}`, {
      method: 'GET',
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(200)

    const exportData = await response.json()
    // Only owned book should be exported
    expect(exportData.data.books).toHaveLength(1)
    expect(exportData.data.books[0].isbn).toBe(book1.isbn)
    expect(exportData.data.books[0].title).toBe('Owned Book')
  })
})


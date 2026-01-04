/**
 * Import API integration tests
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
import {
  createMockExportData,
  createMockExportDataWithDifferences,
  createMockExportBook,
  createMockExportLocation,
  createMockExportOwnership,
} from '../fixtures/export_import'

describe('POST /api/import', () => {
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

  it('should detect differences when import has new books', async () => {
    // Setup: Create existing book
    const bookService = new BookService(db)
    await bookService.create(createMockBookInput({ isbn: '9784123456789', title: 'Existing Book' }))
    const loc = await createTestLocation(db, userId, '自宅本棚', 'Physical')
    const ownershipService = new OwnershipService(db)
    await ownershipService.create({
      user_id: userId,
      isbn: '9784123456789',
      location_id: loc.id,
    })

    // Import data with new book
    const importData = createMockExportData({
      data: {
        books: [
          createMockExportBook({ isbn: '9784123456789', title: 'Existing Book' }),
          createMockExportBook({ isbn: '9784111111111', title: 'New Book' }),
        ],
        locations: [createMockExportLocation({ id: 1, name: '自宅本棚', type: 'Physical' })],
        ownerships: [
          createMockExportOwnership({ user_id: userId, isbn: '9784123456789', location_id: 1 }),
        ],
      },
    })

    const request = new Request(`http://localhost/api/import?user_id=${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(importData),
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(200)

    const diffResult = await response.json()
    expect(diffResult.additions).toBeDefined()
    expect(diffResult.modifications).toBeDefined()
    expect(diffResult.deletions).toBeDefined()
    expect(diffResult.additions.length).toBeGreaterThan(0)
  })

  it('should detect modifications when import has changed books', async () => {
    // Setup: Create existing book
    const bookService = new BookService(db)
    await bookService.create(createMockBookInput({ isbn: '9784123456789', title: 'Original Title' }))
    const loc = await createTestLocation(db, userId, '自宅本棚', 'Physical')
    const ownershipService = new OwnershipService(db)
    await ownershipService.create({
      user_id: userId,
      isbn: '9784123456789',
      location_id: loc.id,
    })

    // Import data with modified book
    const importData = createMockExportData({
      data: {
        books: [
          createMockExportBook({
            isbn: '9784123456789',
            title: 'Modified Title',
            author: 'Modified Author',
          }),
        ],
        locations: [createMockExportLocation({ id: 1, name: '自宅本棚', type: 'Physical' })],
        ownerships: [
          createMockExportOwnership({ user_id: userId, isbn: '9784123456789', location_id: 1 }),
        ],
      },
    })

    const request = new Request(`http://localhost/api/import?user_id=${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(importData),
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(200)

    const diffResult = await response.json()
    expect(diffResult.modifications.length).toBeGreaterThan(0)
    expect(diffResult.modifications[0].type).toBe('book')
    expect(diffResult.modifications[0].entity_id).toBe('9784123456789')
  })

  it('should detect deletions when DB has books not in import', async () => {
    // Setup: Create existing books
    const bookService = new BookService(db)
    await bookService.create(createMockBookInput({ isbn: '9784123456789', title: 'Keep Book' }))
    await bookService.create(createMockBookInput({ isbn: '9784987654321', title: 'Delete Book' }))
    const loc = await createTestLocation(db, userId, '自宅本棚', 'Physical')
    const ownershipService = new OwnershipService(db)
    await ownershipService.create({
      user_id: userId,
      isbn: '9784123456789',
      location_id: loc.id,
    })
    await ownershipService.create({
      user_id: userId,
      isbn: '9784987654321',
      location_id: loc.id,
    })

    // Import data without Delete Book
    const importData = createMockExportData({
      data: {
        books: [createMockExportBook({ isbn: '9784123456789', title: 'Keep Book' })],
        locations: [createMockExportLocation({ id: 1, name: '自宅本棚', type: 'Physical' })],
        ownerships: [
          createMockExportOwnership({ user_id: userId, isbn: '9784123456789', location_id: 1 }),
        ],
      },
    })

    const request = new Request(`http://localhost/api/import?user_id=${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(importData),
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(200)

    const diffResult = await response.json()
    expect(diffResult.deletions.length).toBeGreaterThan(0)
    expect(diffResult.deletions.some((d: any) => d.entity_id === '9784987654321')).toBe(true)
  })

  it('should return 400 when import file is invalid', async () => {
    const invalidData = { version: '1.0' } // Missing exported_at and data

    const request = new Request(`http://localhost/api/import?user_id=${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidData),
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(400)
  })

  it('should return 400 when user_id is missing', async () => {
    const importData = createMockExportData()

    const request = new Request('http://localhost/api/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(importData),
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(400)
  })
})

describe('POST /api/import/apply', () => {
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

  it('should apply import with additions when user selects import priority', async () => {
    // Setup: Create existing book
    const bookService = new BookService(db)
    await bookService.create(createMockBookInput({ isbn: '9784123456789', title: 'Existing Book' }))
    const loc = await createTestLocation(db, userId, '自宅本棚', 'Physical')
    const ownershipService = new OwnershipService(db)
    await ownershipService.create({
      user_id: userId,
      isbn: '9784123456789',
      location_id: loc.id,
    })

    // Import data with new book (don't include existing ownership to avoid duplicate)
    const importData = createMockExportData({
      data: {
        books: [
          createMockExportBook({ isbn: '9784123456789', title: 'Existing Book' }),
          createMockExportBook({ isbn: '9784111111111', title: 'New Book' }),
        ],
        locations: [createMockExportLocation({ id: 1, name: '自宅本棚', type: 'Physical' })],
        ownerships: [
          // Only include new ownership
          createMockExportOwnership({ user_id: userId, isbn: '9784111111111', location_id: 1 }),
        ],
      },
    })

    const selections = [
      { entity_id: '9784111111111', priority: 'import' as const },
      { entity_id: `${userId}:9784111111111:${loc.id}`, priority: 'import' as const },
    ]

    const request = new Request(`http://localhost/api/import/apply?user_id=${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        import_data: importData,
        selections,
      }),
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(200)

    const result = await response.json()
    expect(result.message).toBe('インポートが完了しました')
    expect(result.stats.added).toBeGreaterThan(0)

    // Verify new book was created
    const newBook = await bookService.findByISBN('9784111111111')
    expect(newBook).toBeTruthy()
  })

  it('should apply import with modifications when user selects import priority', async () => {
    // Setup: Create existing book
    const bookService = new BookService(db)
    await bookService.create(createMockBookInput({ isbn: '9784123456789', title: 'Original Title' }))
    const loc = await createTestLocation(db, userId, '自宅本棚', 'Physical')
    const ownershipService = new OwnershipService(db)
    await ownershipService.create({
      user_id: userId,
      isbn: '9784123456789',
      location_id: loc.id,
    })

    // Import data with modified book (ownership will be skipped if duplicate)
    const importData = createMockExportData({
      data: {
        books: [
          createMockExportBook({
            isbn: '9784123456789',
            title: 'Modified Title',
            author: 'Modified Author',
          }),
        ],
        locations: [createMockExportLocation({ id: 1, name: '自宅本棚', type: 'Physical' })],
        ownerships: [
          // This will be skipped as duplicate, but that's OK
          createMockExportOwnership({ user_id: userId, isbn: '9784123456789', location_id: 1 }),
        ],
      },
    })

    const selections = [{ entity_id: '9784123456789', priority: 'import' as const }]

    const request = new Request(`http://localhost/api/import/apply?user_id=${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        import_data: importData,
        selections,
      }),
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(200)

    const result = await response.json()
    expect(result.stats.modified).toBe(1)

    // Verify book was updated
    const updatedBook = await bookService.findByISBN('9784123456789')
    expect(updatedBook?.title).toBe('Modified Title')
    expect(updatedBook?.author).toBe('Modified Author')
  })

  it('should apply import with deletions when user selects import priority', async () => {
    // Setup: Create existing books
    const bookService = new BookService(db)
    await bookService.create(createMockBookInput({ isbn: '9784123456789', title: 'Keep Book' }))
    await bookService.create(createMockBookInput({ isbn: '9784987654321', title: 'Delete Book' }))
    const loc = await createTestLocation(db, userId, '自宅本棚', 'Physical')
    const ownershipService = new OwnershipService(db)
    await ownershipService.create({
      user_id: userId,
      isbn: '9784123456789',
      location_id: loc.id,
    })
    // Don't create ownership for Delete Book to allow deletion

    // Import data without Delete Book
    const importData = createMockExportData({
      data: {
        books: [createMockExportBook({ isbn: '9784123456789', title: 'Keep Book' })],
        locations: [createMockExportLocation({ id: 1, name: '自宅本棚', type: 'Physical' })],
        ownerships: [
          createMockExportOwnership({ user_id: userId, isbn: '9784123456789', location_id: 1 }),
        ],
      },
    })

    const selections = [{ entity_id: '9784987654321', priority: 'import' as const }]

    const request = new Request(`http://localhost/api/import/apply?user_id=${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        import_data: importData,
        selections,
      }),
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(200)

    const result = await response.json()
    expect(result.stats.deleted).toBeGreaterThan(0)

    // Verify book was deleted
    const deletedBook = await bookService.findByISBN('9784987654321')
    expect(deletedBook).toBeNull()
  })

  it('should return 400 when selections are missing', async () => {
    const importData = createMockExportData()

    const request = new Request(`http://localhost/api/import/apply?user_id=${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        import_data: importData,
        // selections is missing
      }),
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(400)
  })

  it('should return 400 when import_data is invalid', async () => {
    const invalidData = { version: '1.0' } // Missing exported_at and data

    const request = new Request(`http://localhost/api/import/apply?user_id=${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        import_data: invalidData,
        selections: [],
      }),
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(400)
  })
})


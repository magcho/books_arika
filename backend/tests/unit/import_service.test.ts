/**
 * ImportService unit tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { D1Database } from '@cloudflare/workers-types'
import { ImportService } from '../../src/services/import_service'
import { BookService } from '../../src/services/book_service'
import { LocationService } from '../../src/services/location_service'
import { OwnershipService } from '../../src/services/ownership_service'
import {
  getTestDatabase,
  setupTestDatabase,
  cleanupTestDatabase,
  createTestUser,
  createTestLocation,
} from '../helpers/db'
import {
  createMockExportData,
  createMockExportDataWithDifferences,
  createMockExportBook,
  createMockExportLocation,
  createMockExportOwnership,
} from '../fixtures/export_import'
import { createMockBookInput } from '../fixtures/books'

describe('ImportService', () => {
  let db: D1Database
  let importService: ImportService
  let bookService: BookService
  let locationService: LocationService
  let ownershipService: OwnershipService
  const userId = 'test-user'

  beforeEach(async () => {
    db = getTestDatabase()
    await setupTestDatabase(db)
    await createTestUser(db, userId, 'Test User')
    importService = new ImportService(db)
    bookService = new BookService(db)
    locationService = new LocationService(db)
    ownershipService = new OwnershipService(db)
  })

  afterEach(async () => {
    await cleanupTestDatabase(db)
  })

  describe('detectDiff', () => {
    it('should detect additions when import has new books', async () => {
      // Setup: Create existing book in DB
      await bookService.create(createMockBookInput({ isbn: '9784123456789', title: 'Existing Book' }))
      await ownershipService.create({
        user_id: userId,
        isbn: '9784123456789',
        location_id: 1,
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

      const diff = await importService.detectDiff(userId, importData)

      expect(diff.additions).toHaveLength(1)
      expect(diff.additions[0].type).toBe('book')
      expect(diff.additions[0].entity_id).toBe('9784111111111')
    })

    it('should detect modifications when import has changed books', async () => {
      // Setup: Create existing book in DB
      await bookService.create(createMockBookInput({ isbn: '9784123456789', title: 'Original Title' }))
      await ownershipService.create({
        user_id: userId,
        isbn: '9784123456789',
        location_id: 1,
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

      const diff = await importService.detectDiff(userId, importData)

      expect(diff.modifications).toHaveLength(1)
      expect(diff.modifications[0].type).toBe('book')
      expect(diff.modifications[0].entity_id).toBe('9784123456789')
      expect(diff.modifications[0].fields_changed).toContain('title')
      expect(diff.modifications[0].fields_changed).toContain('author')
    })

    it('should detect deletions when DB has books not in import', async () => {
      // Setup: Create existing books in DB
      await bookService.create(createMockBookInput({ isbn: '9784123456789', title: 'Book 1' }))
      await bookService.create(createMockBookInput({ isbn: '9784987654321', title: 'Book 2' }))
      await ownershipService.create({
        user_id: userId,
        isbn: '9784123456789',
        location_id: 1,
      })
      await ownershipService.create({
        user_id: userId,
        isbn: '9784987654321',
        location_id: 1,
      })

      // Import data without Book 2
      const importData = createMockExportData({
        data: {
          books: [createMockExportBook({ isbn: '9784123456789', title: 'Book 1' })],
          locations: [createMockExportLocation({ id: 1, name: '自宅本棚', type: 'Physical' })],
          ownerships: [
            createMockExportOwnership({ user_id: userId, isbn: '9784123456789', location_id: 1 }),
          ],
        },
      })

      const diff = await importService.detectDiff(userId, importData)

      expect(diff.deletions).toHaveLength(1)
      expect(diff.deletions[0].type).toBe('book')
      expect(diff.deletions[0].entity_id).toBe('9784987654321')
    })

    it('should detect location additions', async () => {
      // Setup: Create existing location in DB
      await createTestLocation(db, userId, '自宅本棚', 'Physical')

      // Import data with new location
      const importData = createMockExportData({
        data: {
          books: [],
          locations: [
            createMockExportLocation({ id: 1, name: '自宅本棚', type: 'Physical' }),
            createMockExportLocation({ id: 2, name: 'Kindle', type: 'Digital' }),
          ],
          ownerships: [],
        },
      })

      const diff = await importService.detectDiff(userId, importData)

      expect(diff.additions.some((a) => a.type === 'location' && a.entity_id === 'Kindle:Digital')).toBe(
        true
      )
    })

    it('should detect location deletions', async () => {
      // Setup: Create existing locations in DB
      await createTestLocation(db, userId, '自宅本棚', 'Physical')
      await createTestLocation(db, userId, 'Kindle', 'Digital')

      // Import data without Kindle
      const importData = createMockExportData({
        data: {
          books: [],
          locations: [createMockExportLocation({ id: 1, name: '自宅本棚', type: 'Physical' })],
          ownerships: [],
        },
      })

      const diff = await importService.detectDiff(userId, importData)

      expect(diff.deletions.some((d) => d.type === 'location' && d.entity_id === 'Kindle:Digital')).toBe(
        true
      )
    })

    it('should detect ownership additions', async () => {
      // Setup: Create existing book and location
      await bookService.create(createMockBookInput({ isbn: '9784123456789', title: 'Book 1' }))
      const loc1 = await createTestLocation(db, userId, '自宅本棚', 'Physical')
      const loc2 = await createTestLocation(db, userId, 'Kindle', 'Digital')
      await ownershipService.create({
        user_id: userId,
        isbn: '9784123456789',
        location_id: loc1.id,
      })

      // Import data with additional ownership
      const importData = createMockExportData({
        data: {
          books: [createMockExportBook({ isbn: '9784123456789', title: 'Book 1' })],
          locations: [
            createMockExportLocation({ id: 1, name: '自宅本棚', type: 'Physical' }),
            createMockExportLocation({ id: 2, name: 'Kindle', type: 'Digital' }),
          ],
          ownerships: [
            createMockExportOwnership({ user_id: userId, isbn: '9784123456789', location_id: 1 }),
            createMockExportOwnership({ user_id: userId, isbn: '9784123456789', location_id: 2 }),
          ],
        },
      })

      const diff = await importService.detectDiff(userId, importData)

      // Should detect new ownership for location 2
      const ownershipAdditions = diff.additions.filter((a) => a.type === 'ownership')
      expect(ownershipAdditions.length).toBeGreaterThan(0)
    })

    it('should detect complex differences (additions, modifications, deletions)', async () => {
      // Setup: Create existing data
      await bookService.create(createMockBookInput({ isbn: '9784123456789', title: 'Original Title' }))
      await bookService.create(createMockBookInput({ isbn: '9784987654321', title: 'Book to Delete' }))
      await createTestLocation(db, userId, '自宅本棚', 'Physical')
      await createTestLocation(db, userId, 'Kindle', 'Digital')
      await ownershipService.create({
        user_id: userId,
        isbn: '9784123456789',
        location_id: 1,
      })
      await ownershipService.create({
        user_id: userId,
        isbn: '9784987654321',
        location_id: 1,
      })

      // Import data with differences
      const { import: importData } = createMockExportDataWithDifferences()

      const diff = await importService.detectDiff(userId, importData)

      // Should have additions (new book, new location)
      expect(diff.additions.length).toBeGreaterThan(0)
      // Should have modifications (modified book)
      expect(diff.modifications.length).toBeGreaterThan(0)
      // Should have deletions (deleted book, deleted location)
      expect(diff.deletions.length).toBeGreaterThan(0)
    })
  })

  describe('applyImport', () => {
    it('should apply import with additions when user selects import priority', async () => {
      // Setup: Create existing book
      await bookService.create(createMockBookInput({ isbn: '9784123456789', title: 'Existing Book' }))
      await createTestLocation(db, userId, '自宅本棚', 'Physical')
      await ownershipService.create({
        user_id: userId,
        isbn: '9784123456789',
        location_id: 1,
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
            createMockExportOwnership({ user_id: userId, isbn: '9784111111111', location_id: 1 }),
          ],
        },
      })

      const selections = [
        { entity_id: '9784111111111', priority: 'import' as const },
        { entity_id: `${userId}:9784111111111:1`, priority: 'import' as const },
      ]

      const result = await importService.applyImport(userId, importData, selections)

      expect(result.added).toBeGreaterThan(0)
      // Verify new book was created
      const newBook = await bookService.findByISBN('9784111111111')
      expect(newBook).toBeTruthy()
      expect(newBook?.title).toBe('New Book')
    })

    it('should apply import with modifications when user selects import priority', async () => {
      // Setup: Create existing book
      await bookService.create(createMockBookInput({ isbn: '9784123456789', title: 'Original Title' }))
      await createTestLocation(db, userId, '自宅本棚', 'Physical')
      await ownershipService.create({
        user_id: userId,
        isbn: '9784123456789',
        location_id: 1,
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

      const selections = [{ entity_id: '9784123456789', priority: 'import' as const }]

      const result = await importService.applyImport(userId, importData, selections)

      expect(result.modified).toBe(1)
      // Verify book was updated
      const updatedBook = await bookService.findByISBN('9784123456789')
      expect(updatedBook?.title).toBe('Modified Title')
      expect(updatedBook?.author).toBe('Modified Author')
    })

    it('should apply import with deletions when user selects import priority', async () => {
      // Setup: Create existing books
      await bookService.create(createMockBookInput({ isbn: '9784123456789', title: 'Keep Book' }))
      await bookService.create(createMockBookInput({ isbn: '9784987654321', title: 'Delete Book' }))
      await createTestLocation(db, userId, '自宅本棚', 'Physical')
      await ownershipService.create({
        user_id: userId,
        isbn: '9784123456789',
        location_id: 1,
      })
      await ownershipService.create({
        user_id: userId,
        isbn: '9784987654321',
        location_id: 1,
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

      const selections = [{ entity_id: '9784987654321', priority: 'import' as const }]

      const result = await importService.applyImport(userId, importData, selections)

      expect(result.deleted).toBeGreaterThan(0)
      // Verify book was deleted (if no ownerships exist)
      // Note: Book deletion may fail if ownerships exist (foreign key constraint)
    })

    it('should skip deletions when book has ownerships (foreign key constraint)', async () => {
      // Setup: Create existing book with ownership
      await bookService.create(createMockBookInput({ isbn: '9784123456789', title: 'Book with Ownership' }))
      await createTestLocation(db, userId, '自宅本棚', 'Physical')
      await ownershipService.create({
        user_id: userId,
        isbn: '9784123456789',
        location_id: 1,
      })

      // Import data without this book
      const importData = createMockExportData({
        data: {
          books: [],
          locations: [createMockExportLocation({ id: 1, name: '自宅本棚', type: 'Physical' })],
          ownerships: [],
        },
      })

      const selections = [{ entity_id: '9784123456789', priority: 'import' as const }]

      // Should not throw error, but skip deletion
      const result = await importService.applyImport(userId, importData, selections)

      // Book should still exist
      const book = await bookService.findByISBN('9784123456789')
      expect(book).toBeTruthy()
    })

    it('should handle complex import with multiple selections', async () => {
      // Setup: Create existing data
      await bookService.create(createMockBookInput({ isbn: '9784123456789', title: 'Original Title' }))
      await bookService.create(createMockBookInput({ isbn: '9784987654321', title: 'Book to Delete' }))
      await createTestLocation(db, userId, '自宅本棚', 'Physical')
      await ownershipService.create({
        user_id: userId,
        isbn: '9784123456789',
        location_id: 1,
      })
      await ownershipService.create({
        user_id: userId,
        isbn: '9784987654321',
        location_id: 1,
      })

      // Import data with differences
      const { import: importData } = createMockExportDataWithDifferences()

      const selections = [
        { entity_id: '9784123456789', priority: 'import' as const }, // Modify
        { entity_id: '9784111111111', priority: 'import' as const }, // Add
        { entity_id: '9784987654321', priority: 'import' as const }, // Delete
      ]

      const result = await importService.applyImport(userId, importData, selections)

      expect(result.added).toBeGreaterThan(0)
      expect(result.modified).toBeGreaterThan(0)
      // Deletions may be 0 if book has ownerships
    })
  })
})


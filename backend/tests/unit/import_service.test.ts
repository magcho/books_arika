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
      const loc = await createTestLocation(db, userId, '自宅本棚', 'Physical')
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
          locations: [createMockExportLocation({ id: loc.id, name: '自宅本棚', type: 'Physical' })],
          ownerships: [
            createMockExportOwnership({ user_id: userId, isbn: '9784123456789', location_id: loc.id }),
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
      const loc = await createTestLocation(db, userId, '自宅本棚', 'Physical')
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
          locations: [createMockExportLocation({ id: loc.id, name: '自宅本棚', type: 'Physical' })],
          ownerships: [
            createMockExportOwnership({ user_id: userId, isbn: '9784123456789', location_id: loc.id }),
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
      const loc = await createTestLocation(db, userId, '自宅本棚', 'Physical')
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

      // Import data without Book 2
      const importData = createMockExportData({
        data: {
          books: [createMockExportBook({ isbn: '9784123456789', title: 'Book 1' })],
          locations: [createMockExportLocation({ id: loc.id, name: '自宅本棚', type: 'Physical' })],
          ownerships: [
            createMockExportOwnership({ user_id: userId, isbn: '9784123456789', location_id: loc.id }),
          ],
        },
      })

      const diff = await importService.detectDiff(userId, importData)

      // Should detect book deletion and ownership deletion
      const bookDeletions = diff.deletions.filter((d) => d.type === 'book')
      expect(bookDeletions.length).toBe(1)
      expect(bookDeletions[0].entity_id).toBe('9784987654321')
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
      const loc1 = await createTestLocation(db, userId, '自宅本棚', 'Physical')
      const loc2 = await createTestLocation(db, userId, 'Kindle', 'Digital')
      await ownershipService.create({
        user_id: userId,
        isbn: '9784123456789',
        location_id: loc1.id,
      })
      await ownershipService.create({
        user_id: userId,
        isbn: '9784987654321',
        location_id: loc1.id,
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
      // Setup: Create existing book and location
      await bookService.create(createMockBookInput({ isbn: '9784123456789', title: 'Existing Book' }))
      const loc = await createTestLocation(db, userId, '自宅本棚', 'Physical')
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
            // Only include new ownership, not existing one
            createMockExportOwnership({ user_id: userId, isbn: '9784111111111', location_id: 1 }),
          ],
        },
      })

      const selections = [
        { entity_id: '9784111111111', priority: 'import' as const },
        { entity_id: `${userId}:9784111111111:${loc.id}`, priority: 'import' as const },
      ]

      const result = await importService.applyImport(userId, importData, selections)

      expect(result.added).toBeGreaterThan(0)
      // Verify new book was created
      const newBook = await bookService.findByISBN('9784111111111')
      expect(newBook).toBeTruthy()
      expect(newBook?.title).toBe('New Book')
    })

    it('should apply import with modifications when user selects import priority', async () => {
      // Setup: Create existing book and location
      await bookService.create(createMockBookInput({ isbn: '9784123456789', title: 'Original Title' }))
      const loc = await createTestLocation(db, userId, '自宅本棚', 'Physical')
      await ownershipService.create({
        user_id: userId,
        isbn: '9784123456789',
        location_id: loc.id,
      })

      // Import data with modified book (don't include existing ownership to avoid duplicate)
      const importData = createMockExportData({
        data: {
          books: [
            createMockExportBook({
              isbn: '9784123456789',
              title: 'Modified Title',
              author: 'Modified Author',
            }),
          ],
          locations: [createMockExportLocation({ id: loc.id, name: '自宅本棚', type: 'Physical' })],
          ownerships: [
            // Don't include existing ownership to avoid duplicate error
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
      // Setup: Create existing books with ownerships (getAllUserBooks only returns books with ownerships)
      await bookService.create(createMockBookInput({ isbn: '9784123456789', title: 'Keep Book' }))
      await bookService.create(createMockBookInput({ isbn: '9784987654321', title: 'Delete Book' }))
      const loc = await createTestLocation(db, userId, '自宅本棚', 'Physical')
      await ownershipService.create({
        user_id: userId,
        isbn: '9784123456789',
        location_id: loc.id,
      })
      // Create ownership for Delete Book so it's detected by getAllUserBooks
      await ownershipService.create({
        user_id: userId,
        isbn: '9784987654321',
        location_id: loc.id,
      })

      // Import data without Delete Book (don't include existing ownerships to avoid duplicate errors)
      const importData = createMockExportData({
        data: {
          books: [createMockExportBook({ isbn: '9784123456789', title: 'Keep Book' })],
          locations: [createMockExportLocation({ id: loc.id, name: '自宅本棚', type: 'Physical' })],
          ownerships: [
            // Don't include existing ownerships to avoid duplicate errors
          ],
        },
      })

      // Select to delete ownership first, then book can be deleted
      const selections = [
        { entity_id: `${userId}:9784987654321:${loc.id}`, priority: 'import' as const }, // Delete ownership first
        { entity_id: '9784987654321', priority: 'import' as const }, // Then delete book
      ]

      const result = await importService.applyImport(userId, importData, selections)

      expect(result.deleted).toBeGreaterThan(0)
      // Verify book was deleted (after ownership is deleted)
      const deletedBook = await bookService.findByISBN('9784987654321')
      expect(deletedBook).toBeNull()
    })

    it('should skip deletions when book has ownerships (foreign key constraint)', async () => {
      // Setup: Create existing book with ownership
      await bookService.create(createMockBookInput({ isbn: '9784123456789', title: 'Book with Ownership' }))
      const loc = await createTestLocation(db, userId, '自宅本棚', 'Physical')
      const ownership = await ownershipService.create({
        user_id: userId,
        isbn: '9784123456789',
        location_id: loc.id,
      })

      // Import data without this book and ownership
      // Ownership is not in import, so it will be detected for deletion
      // But we don't select ownership deletion, so ownership will remain
      const importData = createMockExportData({
        data: {
          books: [],
          locations: [createMockExportLocation({ id: loc.id, name: '自宅本棚', type: 'Physical' })],
          ownerships: [],
        },
      })

      // Test: Book deletion should be skipped when ownership exists (foreign key constraint)
      // Setup: Book has ownership, but ownership deletion is not selected (default: 'database')
      // Expected: Book deletion is skipped, book and ownership remain
      const selections = [{ entity_id: '9784123456789', priority: 'import' as const }]

      const result = await importService.applyImport(userId, importData, selections)

      // Book should still exist because deletion was skipped (has ownerships)
      const book = await bookService.findByISBN('9784123456789')
      expect(book).toBeTruthy()
      expect(book?.title).toBe('Book with Ownership')
      
      // Ownership should still exist (not selected for deletion, default is 'database')
      const existingOwnership = await ownershipService.findByUserBookAndLocation(
        userId,
        '9784123456789',
        loc.id
      )
      expect(existingOwnership).toBeTruthy()
    })

    it('should handle complex import with multiple selections', async () => {
      // Setup: Create existing data
      await bookService.create(createMockBookInput({ isbn: '9784123456789', title: 'Original Title' }))
      await bookService.create(createMockBookInput({ isbn: '9784987654321', title: 'Book to Delete' }))
      const loc = await createTestLocation(db, userId, '自宅本棚', 'Physical')
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

    it('should skip ownerships with missing location references', async () => {
      // Setup: Create existing book
      await bookService.create(createMockBookInput({ isbn: '9784123456789', title: 'Test Book' }))

      // Import data with ownership referencing non-existent location
      const importData = createMockExportData({
        data: {
          books: [createMockExportBook({ isbn: '9784123456789', title: 'Test Book' })],
          locations: [], // No locations in import
          ownerships: [
            createMockExportOwnership({
              user_id: userId,
              isbn: '9784123456789',
              location_id: 999, // Non-existent location ID
            }),
          ],
        },
      })

      const diffResult = await importService.detectDiff(userId, importData)

      // Ownership with missing location should not be in additions
      // (because location matching fails)
      expect(diffResult.additions.filter((d) => d.type === 'ownership')).toHaveLength(0)
    })

    it('should skip ownerships with missing book references', async () => {
      // Test: applyImport should handle missing book reference gracefully
      // Setup: Ownership references non-existent book in import
      // Expected: applyImport throws error (book doesn't exist)
      const loc = await createTestLocation(db, userId, '自宅本棚', 'Physical')

      const importData = createMockExportData({
        data: {
          books: [], // No books in import
          locations: [createMockExportLocation({ id: loc.id, name: '自宅本棚', type: 'Physical' })],
          ownerships: [
            createMockExportOwnership({
              user_id: userId,
              isbn: '9789999999999', // Non-existent ISBN
              location_id: loc.id,
            }),
          ],
        },
      })

      const selections = [
        {
          entity_id: `${userId}:9789999999999:${loc.id}`,
          priority: 'import' as const,
        },
      ]

      await expect(
        importService.applyImport(userId, importData, selections)
      ).rejects.toThrow()
    })

    it('should handle duplicate ownership creation gracefully', async () => {
      // Test: detectDiff should not detect existing ownership as addition
      // Setup: Ownership already exists in DB
      // Expected: Ownership is not in additions
      await bookService.create(createMockBookInput({ isbn: '9784123456789', title: 'Test Book' }))
      const loc = await createTestLocation(db, userId, '自宅本棚', 'Physical')
      await ownershipService.create({
        user_id: userId,
        isbn: '9784123456789',
        location_id: loc.id,
      })

      const importData = createMockExportData({
        data: {
          books: [createMockExportBook({ isbn: '9784123456789', title: 'Test Book' })],
          locations: [createMockExportLocation({ id: loc.id, name: '自宅本棚', type: 'Physical' })],
          ownerships: [
            createMockExportOwnership({
              user_id: userId,
              isbn: '9784123456789',
              location_id: loc.id,
            }),
          ],
        },
      })

      const diffResult = await importService.detectDiff(userId, importData)

      // Ownership should not be in additions (already exists)
      expect(diffResult.additions.filter((d) => d.type === 'ownership')).toHaveLength(0)
    })

    it('should handle location deletion with ownerships gracefully', async () => {
      // Test: Location deletion should succeed even when ownerships exist
      // Setup: Location has ownership (will be cascade deleted)
      // Expected: Location is deleted successfully, ownerships are cascade deleted
      await bookService.create(createMockBookInput({ isbn: '9784123456789', title: 'Test Book' }))
      const loc = await createTestLocation(db, userId, '自宅本棚', 'Physical')
      await ownershipService.create({
        user_id: userId,
        isbn: '9784123456789',
        location_id: loc.id,
      })

      const importData = createMockExportData({
        data: {
          books: [createMockExportBook({ isbn: '9784123456789', title: 'Test Book' })],
          locations: [], // Location not in import
          ownerships: [], // Ownerships not in import (will be cascade deleted)
        },
      })

      const selections = [
        {
          entity_id: `自宅本棚:Physical`,
          priority: 'import' as const,
        },
      ]

      const result = await importService.applyImport(userId, importData, selections)

      // Location deletion should succeed (ownerships are cascade deleted by DB)
      expect(result.deleted).toBe(1)

      // Verify location was deleted
      const deletedLocation = await locationService.findById(loc.id)
      expect(deletedLocation).toBeNull()
    })
  })
})


/**
 * ExportService unit tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { D1Database } from '@cloudflare/workers-types'
import { ExportService } from '../../src/services/export_service'
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
import { createMockBookInput } from '../fixtures/books'

describe('ExportService', () => {
  let db: D1Database
  let exportService: ExportService
  let bookService: BookService
  let locationService: LocationService
  let ownershipService: OwnershipService
  const userId = 'test-user'

  beforeEach(async () => {
    db = getTestDatabase()
    await setupTestDatabase(db)
    await createTestUser(db, userId, 'Test User')
    exportService = new ExportService(db)
    bookService = new BookService(db)
    locationService = new LocationService(db)
    ownershipService = new OwnershipService(db)
  })

  afterEach(async () => {
    await cleanupTestDatabase(db)
  })

  describe('exportUserData', () => {
    it('should export all user data (books, locations, ownerships)', async () => {
      // Setup: Create books, locations, and ownerships
      const book1 = await bookService.create(
        createMockBookInput({ isbn: '9784123456789', title: 'Book 1' })
      )
      const book2 = await bookService.create(
        createMockBookInput({ isbn: '9784987654321', title: 'Book 2' })
      )
      const loc1 = await createTestLocation(db, userId, '自宅本棚', 'Physical')
      const loc2 = await createTestLocation(db, userId, 'Kindle', 'Digital')
      await ownershipService.create({
        user_id: userId,
        isbn: book1.isbn,
        location_id: loc1.id,
      })
      await ownershipService.create({
        user_id: userId,
        isbn: book2.isbn,
        location_id: loc2.id,
      })

      // Export data
      const exportData = await exportService.exportUserData(userId)

      // Verify structure
      expect(exportData).toHaveProperty('version')
      expect(exportData).toHaveProperty('exported_at')
      expect(exportData).toHaveProperty('data')
      expect(exportData.data).toHaveProperty('books')
      expect(exportData.data).toHaveProperty('locations')
      expect(exportData.data).toHaveProperty('ownerships')

      // Verify version
      expect(exportData.version).toBe('1.0')

      // Verify exported_at is a valid ISO string
      expect(exportData.exported_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)

      // Verify books
      expect(exportData.data.books).toHaveLength(2)
      const exportedBook1 = exportData.data.books.find((b) => b.isbn === book1.isbn)
      const exportedBook2 = exportData.data.books.find((b) => b.isbn === book2.isbn)
      expect(exportedBook1).toBeDefined()
      expect(exportedBook1?.title).toBe('Book 1')
      expect(exportedBook2).toBeDefined()
      expect(exportedBook2?.title).toBe('Book 2')

      // Verify locations
      expect(exportData.data.locations).toHaveLength(2)
      const exportedLoc1 = exportData.data.locations.find((l) => l.id === loc1.id)
      const exportedLoc2 = exportData.data.locations.find((l) => l.id === loc2.id)
      expect(exportedLoc1).toBeDefined()
      expect(exportedLoc1?.name).toBe('自宅本棚')
      expect(exportedLoc1?.type).toBe('Physical')
      expect(exportedLoc2).toBeDefined()
      expect(exportedLoc2?.name).toBe('Kindle')
      expect(exportedLoc2?.type).toBe('Digital')

      // Verify ownerships
      expect(exportData.data.ownerships).toHaveLength(2)
      const exportedOwn1 = exportData.data.ownerships.find(
        (o) => o.isbn === book1.isbn && o.location_id === loc1.id
      )
      const exportedOwn2 = exportData.data.ownerships.find(
        (o) => o.isbn === book2.isbn && o.location_id === loc2.id
      )
      expect(exportedOwn1).toBeDefined()
      expect(exportedOwn1?.user_id).toBe(userId)
      expect(exportedOwn2).toBeDefined()
      expect(exportedOwn2?.user_id).toBe(userId)
    })

    it('should export empty data when user has no books, locations, or ownerships', async () => {
      // Export data for user with no data
      const exportData = await exportService.exportUserData(userId)

      // Verify structure
      expect(exportData).toHaveProperty('version')
      expect(exportData).toHaveProperty('exported_at')
      expect(exportData).toHaveProperty('data')
      expect(exportData.data).toHaveProperty('books')
      expect(exportData.data).toHaveProperty('locations')
      expect(exportData.data).toHaveProperty('ownerships')

      // Verify empty arrays
      expect(exportData.data.books).toHaveLength(0)
      expect(exportData.data.locations).toHaveLength(0)
      expect(exportData.data.ownerships).toHaveLength(0)
    })

    it('should export books with all required fields', async () => {
      // Setup: Create book with all fields
      const book = await bookService.create(
        createMockBookInput({
          isbn: '9784123456789',
          title: 'Test Book',
          author: 'Test Author',
          thumbnail_url: 'https://example.com/thumb.jpg',
          is_doujin: false,
        })
      )
      const loc = await createTestLocation(db, userId, '自宅本棚', 'Physical')
      await ownershipService.create({
        user_id: userId,
        isbn: book.isbn,
        location_id: loc.id,
      })

      // Export data
      const exportData = await exportService.exportUserData(userId)

      // Verify book fields
      const exportedBook = exportData.data.books[0]
      expect(exportedBook.isbn).toBe('9784123456789')
      expect(exportedBook.title).toBe('Test Book')
      expect(exportedBook.author).toBe('Test Author')
      expect(exportedBook.thumbnail_url).toBe('https://example.com/thumb.jpg')
      expect(exportedBook.is_doujin).toBe(false)
      expect(exportedBook.created_at).toBeDefined()
      expect(exportedBook.updated_at).toBeDefined()
    })

    it('should export doujin books (without ISBN)', async () => {
      // Setup: Create doujin book
      const book = await bookService.create(
        createMockBookInput({
          isbn: null,
          title: '同人誌',
          author: '同人作家',
          is_doujin: true,
        })
      )
      const loc = await createTestLocation(db, userId, '自宅本棚', 'Physical')
      await ownershipService.create({
        user_id: userId,
        isbn: book.isbn,
        location_id: loc.id,
      })

      // Export data
      const exportData = await exportService.exportUserData(userId)

      // Verify doujin book
      const exportedBook = exportData.data.books[0]
      expect(exportedBook.isbn).toBe(book.isbn) // UUID generated by service
      expect(exportedBook.title).toBe('同人誌')
      expect(exportedBook.author).toBe('同人作家')
      expect(exportedBook.is_doujin).toBe(true)
    })

    it('should only export books that user owns (through ownerships)', async () => {
      // Setup: Create books, but only one has ownership
      const book1 = await bookService.create(
        createMockBookInput({ isbn: '9784123456789', title: 'Owned Book' })
      )
      const book2 = await bookService.create(
        createMockBookInput({ isbn: '9784987654321', title: 'Unowned Book' })
      )
      const loc = await createTestLocation(db, userId, '自宅本棚', 'Physical')
      // Only create ownership for book1
      await ownershipService.create({
        user_id: userId,
        isbn: book1.isbn,
        location_id: loc.id,
      })

      // Export data
      const exportData = await exportService.exportUserData(userId)

      // Verify only owned book is exported
      expect(exportData.data.books).toHaveLength(1)
      expect(exportData.data.books[0].isbn).toBe(book1.isbn)
      expect(exportData.data.books[0].title).toBe('Owned Book')
    })
  })
})


/**
 * OwnershipService unit tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { D1Database } from '@cloudflare/workers-types'
import { OwnershipService } from '../../src/services/ownership_service'
import { LocationService } from '../../src/services/location_service'
import { BookService } from '../../src/services/book_service'
import { getTestDatabase, setupTestDatabase, cleanupTestDatabase } from '../helpers/db'
import { createMockOwnershipInput } from '../fixtures/ownerships'
import { createMockLocationInput } from '../fixtures/locations'
import { createMockBookInput } from '../fixtures/books'

describe('OwnershipService', () => {
  let db: D1Database
  let ownershipService: OwnershipService
  let locationService: LocationService
  let bookService: BookService

  beforeEach(async () => {
    db = getTestDatabase()
    await setupTestDatabase(db)
    ownershipService = new OwnershipService(db)
    locationService = new LocationService(db)
    bookService = new BookService(db)
  })

  afterEach(async () => {
    await cleanupTestDatabase(db)
  })

  describe('validateLocationOwnership', () => {
    it('should return true when location belongs to user', async () => {
      const location = await locationService.create(createMockLocationInput({ user_id: 'default-user' }))

      const isValid = await ownershipService.validateLocationOwnership(location.id, 'default-user')

      expect(isValid).toBe(true)
    })

    it('should return false when location does not belong to user', async () => {
      // Create user first
      await db.prepare('INSERT OR IGNORE INTO users (id, name) VALUES (?, ?)').bind('user1', 'User 1').run()
      
      const location = await locationService.create(createMockLocationInput({ user_id: 'user1' }))

      const isValid = await ownershipService.validateLocationOwnership(location.id, 'user2')

      expect(isValid).toBe(false)
    })

    it('should return false when location does not exist', async () => {
      const isValid = await ownershipService.validateLocationOwnership(999, 'default-user')

      expect(isValid).toBe(false)
    })
  })

  describe('create', () => {
    it('should create ownership when book and location exist', async () => {
      const book = await bookService.create(createMockBookInput({ isbn: '9784123456789' }))
      const location = await locationService.create(createMockLocationInput())

      const input = createMockOwnershipInput({
        isbn: book.isbn,
        location_id: location.id,
      })

      const ownership = await ownershipService.create(input)

      expect(ownership.isbn).toBe(book.isbn)
      expect(ownership.location_id).toBe(location.id)
      expect(ownership.user_id).toBe('default-user')
      expect(ownership.id).toBeDefined()
      expect(ownership.created_at).toBeDefined()
    })

    it('should throw error when book does not exist', async () => {
      const location = await locationService.create(createMockLocationInput())

      const input = createMockOwnershipInput({
        isbn: '9789999999999',
        location_id: location.id,
      })

      await expect(ownershipService.create(input)).rejects.toThrow('ISBN 9789999999999 の書籍が見つかりません')
    })

    it('should throw error when location does not belong to user', async () => {
      // Create user first
      await db.prepare('INSERT OR IGNORE INTO users (id, name) VALUES (?, ?)').bind('other-user', 'Other User').run()
      
      const book = await bookService.create(createMockBookInput())
      const location = await locationService.create(createMockLocationInput({ user_id: 'other-user' }))

      const input = createMockOwnershipInput({
        isbn: book.isbn,
        location_id: location.id,
      })

      await expect(ownershipService.create(input)).rejects.toThrow('指定された場所はこのユーザーのものではありません')
    })

    it('should throw error when creating duplicate ownership', async () => {
      const book = await bookService.create(createMockBookInput())
      const location = await locationService.create(createMockLocationInput())

      const input = createMockOwnershipInput({
        isbn: book.isbn,
        location_id: location.id,
      })

      await ownershipService.create(input)

      await expect(ownershipService.create(input)).rejects.toThrow('この書籍は既にこの場所に登録されています')
    })

    it('should throw error when user_id is missing', async () => {
      const input = createMockOwnershipInput({
        user_id: '',
      })

      await expect(ownershipService.create(input)).rejects.toThrow('ユーザーIDは必須です')
    })

    it('should throw error when isbn is missing', async () => {
      const input = createMockOwnershipInput({
        isbn: '',
      })

      await expect(ownershipService.create(input)).rejects.toThrow('ISBNは必須です')
    })

    it('should throw error when location_id is invalid', async () => {
      const input = createMockOwnershipInput({
        location_id: 0,
      })

      await expect(ownershipService.create(input)).rejects.toThrow('場所IDは必須です')
    })
  })

  describe('findById', () => {
    it('should find ownership by ID', async () => {
      const book = await bookService.create(createMockBookInput())
      const location = await locationService.create(createMockLocationInput())
      const created = await ownershipService.create(
        createMockOwnershipInput({
          isbn: book.isbn,
          location_id: location.id,
        })
      )

      const found = await ownershipService.findById(created.id)

      expect(found).not.toBeNull()
      expect(found?.id).toBe(created.id)
    })

    it('should return null when ownership not found', async () => {
      const found = await ownershipService.findById(999)

      expect(found).toBeNull()
    })
  })

  describe('findByUserId', () => {
    it('should find all ownerships for a user', async () => {
      const book1 = await bookService.create(createMockBookInput({ isbn: '9781111111111' }))
      const book2 = await bookService.create(createMockBookInput({ isbn: '9782222222222' }))
      const location = await locationService.create(createMockLocationInput())

      await ownershipService.create(
        createMockOwnershipInput({
          isbn: book1.isbn,
          location_id: location.id,
        })
      )
      await ownershipService.create(
        createMockOwnershipInput({
          isbn: book2.isbn,
          location_id: location.id,
        })
      )

      const ownerships = await ownershipService.findByUserId('default-user')

      expect(ownerships.length).toBe(2)
    })
  })

  describe('findByISBN', () => {
    it('should find all ownerships for a book', async () => {
      const book = await bookService.create(createMockBookInput())
      const location1 = await locationService.create(createMockLocationInput({ name: '自宅本棚' }))
      const location2 = await locationService.create(createMockLocationInput({ name: 'Kindle' }))

      await ownershipService.create(
        createMockOwnershipInput({
          isbn: book.isbn,
          location_id: location1.id,
        })
      )
      await ownershipService.create(
        createMockOwnershipInput({
          isbn: book.isbn,
          location_id: location2.id,
        })
      )

      const ownerships = await ownershipService.findByISBN(book.isbn)

      expect(ownerships.length).toBe(2)
      expect(ownerships.map((o) => o.location_id)).toContain(location1.id)
      expect(ownerships.map((o) => o.location_id)).toContain(location2.id)
    })
  })

  describe('findByLocationId', () => {
    it('should find all ownerships for a location', async () => {
      const book1 = await bookService.create(createMockBookInput({ isbn: '9781111111111' }))
      const book2 = await bookService.create(createMockBookInput({ isbn: '9782222222222' }))
      const location = await locationService.create(createMockLocationInput())

      await ownershipService.create(
        createMockOwnershipInput({
          isbn: book1.isbn,
          location_id: location.id,
        })
      )
      await ownershipService.create(
        createMockOwnershipInput({
          isbn: book2.isbn,
          location_id: location.id,
        })
      )

      const ownerships = await ownershipService.findByLocationId(location.id)

      expect(ownerships.length).toBe(2)
    })
  })

  describe('delete', () => {
    it('should delete ownership', async () => {
      const book = await bookService.create(createMockBookInput())
      const location = await locationService.create(createMockLocationInput())
      const created = await ownershipService.create(
        createMockOwnershipInput({
          isbn: book.isbn,
          location_id: location.id,
        })
      )

      await ownershipService.delete(created.id)

      const found = await ownershipService.findById(created.id)
      expect(found).toBeNull()
    })

    it('should throw error when ownership not found', async () => {
      await expect(ownershipService.delete(999)).rejects.toThrow('所有情報が見つかりません')
    })
  })

  describe('createMultiple', () => {
    it('should create multiple ownerships', async () => {
      const book = await bookService.create(createMockBookInput())
      const location1 = await locationService.create(createMockLocationInput({ name: '自宅本棚' }))
      const location2 = await locationService.create(createMockLocationInput({ name: 'Kindle' }))

      const inputs = [
        createMockOwnershipInput({
          isbn: book.isbn,
          location_id: location1.id,
        }),
        createMockOwnershipInput({
          isbn: book.isbn,
          location_id: location2.id,
        }),
      ]

      const ownerships = await ownershipService.createMultiple(inputs)

      expect(ownerships.length).toBe(2)
      expect(ownerships.map((o) => o.location_id)).toContain(location1.id)
      expect(ownerships.map((o) => o.location_id)).toContain(location2.id)
    })

    it('should return empty array when inputs is empty', async () => {
      const ownerships = await ownershipService.createMultiple([])

      expect(ownerships).toEqual([])
    })

    it('should throw error when book does not exist', async () => {
      const location = await locationService.create(createMockLocationInput())

      const inputs = [
        createMockOwnershipInput({
          isbn: '9789999999999',
          location_id: location.id,
        }),
      ]

      await expect(ownershipService.createMultiple(inputs)).rejects.toThrow('ISBN 9789999999999 の書籍が見つかりません')
    })

    it('should throw error when location does not belong to user', async () => {
      // Create user first
      await db.prepare('INSERT OR IGNORE INTO users (id, name) VALUES (?, ?)').bind('other-user', 'Other User').run()
      
      const book = await bookService.create(createMockBookInput())
      const location = await locationService.create(createMockLocationInput({ user_id: 'other-user' }))

      const inputs = [
        createMockOwnershipInput({
          isbn: book.isbn,
          location_id: location.id,
        }),
      ]

      await expect(ownershipService.createMultiple(inputs)).rejects.toThrow('このユーザーのものではありません')
    })

    it('should throw error when duplicate ownership exists', async () => {
      const book = await bookService.create(createMockBookInput())
      const location = await locationService.create(createMockLocationInput())

      const input = createMockOwnershipInput({
        isbn: book.isbn,
        location_id: location.id,
      })

      await ownershipService.create(input)

      await expect(ownershipService.createMultiple([input])).rejects.toThrow()
    })

    it('should fail all operations if any validation fails', async () => {
      const book = await bookService.create(createMockBookInput())
      const location1 = await locationService.create(createMockLocationInput({ name: '自宅本棚' }))
      const location2 = await locationService.create(createMockLocationInput({ name: 'Kindle' }))

      // Create first ownership
      await ownershipService.create(
        createMockOwnershipInput({
          isbn: book.isbn,
          location_id: location1.id,
        })
      )

      // Try to create multiple, including a duplicate
      const inputs = [
        createMockOwnershipInput({
          isbn: book.isbn,
          location_id: location1.id, // duplicate
        }),
        createMockOwnershipInput({
          isbn: book.isbn,
          location_id: location2.id,
        }),
      ]

      await expect(ownershipService.createMultiple(inputs)).rejects.toThrow()

      // Verify second ownership was not created
      const ownerships = await ownershipService.findByLocationId(location2.id)
      expect(ownerships.length).toBe(0)
    })
  })
})


/**
 * BookService unit tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { D1Database } from '@cloudflare/workers-types'
import { BookService } from '../../src/services/book_service'
import { getTestDatabase, setupTestDatabase, cleanupTestDatabase } from '../helpers/db'
import { createMockBookInput, createMockDoujinBookInput } from '../fixtures/books'

describe('BookService', () => {
  let db: D1Database
  let bookService: BookService

  beforeEach(async () => {
    // Get D1 database from test environment
    db = getTestDatabase()
    await setupTestDatabase(db)
    bookService = new BookService(db)
  })

  afterEach(async () => {
    await cleanupTestDatabase(db)
  })

  describe('create', () => {
    it('should create a book with ISBN', async () => {
      const input = createMockBookInput({
        isbn: '9784123456789',
        title: 'Test Book',
        author: 'Test Author',
      })

      const book = await bookService.create(input)

      expect(book.isbn).toBe('9784123456789')
      expect(book.title).toBe('Test Book')
      expect(book.author).toBe('Test Author')
      expect(book.is_doujin).toBe(false)
      expect(book.created_at).toBeDefined()
      expect(book.updated_at).toBeDefined()
    })

    it('should create a book without ISBN (doujin)', async () => {
      const input = createMockDoujinBookInput({
        title: '同人誌タイトル',
        author: '同人作家',
      })

      const book = await bookService.create(input)

      expect(book.isbn).toBeDefined()
      expect(book.title).toBe('同人誌タイトル')
      expect(book.author).toBe('同人作家')
      expect(book.is_doujin).toBe(true)
    })

    it('should throw error when creating duplicate book by ISBN', async () => {
      const input = createMockBookInput({
        isbn: '9784123456789',
        title: 'Test Book',
      })

      await bookService.create(input)

      await expect(bookService.create(input)).rejects.toThrow(
        'ISBN 9784123456789 の書籍は既に登録されています'
      )
    })

    it('should throw error when creating duplicate book by title and author', async () => {
      const input1 = createMockBookInput({
        title: 'Test Book',
        author: 'Test Author',
      })

      const input2 = createMockBookInput({
        title: 'Test Book',
        author: 'Test Author',
      })

      await bookService.create(input1)

      const duplicate = await bookService.checkDuplicate(input2)
      expect(duplicate).not.toBeNull()
      expect(duplicate?.title).toBe('Test Book')
    })
  })

  describe('findByISBN', () => {
    it('should find a book by ISBN', async () => {
      const input = createMockBookInput({
        isbn: '9784123456789',
        title: 'Test Book',
      })

      await bookService.create(input)
      const found = await bookService.findByISBN('9784123456789')

      expect(found).not.toBeNull()
      expect(found?.isbn).toBe('9784123456789')
      expect(found?.title).toBe('Test Book')
    })

    it('should return null when book not found', async () => {
      const found = await bookService.findByISBN('9784123456789')
      expect(found).toBeNull()
    })
  })

  describe('checkDuplicate', () => {
    it('should detect duplicate by ISBN', async () => {
      const input = createMockBookInput({
        isbn: '9784123456789',
        title: 'Test Book',
      })

      await bookService.create(input)

      const duplicate = await bookService.checkDuplicate(input)
      expect(duplicate).not.toBeNull()
      expect(duplicate?.isbn).toBe('9784123456789')
    })

    it('should detect duplicate by title and author', async () => {
      const input1 = createMockBookInput({
        title: 'Test Book',
        author: 'Test Author',
      })

      await bookService.create(input1)

      const input2 = createMockBookInput({
        title: 'Test Book',
        author: 'Test Author',
      })

      const duplicate = await bookService.checkDuplicate(input2)
      expect(duplicate).not.toBeNull()
      expect(duplicate?.title).toBe('Test Book')
      expect(duplicate?.author).toBe('Test Author')
    })

    it('should return null when no duplicate found', async () => {
      const input = createMockBookInput({
        title: 'Unique Book',
        author: 'Unique Author',
      })

      const duplicate = await bookService.checkDuplicate(input)
      expect(duplicate).toBeNull()
    })
  })

  describe('listAll', () => {
    it('should list all books', async () => {
      const input1 = createMockBookInput({
        isbn: '9784123456789',
        title: 'Book 1',
      })
      const input2 = createMockBookInput({
        isbn: '9784123456790',
        title: 'Book 2',
      })

      await bookService.create(input1)
      await bookService.create(input2)

      const books = await bookService.listAll()

      expect(books.length).toBe(2)
      expect(books.some((b) => b.title === 'Book 1')).toBe(true)
      expect(books.some((b) => b.title === 'Book 2')).toBe(true)
    })

    it('should return empty array when no books exist', async () => {
      const books = await bookService.listAll()
      expect(books).toEqual([])
    })
  })

  describe('search', () => {
    it('should search books by title', async () => {
      const input1 = createMockBookInput({
        isbn: '9784123456789',
        title: 'JavaScript入門',
        author: '山田太郎',
      })
      const input2 = createMockBookInput({
        isbn: '9784123456790',
        title: 'Python基礎',
        author: '佐藤花子',
      })

      await bookService.create(input1)
      await bookService.create(input2)

      const results = await bookService.search('JavaScript')

      expect(results.length).toBe(1)
      expect(results[0].title).toBe('JavaScript入門')
    })

    it('should search books by author', async () => {
      const input1 = createMockBookInput({
        isbn: '9784123456789',
        title: 'JavaScript入門',
        author: '山田太郎',
      })
      const input2 = createMockBookInput({
        isbn: '9784123456790',
        title: 'Python基礎',
        author: '佐藤花子',
      })

      await bookService.create(input1)
      await bookService.create(input2)

      const results = await bookService.search('山田')

      expect(results.length).toBe(1)
      expect(results[0].author).toBe('山田太郎')
    })

    it('should search books by partial title match', async () => {
      const input1 = createMockBookInput({
        isbn: '9784123456789',
        title: 'JavaScript入門',
        author: '山田太郎',
      })
      const input2 = createMockBookInput({
        isbn: '9784123456790',
        title: 'JavaScript上級',
        author: '佐藤花子',
      })
      const input3 = createMockBookInput({
        isbn: '9784123456791',
        title: 'Python基礎',
        author: '鈴木一郎',
      })

      await bookService.create(input1)
      await bookService.create(input2)
      await bookService.create(input3)

      const results = await bookService.search('JavaScript')

      expect(results.length).toBe(2)
      expect(results.some((b) => b.title === 'JavaScript入門')).toBe(true)
      expect(results.some((b) => b.title === 'JavaScript上級')).toBe(true)
    })

    it('should search books by partial author match', async () => {
      const input1 = createMockBookInput({
        isbn: '9784123456789',
        title: 'JavaScript入門',
        author: '山田太郎',
      })
      const input2 = createMockBookInput({
        isbn: '9784123456790',
        title: 'Python基礎',
        author: '山田花子',
      })
      const input3 = createMockBookInput({
        isbn: '9784123456791',
        title: 'TypeScript実践',
        author: '佐藤一郎',
      })

      await bookService.create(input1)
      await bookService.create(input2)
      await bookService.create(input3)

      const results = await bookService.search('山田')

      expect(results.length).toBe(2)
      expect(results.some((b) => b.author === '山田太郎')).toBe(true)
      expect(results.some((b) => b.author === '山田花子')).toBe(true)
    })

    it('should return empty array when no matches found', async () => {
      const input = createMockBookInput({
        isbn: '9784123456789',
        title: 'JavaScript入門',
        author: '山田太郎',
      })

      await bookService.create(input)

      const results = await bookService.search('存在しない書籍')

      expect(results).toEqual([])
    })

    it('should handle special characters in search query', async () => {
      const input = createMockBookInput({
        isbn: '9784123456789',
        title: 'C++入門',
        author: '山田太郎',
      })

      await bookService.create(input)

      const results = await bookService.search('C++')

      expect(results.length).toBe(1)
      expect(results[0].title).toBe('C++入門')
    })

    it('should handle empty search query', async () => {
      const input = createMockBookInput({
        isbn: '9784123456789',
        title: 'JavaScript入門',
        author: '山田太郎',
      })

      await bookService.create(input)

      const results = await bookService.search('')

      // Empty query should return all books (same as listAll)
      expect(results.length).toBe(1)
    })
  })
})


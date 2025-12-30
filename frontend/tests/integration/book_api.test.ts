/**
 * Book API service integration tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createBook, searchBooks, searchByBarcode } from '../../src/services/book_api'
import { mockFetchResponse, mockFetchError, resetFetchMock } from '../helpers/api'
import { createMockBook, createMockBookSearchResult } from '../fixtures/books'

describe('book_api', () => {
  beforeEach(() => {
    resetFetchMock()
  })

  describe('createBook', () => {
    it('should create a book successfully', async () => {
      const mockBook = createMockBook({ title: 'Test Book' })
      mockFetchResponse(mockBook, 201)

      const result = await createBook({
        user_id: 'default-user',
        title: 'Test Book',
      })

      expect(result.title).toBe('Test Book')
    })

    it('should handle API errors', async () => {
      mockFetchError(new Error('API Error'))

      await expect(
        createBook({
          user_id: 'default-user',
          title: 'Test Book',
        })
      ).rejects.toThrow()
    })
  })

  describe('searchBooks', () => {
    it('should search books successfully', async () => {
      const mockResponse = {
        items: [createMockBookSearchResult({ title: 'Test Book' })],
      }
      mockFetchResponse(mockResponse, 200)

      const result = await searchBooks('Test Book', 10)

      expect(result.items).toHaveLength(1)
      expect(result.items[0].title).toBe('Test Book')
    })
  })

  describe('searchByBarcode', () => {
    it('should search book by ISBN barcode', async () => {
      const mockResult = createMockBookSearchResult({ isbn: '9784123456789' })
      mockFetchResponse(mockResult, 200)

      const result = await searchByBarcode('9784123456789')

      expect(result.isbn).toBe('9784123456789')
    })
  })
})



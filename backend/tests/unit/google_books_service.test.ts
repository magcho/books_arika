/**
 * GoogleBooksService unit tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { GoogleBooksService } from '../../src/services/google_books_service'

describe('GoogleBooksService', () => {
  let service: GoogleBooksService
  const mockApiKey = 'test-api-key'

  beforeEach(() => {
    service = new GoogleBooksService(mockApiKey)
    // Mock global fetch
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('search', () => {
    it('should search books by query', async () => {
      const mockResponse = {
        items: [
          {
            id: '1',
            volumeInfo: {
              title: 'Test Book',
              authors: ['Test Author'],
              industryIdentifiers: [
                { type: 'ISBN_13', identifier: '9784123456789' },
              ],
              imageLinks: {
                thumbnail: 'http://example.com/thumb.jpg',
              },
            },
          },
        ],
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const results = await service.search('Test Book', 10)

      expect(results).toHaveLength(1)
      expect(results[0].title).toBe('Test Book')
      expect(results[0].author).toBe('Test Author')
      expect(results[0].isbn).toBe('9784123456789')
      expect(results[0].thumbnail_url).toBe('https://example.com/thumb.jpg')
    })

    it('should return empty array when no results found', async () => {
      const mockResponse = { items: [] }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const results = await service.search('Non-existent Book', 10)

      expect(results).toEqual([])
    })

    it('should throw error when API key is not configured', async () => {
      const serviceWithoutKey = new GoogleBooksService()

      await expect(serviceWithoutKey.search('Test Book')).rejects.toThrow(
        'Google Books API key is not configured'
      )
    })

    it('should throw error when API request fails', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      })

      await expect(service.search('Test Book')).rejects.toThrow(
        'Google Books API error: 400 Bad Request'
      )
    })

    it('should handle timeout', async () => {
      const controller = new AbortController()
      controller.abort()

      ;(global.fetch as any).mockImplementationOnce(() => {
        return Promise.reject(new Error('AbortError'))
      })

      // Mock AbortError
      const error = new Error('AbortError')
      error.name = 'AbortError'
      ;(global.fetch as any).mockRejectedValueOnce(error)

      await expect(service.search('Test Book')).rejects.toThrow()
    })

    it('should use ISBN-10 when ISBN-13 is not available', async () => {
      const mockResponse = {
        items: [
          {
            id: '1',
            volumeInfo: {
              title: 'Test Book',
              authors: ['Test Author'],
              industryIdentifiers: [
                { type: 'ISBN_10', identifier: '4123456789' },
              ],
            },
          },
        ],
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const results = await service.search('Test Book', 10)

      expect(results[0].isbn).toBe('4123456789')
    })

    it('should handle books without ISBN', async () => {
      const mockResponse = {
        items: [
          {
            id: '1',
            volumeInfo: {
              title: 'Test Book',
              authors: ['Test Author'],
            },
          },
        ],
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const results = await service.search('Test Book', 10)

      expect(results[0].isbn).toBeNull()
    })
  })

  describe('searchByISBN', () => {
    it('should search book by ISBN', async () => {
      const mockResponse = {
        items: [
          {
            id: '1',
            volumeInfo: {
              title: 'Test Book',
              authors: ['Test Author'],
              industryIdentifiers: [
                { type: 'ISBN_13', identifier: '9784123456789' },
              ],
            },
          },
        ],
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await service.searchByISBN('978-4-1234-5678-9')

      expect(result).not.toBeNull()
      expect(result?.title).toBe('Test Book')
      expect(result?.isbn).toBe('9784123456789')
    })

    it('should return null when book not found', async () => {
      const mockResponse = { items: [] }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await service.searchByISBN('9784123456789')

      expect(result).toBeNull()
    })

    it('should clean ISBN format (remove hyphens and spaces)', async () => {
      const mockResponse = {
        items: [
          {
            id: '1',
            volumeInfo: {
              title: 'Test Book',
              industryIdentifiers: [
                { type: 'ISBN_13', identifier: '9784123456789' },
              ],
            },
          },
        ],
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      await service.searchByISBN('978-4-1234-5678-9')

      // Verify fetch was called with cleaned ISBN (URL encoded)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('isbn%3A9784123456789'),
        expect.any(Object)
      )
    })
  })
})


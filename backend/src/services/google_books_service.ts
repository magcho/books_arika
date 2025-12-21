/**
 * Google Books Service
 * Integration with Google Books API for book metadata retrieval
 */

import type { BookSearchResult } from '../types'

export interface GoogleBooksApiResponse {
  items?: Array<{
    id: string
    volumeInfo: {
      title: string
      authors?: string[]
      industryIdentifiers?: Array<{
        type: string
        identifier: string
      }>
      imageLinks?: {
        thumbnail?: string
      }
      description?: string
    }
  }>
}

export class GoogleBooksService {
  private readonly apiKey: string | undefined
  private readonly baseUrl = 'https://www.googleapis.com/books/v1/volumes'

  constructor(apiKey?: string) {
    this.apiKey = apiKey
  }

  /**
   * Search books by query (title or author)
   */
  async search(query: string, maxResults: number = 10): Promise<BookSearchResult[]> {
    if (!this.apiKey) {
      throw new Error('Google Books API key is not configured')
    }

    const url = new URL(this.baseUrl)
    url.searchParams.set('q', query)
    url.searchParams.set('maxResults', maxResults.toString())
    url.searchParams.set('key', this.apiKey)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch(url.toString(), {
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Google Books API error: ${response.status} ${response.statusText}`)
      }

      const data: GoogleBooksApiResponse = await response.json()

      if (!data.items || data.items.length === 0) {
        return []
      }

      return data.items.map((item) => {
        const volumeInfo = item.volumeInfo
        const isbn13 = volumeInfo.industryIdentifiers?.find((id) => id.type === 'ISBN_13')
        const isbn10 = volumeInfo.industryIdentifiers?.find((id) => id.type === 'ISBN_10')

        return {
          isbn: isbn13?.identifier || isbn10?.identifier || null,
          title: volumeInfo.title,
          author: volumeInfo.authors?.join(', ') || null,
          thumbnail_url: volumeInfo.imageLinks?.thumbnail?.replace('http://', 'https://') || null,
          description: volumeInfo.description || null,
        }
      })
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Google Books API request timed out')
      }
      throw error
    }
  }

  /**
   * Search book by ISBN
   */
  async searchByISBN(isbn: string): Promise<BookSearchResult | null> {
    // Remove hyphens and spaces from ISBN
    const cleanedISBN = isbn.replace(/[-\s]/g, '')

    const results = await this.search(`isbn:${cleanedISBN}`, 1)

    if (results.length === 0) {
      return null
    }

    return results[0]
  }
}


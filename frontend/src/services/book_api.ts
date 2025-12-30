/**
 * Book API service
 * Handles all book-related API calls
 */

import { get, post } from './api'
import type {
  Book,
  BookCreateRequest,
  BookSearchResult,
  BooksResponse,
  SearchResponse,
  BookWithLocations,
} from '../types'

/**
 * Register a new book
 */
export async function createBook(data: BookCreateRequest): Promise<Book> {
  return post<Book>('/books', data)
}

/**
 * List all books with optional search
 */
export async function listBooks(user_id: string, search?: string): Promise<BooksResponse> {
  const params = new URLSearchParams({ user_id })
  if (search) {
    params.append('search', search)
  }
  return get<BooksResponse>(`/books?${params.toString()}`)
}

/**
 * Search books using Google Books API
 */
export async function searchBooks(
  query: string,
  maxResults: number = 10
): Promise<SearchResponse> {
  return get<SearchResponse>(`/search/books?q=${encodeURIComponent(query)}&maxResults=${maxResults}`)
}

/**
 * Search book by ISBN barcode
 */
export async function searchByBarcode(isbn: string): Promise<BookSearchResult> {
  return post<BookSearchResult>('/search/barcode', { isbn })
}

/**
 * Get book detail with locations
 */
export async function getBookDetail(isbn: string, user_id: string): Promise<BookWithLocations> {
  return get<BookWithLocations>(`/books/${encodeURIComponent(isbn)}?user_id=${encodeURIComponent(user_id)}`)
}


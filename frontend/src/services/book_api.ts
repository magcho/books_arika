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
} from '../types'

/**
 * Register a new book
 */
export async function createBook(data: BookCreateRequest): Promise<Book> {
  return post<Book>('/books', data)
}

/**
 * List all books
 */
export async function listBooks(): Promise<BooksResponse> {
  return get<BooksResponse>('/books')
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


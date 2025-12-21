/**
 * Book Model
 * Represents a book entity in the system.
 * Books are shared across all users as master data.
 * ISBN can be NULL for doujin books - we use UUID in that case.
 */

import { randomUUID } from 'crypto'

export interface Book {
  isbn: string // ISBN or UUID for non-ISBN books
  title: string
  author: string | null
  thumbnail_url: string | null
  is_doujin: boolean
  created_at: string
  updated_at: string
}

export interface BookCreateInput {
  isbn?: string | null // Optional - will generate UUID if not provided
  title: string
  author?: string | null
  thumbnail_url?: string | null
  is_doujin?: boolean
}

export interface BookUpdateInput {
  title?: string
  author?: string | null
  thumbnail_url?: string | null
  is_doujin?: boolean
}

/**
 * Generate a UUID for books without ISBN (e.g., doujin books)
 */
export function generateBookId(): string {
  return randomUUID()
}

/**
 * Validate ISBN format (basic validation)
 * Supports ISBN-10 and ISBN-13
 */
export function isValidISBN(isbn: string): boolean {
  // Remove hyphens and spaces
  const cleaned = isbn.replace(/[-\s]/g, '')
  
  // Check if it's ISBN-10 (10 digits) or ISBN-13 (13 digits starting with 978 or 979)
  if (cleaned.length === 10) {
    return /^\d{9}[\dX]$/.test(cleaned)
  } else if (cleaned.length === 13) {
    return /^(978|979)\d{10}$/.test(cleaned)
  }
  
  return false
}


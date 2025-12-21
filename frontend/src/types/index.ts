/**
 * TypeScript type definitions for frontend
 * Shared types matching backend API responses
 */

// Book types
export interface Book {
  isbn: string
  title: string
  author: string | null
  thumbnail_url: string | null
  is_doujin: boolean
  created_at: string
  updated_at: string
}

export interface BookWithLocations extends Book {
  locations: Location[]
}

export interface BookCreateRequest {
  user_id: string
  isbn?: string | null
  title: string
  author?: string | null
  thumbnail_url?: string | null
  is_doujin?: boolean
  location_ids?: number[]
}

export interface BookUpdateRequest {
  title?: string
  author?: string | null
  thumbnail_url?: string | null
  is_doujin?: boolean
}

export interface BookSearchResult {
  isbn: string | null
  title: string
  author: string | null
  thumbnail_url: string | null
  description?: string | null
}

// Location types
export interface Location {
  id: number
  user_id: string
  name: string
  type: 'Physical' | 'Digital'
  created_at: string
  updated_at: string
}

export interface LocationCreateRequest {
  user_id: string
  name: string
  type: 'Physical' | 'Digital'
}

export interface LocationUpdateRequest {
  name?: string
  type?: 'Physical' | 'Digital'
}

// Ownership types
export interface Ownership {
  id: number
  user_id: string
  isbn: string
  location_id: number
  created_at: string
}

export interface OwnershipCreateRequest {
  user_id: string
  isbn: string
  location_id: number
}

// User types
export interface User {
  id: string
  name: string
  created_at: string
  updated_at: string
}

// API Response types
export interface ApiResponse<T> {
  data?: T
  error?: {
    message: string
    code?: string
    details?: unknown
  }
}

export interface BooksResponse {
  books: BookWithLocations[]
}

export interface LocationsResponse {
  locations: Location[]
}

export interface OwnershipsResponse {
  ownerships: Ownership[]
}

export interface SearchResponse {
  items: BookSearchResult[]
}


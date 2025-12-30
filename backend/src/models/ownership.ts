/**
 * Ownership Model
 * Represents the relationship between a user, a book, and a location.
 * Allows multiple ownership records for the same book (same book in multiple locations).
 */

export interface Ownership {
  id: number
  user_id: string
  isbn: string
  location_id: number
  created_at: string
}

export interface OwnershipCreateInput {
  user_id: string
  isbn: string
  location_id: number
}

/**
 * Validate ownership input
 * All fields are required
 */
export function validateOwnershipInput(input: OwnershipCreateInput): { valid: boolean; error?: string } {
  if (!input.user_id || input.user_id.trim().length === 0) {
    return { valid: false, error: 'ユーザーIDは必須です' }
  }
  if (!input.isbn || input.isbn.trim().length === 0) {
    return { valid: false, error: 'ISBNは必須です' }
  }
  if (!input.location_id || input.location_id <= 0) {
    return { valid: false, error: '場所IDは必須です' }
  }
  return { valid: true }
}



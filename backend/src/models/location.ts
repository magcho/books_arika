/**
 * Location Model
 * Represents a user-defined location where books are stored.
 * Each user can define their own locations (e.g., "自宅本棚", "Kindle").
 */

export interface Location {
  id: number
  user_id: string
  name: string
  type: 'Physical' | 'Digital'
  created_at: string
  updated_at: string
}

export interface LocationCreateInput {
  user_id: string
  name: string
  type: 'Physical' | 'Digital'
}

export interface LocationUpdateInput {
  name?: string
  type?: 'Physical' | 'Digital'
}

/**
 * Validate location type
 * Only 'Physical' or 'Digital' are allowed
 */
export function isValidLocationType(type: string): type is 'Physical' | 'Digital' {
  return type === 'Physical' || type === 'Digital'
}

/**
 * Validate location name
 * Must be 1-100 characters
 */
export function validateLocationName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: '場所名は必須です' }
  }
  if (name.length > 100) {
    return { valid: false, error: '場所名は100文字以内で入力してください' }
  }
  return { valid: true }
}


/**
 * User Model
 * Represents a user entity in the system.
 * For MVP, we use a default user. This model supports future multi-user expansion.
 */

export interface User {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export interface UserCreateInput {
  id: string
  name: string
}

export interface UserUpdateInput {
  name?: string
}

/**
 * Default user ID for MVP phase
 */
export const DEFAULT_USER_ID = 'default-user'


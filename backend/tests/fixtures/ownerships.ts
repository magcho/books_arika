/**
 * Ownership test fixtures
 * Mock ownership data factories for backend testing
 */

import type { Ownership, OwnershipCreateInput } from '../../src/models/ownership'

/**
 * Create a mock ownership with default values
 */
export function createMockOwnership(overrides?: Partial<Ownership>): Ownership {
  const now = new Date().toISOString()
  return {
    id: 1,
    user_id: 'default-user',
    isbn: '9784123456789',
    location_id: 1,
    created_at: now,
    ...overrides,
  }
}

/**
 * Create a mock ownership input for creation
 */
export function createMockOwnershipInput(overrides?: Partial<OwnershipCreateInput>): OwnershipCreateInput {
  return {
    user_id: 'default-user',
    isbn: '9784123456789',
    location_id: 1,
    ...overrides,
  }
}


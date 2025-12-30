/**
 * Location test fixtures
 * Mock location data factories for backend testing
 */

import type { Location, LocationCreateInput } from '../../src/models/location'

/**
 * Create a mock location with default values
 */
export function createMockLocation(overrides?: Partial<Location>): Location {
  const now = new Date().toISOString()
  return {
    id: 1,
    user_id: 'default-user',
    name: '自宅本棚',
    type: 'Physical',
    created_at: now,
    updated_at: now,
    ...overrides,
  }
}

/**
 * Create a mock location input for creation
 */
export function createMockLocationInput(overrides?: Partial<LocationCreateInput>): LocationCreateInput {
  return {
    user_id: 'default-user',
    name: '自宅本棚',
    type: 'Physical',
    ...overrides,
  }
}



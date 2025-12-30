/**
 * Initialization Service
 * Handles system initialization tasks, including default location creation
 * 
 * FR-011: System MUST automatically create a default location named "本棚" (type: Physical)
 * for each user upon system initialization or first use.
 */

import type { D1Database } from '@cloudflare/workers-types'
import { LocationService } from './location_service'

const DEFAULT_LOCATION_NAME = '本棚'
const DEFAULT_LOCATION_TYPE = 'Physical' as const

export class InitializationService {
  constructor(private db: D1Database) {}

  /**
   * Ensure default location exists for a user
   * Creates "本棚" (Physical) location if it doesn't exist
   * This is idempotent - safe to call multiple times
   * 
   * @param user_id - User ID to create default location for
   * @returns The default location (existing or newly created)
   */
  async ensureDefaultLocation(user_id: string) {
    const locationService = new LocationService(this.db)

    // Check if default location already exists
    const existing = await locationService.findByNameAndUserId(
      DEFAULT_LOCATION_NAME,
      user_id
    )

    if (existing) {
      // Default location already exists, return it
      return existing
    }

    // Create default location
    try {
      const defaultLocation = await locationService.create({
        user_id,
        name: DEFAULT_LOCATION_NAME,
        type: DEFAULT_LOCATION_TYPE,
      })

      return defaultLocation
    } catch (error) {
      // Handle race condition: another request might have created it
      if (error instanceof Error && error.message.includes('既に登録されています')) {
        // Try to fetch it again
        const location = await locationService.findByNameAndUserId(
          DEFAULT_LOCATION_NAME,
          user_id
        )
        if (location) {
          return location
        }
      }
      // Re-throw if it's a different error
      throw error
    }
  }

  /**
   * Initialize user data (default location, etc.)
   * Called when user first uses the system
   * 
   * @param user_id - User ID to initialize
   */
  async initializeUser(user_id: string) {
    // Ensure default location exists
    await this.ensureDefaultLocation(user_id)
    // Future: Add other initialization tasks here (e.g., default settings)
  }
}


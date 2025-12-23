/**
 * Location Service
 * Business logic for location operations (CRUD)
 */

import type { D1Database } from '@cloudflare/workers-types'
import type { Location, LocationCreateInput, LocationUpdateInput } from '../models/location'
import { validateLocationName, isValidLocationType } from '../models/location'

export class LocationService {
  constructor(private db: D1Database) {}

  /**
   * Create a new location
   * Validates name uniqueness within user
   */
  async create(input: LocationCreateInput): Promise<Location> {
    // Validate location name
    const nameValidation = validateLocationName(input.name)
    if (!nameValidation.valid) {
      throw new Error(nameValidation.error)
    }

    // Validate location type
    if (!isValidLocationType(input.type)) {
      throw new Error('場所の形式は "Physical" または "Digital" である必要があります')
    }

    // Check for duplicate name within user
    const existing = await this.findByNameAndUserId(input.name, input.user_id)
    if (existing) {
      throw new Error(`場所 "${input.name}" は既に登録されています`)
    }

    try {
      // Insert location - database UNIQUE constraint will catch race conditions
      const result = await this.db
        .prepare(
          `INSERT INTO locations (user_id, name, type, created_at, updated_at)
           VALUES (?, ?, ?, datetime('now'), datetime('now'))`
        )
        .bind(input.user_id, input.name, input.type)
        .run()

      if (!result.meta.last_row_id) {
        throw new Error('場所の作成に失敗しました')
      }

      // Fetch the created location
      const location = await this.findById(result.meta.last_row_id)
      if (!location) {
        throw new Error('場所の作成に失敗しました')
      }

      return location
    } catch (error) {
      // Handle database UNIQUE constraint violation
      if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
        // Race condition: another request created the location between check and insert
        const existing = await this.findByNameAndUserId(input.name, input.user_id)
        if (existing) {
          throw new Error(`場所 "${input.name}" は既に登録されています`)
        }
        throw error
      }
      throw error
    }
  }

  /**
   * Find location by ID
   */
  async findById(id: number): Promise<Location | null> {
    const result = await this.db
      .prepare('SELECT * FROM locations WHERE id = ?')
      .bind(id)
      .first<Location>()

    return result || null
  }

  /**
   * Find location by name and user_id (for duplicate detection)
   */
  async findByNameAndUserId(name: string, user_id: string): Promise<Location | null> {
    const result = await this.db
      .prepare('SELECT * FROM locations WHERE user_id = ? AND name = ?')
      .bind(user_id, name)
      .first<Location>()

    return result || null
  }

  /**
   * List all locations for a user
   */
  async findByUserId(user_id: string): Promise<Location[]> {
    const result = await this.db
      .prepare('SELECT * FROM locations WHERE user_id = ? ORDER BY created_at DESC')
      .bind(user_id)
      .all<Location>()

    return result.results || []
  }

  /**
   * Update location
   */
  async update(id: number, input: LocationUpdateInput): Promise<Location> {
    // Check if location exists
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error('場所が見つかりません')
    }

    // Validate name if provided
    if (input.name !== undefined) {
      const nameValidation = validateLocationName(input.name)
      if (!nameValidation.valid) {
        throw new Error(nameValidation.error)
      }

      // Check for duplicate name within user (excluding current location)
      const duplicate = await this.findByNameAndUserId(input.name, existing.user_id)
      if (duplicate && duplicate.id !== id) {
        throw new Error(`場所 "${input.name}" は既に登録されています`)
      }
    }

    // Validate type if provided
    if (input.type !== undefined && !isValidLocationType(input.type)) {
      throw new Error('場所の形式は "Physical" または "Digital" である必要があります')
    }

    // Build update query dynamically
    const updates: string[] = []
    const values: unknown[] = []

    if (input.name !== undefined) {
      updates.push('name = ?')
      values.push(input.name)
    }
    if (input.type !== undefined) {
      updates.push('type = ?')
      values.push(input.type)
    }

    if (updates.length === 0) {
      // No updates, return existing
      return existing
    }

    updates.push('updated_at = datetime(\'now\')')
    values.push(id)

    try {
      await this.db
        .prepare(`UPDATE locations SET ${updates.join(', ')} WHERE id = ?`)
        .bind(...values)
        .run()

      // Fetch the updated location
      const updated = await this.findById(id)
      if (!updated) {
        throw new Error('場所の更新に失敗しました')
      }

      return updated
    } catch (error) {
      // Handle database UNIQUE constraint violation
      if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
        throw new Error(`場所 "${input.name}" は既に登録されています`)
      }
      throw error
    }
  }

  /**
   * Delete location
   * Note: Ownerships will be cascade deleted by database foreign key constraint
   */
  async delete(id: number): Promise<void> {
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error('場所が見つかりません')
    }

    await this.db
      .prepare('DELETE FROM locations WHERE id = ?')
      .bind(id)
      .run()
  }
}


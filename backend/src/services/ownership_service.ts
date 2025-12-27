/**
 * Ownership Service
 * Business logic for ownership operations (create, find, delete)
 * Handles the relationship between users, books, and locations
 */

import type { D1Database } from '@cloudflare/workers-types'
import type { Ownership, OwnershipCreateInput } from '../models/ownership'
import { validateOwnershipInput } from '../models/ownership'
import { BookService } from './book_service'

export class OwnershipService {
  constructor(private db: D1Database) {}

  /**
   * Validate that location belongs to user
   * This is a critical security check to prevent users from associating
   * books with locations they don't own
   */
  async validateLocationOwnership(location_id: number, user_id: string): Promise<boolean> {
    const result = await this.db
      .prepare('SELECT user_id FROM locations WHERE id = ?')
      .bind(location_id)
      .first<{ user_id: string }>()

    if (!result) {
      return false
    }

    return result.user_id === user_id
  }

  /**
   * Create a new ownership record
   * Validates location ownership, book existence, and checks for duplicates
   */
  async create(input: OwnershipCreateInput): Promise<Ownership> {
    // Validate input
    const validation = validateOwnershipInput(input)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    // Validate that book exists
    const bookService = new BookService(this.db)
    const book = await bookService.findByISBN(input.isbn)
    if (!book) {
      throw new Error(`ISBN ${input.isbn} の書籍が見つかりません`)
    }

    // Validate that location belongs to user
    const locationOwned = await this.validateLocationOwnership(input.location_id, input.user_id)
    if (!locationOwned) {
      throw new Error('指定された場所はこのユーザーのものではありません')
    }

    // Check for duplicate ownership
    const existing = await this.findByUserBookAndLocation(
      input.user_id,
      input.isbn,
      input.location_id
    )
    if (existing) {
      throw new Error('この書籍は既にこの場所に登録されています')
    }

    try {
      // Insert ownership - database UNIQUE constraint will catch race conditions
      const result = await this.db
        .prepare(
          `INSERT INTO ownerships (user_id, isbn, location_id, created_at)
           VALUES (?, ?, ?, datetime('now'))`
        )
        .bind(input.user_id, input.isbn, input.location_id)
        .run()

      if (!result.meta.last_row_id) {
        throw new Error('所有情報の作成に失敗しました')
      }

      // Fetch the created ownership
      const ownership = await this.findById(result.meta.last_row_id)
      if (!ownership) {
        throw new Error('所有情報の作成に失敗しました')
      }

      return ownership
    } catch (error) {
      // Handle database UNIQUE constraint violation
      if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
        // Race condition: another request created the ownership between check and insert
        const existing = await this.findByUserBookAndLocation(
          input.user_id,
          input.isbn,
          input.location_id
        )
        if (existing) {
          throw new Error('この書籍は既にこの場所に登録されています')
        }
        throw error
      }
      throw error
    }
  }

  /**
   * Find ownership by ID
   */
  async findById(id: number): Promise<Ownership | null> {
    const result = await this.db
      .prepare('SELECT * FROM ownerships WHERE id = ?')
      .bind(id)
      .first<Ownership>()

    return result || null
  }

  /**
   * Find ownership by user, book, and location (for duplicate detection)
   */
  async findByUserBookAndLocation(
    user_id: string,
    isbn: string,
    location_id: number
  ): Promise<Ownership | null> {
    const result = await this.db
      .prepare(
        'SELECT * FROM ownerships WHERE user_id = ? AND isbn = ? AND location_id = ?'
      )
      .bind(user_id, isbn, location_id)
      .first<Ownership>()

    return result || null
  }

  /**
   * List all ownerships for a user
   */
  async findByUserId(user_id: string): Promise<Ownership[]> {
    const result = await this.db
      .prepare('SELECT * FROM ownerships WHERE user_id = ? ORDER BY created_at DESC')
      .bind(user_id)
      .all<Ownership>()

    return result.results || []
  }

  /**
   * List all ownerships for a book (by ISBN)
   */
  async findByISBN(isbn: string): Promise<Ownership[]> {
    const result = await this.db
      .prepare('SELECT * FROM ownerships WHERE isbn = ? ORDER BY created_at DESC')
      .bind(isbn)
      .all<Ownership>()

    return result.results || []
  }

  /**
   * List all ownerships for a location
   */
  async findByLocationId(location_id: number): Promise<Ownership[]> {
    const result = await this.db
      .prepare('SELECT * FROM ownerships WHERE location_id = ? ORDER BY created_at DESC')
      .bind(location_id)
      .all<Ownership>()

    return result.results || []
  }

  /**
   * Find ownerships by ISBN and user_id (for efficient filtering)
   */
  async findByISBNAndUserId(isbn: string, user_id: string): Promise<Ownership[]> {
    const result = await this.db
      .prepare('SELECT * FROM ownerships WHERE isbn = ? AND user_id = ? ORDER BY created_at DESC')
      .bind(isbn, user_id)
      .all<Ownership>()

    return result.results || []
  }

  /**
   * Find ownerships by location_id and user_id (for efficient filtering)
   */
  async findByLocationIdAndUserId(location_id: number, user_id: string): Promise<Ownership[]> {
    const result = await this.db
      .prepare('SELECT * FROM ownerships WHERE location_id = ? AND user_id = ? ORDER BY created_at DESC')
      .bind(location_id, user_id)
      .all<Ownership>()

    return result.results || []
  }

  /**
   * Delete ownership
   */
  async delete(id: number): Promise<void> {
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error('所有情報が見つかりません')
    }

    await this.db
      .prepare('DELETE FROM ownerships WHERE id = ?')
      .bind(id)
      .run()
  }

  /**
   * Create multiple ownerships for a book
   * Used when registering a book with multiple locations
   * Uses D1 batch operations for atomicity
   * 
   * Note: D1 doesn't support traditional transactions, but batch operations
   * provide better consistency. If any ownership creation fails, all operations
   * in the batch will fail together.
   */
  async createMultiple(inputs: OwnershipCreateInput[]): Promise<Ownership[]> {
    if (inputs.length === 0) {
      return []
    }

    // Validate all inputs before attempting to create
    // This prevents partial failures
    for (const input of inputs) {
      const validation = validateOwnershipInput(input)
      if (!validation.valid) {
        throw new Error(validation.error)
      }

      // Validate book exists (check once for all inputs with same ISBN)
      const bookService = new BookService(this.db)
      const book = await bookService.findByISBN(input.isbn)
      if (!book) {
        throw new Error(`ISBN ${input.isbn} の書籍が見つかりません`)
      }

      // Validate location ownership
      const locationOwned = await this.validateLocationOwnership(input.location_id, input.user_id)
      if (!locationOwned) {
        throw new Error(`場所ID ${input.location_id} はこのユーザーのものではありません`)
      }

      // Check for duplicates
      const existing = await this.findByUserBookAndLocation(
        input.user_id,
        input.isbn,
        input.location_id
      )
      if (existing) {
        throw new Error(`この書籍は既に場所ID ${input.location_id} に登録されています`)
      }
    }

    // Use batch operations for atomicity
    // If any statement fails, the entire batch fails
    const statements = inputs.map((input) =>
      this.db
        .prepare(
          `INSERT INTO ownerships (user_id, isbn, location_id, created_at)
           VALUES (?, ?, ?, datetime('now'))`
        )
        .bind(input.user_id, input.isbn, input.location_id)
    )

    try {
      const results = await this.db.batch(statements)
      const ownerships: Ownership[] = []

      for (let i = 0; i < results.length; i++) {
        const result = results[i]
        if (!result.meta.last_row_id) {
          throw new Error(`所有情報の作成に失敗しました (index: ${i})`)
        }

        const ownership = await this.findById(result.meta.last_row_id)
        if (!ownership) {
          throw new Error(`所有情報の取得に失敗しました (index: ${i})`)
        }

        ownerships.push(ownership)
      }

      return ownerships
    } catch (error) {
      // Handle database UNIQUE constraint violation
      if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
        throw new Error('1つ以上の所有情報が既に登録されています')
      }
      throw error
    }
  }
}


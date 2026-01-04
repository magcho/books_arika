/**
 * Book Service
 * Business logic for book operations (create, find, duplicate detection)
 */

import type { D1Database } from '@cloudflare/workers-types'
import type { Book, BookCreateInput, BookUpdateInput } from '../models/book'
import { generateBookId } from '../models/book'

export class BookService {
  constructor(private db: D1Database) {}

  /**
   * Create a new book
   * Generates UUID for books without ISBN
   */
  async create(input: BookCreateInput): Promise<Book> {
    // Generate ISBN/UUID if not provided
    const isbn = input.isbn || generateBookId()

    // Check for duplicate ISBN (optimistic check)
    const existing = await this.findByISBN(isbn)
    if (existing) {
      throw new Error(`ISBN ${isbn} の書籍は既に登録されています`)
    }

    try {
      // Insert book - database UNIQUE constraint will catch race conditions
      await this.db
        .prepare(
          `INSERT INTO books (isbn, title, author, thumbnail_url, is_doujin, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
        )
        .bind(
          isbn,
          input.title,
          input.author || null,
          input.thumbnail_url || null,
          input.is_doujin ? 1 : 0
        )
        .run()

      // Fetch the created book
      const result = await this.findByISBN(isbn)

      if (!result) {
        throw new Error('書籍の作成に失敗しました')
      }

      return result
    } catch (error) {
      // Handle database UNIQUE constraint violation
      if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
        // Race condition: another request created the book between check and insert
        const existing = await this.findByISBN(isbn)
        if (existing) {
          throw new Error(`ISBN ${isbn} の書籍は既に登録されています`)
        }
        throw error
      }
      throw error
    }
  }

  /**
   * Find book by ISBN
   */
  async findByISBN(isbn: string): Promise<Book | null> {
    const result = await this.db
      .prepare('SELECT * FROM books WHERE isbn = ?')
      .bind(isbn)
      .first<Book>()

    if (!result) {
      return null
    }

    return {
      ...result,
      is_doujin: Boolean(result.is_doujin),
    }
  }

  /**
   * Find book by title and author (for duplicate detection)
   */
  async findByTitleAndAuthor(
    title: string,
    author: string | null
  ): Promise<Book | null> {
    if (author) {
      const result = await this.db
        .prepare('SELECT * FROM books WHERE title = ? AND author = ?')
        .bind(title, author)
        .first<Book>()

      if (result) {
        return {
          ...result,
          is_doujin: Boolean(result.is_doujin),
        }
      }
    }

    // Fallback: search by title only
    const result = await this.db
      .prepare('SELECT * FROM books WHERE title = ?')
      .bind(title)
      .first<Book>()

    if (!result) {
      return null
    }

    return {
      ...result,
      is_doujin: Boolean(result.is_doujin),
    }
  }

  /**
   * Check for duplicate book
   * Returns existing book if duplicate found, null otherwise
   */
  async checkDuplicate(input: BookCreateInput): Promise<Book | null> {
    // First check by ISBN if provided
    if (input.isbn) {
      const existing = await this.findByISBN(input.isbn)
      if (existing) {
        return existing
      }
    }

    // Then check by title and author
    return await this.findByTitleAndAuthor(input.title, input.author || null)
  }

  /**
   * List all books (for a user - will be filtered by ownership in future)
   */
  async listAll(): Promise<Book[]> {
    const result = await this.db.prepare('SELECT * FROM books ORDER BY created_at DESC').all<Book>()

    return result.results.map((book) => ({
      ...book,
      is_doujin: Boolean(book.is_doujin),
    }))
  }

  /**
   * Update an existing book
   * Only updates provided fields, leaves others unchanged
   */
  async update(isbn: string, input: BookUpdateInput): Promise<Book> {
    const existing = await this.findByISBN(isbn)
    if (!existing) {
      throw new Error(`ISBN ${isbn} の書籍が見つかりません`)
    }

    await this.db
      .prepare(
        `UPDATE books 
         SET title = COALESCE(?, title),
             author = ?,
             thumbnail_url = ?,
             is_doujin = COALESCE(?, is_doujin),
             updated_at = datetime('now')
         WHERE isbn = ?`
      )
      .bind(
        input.title ?? existing.title,
        input.author ?? null,
        input.thumbnail_url ?? null,
        input.is_doujin !== undefined ? (input.is_doujin ? 1 : 0) : existing.is_doujin ? 1 : 0,
        isbn
      )
      .run()

    const result = await this.findByISBN(isbn)
    if (!result) {
      throw new Error('書籍の更新に失敗しました')
    }
    return result
  }

  /**
   * Delete a book
   * Note: Will fail if ownerships exist (foreign key constraint)
   * Should delete ownerships first before deleting book
   */
  async delete(isbn: string): Promise<void> {
    const existing = await this.findByISBN(isbn)
    if (!existing) {
      throw new Error(`ISBN ${isbn} の書籍が見つかりません`)
    }

    try {
      await this.db.prepare('DELETE FROM books WHERE isbn = ?').bind(isbn).run()
    } catch (error) {
      // Handle foreign key constraint violation
      if (error instanceof Error && error.message.includes('FOREIGN KEY constraint')) {
        throw new Error(
          `ISBN ${isbn} の書籍は所有情報が存在するため削除できません。先に所有情報を削除してください。`
        )
      }
      throw error
    }
  }

  /**
   * Search books by title or author
   * Supports partial matching for both title and author
   */
  async search(query: string): Promise<Book[]> {
    if (!query || query.trim() === '') {
      // Empty query returns all books (same as listAll)
      return this.listAll()
    }

    // Escape SQL LIKE special characters (%, _) to prevent unexpected matches
    const escapedQuery = query.trim().replace(/[%_]/g, '\\$&')
    const searchTerm = `%${escapedQuery}%`
    
    // Limit results to 100 for performance (adjust based on requirements)
    // Ensure indexes exist on title and author columns for optimal performance
    const result = await this.db
      .prepare(
        `SELECT * FROM books 
         WHERE title LIKE ? ESCAPE '\\' OR author LIKE ? ESCAPE '\\'
         ORDER BY created_at DESC
         LIMIT 100`
      )
      .bind(searchTerm, searchTerm)
      .all<Book>()

    return result.results.map((book) => ({
      ...book,
      is_doujin: Boolean(book.is_doujin),
    }))
  }
}


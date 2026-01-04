/**
 * Export Service
 * Business logic for exporting user data to JSON format
 */

import type { D1Database } from '@cloudflare/workers-types'
import type { ExportData, ExportBook, ExportLocation, ExportOwnership } from '../types/export_import'
import { BookService } from './book_service'
import { LocationService } from './location_service'
import { OwnershipService } from './ownership_service'
import type { Book } from '../models/book'
import type { Location } from '../models/location'
import type { Ownership } from '../models/ownership'

const EXPORT_VERSION = '1.0'

export class ExportService {
  constructor(private db: D1Database) {}

  /**
   * Export all user data (books, locations, ownerships) to JSON format
   * Only exports books that the user owns (through ownerships)
   */
  async exportUserData(userId: string): Promise<ExportData> {
    const bookService = new BookService(this.db)
    const locationService = new LocationService(this.db)
    const ownershipService = new OwnershipService(this.db)

    // Get all user data
    const books = await this.getAllUserBooks(userId, bookService)
    const locations = await locationService.findByUserId(userId)
    const ownerships = await ownershipService.findByUserId(userId)

    // Convert to export format
    const exportBooks: ExportBook[] = books.map((book) => this.convertBookToExport(book))
    const exportLocations: ExportLocation[] = locations.map((location) =>
      this.convertLocationToExport(location)
    )
    const exportOwnerships: ExportOwnership[] = ownerships.map((ownership) =>
      this.convertOwnershipToExport(ownership)
    )

    // Create export data with metadata
    const exportData: ExportData = {
      version: EXPORT_VERSION,
      exported_at: new Date().toISOString(),
      data: {
        books: exportBooks,
        locations: exportLocations,
        ownerships: exportOwnerships,
      },
    }

    return exportData
  }

  /**
   * Helper: Get all books for a user (through ownerships)
   * Optimized to use a single query with IN clause instead of N+1 queries
   */
  private async getAllUserBooks(userId: string, bookService: BookService): Promise<Book[]> {
    const ownerships = await this.db
      .prepare('SELECT DISTINCT isbn FROM ownerships WHERE user_id = ?')
      .bind(userId)
      .all<{ isbn: string }>()

    const isbns = (ownerships.results || []).map((own) => own.isbn)
    if (isbns.length === 0) return []

    const placeholders = isbns.map(() => '?').join(', ')
    const result = await this.db
      .prepare(`SELECT * FROM books WHERE isbn IN (${placeholders})`)
      .bind(...isbns)
      .all<Book>()

    return (result.results || []).map((book) => ({
      ...book,
      is_doujin: Boolean(book.is_doujin),
    }))
  }

  /**
   * Convert Book to ExportBook format
   */
  private convertBookToExport(book: Book): ExportBook {
    return {
      isbn: book.isbn,
      title: book.title,
      author: book.author,
      thumbnail_url: book.thumbnail_url,
      is_doujin: book.is_doujin,
      created_at: book.created_at,
      updated_at: book.updated_at,
    }
  }

  /**
   * Convert Location to ExportLocation format
   */
  private convertLocationToExport(location: Location): ExportLocation {
    return {
      id: location.id,
      name: location.name,
      type: location.type,
      created_at: location.created_at,
      updated_at: location.updated_at,
    }
  }

  /**
   * Convert Ownership to ExportOwnership format
   */
  private convertOwnershipToExport(ownership: Ownership): ExportOwnership {
    return {
      user_id: ownership.user_id,
      isbn: ownership.isbn,
      location_id: ownership.location_id,
      created_at: ownership.created_at,
    }
  }
}


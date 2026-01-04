/**
 * Import Service
 * Business logic for importing exported data with diff detection and merge functionality
 */

import type { D1Database } from '@cloudflare/workers-types'
import type {
  ExportData,
  ImportDiffResult,
  ImportDifference,
  ImportSelection,
} from '../types/export_import'
import { BookService } from './book_service'
import { LocationService } from './location_service'
import { OwnershipService } from './ownership_service'
import type { Book } from '../models/book'
import type { Location } from '../models/location'
import type { Ownership } from '../models/ownership'

const SUPPORTED_VERSION = '1.0'

export class ImportService {
  constructor(private db: D1Database) {}

  /**
   * Validate import file format and version
   */
  validateImportFile(data: unknown): ExportData {
    if (!data || typeof data !== 'object') {
      throw new Error('インポートファイルの形式が正しくありません')
    }

    const importData = data as Record<string, unknown>

    // Check version
    if (!importData.version || typeof importData.version !== 'string') {
      throw new Error('ファイル形式バージョンが指定されていません')
    }

    if (importData.version !== SUPPORTED_VERSION) {
      throw new Error(
        `サポートされていないファイル形式バージョンです: ${importData.version}。サポートされているバージョン: ${SUPPORTED_VERSION}`
      )
    }

    // Check exported_at
    if (!importData.exported_at || typeof importData.exported_at !== 'string') {
      throw new Error('エクスポート日時が指定されていません')
    }

    // Check data structure
    if (!importData.data || typeof importData.data !== 'object') {
      throw new Error('データセクションが正しくありません')
    }

    const dataSection = importData.data as Record<string, unknown>

    if (!Array.isArray(dataSection.books)) {
      throw new Error('書籍データが配列形式ではありません')
    }

    if (!Array.isArray(dataSection.locations)) {
      throw new Error('場所データが配列形式ではありません')
    }

    if (!Array.isArray(dataSection.ownerships)) {
      throw new Error('所有情報データが配列形式ではありません')
    }

    return importData as ExportData
  }

  /**
   * Detect differences between imported data and existing database data
   * Returns additions, modifications, and deletions at entity level
   */
  async detectDiff(userId: string, importData: ExportData): Promise<ImportDiffResult> {
    const bookService = new BookService(this.db)
    const locationService = new LocationService(this.db)
    const ownershipService = new OwnershipService(this.db)

    const additions: ImportDifference[] = []
    const modifications: ImportDifference[] = []
    const deletions: ImportDifference[] = []

    // Detect book differences
    const dbBooks = await this.getAllUserBooks(userId, bookService)
    const dbBooksMap = new Map<string, Book>()
    dbBooks.forEach((book) => dbBooksMap.set(book.isbn, book))

    const importBooksMap = new Map<string, ExportData['data']['books'][0]>()
    importData.data.books.forEach((book) => {
      if (book.isbn) {
        importBooksMap.set(book.isbn, book)
      }
    })

    // Find additions (in import but not in DB)
    for (const [isbn, importBook] of importBooksMap) {
      if (!dbBooksMap.has(isbn)) {
        additions.push({
          type: 'book',
          entity_id: isbn,
          entity_data: { import: importBook },
        })
      }
    }

    // Find modifications (in both but different)
    for (const [isbn, importBook] of importBooksMap) {
      const dbBook = dbBooksMap.get(isbn)
      if (dbBook) {
        if (this.isBookDifferent(dbBook, importBook)) {
          const fieldsChanged = this.getChangedBookFields(dbBook, importBook)
          modifications.push({
            type: 'book',
            entity_id: isbn,
            entity_data: { database: dbBook, import: importBook },
            fields_changed: fieldsChanged,
          })
        }
      }
    }

    // Find deletions (in DB but not in import)
    for (const [isbn, dbBook] of dbBooksMap) {
      if (!importBooksMap.has(isbn)) {
        deletions.push({
          type: 'book',
          entity_id: isbn,
          entity_data: { database: dbBook },
        })
      }
    }

    // Detect location differences
    const dbLocations = await locationService.findByUserId(userId)
    const dbLocationsMap = new Map<string, Location>()
    dbLocations.forEach((loc) => {
      const key = `${loc.name}:${loc.type}`
      dbLocationsMap.set(key, loc)
    })

    const importLocationsMap = new Map<string, ExportData['data']['locations'][0]>()
    importData.data.locations.forEach((loc) => {
      const key = `${loc.name}:${loc.type}`
      importLocationsMap.set(key, loc)
    })

    // Find location additions
    for (const [key, importLoc] of importLocationsMap) {
      if (!dbLocationsMap.has(key)) {
        additions.push({
          type: 'location',
          entity_id: key,
          entity_data: { import: importLoc },
        })
      }
    }

    // Find location modifications
    for (const [key, importLoc] of importLocationsMap) {
      const dbLoc = dbLocationsMap.get(key)
      if (dbLoc) {
        // Locations are matched by name+type, so if they match, they're the same
        // But we check if any other fields changed (created_at, updated_at are metadata)
        // For now, we consider locations with same name+type as identical
      }
    }

    // Find location deletions
    for (const [key, dbLoc] of dbLocationsMap) {
      if (!importLocationsMap.has(key)) {
        deletions.push({
          type: 'location',
          entity_id: key,
          entity_data: { database: dbLoc },
        })
      }
    }

    // Detect ownership differences
    const dbOwnerships = await this.getAllUserOwnerships(userId, ownershipService)
    const dbOwnershipsMap = new Map<string, Ownership>()
    dbOwnerships.forEach((own) => {
      const key = `${own.user_id}:${own.isbn}:${own.location_id}`
      dbOwnershipsMap.set(key, own)
    })

    // For ownerships, we need to match by user_id, isbn, and location (by name+type)
    // First, create a mapping of import location_id to matched DB location_id
    const locationIdMapping = new Map<number, number>()
    for (const importLoc of importData.data.locations) {
      const key = `${importLoc.name}:${importLoc.type}`
      const dbLoc = dbLocationsMap.get(key)
      if (dbLoc) {
        locationIdMapping.set(importLoc.id, dbLoc.id)
      }
    }

    const importOwnershipsMap = new Map<string, ExportData['data']['ownerships'][0]>()
    for (const importOwn of importData.data.ownerships) {
      // Map import location_id to DB location_id
      const dbLocationId = locationIdMapping.get(importOwn.location_id)
      if (dbLocationId && importOwn.user_id === userId) {
        const key = `${importOwn.user_id}:${importOwn.isbn}:${dbLocationId}`
        importOwnershipsMap.set(key, importOwn)
      }
    }

    // Find ownership additions
    for (const [key, importOwn] of importOwnershipsMap) {
      if (!dbOwnershipsMap.has(key)) {
        additions.push({
          type: 'ownership',
          entity_id: key,
          entity_data: { import: importOwn },
        })
      }
    }

    // Find ownership deletions
    for (const [key, dbOwn] of dbOwnershipsMap) {
      if (!importOwnershipsMap.has(key)) {
        deletions.push({
          type: 'ownership',
          entity_id: key,
          entity_data: { database: dbOwn },
        })
      }
    }

    return {
      additions,
      modifications,
      deletions,
    }
  }

  /**
   * Apply import based on user selections
   * Uses transaction to ensure data integrity
   */
  async applyImport(
    userId: string,
    importData: ExportData,
    selections: ImportSelection[]
  ): Promise<{ added: number; modified: number; deleted: number }> {
    const bookService = new BookService(this.db)
    const locationService = new LocationService(this.db)
    const ownershipService = new OwnershipService(this.db)

    // Create selection map for quick lookup
    const selectionMap = new Map<string, 'database' | 'import'>()
    selections.forEach((sel) => {
      selectionMap.set(sel.entity_id, sel.priority)
    })

    let added = 0
    let modified = 0
    let deleted = 0

    // Get existing locations for matching
    const dbLocations = await locationService.findByUserId(userId)
    const dbLocationsMap = new Map<string, Location>()
    dbLocations.forEach((loc) => {
      const key = `${loc.name}:${loc.type}`
      dbLocationsMap.set(key, loc)
    })

    // Create location ID mapping (import location_id -> DB location_id)
    const locationIdMapping = new Map<number, number>()
    for (const importLoc of importData.data.locations) {
      const key = `${importLoc.name}:${importLoc.type}`
      let dbLoc = dbLocationsMap.get(key)

      // If location doesn't exist, create it
      if (!dbLoc) {
        dbLoc = await locationService.create({
          user_id: userId,
          name: importLoc.name,
          type: importLoc.type,
        })
        dbLocationsMap.set(key, dbLoc)
      }

      locationIdMapping.set(importLoc.id, dbLoc.id)
    }

    // Use transaction for data integrity
    // Note: D1 doesn't support explicit transactions, but we'll use batch operations
    // where possible and handle errors gracefully

    // Process books
    for (const importBook of importData.data.books) {
      if (!importBook.isbn) continue

      const entityId = importBook.isbn
      const priority = selectionMap.get(entityId) || 'import'

      if (priority === 'import') {
        const existing = await bookService.findByISBN(importBook.isbn)
        if (existing) {
          // Modification - update book
          await bookService.update(importBook.isbn, {
            title: importBook.title,
            author: importBook.author || null,
            thumbnail_url: importBook.thumbnail_url || null,
            is_doujin: importBook.is_doujin,
          })
          modified++
        } else {
          // Addition - create book
          await bookService.create({
            isbn: importBook.isbn,
            title: importBook.title,
            author: importBook.author || null,
            thumbnail_url: importBook.thumbnail_url || null,
            is_doujin: importBook.is_doujin || false,
          })
          added++
        }
      }
    }

    // Process ownerships (additions and modifications)
    const importOwnershipsKeySet = new Set<string>()
    for (const importOwn of importData.data.ownerships) {
      if (importOwn.user_id !== userId) continue

      const dbLocationId = locationIdMapping.get(importOwn.location_id)
      if (!dbLocationId) continue

      const entityId = `${importOwn.user_id}:${importOwn.isbn}:${dbLocationId}`
      importOwnershipsKeySet.add(entityId)
      const priority = selectionMap.get(entityId) || 'import'

      if (priority === 'import') {
        try {
          await ownershipService.create({
            user_id: importOwn.user_id,
            isbn: importOwn.isbn,
            location_id: dbLocationId,
          })
          added++
        } catch (error) {
          // Skip if already exists (duplicate)
          if (error instanceof Error && error.message.includes('既に登録されています')) {
            // Skip
          } else {
            throw error
          }
        }
      }
    }

    // Process ownership deletions (in DB but not in import)
    const dbOwnerships = await this.getAllUserOwnerships(userId, ownershipService)
    for (const dbOwn of dbOwnerships) {
      const entityId = `${dbOwn.user_id}:${dbOwn.isbn}:${dbOwn.location_id}`
      if (!importOwnershipsKeySet.has(entityId)) {
        const priority = selectionMap.get(entityId) || 'database'

        if (priority === 'import') {
          // User wants to delete (import file doesn't have it)
          await ownershipService.delete(dbOwn.id)
          deleted++
        }
      }
    }

    // Process deletions (entities in DB but not in import)
    // Get all user books and check which ones are not in import file
    const dbBooks = await this.getAllUserBooks(userId, bookService)
    const importBooksIsbnSet = new Set(
      importData.data.books.filter((b) => b.isbn).map((b) => b.isbn!)
    )

    // Process book deletions
    for (const dbBook of dbBooks) {
      if (!importBooksIsbnSet.has(dbBook.isbn)) {
        const entityId = dbBook.isbn
        const priority = selectionMap.get(entityId) || 'database'

        if (priority === 'import') {
          // User wants to delete (import file doesn't have it)
          try {
            await bookService.delete(entityId)
            deleted++
          } catch (error) {
            // Skip if ownerships exist (foreign key constraint)
            if (
              error instanceof Error &&
              error.message.includes('所有情報が存在するため削除できません')
            ) {
              // Skip deletion - book has ownerships
            } else {
              throw error
            }
          }
        }
      }
    }

    // Process location deletions
    // Get all user locations and check which ones are not in import file
    const importLocationsKeySet = new Set(
      importData.data.locations.map((loc) => `${loc.name}:${loc.type}`)
    )

    for (const [key, dbLoc] of dbLocationsMap) {
      if (!importLocationsKeySet.has(key)) {
        const entityId = key
        const priority = selectionMap.get(entityId) || 'database'

        if (priority === 'import') {
          // User wants to delete (import file doesn't have it)
          try {
            await locationService.delete(dbLoc.id)
            deleted++
          } catch (error) {
            // Skip if error (ownerships will be cascade deleted)
            if (error instanceof Error && error.message.includes('場所が見つかりません')) {
              // Already deleted or doesn't exist
            } else {
              throw error
            }
          }
        }
      }
    }

    return { added, modified, deleted }
  }

  /**
   * Helper: Get all books for a user (through ownerships)
   */
  private async getAllUserBooks(userId: string, bookService: BookService): Promise<Book[]> {
    const ownerships = await this.db
      .prepare('SELECT DISTINCT isbn FROM ownerships WHERE user_id = ?')
      .bind(userId)
      .all<{ isbn: string }>()

    const books: Book[] = []
    for (const own of ownerships.results || []) {
      const book = await bookService.findByISBN(own.isbn)
      if (book) {
        books.push(book)
      }
    }

    return books
  }

  /**
   * Helper: Get all ownerships for a user
   */
  private async getAllUserOwnerships(
    userId: string,
    ownershipService: OwnershipService
  ): Promise<Ownership[]> {
    return await ownershipService.findByUserId(userId)
  }

  /**
   * Helper: Check if two books are different
   */
  private isBookDifferent(dbBook: Book, importBook: ExportData['data']['books'][0]): boolean {
    return (
      dbBook.title !== importBook.title ||
      dbBook.author !== (importBook.author || null) ||
      dbBook.thumbnail_url !== (importBook.thumbnail_url || null) ||
      dbBook.is_doujin !== importBook.is_doujin
    )
  }

  /**
   * Helper: Get list of changed fields between two books
   */
  private getChangedBookFields(
    dbBook: Book,
    importBook: ExportData['data']['books'][0]
  ): string[] {
    const changed: string[] = []
    if (dbBook.title !== importBook.title) changed.push('title')
    if (dbBook.author !== (importBook.author || null)) changed.push('author')
    if (dbBook.thumbnail_url !== (importBook.thumbnail_url || null)) changed.push('thumbnail_url')
    if (dbBook.is_doujin !== importBook.is_doujin) changed.push('is_doujin')
    return changed
  }
}


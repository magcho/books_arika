/**
 * Export/Import test fixtures
 * Mock export/import data factories for backend testing
 */

import type { ExportData, ExportBook, ExportLocation, ExportOwnership } from '../../src/types/export_import'

/**
 * Create a mock export book
 */
export function createMockExportBook(overrides?: Partial<ExportBook>): ExportBook {
  const now = new Date().toISOString()
  return {
    isbn: '9784123456789',
    title: 'Test Book',
    author: 'Test Author',
    thumbnail_url: 'https://example.com/thumbnail.jpg',
    is_doujin: false,
    created_at: now,
    updated_at: now,
    ...overrides,
  }
}

/**
 * Create a mock export location
 */
export function createMockExportLocation(overrides?: Partial<ExportLocation>): ExportLocation {
  const now = new Date().toISOString()
  return {
    id: 1,
    name: '自宅本棚',
    type: 'Physical',
    created_at: now,
    updated_at: now,
    ...overrides,
  }
}

/**
 * Create a mock export ownership
 */
export function createMockExportOwnership(overrides?: Partial<ExportOwnership>): ExportOwnership {
  const now = new Date().toISOString()
  return {
    user_id: 'default-user',
    isbn: '9784123456789',
    location_id: 1,
    created_at: now,
    ...overrides,
  }
}

/**
 * Create a mock export data
 */
export function createMockExportData(overrides?: Partial<ExportData>): ExportData {
  const now = new Date().toISOString()
  return {
    version: '1.0',
    exported_at: now,
    data: {
      books: [createMockExportBook()],
      locations: [createMockExportLocation()],
      ownerships: [createMockExportOwnership()],
    },
    ...overrides,
  }
}

/**
 * Create export data with differences (for testing diff detection)
 * 
 * Returns a pair of ExportData objects:
 * - `existing`: Simulates data currently in the database
 * - `import`: Simulates data in the import file
 * 
 * The import data includes:
 * - Additions: New book and location not in existing data
 * - Modifications: Book with changed title and author
 * - Deletions: Book and location removed from import file
 * 
 * This structure allows testing the diff detection logic that compares
 * existing database state with imported data.
 */
export function createMockExportDataWithDifferences(): {
  existing: ExportData
  import: ExportData
} {
  const now = new Date().toISOString()

  // Existing data in database
  const existing: ExportData = {
    version: '1.0',
    exported_at: now,
    data: {
      books: [
        createMockExportBook({
          isbn: '9784123456789',
          title: 'Original Title',
          author: 'Original Author',
        }),
        createMockExportBook({
          isbn: '9784987654321',
          title: 'Book to be Deleted',
        }),
      ],
      locations: [
        createMockExportLocation({
          id: 1,
          name: '自宅本棚',
          type: 'Physical',
        }),
        createMockExportLocation({
          id: 2,
          name: 'Kindle',
          type: 'Digital',
        }),
      ],
      ownerships: [
        createMockExportOwnership({
          user_id: 'default-user',
          isbn: '9784123456789',
          location_id: 1,
        }),
        createMockExportOwnership({
          user_id: 'default-user',
          isbn: '9784987654321',
          location_id: 1,
        }),
      ],
    },
  }

  // Import data with differences
  const importData: ExportData = {
    version: '1.0',
    exported_at: now,
    data: {
      books: [
        // Modified book
        createMockExportBook({
          isbn: '9784123456789',
          title: 'Modified Title',
          author: 'Modified Author',
        }),
        // New book
        createMockExportBook({
          isbn: '9784111111111',
          title: 'New Book',
          author: 'New Author',
        }),
        // Book to be deleted (9784987654321) is not in import
      ],
      locations: [
        // Existing location
        createMockExportLocation({
          id: 1,
          name: '自宅本棚',
          type: 'Physical',
        }),
        // New location
        createMockExportLocation({
          id: 3,
          name: 'オフィス',
          type: 'Physical',
        }),
        // Location to be deleted (Kindle) is not in import
      ],
      ownerships: [
        // Modified ownership (different location)
        createMockExportOwnership({
          user_id: 'default-user',
          isbn: '9784123456789',
          location_id: 3, // Changed from 1 to 3
        }),
        // New ownership
        createMockExportOwnership({
          user_id: 'default-user',
          isbn: '9784111111111',
          location_id: 3,
        }),
        // Ownership to be deleted (9784987654321) is not in import
      ],
    },
  }

  return { existing, import: importData }
}


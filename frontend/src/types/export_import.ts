/**
 * Export/Import Type Definitions
 * Types for data export and import functionality (frontend)
 */

export interface ExportData {
  version: string
  exported_at: string
  data: {
    books: ExportBook[]
    locations: ExportLocation[]
    ownerships: ExportOwnership[]
  }
}

export interface ExportBook {
  isbn: string | null
  title: string
  author: string | null
  thumbnail_url: string | null
  is_doujin: boolean
  created_at: string
  updated_at: string
}

export interface ExportLocation {
  id: number
  name: string
  type: 'Physical' | 'Digital'
  created_at: string
  updated_at: string
}

export interface ExportOwnership {
  user_id: string
  isbn: string
  location_id: number
  created_at: string
}

export interface ImportDiffResult {
  additions: ImportDifference[]
  modifications: ImportDifference[]
  deletions: ImportDifference[]
}

// Use discriminated union for type safety
export type ImportDifference =
  | {
      type: 'book'
      entity_id: string
      entity_data: {
        database?: ExportBook
        import?: ExportBook
      }
      fields_changed?: string[]
    }
  | {
      type: 'location'
      entity_id: string
      entity_data: {
        database?: ExportLocation
        import?: ExportLocation
      }
      fields_changed?: string[]
    }
  | {
      type: 'ownership'
      entity_id: string
      entity_data: {
        database?: ExportOwnership
        import?: ExportOwnership
      }
      fields_changed?: string[]
    }

export interface ImportSelection {
  entity_id: string
  priority: 'database' | 'import'
}

export interface ImportApplyRequest {
  import_data: ExportData
  selections: ImportSelection[]
}


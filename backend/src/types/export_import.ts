/**
 * Export/Import Type Definitions
 * Types for data export and import functionality
 */

import type { Book } from '../models/book'
import type { Location } from '../models/location'
import type { Ownership } from '../models/ownership'

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

export interface ImportDifference {
  type: 'book' | 'location' | 'ownership'
  entity_id: string
  entity_data: {
    database?: ExportBook | ExportLocation | ExportOwnership | Book | Location | Ownership
    import?: ExportBook | ExportLocation | ExportOwnership
  }
  fields_changed?: string[]
}

export interface ImportSelection {
  entity_id: string
  priority: 'database' | 'import'
}

export interface ImportApplyRequest {
  selections: ImportSelection[]
}


/**
 * Import API service
 * Handles data import API calls
 */

import { post } from './api'
import type {
  ExportData,
  ImportDiffResult,
  ImportSelection,
  ImportApplyRequest,
} from '../types/export_import'

/**
 * Detect differences between imported data and existing database
 */
export async function detectDiff(
  userId: string,
  importData: ExportData
): Promise<ImportDiffResult> {
  return post<ImportDiffResult>(`/import?user_id=${userId}`, importData)
}

/**
 * Apply import based on user selections
 */
export async function applyImport(
  userId: string,
  importData: ExportData,
  selections: ImportSelection[]
): Promise<{ message: string; stats: { added: number; modified: number; deleted: number } }> {
  return post<{ message: string; stats: { added: number; modified: number; deleted: number } }>(
    `/import/apply?user_id=${userId}`,
    {
      import_data: importData,
      selections,
    }
  )
}


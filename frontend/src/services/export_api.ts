/**
 * Export API Client
 * Functions for interacting with the export backend API
 */

import { get, ApiClientError } from './api'
import type { ExportData } from '../types/export_import'

/**
 * Export user data to JSON file
 * Downloads the file directly to the user's device
 */
export async function exportUserData(userId: string): Promise<void> {
  try {
    // Get the export data
    const exportData = await get<ExportData>(`/export?user_id=${encodeURIComponent(userId)}`)

    // Create a blob and download it
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `books_export_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (err) {
    if (err instanceof ApiClientError) {
      throw err
    }
    throw new ApiClientError('エクスポートに失敗しました', 'EXPORT_ERROR')
  }
}


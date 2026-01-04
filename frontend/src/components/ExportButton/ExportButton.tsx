/**
 * Export Button Component
 * Button to export user data to JSON file
 */

import { useState } from 'react'
import { exportUserData } from '../../services/export_api'
import { ApiClientError } from '../../services/api'

interface ExportButtonProps {
  userId: string
  onSuccess?: () => void
}

export function ExportButton({ userId, onSuccess }: ExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async () => {
    setError(null)
    setIsLoading(true)

    try {
      await exportUserData(userId)
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(`エラー: ${err.message}`)
      } else if (err instanceof Error) {
        setError(`エラー: ${err.message}`)
      } else {
        setError('エクスポートに失敗しました')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleExport}
        disabled={isLoading}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#007bff',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.6 : 1,
        }}
      >
        {isLoading ? 'エクスポート中...' : 'データをエクスポート'}
      </button>
      {error && (
        <div
          style={{
            marginTop: '0.5rem',
            padding: '0.5rem',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            borderRadius: '4px',
            fontSize: '0.875rem',
          }}
        >
          {error}
        </div>
      )}
    </div>
  )
}


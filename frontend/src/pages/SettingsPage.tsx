/**
 * Settings Page
 * Main page for application settings including export/import functionality
 */

import { useState } from 'react'
import { ExportButton } from '../components/ExportButton/ExportButton'
import { ImportDialog } from '../components/ImportDialog/ImportDialog'
import { DEFAULT_USER_ID } from '../config/constants'

export function SettingsPage() {
  const [showImportDialog, setShowImportDialog] = useState(false)

  const handleExportSuccess = () => {
    alert('データのエクスポートが完了しました！')
  }

  const handleImportSuccess = () => {
    setShowImportDialog(false)
    alert('データのインポートが完了しました！')
    // Optionally refresh the page or reload data
    window.location.reload()
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h1>設定</h1>

      <section style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#fff', borderRadius: '4px' }}>
        <h2>データのエクスポート・インポート</h2>
        <p style={{ marginBottom: '1rem', color: '#666' }}>
          書籍管理データをJSON形式でエクスポートまたはインポートできます。
        </p>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <ExportButton userId={DEFAULT_USER_ID} onSuccess={handleExportSuccess} />
          <button
            onClick={() => setShowImportDialog(true)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#28a745',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            データをインポート
          </button>
        </div>
      </section>

      {showImportDialog && (
        <ImportDialog
          userId={DEFAULT_USER_ID}
          onClose={() => setShowImportDialog(false)}
          onSuccess={handleImportSuccess}
        />
      )}
    </div>
  )
}


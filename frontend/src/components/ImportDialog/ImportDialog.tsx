/**
 * Import Dialog Component
 * Handles data import with diff visualization and user selection
 */

import { useState, useCallback } from 'react'
import { detectDiff, applyImport } from '../../services/import_api'
import type {
  ExportData,
  ImportDiffResult,
  ImportDifference,
  ImportSelection,
} from '../../types/export_import'
import { ApiClientError } from '../../services/api'

interface ImportDialogProps {
  userId: string
  onClose: () => void
  onSuccess?: () => void
}

export function ImportDialog({ userId, onClose, onSuccess }: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [importData, setImportData] = useState<ExportData | null>(null)
  const [diffResult, setDiffResult] = useState<ImportDiffResult | null>(null)
  const [selections, setSelections] = useState<Map<string, 'database' | 'import'>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0]
      if (!selectedFile) return

      setFile(selectedFile)
      setError(null)
      setIsLoading(true)

      try {
        const text = await selectedFile.text()
        const data = JSON.parse(text) as ExportData
        setImportData(data)

        // Detect differences
        const diff = await detectDiff(userId, data)
        setDiffResult(diff)

        // Initialize selections: default to 'import' for additions, 'database' for others
        const initialSelections = new Map<string, 'database' | 'import'>()
        diff.additions.forEach((diff) => {
          initialSelections.set(diff.entity_id, 'import')
        })
        diff.modifications.forEach((diff) => {
          initialSelections.set(diff.entity_id, 'database') // Default to keep database
        })
        diff.deletions.forEach((diff) => {
          initialSelections.set(diff.entity_id, 'database') // Default to keep database (no deletion)
        })
        setSelections(initialSelections)
      } catch (err) {
        if (err instanceof ApiClientError) {
          setError(`エラー: ${err.message}`)
        } else if (err instanceof SyntaxError) {
          setError('JSONファイルの形式が正しくありません')
        } else {
          setError('ファイルの読み込みに失敗しました')
        }
        setFile(null)
        setImportData(null)
        setDiffResult(null)
      } finally {
        setIsLoading(false)
      }
    },
    [userId]
  )

  const handleSelectionChange = useCallback((entityId: string, priority: 'database' | 'import') => {
    setSelections((prev) => {
      const next = new Map(prev)
      next.set(entityId, priority)
      return next
    })
  }, [])

  const handleBulkSelection = useCallback(
    (type: 'additions' | 'modifications' | 'deletions', priority: 'database' | 'import') => {
      if (!diffResult) return

      const diffs = diffResult[type]
      setSelections((prev) => {
        const next = new Map(prev)
        diffs.forEach((diff) => {
          next.set(diff.entity_id, priority)
        })
        return next
      })
    },
    [diffResult]
  )

  const handleApply = useCallback(async () => {
    if (!importData || !diffResult) return

    setIsApplying(true)
    setError(null)

    try {
      const selectionsArray: ImportSelection[] = Array.from(selections.entries()).map(
        ([entity_id, priority]) => ({
          entity_id,
          priority,
        })
      )

      await applyImport(userId, importData, selectionsArray)
      onSuccess?.()
      onClose()
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(`インポートエラー: ${err.message}`)
      } else {
        setError('インポートの適用に失敗しました')
      }
    } finally {
      setIsApplying(false)
    }
  }, [importData, diffResult, selections, userId, onClose, onSuccess])

  const hasNoDifferences = diffResult && 
    diffResult.additions.length === 0 &&
    diffResult.modifications.length === 0 &&
    diffResult.deletions.length === 0

  return (
    <div className="import-dialog">
      <div className="import-dialog-header">
        <h2>データインポート</h2>
        <button onClick={onClose} className="close-button">
          ×
        </button>
      </div>

      <div className="import-dialog-content">
        {!diffResult && (
          <div className="file-select-section">
            <label htmlFor="import-file">インポートファイルを選択:</label>
            <input
              id="import-file"
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              disabled={isLoading}
            />
            {isLoading && <p>読み込み中...</p>}
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        {hasNoDifferences && (
          <div className="no-differences-message">
            <p>データに変更はありません</p>
            <button onClick={onClose}>閉じる</button>
          </div>
        )}

        {diffResult && !hasNoDifferences && (
          <div className="diff-visualization">
            <h3>差分の確認</h3>

            {/* Bulk selection buttons */}
            <div className="bulk-selection">
              <button
                onClick={() => handleBulkSelection('additions', 'import')}
                className="bulk-button"
              >
                すべての追加をインポート
              </button>
              <button
                onClick={() => handleBulkSelection('modifications', 'import')}
                className="bulk-button"
              >
                すべての変更をインポート
              </button>
              <button
                onClick={() => handleBulkSelection('deletions', 'database')}
                className="bulk-button"
              >
                すべての削除をキャンセル
              </button>
            </div>

            {/* Additions */}
            {diffResult.additions.length > 0 && (
              <div className="diff-section">
                <h4>追加される項目 ({diffResult.additions.length})</h4>
                {diffResult.additions.map((diff) => (
                  <DiffItem
                    key={diff.entity_id}
                    diff={diff}
                    selection={selections.get(diff.entity_id) || 'import'}
                    onSelectionChange={handleSelectionChange}
                  />
                ))}
              </div>
            )}

            {/* Modifications */}
            {diffResult.modifications.length > 0 && (
              <div className="diff-section">
                <h4>変更される項目 ({diffResult.modifications.length})</h4>
                {diffResult.modifications.map((diff) => (
                  <DiffItem
                    key={diff.entity_id}
                    diff={diff}
                    selection={selections.get(diff.entity_id) || 'database'}
                    onSelectionChange={handleSelectionChange}
                  />
                ))}
              </div>
            )}

            {/* Deletions */}
            {diffResult.deletions.length > 0 && (
              <div className="diff-section">
                <h4>削除される項目 ({diffResult.deletions.length})</h4>
                {diffResult.deletions.map((diff) => (
                  <DiffItem
                    key={diff.entity_id}
                    diff={diff}
                    selection={selections.get(diff.entity_id) || 'database'}
                    onSelectionChange={handleSelectionChange}
                  />
                ))}
              </div>
            )}

            <div className="import-actions">
              <button onClick={onClose} disabled={isApplying}>
                キャンセル
              </button>
              <button onClick={handleApply} disabled={isApplying} className="primary-button">
                {isApplying ? '適用中...' : 'インポートを実行'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface DiffItemProps {
  diff: ImportDifference
  selection: 'database' | 'import'
  onSelectionChange: (entityId: string, priority: 'database' | 'import') => void
}

function DiffItem({ diff, selection, onSelectionChange }: DiffItemProps) {
  const getEntityLabel = () => {
    switch (diff.type) {
      case 'book':
        const book = diff.entity_data.import || diff.entity_data.database
        return book && 'title' in book ? book.title : diff.entity_id
      case 'location':
        const loc = diff.entity_data.import || diff.entity_data.database
        return loc && 'name' in loc ? `${loc.name} (${loc.type})` : diff.entity_id
      case 'ownership':
        return `所有情報: ${diff.entity_id}`
      default:
        return diff.entity_id
    }
  }

  const renderDiffValues = () => {
    if (diff.type === 'modification' && diff.entity_data.database && diff.entity_data.import) {
      const dbData = diff.entity_data.database
      const importData = diff.entity_data.import

      if (diff.type === 'book' && 'title' in dbData && 'title' in importData) {
        return (
          <div className="diff-values">
            <div className="diff-value-database">
              <strong>データベース:</strong>
              <div>タイトル: {dbData.title}</div>
              <div>著者: {('author' in dbData ? dbData.author : null) || '(なし)'}</div>
              <div>同人誌: {('is_doujin' in dbData ? dbData.is_doujin : false) ? 'はい' : 'いいえ'}</div>
            </div>
            <div className="diff-value-import">
              <strong>インポートファイル:</strong>
              <div>タイトル: {importData.title}</div>
              <div>著者: {('author' in importData ? importData.author : null) || '(なし)'}</div>
              <div>同人誌: {('is_doujin' in importData ? importData.is_doujin : false) ? 'はい' : 'いいえ'}</div>
            </div>
          </div>
        )
      }
    }
    return null
  }

  return (
    <div className="diff-item">
      <div className="diff-item-header">
        <span className="diff-item-label">{getEntityLabel()}</span>
        <div className="diff-item-selection">
          <label>
            <input
              type="radio"
              name={`diff-${diff.entity_id}`}
              value="database"
              checked={selection === 'database'}
              onChange={() => onSelectionChange(diff.entity_id, 'database')}
            />
            データベースを優先
          </label>
          <label>
            <input
              type="radio"
              name={`diff-${diff.entity_id}`}
              value="import"
              checked={selection === 'import'}
              onChange={() => onSelectionChange(diff.entity_id, 'import')}
            />
            インポートファイルを優先
          </label>
        </div>
      </div>
      {diff.fields_changed && diff.fields_changed.length > 0 && (
        <div className="diff-item-fields">
          変更されたフィールド: {diff.fields_changed.join(', ')}
        </div>
      )}
      {renderDiffValues()}
    </div>
  )
}


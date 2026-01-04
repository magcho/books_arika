/**
 * Export/Import flow integration tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { ImportDialog } from '../../src/components/ImportDialog/ImportDialog'
import { detectDiff, applyImport } from '../../src/services/import_api'
import type { ImportDiffResult } from '../../src/types/export_import'

// Mock the API functions
vi.mock('../../src/services/import_api', () => ({
  detectDiff: vi.fn(),
  applyImport: vi.fn(),
}))

describe('Export/Import Flow', () => {
  const mockUserId = 'test-user'
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should complete full import flow with differences', async () => {
    // Step 1: Mock diff detection with differences
    const mockDiffResult: ImportDiffResult = {
      additions: [
        {
          type: 'book',
          entity_id: '9784111111111',
          entity_data: {
            import: {
              isbn: '9784111111111',
              title: 'New Book',
              author: 'New Author',
              thumbnail_url: null,
              is_doujin: false,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            },
          },
        },
      ],
      modifications: [
        {
          type: 'book',
          entity_id: '9784123456789',
          entity_data: {
            database: {
              isbn: '9784123456789',
              title: 'Original Title',
              author: 'Original Author',
              thumbnail_url: null,
              is_doujin: false,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            },
            import: {
              isbn: '9784123456789',
              title: 'Modified Title',
              author: 'Modified Author',
              thumbnail_url: null,
              is_doujin: false,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            },
          },
          fields_changed: ['title', 'author'],
        },
      ],
      deletions: [
        {
          type: 'book',
          entity_id: '9784987654321',
          entity_data: {
            database: {
              isbn: '9784987654321',
              title: 'Book to Delete',
              author: null,
              thumbnail_url: null,
              is_doujin: false,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            },
          },
        },
      ],
    }

    vi.mocked(detectDiff).mockResolvedValue(mockDiffResult)
    vi.mocked(applyImport).mockResolvedValue({
      message: 'インポートが完了しました',
      stats: { added: 1, modified: 1, deleted: 0 },
    })

    // Step 2: Render component and upload file
    const file = new File(
      [
        JSON.stringify({
          version: '1.0',
          exported_at: '2024-01-01T00:00:00Z',
          data: {
            books: [
              {
                isbn: '9784111111111',
                title: 'New Book',
                author: 'New Author',
                thumbnail_url: null,
                is_doujin: false,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
              },
              {
                isbn: '9784123456789',
                title: 'Modified Title',
                author: 'Modified Author',
                thumbnail_url: null,
                is_doujin: false,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
              },
            ],
            locations: [],
            ownerships: [],
          },
        }),
      ],
      'export.json',
      { type: 'application/json' }
    )

    render(<ImportDialog userId={mockUserId} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

    const input = screen.getByLabelText(/インポートファイルを選択/i)
    fireEvent.change(input, { target: { files: [file] } })

    // Step 3: Wait for diff detection
    await waitFor(() => {
      expect(detectDiff).toHaveBeenCalledWith(mockUserId, expect.any(Object))
      expect(screen.getByText(/追加される項目/i)).toBeInTheDocument()
      expect(screen.getByText(/変更される項目/i)).toBeInTheDocument()
      expect(screen.getByText(/削除される項目/i)).toBeInTheDocument()
    })

    // Step 4: Verify differences are displayed
    expect(screen.getByText('New Book')).toBeInTheDocument()
    expect(screen.getByText(/変更されたフィールド/i)).toBeInTheDocument()

    // Step 5: User selects priorities (defaults are already set, but we can change them)
    const importRadios = screen.getAllByLabelText(/インポートファイルを優先/i)
    if (importRadios.length > 0) {
      fireEvent.click(importRadios[0])
    }

    // Step 6: Apply import
    const applyButton = screen.getByText(/インポートを実行/i)
    fireEvent.click(applyButton)

    // Step 7: Verify import was applied
    await waitFor(() => {
      expect(applyImport).toHaveBeenCalledWith(
        mockUserId,
        expect.any(Object),
        expect.arrayContaining([
          expect.objectContaining({
            entity_id: expect.any(String),
            priority: expect.any(String),
          }),
        ])
      )
      expect(mockOnSuccess).toHaveBeenCalled()
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('should handle import flow with no differences', async () => {
    const mockDiffResult: ImportDiffResult = {
      additions: [],
      modifications: [],
      deletions: [],
    }

    vi.mocked(detectDiff).mockResolvedValue(mockDiffResult)

    const file = new File(
      [
        JSON.stringify({
          version: '1.0',
          exported_at: '2024-01-01T00:00:00Z',
          data: { books: [], locations: [], ownerships: [] },
        }),
      ],
      'export.json',
      { type: 'application/json' }
    )

    render(<ImportDialog userId={mockUserId} onClose={mockOnClose} />)

    const input = screen.getByLabelText(/インポートファイルを選択/i)
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(detectDiff).toHaveBeenCalled()
      expect(screen.getByText(/データに変更はありません/i)).toBeInTheDocument()
    })

    // Should not call applyImport when there are no differences
    expect(applyImport).not.toHaveBeenCalled()
  })

  it('should handle bulk selection for all additions', async () => {
    const mockDiffResult: ImportDiffResult = {
      additions: [
        {
          type: 'book',
          entity_id: '9784111111111',
          entity_data: {
            import: {
              isbn: '9784111111111',
              title: 'New Book 1',
              author: null,
              thumbnail_url: null,
              is_doujin: false,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            },
          },
        },
        {
          type: 'book',
          entity_id: '9784222222222',
          entity_data: {
            import: {
              isbn: '9784222222222',
              title: 'New Book 2',
              author: null,
              thumbnail_url: null,
              is_doujin: false,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            },
          },
        },
      ],
      modifications: [],
      deletions: [],
    }

    vi.mocked(detectDiff).mockResolvedValue(mockDiffResult)
    vi.mocked(applyImport).mockResolvedValue({
      message: 'インポートが完了しました',
      stats: { added: 2, modified: 0, deleted: 0 },
    })

    const file = new File(
      [
        JSON.stringify({
          version: '1.0',
          exported_at: '2024-01-01T00:00:00Z',
          data: {
            books: [
              {
                isbn: '9784111111111',
                title: 'New Book 1',
                author: null,
                thumbnail_url: null,
                is_doujin: false,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
              },
              {
                isbn: '9784222222222',
                title: 'New Book 2',
                author: null,
                thumbnail_url: null,
                is_doujin: false,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
              },
            ],
            locations: [],
            ownerships: [],
          },
        }),
      ],
      'export.json',
      { type: 'application/json' }
    )

    render(<ImportDialog userId={mockUserId} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

    const input = screen.getByLabelText(/インポートファイルを選択/i)
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText(/すべての追加をインポート/i)).toBeInTheDocument()
    })

    // Click bulk selection button
    const bulkButton = screen.getByText(/すべての追加をインポート/i)
    fireEvent.click(bulkButton)

    // Apply import
    const applyButton = screen.getByText(/インポートを実行/i)
    fireEvent.click(applyButton)

    await waitFor(() => {
      expect(applyImport).toHaveBeenCalled()
      // Verify that both additions are selected for import
      const callArgs = vi.mocked(applyImport).mock.calls[0]
      const selections = callArgs[2] // Third argument is selections
      expect(selections.length).toBeGreaterThanOrEqual(2)
      expect(selections.some((s) => s.entity_id === '9784111111111' && s.priority === 'import')).toBe(
        true
      )
      expect(selections.some((s) => s.entity_id === '9784222222222' && s.priority === 'import')).toBe(
        true
      )
    })
  })

  it('should handle error during diff detection', async () => {
    vi.mocked(detectDiff).mockRejectedValue(new Error('差分検出エラー'))

    const file = new File(
      [
        JSON.stringify({
          version: '1.0',
          exported_at: '2024-01-01T00:00:00Z',
          data: { books: [], locations: [], ownerships: [] },
        }),
      ],
      'export.json',
      { type: 'application/json' }
    )

    render(<ImportDialog userId={mockUserId} onClose={mockOnClose} />)

    const input = screen.getByLabelText(/インポートファイルを選択/i)
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      // Error message should be displayed (could be "ファイルの読み込みに失敗しました" or "エラー:")
      const errorText = screen.queryByText(/ファイルの読み込みに失敗しました/i) ||
                        screen.queryByText(/エラー:/i) ||
                        screen.queryByText(/エラー/i)
      expect(errorText).toBeInTheDocument()
    })
  })

  it('should handle error during import application', async () => {
    const mockDiffResult: ImportDiffResult = {
      additions: [
        {
          type: 'book',
          entity_id: '9784111111111',
          entity_data: {
            import: {
              isbn: '9784111111111',
              title: 'New Book',
              author: null,
              thumbnail_url: null,
              is_doujin: false,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            },
          },
        },
      ],
      modifications: [],
      deletions: [],
    }

    vi.mocked(detectDiff).mockResolvedValue(mockDiffResult)
    vi.mocked(applyImport).mockRejectedValue(new Error('インポートエラー: データベースエラー'))

    const file = new File(
      [
        JSON.stringify({
          version: '1.0',
          exported_at: '2024-01-01T00:00:00Z',
          data: {
            books: [
              {
                isbn: '9784111111111',
                title: 'New Book',
                author: null,
                thumbnail_url: null,
                is_doujin: false,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
              },
            ],
            locations: [],
            ownerships: [],
          },
        }),
      ],
      'export.json',
      { type: 'application/json' }
    )

    render(<ImportDialog userId={mockUserId} onClose={mockOnClose} />)

    const input = screen.getByLabelText(/インポートファイルを選択/i)
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText(/インポートを実行/i)).toBeInTheDocument()
    })

    const applyButton = screen.getByText(/インポートを実行/i)
    fireEvent.click(applyButton)

    await waitFor(() => {
      // Error message should be displayed (could be "インポートエラー:" or "インポートの適用に失敗しました")
      const errorText = screen.queryByText(/インポートエラー:/i) ||
                        screen.queryByText(/インポートの適用に失敗しました/i) ||
                        screen.queryByText(/インポートエラー/i)
      expect(errorText).toBeInTheDocument()
    })

    // Should not call onSuccess or onClose on error
    expect(mockOnClose).not.toHaveBeenCalled()
  })
})


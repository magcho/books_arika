/**
 * ImportDialog component tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '../helpers/render'
import { ImportDialog } from '../../src/components/ImportDialog/ImportDialog'
import * as importApi from '../../src/services/import_api'
import type { ImportDiffResult } from '../../src/types/export_import'

// Mock import API
vi.mock('../../src/services/import_api', () => ({
  detectDiff: vi.fn(),
  applyImport: vi.fn(),
}))

describe('ImportDialog', () => {
  const mockUserId = 'test-user'
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render file input initially', () => {
    render(<ImportDialog userId={mockUserId} onClose={mockOnClose} />)

    expect(screen.getByLabelText(/インポートファイルを選択/i)).toBeInTheDocument()
  })

  it('should display loading state when file is being processed', async () => {
    vi.mocked(importApi.detectDiff).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    const file = new File(['{"version":"1.0","exported_at":"2024-01-01T00:00:00Z","data":{"books":[],"locations":[],"ownerships":[]}}'], 'export.json', {
      type: 'application/json',
    })

    render(<ImportDialog userId={mockUserId} onClose={mockOnClose} />)

    const input = screen.getByLabelText(/インポートファイルを選択/i)
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText('読み込み中...')).toBeInTheDocument()
    })
  })

  it('should display error when file is invalid', async () => {
    const file = new File(['invalid json'], 'export.json', {
      type: 'application/json',
    })

    render(<ImportDialog userId={mockUserId} onClose={mockOnClose} />)

    const input = screen.getByLabelText(/インポートファイルを選択/i)
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText(/JSONファイルの形式が正しくありません/i)).toBeInTheDocument()
    })
  })

  it('should display "no differences" message when there are no differences', async () => {
    const mockDiffResult: ImportDiffResult = {
      additions: [],
      modifications: [],
      deletions: [],
    }

    vi.mocked(importApi.detectDiff).mockResolvedValue(mockDiffResult)

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
      expect(screen.getByText(/データに変更はありません/i)).toBeInTheDocument()
    })
  })

  it('should display differences when import has additions', async () => {
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
      modifications: [],
      deletions: [],
    }

    vi.mocked(importApi.detectDiff).mockResolvedValue(mockDiffResult)

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
      expect(screen.getByText(/追加される項目/i)).toBeInTheDocument()
      expect(screen.getByText('New Book')).toBeInTheDocument()
    })
  })

  it('should display differences when import has modifications', async () => {
    const mockDiffResult: ImportDiffResult = {
      additions: [],
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
      deletions: [],
    }

    vi.mocked(importApi.detectDiff).mockResolvedValue(mockDiffResult)

    const file = new File(
      [
        JSON.stringify({
          version: '1.0',
          exported_at: '2024-01-01T00:00:00Z',
          data: {
            books: [
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

    render(<ImportDialog userId={mockUserId} onClose={mockOnClose} />)

    const input = screen.getByLabelText(/インポートファイルを選択/i)
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText(/変更される項目/i)).toBeInTheDocument()
      expect(screen.getByText(/変更されたフィールド/i)).toBeInTheDocument()
    })
  })

  it('should display differences when import has deletions', async () => {
    const mockDiffResult: ImportDiffResult = {
      additions: [],
      modifications: [],
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

    vi.mocked(importApi.detectDiff).mockResolvedValue(mockDiffResult)

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
      expect(screen.getByText(/削除される項目/i)).toBeInTheDocument()
    })
  })

  it('should allow user to select priority for each difference', async () => {
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

    vi.mocked(importApi.detectDiff).mockResolvedValue(mockDiffResult)

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
      expect(screen.getByText(/データベースを優先/i)).toBeInTheDocument()
      expect(screen.getByText(/インポートファイルを優先/i)).toBeInTheDocument()
    })

    // Check that radio buttons are present
    const radioButtons = screen.getAllByRole('radio')
    expect(radioButtons.length).toBeGreaterThan(0)
  })

  it('should apply import when user clicks apply button', async () => {
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

    vi.mocked(importApi.detectDiff).mockResolvedValue(mockDiffResult)
    vi.mocked(importApi.applyImport).mockResolvedValue({
      message: 'インポートが完了しました',
      stats: { added: 1, modified: 0, deleted: 0 },
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

    render(<ImportDialog userId={mockUserId} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

    const input = screen.getByLabelText(/インポートファイルを選択/i)
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText(/インポートを実行/i)).toBeInTheDocument()
    })

    const applyButton = screen.getByText(/インポートを実行/i)
    fireEvent.click(applyButton)

    await waitFor(() => {
      expect(importApi.applyImport).toHaveBeenCalled()
      expect(mockOnSuccess).toHaveBeenCalled()
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('should display error when import fails', async () => {
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

    vi.mocked(importApi.detectDiff).mockResolvedValue(mockDiffResult)
    vi.mocked(importApi.applyImport).mockRejectedValue(
      new Error('インポートエラー: データベースエラーが発生しました')
    )

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
      // Error message should be displayed
      const errorText = screen.queryByText(/インポートエラー/i) || 
                        screen.queryByText(/インポートの適用に失敗しました/i) ||
                        screen.queryByText(/エラー/i)
      expect(errorText).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should handle bulk selection buttons', async () => {
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

    vi.mocked(importApi.detectDiff).mockResolvedValue(mockDiffResult)

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

    render(<ImportDialog userId={mockUserId} onClose={mockOnClose} />)

    const input = screen.getByLabelText(/インポートファイルを選択/i)
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText(/すべての追加をインポート/i)).toBeInTheDocument()
    })

    const bulkButton = screen.getByText(/すべての追加をインポート/i)
    fireEvent.click(bulkButton)

    // Verify that all additions are selected for import
    const importRadios = screen.getAllByLabelText(/インポートファイルを優先/i)
    expect(importRadios.length).toBeGreaterThan(0)
  })
})


/**
 * BookListPage integration tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BookListPage } from '../../src/pages/BookListPage'
import { listBooks } from '../../src/services/book_api'
import { createMockBook } from '../fixtures/books'
import type { BookWithLocations } from '../../src/types'

// Mock the API functions
vi.mock('../../src/services/book_api', () => ({
  listBooks: vi.fn(),
}))

describe('BookListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render book list page', async () => {
    const mockBooks: BookWithLocations[] = [
      {
        ...createMockBook({ title: 'Book 1' }),
        locations: [],
      },
    ]
    ;(listBooks as any).mockResolvedValue({ books: mockBooks })

    render(<BookListPage />)
    expect(screen.getByText('書籍一覧')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Book 1')).toBeInTheDocument()
    })
  })

  it('should display loading state', () => {
    ;(listBooks as any).mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<BookListPage />)
    expect(screen.getByText('読み込み中...')).toBeInTheDocument()
  })

  it('should display error message on API failure', async () => {
    ;(listBooks as any).mockRejectedValue(new Error('API Error'))

    render(<BookListPage />)

    await waitFor(() => {
      expect(screen.getByText('書籍一覧の取得に失敗しました')).toBeInTheDocument()
    })
  })

  it('should search books when search query is entered', async () => {
    const mockBooks: BookWithLocations[] = [
      {
        ...createMockBook({ title: 'JavaScript入門' }),
        locations: [],
      },
      {
        ...createMockBook({ title: 'Python基礎', isbn: '9784123456790' }),
        locations: [],
      },
    ]
    ;(listBooks as any).mockResolvedValue({ books: mockBooks })

    render(<BookListPage />)

    await waitFor(() => {
      expect(screen.getByText('JavaScript入門')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('タイトルまたは著者名で検索...')
    fireEvent.change(searchInput, { target: { value: 'JavaScript' } })

    await waitFor(() => {
      expect(listBooks).toHaveBeenCalledWith('default-user', 'JavaScript')
    })
  })

  it('should display empty state when no books found', async () => {
    ;(listBooks as any).mockResolvedValue({ books: [] })

    render(<BookListPage />)

    await waitFor(() => {
      expect(screen.getByText('書籍が登録されていません')).toBeInTheDocument()
    })
  })

  it('should display "no books found" message when search returns no results', async () => {
    ;(listBooks as any)
      .mockResolvedValueOnce({ books: [] }) // Initial load
      .mockResolvedValueOnce({ books: [] }) // Search

    render(<BookListPage />)

    await waitFor(() => {
      expect(screen.getByText('書籍が登録されていません')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('タイトルまたは著者名で検索...')
    fireEvent.change(searchInput, { target: { value: '存在しない書籍' } })

    await waitFor(() => {
      expect(screen.getByText('該当する書籍が見つかりません')).toBeInTheDocument()
    })
  })

  it('should show book detail when book is clicked', async () => {
    const mockBooks: BookWithLocations[] = [
      {
        ...createMockBook({ title: 'Book 1', author: 'Author 1' }),
        locations: [
          { id: 1, user_id: 'default-user', name: '本棚', type: 'Physical', created_at: '', updated_at: '' },
        ],
      },
    ]
    ;(listBooks as any).mockResolvedValue({ books: mockBooks })

    render(<BookListPage />)

    await waitFor(() => {
      expect(screen.getByText('Book 1')).toBeInTheDocument()
    })

    const bookItem = screen.getByText('Book 1').closest('.book-item')
    expect(bookItem).not.toBeNull()
    fireEvent.click(bookItem!)

    await waitFor(() => {
      expect(screen.getByText(/著者: Author 1/)).toBeInTheDocument()
      expect(screen.getByText('所有場所:')).toBeInTheDocument()
    })
  })

  it('should close book detail when close button is clicked', async () => {
    const mockBooks: BookWithLocations[] = [
      {
        ...createMockBook({ title: 'Book 1' }),
        locations: [],
      },
    ]
    ;(listBooks as any).mockResolvedValue({ books: mockBooks })

    render(<BookListPage />)

    await waitFor(() => {
      expect(screen.getByText('Book 1')).toBeInTheDocument()
    })

    const bookItem = screen.getByText('Book 1').closest('.book-item')
    if (bookItem) {
      fireEvent.click(bookItem)

      await waitFor(() => {
        expect(screen.getByLabelText('閉じる')).toBeInTheDocument()
      })

      const closeButton = screen.getByLabelText('閉じる')
      fireEvent.click(closeButton)

      await waitFor(() => {
        expect(screen.getByText('書籍一覧')).toBeInTheDocument()
      })
    }
  })
})

/**
 * BookForm component tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BookForm } from '../../src/components/BookForm/BookForm'
import { createBook, searchBooks, searchByBarcode } from '../../src/services/book_api'
import { listLocations } from '../../src/services/location_api'
import { mockFetchResponse, mockFetchError, resetFetchMock } from '../helpers/api'
import { createMockBookSearchResult, createMockBook } from '../fixtures/books'

// Mock the API functions
vi.mock('../../src/services/book_api', () => ({
  createBook: vi.fn(),
  searchBooks: vi.fn(),
  searchByBarcode: vi.fn(),
}))

vi.mock('../../src/services/location_api', () => ({
  listLocations: vi.fn(),
}))

describe('BookForm', () => {
  const mockOnSuccess = vi.fn()
  const defaultUserId = 'default-user'

  beforeEach(() => {
    vi.clearAllMocks()
    resetFetchMock()
    // Mock successful location loading by default
    ;(listLocations as any).mockResolvedValueOnce({ locations: [] })
  })

  it('should render book form', () => {
    render(<BookForm onSuccess={mockOnSuccess} defaultUserId={defaultUserId} />)
    expect(screen.getByText(/書籍登録/i)).toBeInTheDocument()
  })

  it('should search books when search button is clicked', async () => {
    const mockResults = {
      items: [createMockBookSearchResult({ title: 'Test Book' })],
    }
    ;(searchBooks as any).mockResolvedValueOnce(mockResults)

    render(<BookForm onSuccess={mockOnSuccess} defaultUserId={defaultUserId} />)

    const searchInput = screen.getByPlaceholderText(/タイトルまたは著者名を入力/i)
    // Find the search button by role (button) that is next to the input
    const searchButton = searchInput.parentElement?.querySelector('button') || screen.getAllByRole('button').find(btn => btn.textContent === '検索' && !btn.disabled)

    fireEvent.change(searchInput, { target: { value: 'Test Book' } })
    if (searchButton) {
      fireEvent.click(searchButton)
    }

    await waitFor(() => {
      expect(searchBooks).toHaveBeenCalledWith('Test Book', 10)
    })
  })

  it('should create book when form is submitted', async () => {
    const mockBook = createMockBook({ title: 'Test Book' })
    ;(createBook as any).mockResolvedValueOnce(mockBook)

    render(<BookForm onSuccess={mockOnSuccess} defaultUserId={defaultUserId} />)

    // Switch to manual mode
    const manualTab = screen.getByText(/手動登録/i)
    fireEvent.click(manualTab)

    // Wait for manual mode to render
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/タイトル/i)).toBeInTheDocument()
    })

    // Fill form - use placeholder since label might not be properly associated
    const titleInput = screen.getByPlaceholderText(/タイトル/i)
    fireEvent.change(titleInput, { target: { value: 'Test Book' } })

    // Wait for submit button to be enabled (not disabled)
    const submitButton = await waitFor(() => {
      const buttons = screen.getAllByRole('button')
      const submitBtn = buttons.find(btn => btn.textContent === '登録' && !btn.disabled)
      if (!submitBtn) {
        throw new Error('Submit button not found or disabled')
      }
      return submitBtn
    })

    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(createBook).toHaveBeenCalled()
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })

  it('should show error message when search fails', async () => {
    ;(searchBooks as any).mockRejectedValueOnce(new Error('Search failed'))

    render(<BookForm onSuccess={mockOnSuccess} defaultUserId={defaultUserId} />)

    const searchInput = screen.getByPlaceholderText(/タイトルまたは著者名を入力/i)
    // Find the search button by role (button) that is next to the input
    const searchButton = searchInput.parentElement?.querySelector('button') || screen.getAllByRole('button').find(btn => btn.textContent === '検索' && !btn.disabled)

    fireEvent.change(searchInput, { target: { value: 'Test' } })
    if (searchButton) {
      fireEvent.click(searchButton)
    }

    await waitFor(() => {
      expect(screen.getByText(/検索に失敗しました/i)).toBeInTheDocument()
    })
  })
})


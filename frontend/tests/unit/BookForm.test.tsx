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

  it('should display location selection when locations are available', async () => {
    const mockLocations = [
      {
        id: 1,
        user_id: defaultUserId,
        name: '自宅本棚',
        type: 'Physical' as const,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 2,
        user_id: defaultUserId,
        name: 'Kindle',
        type: 'Digital' as const,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ]

    ;(listLocations as any).mockResolvedValueOnce({ locations: mockLocations })

    render(<BookForm onSuccess={mockOnSuccess} defaultUserId={defaultUserId} />)

    await waitFor(() => {
      expect(screen.getByText('自宅本棚')).toBeInTheDocument()
      expect(screen.getByText('Kindle')).toBeInTheDocument()
    })
  })

  it('should allow selecting multiple locations', async () => {
    const mockLocations = [
      {
        id: 1,
        user_id: defaultUserId,
        name: '自宅本棚',
        type: 'Physical' as const,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 2,
        user_id: defaultUserId,
        name: 'Kindle',
        type: 'Digital' as const,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ]

    const mockBook = createMockBook({ title: 'Test Book' })
    ;(listLocations as any).mockResolvedValueOnce({ locations: mockLocations })
    ;(createBook as any).mockResolvedValueOnce(mockBook)

    render(<BookForm onSuccess={mockOnSuccess} defaultUserId={defaultUserId} />)

    await waitFor(() => {
      expect(screen.getByText('自宅本棚')).toBeInTheDocument()
    })

    // Switch to manual mode
    const manualTab = screen.getByText(/手動登録/i)
    fireEvent.click(manualTab)

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/タイトル/i)).toBeInTheDocument()
    })

    // Select locations
    const location1Checkbox = screen.getByLabelText(/自宅本棚/)
    const location2Checkbox = screen.getByLabelText(/Kindle/)

    fireEvent.click(location1Checkbox)
    fireEvent.click(location2Checkbox)

    // Fill form and submit
    const titleInput = screen.getByPlaceholderText(/タイトル/i)
    fireEvent.change(titleInput, { target: { value: 'Test Book' } })

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
      expect(createBook).toHaveBeenCalledWith(
        expect.objectContaining({
          location_ids: [1, 2],
        })
      )
    })
  })

  it('should not display location selection when no locations are available', async () => {
    ;(listLocations as any).mockResolvedValueOnce({ locations: [] })

    render(<BookForm onSuccess={mockOnSuccess} defaultUserId={defaultUserId} />)

    await waitFor(() => {
      expect(listLocations).toHaveBeenCalledWith(defaultUserId)
    })

    // Location selection should not be visible
    expect(screen.queryByText(/所有場所/)).not.toBeInTheDocument()
  })
})


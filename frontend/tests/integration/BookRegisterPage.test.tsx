/**
 * BookRegisterPage integration tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BookRegisterPage } from '../../src/pages/BookRegisterPage'
import { createBook } from '../../src/services/book_api'
import { listLocations } from '../../src/services/location_api'
import type { Location } from '../../src/types'

// Mock the API functions
vi.mock('../../src/services/book_api', () => ({
  createBook: vi.fn(),
  searchBooks: vi.fn(),
  searchByBarcode: vi.fn(),
}))

vi.mock('../../src/services/location_api', () => ({
  listLocations: vi.fn(),
}))

describe('BookRegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render book register page', () => {
    vi.mocked(listLocations).mockResolvedValue({ locations: [] })
    render(<BookRegisterPage />)
    expect(screen.getByText(/書籍登録/i)).toBeInTheDocument()
  })

  it('should display location selection when locations are available', async () => {
    const mockLocations: Location[] = [
      {
        id: 1,
        user_id: 'default-user',
        name: '自宅本棚',
        type: 'Physical',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ]

    vi.mocked(listLocations).mockResolvedValue({ locations: mockLocations })

    render(<BookRegisterPage />)

    // Wait for locations to load
    await waitFor(() => {
      expect(listLocations).toHaveBeenCalled()
    }, { timeout: 3000 })

    // Wait a bit for the async state update to complete
    await new Promise(resolve => setTimeout(resolve, 100))

    // Switch to manual mode to see locations
    const manualTab = screen.getByText(/手動登録/i)
    fireEvent.click(manualTab)

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/タイトル/i)).toBeInTheDocument()
    })

    // Wait for locations to be displayed
    await waitFor(
      () => {
        // The location name appears in a label or span within the checkbox label
        expect(screen.getByLabelText(/自宅本棚/)).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('should allow selecting locations during book registration', async () => {
    const mockLocations: Location[] = [
      {
        id: 1,
        user_id: 'default-user',
        name: '自宅本棚',
        type: 'Physical',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ]

    const mockBook = {
      isbn: '9784123456789',
      title: 'Test Book',
      author: 'Test Author',
      thumbnail_url: null,
      is_doujin: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }

    vi.mocked(listLocations).mockResolvedValue({ locations: mockLocations })
    vi.mocked(createBook).mockResolvedValue(mockBook)

    render(<BookRegisterPage />)

    // Wait for locations to load
    await waitFor(() => {
      expect(listLocations).toHaveBeenCalled()
    }, { timeout: 3000 })

    // Wait a bit for the async state update to complete
    await new Promise(resolve => setTimeout(resolve, 100))

    // Switch to manual mode first to see locations
    const manualTab = screen.getByText(/手動登録/i)
    fireEvent.click(manualTab)

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/タイトル/i)).toBeInTheDocument()
    })

    // Wait for locations to be displayed in manual mode
    await waitFor(
      () => {
        // The location name appears in a label or span within the checkbox label
        expect(screen.getByLabelText(/自宅本棚/)).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Select location - use getByLabelText to find the checkbox
    const locationCheckbox = screen.getByLabelText(/自宅本棚/)
    fireEvent.click(locationCheckbox)

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
          location_ids: [1],
        })
      )
    })
  })
})


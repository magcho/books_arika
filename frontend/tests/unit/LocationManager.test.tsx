/**
 * LocationManager component tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '../helpers/render'
import { LocationManager } from '../../src/components/LocationManager/LocationManager'
import * as locationApi from '../../src/services/location_api'
import type { Location } from '../../src/types'

// Mock location API
vi.mock('../../src/services/location_api', () => ({
  listLocations: vi.fn(),
  createLocation: vi.fn(),
  updateLocation: vi.fn(),
  deleteLocation: vi.fn(),
}))

describe('LocationManager', () => {
  const mockUserId = 'default-user'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render loading state initially', () => {
    vi.mocked(locationApi.listLocations).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    render(<LocationManager userId={mockUserId} />)
    expect(screen.getByText('読み込み中...')).toBeInTheDocument()
  })

  it('should display locations list', async () => {
    const mockLocations: Location[] = [
      {
        id: 1,
        user_id: mockUserId,
        name: '自宅本棚',
        type: 'Physical',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 2,
        user_id: mockUserId,
        name: 'Kindle',
        type: 'Digital',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ]

    vi.mocked(locationApi.listLocations).mockResolvedValue({
      locations: mockLocations,
    })

    render(<LocationManager userId={mockUserId} />)

    await waitFor(() => {
      expect(screen.getByText('自宅本棚')).toBeInTheDocument()
      expect(screen.getByText('Kindle')).toBeInTheDocument()
    })
  })

  it('should display empty state when no locations', async () => {
    vi.mocked(locationApi.listLocations).mockResolvedValue({
      locations: [],
    })

    render(<LocationManager userId={mockUserId} />)

    await waitFor(() => {
      expect(screen.getByText('場所が登録されていません')).toBeInTheDocument()
    })
  })

  it('should create a new location', async () => {
    const mockLocation: Location = {
      id: 1,
      user_id: mockUserId,
      name: '自宅本棚',
      type: 'Physical',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }

    vi.mocked(locationApi.listLocations).mockResolvedValue({
      locations: [],
    })
    vi.mocked(locationApi.createLocation).mockResolvedValue(mockLocation)

    render(<LocationManager userId={mockUserId} />)

    await waitFor(() => {
      expect(screen.getByText('場所が登録されていません')).toBeInTheDocument()
    })

    // Fill form
    const nameInput = screen.getByLabelText(/場所名:/)
    fireEvent.change(nameInput, { target: { value: '自宅本棚' } })

    // Submit form
    const submitButton = screen.getByText('追加')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(locationApi.createLocation).toHaveBeenCalledWith({
        user_id: mockUserId,
        name: '自宅本棚',
        type: 'Physical',
      })
      expect(locationApi.listLocations).toHaveBeenCalledTimes(2) // Initial load + after create
    })
  })

  it('should update a location', async () => {
    const mockLocation: Location = {
      id: 1,
      user_id: mockUserId,
      name: '自宅本棚',
      type: 'Physical',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }

    const updatedLocation: Location = {
      ...mockLocation,
      name: '書斎本棚',
    }

    vi.mocked(locationApi.listLocations).mockResolvedValue({
      locations: [mockLocation],
    })
    vi.mocked(locationApi.updateLocation).mockResolvedValue(updatedLocation)

    render(<LocationManager userId={mockUserId} />)

    await waitFor(() => {
      expect(screen.getByText('自宅本棚')).toBeInTheDocument()
    })

    // Click edit button
    const editButton = screen.getByText('編集')
    fireEvent.click(editButton)

    // Update name
    const nameInput = screen.getByDisplayValue('自宅本棚')
    fireEvent.change(nameInput, { target: { value: '書斎本棚' } })

    // Submit
    const saveButton = screen.getByText('保存')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(locationApi.updateLocation).toHaveBeenCalledWith(1, { name: '書斎本棚' }, mockUserId)
    })
  })

  it('should delete a location', async () => {
    const mockLocation: Location = {
      id: 1,
      user_id: mockUserId,
      name: '自宅本棚',
      type: 'Physical',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }

    vi.mocked(locationApi.listLocations)
      .mockResolvedValueOnce({
        locations: [mockLocation],
      })
      .mockResolvedValueOnce({
        locations: [],
      })
    vi.mocked(locationApi.deleteLocation).mockResolvedValue(undefined)

    // Mock window.confirm
    window.confirm = vi.fn(() => true)

    render(<LocationManager userId={mockUserId} />)

    await waitFor(() => {
      expect(screen.getByText('自宅本棚')).toBeInTheDocument()
    })

    // Click delete button
    const deleteButton = screen.getByText('削除')
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(locationApi.deleteLocation).toHaveBeenCalledWith(1, mockUserId)
      expect(locationApi.listLocations).toHaveBeenCalledTimes(2) // Initial load + after delete
    })
  })

  it('should display error message on create failure', async () => {
    vi.mocked(locationApi.listLocations).mockResolvedValue({
      locations: [],
    })
    vi.mocked(locationApi.createLocation).mockRejectedValue(
      new Error('場所の作成に失敗しました')
    )

    render(<LocationManager userId={mockUserId} />)

    await waitFor(() => {
      expect(screen.getByText('場所が登録されていません')).toBeInTheDocument()
    })

    // Fill form
    const nameInput = screen.getByLabelText(/場所名:/)
    fireEvent.change(nameInput, { target: { value: '自宅本棚' } })

    // Submit form
    const submitButton = screen.getByText('追加')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/作成エラー:/)).toBeInTheDocument()
    })
  })

  it('should call onLocationChange callback after create', async () => {
    const mockLocation: Location = {
      id: 1,
      user_id: mockUserId,
      name: '自宅本棚',
      type: 'Physical',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }

    const onLocationChange = vi.fn()

    vi.mocked(locationApi.listLocations).mockResolvedValue({
      locations: [],
    })
    vi.mocked(locationApi.createLocation).mockResolvedValue(mockLocation)

    render(<LocationManager userId={mockUserId} onLocationChange={onLocationChange} />)

    await waitFor(() => {
      expect(screen.getByText('場所が登録されていません')).toBeInTheDocument()
    })

    // Fill form and submit
    const nameInput = screen.getByLabelText(/場所名:/)
    fireEvent.change(nameInput, { target: { value: '自宅本棚' } })
    const submitButton = screen.getByText('追加')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(onLocationChange).toHaveBeenCalled()
    })
  })
})


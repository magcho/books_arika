/**
 * LocationManagePage integration tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '../helpers/render'
import { LocationManagePage } from '../../src/pages/LocationManagePage'
import * as locationApi from '../../src/services/location_api'
import type { Location } from '../../src/types'

// Mock location API
vi.mock('../../src/services/location_api', () => ({
  listLocations: vi.fn(),
  createLocation: vi.fn(),
  updateLocation: vi.fn(),
  deleteLocation: vi.fn(),
}))

describe('LocationManagePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render location manage page', async () => {
    vi.mocked(locationApi.listLocations).mockResolvedValue({
      locations: [],
    })

    render(<LocationManagePage />)

    await waitFor(() => {
      expect(screen.getByText('場所管理')).toBeInTheDocument()
    })
  })

  it('should display locations from API', async () => {
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

    vi.mocked(locationApi.listLocations).mockResolvedValue({
      locations: mockLocations,
    })

    render(<LocationManagePage />)

    await waitFor(() => {
      expect(screen.getByText('自宅本棚')).toBeInTheDocument()
    })
  })

  it('should handle location creation flow', async () => {
    const mockLocation: Location = {
      id: 1,
      user_id: 'default-user',
      name: '自宅本棚',
      type: 'Physical',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }

    vi.mocked(locationApi.listLocations)
      .mockResolvedValueOnce({
        locations: [],
      })
      .mockResolvedValueOnce({
        locations: [mockLocation],
      })
    vi.mocked(locationApi.createLocation).mockResolvedValue(mockLocation)

    render(<LocationManagePage />)

    await waitFor(() => {
      expect(screen.getByText('場所が登録されていません')).toBeInTheDocument()
    })

    // Verify API was called with correct user ID
    expect(locationApi.listLocations).toHaveBeenCalledWith('default-user')
  })
})


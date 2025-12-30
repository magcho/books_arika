import type { Location } from '../../types'

export const mockLocations: Location[] = [
  {
    id: 1,
    user_id: 'user-1',
    name: '本棚A',
    type: 'Physical',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    user_id: 'user-1',
    name: 'Kindle',
    type: 'Digital',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 3,
    user_id: 'user-1',
    name: '本棚B',
    type: 'Physical',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
]

export const mockLocation: Location = mockLocations[0]



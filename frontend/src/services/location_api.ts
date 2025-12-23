/**
 * Location API service
 * Handles all location-related API calls
 */

import { get, post, put, del } from './api'
import type {
  Location,
  LocationCreateRequest,
  LocationUpdateRequest,
  LocationsResponse,
} from '../types'

/**
 * List all locations for a user
 */
export async function listLocations(user_id: string): Promise<LocationsResponse> {
  return get<LocationsResponse>(`/locations?user_id=${encodeURIComponent(user_id)}`)
}

/**
 * Get location by ID
 */
export async function getLocation(location_id: number): Promise<Location> {
  return get<Location>(`/locations/${location_id}`)
}

/**
 * Create a new location
 */
export async function createLocation(data: LocationCreateRequest): Promise<Location> {
  return post<Location>('/locations', data)
}

/**
 * Update location
 */
export async function updateLocation(
  location_id: number,
  data: LocationUpdateRequest
): Promise<Location> {
  return put<Location>(`/locations/${location_id}`, data)
}

/**
 * Delete location
 */
export async function deleteLocation(location_id: number): Promise<void> {
  return del<void>(`/locations/${location_id}`)
}


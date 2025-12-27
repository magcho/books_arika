/**
 * Ownership API service
 * Handles all ownership-related API calls
 */

import { get, post, del } from './api'
import type {
  Ownership,
  OwnershipCreateRequest,
  OwnershipsResponse,
} from '../types'

/**
 * List all ownerships with optional filters
 */
export async function listOwnerships(
  user_id: string,
  options?: { isbn?: string; location_id?: number }
): Promise<OwnershipsResponse> {
  const params = new URLSearchParams({ user_id })
  if (options?.isbn) {
    params.append('isbn', options.isbn)
  }
  if (options?.location_id) {
    params.append('location_id', options.location_id.toString())
  }
  return get<OwnershipsResponse>(`/ownerships?${params.toString()}`)
}

/**
 * Create a new ownership
 */
export async function createOwnership(data: OwnershipCreateRequest): Promise<Ownership> {
  return post<Ownership>('/ownerships', data)
}

/**
 * Delete ownership
 */
export async function deleteOwnership(ownership_id: number, user_id: string): Promise<void> {
  return del<void>(`/ownerships/${ownership_id}?user_id=${encodeURIComponent(user_id)}`)
}


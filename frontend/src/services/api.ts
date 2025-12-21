/**
 * Base API client service
 * Provides HTTP client functionality for frontend API calls
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787/api'

export interface ApiError {
  message: string
  code?: string
  details?: unknown
}

export class ApiClientError extends Error {
  code?: string
  details?: unknown
  status?: number

  constructor(message: string, code?: string, details?: unknown, status?: number) {
    super(message)
    this.name = 'ApiClientError'
    this.code = code
    this.details = details
    this.status = status
  }
}

/**
 * Base fetch wrapper with error handling
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_URL}${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    let errorData: ApiError
    try {
      errorData = await response.json()
    } catch {
      errorData = {
        message: `HTTP ${response.status}: ${response.statusText}`,
        code: 'HTTP_ERROR',
      }
    }

    throw new ApiClientError(
      errorData.message || 'An error occurred',
      errorData.code,
      errorData.details,
      response.status
    )
  }

  // Handle empty responses
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return response.json()
  }

  return {} as T
}

/**
 * GET request helper
 */
export async function get<T>(endpoint: string): Promise<T> {
  return fetchApi<T>(endpoint, { method: 'GET' })
}

/**
 * POST request helper
 */
export async function post<T>(endpoint: string, data?: unknown): Promise<T> {
  return fetchApi<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * PUT request helper
 */
export async function put<T>(endpoint: string, data?: unknown): Promise<T> {
  return fetchApi<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * DELETE request helper
 */
export async function del<T>(endpoint: string): Promise<T> {
  return fetchApi<T>(endpoint, { method: 'DELETE' })
}


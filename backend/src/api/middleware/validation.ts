/**
 * Request validation utilities
 * Provides validation helpers for request bodies and parameters
 */

import { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'

export interface ValidationError {
  field: string
  message: string
}

/**
 * Validate required fields in request body
 * @param data - Request body data (can be any object with string keys)
 * @param fields - Array of required field names
 */
export function validateRequired<T extends Record<string, unknown>>(
  data: T,
  fields: (keyof T)[]
): ValidationError[] {
  const errors: ValidationError[] = []

  for (const field of fields) {
    const value = data[field]
    if (value === undefined || value === null || value === '') {
      errors.push({
        field: String(field),
        message: `${String(field)} is required`,
      })
    }
  }

  return errors
}

/**
 * Validate string length
 */
export function validateLength(
  value: string | undefined,
  field: string,
  min?: number,
  max?: number
): ValidationError | null {
  if (value === undefined || value === null) {
    return null // Let required validation handle this
  }

  if (min !== undefined && value.length < min) {
    return {
      field,
      message: `${field} must be at least ${min} characters`,
    }
  }

  if (max !== undefined && value.length > max) {
    return {
      field,
      message: `${field} must be at most ${max} characters`,
    }
  }

  return null
}

/**
 * Validate email format (basic)
 */
export function validateEmail(email: string | undefined, field: string): ValidationError | null {
  if (email === undefined || email === null) {
    return null
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return {
      field,
      message: `${field} must be a valid email address`,
    }
  }

  return null
}

/**
 * Validate URL format
 */
export function validateURL(url: string | undefined, field: string): ValidationError | null {
  if (url === undefined || url === null) {
    return null
  }

  try {
    new URL(url)
    return null
  } catch {
    return {
      field,
      message: `${field} must be a valid URL`,
    }
  }
}

/**
 * Return validation errors as HTTP 400 response
 */
export function throwValidationError(errors: ValidationError[]): never {
  throw new HTTPException(400, {
    message: JSON.stringify({
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors,
      },
    }),
  })
}


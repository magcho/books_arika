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
        message: `${String(field)}は必須です`,
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
      message: `${field}は${min}文字以上である必要があります`,
    }
  }

  if (max !== undefined && value.length > max) {
    return {
      field,
      message: `${field}は${max}文字以下である必要があります`,
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
      message: `${field}は有効なメールアドレスである必要があります`,
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
      message: `${field}は有効なURLである必要があります`,
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
        message: 'バリデーションエラー',
        code: 'VALIDATION_ERROR',
        details: errors,
      },
    }),
  })
}


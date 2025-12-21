/**
 * Error handling middleware
 * Catches errors and returns appropriate HTTP responses
 */

import { Context, ErrorHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'

export const errorHandler: ErrorHandler = (error, c) => {
  if (error instanceof HTTPException) {
    return error.getResponse()
  }

  // Log unexpected errors
  console.error('Unexpected error:', error)

  // Return generic error response
  return c.json(
    {
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
      },
    },
    500
  )
}


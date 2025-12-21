/**
 * CORS middleware
 * Handles Cross-Origin Resource Sharing for frontend requests
 */

import { cors as honoCors } from 'hono/cors'

export const cors = honoCors({
  origin: (origin) => {
    // Allow requests from localhost for development
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return origin
    }
    // In production, specify allowed origins
    // For now, allow all origins (adjust for production)
    return origin
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 86400,
  credentials: true,
})


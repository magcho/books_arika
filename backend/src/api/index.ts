/**
 * Main API entry point
 * Sets up Hono application with routes and middleware
 */

import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { cors } from './middleware/cors'
import { errorHandler } from './middleware/error'
import { logger } from './middleware/logger'
import { rateLimit } from './middleware/rate_limit'
import { locationsRoutes } from './routes/locations'
import { ownershipsRoutes } from './routes/ownerships'

const app = new Hono()

// Global middleware (error handler must be last)
app.use('*', logger)
app.use('*', rateLimit)
app.use('*', cors)

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Import route handlers
import { booksRoutes } from './routes/books'
import { searchRoutes } from './routes/search'
import { importRoutes } from './routes/import'
import { exportRoutes } from './routes/export'

// API routes - mount routes using app.route()
// Note: Using app.route() with full path, routes define handlers with '/'
app.route('/api/books', booksRoutes)
app.route('/api/search', searchRoutes)
app.route('/api/locations', locationsRoutes)
app.route('/api/ownerships', ownershipsRoutes)
app.route('/api/import', importRoutes)
app.route('/api/export', exportRoutes)

// Error handler must be last
app.onError(errorHandler)

export default app


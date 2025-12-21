/**
 * Main API entry point
 * Sets up Hono application with routes and middleware
 */

import { Hono } from 'hono'
import { cors } from './middleware/cors'
import { errorHandler } from './middleware/error'
import { logger } from './middleware/logger'

// Import route handlers
import { booksRoutes } from './routes/books'
import { searchRoutes } from './routes/search'
// import { locationsRoutes } from './routes/locations'
// import { ownershipsRoutes } from './routes/ownerships'

const app = new Hono()

// Global middleware (error handler must be last)
app.use('*', logger)
app.use('*', cors)

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API routes - define directly instead of using app.route()
// This is a workaround for Cloudflare Workers environment
app.post('/api/books', async (c) => {
  return booksRoutes.fetch(c.req.raw, c.env, c.executionCtx)
})

app.get('/api/books', async (c) => {
  return booksRoutes.fetch(c.req.raw, c.env, c.executionCtx)
})

app.get('/api/search/books', async (c) => {
  return searchRoutes.fetch(c.req.raw, c.env, c.executionCtx)
})

app.post('/api/search/barcode', async (c) => {
  return searchRoutes.fetch(c.req.raw, c.env, c.executionCtx)
})
// app.route('/api/locations', locationsRoutes)
// app.route('/api/ownerships', ownershipsRoutes)

// Error handler must be last
app.onError(errorHandler)

export default app


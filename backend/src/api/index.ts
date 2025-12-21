/**
 * Main API entry point
 * Sets up Hono application with routes and middleware
 */

import { Hono } from 'hono'
import { cors } from './middleware/cors'
import { errorHandler } from './middleware/error'
import { logger } from './middleware/logger'

// Import route handlers (will be created in later tasks)
// import { booksRoutes } from './routes/books'
// import { locationsRoutes } from './routes/locations'
// import { ownershipsRoutes } from './routes/ownerships'
// import { searchRoutes } from './routes/search'

const app = new Hono()

// Global middleware
app.use('*', logger)
app.use('*', cors)
app.use('*', errorHandler)

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API routes (will be added in later phases)
// app.route('/api/books', booksRoutes)
// app.route('/api/locations', locationsRoutes)
// app.route('/api/ownerships', ownershipsRoutes)
// app.route('/api/search', searchRoutes)

export default app


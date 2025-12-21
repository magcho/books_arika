/**
 * Main API entry point
 * Sets up Hono application with routes and middleware
 */

import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { cors } from './middleware/cors'
import { errorHandler } from './middleware/error'
import { logger } from './middleware/logger'
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

// API routes - define handlers directly
// Import handlers from routes
import type { Env } from '../types/db'
import { BookService } from '../services/book_service'
import { validateRequired, validateLength, throwValidationError } from './middleware/validation'
import type { BookCreateRequest } from '../types'
import { GoogleBooksService } from '../services/google_books_service'
import { getConfig } from '../config/env'

// POST /api/books - Register a new book
app.post('/api/books', async (c) => {
  const db = (c.env as Env).DB
  const body = await c.req.json<BookCreateRequest>()

  // Validation
  const errors = validateRequired(body as Record<string, unknown>, ['user_id', 'title'])
  if (errors.length > 0) {
    throwValidationError(errors)
  }

  const titleError = validateLength(body.title, 'title', 1, 500)
  if (titleError) {
    throwValidationError([titleError])
  }

  if (body.author) {
    const authorError = validateLength(body.author, 'author', 1, 255)
    if (authorError) {
      throwValidationError([authorError])
    }
  }

  const bookService = new BookService(db)

  // Check for duplicates
  const duplicate = await bookService.checkDuplicate({
    isbn: body.isbn || null,
    title: body.title,
    author: body.author || null,
    thumbnail_url: body.thumbnail_url || null,
    is_doujin: body.is_doujin || false,
  })

  if (duplicate) {
    throw new HTTPException(409, {
      message: JSON.stringify({
        error: {
          message: 'Book already exists',
          code: 'DUPLICATE_BOOK',
          details: { existing_isbn: duplicate.isbn },
        },
      }),
    })
  }

  try {
    const book = await bookService.create({
      isbn: body.isbn || null,
      title: body.title,
      author: body.author || null,
      thumbnail_url: body.thumbnail_url || null,
      is_doujin: body.is_doujin || false,
    })

    return c.json(book, 201)
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    throw new HTTPException(500, {
      message: JSON.stringify({
        error: {
          message: 'Failed to create book',
          code: 'CREATE_BOOK_ERROR',
        },
      }),
    })
  }
})

// GET /api/books - List all books
app.get('/api/books', async (c) => {
  const db = (c.env as Env).DB
  const bookService = new BookService(db)

  try {
    const books = await bookService.listAll()
    return c.json({ books })
  } catch (error) {
    throw new HTTPException(500, {
      message: JSON.stringify({
        error: {
          message: 'Failed to retrieve books',
          code: 'LIST_BOOKS_ERROR',
        },
      }),
    })
  }
})

// GET /api/search/books - Search books using Google Books API
app.get('/api/search/books', async (c) => {
  const query = c.req.query('q')
  const maxResults = parseInt(c.req.query('maxResults') || '10', 10)

  if (!query) {
    throwValidationError([
      {
        field: 'q',
        message: 'Query parameter is required',
      },
    ])
  }

  const config = getConfig(c.env as Env)
  const googleBooksService = new GoogleBooksService(config.googleBooksApiKey)

  try {
    const results = await googleBooksService.search(query, Math.min(maxResults, 40))
    return c.json({ items: results })
  } catch (error) {
    throw new HTTPException(500, {
      message: JSON.stringify({
        error: {
          message: error instanceof Error ? error.message : 'Failed to search books',
          code: 'GOOGLE_BOOKS_API_ERROR',
        },
      }),
    })
  }
})

// POST /api/search/barcode - Search book by ISBN barcode
app.post('/api/search/barcode', async (c) => {
  const body = await c.req.json<{ isbn: string }>()

  // Validation
  const errors = validateRequired(body as Record<string, unknown>, ['isbn'])
  if (errors.length > 0) {
    throwValidationError(errors)
  }

  const config = getConfig(c.env as Env)
  const googleBooksService = new GoogleBooksService(config.googleBooksApiKey)

  try {
    const result = await googleBooksService.searchByISBN(body.isbn)

    if (!result) {
      throw new HTTPException(404, {
        message: JSON.stringify({
          error: {
            message: 'Book not found',
            code: 'BOOK_NOT_FOUND',
          },
        }),
      })
    }

    return c.json(result)
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    throw new HTTPException(500, {
      message: JSON.stringify({
        error: {
          message: error instanceof Error ? error.message : 'Failed to search by barcode',
          code: 'BARCODE_SEARCH_ERROR',
        },
      }),
    })
  }
})
// app.route('/api/locations', locationsRoutes)
// app.route('/api/ownerships', ownershipsRoutes)

// Error handler must be last
app.onError(errorHandler)

export default app


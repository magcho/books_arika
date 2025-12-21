/**
 * Search API routes
 * Handles Google Books API integration and barcode search
 */

import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { Env } from '../../types/db'
import { GoogleBooksService } from '../../services/google_books_service'
import { getConfig } from '../../config/env'
import { validateRequired, throwValidationError } from '../middleware/validation'

const search = new Hono<{ Bindings: Env }>()

/**
 * GET /api/search/books
 * Search books using Google Books API
 */
search.get('/books', async (c) => {
  const query = c.req.query('q')
  const maxResults = parseInt(c.req.query('maxResults') || '10', 10)

    if (!query) {
    throwValidationError([
      {
        field: 'q',
        message: '検索キーワードは必須です',
      },
    ])
  }

  const config = getConfig(c.env)
  const googleBooksService = new GoogleBooksService(config.googleBooksApiKey)

  try {
    const results = await googleBooksService.search(query, Math.min(maxResults, 40))
    return c.json({ items: results })
  } catch (error) {
    // Return error but allow fallback to manual entry
    throw new HTTPException(500, {
      message: JSON.stringify({
        error: {
          message:
            error instanceof Error ? error.message : '書籍検索に失敗しました',
          code: 'GOOGLE_BOOKS_API_ERROR',
        },
      }),
    })
  }
})

/**
 * POST /api/search/barcode
 * Search book by ISBN barcode
 */
search.post('/barcode', async (c) => {
  const body = await c.req.json<{ isbn: string }>()

  // Validation
  const errors = validateRequired(body, ['isbn'])
  if (errors.length > 0) {
    throwValidationError(errors)
  }

  const config = getConfig(c.env)
  const googleBooksService = new GoogleBooksService(config.googleBooksApiKey)

  try {
    const result = await googleBooksService.searchByISBN(body.isbn)

    if (!result) {
      throw new HTTPException(404, {
        message: JSON.stringify({
          error: {
            message: '書籍が見つかりませんでした',
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
          message:
            error instanceof Error ? error.message : 'バーコード検索に失敗しました',
          code: 'BARCODE_SEARCH_ERROR',
        },
      }),
    })
  }
})

export { search as searchRoutes }


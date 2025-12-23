/**
 * Books API routes
 * Handles book registration and retrieval
 */

import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { Env } from '../../types/db'
import { BookService } from '../../services/book_service'
import { OwnershipService } from '../../services/ownership_service'
import { validateRequired, validateLength, throwValidationError } from '../middleware/validation'
import type { BookCreateRequest } from '../../types'
import { isValidISBN } from '../../models/book'

const books = new Hono<{ Bindings: Env }>()

/**
 * POST /api/books
 * Register a new book
 */
books.post('/', async (c) => {
  const db = c.env.DB
  const body = await c.req.json<BookCreateRequest>()

  // Validation
  const errors = validateRequired(body, ['user_id', 'title'])
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

  // ISBN validation if provided
  if (body.isbn && !isValidISBN(body.isbn)) {
    throwValidationError([
      {
        field: 'isbn',
        message: 'ISBN形式が正しくありません',
      },
    ])
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
          message: 'この書籍は既に登録されています',
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

    // Create ownerships if location_ids are provided
    if (body.location_ids && body.location_ids.length > 0) {
      const ownershipService = new OwnershipService(db)
      
      // Validate that all location_ids belong to the user
      for (const location_id of body.location_ids) {
        const locationOwned = await ownershipService.validateLocationOwnership(
          location_id,
          body.user_id
        )
        if (!locationOwned) {
          throw new HTTPException(403, {
            message: JSON.stringify({
              error: {
                message: `場所ID ${location_id} はこのユーザーのものではありません`,
                code: 'LOCATION_OWNERSHIP_ERROR',
              },
            }),
          })
        }
      }

      // Create ownerships for each location
      const ownershipInputs = body.location_ids.map((location_id) => ({
        user_id: body.user_id,
        isbn: book.isbn,
        location_id: location_id,
      }))

      try {
        await ownershipService.createMultiple(ownershipInputs)
      } catch (ownershipError) {
        // If ownership creation fails, we still return the book
        // The book was created successfully, ownerships can be added later
        // Log the error but don't fail the request
        console.error('所有情報の作成に失敗しました:', ownershipError)
      }
    }

    return c.json(book, 201)
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    // Handle database unique constraint violation
    if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
      throw new HTTPException(409, {
        message: JSON.stringify({
          error: {
            message: 'この書籍は既に登録されています',
            code: 'DUPLICATE_BOOK',
          },
        }),
      })
    }
    throw new HTTPException(500, {
      message: JSON.stringify({
        error: {
          message: '書籍の登録に失敗しました',
          code: 'CREATE_BOOK_ERROR',
        },
      }),
    })
  }
})

/**
 * GET /api/books
 * List all books (for MVP, returns all books)
 */
books.get('/', async (c) => {
  const db = c.env.DB
  const bookService = new BookService(db)

  try {
    const books = await bookService.listAll()
    return c.json({ books })
  } catch (error) {
    throw new HTTPException(500, {
      message: JSON.stringify({
        error: {
          message: '書籍一覧の取得に失敗しました',
          code: 'LIST_BOOKS_ERROR',
        },
      }),
    })
  }
})

export { books as booksRoutes }


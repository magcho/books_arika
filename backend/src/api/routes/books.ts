/**
 * Books API routes
 * Handles book registration and retrieval
 */

import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { Env } from '../../types/db'
import { BookService } from '../../services/book_service'
import { validateRequired, validateLength, throwValidationError } from '../middleware/validation'
import type { BookCreateRequest } from '../../types'

const books = new Hono<{ Bindings: Env }>()

/**
 * POST /api/books
 * Register a new book
 */
books.post('/books', async (c) => {
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

/**
 * GET /api/books
 * List all books (for MVP, returns all books)
 */
books.get('/books', async (c) => {
  const db = c.env.DB
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

export { books as booksRoutes }


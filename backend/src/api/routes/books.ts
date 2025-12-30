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

  // Validate ownerships before creating the book
  // This ensures we don't create a book if ownership creation will fail
  // Note: createMultiple() also validates ownership, but we validate here first
  // to avoid creating a book that can't be associated with the requested locations
  if (body.location_ids && body.location_ids.length > 0) {
    const ownershipService = new OwnershipService(db)
    
    // Validate that all location_ids belong to the user
    // This is an early validation before book creation
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
    // Note: createMultiple() will also validate ownership internally,
    // but we've already validated above to prevent book creation if validation fails
    if (body.location_ids && body.location_ids.length > 0) {
      const ownershipService = new OwnershipService(db)

      // Create ownerships for each location
      const ownershipInputs = body.location_ids.map((location_id) => ({
        user_id: body.user_id,
        isbn: book.isbn,
        location_id: location_id,
      }))

      // If ownership creation fails, throw an error
      // The book was created, but we should fail the request to indicate
      // that the complete operation (book + ownerships) failed
      await ownershipService.createMultiple(ownershipInputs)
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
 * List all books with optional search parameter
 * Query params:
 *   - user_id: required (for MVP: "default-user")
 *   - search: optional (search by title or author)
 */
books.get('/', async (c) => {
  const db = c.env.DB
  const bookService = new BookService(db)

  // Get query parameters
  const user_id = c.req.query('user_id')
  const searchQuery = c.req.query('search')

  // Validate user_id
  if (!user_id) {
    throw new HTTPException(400, {
      message: JSON.stringify({
        error: {
          message: 'user_idは必須です',
          code: 'MISSING_USER_ID',
        },
      }),
    })
  }

  const ownershipService = new OwnershipService(db)
  const { LocationService } = await import('../../services/location_service')
  const locationService = new LocationService(db)

  try {
    let booksList: Book[]
    if (searchQuery) {
      // Search books by title or author
      booksList = await bookService.search(searchQuery)
    } else {
      // List all books
      booksList = await bookService.listAll()
    }

    // Enrich books with locations for the user
    const booksWithLocations = await Promise.all(
      booksList.map(async (book) => {
        const ownerships = await ownershipService.findByISBNAndUserId(book.isbn, user_id)
        const locations = await Promise.all(
          ownerships.map(async (o) => {
            const location = await locationService.findById(o.location_id)
            return location
          })
        )
        const validLocations = locations.filter((l): l is NonNullable<typeof l> => l !== null)
        return {
          ...book,
          locations: validLocations,
        }
      })
    )

    return c.json({ books: booksWithLocations })
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

/**
 * GET /api/books/{isbn}
 * Get book detail with locations
 * Query params:
 *   - user_id: required (for MVP: "default-user")
 */
books.get('/:isbn', async (c) => {
  const db = c.env.DB
  const isbn = c.req.param('isbn')
  const user_id = c.req.query('user_id')

  // Validate user_id
  if (!user_id) {
    throw new HTTPException(400, {
      message: JSON.stringify({
        error: {
          message: 'user_idは必須です',
          code: 'MISSING_USER_ID',
        },
      }),
    })
  }

  const bookService = new BookService(db)
  const ownershipService = new OwnershipService(db)
  const { LocationService } = await import('../../services/location_service')
  const locationService = new LocationService(db)

  try {
    // Get book
    const book = await bookService.findByISBN(isbn)
    if (!book) {
      throw new HTTPException(404, {
        message: JSON.stringify({
          error: {
            message: '書籍が見つかりません',
            code: 'BOOK_NOT_FOUND',
          },
        }),
      })
    }

    // Get locations for this book and user
    const ownerships = await ownershipService.findByISBNAndUserId(isbn, user_id)
    const locations = await Promise.all(
      ownerships.map(async (o) => {
        const location = await locationService.findById(o.location_id)
        return location
      })
    )

    // Filter out null locations (should not happen, but safety check)
    const validLocations = locations.filter((l): l is NonNullable<typeof l> => l !== null)

    return c.json({
      ...book,
      locations: validLocations,
    })
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    throw new HTTPException(500, {
      message: JSON.stringify({
        error: {
          message: '書籍詳細の取得に失敗しました',
          code: 'GET_BOOK_ERROR',
        },
      }),
    })
  }
})

export { books as booksRoutes }


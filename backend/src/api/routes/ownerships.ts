/**
 * Ownerships API routes
 * Handles ownership CRUD operations
 */

import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { Env } from '../../types/db'
import { OwnershipService } from '../../services/ownership_service'
import { validateRequired, throwValidationError } from '../middleware/validation'
import type { OwnershipCreateRequest } from '../../types'

// Define custom error codes for consistency
const ERROR_CODES = {
  USER_ID_REQUIRED: 'USER_ID_REQUIRED',
  OWNERSHIP_ID_INVALID: 'OWNERSHIP_ID_INVALID',
  LOCATION_ID_INVALID: 'LOCATION_ID_INVALID',
  OWNERSHIP_NOT_FOUND: 'OWNERSHIP_NOT_FOUND',
  OWNERSHIP_OWNERSHIP_ERROR: 'OWNERSHIP_OWNERSHIP_ERROR',
  DUPLICATE_OWNERSHIP: 'DUPLICATE_OWNERSHIP',
  LOCATION_OWNERSHIP_ERROR: 'LOCATION_OWNERSHIP_ERROR',
  CREATE_OWNERSHIP_ERROR: 'CREATE_OWNERSHIP_ERROR',
  LIST_OWNERSHIPS_ERROR: 'LIST_OWNERSHIPS_ERROR',
  DELETE_OWNERSHIP_ERROR: 'DELETE_OWNERSHIP_ERROR',
} as const

const ownerships = new Hono<{ Bindings: Env }>()

/**
 * GET /api/ownerships
 * List ownerships with optional filters
 */
ownerships.get('/', async (c) => {
  const db = c.env.DB
  const user_id = c.req.query('user_id')
  const isbn = c.req.query('isbn')
  const location_id = c.req.query('location_id')

  if (!user_id) {
    throwValidationError([
      {
        field: 'user_id',
        message: 'user_idは必須です',
        code: ERROR_CODES.USER_ID_REQUIRED,
      },
    ])
  }

  const ownershipService = new OwnershipService(db)

  try {
    let ownershipsList

    if (isbn) {
      // Filter by ISBN and user_id (efficient database-level filtering)
      ownershipsList = await ownershipService.findByISBNAndUserId(isbn, user_id)
    } else if (location_id) {
      // Filter by location_id and user_id (efficient database-level filtering)
      const location_id_num = parseInt(location_id, 10)
      if (isNaN(location_id_num)) {
        throwValidationError([
          {
            field: 'location_id',
            message: '場所IDは数値である必要があります',
            code: ERROR_CODES.LOCATION_ID_INVALID,
          },
        ])
      }
      ownershipsList = await ownershipService.findByLocationIdAndUserId(location_id_num, user_id)
    } else {
      // List all for user
      ownershipsList = await ownershipService.findByUserId(user_id)
    }

    return c.json({ ownerships: ownershipsList })
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    throw new HTTPException(500, {
      message: JSON.stringify({
        error: {
          message: '所有情報一覧の取得に失敗しました',
          code: ERROR_CODES.LIST_OWNERSHIPS_ERROR,
        },
      }),
    })
  }
})

/**
 * POST /api/ownerships
 * Create a new ownership
 */
ownerships.post('/', async (c) => {
  const db = c.env.DB
  const body = await c.req.json<OwnershipCreateRequest>()

  // Validation
  const errors = validateRequired(body, ['user_id', 'isbn', 'location_id'])
  if (errors.length > 0) {
    throwValidationError(errors)
  }

  // Type-safe location_id conversion
  let location_id: number
  if (typeof body.location_id === 'number') {
    location_id = body.location_id
  } else if (typeof body.location_id === 'string') {
    location_id = parseInt(body.location_id, 10)
  } else {
    throwValidationError([
      {
        field: 'location_id',
        message: '場所IDは数値である必要があります',
        code: ERROR_CODES.LOCATION_ID_INVALID,
      },
    ])
  }

  if (isNaN(location_id) || location_id <= 0) {
    throwValidationError([
      {
        field: 'location_id',
        message: '場所IDは正の数値である必要があります',
        code: ERROR_CODES.LOCATION_ID_INVALID,
      },
    ])
  }

  const ownershipService = new OwnershipService(db)

  try {
    const ownership = await ownershipService.create({
      user_id: body.user_id,
      isbn: body.isbn,
      location_id: location_id,
    })

    return c.json(ownership, 201)
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    // Handle duplicate ownership - check for both Japanese message and UNIQUE constraint
    if (error instanceof Error) {
      const errorMessage = error.message
      // Check for duplicate ownership error messages (must check first before other conditions)
      // The error message from OwnershipService is: "この書籍は既にこの場所に登録されています"
      // Use more flexible matching to handle potential encoding issues
      if (
        (errorMessage.includes('既に') && errorMessage.includes('登録されています')) ||
        errorMessage.includes('UNIQUE constraint') ||
        errorMessage.includes('UNIQUE constraint failed') ||
        /UNIQUE.*constraint/i.test(errorMessage) ||
        /duplicate.*key/i.test(errorMessage)
      ) {
        throw new HTTPException(409, {
          message: JSON.stringify({
            error: {
              message: 'この書籍は既にこの場所に登録されています',
              code: ERROR_CODES.DUPLICATE_OWNERSHIP,
            },
          }),
        })
      }
      // Handle location ownership validation error
      if (errorMessage.includes('このユーザーのものではありません')) {
        throw new HTTPException(403, {
          message: JSON.stringify({
            error: {
              message: errorMessage,
              code: ERROR_CODES.LOCATION_OWNERSHIP_ERROR,
            },
          }),
        })
      }
      // Handle book not found error
      if (errorMessage.includes('書籍が見つかりません')) {
        throw new HTTPException(404, {
          message: JSON.stringify({
            error: {
              message: errorMessage,
              code: 'BOOK_NOT_FOUND',
            },
          }),
        })
      }
    }
    // If we get here, it's an unexpected error - log it and return 500
    console.error('Unexpected ownership creation error:', error)
    throw new HTTPException(500, {
      message: JSON.stringify({
        error: {
          message: '所有情報の作成に失敗しました',
          code: ERROR_CODES.CREATE_OWNERSHIP_ERROR,
        },
      }),
    })
  }
})

/**
 * DELETE /api/ownerships/:ownership_id
 * Delete ownership
 * Security: Validates that ownership belongs to the requesting user
 */
ownerships.delete('/:ownership_id', async (c) => {
  const db = c.env.DB
  const ownership_id = parseInt(c.req.param('ownership_id'), 10)
  const user_id = c.req.query('user_id') // user_id is required for ownership check

  if (isNaN(ownership_id)) {
    throwValidationError([
      {
        field: 'ownership_id',
        message: '所有IDは数値である必要があります',
        code: ERROR_CODES.OWNERSHIP_ID_INVALID,
      },
    ])
  }

  if (!user_id) {
    throwValidationError([
      {
        field: 'user_id',
        message: 'user_idは必須です',
        code: ERROR_CODES.USER_ID_REQUIRED,
      },
    ])
  }

  const ownershipService = new OwnershipService(db)

  try {
    // Security: Validate that ownership belongs to user
    const ownership = await ownershipService.findById(ownership_id)
    if (!ownership) {
      throw new HTTPException(404, {
        message: JSON.stringify({
          error: {
            message: '所有情報が見つかりません',
            code: ERROR_CODES.OWNERSHIP_NOT_FOUND,
          },
        }),
      })
    }

    // Security: Validate ownership belongs to user
    if (ownership.user_id !== user_id) {
      throw new HTTPException(403, {
        message: JSON.stringify({
          error: {
            message: 'この所有情報にアクセスする権限がありません',
            code: ERROR_CODES.OWNERSHIP_OWNERSHIP_ERROR,
          },
        }),
      })
    }

    await ownershipService.delete(ownership_id)
    return c.body(null, 204)
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    // Handle not found
    if (error instanceof Error && error.message.includes('見つかりません')) {
      throw new HTTPException(404, {
        message: JSON.stringify({
          error: {
            message: error.message,
            code: ERROR_CODES.OWNERSHIP_NOT_FOUND,
          },
        }),
      })
    }
    throw new HTTPException(500, {
      message: JSON.stringify({
        error: {
          message: '所有情報の削除に失敗しました',
          code: ERROR_CODES.DELETE_OWNERSHIP_ERROR,
        },
      }),
    })
  }
})

export { ownerships as ownershipsRoutes }


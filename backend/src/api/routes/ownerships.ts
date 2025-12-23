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
      },
    ])
  }

  const ownershipService = new OwnershipService(db)

  try {
    let ownerships

    if (isbn) {
      // Filter by ISBN
      ownerships = await ownershipService.findByISBN(isbn)
      // Filter by user_id as well (security: only return ownerships for the requesting user)
      ownerships = ownerships.filter((o) => o.user_id === user_id)
    } else if (location_id) {
      // Filter by location_id
      const location_id_num = parseInt(location_id, 10)
      if (isNaN(location_id_num)) {
        throwValidationError([
          {
            field: 'location_id',
            message: '場所IDは数値である必要があります',
          },
        ])
      }
      ownerships = await ownershipService.findByLocationId(location_id_num)
      // Filter by user_id as well (security: only return ownerships for the requesting user)
      ownerships = ownerships.filter((o) => o.user_id === user_id)
    } else {
      // List all for user
      ownerships = await ownershipService.findByUserId(user_id)
    }

    return c.json({ ownerships })
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    throw new HTTPException(500, {
      message: JSON.stringify({
        error: {
          message: '所有情報一覧の取得に失敗しました',
          code: 'LIST_OWNERSHIPS_ERROR',
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

  const location_id = typeof body.location_id === 'number' ? body.location_id : parseInt(body.location_id as string, 10)
  if (isNaN(location_id)) {
    throwValidationError([
      {
        field: 'location_id',
        message: '場所IDは数値である必要があります',
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
    // Handle duplicate ownership
    if (error instanceof Error && error.message.includes('既に登録されています')) {
      throw new HTTPException(409, {
        message: JSON.stringify({
          error: {
            message: error.message,
            code: 'DUPLICATE_OWNERSHIP',
          },
        }),
      })
    }
    // Handle location ownership validation error
    if (error instanceof Error && error.message.includes('このユーザーのものではありません')) {
      throw new HTTPException(403, {
        message: JSON.stringify({
          error: {
            message: error.message,
            code: 'LOCATION_OWNERSHIP_ERROR',
          },
        }),
      })
    }
    throw new HTTPException(500, {
      message: JSON.stringify({
        error: {
          message: '所有情報の作成に失敗しました',
          code: 'CREATE_OWNERSHIP_ERROR',
        },
      }),
    })
  }
})

/**
 * DELETE /api/ownerships/:ownership_id
 * Delete ownership
 */
ownerships.delete('/:ownership_id', async (c) => {
  const db = c.env.DB
  const ownership_id = parseInt(c.req.param('ownership_id'), 10)

  if (isNaN(ownership_id)) {
    throwValidationError([
      {
        field: 'ownership_id',
        message: '所有IDは数値である必要があります',
      },
    ])
  }

  const ownershipService = new OwnershipService(db)

  try {
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
            code: 'OWNERSHIP_NOT_FOUND',
          },
        }),
      })
    }
    throw new HTTPException(500, {
      message: JSON.stringify({
        error: {
          message: '所有情報の削除に失敗しました',
          code: 'DELETE_OWNERSHIP_ERROR',
        },
      }),
    })
  }
})

export { ownerships as ownershipsRoutes }


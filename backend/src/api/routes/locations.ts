/**
 * Locations API routes
 * Handles location CRUD operations
 */

import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { Env } from '../../types/db'
import { LocationService } from '../../services/location_service'
import { validateRequired, validateLength, throwValidationError } from '../middleware/validation'
import type { LocationCreateRequest, LocationUpdateRequest } from '../../types'

const locations = new Hono<{ Bindings: Env }>()

/**
 * GET /api/locations
 * List all locations for a user
 */
locations.get('/', async (c) => {
  const db = c.env.DB
  const user_id = c.req.query('user_id')

  if (!user_id) {
    throwValidationError([
      {
        field: 'user_id',
        message: 'user_idは必須です',
      },
    ])
  }

  const locationService = new LocationService(db)

  try {
    const locations = await locationService.findByUserId(user_id)
    return c.json({ locations })
  } catch (error) {
    throw new HTTPException(500, {
      message: JSON.stringify({
        error: {
          message: '場所一覧の取得に失敗しました',
          code: 'LIST_LOCATIONS_ERROR',
        },
      }),
    })
  }
})

/**
 * POST /api/locations
 * Create a new location
 */
locations.post('/', async (c) => {
  const db = c.env.DB
  const body = await c.req.json<LocationCreateRequest>()

  // Validation
  const errors = validateRequired(body, ['user_id', 'name', 'type'])
  if (errors.length > 0) {
    throwValidationError(errors)
  }

  const nameError = validateLength(body.name, 'name', 1, 100)
  if (nameError) {
    throwValidationError([nameError])
  }

  if (body.type !== 'Physical' && body.type !== 'Digital') {
    throwValidationError([
      {
        field: 'type',
        message: '場所の形式は "Physical" または "Digital" である必要があります',
      },
    ])
  }

  const locationService = new LocationService(db)

  try {
    const location = await locationService.create({
      user_id: body.user_id,
      name: body.name,
      type: body.type,
    })

    return c.json(location, 201)
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    // Handle duplicate location name
    if (error instanceof Error && error.message.includes('既に登録されています')) {
      throw new HTTPException(409, {
        message: JSON.stringify({
          error: {
            message: error.message,
            code: 'DUPLICATE_LOCATION',
          },
        }),
      })
    }
    throw new HTTPException(500, {
      message: JSON.stringify({
        error: {
          message: '場所の作成に失敗しました',
          code: 'CREATE_LOCATION_ERROR',
        },
      }),
    })
  }
})

/**
 * GET /api/locations/:location_id
 * Get location by ID
 */
locations.get('/:location_id', async (c) => {
  const db = c.env.DB
  const location_id = parseInt(c.req.param('location_id'), 10)

  if (isNaN(location_id)) {
    throwValidationError([
      {
        field: 'location_id',
        message: '場所IDは数値である必要があります',
      },
    ])
  }

  const locationService = new LocationService(db)

  try {
    const location = await locationService.findById(location_id)

    if (!location) {
      throw new HTTPException(404, {
        message: JSON.stringify({
          error: {
            message: '場所が見つかりません',
            code: 'LOCATION_NOT_FOUND',
          },
        }),
      })
    }

    return c.json(location)
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    throw new HTTPException(500, {
      message: JSON.stringify({
        error: {
          message: '場所の取得に失敗しました',
          code: 'GET_LOCATION_ERROR',
        },
      }),
    })
  }
})

/**
 * PUT /api/locations/:location_id
 * Update location
 */
locations.put('/:location_id', async (c) => {
  const db = c.env.DB
  const location_id = parseInt(c.req.param('location_id'), 10)
  const body = await c.req.json<LocationUpdateRequest>()

  if (isNaN(location_id)) {
    throwValidationError([
      {
        field: 'location_id',
        message: '場所IDは数値である必要があります',
      },
    ])
  }

  if (body.name !== undefined) {
    const nameError = validateLength(body.name, 'name', 1, 100)
    if (nameError) {
      throwValidationError([nameError])
    }
  }

  if (body.type !== undefined && body.type !== 'Physical' && body.type !== 'Digital') {
    throwValidationError([
      {
        field: 'type',
        message: '場所の形式は "Physical" または "Digital" である必要があります',
      },
    ])
  }

  const locationService = new LocationService(db)

  try {
    const location = await locationService.update(location_id, {
      name: body.name,
      type: body.type,
    })

    return c.json(location)
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    // Handle duplicate location name
    if (error instanceof Error && error.message.includes('既に登録されています')) {
      throw new HTTPException(409, {
        message: JSON.stringify({
          error: {
            message: error.message,
            code: 'DUPLICATE_LOCATION',
          },
        }),
      })
    }
    // Handle not found
    if (error instanceof Error && error.message.includes('見つかりません')) {
      throw new HTTPException(404, {
        message: JSON.stringify({
          error: {
            message: error.message,
            code: 'LOCATION_NOT_FOUND',
          },
        }),
      })
    }
    throw new HTTPException(500, {
      message: JSON.stringify({
        error: {
          message: '場所の更新に失敗しました',
          code: 'UPDATE_LOCATION_ERROR',
        },
      }),
    })
  }
})

/**
 * DELETE /api/locations/:location_id
 * Delete location
 */
locations.delete('/:location_id', async (c) => {
  const db = c.env.DB
  const location_id = parseInt(c.req.param('location_id'), 10)

  if (isNaN(location_id)) {
    throwValidationError([
      {
        field: 'location_id',
        message: '場所IDは数値である必要があります',
      },
    ])
  }

  const locationService = new LocationService(db)

  try {
    await locationService.delete(location_id)
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
            code: 'LOCATION_NOT_FOUND',
          },
        }),
      })
    }
    throw new HTTPException(500, {
      message: JSON.stringify({
        error: {
          message: '場所の削除に失敗しました',
          code: 'DELETE_LOCATION_ERROR',
        },
      }),
    })
  }
})

export { locations as locationsRoutes }


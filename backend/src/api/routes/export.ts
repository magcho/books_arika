/**
 * Export API Routes
 * Handles export of user data to JSON format
 */

import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { Env } from '../../types/db'
import { ExportService } from '../../services/export_service'
import { throwValidationError } from '../middleware/validation'

const exportRoutes = new Hono<{ Bindings: Env }>()

/**
 * GET /api/export
 * Export user data to JSON format
 */
exportRoutes.get('/', async (c) => {
  const db = c.env.DB
  const userId = c.req.query('user_id')

  if (!userId) {
    throwValidationError([
      {
        field: 'user_id',
        message: 'user_idは必須です',
      },
    ])
  }

  try {
    const exportService = new ExportService(db)
    const exportData = await exportService.exportUserData(userId!)

    // Set response headers for file download
    c.header('Content-Type', 'application/json; charset=utf-8')
    c.header(
      'Content-Disposition',
      `attachment; filename="books_export_${new Date().toISOString().split('T')[0]}.json"`
    )

    return c.json(exportData)
  } catch (error) {
    if (error instanceof Error) {
      throw new HTTPException(500, {
        message: JSON.stringify({
          error: {
            message: error.message,
            code: 'EXPORT_ERROR',
          },
        }),
      })
    }
    throw new HTTPException(500, {
      message: JSON.stringify({
        error: {
          message: 'エクスポートに失敗しました',
          code: 'EXPORT_ERROR',
        },
      }),
    })
  }
})

export { exportRoutes }


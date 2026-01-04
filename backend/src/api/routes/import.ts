/**
 * Import API routes
 * Handles data import with diff detection and merge functionality
 */

import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { Env } from '../../types/db'
import { ImportService } from '../../services/import_service'
import { validateRequired, throwValidationError } from '../middleware/validation'
import type { ImportApplyRequest } from '../../types/export_import'

const imports = new Hono<{ Bindings: Env }>()

/**
 * Handle JSON parse errors and convert to HTTPException
 * Returns true if error was handled (JSON parse error), false otherwise
 */
function handleJsonParseError(error: unknown): boolean {
  if (error instanceof SyntaxError || (error instanceof Error && error.message.includes('JSON'))) {
    throw new HTTPException(400, {
      message: JSON.stringify({
        error: {
          message: 'リクエストボディのJSON形式が正しくありません',
          code: 'INVALID_JSON',
        },
      }),
    })
  }
  return false
}

/**
 * Handle import file validation errors and convert to HTTPException
 */
function handleImportFileValidationError(error: unknown): never {
  if (error instanceof Error) {
    throw new HTTPException(400, {
      message: JSON.stringify({
        error: {
          message: error.message,
          code: 'INVALID_IMPORT_FILE',
        },
      }),
    })
  }
  throw error
}

/**
 * POST /api/import
 * Detect differences between imported data and existing database
 */
imports.post('/', async (c) => {
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

  const importService = new ImportService(db)
  let importData
  try {
    const body = await c.req.json()
    importData = importService.validateImportFile(body)
  } catch (error) {
    // Handle JSON parse errors first
    const isJsonError = handleJsonParseError(error)
    if (!isJsonError) {
      // If not a JSON parse error, handle import file validation errors
      handleImportFileValidationError(error)
    }
  }

  try {
    const diffResult = await importService.detectDiff(userId!, importData)

    return c.json(diffResult)
  } catch (error) {
    throw new HTTPException(500, {
      message: JSON.stringify({
        error: {
          message: '差分検出に失敗しました',
          code: 'DIFF_DETECTION_ERROR',
        },
      }),
    })
  }
})

/**
 * POST /api/import/apply
 * Apply import based on user selections
 */
imports.post('/apply', async (c) => {
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

  let body: ImportApplyRequest
  try {
    body = await c.req.json<ImportApplyRequest>()
  } catch (error) {
    // Handle JSON parse errors
    const isJsonError = handleJsonParseError(error)
    if (!isJsonError) {
      throw error
    }
  }

  // Validate request body
  const errors = validateRequired(body, ['selections', 'import_data'])
  if (errors.length > 0) {
    throwValidationError(errors)
  }

  if (!Array.isArray(body.selections)) {
    throwValidationError([
      {
        field: 'selections',
        message: 'selectionsは配列である必要があります',
      },
    ])
  }

  const importService = new ImportService(db)
  let importData
  try {
    importData = importService.validateImportFile(body.import_data as unknown)
  } catch (error) {
    // Handle import file validation errors
    handleImportFileValidationError(error)
  }

  try {
    const stats = await importService.applyImport(userId!, importData, body.selections)

    return c.json({
      message: 'インポートが完了しました',
      stats,
    })
  } catch (error) {
    if (error instanceof Error) {
      throw new HTTPException(500, {
        message: JSON.stringify({
          error: {
            message: error.message,
            code: 'IMPORT_APPLY_ERROR',
          },
        }),
      })
    }
    throw error
  }
})

export const importRoutes = imports


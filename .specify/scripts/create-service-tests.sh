#!/bin/bash
# サービス層テスト生成スクリプト
# 使用方法: ./create-service-tests.sh [SERVICE_NAME] [ENTITY_NAME]

set -e

SERVICE_NAME=${1:-""}
ENTITY_NAME=${2:-""}

if [ -z "$SERVICE_NAME" ] || [ -z "$ENTITY_NAME" ]; then
  echo "使用方法: $0 [SERVICE_NAME] [ENTITY_NAME]"
  echo "例: $0 LocationService Location"
  exit 1
fi

# ケバブケースに変換
ENTITY_LOWER=$(echo "$ENTITY_NAME" | sed 's/\([A-Z]\)/-\1/g' | tr '[:upper:]' '[:lower:]' | sed 's/^-//')
SERVICE_LOWER=$(echo "$SERVICE_NAME" | sed 's/\([A-Z]\)/-\1/g' | tr '[:upper:]' '[:lower:]' | sed 's/^-//')

echo "=== ${SERVICE_NAME} テストファイル生成 ==="

# 1. フィクスチャファイルの作成
FIXTURE_FILE="backend/tests/fixtures/${ENTITY_LOWER}s.ts"
echo "1. フィクスチャファイルを作成: $FIXTURE_FILE"

cat > "$FIXTURE_FILE" << EOF
/**
 * ${ENTITY_NAME} test fixtures
 * Mock ${ENTITY_NAME} data factories for backend testing
 */

import type { ${ENTITY_NAME}, ${ENTITY_NAME}CreateInput } from '../../src/models/${ENTITY_LOWER}'

/**
 * Create a mock ${ENTITY_NAME} with default values
 */
export function createMock${ENTITY_NAME}(overrides?: Partial<${ENTITY_NAME}>): ${ENTITY_NAME} {
  const now = new Date().toISOString()
  return {
    // TODO: デフォルト値を設定
    ...overrides,
  }
}

/**
 * Create a mock ${ENTITY_NAME} input for creation
 */
export function createMock${ENTITY_NAME}Input(overrides?: Partial<${ENTITY_NAME}CreateInput>): ${ENTITY_NAME}CreateInput {
  return {
    // TODO: デフォルト値を設定
    ...overrides,
  }
}
EOF

# 2. テストファイルの作成
TEST_FILE="backend/tests/unit/${SERVICE_LOWER}.test.ts"
echo "2. テストファイルを作成: $TEST_FILE"

cat > "$TEST_FILE" << EOF
/**
 * ${SERVICE_NAME} unit tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { D1Database } from '@cloudflare/workers-types'
import { ${SERVICE_NAME} } from '../../src/services/${SERVICE_LOWER}'
import { getTestDatabase, setupTestDatabase, cleanupTestDatabase } from '../helpers/db'
import { createMock${ENTITY_NAME}Input } from '../fixtures/${ENTITY_LOWER}s'

describe('${SERVICE_NAME}', () => {
  let db: D1Database
  let service: ${SERVICE_NAME}

  beforeEach(async () => {
    db = getTestDatabase()
    await setupTestDatabase(db)
    service = new ${SERVICE_NAME}(db)
  })

  afterEach(async () => {
    await cleanupTestDatabase(db)
  })

  describe('create', () => {
    it('should create a ${ENTITY_LOWER}', async () => {
      const input = createMock${ENTITY_NAME}Input()
      // TODO: テストを実装
    })

    it('should throw error when validation fails', async () => {
      // TODO: バリデーションテストを実装
    })
  })

  describe('findById', () => {
    it('should find ${ENTITY_LOWER} by ID', async () => {
      // TODO: テストを実装
    })

    it('should return null when ${ENTITY_LOWER} not found', async () => {
      // TODO: テストを実装
    })
  })

  // TODO: 他のメソッドのテストを追加
})
EOF

echo ""
echo "✅ テストファイルを作成しました"
echo ""
echo "次のステップ:"
echo "1. $FIXTURE_FILE のデフォルト値を設定"
echo "2. $TEST_FILE のテストケースを実装"
echo "3. テストを実行: cd backend && npm test -- --run"



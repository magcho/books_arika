# PRレビュー対応チェックリスト

このチェックリストは、PRレビュー後の対応を標準化するためのものです。

## 1. レビューコメントの確認

```bash
# PR番号を指定してレビューコメントを確認
PR_NUMBER=9
gh pr view $PR_NUMBER --comments
gh pr view $PR_NUMBER --json reviews --jq '.reviews[] | select(.state == "CHANGES_REQUESTED" or .state == "COMMENTED")'
```

## 2. レビュー対応の実施

### 2.1 ブランチの切り替え

```bash
# PRのブランチに切り替え
git checkout feature/[pr-branch-name]
```

### 2.2 コード修正

レビューコメントに基づいて以下を確認・修正：

- [ ] **セキュリティ**: 適切なバリデーションと所有権チェック
- [ ] **エラーハンドリング**: 適切なエラーメッセージと例外処理
- [ ] **トランザクション**: バッチ操作の整合性確保
- [ ] **コード品質**: 可読性、保守性の向上
- [ ] **パフォーマンス**: 不要なクエリの削減

### 2.3 修正のコミット

```bash
git add [修正したファイル]
git commit -m "fix([feature]): Address review comments for PR #${PR_NUMBER}

- [修正内容1]
- [修正内容2]
- [修正内容3]

Fixes: [レビューコメントの要約]"
```

## 3. テストの追加・更新

### 3.1 テストファイルの確認

```bash
# テストファイルが存在するか確認
find backend/tests -name "*[service-name]*.test.ts"
find frontend/tests -name "*[component-name]*.test.ts"
```

### 3.2 テストフィクスチャの作成（必要に応じて）

**場所**: `backend/tests/fixtures/` または `frontend/tests/fixtures/`

**テンプレート**:
```typescript
/**
 * [Entity] test fixtures
 * Mock [entity] data factories for [backend/frontend] testing
 */

import type { [Entity], [Entity]CreateInput } from '../../src/models/[entity]'

/**
 * Create a mock [entity] with default values
 */
export function createMock[Entity](overrides?: Partial<[Entity]>): [Entity] {
  const now = new Date().toISOString()
  return {
    // デフォルト値
    ...overrides,
  }
}

/**
 * Create a mock [entity] input for creation
 */
export function createMock[Entity]Input(overrides?: Partial<[Entity]CreateInput>): [Entity]CreateInput {
  return {
    // デフォルト値
    ...overrides,
  }
}
```

### 3.3 テストファイルの作成

**場所**: `backend/tests/unit/` または `frontend/tests/unit/`

**必須テストケース**:

#### サービス層（Backend）

- [ ] **CRUD操作**
  - [ ] create() - 正常系
  - [ ] create() - バリデーションエラー
  - [ ] create() - 重複チェック
  - [ ] findById() - 正常系
  - [ ] findById() - 存在しない場合
  - [ ] findByUserId() / findBy[Key]() - 正常系
  - [ ] findByUserId() / findBy[Key]() - 空の結果
  - [ ] update() - 正常系
  - [ ] update() - 存在しない場合
  - [ ] delete() - 正常系
  - [ ] delete() - 存在しない場合

- [ ] **バリデーション**
  - [ ] 必須フィールドのチェック
  - [ ] 文字数制限のチェック
  - [ ] 型のチェック（enum等）
  - [ ] 外部キー制約のチェック

- [ ] **セキュリティ**
  - [ ] 所有権チェック（ユーザーがリソースにアクセスできるか）
  - [ ] 権限チェック（必要に応じて）

- [ ] **エラーハンドリング**
  - [ ] 重複エラー
  - [ ] 外部キー制約エラー
  - [ ] 存在しないリソースエラー

- [ ] **バッチ操作**（該当する場合）
  - [ ] 正常系
  - [ ] 部分失敗時のロールバック
  - [ ] バリデーションエラー

#### コンポーネント層（Frontend）

- [ ] **レンダリング**
  - [ ] 正常な表示
  - [ ] ローディング状態
  - [ ] エラー状態
  - [ ] 空の状態

- [ ] **ユーザーインタラクション**
  - [ ] フォーム送信
  - [ ] ボタンクリック
  - [ ] 入力バリデーション

- [ ] **API連携**
  - [ ] 成功時の処理
  - [ ] エラー時の処理

**テストテンプレート**:
```typescript
/**
 * [Service/Component] unit tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { D1Database } from '@cloudflare/workers-types'
import { [Service] } from '../../src/services/[service]'
import { getTestDatabase, setupTestDatabase, cleanupTestDatabase } from '../helpers/db'
import { createMock[Entity]Input } from '../fixtures/[entity]'

describe('[Service]', () => {
  let db: D1Database
  let service: [Service]

  beforeEach(async () => {
    db = getTestDatabase()
    await setupTestDatabase(db)
    service = new [Service](db)
  })

  afterEach(async () => {
    await cleanupTestDatabase(db)
  })

  describe('[method]', () => {
    it('should [正常系の説明]', async () => {
      // Arrange
      // Act
      // Assert
    })

    it('should throw error when [エラーケースの説明]', async () => {
      // Arrange
      // Act & Assert
      await expect(service.[method]()).rejects.toThrow('[エラーメッセージ]')
    })
  })
})
```

### 3.4 テストの実行

```bash
# バックエンドテスト
cd backend
npm test -- --run

# フロントエンドテスト
cd frontend
npm test -- --run

# 特定のテストファイルのみ実行
npm test -- --run [test-file-path]
```

### 3.5 テストカバレッジの確認

```bash
# テスト結果の確認
npm test -- --run 2>&1 | grep -E "(Test Files|Tests|PASS|FAIL)"

# 特定のサービスのテスト数を確認
npm test -- --run --reporter=verbose 2>&1 | grep -E "[service-name]"
```

**目標カバレッジ**:
- 主要なCRUD操作: 100%
- バリデーション: 100%
- エラーハンドリング: 100%
- エッジケース: 可能な限りカバー

## 4. コミットとプッシュ

### 4.1 テストファイルのコミット

```bash
git add backend/tests/unit/[service].test.ts
git add backend/tests/fixtures/[entity].ts
git commit -m "test([feature]): Add comprehensive tests for [Service/Component]

- Add [Service] unit tests ([N] tests)
  - [機能1] tests
  - [機能2] tests
  - [機能3] tests

- Add test fixtures for [entity]
- All [total] tests passing

Improves test coverage for PR #${PR_NUMBER}"
```

### 4.2 プッシュ

```bash
git push origin feature/[pr-branch-name]
```

## 5. PRへのコメント（オプション）

レビュー対応が完了したことをPRにコメント：

```bash
gh pr comment $PR_NUMBER --body "✅ レビューコメントへの対応を完了しました。

### 実施した修正
- [修正内容1]
- [修正内容2]

### 追加したテスト
- [Service/Component] テスト: [N]テスト
- カバレッジ: [主要機能] 100%

すべてのテストが通過しています。再度レビューをお願いします。"
```

## 6. チェックリストの確認

PR対応完了前に以下を確認：

- [ ] すべてのレビューコメントに対応済み
- [ ] コード修正が完了し、コミット済み
- [ ] テストファイルを作成し、すべてのテストが通過
- [ ] テストカバレッジが十分（主要機能100%）
- [ ] リンターエラーがない
- [ ] 変更をプッシュ済み

## 7. PR別の対応内容

### PR #9: LocationService and OwnershipService

**実施した対応**:
1. ✅ 書籍存在チェックの追加
2. ✅ トランザクション処理の改善（バッチ操作）
3. ✅ 動的SQLクエリの可読性改善
4. ✅ LocationServiceテスト: 19テスト
5. ✅ OwnershipServiceテスト: 23テスト

**参考**: このPRの対応をテンプレートとして使用

---

## 使用方法

1. PR番号を指定: `PR_NUMBER=9`
2. ブランチ名を確認: `gh pr view $PR_NUMBER --json headRefName`
3. 上記チェックリストに従って対応
4. 各ステップでチェックボックスを確認



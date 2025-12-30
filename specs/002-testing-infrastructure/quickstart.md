# Quick Start Guide: 自動テスト基盤セットアップ

**Created**: 2025-12-22  
**Purpose**: テスト環境のセットアップとテスト実行方法

## Prerequisites

以下のソフトウェアがインストールされている必要があります：

- **Node.js**: 18.x 以上
- **npm** または **pnpm**: パッケージマネージャー
- **Git**: バージョン管理
- **Cloudflare アカウント**: D1データベースのテスト用（オプション）

## Initial Setup

### 1. 依存関係の確認

既に以下のパッケージがインストールされていることを確認：

**Backend**:
- `vitest`: テストランナー
- `@cloudflare/vitest-pool-workers`: Cloudflare Workers環境のテスト

**Frontend**:
- `vitest`: テストランナー
- `@testing-library/react`: Reactコンポーネントテスト
- `@testing-library/jest-dom`: DOMアサーション

```bash
# バックエンドの依存関係を確認
cd backend
npm list vitest @cloudflare/vitest-pool-workers

# フロントエンドの依存関係を確認
cd frontend
npm list vitest @testing-library/react @testing-library/jest-dom
```

### 2. Vitest設定ファイルの作成

#### Backend (backend/vitest.config.ts)

```typescript
import { defineWorkersProject } from '@cloudflare/vitest-pool-workers/config'

export default defineWorkersProject({
  test: {
    pool: '@cloudflare/vitest-pool-workers',
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.toml' },
        miniflare: {
          compatibilityDate: '2024-01-01',
        },
      },
    },
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: ['node_modules/', 'tests/', '*.config.ts'],
    },
  },
})
```

#### Frontend (frontend/vitest.config.ts)

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: ['node_modules/', 'tests/', '*.config.ts'],
    },
  },
})
```

### 3. テストディレクトリ構造の作成

```bash
# バックエンド
mkdir -p backend/tests/{unit,integration,helpers,fixtures}

# フロントエンド
mkdir -p frontend/tests/{unit,integration,helpers,fixtures}
```

### 4. テストセットアップファイルの作成

#### Frontend (frontend/tests/setup.ts)

```typescript
import '@testing-library/jest-dom'
```

## Running Tests

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

### Watch Mode

```bash
# バックエンド（ファイル変更を監視）
cd backend
npm test -- --watch

# フロントエンド（ファイル変更を監視）
cd frontend
npm test -- --watch
```

### Coverage Report

```bash
# バックエンド
cd backend
npm test -- --coverage

# フロントエンド
cd frontend
npm test -- --coverage
```

カバレッジレポートは `coverage/` ディレクトリに生成されます。

## Test Examples

### Backend Unit Test Example

```typescript
// backend/tests/unit/book_service.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { BookService } from '../../src/services/book_service'
import type { D1Database } from '@cloudflare/workers-types'

describe('BookService', () => {
  let db: D1Database
  let bookService: BookService

  beforeEach(() => {
    // テスト用のデータベースセットアップ
    // ...
    bookService = new BookService(db)
  })

  it('should create a book', async () => {
    const book = await bookService.create({
      title: 'Test Book',
      author: 'Test Author',
    })
    expect(book.title).toBe('Test Book')
  })
})
```

### Frontend Component Test Example

```typescript
// frontend/tests/unit/BookForm.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BookForm } from '../../src/components/BookForm/BookForm'

describe('BookForm', () => {
  it('should render book form', () => {
    render(<BookForm onSuccess={() => {}} defaultUserId="test-user" />)
    expect(screen.getByText('書籍登録')).toBeInTheDocument()
  })
})
```

## CI/CD Integration

### GitHub Actions Workflow

`.github/workflows/test.yml` を作成：

```yaml
name: Tests

on:
  pull_request:
  push:
    branches: [main]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: cd backend && npm ci
      - run: cd backend && npm test

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: cd frontend && npm ci
      - run: cd frontend && npm test
```

## Troubleshooting

### Cloudflare Workers環境でのテストが失敗する

- `wrangler.toml` の設定を確認
- `@cloudflare/vitest-pool-workers` のバージョンを確認
- 環境変数の設定を確認

### Reactコンポーネントのテストが失敗する

- `vitest.config.ts` で `@vitejs/plugin-react` が有効になっているか確認
- `tests/setup.ts` で `@testing-library/jest-dom` がインポートされているか確認

### カバレッジレポートが生成されない

- `vitest.config.ts` で `coverage.provider` が設定されているか確認
- `--coverage` フラグを付けてテストを実行しているか確認

## Next Steps

1. サンプルテストを作成して動作確認
2. CI/CDパイプラインを設定
3. テストカバレッジ目標（80%）を達成
4. テストユーティリティとヘルパー関数を作成

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [@cloudflare/vitest-pool-workers Documentation](https://github.com/cloudflare/vitest-pool-workers)
- [React Testing Library Documentation](https://testing-library.com/react)
- [Cloudflare Workers Testing Guide](https://developers.cloudflare.com/workers/testing/)



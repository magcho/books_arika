# Books Arika Frontend

Frontend application for Books Arika using React and Vite.

## Prerequisites

- Node.js 18+
- npm or pnpm

## Setup

1. Install dependencies:
```bash
npm install
```

## Development

Start development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage
```

Test coverage reports are generated in `coverage/` directory.

**Note**: 
- Test environment uses `happy-dom` instead of `jsdom` for better compatibility in CI/CD environments.
- Coverage generation is only available in local development environment. In CI/CD (GitHub Actions), coverage is disabled due to compatibility issues. Tests run without coverage in CI/CD to ensure compatibility.

### Test Structure

- `tests/unit/` - Unit tests for components and services
- `tests/integration/` - Integration tests for API integration
- `tests/helpers/` - Test helper functions
- `tests/fixtures/` - Test data fixtures

See `tests/README.md` for detailed testing documentation.

## Build

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Storybook

Storybookを使用してコンポーネントを個別に確認・開発できます。

### 起動

Storybookを起動:
```bash
npm run storybook
```

ブラウザで `http://localhost:6006` にアクセスしてコンポーネントを確認できます。

### ビルド

Storybookを静的ファイルとしてビルド:
```bash
npm run build-storybook
```

ビルド結果は `storybook-static/` ディレクトリに出力されます。

### 利用可能なコンポーネント

以下のコンポーネントがStorybookで確認できます:

- **BarcodeScanner**: バーコードスキャンコンポーネント
- **BookForm**: 書籍登録フォームコンポーネント
- **LocationManager**: 場所管理コンポーネント

各コンポーネントには、様々な状態（デフォルト、ローディング、エラーなど）のストーリーが定義されています。

### 機能

- **MSWによるAPIモック**: 外部APIに依存するコンポーネントは、MSWを使用してモックされています
- **MemoryRouter統合**: react-router-domに依存するコンポーネントは、MemoryRouterでラップされています
- **インタラクティブテスト**: 各コンポーネントには、ユーザー操作をシミュレートするインタラクティブなストーリーが含まれています


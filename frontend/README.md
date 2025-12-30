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

## Visual Regression Testing (VRT)

Storybookストーリーの視覚的回帰テストを実行できます。

### ローカル環境での実行

初回実行（ベースライン作成）:
```bash
npm run vrt
```

通常の実行（差分検出）:
```bash
npm run vrt
```

### 使用方法

- **初回実行**: ベースラインが自動的に作成されます
- **通常実行**: 変更がない場合、テストは成功します。変更がある場合、差分が検出され、レポートが生成されます
- **差分レポート**: `.reg/diff/`ディレクトリに差分画像が保存されます

### CI/CD統合

PR作成時に自動的にVRTが実行されます。差分が検出された場合、PRのマージがブロックされます。

- **ベースライン**: GitHub Actions Artifactsに保存され、次回実行時に取得されます
- **結果**: VRTの実行結果はArtifactsに保存され、確認できます

### トラブルシューティング

- **スクリーンショットが取得できない**: Storybookが起動していることを確認してください
- **差分が誤検出される**: `regconfig.json`の`threshold`を調整してください
- **ベースラインが存在しない**: 初回実行時に自動的に作成されます


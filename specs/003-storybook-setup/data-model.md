# Data Model: Frontend Storybook Setup

**Feature**: Frontend Storybook Setup  
**Date**: 2024-12-19

## Overview

Storybookは開発ツールであるため、従来のデータモデルとは異なるが、設定構造とストーリー構造を定義する。

## Configuration Structure

### Storybook Main Configuration (`.storybook/main.ts`)

```typescript
interface StorybookConfig {
  stories: string[]                    // ストーリーファイルの検出パス
  addons: string[]                     // 使用するアドオンのリスト
  framework: {
    name: string                       // 'storybook-react-vite'
    options: object                    // フレームワーク固有のオプション
  }
  core: {
    builder: string                    // '@storybook/builder-vite'
  }
  viteFinal?: (config: ViteConfig) => ViteConfig  // Vite設定のカスタマイズ
}
```

**Fields**:
- `stories`: ストーリーファイルの検出パターン（例: `['../src/**/*.stories.@(js|jsx|ts|tsx)']`）
- `addons`: 使用するアドオンのリスト（例: `['@storybook/addon-essentials', '@storybook/addon-interactions', '@storybook/addon-msw']`）
- `framework.name`: `'storybook-react-vite'`（Viteビルダーを使用）
- `core.builder`: `'@storybook/builder-vite'`（Viteビルダー）

### Storybook Preview Configuration (`.storybook/preview.ts`)

```typescript
interface PreviewConfig {
  parameters: {
    msw?: {
      handlers: RequestHandler[]        // MSWハンドラー（APIモック）
    }
    actions?: {
      argTypesRegex: string            // アクションの自動検出パターン
    }
  }
  decorators: Decorator[]               // グローバルデコレーター
}
```

**Fields**:
- `parameters.msw.handlers`: MSWハンドラーの配列（APIリクエストのモック）
- `parameters.actions.argTypesRegex`: アクション（イベントハンドラー）の自動検出パターン
- `decorators`: グローバルデコレーター（例: MemoryRouterでラップ）

## Story Structure

### Component Story File (`*.stories.tsx`)

```typescript
interface StoryMeta {
  title: string                       // ストーリーのタイトル（階層構造）
  component: React.ComponentType      // 対象コンポーネント
  parameters?: object                  // ストーリー固有のパラメータ
  decorators?: Decorator[]            // ストーリー固有のデコレーター
  argTypes?: ArgTypes                  // プロパティの型定義とコントロール
}

interface Story {
  name: string                         // ストーリー名
  args?: object                       // コンポーネントのprops
  parameters?: object                 // ストーリー固有のパラメータ
  decorators?: Decorator[]            // ストーリー固有のデコレーター
  play?: (context: PlayFunctionContext) => Promise<void>  // インタラクションテスト
}
```

**Fields**:
- `title`: ストーリーのタイトル（例: `'Components/BarcodeScanner'`）
- `component`: 対象のReactコンポーネント
- `parameters`: ストーリー固有のパラメータ（MSWハンドラー、背景色など）
- `decorators`: ストーリー固有のデコレーター（ルーター、プロバイダーなど）
- `argTypes`: プロパティの型定義とコントロール（Storybook UIで編集可能）
- `args`: コンポーネントに渡すpropsのデフォルト値
- `play`: インタラクションテスト（ユーザー操作のシミュレーション）

## Story Types per Component

### BarcodeScanner Stories

1. **Default**: 初期状態（スキャン開始前）
   - `isScanning: false`
   - `manualISBN: ''`
   - `onScan`, `onError`, `onClose`はモック関数

2. **Scanning**: スキャン中（カメラアクセス中）
   - `isScanning: true`
   - モックビデオ要素を表示

3. **ManualInput**: 手動入力モード
   - `manualISBN: '9781234567890'`
   - 入力フィールドに値が入った状態

### BookForm Stories

1. **Default**: 初期状態（検索モード）
   - `mode: 'search'`
   - `searchQuery: ''`
   - `searchResults: []`
   - `selectedBook: null`

2. **SearchResults**: 検索結果表示
   - `mode: 'search'`
   - `searchResults: [mockBook1, mockBook2, ...]`
   - `selectedBook: null`

3. **BookSelected**: 書籍選択済み
   - `mode: 'search'`
   - `selectedBook: mockBook1`
   - `selectedLocationIds: []`

4. **ManualMode**: 手動登録モード
   - `mode: 'manual'`
   - `manualBook: { title: '...', author: '...', isbn: '...', is_doujin: false }`

5. **Loading**: ローディング状態
   - `isSearching: true` または `isSubmitting: true`

6. **Error**: エラー状態
   - `error: 'エラーメッセージ'`

### LocationManager Stories

1. **Empty**: 空の状態（場所が登録されていない）
   - `locations: []`
   - `isLoading: false`

2. **WithLocations**: 場所一覧表示
   - `locations: [mockLocation1, mockLocation2, ...]`
   - `isLoading: false`

3. **Loading**: ローディング状態
   - `isLoading: true`
   - `locations: []`

4. **Editing**: 編集モード
   - `editingId: 1`
   - `locations: [mockLocation1, ...]`

5. **Error**: エラー状態
   - `error: 'エラーメッセージ'`
   - `locations: [mockLocation1, ...]`

## Mock Data Structure

### Mock Book Data

```typescript
interface MockBook {
  title: string
  author: string
  isbn: string
  thumbnail_url?: string
}
```

### Mock Location Data

```typescript
interface MockLocation {
  id: number
  name: string
  type: 'Physical' | 'Digital'
  user_id: string
}
```

### Mock API Responses

```typescript
interface MockAPIResponse {
  // Book Search Response
  items: MockBook[]
  
  // Location List Response
  locations: MockLocation[]
}
```

## Validation Rules

- ストーリーファイルは対応するコンポーネントと同じディレクトリに配置する
- ストーリーファイル名は `ComponentName.stories.tsx` 形式とする
- 各コンポーネントに対して、少なくとも3つの異なる状態のストーリーを定義する
- モックデータは `fixtures/` ディレクトリに配置し、再利用可能にする
- 外部APIに依存するコンポーネントは、MSWハンドラーでモックする

## State Transitions

### BarcodeScanner State Flow

```
Initial → Scanning → Manual Input
   ↓         ↓            ↓
  Close    Stop        Submit
```

### BookForm State Flow

```
Search Mode → Search Results → Book Selected → Submit
     ↓
Manual Mode → Form Filled → Submit
     ↓
Barcode Mode → ISBN Scanned → Manual Mode
```

### LocationManager State Flow

```
Loading → Empty/WithLocations
            ↓
         Editing → Updated
            ↓
         Delete → Confirmed
```



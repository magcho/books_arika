# Quickstart: Frontend Storybook Setup

**Feature**: Frontend Storybook Setup  
**Date**: 2024-12-19

## Prerequisites

- Node.js 18以上
- npm または pnpm
- 既存のfrontendプロジェクト（React + Vite + TypeScript）

## Installation

### 1. Storybookの初期化

```bash
cd frontend
npx storybook@latest init
```

初期化時に以下の選択を行う：
- **Framework**: React
- **Builder**: Vite（推奨）
- **TypeScript**: Yes
- **Essential addons**: Yes（@storybook/addon-essentials）
- **Additional addons**: 
  - @storybook/addon-interactions（インタラクションテスト用）
  - @storybook/addon-msw（APIモック用）

### 2. 追加パッケージのインストール

```bash
npm install --save-dev @storybook/addon-msw msw
```

### 3. 設定ファイルの確認

以下のファイルが作成されることを確認：
- `.storybook/main.ts` - Storybookのメイン設定
- `.storybook/preview.ts` - グローバルデコレーターとパラメータ

## Configuration

### `.storybook/main.ts` の設定

```typescript
import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-msw',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  core: {
    builder: '@storybook/builder-vite',
  },
}

export default config
```

### `.storybook/preview.ts` の設定

```typescript
import type { Preview } from '@storybook/react'
import { MemoryRouter } from 'react-router-dom'
import { initialize, mswDecorator } from 'msw-storybook-addon'

// MSWの初期化
initialize()

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    msw: {
      handlers: [], // デフォルトのハンドラー（各ストーリーで上書き可能）
    },
  },
  decorators: [
    // MemoryRouterでラップ（react-router-dom依存コンポーネント用）
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
    // MSWデコレーター（APIモック用）
    mswDecorator,
  ],
}

export default preview
```

## Creating Stories

### 基本的なストーリーファイル構造

各コンポーネントのディレクトリに `ComponentName.stories.tsx` を作成：

```typescript
import type { Meta, StoryObj } from '@storybook/react'
import { ComponentName } from './ComponentName'

const meta: Meta<typeof ComponentName> = {
  title: 'Components/ComponentName',
  component: ComponentName,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof ComponentName>

export const Default: Story = {
  args: {
    // コンポーネントのprops
  },
}
```

### 例: BarcodeScanner.stories.tsx

```typescript
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { BarcodeScanner } from './BarcodeScanner'

const meta: Meta<typeof BarcodeScanner> = {
  title: 'Components/BarcodeScanner',
  component: BarcodeScanner,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof BarcodeScanner>

export const Default: Story = {
  args: {
    onScan: fn(),
    onError: fn(),
    onClose: fn(),
  },
}

export const Scanning: Story = {
  args: {
    onScan: fn(),
    onError: fn(),
    onClose: fn(),
  },
  // カメラAPIをモック
  parameters: {
    msw: {
      handlers: [],
    },
  },
}
```

## Running Storybook

### 開発モードで起動

```bash
npm run storybook
```

ブラウザで `http://localhost:6006` が自動的に開きます。

### ビルド（静的ファイル生成）

```bash
npm run build-storybook
```

ビルド結果は `storybook-static/` ディレクトリに出力されます。

### package.json にスクリプトを追加

```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

## Usage

### コンポーネントの確認

1. Storybookを起動
2. 左側のサイドバーからコンポーネントを選択
3. 中央のキャンバスでコンポーネントを確認
4. 下部のコントロールパネルでプロパティを変更

### インタラクションテスト

ストーリーに `play` 関数を追加することで、ユーザー操作をシミュレート：

```typescript
import { expect, userEvent, within } from '@storybook/test'

export const Interactive: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: /検索/i })
    await userEvent.click(button)
    await expect(canvas.getByText('検索中...')).toBeInTheDocument()
  },
}
```

### APIモックの使用

各ストーリーでMSWハンドラーを設定：

```typescript
import { http, HttpResponse } from 'msw'

export const WithData: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/books', () => {
          return HttpResponse.json({
            items: [
              { title: 'Book 1', author: 'Author 1', isbn: '9781234567890' },
            ],
          })
        }),
      ],
    },
  },
}
```

## Troubleshooting

### ポートが既に使用されている場合

```bash
npm run storybook -- -p 6007
```

### Vite設定の競合

`.storybook/main.ts` の `viteFinal` で既存のVite設定をマージ：

```typescript
import { mergeConfig } from 'vite'
import viteConfig from '../vite.config'

export default {
  // ... 他の設定
  async viteFinal(config) {
    return mergeConfig(config, viteConfig)
  },
}
```

### 型エラーが発生する場合

`tsconfig.json` にStorybookの型定義を追加：

```json
{
  "compilerOptions": {
    "types": ["@storybook/react"]
  }
}
```

## Next Steps

1. 各コンポーネントのストーリーファイルを作成
2. モックデータを `fixtures/` ディレクトリに配置
3. MSWハンドラーを設定してAPIをモック
4. インタラクションテストを追加


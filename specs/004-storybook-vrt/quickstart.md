# Quick Start: Storybook Visual Regression Testing

**Feature**: 004-storybook-vrt  
**Date**: 2024-12-19

## 概要

StorybookストーリーのVRT（Visual Regression Testing）をローカル環境で実行するためのクイックスタートガイド。

## 前提条件

- Node.js 18+
- Storybook 7.x系がセットアップ済み
- 既存のStorybookストーリーが存在する

## セットアップ

### 1. 依存関係のインストール

```bash
cd frontend
npm install --save-dev @storybook/test-runner reg-suit playwright
```

### 2. 設定ファイルの作成

#### `.storybook/test-runner.ts`

```typescript
import type { TestRunnerConfig } from '@storybook/test-runner';

const config: TestRunnerConfig = {
  setup: () => {
    // セットアップ処理（必要に応じて）
  },
  postVisit: async (page, context) => {
    // スクリーンショット取得
    await page.waitForTimeout(1000); // レンダリング完了待機
    await page.screenshot({
      path: `screenshots/actual/${context.id}.png`,
      fullPage: true,
    });
  },
  tags: ['vrt'],
};

export default config;
```

#### `regconfig.json`

```json
{
  "core": {
    "workingDir": ".reg",
    "actualDir": "screenshots/actual",
    "expectedDir": ".reg/expected",
    "diffDir": ".reg/diff"
  },
  "plugins": {
    "reg-keygen-git-hash-plugin": {}
  },
  "threshold": 0.01
}
```

### 3. package.jsonにスクリプトを追加

```json
{
  "scripts": {
    "test-storybook": "test-storybook",
    "test-storybook:ci": "test-storybook --ci",
    "reg-suit": "reg-suit",
    "vrt": "npm run test-storybook:ci && npm run reg-suit"
  }
}
```

### 4. .gitignoreに追加

```
# reg-suit
.reg/
screenshots/actual/
screenshots/diff/
```

## 使用方法

### 初回実行（ベースライン作成）

```bash
npm run vrt
```

初回実行時は、ベースラインが自動的に作成されます。

### 通常の実行（差分検出）

```bash
npm run vrt
```

変更がない場合、テストは成功します。変更がある場合、差分が検出され、レポートが生成されます。

### ベースラインの更新

意図的な変更後、ベースラインを更新する場合：

```bash
# 自動更新オプションを使用（設定で有効化）
npm run vrt -- --update-baseline

# または手動で更新
cp screenshots/actual/* .reg/expected/
```

## ディレクトリ構造

```
frontend/
├── .storybook/
│   └── test-runner.ts      # @storybook/test-runner設定
├── .reg/                    # reg-suit作業ディレクトリ
│   ├── expected/            # ベースライン
│   └── diff/                # 差分画像
├── screenshots/             # スクリーンショット保存ディレクトリ
│   └── actual/              # 実際のスクリーンショット
└── regconfig.json           # reg-suit設定
```

## トラブルシューティング

### スクリーンショットが取得できない

- Storybookが起動していることを確認
- ポート番号が正しいことを確認（デフォルト: 6006）
- ブラウザがインストールされていることを確認（Playwrightが自動的にインストール）

### 差分が誤検出される

- 閾値を調整（`regconfig.json`の`threshold`を変更）
- 待機時間を調整（`test-runner.ts`の`waitForTimeout`を変更）

### ベースラインが存在しない

- 初回実行時に自動的に作成される
- 手動で作成する場合: `npm run test-storybook:ci`を実行後、`cp screenshots/actual/* .reg/expected/`

## 次のステップ

- [data-model.md](./data-model.md) - データモデルの詳細
- [research.md](./research.md) - 技術選定の詳細
- [plan.md](./plan.md) - 実装計画の詳細



# Data Model: Storybook Visual Regression Testing

**Feature**: 004-storybook-vrt  
**Date**: 2024-12-19

## Overview

VRT（Visual Regression Testing）で使用するデータ構造と設定ファイルの定義。スクリーンショット、ベースライン、差分レポートの管理方法を定義する。

## Entities

### Screenshot（スクリーンショット）

各Storybookストーリーの視覚的な状態を記録した画像。

**属性**:
- `storyId`: string - ストーリーID（例: `ComponentName--Default`）
- `filePath`: string - ファイルパス（例: `screenshots/actual/ComponentName--Default.png`）
- `timestamp`: number - 取得日時（Unix timestamp）
- `width`: number - 画像の幅（ピクセル）
- `height`: number - 画像の高さ（ピクセル）

**識別子**: `storyId`をファイル名として使用

**保存場所**:
- 実際のスクリーンショット: `screenshots/actual/`
- ベースライン: `.reg/expected/`
- 差分画像: `.reg/diff/`

### Baseline（ベースライン）

承認された正しい状態のスクリーンショット。比較の基準として使用。

**属性**:
- `storyId`: string - ストーリーID
- `filePath`: string - ファイルパス（例: `.reg/expected/ComponentName--Default.png`）
- `version`: string - バージョン（Gitハッシュまたはタグ）
- `createdAt`: number - 作成日時（Unix timestamp）
- `updatedAt`: number - 更新日時（Unix timestamp）

**識別子**: `storyId` + `version`

**保存場所**:
- ローカル環境: `.reg/expected/`
- CI環境: GitHub Actions Artifacts

**ライフサイクル**:
1. 初回実行時に自動的に作成
2. 意図的な変更後、手動または自動更新オプションで更新
3. CI環境ではArtifactsに保存して共有

### DiffReport（差分レポート）

視覚的な変更を記録したレポート。変更前画像、変更後画像、差分画像を含む。

**属性**:
- `storyId`: string - ストーリーID
- `baselinePath`: string - ベースライン画像のパス
- `actualPath`: string - 実際のスクリーンショットのパス
- `diffPath`: string - 差分画像のパス
- `threshold`: number - 差分検出の閾値（デフォルト: 0.01）
- `diffRatio`: number - 差分の割合（0.0 - 1.0）
- `detectedAt`: number - 検出日時（Unix timestamp）

**識別子**: `storyId` + `detectedAt`

**保存場所**: `.reg/diff/`

## Configuration Files

### test-runner.ts

@storybook/test-runnerの設定ファイル。

**構造**:
```typescript
{
  setup: () => {
    // セットアップ処理
  },
  preVisit: async (page, context) => {
    // ストーリー訪問前の処理
  },
  postVisit: async (page, context) => {
    // スクリーンショット取得
    await page.screenshot({
      path: `screenshots/actual/${context.id}.png`,
      fullPage: true
    });
  },
  tags: ['vrt']
}
```

**設定項目**:
- `screenshotDir`: string - スクリーンショット保存先（デフォルト: `screenshots/actual/`）
- `waitFor`: number - レンダリング完了待機時間（ミリ秒）
- `fullPage`: boolean - 全ページキャプチャ（デフォルト: true）

### regconfig.json

reg-suitの設定ファイル。

**構造**:
```json
{
  "core": {
    "workingDir": ".reg",
    "actualDir": "screenshots/actual",
    "expectedDir": ".reg/expected",
    "diffDir": ".reg/diff"
  },
  "plugins": {
    "reg-keygen-git-hash-plugin": {},
    "reg-notify-github-plugin": {
      "enabled": false
    }
  },
  "threshold": 0.01
}
```

**設定項目**:
- `workingDir`: string - 作業ディレクトリ（デフォルト: `.reg`）
- `actualDir`: string - 実際のスクリーンショットの保存先
- `expectedDir`: string - ベースラインの保存先
- `diffDir`: string - 差分画像の保存先
- `threshold`: number - 差分検出の閾値（デフォルト: 0.01 = 1%）

### package.json scripts

VRT実行用のスクリプト。

**追加スクリプト**:
- `test-storybook`: Storybookを起動してテスト実行
- `test-storybook:ci`: CI環境用（ヘッドレスモード）
- `reg-suit`: reg-suitで差分検出とレポート生成
- `vrt`: VRT全体の実行（test-storybook:ci + reg-suit）

## File Structure

```
frontend/
├── .storybook/
│   └── test-runner.ts      # @storybook/test-runner設定
├── .reg/                    # reg-suit作業ディレクトリ
│   ├── expected/            # ベースライン
│   └── diff/                # 差分画像
├── screenshots/             # スクリーンショット保存ディレクトリ
│   └── actual/              # 実際のスクリーンショット
├── regconfig.json           # reg-suit設定
└── package.json             # 依存関係とスクリプト
```

## Validation Rules

### Screenshot

- `storyId`は必須で、StorybookのストーリーID形式に準拠する必要がある
- ファイル形式はPNG形式
- 画像サイズは自動的に決定される

### Baseline

- `storyId`は必須
- `version`はGitハッシュまたはタグ形式
- ファイルは存在する必要がある

### DiffReport

- `diffRatio`が`threshold`を超えた場合、差分が検出されたとみなす
- すべてのパス（baselinePath、actualPath、diffPath）は必須

## State Transitions

### Baseline Lifecycle

1. **初回作成**: 初回実行時に自動的に作成
2. **更新**: 意図的な変更後、手動または自動更新オプションで更新
3. **共有**: CI環境ではArtifactsに保存して共有

### DiffReport Lifecycle

1. **検出**: 差分が検出された場合、レポートを生成
2. **保存**: 差分画像を`.reg/diff/`に保存
3. **確認**: 開発者がレポートを確認し、意図的な変更か不具合かを判断

## Integration Points

### GitHub Actions Artifacts

- ベースラインをArtifactsに保存
- 次回実行時にArtifactsから取得
- Artifactsの保持期間: 30日（GitHub Actionsのデフォルト）

### Storybook Integration

- StorybookのストーリーIDをスクリーンショットのファイル名として使用
- Storybookのビルド結果を使用してスクリーンショットを取得



# Research: Frontend Storybook Setup

**Date**: 2024-12-19  
**Feature**: Frontend Storybook Setup  
**Purpose**: Storybookのセットアップ方法、Viteとの統合、Reactコンポーネントのストーリー定義方法を調査

## Research Questions

### 1. StorybookのバージョンとVite統合

**Question**: React + ViteプロジェクトにStorybookをセットアップする最適な方法は？

**Decision**: Storybook 7.x系（最新安定版）を使用し、Viteビルダーを採用する。

**Rationale**:
- Storybook 7.xはViteをネイティブサポートしており、Viteプロジェクトとの統合が容易
- `@storybook/vite`パッケージを使用することで、既存のVite設定を活用できる
- 起動速度が速く、開発体験が良い
- TypeScriptの型安全性が維持される

**Alternatives considered**:
- Storybook 6.x: Viteサポートが限定的で、Webpackベースの設定が必要
- カスタムビルド設定: メンテナンスコストが高く、標準的なアプローチではない

**References**:
- [Storybook for Vite](https://storybook.js.org/docs/get-started/install)
- [Storybook Vite Builder](https://storybook.js.org/docs/react/builders/vite)

### 2. 外部API依存コンポーネントのモック戦略

**Question**: BookFormやLocationManagerなど、外部APIに依存するコンポーネントをStorybookで表示する方法は？

**Decision**: MSW (Mock Service Worker) または Storybookの`parameters.msw`を使用してAPIリクエストをモックする。

**Rationale**:
- MSWはブラウザとNode.jsの両方で動作し、実際のHTTPリクエストをインターセプトできる
- Storybookの`@storybook/addon-msw`を使用することで、ストーリーごとに異なるモックレスポンスを設定できる
- 既存のテスト環境（Vitest）でもMSWを使用できるため、一貫性が保たれる
- モックデータをfixturesとして管理し、再利用可能にする

**Alternatives considered**:
- コンポーネントのpropsでモック関数を注入: コンポーネントのコードを変更する必要があり、仕様に違反
- 実際のAPIを呼び出す: 開発環境に依存し、Storybookの独立性が損なわれる

**References**:
- [MSW with Storybook](https://mswjs.io/docs/getting-started/integrate/browser)
- [Storybook MSW Addon](https://storybook.js.org/addons/@storybook/addon-msw)

### 3. ルーティング依存コンポーネントの対応

**Question**: react-router-domに依存するコンポーネントをStorybookで表示する方法は？

**Decision**: Storybookの`decorators`を使用して、`MemoryRouter`でコンポーネントをラップする。

**Rationale**:
- `MemoryRouter`はブラウザの履歴に依存せず、Storybook環境で動作する
- グローバルデコレーターとして設定することで、すべてのストーリーで自動的に適用される
- ストーリーごとに異なるルートを設定することも可能
- 既存のコンポーネントコードを変更する必要がない

**Alternatives considered**:
- `BrowserRouter`を使用: ブラウザの履歴に依存し、Storybook環境では動作しない
- ルーティング依存を削除: コンポーネントのコードを変更する必要があり、仕様に違反

**References**:
- [React Router Testing](https://reactrouter.com/en/main/start/testing)
- [Storybook Decorators](https://storybook.js.org/docs/react/writing-stories/decorators)

### 4. カメラAPI依存コンポーネント（BarcodeScanner）の対応

**Question**: `navigator.mediaDevices.getUserMedia`に依存するBarcodeScannerコンポーネントをStorybookで表示する方法は？

**Decision**: Storybook環境では、カメラAPIをモックし、代替UI（モックビデオ要素またはプレースホルダー）を表示する。

**Rationale**:
- Storybook環境では実際のカメラアクセスは不可能または制限される
- `navigator.mediaDevices.getUserMedia`をモックすることで、コンポーネントの他の部分（UI、状態管理など）を確認できる
- モックビデオ要素またはプレースホルダーを表示することで、コンポーネントの見た目を確認できる
- 実際のカメラ機能のテストは、統合テストやE2Eテストで行う

**Alternatives considered**:
- 実際のカメラを使用: Storybook環境では動作しない、またはユーザーの許可が必要で開発体験が悪い
- コンポーネントを変更: 仕様に違反する

**References**:
- [Mocking Browser APIs in Storybook](https://storybook.js.org/docs/react/writing-stories/decorators)

### 5. ストーリー定義の構造とベストプラクティス

**Question**: 各コンポーネントに対して、どのようなストーリーを定義すべきか？

**Decision**: 各コンポーネントに対して、以下のストーリーを定義する：
1. **Default/DefaultState**: デフォルトの状態（初期状態）
2. **LoadingState**: ローディング状態（該当する場合）
3. **ErrorState**: エラー状態（該当する場合）
4. **EmptyState**: 空の状態（データがない場合）
5. **WithData**: データがある状態（正常系）
6. **Interactive**: インタラクティブな操作が可能な状態

**Rationale**:
- コンポーネントの様々な状態を網羅的に確認できる
- 仕様の要件（各コンポーネント3つ以上のストーリー）を満たす
- 開発者がコンポーネントの動作を理解しやすい
- デザイナーやQA担当者もコンポーネントの動作を確認できる

**Alternatives considered**:
- 最小限のストーリーのみ: コンポーネントの状態を十分に確認できない
- 過剰なストーリー: メンテナンスコストが高くなる

**References**:
- [Writing Stories](https://storybook.js.org/docs/react/writing-stories/introduction)
- [Component Story Format](https://storybook.js.org/docs/react/api/csf)

## Technical Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Storybook Version | 7.x系（最新安定版） | Viteネイティブサポート、高速起動 |
| Vite Integration | `@storybook/vite` | 既存のVite設定を活用 |
| API Mocking | MSW + `@storybook/addon-msw` | 実際のHTTPリクエストをインターセプト、テスト環境との一貫性 |
| Routing | `MemoryRouter` decorator | ブラウザ履歴に依存しない、コード変更不要 |
| Camera API | Mock `getUserMedia` | Storybook環境での制限に対応、UI確認可能 |
| Story Structure | 状態ベース（Default, Loading, Error, Empty, WithData, Interactive） | コンポーネントの状態を網羅的に確認 |

## Dependencies to Add

```json
{
  "devDependencies": {
    "@storybook/react": "^7.x.x",
    "@storybook/react-vite": "^7.x.x",
    "@storybook/addon-essentials": "^7.x.x",
    "@storybook/addon-interactions": "^7.x.x",
    "@storybook/addon-msw": "^2.x.x",
    "@storybook/test": "^7.x.x",
    "msw": "^2.x.x"
  }
}
```

## Configuration Files

- `.storybook/main.ts`: Storybookの設定（Viteビルダー、アドオン、ストーリーの検出パス）
- `.storybook/preview.ts`: グローバルデコレーター（MemoryRouter、MSW）、パラメータ設定

## Next Steps

1. Storybookのインストールと初期設定
2. グローバルデコレーターの設定（MemoryRouter、MSW）
3. 各コンポーネントのストーリーファイル作成
4. package.jsonにStorybook起動・ビルドスクリプトを追加



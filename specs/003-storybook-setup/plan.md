# Implementation Plan: Frontend Storybook Setup

**Branch**: `003-storybook-setup` | **Date**: 2024-12-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-storybook-setup/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

フロントエンドプロジェクトにStorybookをセットアップし、既存のReactコンポーネント（BarcodeScanner、BookForm、LocationManager）をStorybook環境で表示・操作できるようにする。開発者がアプリケーション全体を起動せずに個別のコンポーネントを確認・検証できる開発環境を構築する。

## Technical Context

**Language/Version**: TypeScript 5.3.0  
**Primary Dependencies**: React 18.2.0, Vite 5.0.8, Storybook 7.x系（@storybook/react-vite）  
**Storage**: N/A (開発ツール)  
**Testing**: Vitest 1.0.0 (既存のテストフレームワーク)  
**Target Platform**: Web browser (開発環境)  
**Project Type**: web (frontend)  
**Performance Goals**: Storybook起動30秒以内、プロパティ変更反映1秒以内  
**Constraints**: 既存コンポーネントのコード変更なし、開発環境でのみ使用、外部API依存のモック対応  
**Scale/Scope**: 3つの主要コンポーネント（BarcodeScanner、BookForm、LocationManager）、各コンポーネント3つ以上のストーリー定義

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

以下の憲法原則への準拠を確認する：

- ✅ **Cloudflareエコシステム優先**: Storybookは開発ツールであり、本番環境には含まれないため、Cloudflareエコシステムとは無関係。開発効率向上のためのツールとして正当化される。
- ✅ **低コスト・高パフォーマンス・スケーラビリティ**: Storybookは無料のオープンソースツールで、開発環境でのみ使用されるため、コストは発生しない。起動時間30秒以内、プロパティ変更反映1秒以内のパフォーマンス目標を設定。
- ✅ **TypeScript型安全性**: Storybookの設定とストーリー定義はTypeScriptで記述され、既存のコンポーネントの型定義を活用する。型安全性が維持される。
- ⚠️ **エッジファーストアーキテクチャ**: 開発ツールのため、エッジファーストアーキテクチャとは直接関係ない。開発環境でのみ使用されるため、この原則は適用外。
- ✅ **軽量・高速起動**: Storybookの起動時間を30秒以内に制限し、軽量な設定を維持する。
- ✅ **コード品質と保守性**: 既存のコンポーネントコードは変更せず、Storybookの設定とストーリー定義のみを追加する。コードの重複を避け、設定を一元管理する。
- ✅ **エラーハンドリングとメッセージの一貫性**: Storybookの設定やエラーメッセージは日本語で統一する（可能な範囲で）。
- ⚠️ **バリデーションと型安全性の徹底**: 開発ツールのため、バリデーションとは直接関係ないが、TypeScriptの型安全性は維持される。
- ✅ **自動テストの実装と品質保証**: Storybookのセットアップ自体は開発ツールの導入であるが、Storybookを使用したコンポーネントの視覚的な検証が可能になる。既存のテストフレームワーク（Vitest）は維持される。

**違反がある場合**: Complexity Tracking セクションで正当化を文書化する必要がある。

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── components/
│   │   ├── BarcodeScanner/
│   │   │   └── BarcodeScanner.tsx
│   │   ├── BookForm/
│   │   │   └── BookForm.tsx
│   │   └── LocationManager/
│   │       └── LocationManager.tsx
│   ├── pages/
│   ├── services/
│   ├── types/
│   └── config/
├── .storybook/          # Storybook設定ディレクトリ（新規作成）
│   ├── main.ts          # Storybook設定ファイル
│   └── preview.ts       # グローバルデコレーターとパラメータ
├── src/components/*/    # 各コンポーネントディレクトリに *.stories.tsx を追加
└── tests/
    ├── integration/
    └── unit/
```

**Structure Decision**: Web application構造を採用。Storybookの設定は`.storybook/`ディレクトリに配置し、各コンポーネントのストーリーファイル（`*.stories.tsx`）は対応するコンポーネントと同じディレクトリに配置する。

## Phase 0: Research Complete

**Status**: ✅ Complete  
**Output**: [research.md](./research.md)

### Key Decisions

1. **Storybook 7.x系 + Viteビルダー**: Viteプロジェクトとの統合が容易で、高速起動を実現
2. **MSW (Mock Service Worker)**: 外部API依存コンポーネントのモック戦略
3. **MemoryRouter decorator**: react-router-dom依存コンポーネントの対応
4. **カメラAPIモック**: BarcodeScannerコンポーネントのStorybook環境対応
5. **状態ベースのストーリー構造**: 各コンポーネントの様々な状態を網羅的に確認

## Phase 1: Design Complete

**Status**: ✅ Complete  
**Outputs**:
- [data-model.md](./data-model.md) - 設定構造とストーリー構造の定義
- [quickstart.md](./quickstart.md) - Storybookの起動方法と基本的な使い方

### Generated Artifacts

- **Configuration Structure**: `.storybook/main.ts` と `.storybook/preview.ts` の構造を定義
- **Story Structure**: 各コンポーネントのストーリーファイル構造を定義
- **Mock Data Structure**: モックデータの型定義と構造を定義
- **Quickstart Guide**: インストールから起動までの手順を文書化

### Next Steps

Phase 2 (`/speckit.tasks`) で実装タスクに分解する。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

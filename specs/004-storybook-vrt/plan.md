# Implementation Plan: Storybook Visual Regression Testing

**Branch**: `004-storybook-vrt` | **Date**: 2024-12-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-storybook-vrt/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Storybookに掲載したストーリーをGitHub ActionsでVRT（Visual Regression Testing）するための技術選定と実装を実施する。@storybook/test-runnerとreg-suitを組み合わせて、外部サービス依存なしで視覚的回帰テストを自動実行する。PR作成時に自動的にVRTが実行され、差分が検出された場合はPRのマージをブロックする。

## Technical Context

**Language/Version**: TypeScript 5.3.0  
**Primary Dependencies**: @storybook/test-runner (^0.x.x), reg-suit (^x.x.x), playwright (^x.x.x), Storybook 7.6.21 (既存)  
**Storage**: GitHub Actions Artifacts (ベースライン保存)、ローカルファイルシステム (スクリーンショット)  
**Testing**: @storybook/test-runner (Playwrightベース)、reg-suit (差分検出)  
**Target Platform**: GitHub Actions (CI環境)、ローカル開発環境  
**Project Type**: web (frontend)  
**Performance Goals**: すべてのストーリーのスクリーンショット取得を10分以内で完了  
**Constraints**: 外部サービス依存なし（セキュリティ要件）、既存のStorybookセットアップを変更しない  
**Scale/Scope**: 既存のStorybookストーリーすべて（BarcodeScanner、BookForm、LocationManager）、将来的なストーリー追加に対応

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

以下の憲法原則への準拠を確認する：

- ⚠️ **Cloudflareエコシステム優先**: VRTは開発・CI/CDツールであり、本番環境には含まれないため、Cloudflareエコシステムとは直接関係ない。ただし、GitHub Actionsは外部サービスであり、Cloudflare PagesのCI/CD統合を検討する余地があるが、現時点ではGitHub Actionsを使用する（既存のCI/CDパイプラインとの統合のため）。
- ✅ **低コスト・高パフォーマンス・スケーラビリティ**: @storybook/test-runnerとreg-suitは無料のオープンソースツールで、外部サービス依存なし。GitHub Actions Artifactsは無料枠内で使用可能。実行時間を10分以内に制限。
- ✅ **TypeScript型安全性**: VRTの設定ファイル（test-runner.ts、regconfig.json）はTypeScriptで記述し、型安全性を確保する。
- ⚠️ **エッジファーストアーキテクチャ**: VRTはCI/CDツールのため、エッジファーストアーキテクチャとは直接関係ない。開発・CI環境でのみ使用される。
- ✅ **軽量・高速起動**: @storybook/test-runnerはPlaywrightベースで高速に動作。スクリーンショット取得の最適化を実施。
- ✅ **コード品質と保守性**: VRTの設定ファイルを一元管理し、コードの重複を避ける。設定値は環境変数や設定ファイルで管理可能にする。
- ✅ **エラーハンドリングとメッセージの一貫性**: VRTのエラーメッセージは日本語で統一する（可能な範囲で）。エラーが発生したストーリーをスキップし、他のストーリーのテストを継続する。
- ⚠️ **バリデーションと型安全性の徹底**: VRTの設定ファイルのバリデーションを実施し、型安全性を確保する。
- ✅ **自動テストの実装と品質保証**: VRT自体が自動テストツールであるが、VRTの設定とワークフローの動作を検証するテストを実装する。

**違反がある場合**: Complexity Tracking セクションで正当化を文書化する必要がある。

## Project Structure

### Documentation (this feature)

```text
specs/004-storybook-vrt/
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
├── .storybook/
│   ├── main.ts          # 既存のStorybook設定
│   ├── preview.tsx      # 既存のStorybook設定
│   └── test-runner.ts   # @storybook/test-runner設定（新規作成）
├── src/
│   └── components/
│       ├── BarcodeScanner/
│       ├── BookForm/
│       └── LocationManager/
├── .reg/                # reg-suit作業ディレクトリ（.gitignoreに追加）
│   ├── expected/        # ベースラインスクリーンショット
│   └── diff/            # 差分画像
├── screenshots/         # スクリーンショット保存ディレクトリ（.gitignoreに追加）
│   └── actual/          # 実際のスクリーンショット
├── regconfig.json       # reg-suit設定ファイル（新規作成）
├── package.json         # 依存関係とスクリプト追加
└── .github/
    └── workflows/
        └── vrt.yml      # GitHub Actionsワークフロー（新規作成）
```

**Structure Decision**: 既存のfrontendディレクトリ構造を維持し、VRT関連の設定ファイルとディレクトリを追加する。@storybook/test-runnerの設定は`.storybook/test-runner.ts`に配置し、reg-suitの設定はプロジェクトルートの`regconfig.json`に配置する。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| GitHub Actions使用（Cloudflareエコシステム外） | 既存のCI/CDパイプラインとの統合、GitHubリポジトリとの密接な連携 | Cloudflare PagesのCI/CD統合は将来的に検討可能だが、現時点ではGitHub Actionsが最も統合しやすい |
| 外部サービス依存なしの要件 | セキュリティ要件により外部サービス（Chromatic等）を使用できない | オープンソースツール（@storybook/test-runner + reg-suit）を組み合わせることで要件を満たす |

## Phase 0: Research Complete

**Status**: ✅ Complete  
**Output**: [research.md](./research.md)

### Key Decisions

1. **@storybook/test-runner + reg-suit**: Storybook公式のテストランナーとOSSの差分検出ツールを組み合わせて、外部サービス依存なしでVRTを実現
2. **GitHub Actions Artifacts**: ベースラインをArtifactsに保存してCI環境で共有
3. **エラーハンドリング**: エラーが発生したストーリーをスキップし、他のストーリーのテストを継続
4. **閾値設定**: デフォルト閾値を設定し、個別のストーリーで上書き可能

## Phase 1: Design Complete

**Status**: ✅ Complete  
**Outputs**:
- [data-model.md](./data-model.md) - スクリーンショット、ベースライン、差分レポートのデータモデル定義
- [quickstart.md](./quickstart.md) - ローカル環境でのVRT実行ガイド
- [contracts/regconfig.schema.json](./contracts/regconfig.schema.json) - reg-suit設定のJSON Schema
- [contracts/test-runner.schema.ts](./contracts/test-runner.schema.ts) - @storybook/test-runner設定の型定義

### Design Decisions

1. **スクリーンショット保存先**: `screenshots/actual/`に保存し、ストーリーIDをファイル名として使用
2. **ベースライン管理**: ローカル環境では`.reg/expected/`、CI環境ではGitHub Actions Artifactsに保存
3. **差分検出**: reg-suitを使用して差分を検出し、`.reg/diff/`に差分画像を保存
4. **設定ファイル**: TypeScriptで型安全性を確保し、JSON Schemaでバリデーション

## Next Steps

Phase 2のタスク分解（`/speckit.tasks`）に進む準備が整いました。

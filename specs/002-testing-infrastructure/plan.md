# Implementation Plan: 自動テスト基盤セットアップ

**Branch**: `002-testing-infrastructure` | **Date**: 2025-12-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-testing-infrastructure/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

次のユースケース実装前に自動テスト基盤をセットアップする。Constitution原則IX（自動テストの実装と品質保証）に基づき、すべての新機能で自動テストが必須となるため、バックエンド・フロントエンド両方のテスト環境を整備する。Vitestをベースに、Cloudflare Workers環境でのテスト、Reactコンポーネントテスト、CI/CD統合を実現する。

技術アプローチ: 既存のVitest設定を拡張し、バックエンドは@cloudflare/vitest-pool-workersを使用してWorkers環境を模擬、フロントエンドはReact Testing Libraryを使用してコンポーネントテストを実現。テストカバレッジ80%以上を目標とし、CI/CDパイプラインで自動実行を設定する。

## Technical Context

**Language/Version**: TypeScript 5.x (Frontend/Backend共通)  
**Primary Dependencies**: 
- Backend Testing: Vitest 1.0+, @cloudflare/vitest-pool-workers 0.4+
- Frontend Testing: Vitest 1.0+, React Testing Library 14+, @testing-library/jest-dom 6+
- CI/CD: GitHub Actions (推奨)

**Storage**: Cloudflare D1 (テスト用ローカルデータベースまたはモック)  
**Testing**: 
- Backend: Vitest + @cloudflare/vitest-pool-workers (Cloudflare Workers環境模擬)
- Frontend: Vitest + React Testing Library (コンポーネントテスト)
- Integration: Hono test utilities (API統合テスト)
- Coverage: Vitest coverage (c8/v8)

**Target Platform**: Development/CI Environment  
**Project Type**: web (frontend + backend)  
**Performance Goals**: 
- テスト実行時間: 30秒以内（フルテストスイート）
- テストカバレッジ: 主要ビジネスロジックで80%以上

**Constraints**: 
- Cloudflare Workers環境でのテスト実行が必要
- ローカル開発環境とCI/CD環境で同じテストが実行可能であること
- テストデータのセットアップとクリーンアップが必要

**Scale/Scope**: 
- バックエンド: サービス層、モデル層、APIエンドポイントのテスト
- フロントエンド: コンポーネント、サービス層、API統合のテスト
- 将来の拡張: E2Eテスト（将来対応）

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

以下の憲法原則への準拠を確認する：

- ✅ **Cloudflareエコシステム優先**: Cloudflare Workers環境でのテストに@cloudflare/vitest-pool-workersを使用。Cloudflare D1のローカルテスト環境を活用。
- ✅ **低コスト・高パフォーマンス・スケーラビリティ**: Vitestは無料で高速。CI/CDはGitHub Actions無料枠を活用。テスト実行時間を30秒以内に制限。
- ✅ **TypeScript型安全性**: すべてのテストコードはTypeScriptで記述。型安全性を確保。
- ✅ **エッジファーストアーキテクチャ**: Cloudflare Workers環境を模擬したテスト環境を使用。エッジ環境での動作をテスト。
- ✅ **軽量・高速起動**: Vitestは高速なテストランナー。テスト実行時間を最小化。
- ✅ **コード品質と保守性**: テストユーティリティとヘルパー関数を一元管理。テストコードの重複を避ける。
- ✅ **エラーハンドリングとメッセージの一貫性**: テストのエラーメッセージは分かりやすく、デバッグしやすい形式。
- ✅ **バリデーションと型安全性の徹底**: テストデータのバリデーションと型安全性を確保。
- ✅ **自動テストの実装と品質保証**: この機能自体が自動テスト基盤のセットアップであり、原則IXの実現を支援する。

**Phase 1設計後の再評価**: すべての原則に準拠。違反なし。

## Project Structure

### Documentation (this feature)

```text
specs/002-testing-infrastructure/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/                 # 既存のソースコード
├── tests/               # 新規: テストファイル
│   ├── unit/           # 単体テスト（サービス層、モデル層）
│   ├── integration/    # 統合テスト（APIエンドポイント）
│   ├── helpers/        # テストヘルパー関数
│   └── fixtures/       # テストデータ（fixtures）
├── vitest.config.ts    # 新規: Vitest設定ファイル
└── package.json        # 既存（testスクリプトは存在）

frontend/
├── src/                 # 既存のソースコード
├── tests/               # 新規: テストファイル
│   ├── unit/           # 単体テスト（コンポーネント、サービス）
│   ├── integration/    # 統合テスト（API統合）
│   ├── helpers/        # テストヘルパー関数
│   └── fixtures/       # テストデータ（fixtures）
├── vitest.config.ts    # 新規: Vitest設定ファイル
└── package.json        # 既存（testスクリプトは存在）

.github/
└── workflows/          # 新規: CI/CDワークフロー
    └── test.yml        # テスト自動実行ワークフロー
```

**Structure Decision**: Web application構造を維持。テストファイルは各プロジェクト（backend/frontend）内に`tests/`ディレクトリを作成。テストヘルパーとfixturesも同じ構造内に配置。CI/CDワークフローは`.github/workflows/`に配置。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

---

## Phase 0: Research Summary

**Status**: ✅ Complete

技術選定の根拠は `research.md` に文書化済み。主要な決定事項：

- **Backend Testing**: Vitest + @cloudflare/vitest-pool-workers（既にインストール済み）
- **Frontend Testing**: Vitest + React Testing Library（既にインストール済み）
- **Database Testing**: ローカルD1データベース（wrangler d1 execute --local）
- **CI/CD**: GitHub Actions（無料枠活用）
- **Coverage**: Vitest coverage (v8)（統合済み）

すべての技術選定は Constitution原則に準拠しており、追加の研究は不要。

---

## Phase 1: Design Summary

**Status**: ✅ Complete

### Test Structure Design

テストファイルは以下の構造で組織化：

- **Backend**: `backend/tests/unit/`, `backend/tests/integration/`, `backend/tests/helpers/`, `backend/tests/fixtures/`
- **Frontend**: `frontend/tests/unit/`, `frontend/tests/integration/`, `frontend/tests/helpers/`, `frontend/tests/fixtures/`

### Configuration Files

- **Backend**: `backend/vitest.config.ts` - @cloudflare/vitest-pool-workers設定
- **Frontend**: `frontend/vitest.config.ts` - React Testing Library設定
- **CI/CD**: `.github/workflows/test.yml` - GitHub Actionsワークフロー

### Test Utilities

- データベースセットアップ/クリーンアップヘルパー
- モックデータファクトリー
- APIリクエストヘルパー
- コンポーネントレンダリングヘルパー

詳細は `quickstart.md` を参照。

---

## Next Steps

1. `/speckit.tasks` コマンドでタスクリストを生成
2. タスクに従って実装を開始
3. 各ユーザーストーリーを独立して実装・テスト


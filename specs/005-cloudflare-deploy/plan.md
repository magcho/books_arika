# Implementation Plan: Cloudflareへのデプロイ設定

**Branch**: `005-cloudflare-deploy` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-cloudflare-deploy/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Cloudflare WorkersとCloudflare PagesのGitHub統合機能を活用して、バックエンドAPIとフロントエンドアプリケーションを本番環境に自動デプロイする設定を実装する。デプロイ時のデータベースマイグレーション自動実行、PRコメントによるマイグレーション実行通知、GitHubのコミットステータスとPRコメントによるデプロイ通知、マイグレーション失敗時の自動ロールバック機能を実装する。

技術アプローチ: Cloudflare WorkersとCloudflare PagesのGitHub統合機能を利用し、コードプッシュ時に自動的にテストを実行し、成功した場合に本番環境にデプロイする。デプロイプロセスの完全な自動化と、エラー時の自動ロールバック機能を実現する。

## Technical Context

**Language/Version**: TypeScript 5.x (Frontend/Backend共通)  
**Primary Dependencies**: 
- Frontend: React 18+, Vite 5+, React Router
- Backend: Hono 4+, @cloudflare/workers-types
- Database: Cloudflare D1 (SQLite互換)
- Infrastructure: Cloudflare Pages, Cloudflare Workers
- Deployment: Wrangler CLI, Cloudflare GitHub Integration

**Storage**: Cloudflare D1 (リレーショナルデータベース、エッジで動作するSQLite)  
**Testing**: 
- Frontend: Vitest, React Testing Library
- Backend: Vitest, Hono test utilities
- Integration: Cloudflare Workers環境でのテスト

**Target Platform**: Web (Mobile Browser / PWA対応)  
**Project Type**: web (frontend + backend)  
**Performance Goals**: 
- デプロイプロセス全体（ビルドから公開まで）が10分以内に完了する（SC-007）
- コードをプッシュしてから5分以内に自動デプロイが完了する（SC-002）
- デプロイ後、本番環境のAPIエンドポイントが95%以上の時間で正常に応答する（SC-003）
- デプロイ後、本番環境のフロントエンドアプリケーションが95%以上の時間で正常に表示される（SC-004）

**Constraints**: 
- エッジ環境での実行（Cloudflare Workers制約）
- 無料枠・低コストプランの活用
- GitHubリポジトリとの統合が必要
- 環境変数とシークレットの安全な管理が必要

**Scale/Scope**: 
- 本番環境へのデプロイ設定（ステージング環境は将来対応）
- バックエンドAPIとフロントエンドアプリケーションの両方のデプロイ
- データベースマイグレーションの自動実行
- PRコメントによるマイグレーション実行通知

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

以下の憲法原則への準拠を確認する：

- ✅ **Cloudflareエコシステム優先**: Cloudflare WorkersとCloudflare PagesのGitHub統合を優先的に使用している
- ✅ **低コスト・高パフォーマンス・スケーラビリティ**: Cloudflareの無料枠・低コストプランを活用し、エッジ環境での高速デプロイを実現
- ✅ **TypeScript型安全性**: すべてのコードがTypeScriptで記述され、型安全性が確保されている
- ✅ **エッジファーストアーキテクチャ**: Cloudflare WorkersとCloudflare Pagesのエッジ環境を活用
- ✅ **軽量・高速起動**: Wrangler CLIとCloudflare GitHub統合による高速デプロイ
- ✅ **コード品質と保守性**: デプロイ設定ファイルの一元管理と重複の排除
- ✅ **エラーハンドリングとメッセージの一貫性**: GitHubのコミットステータスとPRコメントによる一貫した通知
- ✅ **バリデーションと型安全性の徹底**: デプロイ設定のバリデーションと型安全性の確保
- ✅ **自動テストの実装と品質保証**: デプロイ前の自動テスト実行と品質保証

**違反がある場合**: Complexity Tracking セクションで正当化を文書化する必要がある。

## Project Structure

### Documentation (this feature)

```text
specs/005-cloudflare-deploy/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── deploy-workflow.yml  # GitHub Actionsワークフロー定義
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

既存のプロジェクト構造を維持し、デプロイ設定ファイルを追加：

```text
backend/
├── wrangler.toml        # Cloudflare Workers設定（既存、本番環境用に更新）
├── package.json         # デプロイスクリプト追加
└── src/
    └── ...

frontend/
├── package.json         # ビルドスクリプト（既存）
├── vite.config.ts      # Vite設定（既存）
└── src/
    └── ...

.github/
└── workflows/
    └── deploy.yml       # デプロイワークフロー（新規作成）

scripts/
└── migration-check.js   # マイグレーションファイル検出とPRコメント生成（新規作成）
```

**Structure Decision**: 既存のweb application構造を維持。Cloudflare WorkersとCloudflare PagesのGitHub統合機能を活用し、追加の設定ファイルとスクリプトを最小限に抑える。デプロイプロセスの自動化を実現する。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

## Phase 0: Research

**Status**: ✅ Complete

すべての技術選定とアーキテクチャパターンが `research.md` に文書化されています。

主要な決定事項：
- Cloudflare WorkersのGitHub統合機能を使用して自動デプロイを実現
- Cloudflare PagesのGitHub統合機能を使用してフロントエンドの自動デプロイを実現
- デプロイ時に`wrangler d1 migrations apply`コマンドを実行してマイグレーションを自動適用
- GitHub Actionsを使用してPRコメントでマイグレーション実行有無を通知
- Cloudflare WorkersとCloudflare PagesのGitHub統合が提供する標準機能を使用してデプロイ通知を実現
- マイグレーション失敗時はデプロイを中止し、Cloudflare WorkersのGitHub統合が提供するロールバック機能を利用

## Phase 1: Design & Contracts

**Status**: ✅ Complete

### 設計アーティファクト

- **quickstart.md**: デプロイ設定の手順とセットアップガイド（人間の操作が必要なステップを明確に提示）
- **contracts/deploy-workflow.yml**: GitHub Actionsワークフロー定義（マイグレーション実行とPRコメント通知）

### 人間の操作が必要なステップ

以下のステップは、人間が手動で実行する必要があります。詳細は `quickstart.md` を参照してください：

1. **Cloudflareアカウントの準備**: Cloudflareアカウントにログインし、適切な権限を確認
2. **GitHubリポジトリとの連携設定**: Cloudflare DashboardでGitHubリポジトリを接続
3. **環境変数とシークレットの設定**: Cloudflare Dashboardで環境変数とシークレットを設定
4. **本番環境のD1データベース設定**: 本番環境用のD1データベースを作成し、スキーマを適用
5. **初回デプロイの実行**: バックエンドとフロントエンドの初回デプロイを実行
6. **自動デプロイの設定**: GitHub Actionsワークフローを作成し、GitHub Secretsを設定
7. **動作確認**: 自動デプロイとマイグレーション通知の動作を確認

### データモデル

この機能はデプロイ設定のため、アプリケーションのデータモデルは不要です。代わりに、デプロイ設定ファイルの構造を定義します：

- **wrangler.toml**: Cloudflare Workersの設定ファイル（D1データベースバインディング、環境変数等）
- **GitHub Actionsワークフロー**: デプロイプロセスの自動化（テスト、マイグレーション実行、PRコメント通知）
- **Cloudflare Pages設定**: ビルドコマンド、出力ディレクトリ、環境変数等

## Phase 2: Implementation Tasks

**Status**: ⏳ Pending

タスクの詳細は `/speckit.tasks` コマンドで生成されます。

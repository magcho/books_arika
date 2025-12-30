# Implementation Plan: 書籍管理プロダクト MVP

**Branch**: `001-book-management` | **Date**: 2025-12-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-book-management/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

すべての本の所有とアクセス手段を一元管理する書籍管理プロダクトのMVP実装。重複購入を防ぎ、読みたい時に物理本棚にあるのか電子書籍にあるのかを即座に把握できる。本の登録機能（キーワード検索、バーコードスキャン、手動登録）、所有・場所情報の管理、閲覧・検索機能を実装する。

技術アプローチ: Cloudflareエコシステム（Pages、Workers、D1）を活用したエッジファーストアーキテクチャ。React (Vite) + TypeScriptでフロントエンド、Hono + TypeScriptでバックエンドAPIを構築。低コスト・高パフォーマンス・スケーラビリティを実現。

## Technical Context

**Language/Version**: TypeScript 5.x (Frontend/Backend共通)  
**Primary Dependencies**: 
- Frontend: React 18+, Vite 5+, React Router
- Backend: Hono 4+, @cloudflare/workers-types
- Database: Cloudflare D1 (SQLite互換)
- Infrastructure: Cloudflare Pages, Cloudflare Workers

**Storage**: Cloudflare D1 (リレーショナルデータベース、エッジで動作するSQLite)  
**Testing**: 
- Frontend: Vitest, React Testing Library
- Backend: Vitest, Hono test utilities
- Integration: Cloudflare Workers環境でのテスト

**Target Platform**: Web (Mobile Browser / PWA対応)  
**Project Type**: web (frontend + backend)  
**Performance Goals**: 
- 検索結果表示: 1秒以内（SC-002）
- 書籍登録完了: 3分以内（SC-001）
- 書籍詳細表示: 5秒以内（SC-003）
- 大量データ（1000冊以上）でも高速動作

**Constraints**: 
- エッジ環境での実行（Cloudflare Workers制約）
- 無料枠・低コストプランの活用
- オフライン対応は将来対応（MVPでは不要）

**Scale/Scope**: 
- MVP: シングルユーザー（個人利用）
- データ構造: マルチユーザー対応で設計（将来拡張を見据える）
- 想定書籍数: 1000冊程度まで快適に動作
- システム初期化: ユーザー初回利用時にデフォルト場所「本棚」（type: Physical）を自動作成（FR-011）

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

以下の憲法原則への準拠を確認する：

- ✅ **Cloudflareエコシステム優先**: Cloudflare Pages（フロントエンド）、Cloudflare Workers（バックエンド）、Cloudflare D1（データベース）を採用。外部サービスはGoogle Books APIのみ（書籍メタデータ取得のため必要）。
- ✅ **低コスト・高パフォーマンス・スケーラビリティ**: 無料枠を活用（D1無料枠、Workers無料枠、Pages無料枠）。エッジ実行により高パフォーマンスを実現。スケーラブルなアーキテクチャ。
- ✅ **TypeScript型安全性**: Frontend/Backend共にTypeScript 5.xを使用。すべてのコードがTypeScriptで記述され、型安全性が確保されている。
- ✅ **エッジファーストアーキテクチャ**: すべてのアプリケーションロジックがCloudflare Workers（エッジ）で実行。データベースアクセスもエッジから直接。
- ✅ **軽量・高速起動**: Honoフレームワークによる超軽量バックエンド。Viteによる高速フロントエンドビルド。コールドスタート時間を最小化。

**Phase 1設計後の再評価**: すべての原則に準拠。違反なし。

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
backend/
├── src/
│   ├── models/          # データモデル定義（Book, Location, Ownership）
│   ├── services/        # ビジネスロジック（書籍検索、登録、所有情報管理）
│   ├── api/            # Honoルーティング定義
│   │   ├── routes/     # エンドポイント定義
│   │   └── middleware/ # ミドルウェア（認証、エラーハンドリング等）
│   └── types/          # TypeScript型定義
├── wrangler.toml       # Cloudflare Workers設定
├── package.json
└── tsconfig.json

frontend/
├── src/
│   ├── components/     # Reactコンポーネント
│   │   ├── BookList/
│   │   ├── BookForm/
│   │   ├── LocationManager/
│   │   └── BarcodeScanner/
│   ├── pages/          # ページコンポーネント
│   │   ├── BookListPage.tsx
│   │   ├── BookRegisterPage.tsx
│   │   └── LocationManagePage.tsx
│   ├── services/       # API呼び出しロジック
│   ├── types/          # TypeScript型定義
│   ├── App.tsx
│   └── main.tsx
├── public/             # 静的ファイル
├── vite.config.ts      # Vite設定
├── package.json
└── tsconfig.json

functions/              # Cloudflare Pages Functions（必要に応じて）
└── api/
    └── [[path]].ts     # バックエンドAPIプロキシ

tests/
├── backend/
│   ├── unit/           # バックエンド単体テスト
│   └── integration/   # バックエンド統合テスト
└── frontend/
    ├── unit/           # フロントエンド単体テスト
    └── e2e/            # E2Eテスト（将来対応）
```

**Structure Decision**: Web application構造を採用。frontend（React + Vite）とbackend（Hono + Cloudflare Workers）を分離。Cloudflare Pages Functionsを使用してAPIをプロキシする構成。将来のPWA化を見据え、frontendを独立したSPAとして設計。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |

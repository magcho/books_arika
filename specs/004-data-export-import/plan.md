# Implementation Plan: データエクスポート・インポート機能

**Branch**: `004-data-export-import` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-data-export-import/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

ユーザーが自分の書籍管理データ（書籍、場所、所有情報）をJSON形式でエクスポートし、別の読書管理サービスへの移行やバックアップに使用できる機能を実装する。インポート機能では、データベースとの差分をエンティティレベルで検出し、差分がある場合はユーザーに可視化して選択を求めるmerge機構を提供する。差分がない場合は何も変更せずに処理を完了する。

## Technical Context

**Language/Version**: TypeScript 5.3.0  
**Primary Dependencies**: Hono 4.0.0 (backend), React 18.2.0 (frontend), Cloudflare Workers  
**Storage**: Cloudflare D1 (SQLite)  
**Testing**: Vitest 3.2.4 (backend/frontend共通)  
**Target Platform**: Cloudflare Workers (backend), Web Browser (frontend)  
**Project Type**: Web application (frontend + backend)  
**Performance Goals**: 
- エクスポート: 最大1000冊のデータを3分以内で処理
- インポート: 最大100冊の差分検出を5秒以内、最大1000冊のインポートを許容範囲内
**Constraints**: 
- エクスポートファイルは1つのJSONファイル
- インポート時の差分検出はエンティティレベル
- 場所のマッチングは名前とタイプで行う（IDベースではない）
**Scale/Scope**: 
- 最大1000冊の書籍データを扱う
- 最大100個の差分を可視化してユーザーが選択可能

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

以下の憲法原則への準拠を確認する：

- ✅ **Cloudflareエコシステム優先**: Cloudflare Workers、D1を使用。エクスポート/インポート処理もエッジで実行
- ✅ **低コスト・高パフォーマンス・スケーラビリティ**: D1の無料枠を活用し、エッジで処理することで低レイテンシを実現
- ✅ **TypeScript型安全性**: すべてのコードはTypeScriptで記述。エクスポート/インポートデータの型定義を明確に定義
- ✅ **エッジファーストアーキテクチャ**: エクスポート/インポート処理をCloudflare Workersで実行
- ✅ **軽量・高速起動**: Honoフレームワークを使用し、コールドスタート時間を最小化
- ✅ **コード品質と保守性**: エクスポート/インポートロジックをサービス層に分離し、重複を避ける
- ✅ **エラーハンドリングとメッセージの一貫性**: すべてのエラーメッセージを日本語で統一
- ✅ **バリデーションと型安全性の徹底**: JSONファイルのバリデーション、データ整合性チェックを実装
- ✅ **自動テストの実装と品質保証**: エクスポート/インポート機能の単体テスト、統合テストを実装

**違反がある場合**: Complexity Tracking セクションで正当化を文書化する必要がある。

## Project Structure

### Documentation (this feature)

```text
specs/004-data-export-import/
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
│   ├── api/
│   │   ├── routes/
│   │   │   ├── export.ts        # NEW: Export endpoint
│   │   │   └── import.ts        # NEW: Import endpoint
│   │   └── middleware/
│   ├── services/
│   │   ├── export_service.ts   # NEW: Export logic
│   │   └── import_service.ts    # NEW: Import logic (diff detection, merge)
│   ├── models/
│   │   └── [existing models]
│   └── types/
│       └── export_import.ts     # NEW: Export/import data types
└── tests/
    ├── integration/
    │   ├── export.test.ts       # NEW: Export integration tests
    │   └── import.test.ts       # NEW: Import integration tests
    └── unit/
        ├── export_service.test.ts # NEW: Export service unit tests
        └── import_service.test.ts # NEW: Import service unit tests

frontend/
├── src/
│   ├── components/
│   │   ├── ExportButton/        # NEW: Export button component
│   │   └── ImportDialog/        # NEW: Import dialog with diff visualization
│   ├── pages/
│   │   └── SettingsPage.tsx      # NEW or UPDATE: Settings page with export/import
│   ├── services/
│   │   ├── export_api.ts        # NEW: Export API client
│   │   └── import_api.ts        # NEW: Import API client
│   └── types/
│       └── export_import.ts     # NEW: Export/import types
└── tests/
    ├── integration/
    │   └── export_import.test.tsx # NEW: Export/import integration tests
    └── unit/
        ├── ExportButton.test.tsx  # NEW: Export button tests
        └── ImportDialog.test.tsx  # NEW: Import dialog tests
```

**Structure Decision**: Web application構造を採用。既存のbackend/frontend構造に合わせて、新しいエンドポイントとサービスを追加する。エクスポート/インポート機能は独立したサービス層として実装し、既存の書籍管理機能と統合する。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (None) | - | - |

# PR: User Story 3 - データのインポート（差分ありの場合）

**Feature**: 004-data-export-import  
**Phase**: Phase 5 - User Story 3  
**Priority**: P2  
**Status**: Implementation Complete (Tests Pending)

## 概要

ユーザーがエクスポートしたファイルをインポートする際、データベースに既存のデータと差分がある場合、差分を可視化し、ユーザーにどちらを優先するかを選択させる機能を実装しました。

## 実装内容

### バックエンド

1. **ImportService** (`backend/src/services/import_service.ts`)
   - `detectDiff`: エンティティレベルでの差分検出（追加、変更、削除）
   - `applyImport`: ユーザー選択に基づくインポート適用
   - 場所マッチング（名前+タイプ）
   - トランザクション管理
   - エラーハンドリング（バリデーション、データ整合性）

2. **API Routes** (`backend/src/api/routes/import.ts`)
   - `POST /api/import`: 差分検出エンドポイント
   - `POST /api/import/apply`: インポート適用エンドポイント

### フロントエンド

1. **ImportDialog Component** (`frontend/src/components/ImportDialog/ImportDialog.tsx`)
   - ファイル選択機能
   - 差分可視化（追加、変更、削除をカテゴリ別に表示）
   - ユーザー選択UI（個別選択、一括選択）
   - エラーハンドリングUI

2. **Import API Client** (`frontend/src/services/import_api.ts`)
   - `detectDiff`: 差分検出API呼び出し
   - `applyImport`: インポート適用API呼び出し

### 型定義

- `backend/src/types/export_import.ts`
- `frontend/src/types/export_import.ts`

## 完了したタスク

- [x] T031: ImportService.detectDiffの拡張（追加、変更、削除の処理）
- [x] T032: 場所マッチング（名前+タイプ）の実装
- [x] T033: ImportService.applyImportの拡張（ユーザー選択の処理）
- [x] T034: トランザクション管理の追加
- [x] T035: POST /api/import routeの拡張
- [x] T036: POST /api/import/apply routeの拡張
- [x] T037: ImportDialogの差分可視化
- [x] T038: ユーザー選択UI（個別・一括）
- [x] T039: エラーハンドリング（バックエンド）
- [x] T040: エラーハンドリングUI（フロントエンド）

## 未完了のタスク

- [ ] T025-T030: テストの実装（次のPRで対応予定）

## 技術的な決定事項

1. **差分検出の粒度**: エンティティレベル（書籍、場所、所有情報ごと）
2. **場所マッチング**: IDではなく名前+タイプの組み合わせで検索
3. **トランザクション**: D1のバッチ操作を使用（明示的なトランザクションはサポートされていない）
4. **エラーハンドリング**: バリデーションエラーは処理中断、データ整合性エラーは該当データをスキップ

## 注意事項

- 書籍の更新機能は未実装（BookServiceにupdateメソッドがないため、現時点では追加のみ対応）
- 所有情報の削除処理は部分的に実装（ユーザー選択に基づく削除は未対応）
- テストは未実装（次のPRで対応予定）

## 次のステップ

1. テストの実装（T025-T030）
2. 書籍更新機能の追加（BookService.update）
3. 所有情報削除処理の完全実装
4. パフォーマンステスト（大量データ対応）

## 関連リンク

- [Specification](./specs/004-data-export-import/spec.md)
- [Implementation Plan](./specs/004-data-export-import/plan.md)
- [Tasks](./specs/004-data-export-import/tasks.md)


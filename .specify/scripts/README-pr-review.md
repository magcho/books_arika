# PRレビュー対応ガイド

このディレクトリには、PRレビュー後の対応を標準化するためのスクリプトとチェックリストが含まれています。

## ファイル一覧

- `pr-review-checklist.md` - PRレビュー対応の詳細チェックリスト
- `apply-pr-review-fixes.sh` - PR情報取得と初期確認スクリプト
- `create-service-tests.sh` - サービス層テストファイル生成スクリプト

## 使用方法

### 1. PRレビュー対応の開始

```bash
# PR番号を指定してスクリプトを実行
./.specify/scripts/apply-pr-review-fixes.sh [PR_NUMBER]

# 例: PR #10の対応を開始
./.specify/scripts/apply-pr-review-fixes.sh 10
```

このスクリプトは以下を実行します：
- PR情報の取得
- ブランチの切り替え
- レビューコメントの確認
- テストファイルの確認
- テストの実行

### 2. レビューコメントへの対応

`pr-review-checklist.md` のチェックリストに従って対応：

1. レビューコメントの確認
2. コード修正
3. テストの追加・更新
4. コミット & プッシュ

### 3. テストファイルの生成（新規サービスの場合）

```bash
# サービス名とエンティティ名を指定
./.specify/scripts/create-service-tests.sh [SERVICE_NAME] [ENTITY_NAME]

# 例: LocationServiceのテストを生成
./.specify/scripts/create-service-tests.sh LocationService Location
```

## PR #9での実装例

PR #9（LocationService and OwnershipService）での対応を参考にしてください：

### 実施した対応

1. **レビューコメントへの対応**
   - 書籍存在チェックの追加
   - トランザクション処理の改善（バッチ操作）
   - 動的SQLクエリの可読性改善

2. **テストの追加**
   - LocationService: 19テスト
   - OwnershipService: 23テスト
   - テストフィクスチャの作成

### コミット例

```bash
# コード修正
git commit -m "fix(us2): Address review comments for PR #9
- Add book existence check
- Improve createMultiple() with batch operations
- Improve SQL query readability"

# テスト追加
git commit -m "test(us2): Add comprehensive tests for LocationService and OwnershipService
- Add LocationService unit tests (19 tests)
- Add OwnershipService unit tests (23 tests)
- Add test fixtures"
```

## チェックリスト

PR対応完了前に以下を確認：

- [ ] すべてのレビューコメントに対応済み
- [ ] コード修正が完了し、コミット済み
- [ ] テストファイルを作成し、すべてのテストが通過
- [ ] テストカバレッジが十分（主要機能100%）
- [ ] リンターエラーがない
- [ ] 変更をプッシュ済み

## 参考

- PR #9の対応: `git log --oneline feature/us2-pr2-backend-services | head -5`
- テストファイル例: `backend/tests/unit/location_service.test.ts`
- フィクスチャ例: `backend/tests/fixtures/locations.ts`

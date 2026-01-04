# PRレビュー対応ガイド

このディレクトリには、PRレビュー後の対応を標準化するためのスクリプトとチェックリストが含まれています。

## ファイル一覧

- `pr-review-checklist.md` - PRレビュー対応の詳細チェックリスト
- `apply-pr-review-fixes.sh` - PR情報取得と初期確認スクリプト
- `create-service-tests.sh` - サービス層テストファイル生成スクリプト
- `pr-documentation-policy.md` - PRドキュメント保持方針
- `pr-documentation-structure.md` - PRドキュメント整理方針（参考）

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

## PRレビュー形式

PRレビューは**インラインコメント形式**で実施します。以下の形式に従ってください：

### レビューコメントの形式

1. **ファイルパスと行番号を明記**
   - 例: `backend/src/api/routes/books.ts:103-129`

2. **良い点と修正点を分離**
   - まず良い点をコメント
   - その後、修正提案をコメント

3. **具体的なコード例を含める**
   - 修正提案には実装例を提供

4. **優先度を明示**
   - 必須修正（🔴）
   - 推奨改善（🟡）
   - 軽微な改善（🟢）

### レビューコメント例

```
## backend/src/api/routes/books.ts

### Line 76-101: 所有情報作成前のバリデーション
**良い点**: 書籍作成前に場所の所有権をチェックすることで、無効な状態での書籍作成を防いでいます。

**修正提案**: 書籍作成後に所有情報作成が失敗した場合の処理を検討してください。
```

### レビュー時の確認項目

- [ ] セキュリティチェックが適切か
- [ ] エラーハンドリングが適切か
- [ ] テストカバレッジが十分か
- [ ] コードの可読性は高いか
- [ ] 型安全性が確保されているか

## GitHubのPRに直接インラインコメントを投稿する方法

PRレビューは**GitHubのPRに直接インラインコメント形式で投稿**します。以下の方法を使用してください：

### 方法1: GitHub CLIを使用（推奨）

GitHub CLI（`gh`）を使用して、PRにインラインコメントを投稿します。

#### 基本的な使い方

```bash
# PR番号を指定
PR_NUMBER=26

# 特定のファイルの特定の行にコメントを投稿
gh pr comment $PR_NUMBER \
  --body "🔴 **必須修正**: [コメント内容]" \
  --repo . \
  --file "backend/src/services/import_service.ts" \
  --line 66
```

#### 複数行のコメント

```bash
gh pr comment $PR_NUMBER \
  --body "🔴 **必須修正**: validateImportFileメソッドのバグ

**問題**: 所有情報データ（ownerships）のチェックが、場所データ（locations）を2回チェックしています。

**修正案**:
\`\`\`typescript
if (!Array.isArray(dataSection.ownerships)) {
  throw new Error('所有情報データが配列形式ではありません')
}
\`\`\`" \
  --file "backend/src/services/import_service.ts" \
  --line 66
```

#### 複数のコメントを一度に投稿

各コメントを個別に投稿する必要があります：

```bash
# コメント1
gh pr comment $PR_NUMBER --body "🔴 コメント1" --file "path/to/file.ts" --line 10

# コメント2
gh pr comment $PR_NUMBER --body "🟡 コメント2" --file "path/to/file.ts" --line 20
```

### 方法2: GitHub Web UIを使用

1. PRページを開く
2. 「Files changed」タブを選択
3. コメントしたい行の左側の「+」アイコンをクリック
4. コメントを入力して「Add single comment」または「Start a review」をクリック

### インラインコメントの形式

GitHubのPRに投稿するインラインコメントは、以下の形式に従ってください：

1. **優先度を明示**（コメントの最初に記載）
   - 🔴 必須修正
   - 🟡 推奨改善
   - 🟢 軽微な改善

2. **問題点を明確に記述**
   - 何が問題なのか
   - なぜ問題なのか

3. **修正案を含める**（可能な限り）
   - 具体的なコード例を提供
   - コードブロックを使用

4. **良い点も記載**（該当する場合）
   - まず良い点をコメント
   - その後、修正提案をコメント

### インラインコメント例

```
🔴 **必須修正**: validateImportFileメソッドのバグ

**問題**: 所有情報データ（ownerships）のチェックが、場所データ（locations）を2回チェックしています。これは明らかなバグです。

**現在のコード**:
```typescript
if (!Array.isArray(dataSection.locations)) {
  throw new Error('所有情報データが配列形式ではありません')
}
```

**修正案**:
```typescript
if (!Array.isArray(dataSection.ownerships)) {
  throw new Error('所有情報データが配列形式ではありません')
}
```
```

### レビュー完了時の処理

すべてのインラインコメントを投稿した後、レビューを完了します：

```bash
# レビューを提出（CHANGES_REQUESTEDまたはCOMMENT）
gh pr review $PR_NUMBER --body "レビューを完了しました。必須修正項目の対応をお願いします。" --request-changes

# または、コメントのみ
gh pr review $PR_NUMBER --body "レビューを完了しました。推奨改善項目の検討をお願いします。" --comment
```

### 注意事項

- インラインコメントは、該当するコード行に直接関連付けて投稿してください
- 複数のファイルにコメントがある場合は、各ファイルごとにコメントを投稿してください
- 必須修正項目は必ず明示し、マージ前に修正が必要であることを明確にしてください
- レビュー完了後は、必要に応じて`docs/prs/[PR番号]/reviews/inline-comments.md`にコメントを保存することもできます（参考用）

## 参考

- PR #9の対応: `git log --oneline feature/us2-pr2-backend-services | head -5`
- テストファイル例: `backend/tests/unit/location_service.test.ts`
- フィクスチャ例: `backend/tests/fixtures/locations.ts`
- PRドキュメントポリシー: `pr-documentation-policy.md`
- 開発ガイドライン: `../memory/development-guidelines.md`

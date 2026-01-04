#!/bin/bash
# PR #26 レビューコメント投稿スクリプト
# 使用方法: bash post-review-comments.sh

PR_NUMBER=26

echo "=== PR #${PR_NUMBER} レビューコメント投稿開始 ==="

# コメント1: validateImportFile - 所有情報データのバリデーション
echo "1. コメント投稿中: backend/src/services/import_service.ts:66"
gh pr comment $PR_NUMBER --body "🔴 **必須修正**: validateImportFileメソッドのバグ

**問題**: 所有情報データ（ownerships）のチェックが、場所データ（locations）を2回チェックしています。これは明らかなバグです。

**現在のコード**:
\`\`\`typescript
if (!Array.isArray(dataSection.locations)) {
  throw new Error('所有情報データが配列形式ではありません')
}
\`\`\`

**修正案**:
\`\`\`typescript
if (!Array.isArray(dataSection.ownerships)) {
  throw new Error('所有情報データが配列形式ではありません')
}
\`\`\`" || echo "  ⚠️  コメント投稿に失敗しました"

# コメント2: applyImport - 書籍更新機能の未実装
echo "2. コメント投稿中: backend/src/services/import_service.ts:304"
gh pr comment $PR_NUMBER --body "🔴 **必須修正**: 書籍更新機能の未実装

**問題**: 書籍の変更（modification）が検出されても、実際には更新されずにカウントのみが増えます。これは仕様違反です。

**現在のコード** (Line 304-307):
\`\`\`typescript
if (existing) {
  // Modification - update book
  // Note: BookService doesn't have update method, so we'll need to add it
  // For now, we'll skip modifications and only handle additions
  modified++
}
\`\`\`

**対応**: \`BookService\`に\`update\`メソッドを追加する必要があります。\`BookUpdateInput\`型は既に\`backend/src/models/book.ts\`に定義されているので、これを活用できます。

**修正案（BookServiceに追加）**:
\`\`\`typescript
async update(isbn: string, input: BookUpdateInput): Promise<Book> {
  const existing = await this.findByISBN(isbn)
  if (!existing) {
    throw new Error(\`ISBN \${isbn} の書籍が見つかりません\`)
  }

  await this.db
    .prepare(
      \`UPDATE books 
       SET title = COALESCE(?, title),
           author = ?,
           thumbnail_url = ?,
           is_doujin = COALESCE(?, is_doujin),
           updated_at = datetime('now')
       WHERE isbn = ?\`
    )
    .bind(
      input.title ?? existing.title,
      input.author ?? null,
      input.thumbnail_url ?? null,
      input.is_doujin !== undefined ? (input.is_doujin ? 1 : 0) : existing.is_doujin,
      isbn
    )
    .run()

  const result = await this.findByISBN(isbn)
  if (!result) {
    throw new Error('書籍の更新に失敗しました')
  }
  return result
}
\`\`\`

**修正案（applyImportで使用）**:
\`\`\`typescript
if (existing) {
  // Modification - update book
  await bookService.update(importBook.isbn, {
    title: importBook.title,
    author: importBook.author || null,
    thumbnail_url: importBook.thumbnail_url || null,
    is_doujin: importBook.is_doujin,
  })
  modified++
}
\`\`\`" || echo "  ⚠️  コメント投稿に失敗しました"

# コメント3: applyImport - 削除処理の不完全な実装
echo "3. コメント投稿中: backend/src/services/import_service.ts:362"
gh pr comment $PR_NUMBER --body "🔴 **必須修正**: 削除処理の不完全な実装

**問題**: コメントによると削除処理は上で処理されているとありますが、実際には所有情報の削除のみが処理されており、書籍や場所の削除は処理されていません。

**現在のコード** (Line 362-365):
\`\`\`typescript
// Process deletions (entities in DB but not in import)
// This is handled by the selection map - if user selects 'import' for a deletion,
// it means they want to keep the DB version (no action needed)
// If they select 'database', it means they want to delete (handled above)
\`\`\`

**問題点**: 書籍の削除は所有情報が存在する場合は制約違反になる可能性があるため、慎重に実装する必要があります。場所の削除も同様です。

**対応**: 削除処理を完全に実装する必要があります。削除の順序も重要です（所有情報 → 書籍/場所）。" || echo "  ⚠️  コメント投稿に失敗しました"

# コメント4: detectDiff - 場所の変更検出が実装されていない
echo "4. コメント投稿中: backend/src/services/import_service.ts:161"
gh pr comment $PR_NUMBER --body "🟡 **推奨改善**: 場所の変更検出が実装されていない

**問題**: 場所の変更検出が実装されていません。仕様では場所も変更検出の対象ですが、現在は実装されていません。

**現在のコード** (Line 161-169):
\`\`\`typescript
// Find location modifications
for (const [key, importLoc] of importLocationsMap) {
  const dbLoc = dbLocationsMap.get(key)
  if (dbLoc) {
    // Locations are matched by name+type, so if they match, they're the same
    // But we check if any other fields changed (created_at, updated_at are metadata)
    // For now, we consider locations with same name+type as identical
  }
}
\`\`\`

**対応**: 場所の変更検出を実装するか、仕様を明確にする必要があります。場所は名前+タイプで識別されるため、実際には変更の概念が適用しにくいですが、コメントで意図を明確にするか、実装を追加する必要があります。" || echo "  ⚠️  コメント投稿に失敗しました"

# コメント5: applyImport - トランザクション管理の改善
echo "5. コメント投稿中: backend/src/services/import_service.ts:290"
gh pr comment $PR_NUMBER --body "🟡 **推奨改善**: トランザクション管理の改善

**問題**: D1は明示的なトランザクションをサポートしていませんが、バッチ操作を使用することで部分的に整合性を保つことができます。現在の実装では、エラーが発生した場合に中途半端な状態になる可能性があります。

**現在のコード** (Line 290-292):
\`\`\`typescript
// Use transaction for data integrity
// Note: D1 doesn't support explicit transactions, but we'll use batch operations
// where possible and handle errors gracefully
\`\`\`

**対応**: 可能な限りバッチ操作を使用し、エラー発生時にはロールバック可能な状態を維持するか、エラーを適切に処理して部分的な成功を許容する設計を明確にする必要があります。" || echo "  ⚠️  コメント投稿に失敗しました"

# コメント6: 型定義の改善（backend）
echo "6. コメント投稿中: backend/src/types/export_import.ts:51"
gh pr comment $PR_NUMBER --body "🟡 **推奨改善**: 型定義の改善

**問題**: \`any\`型が使用されており、型安全性が損なわれています。

**現在のコード** (Line 51-52):
\`\`\`typescript
entity_data: {
  database?: any
  import?: any
}
\`\`\`

**対応**: 具体的な型を定義することを推奨します。ただし、型の判別が必要になるため、より複雑な型定義が必要になります。" || echo "  ⚠️  コメント投稿に失敗しました"

# コメント7: 型定義の改善（frontend）
echo "7. コメント投稿中: frontend/src/types/export_import.ts:51"
gh pr comment $PR_NUMBER --body "🟡 **推奨改善**: 型定義の改善

**問題**: バックエンドと同様に、\`any\`型が使用されています。フロントエンドでも型安全性を確保することを推奨します。

**現在のコード** (Line 51-52):
\`\`\`typescript
entity_data: {
  database?: any
  import?: any
}
\`\`\`" || echo "  ⚠️  コメント投稿に失敗しました"

# コメント8: DiffItemコンポーネントの改善
echo "8. コメント投稿中: frontend/src/components/ImportDialog/ImportDialog.tsx:261"
gh pr comment $PR_NUMBER --body "🟡 **推奨改善**: 差分表示の改善

**問題**: 変更内容の詳細（変更前後の値）が表示されていません。ユーザーが判断しやすいように、変更前後の値を並べて表示することを推奨します。

**現在のコード** (Line 261-311):
\`\`\`typescript
function DiffItem({ diff, selection, onSelectionChange }: DiffItemProps) {
  const getEntityLabel = () => {
    // ... ラベルの取得のみ
  }
  // 変更前後の値が表示されていない
}
\`\`\`

**改善案**: 変更前後の値を並べて表示するUIを追加してください。特に\`modifications\`の場合、どのフィールドがどのように変更されたかを視覚的に表示すると良いでしょう。" || echo "  ⚠️  コメント投稿に失敗しました"

# コメント9: 一括選択ボタンのラベル改善
echo "9. コメント投稿中: frontend/src/components/ImportDialog/ImportDialog.tsx:188"
gh pr comment $PR_NUMBER --body "🟢 **軽微な改善**: 一括選択ボタンのラベル改善

**良い点**: 一括選択ボタンは便利な機能です。

**改善提案**: 「すべての削除を保持」というラベルが少し分かりにくいかもしれません。「すべての削除をキャンセル」や「すべての削除を無視」の方が明確かもしれません。

**現在のコード** (Line 188):
\`\`\`typescript
<button
  onClick={() => handleBulkSelection('deletions', 'database')}
  className=\"bulk-button\"
>
  すべての削除を保持
</button>
\`\`\`" || echo "  ⚠️  コメント投稿に失敗しました"

echo ""
echo "=== レビューコメント投稿完了 ==="
echo "レビューを提出するには、以下のコマンドを実行してください:"
echo "  gh pr review $PR_NUMBER --body \"レビューを完了しました。必須修正項目の対応をお願いします。\" --request-changes"


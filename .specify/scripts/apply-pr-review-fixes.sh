#!/bin/bash
# PRレビュー対応スクリプト
# 使用方法: ./apply-pr-review-fixes.sh [PR_NUMBER]

set -e

PR_NUMBER=${1:-""}

if [ -z "$PR_NUMBER" ]; then
  echo "使用方法: $0 [PR_NUMBER]"
  echo "例: $0 9"
  exit 1
fi

echo "=== PR #${PR_NUMBER} レビュー対応開始 ==="

# 1. PR情報の取得
echo "1. PR情報を取得中..."
BRANCH_NAME=$(gh pr view $PR_NUMBER --json headRefName --jq '.headRefName')
PR_TITLE=$(gh pr view $PR_NUMBER --json title --jq '.title')

echo "  PRタイトル: $PR_TITLE"
echo "  ブランチ: $BRANCH_NAME"

# 2. ブランチの切り替え
echo "2. ブランチに切り替え中..."
git checkout "$BRANCH_NAME"
git pull origin "$BRANCH_NAME"

# 3. レビューコメントの確認
echo "3. レビューコメントを確認中..."
REVIEW_COUNT=$(gh pr view $PR_NUMBER --json reviews --jq '[.reviews[] | select(.state == "CHANGES_REQUESTED" or .state == "COMMENTED")] | length')

if [ "$REVIEW_COUNT" -gt 0 ]; then
  echo "  ⚠️  $REVIEW_COUNT 件のレビューコメントがあります"
  echo "  レビューコメントを確認してください:"
  echo "  gh pr view $PR_NUMBER --comments"
else
  echo "  ✅ レビューコメントはありません"
fi

# 4. テストファイルの確認
echo "4. テストファイルを確認中..."
BACKEND_TESTS=$(find backend/tests/unit -name "*.test.ts" 2>/dev/null | wc -l | tr -d ' ')
FRONTEND_TESTS=$(find frontend/tests/unit -name "*.test.tsx" 2>/dev/null | wc -l | tr -d ' ')

echo "  バックエンドテスト: $BACKEND_TESTS ファイル"
echo "  フロントエンドテスト: $FRONTEND_TESTS ファイル"

# 5. テストの実行
echo "5. テストを実行中..."
if [ -d "backend" ]; then
  echo "  バックエンドテスト実行中..."
  cd backend
  npm test -- --run 2>&1 | tail -5
  cd ..
fi

if [ -d "frontend" ]; then
  echo "  フロントエンドテスト実行中..."
  cd frontend
  npm test -- --run 2>&1 | tail -5
  cd ..
fi

echo ""
echo "=== 次のステップ ==="
echo "1. レビューコメントを確認: gh pr view $PR_NUMBER --comments"
echo "2. コード修正を実施"
echo "3. テストを追加・更新"
echo "4. コミット & プッシュ"
echo ""
echo "詳細は .specify/scripts/pr-review-checklist.md を参照してください"


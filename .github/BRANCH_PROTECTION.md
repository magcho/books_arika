# GitHub ブランチ保護ルールセット - 推奨設定

このドキュメントでは、このプロジェクトに適したGitHubブランチ保護ルールセットの推奨設定を説明します。

## 概要

このプロジェクトは以下の構成です：
- **フロントエンド**: React + Vite
- **バックエンド**: Hono + Cloudflare Workers
- **CI/CD**: GitHub Actions（`.github/workflows/test.yml`）

## 推奨設定

### 1. main ブランチ用ルールセット（厳格）

**ルールセット名**: `main-branch-protection`

#### 基本設定

- **ブランチ名パターン**: `main`
- **対象ブランチ**: このパターンに一致するすべてのブランチ

#### ブランチ保護ルール

##### 必須ステータスチェック

✅ **必須ステータスチェックを有効化**

以下のチェックを必須に設定：
- `test-backend` (GitHub Actions ジョブ)
- `test-frontend` (GitHub Actions ジョブ)

**設定方法**:
- 「Require status checks to pass before merging」を有効化
- 「Require branches to be up to date before merging」を有効化（推奨）
- 上記の2つのチェックを選択

##### プルリクエストレビュー

⚠️ **プルリクエストレビュー（承認数制限なし）**

- 「Require a pull request before merging」を有効化
- 「Require approvals」: `0`（承認不要でマージ可能）
- 注意: 現在の設定では承認数制限は設けていません。テストが通ればマージ可能です。

##### ブランチ更新制限

✅ **ブランチの直接プッシュを禁止**

- 「Restrict pushes that create matching branches」を有効化
- 管理者も含めて直接プッシュを禁止（推奨）

##### その他の保護設定

✅ **有効化を推奨する設定**:
- 「Require conversation resolution before merging」: 有効化（PRのコメントが解決されるまでマージ不可）
- 「Require signed commits」: オプション（セキュリティ要件に応じて）
- 「Require linear history」: オプション（必要に応じて）
- 「Include administrators」: 有効化（管理者も同じルールを適用）

❌ **無効化を推奨する設定**:
- 「Allow force pushes」: 無効化（mainブランチでは絶対に禁止）
- 「Allow deletions」: 無効化

---

### 2. develop ブランチ用ルールセット（中程度）

**ルールセット名**: `develop-branch-protection`

#### 基本設定

- **ブランチ名パターン**: `develop`
- **対象ブランチ**: このパターンに一致するすべてのブランチ

#### ブランチ保護ルール

##### 必須ステータスチェック

✅ **必須ステータスチェックを有効化**

以下のチェックを必須に設定：
- `test-backend` (GitHub Actions ジョブ)
- `test-frontend` (GitHub Actions ジョブ)

**設定方法**:
- 「Require status checks to pass before merging」を有効化
- 「Require branches to be up to date before merging」を有効化（推奨）

##### プルリクエストレビュー

⚠️ **プルリクエストレビュー（承認数制限なし）**

- 「Require a pull request before merging」を有効化
- 「Require approvals」: `0`（承認不要でマージ可能）
- 注意: 現在の設定では承認数制限は設けていません。テストが通ればマージ可能です。

##### ブランチ更新制限

⚠️ **developブランチは柔軟性を持たせる**

- 「Restrict pushes that create matching branches」: 無効化（開発中のブランチなので、必要に応じて直接プッシュを許可）
- または、特定のチームメンバーのみ直接プッシュを許可

##### その他の保護設定

✅ **有効化を推奨する設定**:
- 「Require conversation resolution before merging」: 有効化
- 「Include administrators」: 有効化

⚠️ **オプション設定**:
- 「Allow force pushes」: 無効化（通常は禁止、緊急時のみ許可）
- 「Allow deletions」: 無効化

---

### 3. 機能ブランチ用ルールセット（緩い）

**ルールセット名**: `feature-branch-protection`

#### 基本設定

- **ブランチ名パターン**: `feature/*`, `fix/*`, `hotfix/*`
- **対象ブランチ**: このパターンに一致するすべてのブランチ

#### ブランチ保護ルール

##### 必須ステータスチェック

✅ **必須ステータスチェックを有効化**

以下のチェックを必須に設定：
- `test-backend` (GitHub Actions ジョブ)
- `test-frontend` (GitHub Actions ジョブ)

**設定方法**:
- 「Require status checks to pass before merging」を有効化
- 「Require branches to be up to date before merging」: オプション（必須でなくても可）

##### プルリクエストレビュー

⚠️ **機能ブランチは柔軟に**

- 「Require a pull request before merging」: 無効化（直接マージを許可する場合）
- または、有効化して軽量なレビュープロセスを設定

##### その他の保護設定

- 「Allow force pushes」: 無効化
- 「Allow deletions」: 有効化（機能ブランチは削除可能）

---

## 設定手順

### 方法1: ファイルベースの設定（推奨）

このリポジトリでは、ブランチ保護ルールセットをファイルで管理できます。

1. `.github/branch-protection-rulesets.yaml` を編集して設定を変更
2. 以下のコマンドで適用：

```bash
# スクリプトに実行権限を付与（初回のみ）
chmod +x .github/scripts/apply-branch-protection.sh

# ルールセットを適用
.github/scripts/apply-branch-protection.sh
```

詳細は `.github/scripts/README.md` を参照してください。

### 方法2: GitHub UIでの設定

1. リポジトリの **Settings** に移動
2. 左サイドバーから **Rules** → **Rulesets** を選択
3. **New ruleset** をクリック
4. 上記の推奨設定に従って各ルールセットを作成

### 優先順位

ルールセットは以下の順序で適用されます（より具体的なパターンが優先）：
1. `main` ブランチ用ルールセット
2. `develop` ブランチ用ルールセット
3. 機能ブランチ用ルールセット

---

## 設定のカスタマイズ

### チームサイズに応じた調整

- **小規模チーム（1-3人）**: レビュー承認数を1に設定
- **中規模チーム（4-10人）**: レビュー承認数を1-2に設定
- **大規模チーム（10人以上）**: レビュー承認数を2以上に設定

### プロジェクトの成熟度に応じた調整

- **初期段階**: より緩い設定から開始し、徐々に厳格化
- **本番運用中**: 厳格な設定を維持

### セキュリティ要件に応じた調整

- **機密情報を含むプロジェクト**: 署名付きコミットを必須化
- **コンプライアンス要件**: より厳格なレビュープロセスを設定

---

## トラブルシューティング

### ステータスチェックが表示されない

1. GitHub Actionsワークフローが正しく設定されているか確認
2. ワークフローファイルの`name`が正しく設定されているか確認
3. 少なくとも1回はワークフローを実行して、ステータスチェック名を生成する必要があります

### ルールセットが適用されない

1. ブランチ名パターンが正しく設定されているか確認
2. ルールセットの優先順位を確認
3. より具体的なパターンが優先されることを確認

### 緊急時の対応

mainブランチへの緊急修正が必要な場合：
1. 一時的にルールセットを無効化（推奨しない）
2. 管理者権限で直接プッシュ（「Include administrators」を無効化している場合）
3. 別の緊急用ブランチを作成してマージ

---

## 参考リンク

- [GitHub公式ドキュメント: ブランチ保護ルール](https://docs.github.com/ja/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
- [GitHub公式ドキュメント: ステータスチェック](https://docs.github.com/ja/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks)


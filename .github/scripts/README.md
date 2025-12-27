# GitHub ブランチ保護ルールセット管理スクリプト

このディレクトリには、GitHubのブランチ保護ルールセットをファイルで管理するためのスクリプトが含まれています。

## ファイル構成

- `apply-branch-protection.sh`: ブランチ保護ルールセットを適用するスクリプト
- `../branch-protection-rulesets.yaml`: ブランチ保護ルールセットの設定ファイル

## 前提条件

### 必須

1. **GitHub CLI (gh)**: インストールと認証が必要
   ```bash
   # インストール（macOS）
   brew install gh
   
   # 認証
   gh auth login
   ```

2. **jq**: JSON処理用
   ```bash
   # インストール（macOS）
   brew install jq
   ```

### 推奨

3. **yq**: YAML処理用（設定ファイルのパースに使用）
   ```bash
   # インストール（macOS）
   brew install yq
   ```

## 使用方法

### 1. 設定ファイルの編集

`.github/branch-protection-rulesets.yaml` を編集して、ブランチ保護ルールセットの設定を変更します。

### 2. ルールセットの適用

```bash
# スクリプトに実行権限を付与（初回のみ）
chmod +x .github/scripts/apply-branch-protection.sh

# ルールセットを適用
.github/scripts/apply-branch-protection.sh
```

### 3. 適用状況の確認

```bash
# 現在のルールセット一覧を確認
gh api repos/OWNER/REPO/rulesets

# 特定のルールセットの詳細を確認
gh api repos/OWNER/REPO/rulesets/RULESET_ID
```

## 設定ファイルの構造

`branch-protection-rulesets.yaml` は以下の構造になっています：

```yaml
rulesets:
  - name: ルールセット名
    target: branch
    enforcement: active
    conditions:
      ref_name:
        include:
          - "refs/heads/main"
    rules:
      required_status_checks: ...
      pull_request: ...
      # その他の設定...
```

## カスタマイズ

### ステータスチェックの追加

設定ファイルの `required_status_checks.required_status_checks` に新しいチェックを追加：

```yaml
required_status_checks:
  - context: "test-backend"
  - context: "test-frontend"
  - context: "lint"  # 新しいチェックを追加
```

### レビュー承認数の変更

```yaml
pull_request:
  required_approving_review_count: 2  # 承認数を変更
```

### ブランチパターンの追加

```yaml
conditions:
  ref_name:
    include:
      - "refs/heads/main"
      - "refs/heads/release/*"  # 新しいパターンを追加
```

## トラブルシューティング

### エラー: "GitHub CLI が認証されていません"

```bash
gh auth login
```

### エラー: "yq が必要です"

yqをインストールするか、スクリプトを修正してGitHub APIのJSON形式で直接設定を記述してください。

### ルールセットが適用されない

1. GitHub CLIで認証されているか確認: `gh auth status`
2. リポジトリへのアクセス権限があるか確認
3. 設定ファイルのYAML構文が正しいか確認: `yq eval .github/branch-protection-rulesets.yaml`

### ステータスチェックが見つからない

ステータスチェック名は、GitHub Actionsワークフローのジョブ名と一致する必要があります。
ワークフローを少なくとも1回実行して、ステータスチェック名を生成してください。

## 参考リンク

- [GitHub API: Rulesets](https://docs.github.com/ja/rest/repos/rules#rulesets)
- [GitHub CLI Documentation](https://cli.github.com/manual/)
- [yq Documentation](https://mikefarah.gitbook.io/yq/)


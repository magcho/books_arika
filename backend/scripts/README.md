# Backend Scripts

## update-wrangler-production.sh

本番環境のD1データベースIDを環境変数から取得して`wrangler.toml`を更新するスクリプトです。

### 使用方法

```bash
# 環境変数を設定
export D1_DATABASE_ID="your-production-database-id"

# スクリプトを実行
cd backend
./scripts/update-wrangler-production.sh
```

### GitHub Actionsでの使用

GitHub Actionsワークフローでは、`D1_DATABASE_ID`シークレットから自動的に取得して`wrangler.toml`を更新します。

### 注意事項

- ローカル開発時は`wrangler dev --local`を使用すると、この設定は無視されます
- 本番環境へのデプロイ時のみ、このスクリプトが実行されます
- `wrangler.toml`のデフォルトの`[[d1_databases]]`セクションが更新されます（Cloudflare WorkersのGitHub統合で使用されるため）

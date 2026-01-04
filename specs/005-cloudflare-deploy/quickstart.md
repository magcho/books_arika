# Quick Start Guide: Cloudflareへのデプロイ設定

**Feature**: Cloudflareへのデプロイ設定  
**Branch**: `005-cloudflare-deploy`  
**Created**: 2025-01-27

## 概要

このガイドでは、Cloudflare WorkersとCloudflare PagesのGitHub統合機能を使用して、バックエンドAPIとフロントエンドアプリケーションを本番環境に自動デプロイする設定手順を説明します。

## 前提条件

- Cloudflareアカウントが作成されていること
- GitHubリポジトリが設定されていること
- 本番環境用のD1データベースが作成されていること（または作成手順が明確になっていること）
- Node.js 18+ がインストールされていること
- Wrangler CLIがインストールされていること

## セットアップ手順

### ステップ 1: Cloudflareアカウントの準備

**人間の操作が必要です**

1. Cloudflareアカウントにログイン
2. 適切な権限（Workers、Pages、D1へのアクセス権限）を確認
3. 本番環境用のD1データベースが作成されていることを確認

**確認コマンド**:
```bash
# D1データベースの確認
npx wrangler d1 list
```

**次のステップ**: ステップ2に進む前に、Cloudflareアカウントの準備が完了していることを確認してください。

---

### ステップ 2: GitHubリポジトリとの連携設定

**人間の操作が必要です**

#### 2.1: Cloudflare WorkersのGitHub統合設定

1. Cloudflare Dashboardにアクセス
2. **Workers & Pages** > **Create application** をクリック
3. **Import a repository** の **Get started** をクリック
4. GitHubアカウントを選択し、リポジトリを接続
5. プロジェクト設定を構成：
   - **Project name**: `books-arika-api`（または既存のプロジェクト名）
   - **Production branch**: `main`
   - **Root directory**: `/backend`（スラッシュ付きで指定）
   - **Build command**: `None`（空欄のまま。`npx wrangler deploy`が自動的にビルドも実行します）
   - **Deploy command**: `npx wrangler deploy`（自動的に設定されます）
   - **Builds for non-production branches**: `Enabled`（プレビュー環境用）
6. **Save and Deploy** をクリック

**注意**: 
- データベースマイグレーションの実行は、この設定では行いません。マイグレーションは後続のステップ（GitHub Actionsワークフロー）で実行されます。
- 環境変数とシークレットの設定は、次のステップ（ステップ3）で行います。

#### 2.2: Cloudflare PagesのGitHub統合設定

1. Cloudflare Dashboard > **Workers & Pages** > **Create application** をクリック
2. **Pages** タブを選択
3. **Connect to Git** をクリック
4. GitHubアカウントを認証し、リポジトリを選択
5. プロジェクト設定を構成：
   - **Project name**: `books-arika-frontend`（または既存のプロジェクト名）
   - **Production branch**: `main`
   - **Root directory**: `/frontend`（スラッシュ付きで指定。ビルドのソースディレクトリ）
   - **Build command**: `npm run build`（**重要**: Root directoryが`/frontend`の場合、既に`frontend`ディレクトリ内で実行されるため、`cd frontend`は不要です）
   - **Build output directory**: `dist`（Root directoryが`/frontend`の場合、出力ディレクトリは`dist`のみでOK）
   - **Deploy command**: （空欄のまま。Cloudflare Pagesは自動的にデプロイします）
   - **Builds for non-production branches**: `Enabled`（プレビュー環境用）
6. **Save and Deploy** をクリック

**重要**: 
- **Root directory**と**Build command**の組み合わせが重要です。
  - Root directoryが`/frontend`の場合 → Build commandは`npm run build`（`cd frontend`は不要）
  - Root directoryが`/`（ルート）の場合 → Build commandは`cd frontend && npm run build`
- 現在のエラー（`can't cd to frontend`）は、Root directoryが`/frontend/dist`に設定されているのに、Build commandで`cd frontend`を実行しようとしているためです。
- **修正方法**: Root directoryを`/frontend`に変更し、Build commandを`npm run build`に変更してください。
- Cloudflare Pagesでは、Deploy commandは不要です（自動的にデプロイされます）。もし`npx wrangler deploy`が設定されている場合は削除してください。
- 環境変数とシークレットの設定は、次のステップ（ステップ3）で行います。

**確認方法**:
- Cloudflare Dashboard > **Workers & Pages** > **books-arika-api** > **Settings** > **Builds** で以下を確認：
  - Git Repositoryが `magcho/books_arika` として表示されている
  - Root directoryが `/backend` に設定されている
  - Production branchが `main` に設定されている
  - Deploy commandが `npx wrangler deploy` に設定されている
- Cloudflare Dashboard > **Workers & Pages** > **books-arika-frontend** > **Settings** > **Builds** で以下を確認：
  - Git Repositoryが `magcho/books_arika` として表示されている
  - Root directoryが `/frontend` に設定されている
  - Build commandが `cd frontend && npm run build` に設定されている
  - Build output directoryが `dist` に設定されている
  - Deploy commandが空欄（または設定されていない）であること
- GitHubリポジトリの **Settings** > **Integrations** > **Installed GitHub Apps** でCloudflareアプリが接続されていることを確認
- 初回デプロイが自動的に実行され、成功することを確認（失敗している場合は、ログを確認して問題を解決）

**次のステップ**: ステップ3に進む前に、GitHub統合の設定が完了していることを確認してください。

---

### ステップ 3: 環境変数とシークレットの設定

**人間の操作が必要です**

#### 3.1: バックエンド（Cloudflare Workers）の環境変数設定

1. Cloudflare Dashboard > **Workers & Pages** > **books-arika-api** > **Settings** > **Variables** に移動
2. **Environment Variables** セクションで本番環境用の環境変数を設定：
   - **GOOGLE_BOOKS_API_KEY**: シークレットとして設定（**Encrypt** を有効化）
   - その他の必要な環境変数を追加
3. **D1 Database Bindings** セクションでD1データベースのバインディングを設定（ステップ4.2を参照）
4. **Save** をクリック

#### 3.2: フロントエンド（Cloudflare Pages）の環境変数設定

1. Cloudflare Dashboard > **Workers & Pages** > **books-arika-frontend** > **Settings** > **Environment variables** に移動
2. 本番環境用の環境変数を設定：
   - **VITE_API_URL**: 本番環境のバックエンドAPIのURL（例: `https://books-arika-api.your-subdomain.workers.dev/api`）
   - その他の必要な環境変数を追加
3. **Save** をクリック

**確認方法**:
```bash
# 環境変数の確認（ローカル開発用）
cd backend
npx wrangler secret list
```

**次のステップ**: ステップ4に進む前に、すべての環境変数とシークレットが設定されていることを確認してください。

---

### ステップ 4: 本番環境のD1データベース設定

**人間の操作が必要です**

#### 4.1: 本番環境用のD1データベースの確認・作成

1. 本番環境用のD1データベースが存在することを確認：
   ```bash
   npx wrangler d1 list
   ```

2. 存在しない場合は作成：
   ```bash
   npx wrangler d1 create books-arika-db-production
   ```

3. 作成されたデータベースのIDをメモ（後で使用）

#### 4.2: Cloudflare DashboardでD1データベースバインディングを設定（推奨）

**方法1: Cloudflare Dashboardで設定（推奨）**

1. Cloudflare Dashboard > **Workers & Pages** > **books-arika-api** > **Settings** > **Variables** に移動
2. **D1 Database Bindings** セクションで **Add binding** をクリック
3. 以下の設定を入力：
   - **Variable name**: `DB`（コードで`env.DB`として使用されるため、この名前が必要）
   - **D1 Database**: ステップ4.1で作成した本番環境のD1データベース（`books-arika-db-production`）を選択
4. **Save** をクリック

**注意**: 
- コードでは既に`env.DB`を使用しているため、コードの変更は不要です
- Cloudflare Dashboardで設定したバインディングは、`wrangler.toml`の設定よりも優先されます
- この方法を使用する場合、`wrangler.toml`の`[[d1_databases]]`セクションは不要です

**方法2: wrangler.tomlで設定（代替方法）**

Cloudflare Dashboardで設定できない場合、`wrangler.toml`で設定：
1. `backend/wrangler.toml`を開く
2. `[[d1_databases]]`セクションのコメントを解除し、本番環境のデータベースIDを設定：
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "books-arika-db-production"
   database_id = "YOUR_PRODUCTION_DATABASE_ID"  # ステップ4.1で取得したID
   ```

#### 4.3: 本番環境のデータベースにスキーマを適用

1. 本番環境のデータベースにスキーマを適用：
   ```bash
   cd backend
   npx wrangler d1 execute books-arika-db-production --file=./schema.sql
   ```

**確認方法**:
```bash
# データベースの確認
npx wrangler d1 list
npx wrangler d1 execute books-arika-db-production --command="SELECT name FROM sqlite_master WHERE type='table';"
```

**次のステップ**: ステップ5に進む前に、本番環境のD1データベースが設定されていることを確認してください。

---

### ステップ 5: 初回デプロイの実行

**人間の操作が必要です**

#### 5.1: バックエンドの初回デプロイ

1. バックエンドディレクトリに移動：
   ```bash
   cd backend
   ```

2. 初回デプロイを実行：
   ```bash
   npm run deploy
   ```

3. デプロイが成功したことを確認：
   - Cloudflare Dashboardでデプロイ状態を確認
   - バックエンドAPIのエンドポイントにアクセスして正常に応答することを確認

#### 5.2: フロントエンドの初回デプロイ

**オプション A: 手動デプロイ**

1. Cloudflare Pages Dashboard > **books-arika-frontend** > **Deployments** に移動
2. **Retry deployment** をクリック（初回デプロイが自動的に実行されている場合は不要）

**オプション B: 自動デプロイ（推奨）**

1. mainブランチにコードをプッシュ：
   ```bash
   git push origin main
   ```

2. Cloudflare Pagesが自動的にデプロイを実行することを確認

**確認方法**:
- フロントエンドアプリケーションのURLにアクセスして正常に表示されることを確認
- フロントエンドから本番環境のバックエンドAPIに正常に接続できることを確認

**次のステップ**: 初回デプロイが成功したら、自動デプロイの設定に進みます。

---

### ステップ 6: 自動デプロイの設定（GitHub Actions）

**人間の操作が必要です**

#### 6.1: GitHub Actionsワークフローの作成

1. `.github/workflows/deploy.yml`ファイルを作成：
   ```yaml
   name: Deploy to Cloudflare
   
   on:
     push:
       branches: [main]
     pull_request:
       branches: [main]
   
   jobs:
     deploy-backend:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: '20'
         - name: Install dependencies
           run: cd backend && npm ci
         - name: Run tests
           run: cd backend && npm test
         - name: Apply D1 migrations
           if: github.event_name == 'push' && github.ref == 'refs/heads/main'
           run: |
             cd backend
             npx wrangler d1 migrations apply books-arika-db-production --remote
           env:
             CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
         - name: Check for migration files
           id: check-migrations
           run: |
             if [ -n "$(find backend/migrations -name '*.sql' 2>/dev/null)" ]; then
               echo "has_migrations=true" >> $GITHUB_OUTPUT
             else
               echo "has_migrations=false" >> $GITHUB_OUTPUT
             fi
         - name: Comment on PR
           if: github.event_name == 'pull_request'
           uses: actions/github-script@v7
           with:
             script: |
               const hasMigrations = '${{ steps.check-migrations.outputs.has_migrations }}' === 'true';
               const comment = hasMigrations
                 ? '⚠️ このPRにはデータベースマイグレーションファイルが含まれています。デプロイ時に自動的にマイグレーションが実行されます。'
                 : '✅ このPRにはデータベースマイグレーションファイルは含まれていません。デプロイ時にマイグレーションは実行されません。';
               github.rest.issues.createComment({
                 issue_number: context.issue.number,
                 owner: context.repo.owner,
                 repo: context.repo.repo,
                 body: comment
               });
   
     deploy-frontend:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: '20'
         - name: Install dependencies
           run: cd frontend && npm ci
         - name: Run tests
           run: cd frontend && npm test
   ```

#### 6.2: GitHub Secretsの設定

1. GitHubリポジトリ > **Settings** > **Secrets and variables** > **Actions** に移動
2. **New repository secret** をクリック
3. 以下のシークレットを追加：
   - **CLOUDFLARE_API_TOKEN**: Cloudflare APIトークン（Cloudflare Dashboard > **My Profile** > **API Tokens** で作成）
   - **GOOGLE_BOOKS_API_KEY**: Google Books APIキー（テスト用、本番環境ではCloudflare Dashboardで設定）

**注意**: 
- D1データベースのバインディングはCloudflare Dashboardで設定するため、`D1_DATABASE_ID`シークレットは不要です
- マイグレーション実行時は、`wrangler d1 migrations apply`コマンドでデータベース名を指定します

**確認方法**:
- GitHub Actionsワークフローが正常に実行されることを確認
- PRコメントでマイグレーション実行有無が通知されることを確認

**次のステップ**: 自動デプロイの設定が完了したら、動作確認に進みます。

---

### ステップ 7: 動作確認

**人間の操作が必要です**

#### 7.1: 自動デプロイの確認

1. テスト用のブランチを作成：
   ```bash
   git checkout -b test-deploy
   ```

2. 小さな変更をコミット：
   ```bash
   echo "# Test" >> README.md
   git add README.md
   git commit -m "Test: Deploy workflow"
   ```

3. mainブランチにマージ：
   ```bash
   git checkout main
   git merge test-deploy
   git push origin main
   ```

4. 以下を確認：
   - Cloudflare WorkersとCloudflare Pagesが自動的にデプロイを実行する
   - GitHub Actionsワークフローが正常に実行される
   - デプロイが成功する

#### 7.2: マイグレーション通知の確認

1. テスト用のマイグレーションファイルを作成：
   ```bash
   echo "-- Test migration" > backend/migrations/999_test.sql
   ```

2. PRを作成して、マイグレーション実行有無が通知されることを確認

3. テスト用のマイグレーションファイルを削除：
   ```bash
   rm backend/migrations/999_test.sql
   ```

## トラブルシューティング

### ビルドが失敗する（`can't cd to frontend`エラー）

**エラーメッセージ**: `/bin/sh: 1: cd: can't cd to frontend`

**原因**: Root directoryとBuild commandの設定が一致していません。

**解決方法**:
1. Root directoryが`/frontend`の場合：
   - Build commandを`npm run build`に変更（`cd frontend`は削除）
2. Root directoryが`/`（ルート）の場合：
   - Build commandを`cd frontend && npm run build`のままにする

**確認方法**:
- Cloudflare Dashboard > **Workers & Pages** > **books-arika-frontend** > **Settings** > **Builds** で設定を確認
- Root directoryとBuild commandの組み合わせが正しいことを確認

### ビルドが失敗する（TypeScriptコンパイルエラー）

**エラーメッセージ例**:
```
error TS6133: 'file' is declared but its value is never read.
error TS2339: Property 'entity_id' does not exist on type 'never'.
```

**原因**: TypeScriptのコンパイルエラーです。コードの問題であり、デプロイ設定の問題ではありません。

**解決方法**:
1. ローカル環境でTypeScriptのコンパイルを実行してエラーを確認：
   ```bash
   cd frontend
   npm run build
   ```
2. エラーを修正：
   - 未使用変数のエラー（TS6133）: 未使用の変数を削除するか、`_`プレフィックスを付ける
   - 型エラー（TS2339）: 型定義を修正するか、適切な型アサーションを使用する
3. 修正後、再度コミット・プッシュしてビルドを再実行

**確認方法**:
- ローカル環境で`npm run build`が成功することを確認してから、mainブランチにプッシュする
- Cloudflare Dashboardのビルドログでエラーメッセージを確認

### デプロイが失敗する

1. Cloudflare Dashboardでデプロイログを確認
2. GitHub Actionsワークフローのログを確認
3. 環境変数とシークレットが正しく設定されていることを確認
4. Root directoryとBuild commandの設定が正しいことを確認
5. TypeScriptのコンパイルエラーがないことを確認（上記参照）

### マイグレーションが失敗する

1. マイグレーションファイルの構文を確認
2. 本番環境のデータベースの状態を確認
3. マイグレーションの実行順序を確認

### PRコメントが追加されない

1. GitHub Actionsワークフローが正常に実行されていることを確認
2. GitHub Personal Access TokenまたはGitHub App認証情報が正しく設定されていることを確認
3. PRの権限を確認

## 次のステップ

- デプロイ設定が完了したら、`/speckit.tasks`コマンドでタスクを生成
- 実装タスクを完了して、デプロイ設定を完成させる

## 参考資料

- [Cloudflare Workers CI/CD - GitHub Integration](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/)
- [Cloudflare Pages - GitHub Integration](https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/)
- [Cloudflare D1 - Migrations](https://developers.cloudflare.com/d1/learning/migrations/)
- [Wrangler CLI - D1 Commands](https://developers.cloudflare.com/workers/wrangler/commands/#d1)

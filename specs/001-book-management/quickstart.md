# Quick Start Guide: 書籍管理プロダクト MVP

**Created**: 2025-12-22  
**Purpose**: 開発環境のセットアップとプロジェクトの起動方法

## Prerequisites

以下のソフトウェアがインストールされている必要があります：

- **Node.js**: 18.x 以上
- **npm** または **pnpm**: パッケージマネージャー
- **Git**: バージョン管理
- **Cloudflare アカウント**: D1データベースとWorkers/Pagesの使用に必要

## Initial Setup

### 1. Cloudflare アカウントの準備

1. [Cloudflare](https://dash.cloudflare.com/)にアカウントを作成（無料プランで開始可能）
2. Wrangler CLIでログイン: `npm install -g wrangler && wrangler login`

### 2. プロジェクトのクローンと依存関係のインストール

```bash
# リポジトリをクローン（既にクローン済みの場合はスキップ）
git clone <repository-url>
cd books_arika

# フロントエンドの依存関係をインストール
cd frontend
npm install  # または pnpm install

# バックエンドの依存関係をインストール
cd ../backend
npm install  # または pnpm install
```

### 3. Cloudflare D1 データベースの作成

```bash
# バックエンドディレクトリで実行
cd backend

# D1データベースを作成
wrangler d1 create books-arika-db

# 出力された database_id を wrangler.toml に設定
# 例: database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 4. データベーススキーマの適用

```bash
# data-model.md に記載のSQLスキーマを schema.sql として保存後
wrangler d1 execute books-arika-db --file=./schema.sql

# または、ローカル開発用データベースに適用
wrangler d1 execute books-arika-db --local --file=./schema.sql
```

### 5. 環境変数の設定

#### Backend (.dev.vars または wrangler.toml)

`backend/.dev.vars` ファイルを作成：

```env
GOOGLE_BOOKS_API_KEY=your_google_books_api_key_here
```

**Google Books API キーの取得方法**:
1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成（または既存プロジェクトを選択）
3. "APIとサービス" > "ライブラリ" から "Books API" を有効化
4. "認証情報" > "認証情報を作成" > "APIキー" を選択
5. 生成されたAPIキーをコピー

#### Frontend (.env)

`frontend/.env` ファイルを作成：

```env
VITE_API_URL=http://localhost:8787/api
```

本番環境では、Cloudflare Pagesの環境変数として設定します。

### 6. wrangler.toml の設定

`backend/wrangler.toml` ファイルを作成または更新：

```toml
name = "books-arika-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "books-arika-db"
database_id = "your-database-id-here"  # ステップ3で取得したID

[vars]
GOOGLE_BOOKS_API_KEY = "your_google_books_api_key_here"  # または .dev.vars を使用
```

## Development

### バックエンドの起動

```bash
cd backend
npm run dev
```

バックエンドAPIは `http://localhost:8787` で起動します。

### フロントエンドの起動

別のターミナルで：

```bash
cd frontend
npm run dev
```

フロントエンドは `http://localhost:5173` で起動します（Viteのデフォルトポート）。

### 動作確認

1. ブラウザで `http://localhost:5173` にアクセス
2. 書籍登録機能をテスト
3. 場所マスタの作成をテスト
4. 所有情報の紐付けをテスト

## Project Structure

```
books_arika/
├── backend/
│   ├── src/
│   │   ├── models/          # データモデル
│   │   ├── services/         # ビジネスロジック
│   │   ├── api/             # APIルーティング
│   │   └── types/            # TypeScript型定義
│   ├── wrangler.toml         # Cloudflare Workers設定
│   ├── package.json
│   └── schema.sql            # データベーススキーマ
├── frontend/
│   ├── src/
│   │   ├── components/       # Reactコンポーネント
│   │   ├── pages/           # ページコンポーネント
│   │   ├── services/         # API呼び出し
│   │   └── types/            # TypeScript型定義
│   ├── vite.config.ts
│   └── package.json
└── specs/
    └── 001-book-management/  # 仕様書と設計ドキュメント
```

## Common Tasks

### データベースマイグレーション

```bash
# 新しいマイグレーションファイルを作成
wrangler d1 execute books-arika-db --file=./migrations/001_add_column.sql

# ローカル開発環境に適用
wrangler d1 execute books-arika-db --local --file=./migrations/001_add_column.sql
```

### ローカルデータベースの確認

```bash
# ローカルデータベースに接続
wrangler d1 execute books-arika-db --local --command="SELECT * FROM books LIMIT 10"
```

### ログの確認

```bash
# バックエンドのログを確認
wrangler tail

# 特定のリクエストをフィルタリング
wrangler tail --format=pretty
```

## Testing

### バックエンドのテスト

```bash
cd backend
npm test
```

### フロントエンドのテスト

```bash
cd frontend
npm test
```

## Deployment

### バックエンドのデプロイ

```bash
cd backend
npm run deploy
```

### フロントエンドのデプロイ

Cloudflare Pagesに接続：

1. Cloudflare Dashboard > Pages に移動
2. "プロジェクトを作成" をクリック
3. Gitリポジトリを接続
4. ビルド設定:
   - ビルドコマンド: `cd frontend && npm run build`
   - ビルド出力ディレクトリ: `frontend/dist`
5. 環境変数を設定:
   - `VITE_API_URL`: デプロイされたバックエンドAPIのURL

### 本番環境のデータベース設定

本番環境用のD1データベースを作成：

```bash
wrangler d1 create books-arika-db-prod
```

本番環境の `wrangler.toml` に本番データベースIDを設定します。

## Troubleshooting

### D1データベースに接続できない

- `wrangler login` を実行してログイン状態を確認
- `wrangler.toml` の `database_id` が正しいか確認
- ローカル開発の場合は `--local` フラグを使用

### Google Books APIがエラーを返す

- APIキーが正しく設定されているか確認
- APIキーの使用制限に達していないか確認
- ネットワーク接続を確認

### フロントエンドがバックエンドAPIに接続できない

- CORS設定を確認（バックエンドの `wrangler.toml` またはコード）
- `VITE_API_URL` 環境変数が正しく設定されているか確認
- バックエンドが起動しているか確認

## Next Steps

1. `/speckit.tasks` コマンドでタスクリストを生成
2. タスクに従って実装を開始
3. 各ユーザーストーリーを独立して実装・テスト

## Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Hono Documentation](https://hono.dev/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)


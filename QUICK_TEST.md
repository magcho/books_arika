# クイックテストガイド

## 🎉 サーバー起動完了

以下のサーバーが起動しています：
- **バックエンド**: http://localhost:8787 (実際はWranglerが別ポートで起動、プロキシ経由)
- **フロントエンド**: http://localhost:5173

## 📝 テスト手順

### 1. ブラウザでアプリケーションを開く
```
http://localhost:5173
```

### 2. ヘルスチェックの確認
ブラウザで以下にアクセスして、バックエンドが正常に動作していることを確認：
```
http://localhost:8787/health
```
期待されるレスポンス: `{"status":"ok","timestamp":"..."}`

### 3. 書籍登録のテスト

#### テスト1: 手動登録（最も簡単）
1. ブラウザで `http://localhost:5173` を開く
2. 「書籍登録」リンクをクリック
3. 「手動登録」タブを選択
4. 以下の情報を入力：
   - タイトル: `テスト書籍`
   - 著者: `テスト著者`
   - ISBN: （空欄でもOK）
5. 「登録」ボタンをクリック
6. 「書籍が登録されました！」というアラートが表示されることを確認

#### テスト2: 重複検出
1. 上記のテスト1と同じ情報で再度登録を試みる
2. 「この書籍は既に登録されています。」というエラーメッセージが表示されることを確認

#### テスト3: キーワード検索（Google Books APIキーが必要）
**注意**: `.dev.vars`に`GOOGLE_BOOKS_API_KEY`を設定している場合のみ動作します。

1. 「検索」タブを選択
2. 「React」と入力して「検索」ボタンをクリック
3. 検索結果が表示されることを確認
4. 書籍を選択して「登録」ボタンをクリック

#### テスト4: バーコードスキャン
1. 「バーコード」ボタンをクリック
2. カメラアクセスを許可するか、手動でISBNを入力
3. 書籍情報が取得されることを確認

### 4. APIエンドポイントの直接テスト（オプション）

#### 書籍一覧取得
```bash
curl http://localhost:8787/api/books
```

#### 書籍登録（手動）
```bash
curl -X POST http://localhost:8787/api/books \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "default-user",
    "title": "テスト書籍2",
    "author": "テスト著者2"
  }'
```

#### Google Books検索（APIキーが必要）
```bash
curl "http://localhost:8787/api/search/books?q=React&maxResults=5"
```

## 🛑 サーバーの停止

テストが終わったら、以下のコマンドでサーバーを停止できます：

```bash
./stop-dev.sh
```

または、手動でプロセスを終了：
```bash
# バックエンドを停止
kill $(cat /tmp/backend.pid)

# フロントエンドを停止
kill $(cat /tmp/frontend.pid)
```

## 🐛 トラブルシューティング

### バックエンドに接続できない
- バックエンドのログを確認: `tail -f /tmp/backend.log`
- ポート8787が使用されているか確認: `lsof -i :8787`

### フロントエンドに接続できない
- フロントエンドのログを確認: `tail -f /tmp/frontend.log`
- ポート5173が使用されているか確認: `lsof -i :5173`

### CORSエラー
- バックエンドのCORS設定を確認（`backend/src/api/middleware/cors.ts`）
- ブラウザのコンソールでエラーメッセージを確認

### データベースエラー
- データベーススキーマが適用されているか確認:
  ```bash
  cd backend
  npx wrangler d1 execute books-arika-db --local --command="SELECT * FROM books LIMIT 5"
  ```

## 📊 データベースの確認

登録した書籍を確認するには：

```bash
cd backend
npx wrangler d1 execute books-arika-db --local --command="SELECT * FROM books"
```


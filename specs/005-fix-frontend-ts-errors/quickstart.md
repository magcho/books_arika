# Quickstart: Frontend TypeScriptビルドエラー修正

**Feature**: 005-fix-frontend-ts-errors  
**Date**: 2025-01-27

## 前提条件

- Node.jsがインストールされていること
- frontendディレクトリで`npm install`が完了していること
- 現在のブランチが`005-fix-frontend-ts-errors`であること

## 修正手順

### ステップ1: 現在のエラーを確認

**人間の操作**: 以下のコマンドを実行して、現在のビルドエラーを確認してください。

```bash
cd frontend
npm run build
```

**期待される出力**: 2つのTypeScriptエラーが表示される
- `error TS6133: 'file' is declared but its value is never read.`
- `error TS2339: Property 'entity_id' does not exist on type 'never'.`

### ステップ2: エラー1の修正（未使用変数の削除）

**人間の操作**: `frontend/src/components/ImportDialog/ImportDialog.tsx`ファイルを開き、以下の修正を行ってください。

1. **23行目**: `const [file, setFile] = useState<File | null>(null)`を削除
2. **36行目**: `setFile(selectedFile)`を削除
3. **76行目**: `setFile(null)`を削除

**修正後のコード**:
```typescript
// 23行目付近（修正前）
const [file, setFile] = useState<File | null>(null)

// 修正後: この行を削除

// 36行目付近（修正前）
setFile(selectedFile)

// 修正後: この行を削除

// 76行目付近（修正前）
setFile(null)

// 修正後: この行を削除
```

### ステップ3: エラー2の修正（到達不可能な`default`ケースの削除）

**人間の操作**: 同じファイル内の`getEntityLabel`関数（269-284行目付近）を修正してください。

1. **281-282行目**: `default`ケースを削除

**修正後のコード**:
```typescript
// 修正前
case 'ownership':
  return `所有情報: ${diff.entity_id}`
default:
  return diff.entity_id

// 修正後
case 'ownership':
  return `所有情報: ${diff.entity_id}`
// defaultケースを削除
```

### ステップ4: ビルドの確認

**人間の操作**: 修正後、再度ビルドを実行してエラーが解消されたことを確認してください。

```bash
cd frontend
npm run build
```

**期待される結果**: 
- TypeScriptの型チェックがエラーなく完了する
- Viteのビルドが正常に完了する
- `dist`ディレクトリにビルド成果物が生成される

### ステップ5: 機能テストの実行

**人間の操作**: 既存の機能が正常に動作することを確認してください。

```bash
# 開発サーバーを起動
cd frontend
npm run dev

# 別のターミナルでテストを実行
cd frontend
npm test
```

**確認項目**:
- ImportDialogコンポーネントが正常にレンダリングされる
- ファイル選択機能が正常に動作する
- 既存のテストがすべて通過する

## トラブルシューティング

### ビルドエラーが残る場合

1. TypeScriptのキャッシュをクリア:
   ```bash
   cd frontend
   rm -rf node_modules/.cache
   ```

2. 再度ビルドを実行:
   ```bash
   npm run build
   ```

### テストが失敗する場合

1. テストファイルを確認し、`file`変数や`setFile`を参照している箇所がないか確認
2. 必要に応じてテストコードを更新

## 完了確認

以下の条件をすべて満たしていることを確認してください：

- [ ] ビルドがエラーなく完了する
- [ ] すべてのテストが通過する
- [ ] ImportDialogコンポーネントが正常に動作する
- [ ] コードレビューで変更内容が承認される

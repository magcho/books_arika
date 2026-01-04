# Quickstart: データエクスポート・インポート機能

**Created**: 2025-01-27  
**Feature**: データエクスポート・インポート機能  
**Purpose**: 開発者向けクイックスタートガイド

## 概要

データエクスポート・インポート機能により、ユーザーは自分の書籍管理データをJSON形式でエクスポートし、別の読書管理サービスへの移行やバックアップに使用できます。インポート機能では、データベースとの差分を検出し、ユーザーに選択を求めるmerge機構を提供します。

## アーキテクチャ

### バックエンド

- **ExportService**: ユーザーの全データを取得し、JSON形式にシリアライズ
- **ImportService**: JSONファイルをパースし、差分検出とデータ更新を実行
- **API Routes**: `/api/export`, `/api/import`, `/api/import/apply`

### フロントエンド

- **ExportButton**: エクスポート機能を実行するボタンコンポーネント
- **ImportDialog**: ファイル選択、差分可視化、ユーザー選択、インポート実行を行うダイアログコンポーネント
- **API Clients**: `exportApi`, `importApi`

## 実装手順

### 1. バックエンド実装

#### 1.1 型定義の追加

`backend/src/types/export_import.ts` を作成し、エクスポート/インポートデータの型定義を追加。

#### 1.2 ExportService の実装

`backend/src/services/export_service.ts` を作成：

```typescript
export class ExportService {
  async exportUserData(db: D1Database, userId: string): Promise<ExportData> {
    // 1. ユーザーの全データを取得（書籍、場所、所有情報）
    // 2. JSON形式にシリアライズ
    // 3. メタデータ（バージョン、エクスポート日時）を追加
    // 4. ExportData を返す
  }
}
```

#### 1.3 ImportService の実装

`backend/src/services/import_service.ts` を作成：

```typescript
export class ImportService {
  async detectDiff(
    db: D1Database,
    userId: string,
    importData: ExportData
  ): Promise<ImportDiffResult> {
    // 1. JSONファイルをバリデーション
    // 2. データベースのデータと比較
    // 3. 差分を検出（追加、変更、削除）
    // 4. ImportDiffResult を返す
  }

  async applyImport(
    db: D1Database,
    userId: string,
    importData: ExportData,
    selections: ImportSelection[]
  ): Promise<void> {
    // 1. トランザクションを開始
    // 2. ユーザーの選択に基づいてデータベースを更新
    // 3. 場所のマッチング（名前+タイプ）
    // 4. コミット
  }
}
```

#### 1.4 API Routes の実装

`backend/src/api/routes/export.ts` を作成：

```typescript
export const exportRoutes = new Hono<{ Bindings: Env }>()

exportRoutes.get('/', async (c) => {
  const userId = c.req.query('user_id')
  // ExportService を使用してエクスポート
  // JSONレスポンスを返す
})
```

`backend/src/api/routes/import.ts` を作成：

```typescript
export const importRoutes = new Hono<{ Bindings: Env }>()

importRoutes.post('/', async (c) => {
  const userId = c.req.query('user_id')
  const importData = await c.req.json<ExportData>()
  // ImportService.detectDiff を使用して差分検出
  // ImportDiffResult を返す
})

importRoutes.post('/apply', async (c) => {
  const userId = c.req.query('user_id')
  const { selections } = await c.req.json<ImportApplyRequest>()
  // ImportService.applyImport を使用してインポート実行
  // 成功メッセージを返す
})
```

#### 1.5 ルートの登録

`backend/src/api/index.ts` にルートを追加：

```typescript
import { exportRoutes } from './routes/export'
import { importRoutes } from './routes/import'

app.route('/api/export', exportRoutes)
app.route('/api/import', importRoutes)
```

### 2. フロントエンド実装

#### 2.1 型定義の追加

`frontend/src/types/export_import.ts` を作成し、バックエンドと同じ型定義を追加。

#### 2.2 API Clients の実装

`frontend/src/services/export_api.ts` を作成：

```typescript
export const exportApi = {
  async export(userId: string): Promise<ExportData> {
    const response = await fetch(`/api/export?user_id=${userId}`)
    return response.json()
  }
}
```

`frontend/src/services/import_api.ts` を作成：

```typescript
export const importApi = {
  async detectDiff(userId: string, file: File): Promise<ImportDiffResult> {
    const data = await file.text()
    const importData = JSON.parse(data) as ExportData
    const response = await fetch(`/api/import?user_id=${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(importData)
    })
    return response.json()
  },

  async apply(userId: string, selections: ImportSelection[]): Promise<void> {
    await fetch(`/api/import/apply?user_id=${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selections })
    })
  }
}
```

#### 2.3 ExportButton コンポーネントの実装

`frontend/src/components/ExportButton/ExportButton.tsx` を作成：

```typescript
export const ExportButton = ({ userId }: { userId: string }) => {
  const handleExport = async () => {
    const data = await exportApi.export(userId)
    // ファイルダウンロード処理
  }
  // ...
}
```

#### 2.4 ImportDialog コンポーネントの実装

`frontend/src/components/ImportDialog/ImportDialog.tsx` を作成：

```typescript
export const ImportDialog = ({ userId, onClose }: Props) => {
  const [diffResult, setDiffResult] = useState<ImportDiffResult | null>(null)
  const [selections, setSelections] = useState<ImportSelection[]>([])

  const handleFileSelect = async (file: File) => {
    const result = await importApi.detectDiff(userId, file)
    setDiffResult(result)
    // 初期選択を設定（すべて「インポートファイルを優先」など）
  }

  const handleApply = async () => {
    await importApi.apply(userId, selections)
    onClose()
  }

  // 差分可視化UI
  // ユーザー選択UI
  // ...
}
```

#### 2.5 設定ページへの統合

`frontend/src/pages/SettingsPage.tsx` を作成または更新：

```typescript
export const SettingsPage = () => {
  return (
    <div>
      <h1>設定</h1>
      <ExportButton userId="default-user" />
      <ImportDialog userId="default-user" />
    </div>
  )
}
```

### 3. テスト実装

#### 3.1 バックエンド単体テスト

`backend/tests/unit/export_service.test.ts` を作成：

```typescript
describe('ExportService', () => {
  it('should export user data correctly', async () => {
    // テスト実装
  })
})
```

`backend/tests/unit/import_service.test.ts` を作成：

```typescript
describe('ImportService', () => {
  it('should detect differences correctly', async () => {
    // テスト実装
  })

  it('should apply import correctly', async () => {
    // テスト実装
  })
})
```

#### 3.2 バックエンド統合テスト

`backend/tests/integration/export.test.ts` を作成：

```typescript
describe('Export API', () => {
  it('should export data', async () => {
    // テスト実装
  })
})
```

`backend/tests/integration/import.test.ts` を作成：

```typescript
describe('Import API', () => {
  it('should detect differences', async () => {
    // テスト実装
  })

  it('should apply import', async () => {
    // テスト実装
  })
})
```

#### 3.3 フロントエンドテスト

`frontend/tests/unit/ExportButton.test.tsx` を作成：

```typescript
describe('ExportButton', () => {
  it('should export data when clicked', async () => {
    // テスト実装
  })
})
```

`frontend/tests/unit/ImportDialog.test.tsx` を作成：

```typescript
describe('ImportDialog', () => {
  it('should show differences', async () => {
    // テスト実装
  })
})
```

## 実装のポイント

1. **エンティティレベルの差分検出**: フィールドレベルではなく、エンティティ全体で差分を検出する
2. **場所のマッチング**: IDではなく、名前+タイプの組み合わせで既存の場所を検索する
3. **トランザクション管理**: インポート処理全体を1つのトランザクションで実行する
4. **エラーハンドリング**: バリデーションエラーとデータ整合性エラーを分けて処理する
5. **パフォーマンス**: 最大1000冊のデータを許容範囲内で処理する

## 次のステップ

1. `/speckit.tasks` コマンドを実行してタスクリストを生成
2. 実装を開始（バックエンド → フロントエンドの順）
3. テストを実装
4. 統合テストを実行


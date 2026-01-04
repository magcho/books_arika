# Data Model: データエクスポート・インポート機能

**Created**: 2025-01-27  
**Purpose**: エクスポート/インポートデータの構造と型定義

## エクスポートデータ構造

### JSONファイル構造

```json
{
  "version": "1.0",
  "exported_at": "2025-01-27T12:00:00Z",
  "data": {
    "books": [
      {
        "isbn": "9781234567890",
        "title": "書籍タイトル",
        "author": "著者名",
        "thumbnail_url": "https://example.com/thumbnail.jpg",
        "is_doujin": false,
        "created_at": "2025-01-01T00:00:00Z",
        "updated_at": "2025-01-01T00:00:00Z"
      }
    ],
    "locations": [
      {
        "id": 1,
        "name": "自宅本棚",
        "type": "Physical",
        "created_at": "2025-01-01T00:00:00Z",
        "updated_at": "2025-01-01T00:00:00Z"
      }
    ],
    "ownerships": [
      {
        "user_id": "default-user",
        "isbn": "9781234567890",
        "location_id": 1,
        "created_at": "2025-01-01T00:00:00Z"
      }
    ]
  }
}
```

### メタデータ

- **version** (string, required): ファイル形式バージョン。現在は "1.0"
- **exported_at** (string, required): ISO 8601形式のエクスポート日時

### データセクション

- **books** (array, required): 書籍データの配列
- **locations** (array, required): 場所データの配列
- **ownerships** (array, required): 所有情報データの配列

### 書籍エンティティ（エクスポート形式）

- **isbn** (string | null): ISBN。同人誌などISBNがない場合はnull
- **title** (string, required): タイトル
- **author** (string | null): 著者名
- **thumbnail_url** (string | null): 書影URL
- **is_doujin** (boolean, default: false): 同人誌フラグ
- **created_at** (string, required): ISO 8601形式の作成日時
- **updated_at** (string, required): ISO 8601形式の更新日時

### 場所エンティティ（エクスポート形式）

- **id** (number): 場所ID（参照用。インポート時は使用しない）
- **name** (string, required): 場所名
- **type** (string, required): "Physical" または "Digital"
- **created_at** (string, required): ISO 8601形式の作成日時
- **updated_at** (string, required): ISO 8601形式の更新日時

**注意**: インポート時は、場所IDではなく名前とタイプの組み合わせで既存の場所を検索する。

### 所有情報エンティティ（エクスポート形式）

- **user_id** (string, required): ユーザーID
- **isbn** (string, required): 書籍ISBN
- **location_id** (number, required): 場所ID（参照用。インポート時は名前+タイプでマッチングした新しいIDを使用）
- **created_at** (string, required): ISO 8601形式の作成日時

## インポート差分データ構造

### 差分検出結果

```typescript
interface ImportDiffResult {
  additions: ImportDifference[];
  modifications: ImportDifference[];
  deletions: ImportDifference[];
}

interface ImportDifference {
  type: 'book' | 'location' | 'ownership';
  entity_id: string; // ISBN (book), name+type (location), user_id+isbn+location_id (ownership)
  entity_data: {
    database?: any; // データベース側の値（変更・削除の場合）
    import?: any;   // インポートファイル側の値（追加・変更の場合）
  };
  fields_changed?: string[]; // 変更されたフィールド名（変更の場合）
}
```

### 差分タイプ

1. **addition**: インポートファイルにのみ存在するエンティティ
2. **modification**: 両方に存在するが、値が異なるエンティティ
3. **deletion**: データベースにのみ存在するエンティティ（インポートファイルに含まれていない）

### ユーザー選択データ構造

```typescript
interface ImportSelection {
  entity_id: string;
  priority: 'database' | 'import'; // どちらを優先するか
}

interface ImportApplyRequest {
  selections: ImportSelection[];
}
```

## 型定義（TypeScript）

### バックエンド型定義

```typescript
// types/export_import.ts

export interface ExportData {
  version: string;
  exported_at: string;
  data: {
    books: ExportBook[];
    locations: ExportLocation[];
    ownerships: ExportOwnership[];
  };
}

export interface ExportBook {
  isbn: string | null;
  title: string;
  author: string | null;
  thumbnail_url: string | null;
  is_doujin: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExportLocation {
  id: number;
  name: string;
  type: 'Physical' | 'Digital';
  created_at: string;
  updated_at: string;
}

export interface ExportOwnership {
  user_id: string;
  isbn: string;
  location_id: number;
  created_at: string;
}

export interface ImportDiffResult {
  additions: ImportDifference[];
  modifications: ImportDifference[];
  deletions: ImportDifference[];
}

export interface ImportDifference {
  type: 'book' | 'location' | 'ownership';
  entity_id: string;
  entity_data: {
    database?: any;
    import?: any;
  };
  fields_changed?: string[];
}

export interface ImportSelection {
  entity_id: string;
  priority: 'database' | 'import';
}

export interface ImportApplyRequest {
  selections: ImportSelection[];
}
```

### フロントエンド型定義

```typescript
// src/types/export_import.ts

// バックエンドと同じ型定義を使用
// または、APIレスポンス用に調整した型定義
```

## バリデーションルール

### エクスポートファイル

1. **version**: 必須。現在サポートされているのは "1.0"
2. **exported_at**: 必須。有効なISO 8601形式の日時
3. **data**: 必須。オブジェクト
4. **data.books**: 必須。配列（空配列も許可）
5. **data.locations**: 必須。配列（空配列も許可）
6. **data.ownerships**: 必須。配列（空配列も許可）

### 書籍データ

1. **title**: 必須。1文字以上500文字以下
2. **isbn**: オプション。提供される場合は有効なISBN形式
3. **author**: オプション。提供される場合は255文字以下
4. **is_doujin**: デフォルト false

### 場所データ

1. **name**: 必須。1文字以上100文字以下
2. **type**: 必須。"Physical" または "Digital"

### 所有情報データ

1. **user_id**: 必須
2. **isbn**: 必須。対応する書籍が存在する必要がある
3. **location_id**: 必須（エクスポート時）。インポート時は名前+タイプでマッチング

## データ整合性制約

### インポート時の整合性チェック

1. **所有情報の書籍参照**: 所有情報が参照するISBNが、インポートファイルの書籍リストに存在する必要がある
2. **所有情報の場所参照**: 所有情報が参照する場所が、インポートファイルの場所リストに存在する必要がある（インポート時は名前+タイプでマッチング）
3. **書籍の一意性**: 同じISBNの書籍は1つだけ（ISBNがnullの場合はタイトル+著者の組み合わせで一意性を確認）
4. **場所の一意性**: 同じユーザー内で、同じ名前+タイプの組み合わせは1つだけ

## エラーハンドリング

### バリデーションエラー

- ファイル形式が不正: 処理を中断し、エラーメッセージを返す
- バージョンがサポートされていない: 処理を中断し、エラーメッセージを返す
- 必須フィールドが欠如: 処理を中断し、エラーメッセージを返す

### データ整合性エラー

- 所有情報が参照する書籍が存在しない: 該当する所有情報をスキップし、エラーメッセージを記録
- 所有情報が参照する場所が存在しない: 新しい場所を作成する（名前+タイプでマッチング）
- 書籍の重複: 該当する書籍をスキップし、エラーメッセージを記録
- 場所の重複: 該当する場所をスキップし、エラーメッセージを記録

## パフォーマンス考慮事項

1. **エクスポート**: 最大1000冊のデータを3分以内で処理
2. **インポート（差分検出）**: 最大100冊のデータを5秒以内で処理
3. **インポート（適用）**: 最大1000冊のデータを許容範囲内で処理

## 将来の拡張性

- バージョン管理により、将来のスキーマ変更に対応可能
- メタデータセクションに追加情報を追加可能
- データセクションに新しいエンティティタイプを追加可能


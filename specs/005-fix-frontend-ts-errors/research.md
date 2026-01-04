# Research: Frontend TypeScriptビルドエラー修正

**Feature**: 005-fix-frontend-ts-errors  
**Date**: 2025-01-27

## エラー分析

### エラー1: 未使用変数 `file` (TS6133)

**場所**: `frontend/src/components/ImportDialog/ImportDialog.tsx:23`

**エラー内容**: 
```
error TS6133: 'file' is declared but its value is never read.
```

**原因分析**:
- `file`変数は`useState<File | null>(null)`で宣言されているが、読み取り（参照）されていない
- `setFile`は使用されているが、`file`自体は使用されていない
- TypeScriptの`noUnusedLocals: true`設定により、未使用のローカル変数がエラーとして検出される

**修正方法の選択肢**:

| 方法 | 説明 | 推奨度 |
|------|------|--------|
| A. 変数を削除 | `file`と`setFile`の両方を削除 | ⭐⭐⭐ 推奨 |
| B. アンダースコアプレフィックス | `_file`として未使用であることを明示 | ⭐⭐ |
| C. 変数を使用 | 実際に`file`を使用するコードを追加 | ⭐ |

**決定**: **方法A（変数を削除）**

**根拠**:
- `file`変数は状態管理のために宣言されているが、実際には使用されていない
- `setFile`も`handleFileSelect`内で使用されているが、`file`の状態を追跡する必要がない
- コードの簡潔性と保守性の観点から、不要な状態を削除するのが最適

### エラー2: 到達不可能な`default`ケース (TS2339)

**場所**: `frontend/src/components/ImportDialog/ImportDialog.tsx:282`

**エラー内容**:
```
error TS2339: Property 'entity_id' does not exist on type 'never'.
```

**原因分析**:
- `ImportDifference`は判別共用体型（discriminated union）で、`type`フィールドが`'book' | 'location' | 'ownership'`のいずれか
- `switch`文で3つのケースをすべて処理しているため、`default`ケースは到達不可能
- TypeScriptは`default`ケース内の`diff`を`never`型と推論する

**修正方法の選択肢**:

| 方法 | 説明 | 推奨度 |
|------|------|--------|
| A. `default`ケースを削除 | 到達不可能なケースを削除 | ⭐⭐⭐ 推奨 |
| B. 型アサーションを使用 | `(diff as ImportDifference).entity_id` | ⭐ |
| C. `exhaustiveCheck`関数を追加 | 実行時チェックを追加 | ⭐⭐ |

**決定**: **方法A（`default`ケースを削除）**

**根拠**:
- 判別共用体型では、すべてのケースを処理すれば`default`ケースは不要
- 型安全性の観点から、到達不可能なコードを削除するのが最適
- 将来的に新しい型が追加された場合、TypeScriptがコンパイルエラーを出してくれるため、安全性が保たれる

## 技術的決定

### Decision 1: 未使用変数の削除

**Decision**: `file`変数と`setFile`を削除する

**Rationale**: 
- コードの簡潔性と保守性を向上させる
- 不要な状態管理を削除することで、コードの複雑性を減らす
- TypeScriptの型チェックエラーを解決する

**Alternatives considered**:
- アンダースコアプレフィックス（`_file`）: 未使用であることを明示するが、不要なコードを残すことになる
- 変数を使用: 実際には`file`を使用する必要がないため、不適切

### Decision 2: 到達不可能な`default`ケースの削除

**Decision**: `switch`文の`default`ケースを削除する

**Rationale**:
- 判別共用体型では、すべてのケースを処理すれば`default`ケースは到達不可能
- 型安全性の観点から、到達不可能なコードを削除するのが最適
- 将来的に新しい型が追加された場合、TypeScriptがコンパイルエラーを出してくれるため、安全性が保たれる

**Alternatives considered**:
- 型アサーション: 型安全性を損なうため、推奨しない
- `exhaustiveCheck`関数: 実行時チェックを追加するが、この場合は不要

## 実装方針

1. **エラー1の修正**: `file`変数と`setFile`を削除し、`handleFileSelect`内の`setFile`呼び出しも削除
2. **エラー2の修正**: `getEntityLabel`関数内の`switch`文から`default`ケースを削除

## テスト方針

- 既存のテストが通過することを確認
- ビルドが成功することを確認
- 機能的な回帰がないことを確認（手動テストまたは既存の自動テスト）

## 参考資料

- TypeScript Handbook: [Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
- TypeScript Compiler Options: [noUnusedLocals](https://www.typescriptlang.org/tsconfig#noUnusedLocals)
- TypeScript Compiler Options: [noUnusedParameters](https://www.typescriptlang.org/tsconfig#noUnusedParameters)

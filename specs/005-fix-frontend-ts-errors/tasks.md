# Tasks: Frontend TypeScriptビルドエラー修正

**Input**: Design documents from `/specs/005-fix-frontend-ts-errors/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, quickstart.md ✅

**Tests**: 既存のテストが通過することを確認するタスクを含む（憲法原則IXに準拠）。

**Organization**: この機能は1つのユーザーストーリー（P1）のみで構成される。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 並列実行可能（異なるファイル、依存関係なし）
- **[Story]**: このタスクが属するユーザーストーリー（US1）
- 説明には正確なファイルパスを含める

## Path Conventions

- **Web app**: `frontend/src/` を使用
- 修正対象ファイル: `frontend/src/components/ImportDialog/ImportDialog.tsx`

---

## Phase 1: Setup (環境確認)

**Purpose**: 現在のエラー状態を確認し、修正前の状態を記録

- [ ] T001 現在のビルドエラーを確認するため、`frontend`ディレクトリで`npm run build`を実行し、エラー出力を記録

---

## Phase 2: User Story 1 - 開発者がビルドを成功させる (Priority: P1) 🎯 MVP

**Goal**: frontendアプリケーションのビルド時に発生するTypeScriptの型チェックエラーを修正し、ビルドプロセスを正常に完了できるようにする

**Independent Test**: `frontend`ディレクトリで`npm run build`を実行し、TypeScriptの型チェックがエラーなく完了し、続いてViteのビルドが成功することを確認できる

### エラー修正実装

- [ ] T002 [US1] エラー1を修正: `frontend/src/components/ImportDialog/ImportDialog.tsx`の23行目から`const [file, setFile] = useState<File | null>(null)`を削除
- [ ] T003 [US1] エラー1を修正: `frontend/src/components/ImportDialog/ImportDialog.tsx`の36行目から`setFile(selectedFile)`を削除
- [ ] T004 [US1] エラー1を修正: `frontend/src/components/ImportDialog/ImportDialog.tsx`の76行目から`setFile(null)`を削除
- [ ] T005 [US1] エラー2を修正: `frontend/src/components/ImportDialog/ImportDialog.tsx`の`getEntityLabel`関数内（281-282行目付近）から`default`ケースを削除

### ビルド確認

- [ ] T006 [US1] 修正後のビルドを確認: `frontend`ディレクトリで`npm run build`を実行し、TypeScriptの型チェックエラーが0件で完了することを確認
- [ ] T007 [US1] ビルド成果物の確認: `frontend/dist`ディレクトリにビルド成果物が正常に生成されていることを確認

**Checkpoint**: この時点で、User Story 1は完全に機能し、独立してテスト可能であるべき

---

## Phase 3: テスト確認 (憲法原則IXに準拠)

**Purpose**: 既存の機能が正常に動作することを確認し、機能的な回帰がないことを保証

### 既存テストの実行

- [ ] T008 [P] [US1] 既存のテストを実行: `frontend`ディレクトリで`npm test`を実行し、すべてのテストが通過することを確認
- [ ] T009 [P] [US1] ImportDialogコンポーネントの動作確認（手動）: 開発サーバー（`npm run dev`）を起動し、ImportDialogコンポーネントが正常にレンダリングされ、ファイル選択機能が正常に動作することを確認。※本タスクはバグ修正であり新機能追加ではないため、既存の自動テスト（T008）と手動確認の組み合わせで品質を担保する

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: 最終的な品質確認とドキュメント更新

- [ ] T010 コードレビュー準備: 変更内容を確認し、コードレビューに備える
- [ ] T011 変更内容のドキュメント化: PRを作成する場合、修正したエラーの内容と修正方法をPR説明に記録する

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 依存関係なし - すぐに開始可能
- **User Story 1 (Phase 2)**: Setup完了後に開始可能
- **テスト確認 (Phase 3)**: User Story 1完了後に実行
- **Polish (Phase 4)**: すべてのフェーズ完了後に実行

### User Story Dependencies

- **User Story 1 (P1)**: この機能は1つのユーザーストーリーのみで構成される

### Within User Story 1

- エラー修正タスク（T002-T005）は順次実行する必要がある（同じファイルを修正するため）
- ビルド確認（T006-T007）はエラー修正完了後に実行
- テスト確認（T008-T009）はビルド確認完了後に実行

### Parallel Opportunities

- T008とT009は並列実行可能（異なるテスト方法）
- ただし、この機能は単一ファイルの修正のみのため、並列実行の機会は限定的

---

## Parallel Example: User Story 1

```bash
# テスト確認タスクは並列実行可能:
Task T008: "既存のテストを実行: frontendディレクトリでnpm testを実行"
Task T009: "ImportDialogコンポーネントの手動テスト: 開発サーバーを起動して確認"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1を完了: 現在のエラー状態を確認
2. Phase 2を完了: エラー修正とビルド確認
3. Phase 3を完了: テスト確認
4. **STOP and VALIDATE**: ビルドが成功し、既存の機能が正常に動作することを確認
5. Phase 4を完了: 最終的な品質確認

### Incremental Delivery

この機能は単一のユーザーストーリーのみで構成されるため、段階的な配信は不要。すべてのタスクを順次実行する。

### 実行順序の推奨

1. **T001**: 現在のエラーを確認（修正前の状態を記録）
2. **T002-T005**: エラー修正を順次実行（同じファイルを修正するため、順次実行が必要）
3. **T006-T007**: ビルド確認（修正が正しく適用されたことを確認）
4. **T008-T009**: テスト確認（機能的な回帰がないことを確認）
5. **T010-T011**: 最終確認とドキュメント化

---

## Notes

- この機能は既存コードの修正のみで、新規機能の追加はない
- **重要**: T002-T005で参照される行番号は調査時点のもの。実装時は現在のファイル状態を確認し、該当箇所を特定すること
- すべてのタスクは単一ファイル（`ImportDialog.tsx`）に対する修正
- エラー修正タスク（T002-T005）は同じファイルを修正するため、順次実行が必要
- テストタスク（T008-T009）は並列実行可能
- 各タスク完了後にビルドを実行して、エラーが解消されていることを確認することを推奨
- コミットは各フェーズ完了後、または論理的なグループごとに行う

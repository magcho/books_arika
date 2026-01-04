# Feature Specification: データエクスポート・インポート機能

**Feature Branch**: `004-data-export-import`  
**Created**: 2025-01-27  
**Status**: Draft  
**Input**: User description: "データをexport importできる機能をつけて欲しい。これはユーザー自身が自分の持っている本のデータを別の読書管理サービスなどに引っ越しをすることを未見越した機能である。formatはなんでも良いが1ファイルになって欲しい。import機能は実態としてはmerge機構を持って欲しくもしDBとの差分がなければ何もしない、差分があるときは差分を可視化してどちらを優先するかを尋ねるようなUXとして欲しい。"

## Clarifications

### Session 2025-01-27

- Q: エクスポート/インポートファイル形式の選択 → A: JSON形式
- Q: 差分検出の粒度 → A: エンティティレベル（書籍、場所、所有情報ごとに差分を検出。1つのフィールドでも変更があれば、そのエンティティ全体を「変更」として扱う）
- Q: エクスポートファイルに含めるメタデータ → A: 最小限のメタデータ（エクスポート日時、ファイル形式バージョン）
- Q: 場所IDの扱い（インポート時のマッチング） → A: 名前ベースのマッチング（場所名とタイプで既存の場所を検索。見つからない場合は新規作成）

## User Scenarios & Testing *(mandatory)*

### User Story 1 - データのエクスポート (Priority: P1)

ユーザーが自分の書籍管理データ（登録済み書籍、所有場所、所有情報）を1つのファイルとしてエクスポートし、別の読書管理サービスへの移行やバックアップに使用できる。

**Why this priority**: データポータビリティの基本機能であり、ユーザーが自分のデータを自由に持ち運べる権利を実現する。この機能がなければ、ユーザーはシステムにロックインされてしまう。また、import機能の前提となるため、最初に実装する必要がある。

**Independent Test**: ユーザーがエクスポート機能を実行し、自分のすべての書籍データ（書籍情報、場所情報、所有情報）が1つのファイルとしてダウンロードできることを確認できる。このファイルを開いて、データが正しく含まれていることを確認できる。

**Acceptance Scenarios**:

1. **Given** ユーザーが書籍管理システムにログインしている, **When** エクスポート機能を実行する, **Then** ユーザーのすべての書籍データ（書籍情報、場所情報、所有情報）が1つのファイルとしてダウンロードされる
2. **Given** ユーザーが書籍を1冊も登録していない状態でエクスポートを実行している, **When** エクスポート機能を実行する, **Then** 空のデータセットまたは最小限の構造のみを含むファイルがダウンロードされる
3. **Given** ユーザーが複数の書籍、場所、所有情報を登録している状態でエクスポートを実行している, **When** エクスポート機能を実行する, **Then** すべてのデータが漏れなく1つのファイルに含まれ、データの整合性が保たれている
4. **Given** ユーザーがエクスポートしたファイルを開いている, **When** ファイルの内容を確認する, **Then** 書籍情報（タイトル、著者、ISBN等）、場所情報（場所名、タイプ）、所有情報（どの書籍がどの場所にあるか）がすべて含まれている

---

### User Story 2 - データのインポート（差分なしの場合） (Priority: P2)

ユーザーがエクスポートしたファイルをインポートする際、データベースに既存のデータと差分がない場合、何も変更せずに処理を完了する。

**Why this priority**: ユーザーが誤って同じデータを再インポートした場合や、バックアップから復元する際に、不要な処理を避けることができる。シンプルなケースを最初に実装することで、ユーザー体験を向上させる。

**Independent Test**: ユーザーが現在のデータをエクスポートし、そのファイルを即座にインポートする。システムが差分がないことを検出し、データベースに変更を加えずに処理を完了することを確認できる。

**Acceptance Scenarios**:

1. **Given** ユーザーが現在のデータをエクスポートしたファイルをインポートしようとしている, **When** インポート機能を実行する, **Then** システムはデータベースとの差分がないことを検出し、データベースに変更を加えずに処理を完了する
2. **Given** ユーザーが空のデータファイルをインポートしようとしている, **When** インポート機能を実行する, **Then** システムはデータベースが既に空であるか、または差分がないことを検出し、適切なメッセージを表示して処理を完了する
3. **Given** ユーザーがインポート処理を実行している, **When** 差分がない場合の処理が完了する, **Then** ユーザーに「データに変更はありません」というメッセージが表示される

---

### User Story 3 - データのインポート（差分ありの場合） (Priority: P2)

ユーザーがエクスポートしたファイルをインポートする際、データベースに既存のデータと差分がある場合、差分を可視化し、ユーザーにどちらを優先するかを選択させる。

**Why this priority**: ユーザーが異なるタイミングでエクスポートしたファイルをインポートする場合や、データを手動で編集したファイルをインポートする場合に、データの競合を適切に解決できる必要がある。ユーザーが自分のデータをコントロールできることが重要。

**Independent Test**: ユーザーが現在のデータをエクスポートし、ファイルを編集してからインポートする。システムが差分を検出し、差分を可視化してユーザーに選択を求める。ユーザーが選択すると、選択した内容がデータベースに反映されることを確認できる。

**Acceptance Scenarios**:

1. **Given** ユーザーがエクスポートしたファイルに新しい書籍を追加してインポートしようとしている, **When** インポート機能を実行する, **Then** システムは新しい書籍を検出し、差分一覧に表示する。ユーザーが「インポートファイルを優先」を選択すると、新しい書籍がデータベースに追加される
2. **Given** ユーザーがエクスポートしたファイルで既存の書籍情報（タイトル、著者、ISBN等のいずれか）を変更してインポートしようとしている, **When** インポート機能を実行する, **Then** システムは変更された書籍をエンティティ全体として検出し、変更前後の内容を並べて表示する。ユーザーが「データベースを優先」を選択すると、データベースの内容が保持され、「インポートファイルを優先」を選択すると、ファイルの内容で更新される
3. **Given** ユーザーがエクスポートしたファイルで削除された書籍がある状態でインポートしようとしている, **When** インポート機能を実行する, **Then** システムは削除された書籍を検出し、差分一覧に表示する。ユーザーが「インポートファイルを優先」を選択すると、該当書籍がデータベースから削除される
4. **Given** ユーザーが複数の差分（追加、変更、削除）があるファイルをインポートしようとしている, **When** インポート機能を実行する, **Then** システムはすべての差分をカテゴリ別（追加、変更、削除）に整理して表示し、ユーザーが各差分に対して個別に選択できる、または一括で「すべてデータベースを優先」「すべてインポートファイルを優先」を選択できる
5. **Given** ユーザーが差分の可視化画面で選択を完了している, **When** 「インポートを実行」ボタンを押す, **Then** 選択した内容がデータベースに反映され、処理が完了する

---

### Edge Cases

- エクスポート中に新しいデータが追加された場合、エクスポート開始時点のスナップショットが取得される
- インポートファイルのJSON形式が不正または破損している場合、適切なエラーメッセージを表示し、処理を中断する
- インポートファイルの形式バージョンが現在のシステムでサポートされていない場合、適切なエラーメッセージを表示し、処理を中断する
- インポートファイルに存在しない書籍のISBNが参照されている場合（所有情報で参照）、適切なエラーメッセージを表示し、該当する所有情報のインポートをスキップする
- インポートファイル内の所有情報が参照する場所が、名前とタイプで既存の場所とマッチしない場合、新しい場所を作成して所有情報を紐付ける
- インポート中にデータベースの整合性制約（例：同じISBNの重複、同じ場所名の重複）に違反する場合、適切なエラーメッセージを表示し、該当するデータのインポートをスキップする
- 非常に大きなデータファイル（1000冊以上の書籍）をインポートする場合でも、パフォーマンスが許容範囲内に収まる
- インポート処理中にユーザーがブラウザを閉じた場合、処理が中断され、データベースの状態が中途半端にならない（トランザクション管理）

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to export all their book management data (books, locations, ownerships) as a single JSON file
- **FR-002**: System MUST ensure that exported file contains all necessary data to reconstruct the user's book management state, including relationships between books, locations, and ownerships, plus minimal metadata (export timestamp, file format version)
- **FR-003**: System MUST allow users to import exported data files back into the system
- **FR-004**: System MUST detect differences between imported data and existing database data at entity level (books, locations, ownerships). If any field of an entity differs, the entire entity is considered modified
- **FR-005**: System MUST perform no database changes when imported data has no differences from existing database data
- **FR-006**: System MUST visualize all differences between imported data and existing database data when differences are detected
- **FR-007**: System MUST allow users to choose which data to prioritize (database or imported file) for each detected difference
- **FR-008**: System MUST allow users to make individual choices for each difference (add, modify, delete) or make bulk choices (all database priority, all import file priority)
- **FR-009**: System MUST apply user's choices to the database only after user confirms the import execution
- **FR-010**: System MUST validate imported JSON file format (including version compatibility) and data integrity before processing
- **FR-011**: System MUST handle import errors gracefully (invalid format, missing references, constraint violations) and skip problematic data while continuing with valid data
- **FR-012**: System MUST preserve data relationships (ownerships referencing books and locations) during import process
- **FR-013**: System MUST match locations during import by name and type (Physical/Digital), not by ID. If a location with matching name and type exists, use it; otherwise create a new location

### Key Entities *(include if feature involves data)*

- **Exported Data**: Contains user's book management data snapshot. Includes books (ISBN, title, author, thumbnail_url, is_doujin), locations (id, name, type), and ownerships (user_id, isbn, location_id, created_at). Also includes minimal metadata: export timestamp and file format version. All data is user-scoped. Note: Location IDs in exported data are for reference only; during import, locations are matched by name and type, not by ID.
- **Import Difference**: Represents a detected difference between imported data and existing database at entity level (books, locations, ownerships). Can be of type: addition (new entity in import file), modification (same entity identifier with any different field values), or deletion (entity exists in database but not in import file). When any field of an entity differs, the entire entity is treated as modified.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can export all their book management data as a single file within 3 minutes, regardless of data volume (up to 1000 books)
- **SC-002**: Users can import exported data files and see difference detection results within 5 seconds for files containing up to 100 books
- **SC-003**: When no differences are detected during import, system completes processing within 2 seconds without making any database changes
- **SC-004**: When differences are detected, system displays all differences in a clear, organized view within 3 seconds, allowing users to understand what will change
- **SC-005**: Users can successfully import data files with up to 1000 books, with 100% data integrity (all relationships preserved, no data loss)
- **SC-006**: Import process handles error cases (invalid format, missing references) gracefully, with at least 95% of valid data successfully imported even when some data is problematic
- **SC-007**: Users can complete the import process (including difference review and selection) for files with up to 100 differences within 5 minutes from start to finish

## Assumptions

- Export/import file format is JSON (JavaScript Object Notation) as a single file
- Exported data is user-scoped (only includes data belonging to the exporting user)
- Import process operates on the same user's data (user_id is preserved or validated during import)
- Data relationships (ownerships referencing books and locations) are maintained during export/import
- Export creates a point-in-time snapshot of data (changes made after export starts may not be included)
- Import process is idempotent when no differences exist (can be run multiple times safely)
- User has sufficient permissions to export and import their own data

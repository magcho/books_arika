# Feature Specification: 書籍管理プロダクト MVP

**Feature Branch**: `001-book-management`  
**Created**: 2025-12-22  
**Status**: Draft  
**Input**: User description: "書籍管理プロダクトのMVP機能実装。すべての本の所有とアクセス手段を一元管理し、重複購入を防ぎ、読みたい時に物理本棚にあるのか電子書籍にあるのかを即座に把握できる。本の登録機能（キーワード検索、バーコードスキャン、手動登録）、所有・場所情報の管理、閲覧・検索機能を実装する。"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 書籍の登録 (Priority: P1) 🎯 MVP

ユーザーが新しい書籍をシステムに登録し、所有情報を記録できる。3つの登録方法（キーワード検索、バーコードスキャン、手動登録）のいずれかを使用して、商業誌から同人誌まで幅広い書籍を登録できる。

**Why this priority**: 書籍管理システムの核心機能であり、他のすべての機能（閲覧、検索、場所管理）の前提となる。この機能がなければシステムとして機能しない。

**Independent Test**: ユーザーが1冊の書籍を登録し、登録された書籍が一覧に表示されることを確認できる。この機能単体で、ユーザーは自分の書籍コレクションを構築し始めることができる。

**Acceptance Scenarios**:

1. **Given** ユーザーが書籍登録画面を開いている, **When** タイトルまたは著者名を入力して検索ボタンを押す, **Then** Google Books APIから候補書籍が表示され、選択して登録できる
2. **Given** ユーザーが書籍登録画面を開いている, **When** カメラでISBNバーコードをスキャンする, **Then** バーコードから書籍情報が取得され、確認後に登録できる
3. **Given** ユーザーが書籍登録画面を開いている, **When** 手動登録を選択し、タイトルを入力して登録する, **Then** タイトルのみで書籍が登録され、一覧に表示される
4. **Given** ユーザーが既に登録済みの書籍を再度登録しようとしている, **When** 同じISBNまたはタイトルで登録を試みる, **Then** システムは重複を検出し、適切に処理する（既存登録の更新または重複登録の防止）

---

### User Story 2 - 所有・場所情報の管理 (Priority: P2)

ユーザーが書籍の所有場所を定義・管理し、1つの書籍に対して複数の場所（例：自宅本棚とKindle）を紐付けることができる。

**Why this priority**: 書籍登録後、ユーザーが最も必要とする機能。書籍がどこにあるかを記録することで、システムの核心価値（所在の即座把握）を実現する。

**Independent Test**: ユーザーが場所マスタを作成し、登録済み書籍にその場所を紐付けることができる。1つの書籍に複数の場所を紐付け、すべての場所が正しく表示されることを確認できる。

**Acceptance Scenarios**:

1. **Given** ユーザーが場所管理画面を開いている, **When** 新しい場所（例：「自宅本棚」）を作成する, **Then** 場所が保存され、場所一覧に表示される
2. **Given** ユーザーが書籍登録または編集画面を開いている, **When** 登録済みの場所マスタから1つ以上の場所を選択する, **Then** 選択した場所が書籍に紐付けられ、所有情報として保存される
3. **Given** ユーザーが1つの書籍に複数の場所を紐付けている, **When** 書籍詳細を表示する, **Then** すべての紐付けられた場所が表示される
4. **Given** ユーザーが既存の場所を編集または削除しようとしている, **When** 場所名を変更または削除する, **Then** 変更が保存される、または削除時に紐付けられた所有情報への影響が適切に処理される

---

### User Story 3 - 閲覧・検索機能 (Priority: P3)

ユーザーが登録済みの書籍を一覧表示し、キーワード検索によって素早く目的の書籍を見つけることができる。

**Why this priority**: 登録と所有情報管理が完了した後、ユーザーが「持っているか確認する」という主要なユースケースを実現する。検索の高速性がシステムの価値を左右する。

**Independent Test**: ユーザーが登録済み書籍の一覧を表示し、タイトルや著者名で検索できる。検索結果が即座に表示され、該当書籍の所有場所が確認できる。

**Acceptance Scenarios**:

1. **Given** ユーザーが書籍一覧画面を開いている, **When** 画面を表示する, **Then** 登録済みのすべての書籍が一覧表示され、各書籍の基本情報（タイトル、著者、所有場所）が表示される
2. **Given** ユーザーが書籍一覧画面で検索ボックスを使用している, **When** タイトルまたは著者名の一部を入力する, **Then** 入力に一致する書籍がリアルタイムで絞り込まれ、検索結果が表示される
3. **Given** ユーザーが検索結果から書籍を選択している, **When** 書籍をクリックまたはタップする, **Then** 書籍の詳細情報（タイトル、著者、書影、所有場所の一覧）が表示される
4. **Given** ユーザーが存在しない書籍名で検索している, **When** 検索を実行する, **Then** 「該当する書籍が見つかりません」というメッセージが表示される

---

### Edge Cases

- バーコードスキャン時に、無効なISBNまたは認識できないバーコードが読み取られた場合、適切なエラーメッセージを表示し、手動登録への誘導を提供する
- Google Books APIが利用できない、またはタイムアウトした場合、エラーメッセージを表示し、手動登録へのフォールバックを提供する
- 同じ書籍を複数の方法（検索、バーコード、手動）で登録しようとした場合、重複を検出し、既存登録を更新するか、新規登録として扱うかを明確にする
- 場所マスタが1つも作成されていない状態で書籍を登録しようとした場合、場所選択をスキップできるか、または場所作成を促す
- 検索時に特殊文字や絵文字が含まれるタイトルで検索した場合、適切に処理される
- 大量の書籍（1000冊以上）が登録されている場合でも、一覧表示と検索が高速に動作する

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to search for books by title or author name using external API (Google Books API) and register selected books
- **FR-002**: System MUST allow users to scan ISBN barcodes using device camera and register books based on scanned information
- **FR-003**: System MUST allow users to manually register books with at least a title field (for books without ISBN or API availability)
- **FR-004**: System MUST allow users to create, read, update, and delete location master data (places where books are stored)
- **FR-005**: System MUST allow users to associate multiple locations with a single book (e.g., both physical shelf and digital platform)
- **FR-006**: System MUST display a list of all registered books with basic information (title, author, associated locations)
- **FR-007**: System MUST provide keyword search functionality to filter registered books by title or author name
- **FR-008**: System MUST detect and handle duplicate book registrations (same ISBN or identical title/author combination)
- **FR-009**: System MUST store book metadata including title, author, ISBN (when available), thumbnail URL, and doujin flag
- **FR-010**: System MUST support future multi-user expansion by maintaining user_id in data structure, even for single-user MVP phase

### Key Entities *(include if feature involves data)*

- **Book**: Represents a book entity with metadata. Contains ISBN (unique key when available), title, author, thumbnail URL, and doujin flag. Shared across all users as master data.
- **Location**: Represents a user-defined place where books are stored. Contains location ID, user ID, name (e.g., "自宅本棚", "Kindle"), and type (Physical/Digital). Each user can define their own locations.
- **Ownership**: Represents the relationship between a user, a book, and a location. Contains ownership ID, user ID, book ISBN, location ID, and created timestamp. Allows multiple ownership records for the same book (same book in multiple locations).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can register a new book (via any method) and see it in their library list within 3 minutes from start to finish
- **SC-002**: Search results for registered books appear within 1 second of entering search keywords
- **SC-003**: Users can determine the location(s) of any registered book (physical shelf, digital platform, etc.) within 5 seconds of opening the book detail view
- **SC-004**: System successfully handles registration of books without ISBN (doujin books, old technical books) through manual entry, with at least 95% of manual entries successfully saved
- **SC-005**: Users can create and manage at least 10 different location types without performance degradation
- **SC-006**: System prevents duplicate book registrations with the same ISBN, with 100% accuracy in duplicate detection
- **SC-007**: Users can associate a single book with multiple locations (e.g., both physical and digital) and view all associated locations correctly

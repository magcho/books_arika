# Tasks: 書籍管理プロダクト MVP

**Input**: Design documents from `/specs/001-book-management/`  
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/  
**Feature Name**: 書籍管理プロダクト MVP

**Tests**: Tests are MANDATORY per Constitution Principle IX (自動テストの実装と品質保証). All user stories MUST include test tasks.

**Organization**: Tasks are organized by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., [US1], [US2], [US3])
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/` (per plan.md structure)
- **Tests**: `backend/tests/`, `frontend/tests/` (per 002-testing-infrastructure setup)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create backend project structure (backend/src/models/, backend/src/services/, backend/src/api/routes/, backend/src/api/middleware/, backend/src/types/)
- [x] T002 Create frontend project structure (frontend/src/components/, frontend/src/pages/, frontend/src/services/, frontend/src/types/)
- [x] T003 Initialize backend project with Hono 4+ and TypeScript dependencies in backend/package.json
- [x] T004 Initialize frontend project with React 18+, Vite 5+, React Router, and TypeScript dependencies in frontend/package.json
- [x] T005 [P] Create backend/tsconfig.json with Cloudflare Workers types configuration
- [x] T006 [P] Create frontend/tsconfig.json with React and Vite configuration
- [x] T007 [P] Create backend/wrangler.toml with D1 database binding configuration
- [x] T008 [P] Create frontend/vite.config.ts with build configuration
- [x] T009 [P] Configure linting and formatting tools (ESLint, Prettier) for backend
- [x] T010 [P] Configure linting and formatting tools (ESLint, Prettier) for frontend
- [x] T011 Create backend/.dev.vars template file for environment variables
- [x] T012 Create frontend/.env template file for API URL configuration

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T013 Create database schema file backend/schema.sql based on data-model.md (with UUID generation strategy for ISBN NULL case)
- [x] T014 Setup D1 database migration workflow and apply initial schema
- [x] T015 Create base User model in backend/src/models/user.ts (for MVP: default user support with fixed "default-user" ID)
- [x] T016 Create base Book model in backend/src/models/book.ts (with ISBN handling for NULL case using UUID generation)
- [x] T017 Setup Hono API routing structure in backend/src/api/index.ts
- [x] T018 [P] Create error handling middleware in backend/src/api/middleware/error.ts
- [x] T019 [P] Create CORS middleware in backend/src/api/middleware/cors.ts
- [x] T020 [P] Create request validation utilities in backend/src/api/middleware/validation.ts
- [x] T021 Create database connection utility in backend/src/types/db.ts (D1 binding types)
- [x] T022 Setup environment configuration management in backend/src/config/env.ts
- [x] T023 Create base API client service in frontend/src/services/api.ts
- [x] T024 Create TypeScript type definitions in frontend/src/types/index.ts (Book, Location, Ownership types)
- [x] T025 Create TypeScript type definitions in backend/src/types/index.ts (matching frontend types)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - 書籍の登録 (Priority: P1) 🎯 MVP

**Goal**: ユーザーが新しい書籍をシステムに登録し、所有情報を記録できる。3つの登録方法（キーワード検索、バーコードスキャン、手動登録）のいずれかを使用して、商業誌から同人誌まで幅広い書籍を登録できる。

**Independent Test**: ユーザーが1冊の書籍を登録し、登録された書籍が一覧に表示されることを確認できる。この機能単体で、ユーザーは自分の書籍コレクションを構築し始めることができる。

### Tests for User Story 1 (MANDATORY per Constitution Principle IX)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation. Tests are required for all user stories.**

- [x] T026 [P] [US1] Create unit test for BookService in backend/tests/unit/book_service.test.ts (test create, find, duplicate detection methods)
- [x] T027 [P] [US1] Create unit test for GoogleBooksService in backend/tests/unit/google_books_service.test.ts (test search, barcode lookup with mocks)
- [x] T028 [P] [US1] Create integration test for POST /api/books endpoint in backend/tests/integration/books.test.ts (test book registration flow)
- [x] T029 [P] [US1] Create integration test for GET /api/search/books endpoint in backend/tests/integration/search.test.ts (test Google Books API search)
- [x] T030 [P] [US1] Create integration test for POST /api/search/barcode endpoint in backend/tests/integration/search.test.ts (test ISBN barcode lookup)
- [x] T031 [P] [US1] Create component test for BookForm in frontend/tests/unit/BookForm.test.tsx (test rendering, form inputs, submission)
- [x] T032 [P] [US1] Create component test for BarcodeScanner in frontend/tests/unit/BarcodeScanner.test.tsx (test camera initialization, barcode scanning)
- [x] T033 [P] [US1] Create integration test for book API service in frontend/tests/integration/book_api.test.ts (test API calls with mocks)
- [x] T034 [P] [US1] Create integration test for BookRegisterPage in frontend/tests/integration/BookRegisterPage.test.tsx (test full registration flow)
- [x] T035 [P] [US1] Create edge case tests for invalid ISBN barcode in backend/tests/integration/search.test.ts (test error handling and fallback)
- [x] T036 [P] [US1] Create edge case tests for Google Books API timeout in backend/tests/integration/search.test.ts (test error handling and fallback)
- [x] T037 [P] [US1] Create edge case tests for duplicate book registration in backend/tests/integration/books.test.ts (test duplicate detection)

### Implementation for User Story 1

- [x] T038 [US1] Update Book model in backend/src/models/book.ts to handle ISBN NULL case (UUID generation for non-ISBN books)
- [x] T039 [US1] Create BookService in backend/src/services/book_service.ts with create, find, duplicate detection methods
- [x] T040 [US1] Create GoogleBooksService in backend/src/services/google_books_service.ts for external API integration
- [x] T041 [US1] Implement POST /api/books endpoint in backend/src/api/routes/books.ts (book registration)
- [x] T042 [US1] Implement GET /api/search/books endpoint in backend/src/api/routes/search.ts (Google Books API search)
- [x] T043 [US1] Implement POST /api/search/barcode endpoint in backend/src/api/routes/search.ts (ISBN barcode lookup)
- [x] T044 [US1] Add input validation for book registration requests in backend/src/api/middleware/validation.ts
- [x] T045 [US1] Add error handling for Google Books API failures and timeouts in backend/src/services/google_books_service.ts
- [x] T046 [US1] Create BookForm component in frontend/src/components/BookForm/BookForm.tsx (keyword search, barcode scan, manual entry)
- [x] T047 [US1] Create BarcodeScanner component in frontend/src/components/BarcodeScanner/BarcodeScanner.tsx (camera-based ISBN scanning)
- [x] T048 [US1] Create BookRegisterPage in frontend/src/pages/BookRegisterPage.tsx (main registration UI)
- [x] T049 [US1] Create book API service in frontend/src/services/book_api.ts (POST /api/books, GET /api/search/books, POST /api/search/barcode)
- [x] T050 [US1] Add duplicate detection UI with user choice ("既存登録を更新" or "新規登録として扱う") in frontend/src/components/BookForm/BookForm.tsx (FR-008: present user with choice when duplicate detected)
- [x] T051 [US1] Add error handling and fallback to manual entry in frontend/src/components/BookForm/BookForm.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Users can register books via keyword search, barcode scan, or manual entry. All tests should pass.

---

## Phase 4: User Story 2 - 所有・場所情報の管理 (Priority: P2)

**Goal**: ユーザーが書籍の所有場所を定義・管理し、1つの書籍に対して複数の場所（例：自宅本棚とKindle）を紐付けることができる。

**Independent Test**: ユーザーが場所マスタを作成し、登録済み書籍にその場所を紐付けることができる。1つの書籍に複数の場所を紐付け、すべての場所が正しく表示されることを確認できる。

### Tests for User Story 2 (MANDATORY per Constitution Principle IX)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation. Tests are required for all user stories.**

- [x] T052 [P] [US2] Create unit test for LocationService in backend/tests/unit/location_service.test.ts (test CRUD operations)
- [x] T053 [P] [US2] Create unit test for OwnershipService in backend/tests/unit/ownership_service.test.ts (test create, find, delete operations)
- [x] T054 [P] [US2] Create integration test for GET /api/locations endpoint in backend/tests/integration/locations.test.ts (test list user locations)
- [x] T055 [P] [US2] Create integration test for POST /api/locations endpoint in backend/tests/integration/locations.test.ts (test create location)
- [x] T056 [P] [US2] Create integration test for PUT /api/locations/{location_id} endpoint in backend/tests/integration/locations.test.ts (test update location)
- [x] T057 [P] [US2] Create integration test for DELETE /api/locations/{location_id} endpoint in backend/tests/integration/locations.test.ts (test delete location)
- [x] T058 [P] [US2] Create integration test for GET /api/ownerships endpoint in backend/tests/integration/ownerships.test.ts (test list ownerships)
- [x] T059 [P] [US2] Create integration test for POST /api/ownerships endpoint in backend/tests/integration/ownerships.test.ts (test create ownership)
- [x] T060 [P] [US2] Create integration test for DELETE /api/ownerships/{ownership_id} endpoint in backend/tests/integration/ownerships.test.ts (test delete ownership)
- [x] T061 [P] [US2] Create integration test for multiple locations per book in backend/tests/integration/ownerships.test.ts (test multiple ownerships for same book)
- [x] T062 [P] [US2] Create component test for LocationManager in frontend/tests/unit/LocationManager.test.tsx (test CRUD UI)
- [x] T063 [P] [US2] Create integration test for LocationManagePage in frontend/tests/integration/LocationManagePage.test.tsx (test location management flow)
- [x] T064 [P] [US2] Create integration test for location selection in BookForm in frontend/tests/integration/BookForm.test.tsx (test location selection UI)
- [x] T065 [P] [US2] Create edge case test for location deletion with existing ownerships in backend/tests/integration/locations.test.ts (test cascade handling)

### Implementation for User Story 2

- [x] T066 [P] [US2] Create Location model in backend/src/models/location.ts
- [ ] T067 [US2] Create initialization service to automatically create default location "本棚" (type: Physical) for each user upon system initialization or first use in backend/src/services/initialization_service.ts (FR-011: default location auto-creation, editable and deletable)
- [x] T068 [P] [US2] Create Ownership model in backend/src/models/ownership.ts
- [x] T069 [US2] Create LocationService in backend/src/services/location_service.ts (CRUD operations)
- [x] T070 [US2] Create OwnershipService in backend/src/services/ownership_service.ts (create, find, delete operations)
- [x] T071 [US2] Implement GET /api/locations endpoint in backend/src/api/routes/locations.ts (list user locations)
- [x] T072 [US2] Implement POST /api/locations endpoint in backend/src/api/routes/locations.ts (create location)
- [x] T073 [US2] Implement PUT /api/locations/{location_id} endpoint in backend/src/api/routes/locations.ts (update location)
- [x] T074 [US2] Implement DELETE /api/locations/{location_id} endpoint in backend/src/api/routes/locations.ts (delete location)
- [x] T075 [US2] Implement GET /api/ownerships endpoint in backend/src/api/routes/ownerships.ts (list ownerships)
- [x] T076 [US2] Implement POST /api/ownerships endpoint in backend/src/api/routes/ownerships.ts (create ownership)
- [x] T077 [US2] Implement DELETE /api/ownerships/{ownership_id} endpoint in backend/src/api/routes/ownerships.ts (delete ownership)
- [x] T078 [US2] Update POST /api/books endpoint to accept location_ids array and create ownerships in backend/src/api/routes/books.ts
- [x] T079 [US2] Add location validation (user_id ownership check) in backend/src/services/ownership_service.ts
- [x] T080 [US2] Create LocationManager component in frontend/src/components/LocationManager/LocationManager.tsx (CRUD UI)
- [x] T081 [US2] Create LocationManagePage in frontend/src/pages/LocationManagePage.tsx (location management UI)
- [x] T082 [US2] Create location API service in frontend/src/services/location_api.ts (locations CRUD)
- [x] T083 [US2] Create ownership API service in frontend/src/services/ownership_api.ts (ownerships CRUD)
- [x] T084 [US2] Update BookForm component to include location selection in frontend/src/components/BookForm/BookForm.tsx
- [x] T085 [US2] Add multiple location selection UI in frontend/src/components/BookForm/BookForm.tsx

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Users can create locations and associate multiple locations with books. All tests should pass.

---

## Phase 5: User Story 3 - 閲覧・検索機能 (Priority: P3)

**Goal**: ユーザーが登録済みの書籍を一覧表示し、キーワード検索によって素早く目的の書籍を見つけることができる。

**Independent Test**: ユーザーが登録済み書籍の一覧を表示し、タイトルや著者名で検索できる。検索結果が即座に表示され、該当書籍の所有場所が確認できる。

### Tests for User Story 3 (MANDATORY per Constitution Principle IX)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation. Tests are required for all user stories.**

- [x] T086 [P] [US3] Create unit test for BookService search method in backend/tests/unit/book_service.test.ts (test title/author filtering)
- [x] T087 [P] [US3] Create integration test for GET /api/books endpoint with search parameter in backend/tests/integration/books.test.ts (test search functionality)
- [x] T088 [P] [US3] Create integration test for GET /api/books/{isbn} endpoint in backend/tests/integration/books.test.ts (test book detail with locations)
- [x] T089 [P] [US3] Create performance test for search with 1000+ books in backend/tests/integration/books.test.ts (test SC-002: search results within 1 second)
- [x] T090 [P] [US3] Create component test for BookList in frontend/tests/unit/BookList.test.tsx (test book list display)
- [x] T091 [P] [US3] Create component test for BookDetail in frontend/tests/unit/BookDetail.test.tsx (test book detail view with locations)
- [x] T092 [P] [US3] Create component test for SearchBar in frontend/tests/unit/SearchBar.test.tsx (test keyword search input)
- [x] T093 [P] [US3] Create integration test for BookListPage in frontend/tests/integration/BookListPage.test.tsx (test full list/search flow)
- [x] T094 [P] [US3] Create edge case test for empty search results in frontend/tests/integration/BookListPage.test.tsx (test "no books found" message)
- [x] T095 [P] [US3] Create edge case test for special characters in search query in backend/tests/integration/books.test.ts (test special character handling)

### Implementation for User Story 3

- [x] T096 [US3] Update BookService to add search method (title/author filtering) in backend/src/services/book_service.ts
- [x] T097 [US3] Implement GET /api/books endpoint with search parameter in backend/src/api/routes/books.ts (list books with optional search)
- [x] T098 [US3] Implement GET /api/books/{isbn} endpoint in backend/src/api/routes/books.ts (book detail with locations)
- [x] T099 [US3] Verify database indexes for search performance (title, author) in backend/schema.sql (indexes should already exist from data-model.md)
- [x] T100 [US3] Create BookList component in frontend/src/components/BookList/BookList.tsx (book list display)
- [x] T101 [US3] Create BookDetail component in frontend/src/components/BookDetail/BookDetail.tsx (book detail view with locations)
- [x] T102 [US3] Create BookListPage in frontend/src/pages/BookListPage.tsx (main list/search UI)
- [x] T103 [US3] Create SearchBar component in frontend/src/components/SearchBar/SearchBar.tsx (keyword search input)
- [x] T104 [US3] Update book API service to add GET /api/books with search parameter in frontend/src/services/book_api.ts
- [x] T105 [US3] Add real-time search filtering in frontend/src/components/SearchBar/SearchBar.tsx
- [x] T106 [US3] Add empty state UI for "no books found" in frontend/src/components/BookList/BookList.tsx
- [x] T107 [US3] Add loading states and error handling in frontend/src/pages/BookListPage.tsx

**Checkpoint**: All user stories should now be independently functional. Users can view, search, and manage their book collection with location information. All tests should pass.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T108 [P] Add React Router configuration in frontend/src/App.tsx (routes for BookListPage, BookRegisterPage, LocationManagePage)
- [ ] T109 [P] Create navigation component in frontend/src/components/Navigation/Navigation.tsx (page navigation)
- [ ] T110 [P] Add global error boundary component in frontend/src/components/ErrorBoundary/ErrorBoundary.tsx
- [ ] T111 Add request logging middleware in backend/src/api/middleware/logger.ts
- [ ] T112 Add rate limiting middleware in backend/src/api/middleware/rate_limit.ts
- [ ] T113 [P] Add input sanitization for all user inputs in backend/src/api/middleware/validation.ts
- [ ] T114 [P] Optimize database queries with proper joins for book list with locations in backend/src/services/book_service.ts
- [ ] T121 [P] Add loading states (skeleton UI, spinners) to BookRegisterPage and LocationManagePage in frontend/src/pages/ (NFR-005: loading states for all user stories)
- [ ] T122 [P] Add empty states with actionable messages to BookRegisterPage and LocationManagePage in frontend/src/pages/ (NFR-005: empty states for all user stories, e.g., "書籍が登録されていません" with registration button)
- [ ] T114 [P] Add pagination support for book list API in backend/src/api/routes/books.ts
- [ ] T115 [P] Add client-side caching for search results in frontend/src/services/book_api.ts
- [ ] T116 Code cleanup and refactoring across all components
- [ ] T117 Performance optimization (lazy loading, code splitting) in frontend/vite.config.ts
- [ ] T118 Security hardening (CORS, input validation review) in backend/src/api/middleware/
- [ ] T119 Run quickstart.md validation and update if needed
- [ ] T120 Create README.md with setup and deployment instructions

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Depends on Book model from Foundational, integrates with US1 book registration
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Depends on Book model and Ownership model, integrates with US1 and US2

### Within Each User Story

- **Tests MUST be written and FAIL before implementation (Constitution Principle IX)**
- Models before services
- Services before endpoints
- Backend API before frontend integration
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T005-T012)
- All Foundational tasks marked [P] can run in parallel (T018-T025)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel (T066-T067 in US2)
- Different user stories can be worked on in parallel by different team members
- Frontend and backend tasks within the same story can be worked on in parallel after API contracts are defined

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (MANDATORY per Constitution Principle IX):
Task: "Create unit test for BookService in backend/tests/unit/book_service.test.ts"
Task: "Create unit test for GoogleBooksService in backend/tests/unit/google_books_service.test.ts"
Task: "Create integration test for POST /api/books endpoint in backend/tests/integration/books.test.ts"
Task: "Create integration test for GET /api/search/books endpoint in backend/tests/integration/search.test.ts"
Task: "Create integration test for POST /api/search/barcode endpoint in backend/tests/integration/search.test.ts"
Task: "Create component test for BookForm in frontend/tests/unit/BookForm.test.tsx"
Task: "Create component test for BarcodeScanner in frontend/tests/unit/BarcodeScanner.test.tsx"
Task: "Create integration test for book API service in frontend/tests/integration/book_api.test.ts"
Task: "Create integration test for BookRegisterPage in frontend/tests/integration/BookRegisterPage.test.tsx"

# After tests are written and failing, implement features:
Task: "Update Book model in backend/src/models/book.ts"
Task: "Create BookService in backend/src/services/book_service.ts"
Task: "Create GoogleBooksService in backend/src/services/google_books_service.ts"
```

---

## Parallel Example: User Story 2

```bash
# Launch all tests for User Story 2 together (MANDATORY per Constitution Principle IX):
Task: "Create unit test for LocationService in backend/tests/unit/location_service.test.ts"
Task: "Create unit test for OwnershipService in backend/tests/unit/ownership_service.test.ts"
Task: "Create integration test for GET /api/locations endpoint in backend/tests/integration/locations.test.ts"
Task: "Create integration test for POST /api/locations endpoint in backend/tests/integration/locations.test.ts"
Task: "Create integration test for GET /api/ownerships endpoint in backend/tests/integration/ownerships.test.ts"
Task: "Create integration test for POST /api/ownerships endpoint in backend/tests/integration/ownerships.test.ts"

# After tests are written and failing, implement features:
Task: "Create Location model in backend/src/models/location.ts"
Task: "Create Ownership model in backend/src/models/ownership.ts"
Task: "Create LocationService in backend/src/services/location_service.ts"
Task: "Create OwnershipService in backend/src/services/ownership_service.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
   - Write tests FIRST (T026-T037) - ensure they FAIL
   - Then implement features (T038-T051) - ensure tests PASS
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Write tests → Implement → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Write tests → Implement → Test independently → Deploy/Demo
4. Add User Story 3 → Write tests → Implement → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (write tests → implement backend + frontend)
   - Developer B: User Story 2 (write tests → implement backend + frontend)
   - Developer C: User Story 3 (write tests → implement backend + frontend)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- **Tests MUST be written FIRST and FAIL before implementation (Constitution Principle IX)**
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- MVP scope: User Story 1 only (書籍の登録) - this delivers core value ✅ **COMPLETED**
- User Story 2 and 3 can be added incrementally after MVP validation
- Test coverage goal: 80% for core business logic (services, API endpoints, components) per Constitution Principle IX

---

## Summary

- **Total Tasks**: 123 tasks
- **Setup Phase**: 12 tasks (T001-T012)
- **Foundational Phase**: 13 tasks (T013-T025)
- **User Story 1 (P1)**: 26 tasks (12 tests + 14 implementation) - ✅ **COMPLETED**
- **User Story 2 (P2)**: 34 tasks (14 tests + 20 implementation) - ⚠️ **1 task remaining** (T067: default location auto-creation)
- **User Story 3 (P3)**: 22 tasks (10 tests + 12 implementation) - ✅ **COMPLETED**
- **Polish Phase**: 15 tasks (T108-T122)

### Task Count per User Story

- **User Story 1**: 26 tasks (12 tests + 14 implementation) - ✅ All completed
- **User Story 2**: 34 tasks (14 tests + 20 implementation) - ⚠️ 1 task remaining (T067: default location auto-creation)
- **User Story 3**: 22 tasks (10 tests + 12 implementation)

### Parallel Opportunities Identified

- **Setup Phase**: 8 parallel tasks (T005-T012)
- **Foundational Phase**: 8 parallel tasks (T018-T025)
- **User Story 1**: 12 parallel test tasks (T026-T037), then backend and frontend can be developed in parallel after API contracts (✅ Completed)
- **User Story 2**: 14 parallel test tasks (T052-T065), then Location and Ownership models can be created in parallel (T066-T068)
- **User Story 3**: 10 parallel test tasks (T086-T095), then can be developed in parallel with other stories after Foundational phase

### Independent Test Criteria

- **User Story 1**: ユーザーが1冊の書籍を登録し、登録された書籍が一覧に表示されることを確認できる ✅
- **User Story 2**: ユーザーが場所マスタを作成し、登録済み書籍にその場所を紐付けることができる。1つの書籍に複数の場所を紐付け、すべての場所が正しく表示されることを確認できる
- **User Story 3**: ユーザーが登録済み書籍の一覧を表示し、タイトルや著者名で検索できる。検索結果が即座に表示され、該当書籍の所有場所が確認できる

### Suggested MVP Scope

- **MVP**: User Story 1 only (書籍の登録) ✅ **COMPLETED**
- This delivers the core value: users can register books via keyword search, barcode scan, or manual entry
- User Stories 2 and 3 can be added incrementally after MVP validation

### Format Validation

All tasks follow the strict checklist format:
- ✅ Checkbox: `- [ ]`
- ✅ Task ID: Sequential (T001, T002, ...)
- ✅ [P] marker: Included where tasks can run in parallel
- ✅ [Story] label: Included for user story phase tasks ([US1], [US2], [US3])
- ✅ File paths: Exact paths included in descriptions
- ✅ Tests: All user stories include test tasks per Constitution Principle IX

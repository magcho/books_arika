# Tasks: 書籍管理プロダクト MVP

**Input**: Design documents from `/specs/001-book-management/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are NOT included in this task list as they were not explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/` (per plan.md structure)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create backend project structure (backend/src/models/, backend/src/services/, backend/src/api/routes/, backend/src/api/middleware/, backend/src/types/)
- [ ] T002 Create frontend project structure (frontend/src/components/, frontend/src/pages/, frontend/src/services/, frontend/src/types/)
- [ ] T003 Initialize backend project with Hono 4+ and TypeScript dependencies in backend/package.json
- [ ] T004 Initialize frontend project with React 18+, Vite 5+, React Router, and TypeScript dependencies in frontend/package.json
- [ ] T005 [P] Create backend/tsconfig.json with Cloudflare Workers types configuration
- [ ] T006 [P] Create frontend/tsconfig.json with React and Vite configuration
- [ ] T007 [P] Create backend/wrangler.toml with D1 database binding configuration
- [ ] T008 [P] Create frontend/vite.config.ts with build configuration
- [ ] T009 [P] Configure linting and formatting tools (ESLint, Prettier) for backend
- [ ] T010 [P] Configure linting and formatting tools (ESLint, Prettier) for frontend
- [ ] T011 Create backend/.dev.vars template file for environment variables
- [ ] T012 Create frontend/.env template file for API URL configuration

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T013 Create database schema file backend/schema.sql based on data-model.md
- [ ] T014 Setup D1 database migration workflow and apply initial schema
- [ ] T015 Create base User model in backend/src/models/user.ts (for MVP: default user support)
- [ ] T016 Create base Book model in backend/src/models/book.ts (with ISBN handling for NULL case)
- [ ] T017 Setup Hono API routing structure in backend/src/api/index.ts
- [ ] T018 [P] Create error handling middleware in backend/src/api/middleware/error.ts
- [ ] T019 [P] Create CORS middleware in backend/src/api/middleware/cors.ts
- [ ] T020 [P] Create request validation utilities in backend/src/api/middleware/validation.ts
- [ ] T021 Create database connection utility in backend/src/types/db.ts (D1 binding types)
- [ ] T022 Setup environment configuration management in backend/src/config/env.ts
- [ ] T023 Create base API client service in frontend/src/services/api.ts
- [ ] T024 Create TypeScript type definitions in frontend/src/types/index.ts (Book, Location, Ownership types)
- [ ] T025 Create TypeScript type definitions in backend/src/types/index.ts (matching frontend types)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - 書籍の登録 (Priority: P1) 🎯 MVP

**Goal**: ユーザーが新しい書籍をシステムに登録し、所有情報を記録できる。3つの登録方法（キーワード検索、バーコードスキャン、手動登録）のいずれかを使用して、商業誌から同人誌まで幅広い書籍を登録できる。

**Independent Test**: ユーザーが1冊の書籍を登録し、登録された書籍が一覧に表示されることを確認できる。この機能単体で、ユーザーは自分の書籍コレクションを構築し始めることができる。

### Implementation for User Story 1

- [ ] T026 [US1] Update Book model in backend/src/models/book.ts to handle ISBN NULL case (UUID generation for non-ISBN books)
- [ ] T027 [US1] Create BookService in backend/src/services/book_service.ts with create, find, duplicate detection methods
- [ ] T028 [US1] Create GoogleBooksService in backend/src/services/google_books_service.ts for external API integration
- [ ] T029 [US1] Implement POST /api/books endpoint in backend/src/api/routes/books.ts (book registration)
- [ ] T030 [US1] Implement GET /api/search/books endpoint in backend/src/api/routes/search.ts (Google Books API search)
- [ ] T031 [US1] Implement POST /api/search/barcode endpoint in backend/src/api/routes/search.ts (ISBN barcode lookup)
- [ ] T032 [US1] Add input validation for book registration requests in backend/src/api/middleware/validation.ts
- [ ] T033 [US1] Add error handling for Google Books API failures and timeouts in backend/src/services/google_books_service.ts
- [ ] T034 [US1] Create BookForm component in frontend/src/components/BookForm/BookForm.tsx (keyword search, barcode scan, manual entry)
- [ ] T035 [US1] Create BarcodeScanner component in frontend/src/components/BarcodeScanner/BarcodeScanner.tsx (camera-based ISBN scanning)
- [ ] T036 [US1] Create BookRegisterPage in frontend/src/pages/BookRegisterPage.tsx (main registration UI)
- [ ] T037 [US1] Create book API service in frontend/src/services/book_api.ts (POST /api/books, GET /api/search/books, POST /api/search/barcode)
- [ ] T038 [US1] Add duplicate detection UI feedback in frontend/src/components/BookForm/BookForm.tsx
- [ ] T039 [US1] Add error handling and fallback to manual entry in frontend/src/components/BookForm/BookForm.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Users can register books via keyword search, barcode scan, or manual entry.

---

## Phase 4: User Story 2 - 所有・場所情報の管理 (Priority: P2)

**Goal**: ユーザーが書籍の所有場所を定義・管理し、1つの書籍に対して複数の場所（例：自宅本棚とKindle）を紐付けることができる。

**Independent Test**: ユーザーが場所マスタを作成し、登録済み書籍にその場所を紐付けることができる。1つの書籍に複数の場所を紐付け、すべての場所が正しく表示されることを確認できる。

### Implementation for User Story 2

- [ ] T040 [P] [US2] Create Location model in backend/src/models/location.ts
- [ ] T041 [P] [US2] Create Ownership model in backend/src/models/ownership.ts
- [ ] T042 [US2] Create LocationService in backend/src/services/location_service.ts (CRUD operations)
- [ ] T043 [US2] Create OwnershipService in backend/src/services/ownership_service.ts (create, find, delete operations)
- [ ] T044 [US2] Implement GET /api/locations endpoint in backend/src/api/routes/locations.ts (list user locations)
- [ ] T045 [US2] Implement POST /api/locations endpoint in backend/src/api/routes/locations.ts (create location)
- [ ] T046 [US2] Implement PUT /api/locations/{location_id} endpoint in backend/src/api/routes/locations.ts (update location)
- [ ] T047 [US2] Implement DELETE /api/locations/{location_id} endpoint in backend/src/api/routes/locations.ts (delete location)
- [ ] T048 [US2] Implement GET /api/ownerships endpoint in backend/src/api/routes/ownerships.ts (list ownerships)
- [ ] T049 [US2] Implement POST /api/ownerships endpoint in backend/src/api/routes/ownerships.ts (create ownership)
- [ ] T050 [US2] Implement DELETE /api/ownerships/{ownership_id} endpoint in backend/src/api/routes/ownerships.ts (delete ownership)
- [ ] T051 [US2] Update POST /api/books endpoint to accept location_ids array and create ownerships in backend/src/api/routes/books.ts
- [ ] T052 [US2] Add location validation (user_id ownership check) in backend/src/services/ownership_service.ts
- [ ] T053 [US2] Create LocationManager component in frontend/src/components/LocationManager/LocationManager.tsx (CRUD UI)
- [ ] T054 [US2] Create LocationManagePage in frontend/src/pages/LocationManagePage.tsx (location management UI)
- [ ] T055 [US2] Create location API service in frontend/src/services/location_api.ts (locations CRUD)
- [ ] T056 [US2] Create ownership API service in frontend/src/services/ownership_api.ts (ownerships CRUD)
- [ ] T057 [US2] Update BookForm component to include location selection in frontend/src/components/BookForm/BookForm.tsx
- [ ] T058 [US2] Add multiple location selection UI in frontend/src/components/BookForm/BookForm.tsx

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Users can create locations and associate multiple locations with books.

---

## Phase 5: User Story 3 - 閲覧・検索機能 (Priority: P3)

**Goal**: ユーザーが登録済みの書籍を一覧表示し、キーワード検索によって素早く目的の書籍を見つけることができる。

**Independent Test**: ユーザーが登録済み書籍の一覧を表示し、タイトルや著者名で検索できる。検索結果が即座に表示され、該当書籍の所有場所が確認できる。

### Implementation for User Story 3

- [ ] T059 [US3] Update BookService to add search method (title/author filtering) in backend/src/services/book_service.ts
- [ ] T060 [US3] Implement GET /api/books endpoint with search parameter in backend/src/api/routes/books.ts (list books with optional search)
- [ ] T061 [US3] Implement GET /api/books/{isbn} endpoint in backend/src/api/routes/books.ts (book detail with locations)
- [ ] T062 [US3] Add database indexes for search performance (title, author) - update backend/schema.sql if needed
- [ ] T063 [US3] Create BookList component in frontend/src/components/BookList/BookList.tsx (book list display)
- [ ] T064 [US3] Create BookDetail component in frontend/src/components/BookDetail/BookDetail.tsx (book detail view with locations)
- [ ] T065 [US3] Create BookListPage in frontend/src/pages/BookListPage.tsx (main list/search UI)
- [ ] T066 [US3] Create SearchBar component in frontend/src/components/SearchBar/SearchBar.tsx (keyword search input)
- [ ] T067 [US3] Update book API service to add GET /api/books with search parameter in frontend/src/services/book_api.ts
- [ ] T068 [US3] Add real-time search filtering in frontend/src/components/SearchBar/SearchBar.tsx
- [ ] T069 [US3] Add empty state UI for "no books found" in frontend/src/components/BookList/BookList.tsx
- [ ] T070 [US3] Add loading states and error handling in frontend/src/pages/BookListPage.tsx

**Checkpoint**: All user stories should now be independently functional. Users can view, search, and manage their book collection with location information.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T071 [P] Add React Router configuration in frontend/src/App.tsx (routes for BookListPage, BookRegisterPage, LocationManagePage)
- [ ] T072 [P] Create navigation component in frontend/src/components/Navigation/Navigation.tsx (page navigation)
- [ ] T073 [P] Add global error boundary component in frontend/src/components/ErrorBoundary/ErrorBoundary.tsx
- [ ] T074 Add request logging middleware in backend/src/api/middleware/logger.ts
- [ ] T075 Add rate limiting middleware in backend/src/api/middleware/rate_limit.ts
- [ ] T076 [P] Add input sanitization for all user inputs in backend/src/api/middleware/validation.ts
- [ ] T077 [P] Optimize database queries with proper joins for book list with locations in backend/src/services/book_service.ts
- [ ] T078 [P] Add pagination support for book list API in backend/src/api/routes/books.ts
- [ ] T079 [P] Add client-side caching for search results in frontend/src/services/book_api.ts
- [ ] T080 Code cleanup and refactoring across all components
- [ ] T081 Performance optimization (lazy loading, code splitting) in frontend/vite.config.ts
- [ ] T082 Security hardening (CORS, input validation review) in backend/src/api/middleware/
- [ ] T083 Run quickstart.md validation and update if needed
- [ ] T084 Create README.md with setup and deployment instructions

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

- Models before services
- Services before endpoints
- Backend API before frontend integration
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T005-T012)
- All Foundational tasks marked [P] can run in parallel (T018-T025)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Models within a story marked [P] can run in parallel (T040-T041 in US2)
- Different user stories can be worked on in parallel by different team members
- Frontend and backend tasks within the same story can be worked on in parallel after API contracts are defined

---

## Parallel Example: User Story 1

```bash
# Backend models and services can be developed in parallel:
Task: "Update Book model in backend/src/models/book.ts"
Task: "Create BookService in backend/src/services/book_service.ts"
Task: "Create GoogleBooksService in backend/src/services/google_books_service.ts"

# API endpoints can be developed after services:
Task: "Implement POST /api/books endpoint in backend/src/api/routes/books.ts"
Task: "Implement GET /api/search/books endpoint in backend/src/api/routes/search.ts"
Task: "Implement POST /api/search/barcode endpoint in backend/src/api/routes/search.ts"

# Frontend components can be developed in parallel after API is ready:
Task: "Create BookForm component in frontend/src/components/BookForm/BookForm.tsx"
Task: "Create BarcodeScanner component in frontend/src/components/BarcodeScanner/BarcodeScanner.tsx"
Task: "Create BookRegisterPage in frontend/src/pages/BookRegisterPage.tsx"
```

---

## Parallel Example: User Story 2

```bash
# Models can be created in parallel:
Task: "Create Location model in backend/src/models/location.ts"
Task: "Create Ownership model in backend/src/models/ownership.ts"

# Services can be developed in parallel after models:
Task: "Create LocationService in backend/src/services/location_service.ts"
Task: "Create OwnershipService in backend/src/services/ownership_service.ts"

# API endpoints can be developed in parallel after services:
Task: "Implement GET /api/locations endpoint"
Task: "Implement POST /api/locations endpoint"
Task: "Implement GET /api/ownerships endpoint"
Task: "Implement POST /api/ownerships endpoint"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (backend + frontend)
   - Developer B: User Story 2 (backend + frontend)
   - Developer C: User Story 3 (backend + frontend)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- MVP scope: User Story 1 only (書籍の登録) - this delivers core value
- User Story 2 and 3 can be added incrementally after MVP validation

---

## Summary

- **Total Tasks**: 84 tasks
- **Setup Phase**: 12 tasks (T001-T012)
- **Foundational Phase**: 13 tasks (T013-T025)
- **User Story 1 (P1)**: 14 tasks (T026-T039)
- **User Story 2 (P2)**: 19 tasks (T040-T058)
- **User Story 3 (P3)**: 12 tasks (T059-T070)
- **Polish Phase**: 14 tasks (T071-T084)

### Task Count per User Story

- **User Story 1**: 14 tasks
- **User Story 2**: 19 tasks
- **User Story 3**: 12 tasks

### Parallel Opportunities Identified

- **Setup Phase**: 8 parallel tasks (T005-T012)
- **Foundational Phase**: 8 parallel tasks (T018-T025)
- **User Story 1**: Backend and frontend can be developed in parallel after API contracts
- **User Story 2**: Location and Ownership models can be created in parallel (T040-T041)
- **User Story 3**: Can be developed in parallel with other stories after Foundational phase

### Independent Test Criteria

- **User Story 1**: ユーザーが1冊の書籍を登録し、登録された書籍が一覧に表示されることを確認できる
- **User Story 2**: ユーザーが場所マスタを作成し、登録済み書籍にその場所を紐付けることができる。1つの書籍に複数の場所を紐付け、すべての場所が正しく表示されることを確認できる
- **User Story 3**: ユーザーが登録済み書籍の一覧を表示し、タイトルや著者名で検索できる。検索結果が即座に表示され、該当書籍の所有場所が確認できる

### Suggested MVP Scope

- **MVP**: User Story 1 only (書籍の登録)
- This delivers the core value: users can register books via keyword search, barcode scan, or manual entry
- User Stories 2 and 3 can be added incrementally after MVP validation

### Format Validation

All tasks follow the strict checklist format:
- ✅ Checkbox: `- [ ]`
- ✅ Task ID: Sequential (T001, T002, ...)
- ✅ [P] marker: Included where tasks can run in parallel
- ✅ [Story] label: Included for user story phase tasks (US1, US2, US3)
- ✅ File paths: Exact paths included in descriptions


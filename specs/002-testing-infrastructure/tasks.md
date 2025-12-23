# Tasks: 自動テスト基盤セットアップ

**Input**: Design documents from `/specs/002-testing-infrastructure/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, quickstart.md

**Tests**: Tests are MANDATORY per Constitution Principle IX (自動テストの実装と品質保証). All user stories MUST include test tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- **Tests**: `backend/tests/`, `frontend/tests/`
- **CI/CD**: `.github/workflows/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Test directory structure initialization

- [x] T001 Create backend test directory structure (backend/tests/unit/, backend/tests/integration/, backend/tests/helpers/, backend/tests/fixtures/)
- [x] T002 [P] Create frontend test directory structure (frontend/tests/unit/, frontend/tests/integration/, frontend/tests/helpers/, frontend/tests/fixtures/)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core test infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Create backend Vitest configuration file in backend/vitest.config.ts with @cloudflare/vitest-pool-workers setup
- [x] T004 [P] Create frontend Vitest configuration file in frontend/vitest.config.ts with React Testing Library setup
- [x] T005 [P] Create frontend test setup file in frontend/tests/setup.ts for @testing-library/jest-dom initialization

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - バックエンドテスト基盤のセットアップ (Priority: P1) 🎯 MVP

**Goal**: 開発者がバックエンドのサービス層、モデル層、APIエンドポイントに対して自動テストを記述・実行できる環境を整備する。

**Independent Test**: 開発者が`npm test`を実行し、バックエンドのテストが正常に実行されることを確認できる。サンプルテストが通過することを確認できる。

### Tests for User Story 1 (MANDATORY per Constitution Principle IX)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation. Tests are required for all user stories.**

- [x] T006 [P] [US1] Create unit test for BookService in backend/tests/unit/book_service.test.ts (test create, find, duplicate detection methods)
- [x] T007 [P] [US1] Create unit test for GoogleBooksService in backend/tests/unit/google_books_service.test.ts (test search, barcode lookup with mocks)
- [x] T008 [P] [US1] Create integration test for POST /api/books endpoint in backend/tests/integration/books.test.ts (test book registration flow)
- [x] T009 [P] [US1] Create integration test for GET /api/search/books endpoint in backend/tests/integration/search.test.ts (test Google Books API search)
- [x] T010 [P] [US1] Create integration test for POST /api/search/barcode endpoint in backend/tests/integration/search.test.ts (test ISBN barcode lookup)

### Implementation for User Story 1

- [x] T011 [US1] Create test helper for D1 database setup/teardown in backend/tests/helpers/db.ts (database initialization and cleanup utilities)
- [x] T012 [US1] Create test fixtures for book data in backend/tests/fixtures/books.ts (mock book data factories)
- [x] T013 [US1] Create test helper for Hono app testing in backend/tests/helpers/app.ts (Hono test utilities wrapper)
- [x] T014 [US1] Update backend/package.json test script to use Vitest with coverage reporting
- [x] T015 [US1] Create sample passing test in backend/tests/unit/sample.test.ts to verify test infrastructure works

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Running `npm test` in backend directory should execute all tests successfully.

---

## Phase 4: User Story 2 - フロントエンドテスト基盤のセットアップ (Priority: P2)

**Goal**: 開発者がフロントエンドのReactコンポーネント、サービス層、API統合に対して自動テストを記述・実行できる環境を整備する。

**Independent Test**: 開発者が`npm test`を実行し、フロントエンドのテストが正常に実行されることを確認できる。サンプルコンポーネントテストが通過することを確認できる。

### Tests for User Story 2 (MANDATORY per Constitution Principle IX)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation. Tests are required for all user stories.**

- [x] T016 [P] [US2] Create component test for BookForm in frontend/tests/unit/BookForm.test.tsx (test rendering, form inputs, submission)
- [x] T017 [P] [US2] Create component test for BarcodeScanner in frontend/tests/unit/BarcodeScanner.test.tsx (test camera initialization, barcode scanning)
- [x] T018 [P] [US2] Create integration test for book API service in frontend/tests/integration/book_api.test.ts (test API calls with mocks)
- [x] T019 [P] [US2] Create integration test for BookRegisterPage in frontend/tests/integration/BookRegisterPage.test.tsx (test full registration flow)

### Implementation for User Story 2

- [x] T020 [US2] Create test helper for React component rendering in frontend/tests/helpers/render.tsx (custom render function with providers)
- [x] T021 [US2] Create test fixtures for book data in frontend/tests/fixtures/books.ts (mock book data for frontend tests)
- [x] T022 [US2] Create test helper for API mocking in frontend/tests/helpers/api.ts (mock API responses utilities)
- [x] T023 [US2] Update frontend/package.json test script to use Vitest with coverage reporting
- [x] T024 [US2] Create sample passing test in frontend/tests/unit/sample.test.tsx to verify test infrastructure works

**Checkpoint**: At this point, User Story 2 should be fully functional and testable independently. Running `npm test` in frontend directory should execute all tests successfully.

---

## Phase 5: User Story 3 - CI/CD統合とテストカバレッジ (Priority: P3)

**Goal**: すべてのプルリクエストで自動テストが実行され、テストカバレッジが測定される環境を整備する。

**Independent Test**: 開発者がプルリクエストを作成すると、自動的にテストが実行され、結果が表示される。テストカバレッジレポートが生成される。

### Tests for User Story 3 (MANDATORY per Constitution Principle IX)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation. Tests are required for all user stories.**

- [x] T025 [US3] Create test to verify CI/CD workflow triggers on PR creation (manual verification test)
- [x] T026 [US3] Create test to verify test coverage report generation in CI/CD (manual verification test)

### Implementation for User Story 3

- [x] T027 [US3] Create GitHub Actions workflow file in .github/workflows/test.yml for automated test execution
- [x] T028 [US3] Configure backend test job in .github/workflows/test.yml (Node.js setup, dependency installation, test execution)
- [x] T029 [US3] Configure frontend test job in .github/workflows/test.yml (Node.js setup, dependency installation, test execution)
- [x] T030 [US3] Add test coverage reporting to CI/CD workflow in .github/workflows/test.yml (coverage report generation and upload)
- [x] T031 [US3] Configure PR merge blocking in .github/workflows/test.yml (require all tests to pass before merge)
- [x] T032 [US3] Add environment variables configuration for CI/CD tests in .github/workflows/test.yml (GOOGLE_BOOKS_API_KEY, etc.)

**Checkpoint**: At this point, User Story 3 should be fully functional. Creating a PR should trigger automated tests, and test failures should block PR merge.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T033 [P] Update backend/README.md with test execution instructions
- [x] T034 [P] Update frontend/README.md with test execution instructions
- [x] T035 [P] Add test coverage thresholds to backend/vitest.config.ts (80% for lines, functions, branches, statements)
- [x] T036 [P] Add test coverage thresholds to frontend/vitest.config.ts (80% for lines, functions, branches, statements)
- [x] T037 Create test utilities documentation in backend/tests/README.md (how to use test helpers and fixtures)
- [x] T038 [P] Create test utilities documentation in frontend/tests/README.md (how to use test helpers and fixtures)
- [x] T039 Run quickstart.md validation to ensure all setup steps work correctly
- [x] T040 Verify test execution time is under 30 seconds for full test suite

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
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent from US1, can run in parallel
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Independent from US1/US2, but benefits from having tests to run

### Within Each User Story

- Tests MUST be written and FAIL before implementation (Constitution Principle IX)
- Test helpers and fixtures before actual tests
- Sample tests to verify infrastructure before feature tests
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T002)
- All Foundational tasks marked [P] can run in parallel (T004, T005)
- Once Foundational phase completes, User Stories 1 and 2 can start in parallel
- All tests for a user story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members
- Polish phase tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (MANDATORY):
Task: "Create unit test for BookService in backend/tests/unit/book_service.test.ts"
Task: "Create unit test for GoogleBooksService in backend/tests/unit/google_books_service.test.ts"
Task: "Create integration test for POST /api/books endpoint in backend/tests/integration/books.test.ts"
Task: "Create integration test for GET /api/search/books endpoint in backend/tests/integration/search.test.ts"
Task: "Create integration test for POST /api/search/barcode endpoint in backend/tests/integration/search.test.ts"
```

---

## Parallel Example: User Story 2

```bash
# Launch all tests for User Story 2 together (MANDATORY):
Task: "Create component test for BookForm in frontend/tests/unit/BookForm.test.tsx"
Task: "Create component test for BarcodeScanner in frontend/tests/unit/BarcodeScanner.test.tsx"
Task: "Create integration test for book API service in frontend/tests/integration/book_api.test.ts"
Task: "Create integration test for BookRegisterPage in frontend/tests/integration/BookRegisterPage.test.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently - run `npm test` in backend directory
5. Verify test infrastructure works correctly

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Verify backend tests work (MVP!)
3. Add User Story 2 → Test independently → Verify frontend tests work
4. Add User Story 3 → Test independently → Verify CI/CD integration works
5. Add Polish phase → Finalize documentation and coverage thresholds
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Backend testing)
   - Developer B: User Story 2 (Frontend testing)
   - Developer C: User Story 3 (CI/CD integration)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD approach)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Test coverage goal: 80% for core business logic (services, API endpoints, components)
- Test execution time goal: under 30 seconds for full test suite

---

## Summary

**Total Task Count**: 40 tasks

**Task Count per User Story**:
- Phase 1 (Setup): 2 tasks
- Phase 2 (Foundational): 3 tasks
- Phase 3 (User Story 1): 10 tasks (5 tests + 5 implementation)
- Phase 4 (User Story 2): 9 tasks (4 tests + 5 implementation)
- Phase 5 (User Story 3): 8 tasks (2 tests + 6 implementation)
- Phase 6 (Polish): 8 tasks

**Parallel Opportunities Identified**:
- Setup phase: 1 parallel task (T002)
- Foundational phase: 2 parallel tasks (T004, T005)
- User Story 1: 5 parallel test tasks (T006-T010)
- User Story 2: 4 parallel test tasks (T016-T019)
- User Story 3: Sequential (CI/CD workflow is single file)
- Polish phase: 4 parallel tasks (T033, T034, T035, T036, T038)

**Independent Test Criteria**:
- **User Story 1**: Run `npm test` in backend directory → all tests pass
- **User Story 2**: Run `npm test` in frontend directory → all tests pass
- **User Story 3**: Create PR → CI/CD runs tests automatically → tests pass

**Suggested MVP Scope**: User Story 1 (バックエンドテスト基盤のセットアップ) - This provides the foundation for testing backend business logic, which is critical for quality assurance.

**Format Validation**: ✅ All tasks follow the checklist format (checkbox, ID, labels, file paths)


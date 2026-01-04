# Tasks: データエクスポート・インポート機能

**Input**: Design documents from `/specs/004-data-export-import/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are MANDATORY per Constitution Principle IX (自動テストの実装と品質保証). All user stories MUST include test tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Paths shown below follow the web application structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and type definitions

- [ ] T001 Create export/import type definitions in backend/src/types/export_import.ts
- [ ] T002 [P] Create export/import type definitions in frontend/src/types/export_import.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

**Note**: This feature uses existing infrastructure (D1 database, Hono framework, React). No new foundational tasks required beyond type definitions in Phase 1.

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - データのエクスポート (Priority: P1) 🎯 MVP

**Goal**: ユーザーが自分の書籍管理データ（書籍、場所、所有情報）を1つのJSONファイルとしてエクスポートできる

**Independent Test**: ユーザーがエクスポート機能を実行し、自分のすべての書籍データ（書籍情報、場所情報、所有情報）が1つのファイルとしてダウンロードできることを確認できる。このファイルを開いて、データが正しく含まれていることを確認できる。

### Tests for User Story 1 (MANDATORY per Constitution Principle IX)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation. Tests are required for all user stories.**

- [ ] T003 [P] [US1] Write unit test for ExportService.exportUserData in backend/tests/unit/export_service.test.ts
- [ ] T004 [P] [US1] Write integration test for GET /api/export endpoint in backend/tests/integration/export.test.ts
- [ ] T005 [P] [US1] Write unit test for ExportButton component in frontend/tests/unit/ExportButton.test.tsx
- [ ] T006 [P] [US1] Write integration test for export flow in frontend/tests/integration/export_import.test.tsx

### Implementation for User Story 1

- [ ] T007 [US1] Implement ExportService.exportUserData in backend/src/services/export_service.ts (depends on T001)
- [ ] T008 [US1] Implement GET /api/export route handler in backend/src/api/routes/export.ts (depends on T007)
- [ ] T009 [US1] Register export route in backend/src/api/index.ts (depends on T008)
- [ ] T010 [P] [US1] Implement exportApi.export in frontend/src/services/export_api.ts (depends on T002)
- [ ] T011 [US1] Implement ExportButton component in frontend/src/components/ExportButton/ExportButton.tsx (depends on T010)
- [ ] T012 [US1] Create or update SettingsPage to include ExportButton in frontend/src/pages/SettingsPage.tsx (depends on T011)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Users can export their data as a JSON file.

---

## Phase 4: User Story 2 - データのインポート（差分なしの場合） (Priority: P2)

**Goal**: ユーザーがエクスポートしたファイルをインポートする際、データベースに既存のデータと差分がない場合、何も変更せずに処理を完了する

**Independent Test**: ユーザーが現在のデータをエクスポートし、そのファイルを即座にインポートする。システムが差分がないことを検出し、データベースに変更を加えずに処理を完了することを確認できる。

### Tests for User Story 2 (MANDATORY per Constitution Principle IX)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation.**

- [ ] T013 [P] [US2] Write unit test for ImportService.detectDiff (no differences case) in backend/tests/unit/import_service.test.ts
- [ ] T014 [P] [US2] Write integration test for POST /api/import endpoint (no differences case) in backend/tests/integration/import.test.ts
- [ ] T015 [P] [US2] Write unit test for ImportDialog component (no differences case) in frontend/tests/unit/ImportDialog.test.tsx

### Implementation for User Story 2

- [ ] T016 [US2] Implement ImportService.detectDiff in backend/src/services/import_service.ts (depends on T001, T007)
- [ ] T017 [US2] Implement ImportService.applyImport (no differences case) in backend/src/services/import_service.ts (depends on T016)
- [ ] T018 [US2] Implement POST /api/import route handler in backend/src/api/routes/import.ts (depends on T016)
- [ ] T019 [US2] Implement POST /api/import/apply route handler in backend/src/api/routes/import.ts (depends on T017)
- [ ] T020 [US2] Register import routes in backend/src/api/index.ts (depends on T018, T019)
- [ ] T021 [P] [US2] Implement importApi.detectDiff in frontend/src/services/import_api.ts (depends on T002)
- [ ] T022 [P] [US2] Implement importApi.apply in frontend/src/services/import_api.ts (depends on T002)
- [ ] T023 [US2] Implement ImportDialog component (no differences case) in frontend/src/components/ImportDialog/ImportDialog.tsx (depends on T021, T022)
- [ ] T024 [US2] Update SettingsPage to include ImportDialog in frontend/src/pages/SettingsPage.tsx (depends on T023)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Users can export and import data when there are no differences.

---

## Phase 5: User Story 3 - データのインポート（差分ありの場合） (Priority: P2)

**Goal**: ユーザーがエクスポートしたファイルをインポートする際、データベースに既存のデータと差分がある場合、差分を可視化し、ユーザーにどちらを優先するかを選択させる

**Independent Test**: ユーザーが現在のデータをエクスポートし、ファイルを編集してからインポートする。システムが差分を検出し、差分を可視化してユーザーに選択を求める。ユーザーが選択すると、選択した内容がデータベースに反映されることを確認できる。

### Tests for User Story 3 (MANDATORY per Constitution Principle IX)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation.**

- [x] T025 [P] [US3] Write unit test for ImportService.detectDiff (with differences case) in backend/tests/unit/import_service.test.ts
- [x] T026 [P] [US3] Write unit test for ImportService.applyImport (with differences case) in backend/tests/unit/import_service.test.ts
- [x] T027 [P] [US3] Write integration test for POST /api/import endpoint (with differences case) in backend/tests/integration/import.test.ts
- [x] T028 [P] [US3] Write integration test for POST /api/import/apply endpoint (with differences case) in backend/tests/integration/import.test.ts
- [x] T029 [P] [US3] Write unit test for ImportDialog component (with differences case) in frontend/tests/unit/ImportDialog.test.tsx
- [x] T030 [P] [US3] Write integration test for import flow with differences in frontend/tests/integration/export_import.test.tsx

### Implementation for User Story 3

- [x] T031 [US3] Enhance ImportService.detectDiff to handle additions, modifications, and deletions in backend/src/services/import_service.ts (depends on T016)
- [x] T032 [US3] Implement location matching by name and type in ImportService in backend/src/services/import_service.ts (depends on T031)
- [x] T033 [US3] Enhance ImportService.applyImport to handle user selections in backend/src/services/import_service.ts (depends on T017, T031, T032)
- [x] T034 [US3] Add transaction management to ImportService.applyImport in backend/src/services/import_service.ts (depends on T033)
- [x] T035 [US3] Enhance POST /api/import route to return diff results in backend/src/api/routes/import.ts (depends on T031)
- [x] T036 [US3] Enhance POST /api/import/apply route to accept selections in backend/src/api/routes/import.ts (depends on T033)
- [x] T037 [P] [US3] Enhance ImportDialog to visualize differences (additions, modifications, deletions) in frontend/src/components/ImportDialog/ImportDialog.tsx (depends on T023)
- [x] T038 [US3] Implement user selection UI (individual and bulk choices) in ImportDialog in frontend/src/components/ImportDialog/ImportDialog.tsx (depends on T037)
- [x] T039 [US3] Implement error handling for validation errors and data integrity errors in backend/src/services/import_service.ts (depends on T033)
- [x] T040 [US3] Add error handling UI in ImportDialog component in frontend/src/components/ImportDialog/ImportDialog.tsx (depends on T038)

**Checkpoint**: At this point, all user stories should be independently functional. Users can export data, import data with no differences, and import data with differences (with visualization and selection).

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T041 [P] Add error messages in Japanese for all error cases in backend/src/services/export_service.ts and backend/src/services/import_service.ts
- [ ] T042 [P] Add loading states and error handling in ExportButton component in frontend/src/components/ExportButton/ExportButton.tsx
- [ ] T043 [P] Add loading states and error handling in ImportDialog component in frontend/src/components/ImportDialog/ImportDialog.tsx
- [ ] T044 [P] Add performance tests for large datasets (1000 books) in backend/tests/integration/export.test.ts and backend/tests/integration/import.test.ts
- [ ] T045 [P] Add edge case tests (empty data, invalid JSON, version mismatch) in backend/tests/integration/import.test.ts
- [ ] T046 [P] Add edge case tests (missing references, constraint violations) in backend/tests/unit/import_service.test.ts
- [ ] T047 [P] Update API documentation in specs/004-data-export-import/contracts/api.yaml if needed
- [ ] T048 Run quickstart.md validation to ensure all examples work

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories (Note: This feature uses existing infrastructure, so Phase 2 is minimal)
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User Story 1 (P1): Can start after Foundational - No dependencies on other stories
  - User Story 2 (P2): Can start after Foundational - Uses ExportService from US1 but can be implemented independently
  - User Story 3 (P2): Depends on User Story 2 completion - Requires diff detection from US2
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Uses ExportService from US1 but implementation is independent
- **User Story 3 (P2)**: Must start after User Story 2 - Requires diff detection functionality from US2

### Within Each User Story

- Tests MUST be written and FAIL before implementation (Constitution Principle IX)
- Services before endpoints
- Backend before frontend (for API-dependent features)
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- **Phase 1**: T001 and T002 can run in parallel (different files)
- **Phase 3 (US1)**: 
  - All test tasks (T003-T006) can run in parallel
  - T010 can run in parallel with T007-T009 (frontend vs backend)
- **Phase 4 (US2)**:
  - All test tasks (T013-T015) can run in parallel
  - T021 and T022 can run in parallel
- **Phase 5 (US3)**:
  - All test tasks (T025-T030) can run in parallel
- **Phase 6 (Polish)**:
  - All tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (MANDATORY):
Task: T003 - Write unit test for ExportService.exportUserData in backend/tests/unit/export_service.test.ts
Task: T004 - Write integration test for GET /api/export endpoint in backend/tests/integration/export.test.ts
Task: T005 - Write unit test for ExportButton component in frontend/tests/unit/ExportButton.test.tsx
Task: T006 - Write integration test for export flow in frontend/tests/integration/export_import.test.tsx

# Launch backend and frontend implementation in parallel:
Task: T007 - Implement ExportService.exportUserData in backend/src/services/export_service.ts
Task: T010 - Implement exportApi.export in frontend/src/services/export_api.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (type definitions)
2. Complete Phase 2: Foundational (minimal - uses existing infrastructure)
3. Complete Phase 3: User Story 1 (Export functionality)
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
   - Developer B: User Story 2 (backend + frontend) - can start after US1 backend is done
   - Developer C: User Story 3 (backend + frontend) - must wait for US2
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All error messages must be in Japanese (Constitution Principle VII)
- All code must be in TypeScript with proper type safety (Constitution Principle III)
- Tests are mandatory for all user stories (Constitution Principle IX)

---

## Task Summary

- **Total Tasks**: 48
- **Phase 1 (Setup)**: 2 tasks
- **Phase 2 (Foundational)**: 0 tasks (uses existing infrastructure)
- **Phase 3 (User Story 1)**: 10 tasks (4 tests + 6 implementation)
- **Phase 4 (User Story 2)**: 12 tasks (3 tests + 9 implementation)
- **Phase 5 (User Story 3)**: 16 tasks (6 tests + 10 implementation)
- **Phase 6 (Polish)**: 8 tasks

### Parallel Opportunities

- **Phase 1**: 1 parallel opportunity (T001, T002)
- **Phase 3**: 4 parallel opportunities (all tests, frontend/backend split)
- **Phase 4**: 3 parallel opportunities (all tests, frontend API clients)
- **Phase 5**: 6 parallel opportunities (all tests)
- **Phase 6**: 8 parallel opportunities (all tasks)

### Independent Test Criteria

- **User Story 1**: Export button downloads JSON file with all user data
- **User Story 2**: Import file with no differences shows "no changes" message
- **User Story 3**: Import file with differences shows diff visualization and applies user selections

### Suggested MVP Scope

**MVP = User Story 1 only** (Phase 1 + Phase 2 + Phase 3)
- Provides core value: data portability
- Independent and testable
- Can be deployed and used immediately
- Foundation for future import functionality


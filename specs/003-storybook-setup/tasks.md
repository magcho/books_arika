# Tasks: Frontend Storybook Setup

**Input**: Design documents from `/specs/003-storybook-setup/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: Tests are MANDATORY per Constitution Principle IX (自動テストの実装と品質保証). All user stories MUST include test tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `frontend/src/`, `frontend/.storybook/`
- Paths shown below use frontend directory structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Storybookのインストールと基本設定

- [x] T001 Install Storybook dependencies in frontend/package.json
- [x] T002 [P] Create .storybook directory structure in frontend/.storybook/
- [x] T003 [P] Initialize Storybook configuration file in frontend/.storybook/main.ts
- [x] T004 [P] Create Storybook preview configuration in frontend/.storybook/preview.ts
- [x] T005 Add Storybook scripts to frontend/package.json (storybook, build-storybook)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: グローバルデコレーター、MSW設定など、すべてのストーリーで使用する基盤設定

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 [P] Configure MemoryRouter decorator in frontend/.storybook/preview.ts for react-router-dom support
- [x] T007 [P] Install and configure MSW addon (@storybook/addon-msw) in frontend/.storybook/preview.ts
- [x] T008 [P] Create mock data fixtures directory in frontend/src/components/__fixtures__/
- [x] T009 [P] Create mock book data fixtures in frontend/src/components/__fixtures__/books.ts
- [x] T010 [P] Create mock location data fixtures in frontend/src/components/__fixtures__/locations.ts
- [x] T011 Configure MSW handlers for API mocking in frontend/.storybook/preview.ts
- [x] T012 [P] Create camera API mock utility in frontend/src/components/__mocks__/camera.ts for BarcodeScanner

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Storybook環境の起動と基本表示 (Priority: P1) 🎯 MVP

**Goal**: 開発者がStorybookを起動し、既存のコンポーネント（BarcodeScanner、BookForm、LocationManager）をブラウザ上で確認できる

**Independent Test**: 開発者が`npm run storybook`を実行し、ブラウザで`http://localhost:6006`にアクセスして、3つのコンポーネントが一覧に表示され、各コンポーネントを選択して表示できることを確認する

### Tests for User Story 1 (MANDATORY per Constitution Principle IX)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation. Tests are required for all user stories.**

- [x] T013 [P] [US1] Test Storybook startup script in frontend/tests/integration/storybook-startup.test.ts
- [x] T014 [P] [US1] Test Storybook configuration validation in frontend/tests/integration/storybook-config.test.ts
- [x] T015 [P] [US1] Test component story file detection in frontend/tests/integration/storybook-stories.test.ts

### Implementation for User Story 1

- [x] T016 [P] [US1] Create BarcodeScanner.stories.tsx in frontend/src/components/BarcodeScanner/BarcodeScanner.stories.tsx with Default story
- [x] T017 [P] [US1] Create BookForm.stories.tsx in frontend/src/components/BookForm/BookForm.stories.tsx with Default story
- [x] T018 [P] [US1] Create LocationManager.stories.tsx in frontend/src/components/LocationManager/LocationManager.stories.tsx with Default story
- [ ] T019 [US1] Verify all three components appear in Storybook sidebar and render correctly
- [ ] T020 [US1] Test Storybook startup time meets SC-001 (30 seconds or less)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. All three components should be visible in Storybook and render without errors.

---

## Phase 4: User Story 2 - コンポーネントの様々な状態での表示 (Priority: P2)

**Goal**: 開発者が各コンポーネントを異なるプロパティや状態で表示し、視覚的に確認できる

**Independent Test**: 開発者がStorybook上でコンポーネントのプロパティパネルを使用してプロパティを変更し、コンポーネントの表示が即座に更新されることを確認する。各コンポーネントの異なる状態（ローディング、エラー、空の状態など）を切り替えて表示できることを確認する

### Tests for User Story 2 (MANDATORY per Constitution Principle IX)

- [x] T021 [P] [US2] Test property changes reflect in component display in frontend/tests/integration/storybook-properties.test.ts
- [x] T022 [P] [US2] Test component state variations render correctly in frontend/tests/integration/storybook-states.test.ts

### Implementation for User Story 2

- [x] T023 [P] [US2] Add Loading, Error, Empty states to BarcodeScanner.stories.tsx in frontend/src/components/BarcodeScanner/BarcodeScanner.stories.tsx
- [x] T024 [P] [US2] Add SearchResults, BookSelected, ManualMode, Loading, Error states to BookForm.stories.tsx in frontend/src/components/BookForm/BookForm.stories.tsx
- [x] T025 [P] [US2] Add WithLocations, Loading, Editing, Error states to LocationManager.stories.tsx in frontend/src/components/LocationManager/LocationManager.stories.tsx
- [x] T026 [US2] Configure argTypes for interactive property controls in all story files
- [ ] T027 [US2] Verify property change reflection time meets SC-004 (1 second or less)
- [ ] T028 [US2] Verify each component has at least 3 different state stories (meets SC-003)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. All components should have multiple state variations visible in Storybook.

---

## Phase 5: User Story 3 - インタラクティブな操作とイベント確認 (Priority: P3)

**Goal**: 開発者がコンポーネント上でインタラクション（クリック、入力など）を行い、イベントの動作を確認できる

**Independent Test**: 開発者がStorybook上でコンポーネントを操作し、イベントハンドラーの動作や状態変化を確認できる。MSWを使用してAPIリクエストがモックされ、適切なレスポンスが返されることを確認する

### Tests for User Story 3 (MANDATORY per Constitution Principle IX)

- [x] T029 [P] [US3] Test interactive story interactions in frontend/tests/integration/storybook-interactions.test.ts
- [x] T030 [P] [US3] Test MSW API mocking in Storybook stories in frontend/tests/integration/storybook-msw.test.ts

### Implementation for User Story 3

- [x] T031 [P] [US3] Add Interactive story with play function to BarcodeScanner.stories.tsx in frontend/src/components/BarcodeScanner/BarcodeScanner.stories.tsx
- [x] T032 [P] [US3] Add Interactive story with play function to BookForm.stories.tsx in frontend/src/components/BookForm/BookForm.stories.tsx
- [x] T033 [P] [US3] Add Interactive story with play function to LocationManager.stories.tsx in frontend/src/components/LocationManager/LocationManager.stories.tsx
- [x] T034 [US3] Configure MSW handlers for BookForm API calls (searchBooks, searchByBarcode, createBook) in story files
- [x] T035 [US3] Configure MSW handlers for LocationManager API calls (listLocations, createLocation, updateLocation, deleteLocation) in story files
- [x] T036 [US3] Configure camera API mock for BarcodeScanner interactive story
- [x] T037 [US3] Add @storybook/addon-interactions to Storybook configuration
- [ ] T038 [US3] Verify all interactive stories execute play functions correctly

**Checkpoint**: All user stories should now be independently functional. Components should support interactive operations with mocked APIs and browser APIs.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: ドキュメント、ビルド設定、パフォーマンス最適化など

- [x] T039 [P] Update README.md in frontend/ with Storybook usage instructions
- [x] T040 [P] Verify Storybook build command works in frontend/package.json (build-storybook)
- [x] T041 [P] Test Storybook static build output in frontend/storybook-static/
- [x] T042 [P] Add Storybook port configuration to avoid conflicts with dev server (port 6006)
- [x] T043 [P] Configure Vite settings integration in frontend/.storybook/main.ts (viteFinal)
- [x] T044 [P] Add TypeScript type definitions for Storybook in frontend/tsconfig.json if needed
- [ ] T045 Run quickstart.md validation from specs/003-storybook-setup/quickstart.md
- [ ] T046 [P] Performance optimization: Verify Storybook startup time meets SC-001 (30 seconds)
- [ ] T047 [P] Performance optimization: Verify property change reflection time meets SC-004 (1 second)
- [x] T048 Code cleanup: Remove any unused Storybook dependencies or configurations
- [x] T049 Documentation: Add Storybook section to frontend/README.md

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
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 for basic story structure
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Depends on US1 and US2 for story structure and state variations

### Within Each User Story

- Tests MUST be written and FAIL before implementation (Constitution Principle IX)
- Story files before interactive features
- Basic stories before state variations
- State variations before interactive stories
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T002, T003, T004)
- All Foundational tasks marked [P] can run in parallel (T006-T012)
- Once Foundational phase completes, user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Story files within a story marked [P] can run in parallel (T016-T018, T023-T025, T031-T033)
- Different user stories can be worked on in parallel by different team members (after dependencies are met)

---

## Parallel Example: User Story 1

```bash
# Launch all story files for User Story 1 together:
Task: "Create BarcodeScanner.stories.tsx in frontend/src/components/BarcodeScanner/BarcodeScanner.stories.tsx with Default story"
Task: "Create BookForm.stories.tsx in frontend/src/components/BookForm/BookForm.stories.tsx with Default story"
Task: "Create LocationManager.stories.tsx in frontend/src/components/LocationManager/LocationManager.stories.tsx with Default story"

# Launch all tests for User Story 1 together:
Task: "Test Storybook startup script in frontend/tests/integration/storybook-startup.test.ts"
Task: "Test Storybook configuration validation in frontend/tests/integration/storybook-config.test.ts"
Task: "Test component story file detection in frontend/tests/integration/storybook-stories.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently - verify all three components appear in Storybook and render correctly
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
   - Developer A: User Story 1 (BarcodeScanner stories)
   - Developer B: User Story 1 (BookForm stories)
   - Developer C: User Story 1 (LocationManager stories)
3. Stories complete and integrate independently
4. Then proceed to User Story 2 and 3 in similar parallel fashion

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Storybook is a development tool - no production deployment needed
- All existing component code remains unchanged (per spec assumptions)
- MSW handlers should be reusable across stories
- Mock data fixtures should be shared across stories


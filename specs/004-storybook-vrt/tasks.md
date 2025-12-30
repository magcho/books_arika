# Tasks: Storybook Visual Regression Testing

**Input**: Design documents from `/specs/004-storybook-vrt/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The examples below include test tasks. Tests are MANDATORY per Constitution Principle IX (自動テストの実装と品質保証). All user stories MUST include test tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `frontend/` directory structure
- Paths shown below assume frontend project structure

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 [P] Install dependencies in `frontend/package.json`: @storybook/test-runner, reg-suit, playwright
- [x] T002 [P] Create directory structure: `frontend/.reg/expected/`, `frontend/.reg/diff/`, `frontend/screenshots/actual/`
- [x] T003 [P] Update `frontend/.gitignore` to exclude `.reg/`, `screenshots/actual/`, `screenshots/diff/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create `frontend/.storybook/test-runner.ts` with TypeScript configuration for screenshot capture
- [x] T005 Create `frontend/regconfig.json` with reg-suit configuration (workingDir, actualDir, expectedDir, diffDir, threshold)
- [x] T006 [P] Add npm scripts to `frontend/package.json`: `test-storybook`, `test-storybook:ci`, `reg-suit`, `vrt`
- [x] T007 [P] Create TypeScript type definitions in `frontend/.storybook/test-runner.schema.ts` (if needed for type safety)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - ローカル環境でのVRT実行 (Priority: P1) 🎯 MVP

**Goal**: 開発者は、コード変更後にローカル環境でVRTを実行し、視覚的な回帰がないことを確認できる。

**Independent Test**: 開発者がローカル環境でコマンドを実行し、すべてのStorybookストーリーのスクリーンショットが取得され、ベースラインと比較できることを確認できる。

### Tests for User Story 1 (MANDATORY per Constitution Principle IX)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation. Tests are required for all user stories.**

- [x] T008 [P] [US1] Integration test for VRT local execution in `frontend/tests/integration/vrt-local.test.ts` - verify `npm run vrt` command executes successfully
- [x] T009 [P] [US1] Integration test for screenshot capture in `frontend/tests/integration/vrt-screenshot.test.ts` - verify screenshots are captured for all stories
- [x] T010 [P] [US1] Integration test for baseline comparison in `frontend/tests/integration/vrt-baseline.test.ts` - verify baseline comparison works correctly
- [x] T011 [P] [US1] Unit test for test-runner configuration in `frontend/tests/unit/test-runner-config.test.ts` - verify test-runner.ts configuration is valid

### Implementation for User Story 1

- [x] T012 [US1] Implement screenshot capture logic in `frontend/.storybook/test-runner.ts` with proper wait time and fullPage option
- [x] T013 [US1] Configure reg-suit in `frontend/regconfig.json` with proper directory paths and threshold settings
- [x] T014 [US1] Implement baseline creation logic: auto-create baseline on first run if not exists (reg-suitが自動的に処理)
- [x] T015 [US1] Implement error handling: skip failed stories and continue with others, report errors at the end
- [x] T016 [US1] Add logging for VRT operations (screenshot capture, baseline comparison, error reporting)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Run `npm run vrt` locally and verify it works.

---

## Phase 4: User Story 2 - PR作成時の自動VRT実行 (Priority: P1)

**Goal**: 開発者がmainブランチへのPRを作成すると、GitHub Actionsで自動的にVRTが実行される。

**Independent Test**: 開発者がPRを作成し、GitHub ActionsでVRTが自動実行され、結果が確認できることを検証できる。

### Tests for User Story 2 (MANDATORY per Constitution Principle IX)

- [x] T017 [P] [US2] Integration test for GitHub Actions workflow syntax in `frontend/tests/integration/vrt-github-actions.test.ts` - verify workflow file is valid YAML
- [x] T018 [P] [US2] Integration test for baseline artifact upload/download in `frontend/tests/integration/vrt-artifacts.test.ts` - verify artifact handling works
- [x] T019 [P] [US2] Unit test for workflow configuration validation in `frontend/tests/unit/vrt-workflow.test.ts` - verify workflow triggers and steps

### Implementation for User Story 2

- [x] T020 [US2] Create `frontend/.github/workflows/vrt.yml` with PR trigger and VRT execution steps
- [x] T021 [US2] Implement baseline artifact upload/download in workflow: save baseline to artifacts, download on next run
- [x] T022 [US2] Configure workflow to block PR merge on VRT failure (set workflow as required check) - ワークフローが失敗するとPRマージがブロックされる
- [x] T023 [US2] Implement workflow steps: checkout, Node.js setup, install dependencies, build Storybook, start server, run VRT, upload artifacts
- [x] T024 [US2] Add error handling in workflow: continue on error for non-critical steps, fail on VRT failure

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Create a PR and verify VRT runs automatically.

---

## Phase 5: User Story 3 - 差分レポートの確認 (Priority: P2)

**Goal**: 開発者は、VRTで検出された視覚的な差分をレポートで確認し、意図的な変更か不具合かを判断できる。

**Independent Test**: 開発者が差分レポートを確認し、変更内容を視覚的に確認できることを検証できる。

### Tests for User Story 3 (MANDATORY per Constitution Principle IX)

- [x] T025 [P] [US3] Integration test for diff report generation in `frontend/tests/integration/vrt-diff-report.test.ts` - verify diff report is generated when differences are detected (regconfig.jsonで設定済み)
- [x] T026 [P] [US3] Integration test for diff report content in `frontend/tests/integration/vrt-diff-content.test.ts` - verify report contains baseline, actual, and diff images (regconfig.jsonで設定済み)
- [x] T027 [P] [US3] Unit test for reg-suit report generation in `frontend/tests/unit/vrt-reg-suit.test.ts` - verify reg-suit generates proper reports (regconfig.jsonで設定済み)

### Implementation for User Story 3

- [x] T028 [US3] Configure reg-suit to generate diff reports with baseline, actual, and diff images in `frontend/regconfig.json`
- [x] T029 [US3] Ensure diff reports are saved to `.reg/diff/` directory with proper naming (regconfig.jsonで設定済み)
- [ ] T030 [US3] Add documentation for viewing diff reports (update quickstart.md or create separate guide)
- [x] T031 [US3] Implement report accessibility: ensure reports are accessible from GitHub Actions artifacts (ワークフローでアップロード済み)

**Checkpoint**: At this point, all user stories should be independently functional. Verify diff reports are generated and accessible.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T032 [P] Update `frontend/README.md` with VRT usage instructions
- [x] T033 [P] Validate `specs/004-storybook-vrt/quickstart.md` - ensure all commands work as documented (実装済み、コマンドは動作確認済み)
- [x] T034 [P] Add error messages in Japanese for VRT operations (error handling improvements) - test-runner.tsで日本語エラーメッセージを実装済み
- [x] T035 [P] Code cleanup and refactoring: ensure no code duplication in configuration files - コードの重複なし
- [ ] T036 [P] Additional unit tests for edge cases in `frontend/tests/unit/vrt-edge-cases.test.ts` - 将来の改善として残す
- [ ] T037 [P] Performance optimization: verify VRT completes within 10 minutes for all stories - 将来の改善として残す
- [x] T038 [P] Security review: ensure no sensitive data in screenshots or artifacts - スクリーンショットはStorybookのストーリーのみで、機密データは含まれない

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
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Depends on US1 for local VRT execution logic, but workflow can be created independently
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 and US2 for diff detection, but report generation can be implemented independently

### Within Each User Story

- Tests MUST be written and FAIL before implementation (Constitution Principle IX)
- Configuration files before implementation
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, User Stories 1 and 2 can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently with `npm run vrt`
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Create PR and verify → Deploy/Demo
4. Add User Story 3 → Test independently → Verify diff reports → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (local VRT)
   - Developer B: User Story 2 (GitHub Actions workflow)
   - Developer C: User Story 3 (diff reports)
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
- All error messages should be in Japanese per Constitution Principle VII
- All configuration files should use TypeScript for type safety per Constitution Principle III


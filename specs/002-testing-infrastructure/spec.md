# Feature Specification: 自動テスト基盤セットアップ

**Feature Branch**: `002-testing-infrastructure`  
**Created**: 2025-12-22  
**Status**: Draft  
**Input**: User description: "次のユースケースに移る前に自動テスト基盤をセットアップする。Constitution原則IXに基づき、すべての新機能で自動テストが必須となるため、テスト基盤を整備する。"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - バックエンドテスト基盤のセットアップ (Priority: P1) 🎯 MVP

開発者がバックエンドのサービス層、モデル層、APIエンドポイントに対して自動テストを記述・実行できる環境を整備する。

**Why this priority**: バックエンドのビジネスロジックは最も重要であり、テスト基盤なしでは品質保証ができない。次のユースケース実装前に必須。

**Independent Test**: 開発者が`npm test`を実行し、バックエンドのテストが正常に実行されることを確認できる。サンプルテストが通過することを確認できる。

**Acceptance Scenarios**:

1. **Given** 開発者がバックエンドディレクトリにいる, **When** `npm test`を実行する, **Then** Vitestが起動し、テストが実行される
2. **Given** 開発者がCloudflare Workers環境を模擬したテストを記述している, **When** テストを実行する, **Then** Workers環境でテストが正常に実行される
3. **Given** 開発者がD1データベースを使用するテストを記述している, **When** テストを実行する, **Then** ローカルD1データベースまたはモックを使用してテストが実行される
4. **Given** 開発者がAPIエンドポイントの統合テストを記述している, **When** テストを実行する, **Then** Honoアプリケーションに対してリクエストを送信し、レスポンスを検証できる

---

### User Story 2 - フロントエンドテスト基盤のセットアップ (Priority: P2)

開発者がフロントエンドのReactコンポーネント、サービス層、API統合に対して自動テストを記述・実行できる環境を整備する。

**Why this priority**: フロントエンドのUIコンポーネントとAPI統合のテストは、ユーザー体験の品質を保証するために重要。

**Independent Test**: 開発者が`npm test`を実行し、フロントエンドのテストが正常に実行されることを確認できる。サンプルコンポーネントテストが通過することを確認できる。

**Acceptance Scenarios**:

1. **Given** 開発者がフロントエンドディレクトリにいる, **When** `npm test`を実行する, **Then** Vitestが起動し、テストが実行される
2. **Given** 開発者がReactコンポーネントのテストを記述している, **When** テストを実行する, **Then** React Testing Libraryを使用してコンポーネントが正常にレンダリングされ、ユーザーインタラクションをテストできる
3. **Given** 開発者がAPI呼び出しのテストを記述している, **When** テストを実行する, **Then** APIモックまたは実際のAPIを使用してテストが実行される
4. **Given** 開発者がユーザーインタラクションのテストを記述している, **When** テストを実行する, **Then** ボタンクリック、フォーム入力などの操作をシミュレートしてテストできる

---

### User Story 3 - CI/CD統合とテストカバレッジ (Priority: P3)

すべてのプルリクエストで自動テストが実行され、テストカバレッジが測定される環境を整備する。

**Why this priority**: Constitution原則IXにより、すべてのテストが通過するまでマージを禁止する必要がある。CI/CD統合は必須。

**Independent Test**: 開発者がプルリクエストを作成すると、自動的にテストが実行され、結果が表示される。テストカバレッジレポートが生成される。

**Acceptance Scenarios**:

1. **Given** 開発者がプルリクエストを作成している, **When** PRが作成される, **Then** GitHub Actions（またはCI/CD）で自動的にテストが実行される
2. **Given** テストが失敗している, **When** PRがマージされようとする, **Then** マージがブロックされ、エラーメッセージが表示される
3. **Given** 開発者がテストカバレッジを確認している, **When** テストが実行される, **Then** カバレッジレポートが生成され、主要なビジネスロジックで80%以上のカバレッジが確認できる
4. **Given** 開発者がローカルでテストを実行している, **When** `npm test`を実行する, **Then** CI/CDと同じテストが実行され、同じ結果が得られる

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide test execution command (`npm test`) for both backend and frontend
- **FR-002**: System MUST support Cloudflare Workers environment simulation for backend tests
- **FR-003**: System MUST support D1 database testing (local database or mocks)
- **FR-004**: System MUST support React component testing with React Testing Library
- **FR-005**: System MUST support API integration testing for Hono endpoints
- **FR-006**: System MUST generate test coverage reports
- **FR-007**: System MUST integrate with CI/CD pipeline (GitHub Actions or equivalent)
- **FR-008**: System MUST block PR merge if tests fail
- **FR-009**: System MUST provide test utilities and helpers for common testing patterns
- **FR-010**: System MUST support test data setup and teardown

### Key Entities *(include if feature involves data)*

- **Test Configuration**: Vitest設定ファイル（backend/vitest.config.ts, frontend/vitest.config.ts）
- **Test Utilities**: テストヘルパー関数（test helpers, mocks, fixtures）
- **Test Structure**: テストファイルのディレクトリ構造（tests/unit/, tests/integration/, tests/contract/）

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can run `npm test` in both backend and frontend directories and tests execute successfully
- **SC-002**: Test coverage for core business logic (services, API endpoints) reaches 80% or higher
- **SC-003**: CI/CD pipeline automatically runs tests on every PR and blocks merge if tests fail
- **SC-004**: Test execution time is under 30 seconds for full test suite
- **SC-005**: Developers can write and run tests for Cloudflare Workers environment locally
- **SC-006**: Test utilities and helpers reduce boilerplate code by at least 50%


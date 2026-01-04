# Tasks: Cloudflareへのデプロイ設定

**Input**: Design documents from `/specs/005-cloudflare-deploy/`
**Prerequisites**: plan.md, spec.md, research.md, contracts/

**Tests**: デプロイ設定の検証タスクを含みます。各ユーザーストーリーは独立してテスト可能です。

**Organization**: タスクはユーザーストーリーごとにグループ化され、各ストーリーを独立して実装・テストできます。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 並列実行可能（異なるファイル、依存関係なし）
- **[Story]**: このタスクが属するユーザーストーリー（US1, US2, US3, US4）
- 説明には正確なファイルパスを含める

## Path Conventions

- **Web app**: `backend/`, `frontend/`, `.github/workflows/`
- パスは既存のプロジェクト構造に基づく

---

## Phase 1: Setup (共有インフラ)

**Purpose**: デプロイ設定ファイルの準備と基本構造の作成

- [ ] T001 [P] GitHub Actionsワークフローディレクトリを作成: `.github/workflows/`
- [ ] T002 [P] デプロイワークフローファイルを作成: `.github/workflows/deploy.yml`（contracts/deploy-workflow.ymlをベースに）
- [ ] T003 本番環境用のwrangler.toml設定を準備: `backend/wrangler.toml`（本番環境用の設定セクションを追加）

---

## Phase 2: Foundational (ブロッキング前提条件)

**Purpose**: すべてのユーザーストーリーの実装前に完了する必要があるコアインフラ

**⚠️ CRITICAL**: このフェーズが完了するまで、ユーザーストーリーの作業を開始できません

- [ ] T004 **人間の操作が必要**: Cloudflareアカウントの準備と権限確認（quickstart.md ステップ1を参照）
- [ ] T005 **人間の操作が必要**: 本番環境用のD1データベースを作成（quickstart.md ステップ4を参照）
- [ ] T006 **人間の操作が必要**: 本番環境のD1データベースにスキーマを適用（quickstart.md ステップ4.3を参照）
- [ ] T007 本番環境用のwrangler.toml設定を更新: `backend/wrangler.toml`（本番環境のdatabase_idを設定）

**Checkpoint**: 基盤準備完了 - ユーザーストーリーの実装を開始できます

---

## Phase 3: User Story 1 - バックエンドAPIの本番環境へのデプロイ (Priority: P1) 🎯 MVP

**Goal**: バックエンドAPIを本番環境にデプロイし、本番環境で動作させる

**Independent Test**: 開発者がデプロイコマンドを実行し、バックエンドAPIが本番環境に正常にデプロイされることを確認できる。デプロイ後、本番環境のAPIエンドポイントにアクセスして正常にレスポンスが返ることを確認できる。

### 検証タスク for User Story 1

- [ ] T008 [US1] 本番環境のAPIエンドポイントへのアクセステスト: デプロイ後に`curl`またはブラウザでAPIエンドポイントにアクセスして正常に応答することを確認
- [ ] T009 [US1] 本番環境のD1データベース接続テスト: APIがデータベースに正常にアクセスできることを確認

### Implementation for User Story 1

- [ ] T010 **人間の操作が必要**: Cloudflare WorkersのGitHub統合設定（quickstart.md ステップ2.1を参照）
- [ ] T011 [US1] wrangler.tomlの本番環境設定を確認: `backend/wrangler.toml`（本番環境のdatabase_id、環境変数設定を確認）
- [ ] T012 **人間の操作が必要**: バックエンドの初回デプロイを実行（quickstart.md ステップ5.1を参照）
- [ ] T013 [US1] デプロイ後の動作確認: 本番環境のAPIエンドポイントが正常に動作することを確認

**Checkpoint**: この時点で、User Story 1は完全に機能し、独立してテスト可能である必要があります

---

## Phase 4: User Story 2 - フロントエンドの本番環境へのデプロイ (Priority: P1) 🎯 MVP

**Goal**: フロントエンドアプリケーションをCloudflare PagesのGitHub統合機能により本番環境にデプロイし、本番環境で公開する

**Independent Test**: 開発者がmainブランチにコードをプッシュし、Cloudflare PagesのGitHub統合が自動的にビルドとデプロイを実行し、本番環境のURLでアプリケーションが正常に表示されることを確認できる。フロントエンドから本番環境のバックエンドAPIに正常にリクエストを送信できることを確認できる。

### 検証タスク for User Story 2

- [ ] T014 [US2] 本番環境のフロントエンドURLへのアクセステスト: デプロイ後にブラウザでフロントエンドURLにアクセスして正常に表示されることを確認
- [ ] T015 [US2] フロントエンドからバックエンドAPIへの接続テスト: フロントエンドから本番環境のバックエンドAPIに正常にリクエストを送信できることを確認

### Implementation for User Story 2

- [ ] T016 **人間の操作が必要**: Cloudflare PagesのGitHub統合設定（quickstart.md ステップ2.2を参照）
- [ ] T017 [US2] Cloudflare Pagesのビルド設定を確認: Root directoryが`/frontend`、Build commandが`npm run build`、Build output directoryが`dist`に設定されていることを確認
- [ ] T018 **人間の操作が必要**: フロントエンドの初回デプロイを実行（quickstart.md ステップ5.2を参照）
- [ ] T019 [US2] デプロイ後の動作確認: 本番環境のフロントエンドアプリケーションが正常に表示され、バックエンドAPIに接続できることを確認

**Checkpoint**: この時点で、User Stories 1 AND 2の両方が独立して動作する必要があります

---

## Phase 5: User Story 3 - CI/CDパイプラインによる自動デプロイ (Priority: P2)

**Goal**: 開発者がコードをリポジトリにプッシュすると、Cloudflare WorkersとCloudflare PagesのGitHub統合機能により自動的にテストが実行され、成功した場合に本番環境にデプロイされる

**Independent Test**: 開発者がmainブランチにコードをプッシュし、Cloudflare WorkersとCloudflare PagesのGitHub統合が自動的にテストを実行し、成功した場合に自動的にデプロイされることを確認できる。テストが失敗した場合、デプロイが実行されないことを確認できる。

### 検証タスク for User Story 3

- [ ] T020 [US3] 自動デプロイの動作確認: mainブランチにプッシュして自動デプロイが実行されることを確認
- [ ] T021 [US3] テスト失敗時のデプロイ停止確認: 意図的にテストを失敗させて、デプロイが実行されないことを確認
- [ ] T022 [US3] PRでのテスト実行確認: プルリクエストを作成して、テストのみが実行され、デプロイが実行されないことを確認
- [ ] T023 [US3] マイグレーションファイル検出の動作確認: PRにマイグレーションファイルを含めて、PRコメントが追加されることを確認
- [ ] T024 [US3] マイグレーション自動実行の動作確認: mainブランチにマイグレーションファイルを含むコミットをプッシュして、マイグレーションが自動実行されることを確認
- [ ] T025 [US3] マイグレーション失敗時のロールバック確認: 意図的にマイグレーションを失敗させて、デプロイが中止され、ロールバックされることを確認

### Implementation for User Story 3

- [ ] T026 [US3] GitHub Actionsワークフローを作成: `.github/workflows/deploy.yml`（contracts/deploy-workflow.ymlをベースに実装）
- [ ] T027 [US3] マイグレーションファイル検出ロジックを実装: `.github/workflows/deploy.yml`（backend/migrations/ディレクトリ内の.sqlファイルを検出）
- [ ] T028 [US3] PRコメント機能を実装: `.github/workflows/deploy.yml`（GitHub Actionsのgithub-scriptを使用してPRコメントを追加）
- [ ] T029 [US3] マイグレーション自動実行機能を実装: `.github/workflows/deploy.yml`（mainブランチへのプッシュ時に`wrangler d1 migrations apply`を実行）
- [ ] T030 [US3] マイグレーション失敗時のエラーハンドリングを実装: `.github/workflows/deploy.yml`（マイグレーション失敗時にエラーを報告し、デプロイを中止）
- [ ] T031 **人間の操作が必要**: GitHub Secretsの設定（quickstart.md ステップ6.2を参照）
- [ ] T032 [US3] デプロイ通知機能の確認: GitHubのコミットステータスとPRコメントでデプロイ成功・失敗が通知されることを確認

**Checkpoint**: この時点で、User Stories 1, 2, AND 3のすべてが独立して動作する必要があります

---

## Phase 6: User Story 4 - 環境変数とシークレットの管理 (Priority: P2)

**Goal**: 開発者が本番環境の環境変数とシークレットを安全に設定・管理できる

**Independent Test**: 開発者が管理ツールを使用して環境変数とシークレットを設定し、アプリケーションが正しくそれらを読み込むことを確認できる。シークレットがコードリポジトリに含まれていないことを確認できる。

### 検証タスク for User Story 4

- [ ] T033 [US4] 環境変数の設定確認: Cloudflare Dashboardで環境変数が正しく設定されていることを確認
- [ ] T034 [US4] シークレットの設定確認: Cloudflare Dashboardでシークレットが正しく設定されていることを確認
- [ ] T035 [US4] アプリケーションでの環境変数読み込み確認: アプリケーションが環境変数とシークレットを正しく読み込むことを確認
- [ ] T036 [US4] シークレットのリポジトリ除外確認: `.gitignore`とコードリポジトリにシークレットが含まれていないことを確認

### Implementation for User Story 4

- [ ] T037 **人間の操作が必要**: バックエンドの環境変数とシークレットを設定（quickstart.md ステップ3.1を参照）
- [ ] T038 **人間の操作が必要**: フロントエンドの環境変数を設定（quickstart.md ステップ3.2を参照）
- [ ] T039 [US4] 環境変数の設定をドキュメント化: `docs/DEPLOYMENT.md`（環境変数の一覧と設定方法を記載）
- [ ] T040 [US4] .gitignoreの確認: `.gitignore`に`.dev.vars`、`.env`、その他のシークレットファイルが含まれていることを確認

**Checkpoint**: この時点で、すべてのユーザーストーリーが独立して動作する必要があります

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 複数のユーザーストーリーに影響する改善

- [ ] T041 [P] デプロイ設定のドキュメント更新: `docs/DEPLOYMENT.md`（デプロイ手順、トラブルシューティングを記載）
- [ ] T042 [P] READMEの更新: `README.md`（デプロイ方法のセクションを追加）
- [ ] T043 デプロイプロセスの動作確認: quickstart.mdの全ステップを実行して、すべてが正常に動作することを確認
- [ ] T044 エラーハンドリングの確認: デプロイ失敗時のロールバック機能が正常に動作することを確認
- [ ] T045 パフォーマンス目標の確認: デプロイプロセス全体が10分以内に完了することを確認（SC-007）

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 依存関係なし - すぐに開始可能
- **Foundational (Phase 2)**: Setup完了に依存 - すべてのユーザーストーリーをブロック
- **User Stories (Phase 3+)**: すべてFoundationalフェーズの完了に依存
  - User Stories 1と2は並列実行可能（P1同士）
  - User Story 3はUser Stories 1と2の完了後に開始（P2）
  - User Story 4はUser Story 3と並列実行可能（P2同士）
- **Polish (Final Phase)**: すべての希望するユーザーストーリーの完了に依存

### User Story Dependencies

- **User Story 1 (P1)**: Foundational完了後に開始可能 - 他のストーリーへの依存なし
- **User Story 2 (P1)**: Foundational完了後に開始可能 - User Story 1と並列実行可能
- **User Story 3 (P2)**: Foundational完了後に開始可能 - User Stories 1と2の完了後に開始推奨
- **User Story 4 (P2)**: Foundational完了後に開始可能 - User Story 3と並列実行可能

### Within Each User Story

- 検証タスクは実装前に実行可能
- 設定確認タスクは実装タスクの前に実行
- 人間の操作が必要なタスクは適切なタイミングで実行
- ストーリー完了後に次の優先度に進む

### Parallel Opportunities

- Setupタスクの[P]マーク付きタスクは並列実行可能
- Foundationalタスクの[P]マーク付きタスクは並列実行可能（Phase 2内）
- Foundationalフェーズ完了後、User Stories 1と2は並列実行可能
- User Stories 3と4は並列実行可能
- 異なるユーザーストーリーは異なるチームメンバーが並列作業可能

---

## Parallel Example: User Stories 1 and 2

```bash
# User Story 1とUser Story 2は並列実行可能（P1同士）:

# Developer A: User Story 1
Task: "Cloudflare WorkersのGitHub統合設定"
Task: "wrangler.tomlの本番環境設定を確認"
Task: "バックエンドの初回デプロイを実行"

# Developer B: User Story 2
Task: "Cloudflare PagesのGitHub統合設定"
Task: "Cloudflare Pagesのビルド設定を確認"
Task: "フロントエンドの初回デプロイを実行"
```

---

## Implementation Strategy

### MVP First (User Stories 1 and 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. Complete Phase 4: User Story 2
5. **STOP and VALIDATE**: User Stories 1 and 2を独立してテスト
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo
3. Add User Story 2 → Test independently → Deploy/Demo (MVP!)
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

複数の開発者がいる場合:

1. チームでSetup + Foundationalを完了
2. Foundational完了後:
   - Developer A: User Story 1
   - Developer B: User Story 2
3. User Stories 1と2完了後:
   - Developer A: User Story 3
   - Developer B: User Story 4
4. ストーリーは独立して完了し、統合される

---

## Notes

- [P]タスク = 異なるファイル、依存関係なし
- [Story]ラベルはタスクを特定のユーザーストーリーにマッピングしてトレーサビリティを確保
- 各ユーザーストーリーは独立して完了可能でテスト可能である必要がある
- 各タスクまたは論理的なグループの後にコミット
- 任意のチェックポイントで停止してストーリーを独立して検証
- 避けるべきこと: 曖昧なタスク、同じファイルの競合、独立性を損なうストーリー間の依存関係
- **人間の操作が必要なタスク**: quickstart.mdを参照して手動で実行する必要があります

---

## Task Summary

- **Total Tasks**: 45
- **User Story 1 Tasks**: 4 (検証2 + 実装2)
- **User Story 2 Tasks**: 4 (検証2 + 実装2)
- **User Story 3 Tasks**: 7 (検証6 + 実装1)
- **User Story 4 Tasks**: 4 (検証4 + 実装0、人間の操作2)
- **Setup Tasks**: 3
- **Foundational Tasks**: 4 (人間の操作3)
- **Polish Tasks**: 5
- **Parallel Opportunities**: User Stories 1と2、User Stories 3と4は並列実行可能

## Suggested MVP Scope

**MVP**: User Stories 1 and 2 (P1)
- バックエンドAPIとフロントエンドアプリケーションの本番環境へのデプロイ
- これにより、アプリケーション全体が本番環境で動作可能になる

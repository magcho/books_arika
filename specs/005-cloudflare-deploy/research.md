# Research: Cloudflareへのデプロイ設定

**Created**: 2025-01-27  
**Purpose**: Cloudflare WorkersとCloudflare PagesのGitHub統合機能、デプロイ自動化、マイグレーション実行の技術選定とアーキテクチャ設計の根拠を文書化

## Technology Stack Decisions

### Cloudflare WorkersのGitHub統合

**Decision**: Cloudflare WorkersのGitHub統合機能を使用して自動デプロイを実現する

**Rationale**:
- Cloudflare Dashboardから簡単にGitHubリポジトリを接続できる
- コードプッシュ時に自動的にビルドとデプロイが実行される
- プルリクエストコメントとチェックランによるデプロイ状態の可視化
- ロールバック機能が標準装備されている
- 追加のCI/CDツール（GitHub Actions等）が不要で、シンプルな構成を実現

**Alternatives considered**:
- GitHub Actions + Wrangler CLI: より柔軟だが、設定が複雑で、Cloudflareの統合機能で十分
- 手動デプロイ: デプロイの一貫性と信頼性が低い
- カスタムCI/CDパイプライン: メンテナンスコストが高く、Cloudflareの統合機能で代替可能

**Setup Requirements**:
- Cloudflareアカウントと適切な権限
- GitHubリポジトリへのアクセス権限
- Cloudflare DashboardでのGitHub統合設定
- デプロイブランチ（main）の設定

**Implementation Details**:
1. Cloudflare Dashboard > Workers > Create application > Import a repository
2. GitHubアカウントを選択し、リポジトリを接続
3. Settings > Buildsでビルド設定を管理
4. 環境変数とシークレットをSettings > Variablesで設定
5. プルリクエストコメントとチェックランが自動的に有効化される

### Cloudflare PagesのGitHub統合

**Decision**: Cloudflare PagesのGitHub統合機能を使用してフロントエンドの自動デプロイを実現する

**Rationale**:
- Cloudflare Workersと同様に、Dashboardから簡単にGitHubリポジトリを接続できる
- 自動ビルドとデプロイが標準装備
- プルリクエストごとにプレビューURLが自動生成される
- チェックランによるビルド状態の可視化
- ブランチ制御により、本番環境とプレビュー環境を分離できる

**Alternatives considered**:
- GitHub Actions + Wrangler Pages: より柔軟だが、設定が複雑
- 手動デプロイ: デプロイの一貫性と信頼性が低い
- 他のホスティングサービス: Cloudflareエコシステムの統一性を損なう

**Setup Requirements**:
- Cloudflareアカウントと適切な権限
- GitHubリポジトリへのアクセス権限
- Cloudflare Pages DashboardでのGitHub統合設定
- ビルドコマンドと出力ディレクトリの設定
- 環境変数の設定

**Implementation Details**:
1. Cloudflare Pages Dashboard > Create a project > Connect to Git
2. GitHubアカウントを認証し、リポジトリを選択
3. ビルド設定を指定：
   - ビルドコマンド: `cd frontend && npm run build`
   - 出力ディレクトリ: `frontend/dist`
4. Settings > Builds > Branch controlでブランチ制御を設定
5. Settings > Environment variablesで環境変数を設定

### データベースマイグレーションの自動実行

**Decision**: デプロイ時に`wrangler d1 migrations apply`コマンドを実行してマイグレーションを自動適用する

**Rationale**:
- Cloudflare WorkersのGitHub統合では、カスタムビルドコマンドを設定できない
- GitHub Actionsを使用してマイグレーションを実行する方法が一般的
- マイグレーションの実行有無をPRコメントで通知することで、レビュアーが影響を把握できる
- マイグレーション失敗時はデプロイを中止し、ロールバックする

**Alternatives considered**:
- デプロイ前に手動でマイグレーションを実行: 手動作業が増え、デプロイプロセスの自動化が不完全
- マイグレーションを別プロセスで管理: デプロイとマイグレーションのタイミングがずれるリスク
- マイグレーションを自動実行しない: データベーススキーマの更新が手動になり、エラーのリスクが高い

**Setup Requirements**:
- `backend/migrations/`ディレクトリにマイグレーションファイルを配置
- GitHub Actionsワークフローでマイグレーション実行を追加
- Cloudflare APIトークンまたはWrangler認証情報の設定
- マイグレーションファイル検出スクリプトの実装

**Implementation Details**:
1. GitHub Actionsワークフローで、デプロイ前にマイグレーションを実行：
   ```yaml
   - name: Apply D1 migrations
     run: npx wrangler d1 migrations apply books-arika-db-production --remote
   ```
2. マイグレーション失敗時は、デプロイを中止し、エラーを報告
3. PRコメントでマイグレーション実行有無を通知（後述）

### PRコメントによるマイグレーション実行通知

**Decision**: GitHub ActionsまたはCloudflare Functionsを使用して、PRコメントでマイグレーション実行有無を通知する

**Rationale**:
- レビュアーがデプロイ時の影響を事前に把握できる
- マイグレーション実行有無を明確に通知することで、レビュー効率が向上
- GitHub APIを使用してPRコメントを追加する方法が標準的
- Cloudflare WorkersのGitHub統合では、カスタムPRコメント機能が限定的

**Alternatives considered**:
- Cloudflare WorkersのGitHub統合の標準機能のみ: マイグレーション実行有無の通知機能がない
- 手動でPRコメントを追加: 手動作業が増え、見落としのリスクがある
- 別の通知チャネル（Slack等）: GitHub内で完結しないため、コンテキストスイッチが発生

**Setup Requirements**:
- GitHub Personal Access TokenまたはGitHub App認証情報
- マイグレーションファイル検出ロジックの実装
- GitHub ActionsワークフローまたはCloudflare Functionsでの実装

**Implementation Details**:
1. GitHub Actionsワークフローで、PRが作成または更新されたときに実行
2. `backend/migrations/`ディレクトリにマイグレーションファイルが含まれているかチェック
3. GitHub APIを使用してPRコメントを追加：
   ```javascript
   // マイグレーションファイルが含まれている場合
   await octokit.rest.issues.createComment({
     owner: context.repo.owner,
     repo: context.repo.repo,
     issue_number: context.issue.number,
     body: '⚠️ このPRにはデータベースマイグレーションファイルが含まれています。デプロイ時に自動的にマイグレーションが実行されます。'
   });
   ```

### デプロイ通知（GitHubコミットステータスとPRコメント）

**Decision**: Cloudflare WorkersとCloudflare PagesのGitHub統合が提供する標準機能を使用して、コミットステータスとPRコメントで通知する

**Rationale**:
- Cloudflare WorkersとCloudflare PagesのGitHub統合では、チェックランとPRコメントが自動的に有効化される
- 追加の設定や実装が不要で、シンプルな構成を実現
- GitHubの標準機能を活用することで、開発者のワークフローに自然に統合される

**Alternatives considered**:
- カスタム通知システム: 追加の実装とメンテナンスコストが発生
- メール通知: GitHub内で完結しないため、コンテキストスイッチが発生
- Slack等の外部通知: GitHub内で完結しないため、コンテキストスイッチが発生

**Setup Requirements**:
- Cloudflare WorkersとCloudflare PagesのGitHub統合が有効化されていること
- 追加の設定は不要（標準機能として提供）

**Implementation Details**:
- Cloudflare WorkersのGitHub統合では、デプロイ時に自動的にチェックランが作成される
- Cloudflare PagesのGitHub統合では、デプロイ時に自動的にチェックランとPRコメントが作成される
- デプロイ成功時は成功ステータス、失敗時は失敗ステータスが表示される

### マイグレーション失敗時のロールバック

**Decision**: マイグレーション失敗時はデプロイを中止し、Cloudflare WorkersのGitHub統合が提供するロールバック機能を利用する

**Rationale**:
- データベーススキーマの不整合を防ぐため、マイグレーション失敗時はデプロイを中止する必要がある
- Cloudflare WorkersのGitHub統合では、デプロイ失敗時に自動的に前のバージョンにロールバックされる
- 部分的に適用されたマイグレーションは問題を引き起こす可能性があるため、完全なロールバックが必要

**Alternatives considered**:
- マイグレーション失敗時もデプロイを続行: データベーススキーマの不整合が発生するリスクが高い
- マイグレーションのみをロールバック: 複雑で、データベースの状態が不確定になる
- 手動ロールバック: 対応が遅れ、ダウンタイムが長引く

**Setup Requirements**:
- GitHub Actionsワークフローで、マイグレーション失敗時にエラーを報告
- Cloudflare WorkersのGitHub統合が有効化されていること（ロールバック機能は標準装備）

**Implementation Details**:
1. GitHub Actionsワークフローで、マイグレーション実行時にエラーハンドリングを実装
2. マイグレーション失敗時は、`exit 1`でワークフローを失敗させる
3. ワークフロー失敗により、Cloudflare Workersのデプロイが中止される
4. Cloudflare WorkersのGitHub統合が、自動的に前のバージョンにロールバックする

## Architecture Decisions

### デプロイフロー

1. **コードプッシュ**: 開発者がmainブランチにコードをプッシュ
2. **テスト実行**: Cloudflare WorkersとCloudflare PagesのGitHub統合が自動的にテストを実行（GitHub Actionsワークフロー）
3. **マイグレーション検出**: PRコメントでマイグレーション実行有無を通知（GitHub Actionsワークフロー）
4. **デプロイ実行**: テスト成功後、Cloudflare WorkersとCloudflare Pagesが自動的にデプロイを実行
5. **マイグレーション実行**: デプロイ前にマイグレーションを実行（GitHub Actionsワークフロー）
6. **通知**: デプロイ成功・失敗をGitHubのコミットステータスとPRコメントで通知

### エラーハンドリング

- **テスト失敗**: デプロイが実行されず、GitHubのコミットステータスでエラーを報告
- **マイグレーション失敗**: デプロイが中止され、GitHubのコミットステータスとPRコメントでエラーを報告
- **デプロイ失敗**: Cloudflare WorkersとCloudflare PagesのGitHub統合が自動的に前のバージョンにロールバック

## Best Practices

1. **環境変数とシークレットの管理**:
   - Cloudflare Dashboardで環境変数とシークレットを設定
   - コードリポジトリにシークレットを含めない
   - 環境ごとに異なる環境変数を設定

2. **マイグレーション管理**:
   - マイグレーションファイルは`backend/migrations/`ディレクトリに配置
   - マイグレーションファイル名は連番を使用（例: `001_initial.sql`, `002_add_column.sql`）
   - マイグレーションは冪等性を保つ（同じマイグレーションを複数回実行しても問題がない）

3. **デプロイ前の確認**:
   - ローカル環境でテストを実行
   - マイグレーションの動作確認
   - 環境変数の設定確認

4. **ロールバック戦略**:
   - デプロイ前にバックアップを取得（D1データベースの場合、手動バックアップ）
   - マイグレーション失敗時は、デプロイを中止し、自動ロールバックを利用

## References

- [Cloudflare Workers CI/CD - GitHub Integration](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/)
- [Cloudflare Pages - GitHub Integration](https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/)
- [Cloudflare D1 - Migrations](https://developers.cloudflare.com/d1/learning/migrations/)
- [Wrangler CLI - D1 Commands](https://developers.cloudflare.com/workers/wrangler/commands/#d1)

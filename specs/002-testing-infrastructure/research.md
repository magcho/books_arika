# Research: 自動テスト基盤セットアップ

**Created**: 2025-12-22  
**Purpose**: テストフレームワークとテスト環境の技術選定と設計の根拠を文書化

## Technology Stack Decisions

### Backend Testing: Vitest + @cloudflare/vitest-pool-workers

**Decision**: Vitest 1.0+ with @cloudflare/vitest-pool-workers 0.4+ for Cloudflare Workers environment testing

**Rationale**:
- VitestはViteベースの高速なテストランナーで、TypeScriptと完全に統合
- @cloudflare/vitest-pool-workersはCloudflare Workers環境を模擬し、エッジ環境でのテストを可能にする
- 既にpackage.jsonにインストール済みで、追加のセットアップが最小限
- Honoアプリケーションのテストに最適
- ローカル開発環境とCI/CD環境で同じテストが実行可能

**Alternatives considered**:
- Jest: Cloudflare Workers環境の模擬が複雑。Vitestの方が高速
- Node.js標準のtest runner: 機能が限定的で、Workers環境の模擬が困難
- 手動テストのみ: Constitution原則IXに違反。自動テストが必須

**Setup Requirements**:
- Vitest 1.0+ (既にインストール済み)
- @cloudflare/vitest-pool-workers 0.4+ (既にインストール済み)
- vitest.config.ts の設定が必要
- D1データベースのテスト環境設定が必要

### Frontend Testing: Vitest + React Testing Library

**Decision**: Vitest 1.0+ with React Testing Library 14+ and @testing-library/jest-dom 6+ for component testing

**Rationale**:
- Vitestはフロントエンドでも使用可能で、バックエンドと同じテストランナーを使用できる
- React Testing LibraryはReactコンポーネントのテストに最適で、ユーザー中心のテストを実現
- @testing-library/jest-domはDOMアサーションを提供し、テストの可読性を向上
- 既にpackage.jsonにインストール済み
- Viteとの統合が完璧で、高速なテスト実行が可能

**Alternatives considered**:
- Enzyme: メンテナンスモードで、React Testing Libraryが推奨
- Jest: Vitestの方が高速で、Viteとの統合が優れている
- Cypress (E2E): この段階では不要。将来の拡張として検討

**Setup Requirements**:
- Vitest 1.0+ (既にインストール済み)
- React Testing Library 14+ (既にインストール済み)
- @testing-library/jest-dom 6+ (既にインストール済み)
- vitest.config.ts の設定が必要
- テスト環境のセットアップ（jsdom等）が必要

### Database Testing: Local D1 Database

**Decision**: Use local D1 database for testing with wrangler d1 execute --local

**Rationale**:
- Cloudflare D1のローカル環境を使用することで、実際のデータベース環境に近いテストが可能
- テストデータのセットアップとクリーンアップが容易
- 無料で使用可能
- 本番環境と同じSQLiteエンジンを使用

**Alternatives considered**:
- モックデータベース: 実際のデータベース動作をテストできない
- テスト専用のリモートD1データベース: コストがかかり、ローカル開発が複雑
- インメモリデータベース: D1の機能を完全にテストできない

**Setup Requirements**:
- Wrangler CLI (既にインストール済み)
- テスト用のローカルD1データベース設定
- テストデータのセットアップスクリプト

### CI/CD Integration: GitHub Actions

**Decision**: Use GitHub Actions for automated test execution on PRs

**Rationale**:
- GitHubリポジトリと直接統合可能
- 無料枠が充実（パブリックリポジトリは無制限）
- Cloudflare Workers環境でのテスト実行が可能
- テスト結果をPRに直接表示可能
- マージブロック機能でテスト失敗時のマージを防止

**Alternatives considered**:
- CircleCI: 設定が複雑で、無料枠が限定的
- Travis CI: 無料枠が縮小され、GitHub Actionsが推奨
- Cloudflare Pages Functions: CI/CD機能が限定的

**Setup Requirements**:
- GitHub Actionsワークフローファイル (.github/workflows/test.yml)
- Node.js環境のセットアップ
- Cloudflare Workers環境のセットアップ
- テスト結果のレポート生成

### Test Coverage: Vitest Coverage (c8/v8)

**Decision**: Use Vitest's built-in coverage reporting with c8/v8

**Rationale**:
- Vitestに統合されており、追加の設定が最小限
- 高速なカバレッジ計測
- HTMLレポートとテキストレポートの両方を生成可能
- CI/CDでカバレッジレポートを表示可能

**Alternatives considered**:
- Istanbul: Vitestに統合されているため、別途設定不要
- nyc: Vitestのカバレッジ機能で十分

**Setup Requirements**:
- vitest.config.ts でカバレッジ設定を有効化
- カバレッジレポートの出力設定
- CI/CDでのカバレッジレポート表示

## Testing Patterns & Best Practices

### Test Structure

**Decision**: Organize tests by type (unit, integration, contract) and by feature

**Rationale**:
- テストの種類ごとに分離することで、実行時間の最適化が可能
- 機能ごとにテストをグループ化することで、保守性が向上
- テストの目的が明確になる

**Structure**:
```
tests/
├── unit/           # 単体テスト（サービス層、モデル層、ユーティリティ）
├── integration/    # 統合テスト（APIエンドポイント、データベース統合）
├── contract/       # コントラクトテスト（API仕様の検証）
├── helpers/        # テストヘルパー関数
└── fixtures/       # テストデータ（fixtures）
```

### Test Utilities & Helpers

**Decision**: Create reusable test utilities and helpers to reduce boilerplate

**Rationale**:
- テストコードの重複を避ける（Constitution原則VI）
- テストの可読性と保守性を向上
- テストデータのセットアップとクリーンアップを簡素化

**Examples**:
- Database setup/teardown helpers
- Mock data factories
- API request helpers
- Component rendering helpers

### Test Data Management

**Decision**: Use fixtures and factories for test data generation

**Rationale**:
- テストデータの一貫性を保証
- テストの可読性を向上
- テストデータのメンテナンスが容易

## Performance Considerations

### Test Execution Time

- 目標: フルテストスイートで30秒以内
- 最適化: 並列実行、テストの分離、不要なテストのスキップ
- カバレッジ計測はCI/CDでのみ実行（ローカル開発ではオプション）

### Test Isolation

- 各テストは独立して実行可能であること
- テストデータのクリーンアップを確実に実行
- データベースの状態を各テスト前にリセット

## Security Considerations

### Test Data Privacy

- テストデータに個人情報を含めない
- テスト用のダミーデータを使用
- 本番データをテストで使用しない

### API Key Management

- テスト環境ではモックAPIを使用するか、テスト用のAPIキーを使用
- 本番APIキーをテストで使用しない
- 環境変数でテスト用の設定を管理

## References

- [Vitest Documentation](https://vitest.dev/)
- [@cloudflare/vitest-pool-workers Documentation](https://github.com/cloudflare/vitest-pool-workers)
- [React Testing Library Documentation](https://testing-library.com/react)
- [Cloudflare Workers Testing Guide](https://developers.cloudflare.com/workers/testing/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)



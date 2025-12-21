<!--
Sync Impact Report:
Version change: (none) → 1.0.0
Modified principles: (none - initial creation)
Added sections:
  - Core Principles (5 principles)
  - Technology Stack Requirements
  - Development Workflow
Templates requiring updates:
  ✅ .specify/templates/plan-template.md - Constitution Check section aligns with principles
  ✅ .specify/templates/spec-template.md - No changes needed
  ✅ .specify/templates/tasks-template.md - No changes needed
Follow-up TODOs: None
-->

# Books Arika Constitution

## Core Principles

### I. Cloudflareエコシステム優先

新規機能やインフラ要件において、Cloudflareのサービスを優先的に検討し、採用する。Cloudflare Workers、D1、Pages、R2、KV等のエッジサービスを活用することで、低コスト・高パフォーマンス・スケーラビリティを実現する。外部サービスや代替技術の採用は、Cloudflareエコシステムで実現できない場合のみ検討する。

### II. 低コスト・高パフォーマンス・スケーラビリティ重視

すべての技術選定とアーキテクチャ設計において、低コスト・高パフォーマンス・スケーラビリティの3要素を最優先で考慮する。無料枠や低コストプランを最大限活用し、パフォーマンス要件を満たしつつ、将来のスケールアップに対応可能な設計を採用する。過剰な最適化や早期のスケーリング対策は避け、必要最小限の実装に留める。

### III. TypeScriptによる型安全性 (NON-NEGOTIABLE)

Frontend/Backend共にTypeScriptを使用し、型安全性を確保する。すべてのコードはTypeScriptで記述し、`any`型の使用は最小限に抑える。型定義ファイルを適切に管理し、APIコントラクトやデータモデルは型で明確に定義する。型エラーはビルド時に検出され、実行時エラーを防ぐ。

### IV. エッジファーストアーキテクチャ

アプリケーションロジックは可能な限りエッジ（Cloudflare Workers）で実行し、レイテンシを最小化する。データベースアクセスもエッジから直接行い、中央集約型のアーキテクチャを避ける。グローバルに分散されたエッジネットワークを活用し、ユーザーに最も近い場所で処理を実行する。

### V. 軽量・高速起動

すべてのコンポーネントは軽量で高速に起動することを必須とする。バックエンドはHonoのような超軽量フレームワークを使用し、コールドスタート時間を最小化する。フロントエンドはViteによる高速ビルドと開発体験を優先し、本番環境でも最適化されたバンドルサイズを維持する。

## Technology Stack Requirements

### Frontend

- **Framework**: React (Vite) - SPA構成を採用し、高速な動作と将来のPWA化の容易さを確保する
- **Language**: TypeScript - 型安全性を確保し、開発効率を向上させる
- **Build Tool**: Vite - 高速な開発サーバーと最適化された本番ビルドを提供

### Backend

- **Framework**: Hono - Cloudflare Workersで動作する超軽量フレームワーク。起動が爆速で、エッジ環境に最適化されている
- **Language**: TypeScript - Frontend/Backend共に型安全性を確保
- **Runtime**: Cloudflare Workers - エッジで実行され、グローバルに分散されたパフォーマンスを提供

### Database

- **Primary**: Cloudflare D1 - エッジで動作するSQLite。リレーショナルデータの結合に最適かつ安価。無料枠が充実している

### Infrastructure

- **Hosting**: Cloudflare Pages - フロントエンドのホスティングとバックエンド(Functions)の一体運用を実現。自動デプロイとCDN統合が標準装備

### Development

- **Language**: TypeScript - すべてのコードはTypeScriptで記述
- **Package Manager**: npm または pnpm（プロジェクト要件に応じて選択）

## Development Workflow

### Code Review

すべてのプルリクエストは、この憲法の原則に準拠していることを確認するレビューを必須とする。特に以下の点を確認する：

- TypeScriptの型安全性が保たれているか
- Cloudflareエコシステムを優先的に使用しているか
- 低コスト・高パフォーマンス・スケーラビリティの観点が考慮されているか
- エッジファーストのアーキテクチャが維持されているか

### Testing

- すべての新機能は適切なテストを伴う
- 型安全性はTypeScriptコンパイラによって保証される
- エッジ環境での動作確認を優先する

### Deployment

- Cloudflare Pagesへの自動デプロイを設定する
- 本番環境へのデプロイ前に、ローカル環境とプレビュー環境での動作確認を必須とする

## Governance

この憲法は、プロジェクトのすべての技術決定と開発実践において最優先される。憲法の原則に反する決定は、明確な理由と代替案の検討を文書化し、承認を得る必要がある。

### Amendment Procedure

憲法の修正は以下の手順で行う：

1. 修正提案を文書化し、変更理由と影響範囲を明確にする
2. 関連するテンプレートファイル（plan-template.md、spec-template.md、tasks-template.md等）への影響を評価する
3. バージョン番号をセマンティックバージョニングに従って更新する：
   - **MAJOR**: 後方互換性のない原則の削除や再定義
   - **MINOR**: 新規原則の追加や既存原則の大幅な拡張
   - **PATCH**: 明確化、表現の修正、タイポ修正、非意味的な改善
4. 同期影響レポートを更新し、関連テンプレートファイルを更新する
5. 変更をコミットし、変更内容を記録する

### Compliance Review

すべてのプルリクエストは、この憲法への準拠を確認するレビューを必須とする。複雑性の追加は正当化され、より簡単な代替案が検討されたことを文書化する必要がある。

### Versioning Policy

憲法のバージョンは、セマンティックバージョニング（MAJOR.MINOR.PATCH）に従う。各変更は適切なバージョン番号の更新と共に記録される。

**Version**: 1.0.0 | **Ratified**: 2025-12-21 | **Last Amended**: 2025-12-21

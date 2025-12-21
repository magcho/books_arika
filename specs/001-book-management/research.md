# Research: 書籍管理プロダクト MVP

**Created**: 2025-12-22  
**Purpose**: 技術選定とアーキテクチャ設計の根拠を文書化

## Technology Stack Decisions

### Frontend: React (Vite) + TypeScript

**Decision**: React 18+ with Vite 5+ as build tool, TypeScript for type safety

**Rationale**:
- SPA構成で高速な動作を実現
- Viteによる高速な開発サーバーと最適化された本番ビルド
- 将来のPWA化が容易
- TypeScriptによる型安全性で開発効率向上
- Cloudflare Pagesとの統合が容易

**Alternatives considered**:
- Next.js: SSRが必要ないため過剰。Cloudflare Pagesとの統合が複雑
- Vue.js: チームの経験と要件に基づきReactを選択
- Vanilla JS: 型安全性と開発効率のためTypeScript必須

**Setup Requirements**:
- Node.js 18+ required
- Vite 5+ for build tooling
- React 18+ for UI framework
- React Router for client-side routing
- TypeScript 5+ for type safety

### Backend: Hono + Cloudflare Workers

**Decision**: Hono 4+ framework running on Cloudflare Workers with TypeScript

**Rationale**:
- Cloudflare Workersで動作する超軽量フレームワーク
- 起動が爆速（コールドスタート時間最小化）
- エッジ環境に最適化
- TypeScript完全サポート
- Express-like APIで学習コストが低い
- Cloudflare D1との統合が容易

**Alternatives considered**:
- Express.js: Cloudflare Workersで直接動作しない
- Fastify: Workers対応が限定的
- Cloudflare Pages Functions: ルーティング機能が限定的

**Setup Requirements**:
- Wrangler CLI for local development and deployment
- @cloudflare/workers-types for TypeScript types
- Hono 4+ for routing and middleware

### Database: Cloudflare D1

**Decision**: Cloudflare D1 (SQLite互換) for relational data storage

**Rationale**:
- エッジで動作するSQLite
- リレーショナルデータの結合に最適
- 無料枠が充実（読み取り100,000行/日、書き込み1,000行/日）
- 低コストでスケーラブル
- Cloudflare Workersから直接アクセス可能
- 将来のマルチユーザー対応を見据えたリレーショナル設計に適している

**Alternatives considered**:
- Cloudflare KV: キーバリューストアでリレーショナルデータには不適切
- PostgreSQL (外部): エッジからアクセスできない、コスト増
- Supabase: Cloudflareエコシステム外、コスト増

**Setup Requirements**:
- Cloudflare account with D1 enabled
- Wrangler CLI for database management
- SQL migrations for schema management

### Infrastructure: Cloudflare Pages

**Decision**: Cloudflare Pages for frontend hosting and backend functions integration

**Rationale**:
- フロントエンドのホスティングとバックエンド(Functions)の一体運用
- 自動デプロイとCDN統合が標準装備
- 無料枠が充実
- グローバルCDNによる高速配信
- Git連携による自動デプロイ

**Alternatives considered**:
- Vercel: Cloudflareエコシステム外
- Netlify: Cloudflare Workersとの統合が複雑
- 自前サーバー: 運用コストとスケーラビリティの問題

**Setup Requirements**:
- Cloudflare account
- Git repository (GitHub/GitLab/Bitbucket)
- Wrangler CLI for deployment

## Architecture Patterns

### Edge-First Architecture

**Decision**: All application logic runs on Cloudflare Workers at the edge

**Rationale**:
- ユーザーに最も近い場所で処理を実行
- レイテンシの最小化
- グローバルに分散されたパフォーマンス
- データベースアクセスもエッジから直接

**Implementation**:
- Frontend: Cloudflare Pages (CDN)
- Backend API: Cloudflare Workers (Edge)
- Database: Cloudflare D1 (Edge-accessible)

### API Design Pattern

**Decision**: RESTful API with JSON responses

**Rationale**:
- 標準的なパターンで学習コストが低い
- Frontend/Backendの分離が容易
- 将来のモバイルアプリ対応が容易
- Honoの標準的な使い方に適合

**Endpoints Structure**:
- `/api/books` - 書籍CRUD操作
- `/api/locations` - 場所マスタCRUD操作
- `/api/ownerships` - 所有情報の管理
- `/api/search` - 書籍検索（Google Books API連携）

## External Integrations

### Google Books API

**Decision**: Use Google Books API for book metadata retrieval

**Rationale**:
- 無料で利用可能
- 豊富な書籍メタデータ（タイトル、著者、書影、ISBN等）
- 日本語書籍にも対応
- RESTful APIで統合が容易

**Alternatives considered**:
- Open Library API: データの充実度が低い
- 国立国会図書館API: 主に日本語書籍のみ、API仕様が複雑

**Implementation Notes**:
- APIキーは環境変数で管理
- レート制限への対応が必要
- エラー時のフォールバック（手動登録）を提供

### Barcode Scanner

**Decision**: Use browser-based barcode scanning library (e.g., html5-qrcode or QuaggaJS)

**Rationale**:
- 追加のネイティブアプリ不要
- Web標準技術で実現
- PWA化時にネイティブアプリのような体験を提供可能

**Alternatives considered**:
- Native app: Webアプリの利点を失う
- External barcode scanner app: ユーザー体験が分断される

## Development Setup

### Local Development Environment

**Requirements**:
1. Node.js 18+ installed
2. npm or pnpm package manager
3. Cloudflare account (for D1 database)
4. Wrangler CLI installed globally: `npm install -g wrangler`

**Setup Steps**:
1. Clone repository
2. Install dependencies: `npm install` (both frontend and backend)
3. Configure Wrangler: `wrangler login`
4. Create D1 database: `wrangler d1 create books-arika-db`
5. Run migrations: `wrangler d1 execute books-arika-db --file=./schema.sql`
6. Start backend dev server: `cd backend && npm run dev`
7. Start frontend dev server: `cd frontend && npm run dev`

### Environment Variables

**Backend (.dev.vars or wrangler.toml)**:
- `GOOGLE_BOOKS_API_KEY`: Google Books API key
- `DATABASE_ID`: Cloudflare D1 database ID

**Frontend (.env)**:
- `VITE_API_URL`: Backend API URL (local: http://localhost:8787)

## Performance Considerations

### Database Query Optimization

- Indexes on frequently queried columns (ISBN, user_id, location_id)
- Connection pooling not needed (D1 handles this)
- Batch operations for multiple ownership records

### Frontend Optimization

- Code splitting with Vite
- Lazy loading for routes
- Image optimization for book thumbnails
- Client-side caching for search results

### Edge Caching

- Static assets cached by Cloudflare CDN
- API responses cached where appropriate (GET requests)
- Cache invalidation strategy for book updates

## Security Considerations

### API Security

- CORS configuration for frontend domain
- Input validation on all endpoints
- SQL injection prevention (parameterized queries)
- Rate limiting for API endpoints

### Data Privacy

- User data isolation (user_id based filtering)
- No sensitive data in client-side code
- Environment variables for API keys

## Future Scalability

### Multi-User Support

- Database schema already supports user_id
- Authentication layer to be added in Phase 3
- User isolation at database query level

### Performance Scaling

- D1 read replicas for high read traffic
- Cloudflare Workers auto-scaling
- CDN caching for static and dynamic content

## References

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Hono Documentation](https://hono.dev/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Google Books API Documentation](https://developers.google.com/books)


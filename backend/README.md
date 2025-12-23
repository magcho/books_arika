# Books Arika Backend

Backend API service for Books Arika using Hono and Cloudflare Workers.

## Prerequisites

- Node.js 18+
- npm or pnpm
- Cloudflare account (for D1 database)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create D1 database (if not already created):
```bash
npx wrangler d1 create books-arika-db
```

3. Update `wrangler.toml` with the database_id from step 2.

4. Create `.dev.vars` file (copy from `.dev.vars.example`):
```bash
cp .dev.vars.example .dev.vars
# Edit .dev.vars and add your GOOGLE_BOOKS_API_KEY
```

5. Setup local database:
```bash
./scripts/setup-db.sh local
```

## Development

Start development server:
```bash
npm run dev
```

The API will be available at `http://localhost:8787`

## Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage
```

Test coverage reports are generated in `coverage/` directory.

**Note**: Coverage generation is only available in local development environment. In CI/CD (GitHub Actions), coverage is disabled due to Cloudflare Workers environment limitations (`node:inspector` module is not available in Workers runtime). Tests run without coverage in CI/CD to ensure compatibility.

### Test Structure

- `tests/unit/` - Unit tests for services and models
- `tests/integration/` - Integration tests for API endpoints
- `tests/helpers/` - Test helper functions
- `tests/fixtures/` - Test data fixtures

See `tests/README.md` for detailed testing documentation.

## Endpoints

- `GET /health` - Health check endpoint

## Deployment

Deploy to Cloudflare Workers:
```bash
npm run deploy
```


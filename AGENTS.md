# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Books Arika is a personal book management app with two services:

| Service | Directory | Dev command | Port |
|---|---|---|---|
| Backend (Hono / Cloudflare Workers) | `backend/` | `npm run dev` | 8787 |
| Frontend (React / Vite) | `frontend/` | `npm run dev` | 5173 |

The frontend proxies `/api` requests to the backend (`vite.config.ts`).

### Running services

1. Start the backend first: `cd backend && npm run dev`
2. Then the frontend: `cd frontend && npm run dev`
3. Open `http://localhost:5173/` in a browser.

The local D1 (SQLite) database must be initialized before the backend can serve data:

```bash
cd backend && npx wrangler d1 execute books-arika-db --local --file=./schema.sql
```

This is idempotent (`CREATE TABLE IF NOT EXISTS` / `INSERT OR IGNORE`).

### Environment variables

Copy `backend/.dev.vars.example` to `backend/.dev.vars`. The only variable is `GOOGLE_BOOKS_API_KEY` (optional — manual book registration works without it).

### Tests

- Backend: `cd backend && npm test` (uses `@cloudflare/vitest-pool-workers`)
- Frontend: `cd frontend && npm test` (uses `vitest` + `happy-dom`)

Coverage (`npm test -- --coverage`) works locally but is disabled in CI due to Workers runtime limitations.

### Lint / Format

- `npm run lint` in each service directory.
- `npm run format` in each service directory.

**Note:** The backend currently has pre-existing lint errors (unused imports/vars). These are not regressions — they exist on `main`.

### Gotchas

- The `wrangler.toml` `database_id` is a dummy value (`00000000-...`). This is intentional for local dev; wrangler uses `--local` mode and stores data under `backend/.wrangler/state/`.
- The default user `default-user` is seeded by `schema.sql`. The frontend hardcodes this user ID.
- The frontend Vite proxy only forwards `/api` paths. Direct API calls must go to port 8787.

# Database Migrations

This directory contains database migration scripts for Cloudflare D1.

## Running Migrations

### Local Development

```bash
# Apply migrations to local D1 database
wrangler d1 execute books-arika-db --local --file=./schema.sql
```

### Production

```bash
# Apply migrations to production D1 database
wrangler d1 execute books-arika-db --file=./schema.sql
```

## Migration Workflow

1. Create a new migration file: `migrations/YYYYMMDD_description.sql`
2. Test locally: `wrangler d1 execute books-arika-db --local --file=./migrations/YYYYMMDD_description.sql`
3. Apply to production: `wrangler d1 execute books-arika-db --file=./migrations/YYYYMMDD_description.sql`


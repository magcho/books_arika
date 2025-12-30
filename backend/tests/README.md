# Backend Tests

This directory contains all backend tests for the Books Arika API.

## Test Structure

- `unit/` - Unit tests for services, models, and utilities
- `integration/` - Integration tests for API endpoints
- `helpers/` - Test helper functions and utilities
- `fixtures/` - Test data factories and fixtures

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm test -- --watch
```

### Run tests with coverage
```bash
npm test -- --coverage
```

### Run specific test file
```bash
npm test -- tests/unit/book_service.test.ts
```

## Test Helpers

### Database Helpers (`helpers/db.ts`)

Utilities for setting up and tearing down test database:

- `setupTestDatabase(db)` - Initialize test database with schema
- `cleanupTestDatabase(db)` - Clean up all test data
- `resetTestDatabase(db)` - Reset database (cleanup + setup)

### App Helpers (`helpers/app.ts`)

Utilities for testing Hono applications:

- `createTestEnv(db, env?)` - Create test environment
- `handleTestRequest(request, db, env?)` - Handle test request

## Test Fixtures

### Book Fixtures (`fixtures/books.ts`)

Factories for creating mock book data:

- `createMockBook(overrides?)` - Create a mock book
- `createMockBookInput(overrides?)` - Create a mock book input
- `createMockDoujinBook(overrides?)` - Create a mock doujin book
- `createMockDoujinBookInput(overrides?)` - Create a mock doujin book input

## Writing Tests

### Example: Unit Test

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { BookService } from '../../src/services/book_service'
import { setupTestDatabase, cleanupTestDatabase } from '../helpers/db'
import { createMockBookInput } from '../fixtures/books'

describe('BookService', () => {
  let db: D1Database
  let bookService: BookService

  beforeEach(async () => {
    db = (globalThis as any).DB as D1Database
    await setupTestDatabase(db)
    bookService = new BookService(db)
  })

  afterEach(async () => {
    await cleanupTestDatabase(db)
  })

  it('should create a book', async () => {
    const input = createMockBookInput({ title: 'Test Book' })
    const book = await bookService.create(input)
    expect(book.title).toBe('Test Book')
  })
})
```

### Example: Integration Test

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { handleTestRequest } from '../helpers/app'
import { setupTestDatabase, cleanupTestDatabase } from '../helpers/db'

describe('POST /api/books', () => {
  let db: D1Database

  beforeEach(async () => {
    db = (globalThis as any).DB as D1Database
    await setupTestDatabase(db)
  })

  afterEach(async () => {
    await cleanupTestDatabase(db)
  })

  it('should create a book', async () => {
    const request = new Request('http://localhost/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'default-user',
        title: 'Test Book',
      }),
    })

    const response = await handleTestRequest(request, db)
    expect(response.status).toBe(201)
  })
})
```

## Coverage

Test coverage threshold is set to 80% for:
- Lines
- Functions
- Branches
- Statements

Coverage reports are generated in `coverage/` directory after running tests with `--coverage` flag.



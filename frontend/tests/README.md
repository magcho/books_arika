# Frontend Tests

This directory contains all frontend tests for the Books Arika application.

## Test Structure

- `unit/` - Unit tests for components and services
- `integration/` - Integration tests for API integration
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
npm test -- tests/unit/BookForm.test.tsx
```

## Test Helpers

### Render Helpers (`helpers/render.tsx`)

Utilities for rendering React components in tests:

- `renderWithProviders(ui, options?)` - Custom render function with providers

### API Helpers (`helpers/api.ts`)

Utilities for mocking API responses:

- `mockFetchResponse(data, status?)` - Mock fetch with a response
- `mockFetchError(error)` - Mock fetch with an error
- `resetFetchMock()` - Reset fetch mock

## Test Fixtures

### Book Fixtures (`fixtures/books.ts`)

Factories for creating mock book data:

- `createMockBook(overrides?)` - Create a mock book
- `createMockBookSearchResult(overrides?)` - Create a mock book search result
- `createMockBookCreateRequest(overrides?)` - Create a mock book create request

## Writing Tests

### Example: Component Test

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BookForm } from '../../src/components/BookForm/BookForm'
import { createBook } from '../../src/services/book_api'

vi.mock('../../src/services/book_api', () => ({
  createBook: vi.fn(),
}))

describe('BookForm', () => {
  it('should render book form', () => {
    render(<BookForm onSuccess={() => {}} defaultUserId="test-user" />)
    expect(screen.getByText(/書籍登録/i)).toBeInTheDocument()
  })
})
```

### Example: API Integration Test

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { createBook } from '../../src/services/book_api'
import { mockFetchResponse, resetFetchMock } from '../helpers/api'
import { createMockBook } from '../fixtures/books'

describe('book_api', () => {
  beforeEach(() => {
    resetFetchMock()
  })

  it('should create a book', async () => {
    const mockBook = createMockBook({ title: 'Test Book' })
    mockFetchResponse(mockBook, 201)

    const result = await createBook({
      user_id: 'default-user',
      title: 'Test Book',
    })

    expect(result.title).toBe('Test Book')
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


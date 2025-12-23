# Books Arika Frontend

Frontend application for Books Arika using React and Vite.

## Prerequisites

- Node.js 18+
- npm or pnpm

## Setup

1. Install dependencies:
```bash
npm install
```

## Development

Start development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

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

**Note**: Coverage generation is only available in local development environment. In CI/CD (GitHub Actions), coverage is disabled due to compatibility issues with `webidl-conversions`/`whatwg-url` packages in the CI environment. Tests run without coverage in CI/CD to ensure compatibility.

### Test Structure

- `tests/unit/` - Unit tests for components and services
- `tests/integration/` - Integration tests for API integration
- `tests/helpers/` - Test helper functions
- `tests/fixtures/` - Test data fixtures

See `tests/README.md` for detailed testing documentation.

## Build

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```


#!/bin/bash
# Development server startup script

echo "🚀 Starting Books Arika development servers..."
echo ""

# Check if backend dependencies are installed
if [ ! -d "backend/node_modules" ]; then
  echo "📦 Installing backend dependencies..."
  cd backend && npm install && cd ..
fi

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
  echo "📦 Installing frontend dependencies..."
  cd frontend && npm install && cd ..
fi

# Check if .dev.vars exists
if [ ! -f "backend/.dev.vars" ]; then
  echo "⚠️  backend/.dev.vars not found. Creating from example..."
  cp backend/.dev.vars.example backend/.dev.vars
  echo "   Please edit backend/.dev.vars and add your GOOGLE_BOOKS_API_KEY (optional)"
fi

# Setup database schema
echo "🗄️  Setting up local database..."
cd backend
npx wrangler d1 execute books-arika-db --local --file=./schema.sql 2>/dev/null || echo "   Database already set up or error occurred"
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the servers, run:"
echo "  Terminal 1: cd backend && npm run dev"
echo "  Terminal 2: cd frontend && npm run dev"
echo ""
echo "Then open http://localhost:5173 in your browser"
echo ""


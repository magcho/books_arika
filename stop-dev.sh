#!/bin/bash
# Stop development servers

echo "🛑 Stopping development servers..."

if [ -f /tmp/backend.pid ]; then
  BACKEND_PID=$(cat /tmp/backend.pid)
  if ps -p $BACKEND_PID > /dev/null 2>&1; then
    kill $BACKEND_PID
    echo "✅ Backend server stopped (PID: $BACKEND_PID)"
  else
    echo "⚠️  Backend server was not running"
  fi
  rm -f /tmp/backend.pid
else
  echo "⚠️  Backend PID file not found"
fi

if [ -f /tmp/frontend.pid ]; then
  FRONTEND_PID=$(cat /tmp/frontend.pid)
  if ps -p $FRONTEND_PID > /dev/null 2>&1; then
    kill $FRONTEND_PID
    echo "✅ Frontend server stopped (PID: $FRONTEND_PID)"
  else
    echo "⚠️  Frontend server was not running"
  fi
  rm -f /tmp/frontend.pid
else
  echo "⚠️  Frontend PID file not found"
fi

# Also kill any remaining wrangler or vite processes
pkill -f "wrangler dev" 2>/dev/null && echo "✅ Killed remaining wrangler processes"
pkill -f "vite" 2>/dev/null && echo "✅ Killed remaining vite processes"

echo ""
echo "✅ All servers stopped"


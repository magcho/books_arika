#!/bin/bash
echo "Starting backend server..."
npx wrangler dev --local 2>&1 | head -40 &
SERVER_PID=$!
sleep 8
echo ""
echo "Testing health endpoint..."
curl -s http://localhost:8787/health | head -5 || echo "Server not responding"
echo ""
echo "Stopping server..."
kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true

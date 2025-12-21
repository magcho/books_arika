#!/bin/bash
echo "Starting frontend server..."
npm run dev 2>&1 | head -30 &
SERVER_PID=$!
sleep 8
echo ""
echo "Checking if server is running..."
curl -s http://localhost:5173 | head -10 || echo "Server not responding"
echo ""
echo "Stopping server..."
kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true

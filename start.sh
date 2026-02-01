#!/bin/sh
echo "Starting Backend..."
cd /app/backend && python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 &
echo "Starting Frontend..."
cd /app/frontend && npm run start -- -p 5001

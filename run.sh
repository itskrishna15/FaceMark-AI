#!/bin/bash
# run.sh - Start FaceMark-AI Backend and Frontend

echo "Starting FaceMark-AI..."

# Start Backend (FastAPI)
echo "Starting FastAPI backend on http://localhost:8000..."
source venv/bin/activate
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Start Frontend (Vite)
echo "Starting Vite frontend on http://localhost:5173..."
cd frontend
npm run dev &
FRONTEND_PID=$!

echo "Both servers are running."
echo "Press Ctrl+C to stop both servers."

# Wait for user interrupt
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait

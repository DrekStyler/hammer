#!/bin/bash

# Ensure this script is executable with: chmod +x start-local-dev.sh

# Kill any existing Firebase emulators
echo "Stopping any running Firebase emulators..."
pkill -f "firebase emulators" || true
sleep 2

# Find and kill processes using the relevant ports
echo "Checking for processes using emulator ports..."
for port in 8001 8002 9198 5177; do
  pid=$(lsof -i :$port -t)
  if [ ! -z "$pid" ]; then
    echo "Killing process on port $port: $pid"
    kill -9 $pid 2>/dev/null || true
  fi
done
sleep 2

# Start Firebase emulators in the background
echo "Starting Firebase emulators..."
cd ../../
firebase emulators:start &
EMULATOR_PID=$!

# Wait for emulators to start
echo "Waiting for emulators to initialize (10 seconds)..."
sleep 10

# Start the development server
echo "Starting frontend development server..."
cd frontend/my-app
VITE_FORCE_DEV_MODE=true npm run dev

# Cleanup function to handle script termination
cleanup() {
  echo "Stopping services..."
  kill $EMULATOR_PID 2>/dev/null || true
  exit 0
}

# Register the cleanup function for signals
trap cleanup SIGINT SIGTERM EXIT

# Wait for dev server to finish
wait
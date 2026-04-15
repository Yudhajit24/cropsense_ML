#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# run_all.sh — Launch CropSense backend + frontend dev servers.
#
# Usage:    ./run_all.sh
# Platform: macOS (Terminal.app) and Linux (gnome-terminal / xterm)
# ─────────────────────────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# ── Detect OS ─────────────────────────────────────────────────────
launch_terminal() {
  local title="$1"
  local cmd="$2"

  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS — use Terminal.app
    osascript -e "tell app \"Terminal\"
      do script \"echo \\\"$title\\\"; $cmd\"
    end tell"
  elif command -v gnome-terminal &> /dev/null; then
    # Linux — GNOME Terminal
    gnome-terminal --title="$title" -- bash -c "$cmd; exec bash"
  elif command -v xterm &> /dev/null; then
    # Fallback — xterm
    xterm -title "$title" -e "$cmd" &
  else
    echo "No supported terminal emulator found. Starting in background..."
    bash -c "$cmd" &
  fi
}

# ── Launch Backend ────────────────────────────────────────────────
echo "🚀 Starting CropSense Backend..."
if [[ -d "$BACKEND_DIR/venv" ]]; then
  BACKEND_CMD="cd '$BACKEND_DIR' && source venv/bin/activate && uvicorn main:app --reload"
else
  BACKEND_CMD="cd '$BACKEND_DIR' && uvicorn main:app --reload"
fi
launch_terminal "CropSense Backend" "$BACKEND_CMD"

# ── Launch Frontend ───────────────────────────────────────────────
echo "🚀 Starting CropSense Frontend..."
FRONTEND_CMD="cd '$FRONTEND_DIR' && npm run dev"
launch_terminal "CropSense Frontend" "$FRONTEND_CMD"

echo ""
echo "✅ Successfully launched both servers!"
echo "   Backend:  http://localhost:8000"
echo "   Frontend: http://localhost:5173"
echo ""

# Open browser after a short delay
sleep 4
if [[ "$OSTYPE" == "darwin"* ]]; then
  open "http://localhost:5173"
elif command -v xdg-open &> /dev/null; then
  xdg-open "http://localhost:5173"
fi

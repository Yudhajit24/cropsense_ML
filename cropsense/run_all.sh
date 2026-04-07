#!/bin/bash
# Script to launch CropSense servers in separate, native macOS Terminal windows

# Start backend
osascript -e 'tell app "Terminal"
    do script "echo \"Starting CropSense Backend...\"; cd /Users/yudhajit/Desktop/NLP_project/ML_proj/cropsense/backend && source venv/bin/activate && uvicorn main:app --reload"
end tell'

# Start frontend
osascript -e 'tell app "Terminal"
    do script "echo \"Starting CropSense Frontend...\"; cd /Users/yudhajit/Desktop/NLP_project/ML_proj/cropsense/frontend && npm run dev"
end tell'

echo "Successfully launched Terminals for Frontend and Backend!"
sleep 4
open "http://localhost:5173"

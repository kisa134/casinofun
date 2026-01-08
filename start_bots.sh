#!/bin/bash

# Bot Engine Starter Script for Casino.fun

echo "🤖 Starting Casino.fun Bot Engine..."
echo "=================================="
echo ""

cd "$(dirname "$0")/backend"

# Activate virtual environment if exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Run bot engine
python3 bot_engine.py

#!/bin/bash

echo "🎰 Starting Casino.fun..."
echo ""

# Запуск backend
echo "🚀 Starting Backend..."
cd backend
python3 app.py &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
cd ..

# Ждём запуска backend
echo "⏳ Waiting for backend to start..."
sleep 3

# Запуск bot engine
echo "🤖 Starting Bot Engine..."
cd backend
python3 bot_engine.py &
BOT_PID=$!
echo "Bot Engine PID: $BOT_PID"
cd ..

# Ждём ещё немного
sleep 2

# Запуск frontend
echo "🎨 Starting Frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"
cd ..

echo ""
echo "✅ All services started!"
echo ""
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Функция для остановки всех процессов
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill $BACKEND_PID 2>/dev/null
    kill $BOT_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

# Установка trap для Ctrl+C
trap cleanup INT

# Ждём
wait

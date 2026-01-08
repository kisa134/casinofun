#!/bin/bash

# Casino.fun - Health Check Script
# Проверяет все компоненты проекта

echo "🎰 Casino.fun - System Health Check"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# Check function
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $1"
        ((FAILED++))
    fi
}

# 1. Check Python
echo "📦 Checking Backend Dependencies..."
python3 --version > /dev/null 2>&1
check "Python 3 installed"

if [ -f "backend/requirements.txt" ]; then
    echo -e "${GREEN}✓${NC} requirements.txt found"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} requirements.txt not found"
    ((FAILED++))
fi

# 2. Check Node
echo ""
echo "📦 Checking Frontend Dependencies..."
node --version > /dev/null 2>&1
check "Node.js installed"

npm --version > /dev/null 2>&1
check "npm installed"

if [ -d "frontend/node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules installed"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} node_modules not found (run: cd frontend && npm install)"
    ((FAILED++))
fi

# 3. Check Backend Files
echo ""
echo "📄 Checking Backend Files..."

BACKEND_FILES=(
    "backend/app.py"
    "backend/models.py"
    "backend/bot_engine.py"
    "backend/init_test_data.py"
    "backend/requirements.txt"
)

for file in "${BACKEND_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $file missing"
        ((FAILED++))
    fi
done

# 4. Check Frontend Files
echo ""
echo "📄 Checking Frontend Files..."

FRONTEND_FILES=(
    "frontend/src/App.jsx"
    "frontend/src/api.js"
    "frontend/src/components/Landing.jsx"
    "frontend/src/components/Room.jsx"
    "frontend/src/components/HostDashboard.jsx"
    "frontend/src/components/Leaderboard.jsx"
)

for file in "${FRONTEND_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $file missing"
        ((FAILED++))
    fi
done

# 5. Check Documentation
echo ""
echo "📚 Checking Documentation..."

DOC_FILES=(
    "README.md"
    "DEPLOYMENT.md"
    "FEATURES.md"
    "CHANGELOG.md"
    "PROJECT_OVERVIEW.md"
)

for file in "${DOC_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $file missing"
        ((FAILED++))
    fi
done

# 6. Check Scripts
echo ""
echo "🔧 Checking Scripts..."

SCRIPTS=(
    "start.sh"
    "start_bots.sh"
)

for script in "${SCRIPTS[@]}"; do
    if [ -f "$script" ] && [ -x "$script" ]; then
        echo -e "${GREEN}✓${NC} $script (executable)"
        ((PASSED++))
    elif [ -f "$script" ]; then
        echo -e "${YELLOW}⚠${NC} $script (not executable, run: chmod +x $script)"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $script missing"
        ((FAILED++))
    fi
done

# 7. Check Database
echo ""
echo "🗄️  Checking Database..."

if [ -f "backend/instance/casino.db" ]; then
    echo -e "${GREEN}✓${NC} Database file exists"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} Database not initialized (will be created on first run)"
fi

# 8. Summary
echo ""
echo "===================================="
echo "📊 Health Check Summary"
echo "===================================="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! System is ready.${NC}"
    echo ""
    echo "🚀 To start the application:"
    echo "   ./start.sh"
    echo ""
    exit 0
else
    echo -e "${YELLOW}⚠ Some checks failed. Please review above.${NC}"
    echo ""
    echo "💡 Quick fix commands:"
    echo "   cd frontend && npm install"
    echo "   cd backend && pip install -r requirements.txt --break-system-packages"
    echo "   chmod +x start.sh start_bots.sh"
    echo ""
    exit 1
fi

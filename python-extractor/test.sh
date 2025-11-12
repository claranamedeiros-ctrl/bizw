#!/bin/bash

# Test script for Python extractor service
set -e

echo "🧪 BizWorth Python Extractor - Test Suite"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "main.py" ]; then
    echo "❌ Error: Please run this from the python-extractor directory"
    exit 1
fi

# Step 1: Setup environment
echo "📦 Step 1: Setting up environment..."
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
echo "✅ Virtual environment activated"
echo ""

# Step 2: Install/update dependencies
echo "📥 Step 2: Installing dependencies..."
echo "   (This may take a few minutes)"
pip install --upgrade pip --quiet
pip install -r requirements.txt --quiet
echo "✅ Dependencies installed"
echo ""

# Step 3: Check Playwright
echo "🌐 Step 3: Checking Playwright browser..."
if ! playwright install chromium 2>&1 | grep -q "already installed"; then
    echo "   Installing Chromium..."
    playwright install chromium
fi
echo "✅ Playwright ready"
echo ""

# Step 4: Check environment variables
echo "🔑 Step 4: Checking environment variables..."
if [ -z "$MISTRAL_API_KEY" ]; then
    echo "⚠️  MISTRAL_API_KEY not set!"
    echo ""
    echo "Please set it before running tests:"
    echo "  export MISTRAL_API_KEY='EQY9e9o4xg7kkmrvRG2bVMFdJP1IrMGN'"
    echo ""
    read -p "Set it now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        export MISTRAL_API_KEY='EQY9e9o4xg7kkmrvRG2bVMFdJP1IrMGN'
        echo "✅ MISTRAL_API_KEY set for this session"
    else
        echo "⚠️  Continuing without API key (text extraction will use fallback)"
    fi
else
    echo "✅ MISTRAL_API_KEY is set"
fi
echo ""

# Step 5: Start server in background
echo "🚀 Step 5: Starting server..."
python main.py &
SERVER_PID=$!

# Wait for server to start
echo "   Waiting for server to initialize..."
sleep 3

# Check if server is running
if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo "❌ Server failed to start!"
    echo "Check logs above for errors"
    exit 1
fi

# Wait for model loading
echo "   Loading AI models (this may take 10-30 seconds on first run)..."
sleep 15

echo "✅ Server started (PID: $SERVER_PID)"
echo ""

# Step 6: Health check
echo "🏥 Step 6: Health check..."
HEALTH_RESPONSE=$(curl -s http://localhost:8000/health)
echo "Response: $HEALTH_RESPONSE"

if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    kill $SERVER_PID
    exit 1
fi
echo ""

# Step 7: Test extraction
echo "🎯 Step 7: Testing extraction (Stripe.com)..."
echo "   This will test logo detection, color extraction, and text extraction"
echo ""

EXTRACT_RESPONSE=$(curl -s -X POST http://localhost:8000/extract \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.stripe.com"}')

echo "Raw response:"
echo "$EXTRACT_RESPONSE" | python3 -m json.tool
echo ""

# Check results
echo "📊 Results:"
echo ""

if echo "$EXTRACT_RESPONSE" | grep -q '"logo"'; then
    LOGO_STATUS=$(echo "$EXTRACT_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print('✅ FOUND' if data.get('logo') and data['logo'] != 'null' else '❌ NULL')")
    echo "  Logo detection: $LOGO_STATUS"
else
    echo "  Logo detection: ❌ ERROR"
fi

if echo "$EXTRACT_RESPONSE" | grep -q '"primary"'; then
    PRIMARY_COLOR=$(echo "$EXTRACT_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['colors']['primary'])" 2>/dev/null || echo "ERROR")
    echo "  Primary color: ✅ $PRIMARY_COLOR"
else
    echo "  Primary color: ❌ ERROR"
fi

if echo "$EXTRACT_RESPONSE" | grep -q '"about"'; then
    ABOUT_LENGTH=$(echo "$EXTRACT_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('about') or ''))" 2>/dev/null || echo "0")
    echo "  About text: ✅ $ABOUT_LENGTH chars"
else
    echo "  About text: ❌ ERROR"
fi

echo ""

# Step 8: Cleanup
echo "🧹 Step 8: Cleanup..."
read -p "Kill server? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    kill $SERVER_PID
    echo "✅ Server stopped"
else
    echo "⚠️  Server still running (PID: $SERVER_PID)"
    echo "   To stop manually: kill $SERVER_PID"
fi

echo ""
echo "✨ Test complete!"
echo ""
echo "To run server manually:"
echo "  1. source venv/bin/activate"
echo "  2. export MISTRAL_API_KEY='your_key'"
echo "  3. python main.py"

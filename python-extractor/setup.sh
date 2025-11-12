#!/bin/bash

# BizWorth Python Extractor Setup Script
# This script sets up the Python environment and installs all dependencies

set -e  # Exit on any error

echo "🚀 BizWorth Python Extractor Setup"
echo "===================================="
echo ""

# Check if Python 3.11+ is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.11 or higher."
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
echo "✅ Found Python $PYTHON_VERSION"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo ""
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment
echo ""
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo ""
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo ""
echo "📥 Installing Python dependencies..."
echo "    (This may take 5-10 minutes for first-time setup)"
pip install -r requirements.txt

# Install Playwright browser
echo ""
echo "🌐 Installing Playwright Chromium browser..."
playwright install chromium
playwright install-deps chromium

# Check for MISTRAL_API_KEY
echo ""
echo "🔑 Checking environment variables..."
if [ -z "$MISTRAL_API_KEY" ]; then
    echo "⚠️  MISTRAL_API_KEY not set in environment"
    echo ""
    echo "To use AI-powered text extraction, set your Mistral API key:"
    echo "  export MISTRAL_API_KEY='your_api_key_here'"
    echo ""
    echo "Or add it to a .env file:"
    echo "  echo 'MISTRAL_API_KEY=your_api_key_here' > .env"
    echo ""
    echo "Text extraction will fall back to heuristics without the API key."
else
    echo "✅ MISTRAL_API_KEY is set"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "To start the server:"
echo "  1. Activate the virtual environment: source venv/bin/activate"
echo "  2. Run the server: python main.py"
echo "  3. Server will be available at: http://localhost:8000"
echo ""
echo "To test the API:"
echo '  curl -X POST http://localhost:8000/extract -H "Content-Type: application/json" -d '"'"'{"url": "https://www.stripe.com"}'"'"''
echo ""

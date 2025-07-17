#!/bin/bash

# Tano Finance Setup Script

echo "🚀 Setting up Tano Finance..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cp .env.local.example .env.local
    echo "⚠️  Please edit .env.local and add your WalletConnect Project ID"
fi

# Run type check
echo "🔍 Running type check..."
npm run type-check

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env.local and add your WalletConnect Project ID"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "🎉 Happy coding!"

#!/bin/bash

# PokeExplorer Installation Script
# This script automates the setup process for the PokeExplorer app

echo "🔴 PokeExplorer Installation Script ⚡"
echo "======================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm version: $(npm -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"
echo ""

# Check platform
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 macOS detected - Setting up iOS..."
    
    # Check if CocoaPods is installed
    if ! command -v pod &> /dev/null; then
        echo "⚠️  CocoaPods not found. Installing..."
        sudo gem install cocoapods
    fi
    
    echo "✅ CocoaPods version: $(pod --version)"
    
    # Install iOS dependencies
    echo "📦 Installing iOS pods..."
    cd ios
    
    # Install bundler if needed
    if ! command -v bundle &> /dev/null; then
        echo "Installing bundler..."
        gem install bundler
    fi
    
    bundle install
    bundle exec pod install
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install iOS pods"
        cd ..
        exit 1
    fi
    
    cd ..
    echo "✅ iOS setup complete"
    echo ""
fi

# Check Firebase configuration
echo "🔥 Checking Firebase configuration..."

if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your Firebase credentials"
fi

if [ ! -f "android/app/google-services.json" ]; then
    echo "⚠️  android/app/google-services.json not found"
    echo "   Please add your Firebase Android configuration file"
fi

if [[ "$OSTYPE" == "darwin"* ]]; then
    if [ ! -f "ios/PokeExplorer/GoogleService-Info.plist" ]; then
        echo "⚠️  ios/PokeExplorer/GoogleService-Info.plist not found"
        echo "   Please add your Firebase iOS configuration file"
    fi
fi

echo ""
echo "✅ Installation complete!"
echo ""
echo "📱 Next steps:"
echo ""
echo "1. Ensure Firebase configuration files are in place:"
echo "   - android/app/google-services.json"
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "   - ios/PokeExplorer/GoogleService-Info.plist"
fi
echo ""
echo "2. Update .env file with your credentials"
echo ""
echo "3. Run the app:"
echo "   npm start          # Start Metro bundler"
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "   npm run ios        # Run on iOS"
fi
echo "   npm run android    # Run on Android"
echo ""
echo "📚 Documentation:"
echo "   - QUICKSTART.md - Quick setup guide"
echo "   - IMPLEMENTATION_GUIDE.md - Detailed guide"
echo "   - README.md - Project overview"
echo ""
echo "🎯 Happy Pokemon Hunting! ⚡"

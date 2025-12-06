#!/bin/bash

# iOS Setup Script for PokeExplorer
echo "🍎 Setting up iOS for PokeExplorer..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Check if Bundler is installed
if ! command -v bundle &> /dev/null; then
    echo "📦 Installing Bundler..."
    gem install bundler
fi

# Navigate to iOS directory
cd ios

# Install Ruby dependencies
echo "💎 Installing Ruby dependencies..."
bundle install

# Install CocoaPods dependencies
echo "🥥 Installing CocoaPods dependencies..."
bundle exec pod install

# Check if GoogleService-Info.plist exists and is not placeholder
if [ -f "PokeExplorer/GoogleService-Info.plist" ]; then
    if grep -q "your-firebase-project-id" "PokeExplorer/GoogleService-Info.plist"; then
        echo "⚠️  WARNING: Please replace GoogleService-Info.plist with your actual Firebase configuration file"
        echo "   1. Go to Firebase Console (https://console.firebase.google.com/)"
        echo "   2. Select your project"
        echo "   3. Go to Project Settings > General"
        echo "   4. Download GoogleService-Info.plist for iOS"
        echo "   5. Replace ios/PokeExplorer/GoogleService-Info.plist with the downloaded file"
    else
        echo "✅ GoogleService-Info.plist found"
    fi
else
    echo "❌ GoogleService-Info.plist not found. Please add your Firebase configuration file."
fi

cd ..

echo "✅ iOS setup complete!"
echo "📱 You can now run: npm run ios"
echo "🔧 Or open ios/PokeExplorer.xcworkspace in Xcode"
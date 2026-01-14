#!/bin/bash

# Firebase Setup Script for AlgoBot App

echo "🔥 Firebase Setup for AlgoBot"
echo "================================"
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Check if logged in
echo "📋 Checking Firebase login status..."
if firebase projects:list &> /dev/null; then
    echo "✅ Already logged in to Firebase"
else
    echo "🔐 Please login to Firebase..."
    echo "   This will open a browser window for authentication"
    firebase login
fi

# Add pub cache to PATH
export PATH="$PATH:$HOME/.pub-cache/bin"

# Configure FlutterFire
echo ""
echo "⚙️  Configuring FlutterFire..."
flutterfire configure --project=algo-bot-396c8 --platforms=ios,android

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Go to Firebase Console: https://console.firebase.google.com/"
echo "2. Select project: algo-bot-396c8"
echo "3. Go to Authentication → Sign-in method"
echo "4. Enable 'Email/Password'"
echo "5. Run: flutter run"

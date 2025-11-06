#!/bin/bash

echo "🔧 Fixing dependencies for API Level 35 and Expo SDK 53..."
echo ""

# Update Expo CLI globally
echo "📦 Updating Expo CLI..."
npm install -g expo-cli@latest

# Update EAS CLI globally
echo "📦 Updating EAS CLI..."
npm install -g eas-cli@latest

# Install/fix Expo packages to match SDK 53
echo "📦 Fixing Expo SDK packages..."
npx expo install --fix

# Update specific packages that might cause issues
echo "📦 Updating critical packages..."
npx expo install expo-location@latest
npx expo install expo-task-manager@latest
npx expo install expo-notifications@latest
npx expo install expo-camera@latest

# Clean install
echo "🧹 Cleaning node_modules and reinstalling..."
rm -rf node_modules
npm install

echo ""
echo "✅ Dependencies updated!"
echo ""
echo "Next steps:"
echo "1. Run: npx expo start --clear"
echo "2. Test the app locally"
echo "3. Build with: eas build --platform android --profile production"


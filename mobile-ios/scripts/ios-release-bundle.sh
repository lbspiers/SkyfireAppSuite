#!/usr/bin/env bash
set -euo pipefail

echo "🔨 Creating iOS release bundle for React Native 0.77..."

# This script ensures the main.jsbundle is created for iOS release builds
# Required for React Native 0.77 with EAS Build

# Set paths
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IOS_DIR="$PROJECT_ROOT/ios"
BUNDLE_OUTPUT="$IOS_DIR/main.jsbundle"
ASSETS_OUTPUT="$IOS_DIR/assets"

echo "📂 Project root: $PROJECT_ROOT"
echo "📂 iOS directory: $IOS_DIR"
echo "📦 Bundle output: $BUNDLE_OUTPUT"

# Completely remove CocoaPods integration from Xcode project
echo "🧹 Deintegrating CocoaPods from Xcode project..."
cd "$IOS_DIR"

# Remove workspace to force fresh generation
rm -rf skyfire.xcworkspace/xcuserdata

# Deintegrate CocoaPods completely
if command -v pod &> /dev/null; then
  echo "Running pod deintegrate..."
  pod deintegrate || echo "⚠️  pod deintegrate failed, continuing..."
else
  echo "⚠️  CocoaPods not found, skipping pod deintegrate"
fi

# Clean all CocoaPods artifacts
rm -rf Pods Podfile.lock
rm -rf ~/Library/Caches/CocoaPods 2>/dev/null || true

cd "$PROJECT_ROOT"

# Create iOS directory if it doesn't exist
mkdir -p "$IOS_DIR"

# Remove old bundle and assets if they exist
rm -rf "$BUNDLE_OUTPUT" "$ASSETS_OUTPUT"

# Create the bundle using React Native CLI
echo "📦 Bundling JavaScript for iOS release..."
npx react-native bundle \
  --platform ios \
  --dev false \
  --entry-file index.js \
  --bundle-output "$BUNDLE_OUTPUT" \
  --assets-dest "$ASSETS_OUTPUT" \
  --reset-cache

# Verify bundle was created
if [ -f "$BUNDLE_OUTPUT" ]; then
  BUNDLE_SIZE=$(du -h "$BUNDLE_OUTPUT" | cut -f1)
  echo "✅ Bundle created successfully: $BUNDLE_SIZE"
  echo "📄 Bundle location: $BUNDLE_OUTPUT"
else
  echo "❌ ERROR: Bundle was not created!"
  exit 1
fi

# ✅ CRITICAL: Ensure bundle is accessible for Xcode build
echo ""
echo "📦 Preparing bundle for Xcode integration..."

# Verify bundle is in the correct location for Xcode to find it
if [ -f "$BUNDLE_OUTPUT" ]; then
  echo "✅ Bundle location verified: $BUNDLE_OUTPUT"

  # Also verify assets
  if [ -d "$ASSETS_OUTPUT" ]; then
    echo "✅ Assets location verified: $ASSETS_OUTPUT"
  fi

  # If Xcode build environment variables are available (called during build phase),
  # copy directly into the app bundle
  if [ -n "$CONFIGURATION_BUILD_DIR" ] && [ -n "$UNLOCALIZED_RESOURCES_FOLDER_PATH" ]; then
    echo "🔧 Xcode build environment detected - copying into app bundle..."
    APP_RESOURCES_DIR="${CONFIGURATION_BUILD_DIR}/${UNLOCALIZED_RESOURCES_FOLDER_PATH}"

    mkdir -p "$APP_RESOURCES_DIR"
    cp "$BUNDLE_OUTPUT" "$APP_RESOURCES_DIR/"

    if [ -d "$ASSETS_OUTPUT" ]; then
      cp -R "$ASSETS_OUTPUT"/* "$APP_RESOURCES_DIR/" 2>/dev/null || true
    fi

    echo "✅ Bundle copied directly into app: $APP_RESOURCES_DIR"
  else
    echo "📝 Pre-build phase: Bundle staged for Xcode build phase copy"
    echo "   Xcode build script will copy: $BUNDLE_OUTPUT → app bundle"
  fi
else
  echo "❌ ERROR: Bundle missing at verification stage!"
  exit 1
fi

echo ""
echo "✅ iOS bundle generation complete!"

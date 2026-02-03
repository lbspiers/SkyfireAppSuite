#!/bin/bash
echo "Clearing all build caches..."

# Kill any running Node processes
pkill -f "react-scripts" 2>/dev/null || true
pkill -f "webpack" 2>/dev/null || true

# Clear ESLint cache
rm -f .eslintcache

# Clear node_modules cache
rm -rf node_modules/.cache

# Clear build directory
rm -rf build

# Clear Babel cache
rm -rf node_modules/.cache/babel-loader

echo "✓ Cache cleared successfully!"
echo ""
echo "Now run: npm run build"

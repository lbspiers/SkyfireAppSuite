#!/usr/bin/env bash
set -euo pipefail
mkdir -p ios/skyfire
echo "GOOGLE_MAPS_API_KEY = ${GOOGLE_MAPS_API_KEY:-}" > ios/skyfire/Env.xcconfig

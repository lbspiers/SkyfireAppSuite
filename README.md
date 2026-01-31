# Skyfire Apps Suite

Unified monorepo for Skyfire Solar Design applications.

## Project Structure

```
skyfire-apps/
├── web/                 # React web application (golden standard)
├── mobile-android/      # React Native app (Android-optimized)
├── mobile-ios/          # React Native app (iOS-optimized)
├── shared/              # Shared code between platforms
│   ├── tokens/          # Design tokens (colors, spacing, typography)
│   ├── types/           # TypeScript type definitions
│   ├── constants/       # Equipment catalogs, BOS requirements
│   └── utils/           # Pure utility functions
└── docs/                # Project documentation
```

## Quick Start

```bash
# Install all dependencies
npm install

# Run web app
npm run web

# Run Android app
npm run android

# Run iOS app
npm run ios
```

## The Mission

30-hour sprint to achieve feature and design parity between web and mobile apps:

- **Phase 1 (Hours 1-2)**: Monorepo restructure ✅
- **Phase 2 (Hours 3-6)**: Fix Android build
- **Phase 3 (Hours 7-12)**: Reskin Android to match web
- **Phase 4 (Hours 13-18)**: Fork to iOS
- **Phase 5 (Hours 19-30)**: Feature sync

## Design System

The **web app is the golden standard**. All design decisions, field names, and features should match the web implementation.

## Documentation

See [docs/](./docs/) for comprehensive training documents.

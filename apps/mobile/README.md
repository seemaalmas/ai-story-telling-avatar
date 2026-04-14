# @katha/mobile

React Native + Expo mobile app for the Katha AI storytelling platform. Targets iOS and Android.

## Structure

```
src/
├── components/     # Reusable UI components
├── hooks/          # Custom React hooks
├── i18n/           # Internationalization (7 Indian languages)
├── navigation/     # Navigation configuration
├── screens/        # Screen components
│   ├── auth/       # Login, registration
│   ├── home/       # Home feed
│   ├── story/      # Story creation & playback
│   ├── avatar/     # Avatar selection & customization
│   └── profile/    # User profile & settings
├── services/       # API client, storage
├── store/          # Zustand state management
├── theme/          # Colors, typography, spacing
└── utils/          # Utility functions
app/                # Expo Router file-based routing
```

## Development

```bash
# Start Expo dev server (QR for iOS/Android Expo Go)
npm run dev

# iOS simulator
npm run dev:ios

# Android emulator
npm run dev:android

# Web browser (fastest iteration loop, no emulator needed)
npm run dev:web        # -> http://localhost:7002
```

Web mode uses `react-native-web`. `expo-secure-store` automatically falls
back to `localStorage` in the browser (see `src/utils/storage.ts`), so auth
and settings persistence work just like on device. Apple Sign-In is hidden
on web (iOS-only); Google OAuth and email/OTP both work.

## Key Features

- File-based routing with Expo Router
- i18n with 7 Indian languages (auto-detects device locale)
- Secure token storage with Expo SecureStore
- Zustand for state management
- React Query for server state
- Reanimated for smooth animations

## Building

```bash
# Build for iOS
npm run build:ios

# Build for Android
npm run build:android

# Build the web bundle (static site)
npm run build:web
```

## Testing

```bash
npm run test
```

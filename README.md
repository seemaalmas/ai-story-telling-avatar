# Katha AI - AI Storytelling Avatar Platform

An India-first, mobile-only AI storytelling platform where avatars bring stories to life in multiple Indian languages.

## Architecture

```
ai-story-telling-avatar/
├── apps/
│   ├── mobile/          # React Native + Expo (iOS & Android)
│   ├── api/             # NestJS backend API
│   ├── worker/          # BullMQ background job processor
│   └── admin/           # React admin panel (Vite)
├── packages/
│   ├── shared/          # Shared types, constants, utilities
│   ├── ui/              # Shared React Native UI components
│   ├── config/          # Environment & shared configuration
│   └── ai-providers/    # AI provider interfaces & factory
├── docker/              # Docker configuration
└── .github/workflows/   # CI/CD pipelines
```

## Tech Stack

| Layer        | Technology                          |
| ------------ | ----------------------------------- |
| Mobile       | React Native, Expo, Expo Router     |
| Backend API  | NestJS, Prisma, PostgreSQL          |
| Queue/Worker | BullMQ, Redis                       |
| Admin Panel  | React, Vite, React Router           |
| Auth         | JWT, Passport (Email/Google/Apple)  |
| AI           | Provider interface pattern (pluggable) |
| Infra        | Docker, Turborepo, GitHub Actions   |
| Language     | TypeScript everywhere               |

## Supported Languages

English, Hindi (हिन्दी), Tamil (தமிழ்), Telugu (తెలుగు), Bengali (বাংলা), Marathi (मराठी), Kannada (ಕನ್ನಡ), Gujarati (ગુજરાતી), Malayalam (മലയാളം), Punjabi (ਪੰਜਾਬੀ)

## Prerequisites

- Node.js >= 20
- Docker & Docker Compose
- iOS Simulator (macOS) or Android Emulator
- Expo CLI (`npx expo`)

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url>
cd ai-story-telling-avatar
npm install

# 2. Start Postgres + Redis in Docker
npm run docker:up

# 3. Initialise the database (first time only)
npm run db:generate && npm run db:migrate && npm run db:seed

# 4. Start everything (with preflight diagnostic)
npm run start:local
```

### Start individual services

```bash
npm run dev:api      # NestJS API on       :7000
npm run dev:mobile   # Expo dev server     :7002 (QR for iOS/Android)
npm run dev:web      # Mobile in BROWSER   :7002 (no emulator needed)
npm run dev:admin    # Admin panel         :7001
npm run dev:worker   # BullMQ worker
```

### Test the mobile app in a browser (no Android emulator needed)

```bash
npm run dev:api      # terminal 1
npm run dev:web      # terminal 2 — then open http://localhost:7002
```

### Troubleshooting: `FATAL: Tenant or user not found`

That's a Supabase pooler error, not a local-Postgres error. It almost always
means an OS-level `DATABASE_URL` (set on your system) is overriding the
repo's `.env.development`. Run `npm run db:preflight` for a diagnostic, or
see [docs/LOCAL_SETUP.md](./docs/LOCAL_SETUP.md) for the full fix.

## Environment Separation

| Environment | Purpose                    |
| ----------- | -------------------------- |
| `local`     | Local development          |
| `development` | Shared dev server        |
| `staging`   | Pre-production testing     |
| `production`| Live production            |

## Key Commands

```bash
npm run build          # Build all packages
npm run lint           # Lint all packages
npm run test           # Run all tests
npm run typecheck      # TypeScript check all packages
npm run format         # Format all files with Prettier
npm run db:studio      # Open Prisma Studio
npm run docker:down    # Stop infrastructure
npm run clean          # Clean all build artifacts
```

## AI Provider System

The AI layer uses a pluggable provider pattern. Currently ships with a mock provider for development. To add a real provider:

1. Implement the `AIProvider` interface in `packages/ai-providers/src/providers/`
2. Register it in `packages/ai-providers/src/factory.ts`
3. Set `AI_PROVIDER` in your environment config

See `packages/ai-providers/README.md` for details.

## API Documentation

When the API is running, Swagger docs are available at:
```
http://localhost:3000/api/docs
```

## Docs

- [Local Setup & Browser Testing](./docs/LOCAL_SETUP.md)
- [Engagement Roadmap (what to build next)](./docs/ENGAGEMENT_ROADMAP.md)

## Privacy First

- Minimal data collection
- Data stored in India-region servers
- User data deletion on request
- No third-party tracking
- Secure token storage (Expo SecureStore)

## License

UNLICENSED - Proprietary

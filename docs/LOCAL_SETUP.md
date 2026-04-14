# Local Development Guide

This guide walks you through running Katha AI on your machine — including
how to test the mobile app in a **browser** (so you don't have to wait for
Android/iOS each iteration).

## 1. Prerequisites

| Tool           | Version      | Notes                                   |
| -------------- | ------------ | --------------------------------------- |
| Node.js        | >= 20        | Use `nvm` or install from nodejs.org    |
| npm            | >= 10        | Ships with Node 20                      |
| Docker Desktop | any recent   | For local Postgres + Redis              |
| Git            | any          |                                         |

Windows users: run every command below from either **PowerShell** or
**cmd.exe** — not Git Bash — to avoid path-translation issues with Expo.

## 2. First-time setup

```bash
git clone <repo-url>
cd ai-story-telling-avatar
npm install
```

The repo ships with a committed `.env.development` containing safe defaults
pointing at the Docker Postgres on `localhost:5432`. You do **not** need to
create a `.env.local` for local dev. Only create `.env.local` if you want to
override something (real Google/Apple keys, a different DB, etc.).

## 3. Start infrastructure (Postgres + Redis)

```bash
npm run docker:up
```

Confirm both containers are healthy:

```bash
docker ps --filter name=katha-
```

You should see `katha-postgres` and `katha-redis` both `Up (healthy)`.

## 4. Initialise the database (first time only)

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

## 5. Run everything

### Option A — one command, all services

```bash
npm run start:local
```

This runs, in order:
1. `docker:up`
2. `db:preflight` (see below)
3. `turbo run dev` across api, mobile, admin, worker

### Option B — run services individually

```bash
npm run dev:api       # NestJS API on :7000 (Swagger: http://localhost:7000/api/docs)
npm run dev:admin     # React admin on    :7001
npm run dev:mobile    # Expo dev server   :7002  (opens QR for iOS/Android)
npm run dev:web       # Expo WEB only at  :7002  (open in browser)
npm run dev:worker    # BullMQ worker
```

### Option C — browser-only mobile testing (fastest iteration loop)

If you only want to hack on the mobile UI without Android:

```bash
# terminal 1
npm run dev:api

# terminal 2
npm run dev:web
```

Then open **http://localhost:7002** — the Expo Router screens render via
`react-native-web`. Live reload + fast refresh both work.

## 6. DB Preflight — what it catches

`npm run db:preflight` runs a pre-flight that catches the three most common
"it blew up on `npm run dev`" issues:

### Error: `FATAL: Tenant or user not found`

**This is a Supabase/Supavisor pooler error, not a local Postgres error.**
If you see it, your `DATABASE_URL` is pointing at Supabase rather than the
local Docker Postgres. On Windows this is almost always because an OS-level
`DATABASE_URL` is overriding the repo's `.env.development`.

Fix in the same terminal before retrying:

```powershell
# PowerShell
Remove-Item Env:DATABASE_URL
npm run dev
```

```cmd
rem cmd.exe
set DATABASE_URL=
npm run dev
```

To permanently remove the system env var: Windows → Settings → System →
About → Advanced system settings → Environment Variables → delete
`DATABASE_URL` from both User and System lists, then open a new terminal.

### Error: `Can't reach database server`

Postgres isn't running. Run `npm run docker:up`.

### Error: `DATABASE_URL is not set`

Missing env file. Verify `.env.development` exists at the repo root.

## 7. Browser testing tips

- Use the browser devtools **Toggle Device Toolbar** (Ctrl+Shift+M in Chrome)
  and pick "iPhone 14 Pro" / "Pixel 7" to preview mobile layouts.
- `expo-secure-store` falls back to `localStorage` automatically — see
  `apps/mobile/src/utils/storage.ts`. Clearing site data in devtools
  logs you out.
- Apple Sign-In is hidden on web (iOS-only API). Google OAuth and email/OTP
  both work in the browser.
- Deep links like `katha://paywall` become `http://localhost:7002/paywall`.

## 8. Port map

| Port | Service          |
| ---- | ---------------- |
| 7000 | NestJS API       |
| 7001 | Admin panel      |
| 7002 | Mobile (Expo)    |
| 5432 | Postgres         |
| 6379 | Redis            |

## 9. Useful one-liners

```bash
npm run db:preflight          # just check DB connectivity
npm run db:studio             # open Prisma Studio GUI
npm run docker:down           # stop Postgres + Redis
npm run verify:env .env.local # verify env file completeness
```

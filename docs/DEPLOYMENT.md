# Deployment Guide

## Table of Contents
1. [Local Development](#local-development)
2. [Test on Android Device](#test-on-android-device)
3. [Test on iOS Simulator](#test-on-ios-simulator)
4. [Deploy Backend (API + Worker)](#deploy-backend)
5. [Deploy Admin Panel](#deploy-admin-panel)
6. [Deploy Mobile App](#deploy-mobile-app)
7. [Environment Variables by Environment](#environment-variables)
8. [Post-Deployment Verification](#post-deployment-verification)

---

## Local Development

### Prerequisites
- Node.js 20+ (`node -v`)
- Docker Desktop running (`docker ps`)
- npm 10+ (`npm -v`)
- For mobile: Expo Go app on your phone, OR Android Studio / Xcode

### Step 1: Install dependencies
```bash
cd ai-story-telling-avatar
npm install --legacy-peer-deps
```

### Step 2: Start infrastructure
```bash
npm run docker:up
# Starts Postgres on localhost:5432 and Redis on localhost:6379
```

### Step 3: Set up database
```bash
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Apply migrations (creates all tables)
npm run db:seed          # Seed default data (admin user + avatars)
```

### Step 4: Start the API
```bash
npm run dev:api
# Runs on http://localhost:3000
# Swagger: http://localhost:3000/api/docs
```

**Test the API is running:**
```bash
curl http://localhost:3000/health
# Should return: {"status":"ok","timestamp":"..."}

curl http://localhost:3000/health/ready
# Should return: {"status":"ready","checks":{"database":{"status":"up"}}}
```

### Step 5: Start the Admin Panel
```bash
npm run dev:admin
# Runs on http://localhost:3001
```

### Step 6: Start the Mobile App
```bash
npm run dev:mobile
# Opens Expo dev server
```

---

## Test on Android Device

### Option A: Expo Go (fastest, no build needed)

1. Install **Expo Go** from Google Play Store on your Android phone

2. Find your computer's local IP address:
   ```bash
   # macOS
   ipconfig getifaddr en0

   # Linux
   hostname -I | awk '{print $1}'

   # Windows
   ipconfig | findstr /i "IPv4"
   ```
   Example: `192.168.1.42`

3. Create/update `apps/mobile/.env.local` (this overrides .env.development):
   ```bash
   echo "EXPO_PUBLIC_API_URL=http://192.168.1.42:3000" > apps/mobile/.env.local
   ```
   Replace `192.168.1.42` with YOUR IP address.

4. Make sure your phone and computer are on the **same Wi-Fi network**

5. Start the API (must bind to all interfaces):
   ```bash
   npm run dev:api
   ```

6. Start the mobile app:
   ```bash
   cd apps/mobile
   npx expo start
   ```

7. Scan the QR code shown in the terminal with your phone's camera.
   Expo Go will open and load the app.

**Troubleshooting:**
- "Network request failed" → Check your IP, ensure phone + computer are on same Wi-Fi
- API not reachable → Try `http://YOUR_IP:3000/health` in your phone's browser first
- If on corporate WiFi with client isolation, use a personal hotspot instead

### Option B: Android Emulator

1. Install Android Studio and set up an emulator (Pixel 7 API 34 recommended)

2. The emulator uses `10.0.2.2` to reach the host machine's `localhost`:
   ```bash
   echo "EXPO_PUBLIC_API_URL=http://10.0.2.2:3000" > apps/mobile/.env.local
   ```

3. Start the API: `npm run dev:api`

4. Start the app: `npx expo start` then press `a` to open in Android emulator

### Option C: Production Build (APK)

```bash
cd apps/mobile

# Install EAS CLI
npm install -g eas-cli
eas login

# Build APK for testing
eas build --platform android --profile preview

# Or build AAB for Play Store
eas build --platform android --profile production
```

---

## Test on iOS Simulator

1. Requires macOS with Xcode installed

2. `.env.local` uses localhost (default works):
   ```
   EXPO_PUBLIC_API_URL=http://localhost:3000
   ```

3. Start the API: `npm run dev:api`

4. Start the app: `npx expo start` then press `i` to open in iOS Simulator

---

## Deploy Backend

### Option A: Docker Compose (single server)

```bash
# Build production images
docker compose -f docker-compose.yml -f docker-compose.prod.yml build

# Start everything
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Option B: Cloud (recommended for production)

#### AWS (ECS + RDS + ElastiCache)

1. **Database**: Create RDS PostgreSQL 16 instance in `ap-south-1` (Mumbai)
   - Multi-AZ for production
   - Automated backups enabled

2. **Redis**: Create ElastiCache Redis 7 cluster

3. **Container Registry**: Push Docker images to ECR
   ```bash
   # Build and push
   aws ecr get-login-password | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.ap-south-1.amazonaws.com

   docker build -f apps/api/Dockerfile -t katha-api .
   docker tag katha-api:latest YOUR_ACCOUNT.dkr.ecr.ap-south-1.amazonaws.com/katha-api:latest
   docker push YOUR_ACCOUNT.dkr.ecr.ap-south-1.amazonaws.com/katha-api:latest

   # Same for worker
   docker build -f apps/worker/Dockerfile -t katha-worker .
   docker tag katha-worker:latest YOUR_ACCOUNT.dkr.ecr.ap-south-1.amazonaws.com/katha-worker:latest
   docker push YOUR_ACCOUNT.dkr.ecr.ap-south-1.amazonaws.com/katha-worker:latest
   ```

4. **ECS Service**: Create Fargate services for API and Worker

5. **Environment Variables**: Set via ECS Task Definition environment or AWS Secrets Manager

6. **Domain**: Point your domain to the ALB
   - `api.katha.ai` → API service
   - `admin.katha.ai` → Admin panel

#### Google Cloud (Cloud Run)

```bash
# Build and push to Artifact Registry
gcloud builds submit --tag asia-south1-docker.pkg.dev/YOUR_PROJECT/katha/api .

# Deploy
gcloud run deploy katha-api \
  --image asia-south1-docker.pkg.dev/YOUR_PROJECT/katha/api \
  --region asia-south1 \
  --set-env-vars NODE_ENV=production \
  --set-secrets DATABASE_URL=katha-db-url:latest,JWT_SECRET=katha-jwt:latest
```

---

## Deploy Admin Panel

The admin panel is a static site (Vite build).

### Build
```bash
cd apps/admin
npm run build
# Output in apps/admin/dist/
```

### Deploy Options

**Cloudflare Pages (recommended for India):**
```bash
npx wrangler pages deploy apps/admin/dist --project-name katha-admin
```

**Vercel:**
```bash
cd apps/admin
npx vercel --prod
```

**Docker (nginx):**
```bash
docker build -f apps/admin/Dockerfile -t katha-admin .
docker run -p 3001:3001 katha-admin
```

Set the API URL at build time:
```bash
VITE_API_URL=https://api.katha.ai/api/v1 npm run build
```

---

## Deploy Mobile App

### Android (Play Store)
```bash
cd apps/mobile

# Configure EAS
eas build:configure

# Build for Play Store
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android
```

### iOS (App Store)
```bash
# Build for App Store
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

### Over-the-Air Updates (no store review needed)
```bash
# Push a JS update to all users
eas update --branch production --message "Bug fix for story playback"
```

---

## Environment Variables

### What to set per environment

| Variable | Local | Staging | Production |
|----------|-------|---------|------------|
| `NODE_ENV` | development | staging | production |
| `DATABASE_URL` | localhost docker | RDS staging | RDS production (Multi-AZ) |
| `REDIS_HOST` | localhost | ElastiCache staging | ElastiCache production |
| `REDIS_PASSWORD` | (empty) | generated | generated |
| `JWT_SECRET` | dev default | `openssl rand -base64 48` | `openssl rand -base64 48` |
| `ENCRYPTION_SECRET` | dev default | 32-char random | 32-char random |
| `AI_PROVIDER` | mock | mock or openai | openai / anthropic |
| `TTS_PROVIDER` | mock | mock or elevenlabs | elevenlabs / google |
| `CORS_ORIGINS` | localhost:3001 | staging-admin.katha.ai | admin.katha.ai |
| `SENTRY_DSN` | (empty) | staging DSN | production DSN |

### Generate secrets
```bash
# JWT secret
openssl rand -base64 48

# Encryption secret (exactly 32 chars)
openssl rand -hex 16

# Redis password
openssl rand -base64 32
```

### For mobile builds, set in EAS:
```bash
eas secret:create --name EXPO_PUBLIC_API_URL --value https://api.katha.ai
```

---

## Post-Deployment Verification

Run these checks after every deployment:

```bash
API_URL="https://api.katha.ai"

# 1. Health check
curl $API_URL/health
# Expected: {"status":"ok"}

# 2. Deep health check
curl $API_URL/health/ready
# Expected: {"status":"ready","checks":{"database":{"status":"up"}}}

# 3. Register a test user
curl -X POST $API_URL/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"deploy-test@example.com","password":"TestPass1","name":"Deploy Test"}'
# Expected: {"accessToken":"...","refreshToken":"..."}

# 4. Check subscription plans
curl $API_URL/api/v1/subscription/plans
# Expected: array of 4 plans

# 5. Check story seeds
curl $API_URL/api/v1/story-engine/seeds \
  -H "Authorization: Bearer TOKEN_FROM_STEP_3"
# Expected: array of 9+ seeds

# 6. Admin panel loads
curl -s -o /dev/null -w "%{http_code}" https://admin.katha.ai
# Expected: 200

# 7. Delete test user
curl -X DELETE $API_URL/api/v1/users/me \
  -H "Authorization: Bearer TOKEN_FROM_STEP_3"
```

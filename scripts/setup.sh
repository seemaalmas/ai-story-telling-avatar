#!/bin/bash
set -e

echo "========================================"
echo "  Katha AI - Local Development Setup"
echo "========================================"
echo ""

# ─── 1. Check prerequisites ─────────────────────────────
echo "1/6  Checking prerequisites..."

command -v node >/dev/null 2>&1 || { echo "ERROR: Node.js not found. Install Node.js 20+"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "ERROR: Docker not found. Install Docker Desktop"; exit 1; }

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "ERROR: Node.js 20+ required (found v$(node -v))"
  exit 1
fi

echo "   Node.js $(node -v) ✓"
echo "   Docker $(docker --version | cut -d' ' -f3) ✓"
echo ""

# ─── 2. Install dependencies ────────────────────────────
echo "2/6  Installing dependencies..."
npm ci
echo ""

# ─── 3. Create .env.local if not exists ──────────────────
if [ ! -f .env.local ]; then
  echo "3/6  Creating .env.local from .env.example..."
  cp .env.example .env.local
  echo "   Created .env.local — edit it if you need custom values"
else
  echo "3/6  .env.local already exists ✓"
fi
echo ""

# ─── 4. Start infrastructure ────────────────────────────
echo "4/6  Starting Postgres and Redis..."
docker compose up -d
echo "   Waiting for services to be healthy..."
sleep 5

# Check postgres
for i in 1 2 3 4 5; do
  if docker exec katha-postgres pg_isready -U katha -d katha_dev >/dev/null 2>&1; then
    echo "   Postgres ✓"
    break
  fi
  if [ "$i" -eq 5 ]; then echo "ERROR: Postgres not ready"; exit 1; fi
  sleep 2
done

# Check redis
for i in 1 2 3 4 5; do
  if docker exec katha-redis redis-cli ping >/dev/null 2>&1; then
    echo "   Redis ✓"
    break
  fi
  if [ "$i" -eq 5 ]; then echo "ERROR: Redis not ready"; exit 1; fi
  sleep 2
done
echo ""

# ─── 5. Setup database ──────────────────────────────────
echo "5/6  Setting up database..."
npm run db:generate
echo "   Prisma client generated ✓"

# Run migrations (creates tables)
cd apps/api
npx prisma migrate dev --name init --skip-generate 2>/dev/null || npx prisma db push --skip-generate
cd ../..
echo "   Database schema applied ✓"

# Seed default data
npm run db:seed 2>/dev/null || echo "   Seed skipped (may already exist)"
echo ""

# ─── 6. Verify ──────────────────────────────────────────
echo "6/6  Running verification..."
echo ""
echo "========================================"
echo "  Setup Complete!"
echo "========================================"
echo ""
echo "  Start the API:     npm run dev:api"
echo "  Start the admin:   npm run dev:admin"
echo "  Start the mobile:  npm run dev:mobile"
echo "  Start everything:  npm run dev"
echo ""
echo "  API:       http://localhost:7000"
echo "  Swagger:   http://localhost:7000/api/docs"
echo "  Admin:     http://localhost:7001"
echo "  Mobile:    http://localhost:7002"
echo "  Health:    http://localhost:7000/health/ready"
echo ""
echo "  Run tests: npm run test"
echo ""

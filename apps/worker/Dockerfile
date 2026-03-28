FROM node:20-alpine AS base
RUN apk add --no-cache tini
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
COPY apps/worker/package.json ./apps/worker/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ai-providers/package.json ./packages/ai-providers/
RUN npm ci --workspace=apps/worker --workspace=packages/shared --workspace=packages/ai-providers --ignore-scripts

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run --workspace=apps/worker build

FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 worker

COPY --from=builder --chown=worker:nodejs /app/apps/worker/dist ./dist
COPY --from=builder --chown=worker:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=worker:nodejs /app/apps/worker/package.json ./package.json

USER worker

ENTRYPOINT ["tini", "--"]
CMD ["node", "dist/main.js"]

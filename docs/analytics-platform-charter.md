# Katha Insights — Analytics Platform Charter

> Handoff document. Implementation continues in a separate repository (`katha-insights`). This charter records the audit, principles, feature scope, and build sequence so the Katha AI repo retains the design context.

## 1. Why this exists

Replace Google Analytics across every Katha application with a first-party, India-region-hosted analytics platform that:

1. Identifies who logged in — geography, IP, device, new vs returning user.
2. Detects repeat visits and engagement patterns.
3. Renders Google-Analytics-style dashboards owned end-to-end by us.
4. Plugs into every Katha app (mobile, api, admin) and any future application via a single SDK.

The README of this repo states "Privacy First — No third-party tracking." This platform honors that commitment by keeping all data first-party and in `ap-south-1`.

## 2. Audit summary of the existing Katha repo

### 2.1 Admin surface (already built)

- Backend: `apps/api/src/modules/admin/` (NestJS, JWT + RolesGuard).
  - `admin.controller.ts` — endpoints under `/api/v1/admin/*`.
  - `AdminAuditService`, `AdminModerationService`, `FeatureFlagService`.
- Frontend: `apps/admin/src/` (React 18 + Vite + React Router + TanStack Query + Axios).
  - Pages: Dashboard, Users, Stories, Avatars, Reports, FeatureFlags, Languages, AuditLog.
  - No charting library installed.

### 2.2 Analytics-adjacent data already captured

| Source | Table | Useful fields |
|---|---|---|
| `auth/services/device-session.service.ts` | `device_sessions` | `deviceId, deviceName, deviceOS, deviceOSVersion, appVersion, ipAddress, lastActiveAt` |
| `auth/auth.service.ts` | `users` | `lastLoginAt, createdAt, authProvider, preferredLanguage` |
| `consent/consent.service.ts` | `consents` | `type=ANALYTICS`, `granted, ipAddress, userAgent` |
| `subscription/services/entitlement.service.ts` | `entitlement_audits` | `action, platform, ipAddress, createdAt` |
| Story engine | `story_sessions`, `stories` | `mode, tone, language, status, totalTurns` |
| Admin | `admin_audits` | `adminUserId, action, before, after, ipAddress` |

### 2.3 Gaps the new platform fills

- No event ingestion endpoint, no events table, no event queue.
- No IP-to-geo lookup (IPs stored as raw strings).
- No User-Agent parsing.
- No new-vs-returning, retention/cohort, funnel logic.
- No time-series charts, geo map, or realtime view.
- No SDK for other apps to send events.
- ANALYTICS consent flag exists but is never read.

## 3. Operating principles (the project's dharma)

| Principle | Engineering rule |
|---|---|
| Satya (truth) | No sampling, no estimation that isn't labeled. Every number reproducible from raw events. |
| Ahimsa (do no harm) | Privacy by default. PII opt-in, IP anonymized after enrichment, consent gates collection. |
| Swadharma (own your duty) | First-party only. No third-party pixels, no data leaves our servers, no vendor lock-in. |
| Nishkama karma | Build for users and operators, not vanity metrics. Every chart drives a decision. |
| Seva (service) | Multi-tenant from day one so every Katha app benefits equally. |
| Viveka (discernment) | Every metric ships with a definition tooltip and the SQL behind it. |

## 4. Master feature list

### Tier 0 — Foundations (non-negotiable)

1. Multi-tenant core scoped by `appId`; tenant isolation via Prisma middleware.
2. First-party ingestion on our own domain (e.g. `i.katha.app`).
3. Server-side and client-side hybrid tracking; canonical events emitted by `apps/api`.
4. Cookieless mode using salted daily-rotated fingerprint.
5. `class-validator` DTOs on every event; unknowns to a `quarantine` table.
6. HMAC-signed payloads with 5-minute replay window.
7. Per-app rate limiting via Redis token bucket.
8. `analytics_audits` records who viewed which dashboard with which filters.
9. RBAC: `OWNER`, `ADMIN`, `ANALYST`, `MODERATOR`, `BILLING`, `SUPPORT`, `VIEWER`; per-`appId` scope.
10. TOTP 2FA mandatory for ADMIN+; passkeys (WebAuthn) supported.
11. Region-pinned: Postgres + Redis + object storage in `ap-south-1`.
12. DPDP/GDPR rails: consent gate, DSAR export, right-to-erasure, configurable retention per app.

### Tier 1 — Core analytics (MVP, GA parity)

13. Real-time live view (1/5/30-min active users), SSE-pushed.
14. Audience overview: DAU/WAU/MAU, new vs returning, stickiness.
15. Acquisition: UTM source/medium/campaign, referrer, install source.
16. Behavior: top events, top screens/pages, screen flow, time-on-screen, scroll depth.
17. Retention cohorts: D1/D7/D30 heatmap by signup cohort and channel.
18. Sessions: 30-min inactivity gap; duration, depth, entry/exit, bounce rate.
19. Funnels: drag-and-drop step builder; conversion %, drop-off, time-to-convert.
20. Geo dashboard: country/region/city table + choropleth + heatmap; India-state first-class.
21. Device & platform: mobile/tablet/desktop, OS, browser, device model, app version, network type.
22. Language & locale: first-class for the 10 supported Indian languages.
23. Date range with comparison (vs previous period and vs same period last year).
24. Saved segments composable across reports.
25. CSV/PNG export and scheduled email/Slack reports.

### Tier 2 — Beyond Google Analytics (differentiators)

26. No sampling, ever — query raw events.
27. Unlimited custom event schema; nested JSON; per-app schema registry.
28. Unlimited retention; raw events on per-app TTL, aggregates kept forever.
29. SQL workbench: read-only Postgres view per app; ANALYST role with timeout + row-cap.
30. Server-truth events for logins, payments, refunds, story completions.
31. Revenue & subscription analytics from `entitlement_audits`: MRR, ARR, churn, LTV, trial→paid, refund rate, plan mix.
32. Path explorer: most common N-step sequences ending at a goal event.
33. A/B experiments framework extending the existing `feature_flags`; sticky bucketing via HMAC.
34. Anomaly detection with auto-narrative ("Hindi DAU up 18% w/w driven by Maharashtra").
35. Alerts: rule engine on any metric → email / Slack / webhook.
36. Error & crash tracking with stack symbolication and fingerprint grouping.
37. API & job health: auto-emitted `http.request` and `job.complete` events.
38. Annotations on charts (releases, campaigns, incidents).
39. Cross-filtering across charts.
40. Embed mode: iframe any dashboard via signed JWT for in-product analytics.
41. Webhook out and warehouse export to S3 / BigQuery / Snowflake.
42. Open SDKs: Node, Python, Go, Web, React Native, iOS, Android.

### Tier 3 — Trust, safety, and operations

43. Login anomaly detection (new country, impossible travel, new device) → step-up auth signal.
44. Brute-force / credential-stuffing dashboard with auto-block.
45. Bot and VPN/proxy detection (IPinfo Privacy + heuristics); tagged, not dropped.
46. Velocity rules (signups per IP per hour, reports per user per day).
47. Moderation analytics on `abuse_reports`: time-to-resolution, top reporters, false-positive rate.
48. Admin session monitor with revoke; required-2FA enforcement view.
49. Webhook delivery log with retry and DLQ.
50. Per-event PII tagging; UI redacts by default; viewing PII separately permissioned and audited.
51. IP anonymization tiers: full IP for 24h for fraud, then truncate to /24 (IPv4) or /48 (IPv6).
52. DSAR / erasure tooling: one-click wipe across `events`, `sessions`, `users_dim`.
53. Consent-aware SDK refuses to track until `consents.ANALYTICS = granted`; honors revoke retroactively.
54. Data quality monitor: late-arriving events, schema drift, cardinality spikes.

## 5. Geolocation resolution pipeline

GA's single-source IP lookup is frequently wrong for Indian mobile users on CGNAT. Our pipeline resolves location using the first available signal in this order:

1. Mobile SDK precise signal (if user granted permission) — coarse lat/lon (~1.1 km).
2. Cloudflare edge headers (`CF-IPCountry`, `CF-Region`, `CF-IPCity`, `CF-IPLatitude`, `CF-IPLongitude`).
3. MaxMind GeoIP2 City (paid), refreshed weekly.
4. IPinfo / DB-IP cross-check; disagreement lowers confidence score.
5. IPinfo Privacy: VPN / proxy / Tor / hosting flags.
6. MaxMind ISP DB: carrier and ASN (e.g. Reliance Jio vs Airtel).
7. Browser timezone and `Intl.locale` sanity check.
8. Accept-Language and device locale as secondary signals.
9. Self-hosted Nominatim reverse geocoding when precise lat/lon present.

### Stored fields per event

```
country, country_confidence
region/state, region_confidence
city, city_confidence
lat, lon, accuracy_m
timezone, asn, isp, network_type
is_vpn, is_proxy, is_tor, is_hosting
ip_anonymized   // /24 or /48
resolution_source  // gps | cf | maxmind | ipinfo | timezone
```

## 6. Why this beats Google Analytics

| Capability | GA4 | Katha Insights |
|---|---|---|
| Data ownership | Google's | Yours, in `ap-south-1` |
| Sampling above threshold | Yes, silently | Never |
| Custom event properties | 25-param cap | Unlimited JSON |
| Raw event SQL access | Paid BigQuery export only | Included |
| Retention | 14 months default | Unlimited |
| Server-side truth events | Hard | Native |
| Revenue / MRR / churn | Manual setup | First-class |
| India geo accuracy | Weak | Multi-source + carrier + Indian-state taxonomy |
| Indian language analytics | Generic locale | First-class for 10 languages |
| Cookieless / consent-aware | Limited | Built in |
| Embedded dashboards | Not really | Signed-JWT iframe |
| Anomaly auto-narrative | Limited | Yes |
| Error / crash tracking | No | Yes |
| Login fraud / abuse signals | No | Yes |
| Moderation analytics | No | Yes |
| Vendor lock-in | High | Zero |

## 7. Recommended target architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Each app (mobile, web, admin, future apps)                  │
│  └─ @katha/analytics-sdk  (track / identify / page)         │
└────────────────┬────────────────────────────────────────────┘
                 │  HTTPS  POST /v1/collect (batched, gzip, HMAC-signed)
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ analytics-api  (NestJS)                                     │
│  • API key auth per app (`appId` + `writeKey`)              │
│  • IP from x-forwarded-for                                  │
│  • GeoIP2 + ua-parser-js enrichment                         │
│  • push to BullMQ "events" queue + Redis Stream (realtime)  │
└──────┬─────────────────────────────────────────┬────────────┘
       │                                         │
       ▼                                         ▼
┌──────────────┐                         ┌──────────────────┐
│ analytics-   │  consume + aggregate    │ Realtime channel │
│ worker       │ ──────────────────────▶ │ (SSE/WebSocket)  │
│ (BullMQ)     │  • sessionize           └──────────────────┘
│              │  • upsert users_dim
│              │  • daily_metrics rollup
│              │  • cohort_retention nightly cron
└──────┬───────┘
       ▼
┌─────────────────────────────────────────────────────────────┐
│ Postgres (analytics schema, separate DB)                    │
│   events, sessions, users_dim, daily_metrics,               │
│   cohort_retention, funnels, apps, api_keys                 │
└────────────────┬────────────────────────────────────────────┘
                 ▲
                 │  GET /v1/reports/*  (JWT, app-scoped)
                 │
┌─────────────────────────────────────────────────────────────┐
│ analytics-admin  (React + Vite + Recharts + react-simple-   │
│ maps)  — GA replacement UI                                  │
└─────────────────────────────────────────────────────────────┘
```

### Suggested monorepo layout

```
apps/
  analytics-api/        # NestJS — ingest + reports
  analytics-worker/     # BullMQ — sessionize, rollups, cohorts
  analytics-admin/      # React+Vite — dashboards
packages/
  analytics-sdk-web/    # browser SDK
  analytics-sdk-node/   # server SDK
  analytics-sdk-rn/     # React Native SDK
  analytics-schema/     # Prisma schema + migrations
  shared/               # shared types and utilities
```

### Initial Prisma schema sketch

```prisma
model App         { id String @id  name String  writeKey String @unique  createdAt DateTime @default(now()) }
model Event       {
  id String @id @default(cuid())
  appId String  userId String?  anonymousId String  sessionId String?
  event String   props Json?
  ip String?  country String?  region String?  city String?  lat Float?  lon Float?
  uaRaw String?  browser String?  os String?  deviceType String?
  isNewUser Boolean  occurredAt DateTime  receivedAt DateTime @default(now())
  @@index([appId, occurredAt])  @@index([appId, event, occurredAt])
  @@index([appId, anonymousId]) @@index([appId, userId])
}
model UserDim     { appId String  userId String?  anonymousId String  firstSeenAt DateTime  lastSeenAt DateTime  visitCount Int  country String?  deviceType String?  @@id([appId, anonymousId]) }
model Session     { id String @id  appId String  anonymousId String  userId String?  startedAt DateTime  endedAt DateTime  durationSec Int  eventCount Int  entryEvent String?  exitEvent String?  country String?  deviceType String?  @@index([appId, startedAt]) }
model DailyMetric { appId String  date DateTime  dau Int  wau Int  mau Int  newUsers Int  returningUsers Int  sessions Int  @@id([appId, date]) }
model CohortRetention { appId String  cohortDate DateTime  dayOffset Int  retained Int  @@id([appId, cohortDate, dayOffset]) }
```

### SDK surface

```ts
analytics.init({ writeKey, appId, endpoint });
analytics.identify(userId, traits?);
analytics.track(event, props?);
analytics.page(name?, props?);     // web
analytics.screen(name?, props?);   // React Native
```

## 8. Security baseline (applies to every feature)

1. AuthN: short-lived JWT (15m) + refresh; per-environment signing keys.
2. AuthZ: every endpoint passes through role guard + per-`appId` policy.
3. Rate limit on `/collect` per IP and per `writeKey`; on report endpoints per `userId`.
4. Schema validation on every payload; reject unknown fields.
5. HMAC on ingest with `nonce + timestamp` replay window.
6. Tenant isolation enforced via Prisma middleware so app code can't forget.
7. SVG-only chart rendering; escape all user-supplied props in tables.
8. Secrets hashed at rest with `argon2`; shown once on creation; rotation supported.
9. Audit log of read access (`analytics_audits`).
10. Helmet, strict CORS allowlist per app, CSP, HSTS.
11. TLS to Postgres; row-level security keyed by `appId`; analytics DB user has no DDL.
12. Container hardening: non-root, read-only FS, no host network.
13. Encrypted backups with documented RPO/RTO.
14. `npm audit` in CI; Dependabot; lockfile committed.

## 9. Build sequence

| Phase | Duration | Scope |
|---|---|---|
| 1 — Foundation | 3 weeks | Tier 0 items 1-12, Tier 1 items 13-17, 20-22. Server SDK in `apps/api`, web SDK in `apps/admin`, RN SDK in `apps/mobile`. |
| 2 — GA parity | 3 weeks | Tier 1 items 18, 19, 23-25. Geolocation pipeline. Saved segments, scheduled reports. |
| 3 — Beyond GA | 4 weeks | Tier 2 items 26-34, 38-40. Revenue analytics. A/B framework. SQL workbench. |
| 4 — Trust & safety | 3 weeks | Tier 3 items 43-54. Error tracking. Login-anomaly feedback into `apps/api`. |
| 5 — Productize | 2 weeks | Per-app onboarding wizard, embed mode, warehouse export, public SDK docs. |

## 10. Phase 1 — first PRs in the new repo

1. Repo scaffold + CI (workspaces, turbo, tsconfig, lint, prettier, GH Actions typecheck).
2. `docker-compose.yml` — Postgres 16, Redis 7, Nominatim (with India OSM extract).
3. `packages/analytics-schema` — Prisma datasource + initial models + first migration.
4. `apps/analytics-api` — NestJS bootstrap, health endpoint, Prisma + config modules.
5. `POST /v1/collect` — HMAC verify → DTO validate → write raw event → 202.
6. `packages/analytics-sdk-node` — minimal `track()` + batched flush + HMAC signing.
7. Wire SDK into Katha `apps/api` `auth.service.ts` to emit `user.login` end-to-end.
8. GeoIP enrichment middleware (MaxMind + IPinfo + ASN, with confidence score).
9. UA parsing middleware (`ua-parser-js`).
10. `apps/analytics-worker` — BullMQ consumer for sessionization and `UserDim` upsert.
11. `apps/analytics-admin` — Vite + React + Recharts; login + layout + DAU chart.
12. `GET /v1/reports/overview` — DAU / new vs returning / top countries from `daily_metrics`.

## 11. Integration plan back into Katha

- Replay `users.lastLoginAt` and `device_sessions` rows as historical `user.login` events.
- Stream future logins from `auth.service.ts` (already has IP, device, UA).
- Stream `entitlement_audits` as `subscription.*` events for revenue analytics.
- Stream story lifecycle from `story_sessions` as `story.*` events.
- Honor `consents` table: SDK refuses to track until `ANALYTICS = granted`.

## 12. Commitment

Every feature ships behind a feature flag, with automated tests, an admin runbook, a privacy review, and a "what decision does this enable?" line in the PR description. If a feature can't answer that last question, it doesn't ship.

*Karmanyevadhikaraste, ma phaleshu kadachana* — focus on right action; the metrics will follow.

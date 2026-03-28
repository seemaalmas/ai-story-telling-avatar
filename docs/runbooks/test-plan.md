# Test Plan

## Test Pyramid

```
          ┌──────────┐
         │  Manual   │  ← Store review, accessibility audit
        │  QA Tests  │
       ├─────────────┤
      │   E2E Tests   │  ← Critical user flows (Detox / Maestro)
     ├─────────────────┤
    │  Integration Tests │  ← API endpoints with real DB (Jest + Supertest)
   ├───────────────────────┤
  │      Unit Tests          │  ← Services, guards, utilities (Jest)
 └───────────────────────────┘
```

## Unit Tests (existing: 25+ suites)

| Module | Test File | Coverage |
|--------|----------|----------|
| Crypto utility | `crypto.util.spec.ts` | encrypt/decrypt, OTP, unicode |
| OTP service | `otp.service.spec.ts` | generation, rate limiting, verify |
| Auth service | `auth.service.spec.ts` | register, login, OTP login, refresh |
| Device sessions | `device-session.service.spec.ts` | upsert, eviction, revoke |
| Users service | `users.service.spec.ts` | CRUD, deactivate, delete |
| Preferences | `preferences.service.spec.ts` | encrypt, auto-detect, CRUD |
| Consent | `consent.service.spec.ts` | grant, bulk, revoke, check |
| Prompt builder | `prompt-builder.service.spec.ts` | modes, tones, safety, parse |
| Moderation | `moderation.service.spec.ts` | block, flag, pass, redirects |
| Story engine | `story-engine.service.spec.ts` | start, continue, end, guards |
| Story seeds | `story-seed.service.spec.ts` | data quality, uniqueness |
| Story LLM | `story-llm.service.spec.ts` | mock responses, modes |
| TTS service | `tts.service.spec.ts` | synthesis, streaming, labels |
| STT service | `stt.service.spec.ts` | transcription, timestamps |
| Mock TTS | `mock-tts.provider.spec.ts` | full provider contract |
| Voice enrollment | `voice-enrollment.service.spec.ts` | consent gates, lifecycle |
| Abuse reports | `abuse-report.service.spec.ts` | hooks, auto-suspend |
| Plan service | `plan.service.spec.ts` | plans, entitlements |
| Entitlement | `entitlement.service.spec.ts` | purchase, restore, cancel |
| Feature gate | `feature-gate.guard.spec.ts` | pass, block, error shape |
| Feature flags | `feature-flag.service.spec.ts` | CRUD, kill switch audit |
| Admin moderation | `admin-moderation.service.spec.ts` | stats, resolve, toggle |

## Integration Tests (to implement)

```bash
npm run test:e2e
```

| Flow | Endpoints Covered |
|------|------------------|
| Auth flow | POST /auth/register → /auth/login → /auth/refresh → /auth/logout |
| OTP flow | POST /auth/otp/request → /auth/otp/verify |
| Story flow | POST /story-engine/start → /story-engine/continue → /story-engine/end |
| Subscription flow | POST /subscription/purchase → GET /subscription/entitlements |
| Admin flow | GET /admin/dashboard → POST /admin/flags (with ADMIN JWT) |

## Mobile E2E Tests (to implement)

Tool: Detox (iOS/Android) or Maestro (cross-platform)

| Test | Steps |
|------|-------|
| Onboarding | Launch → swipe 3 pages → tap "Get Started" |
| Login | Enter email → receive OTP → enter code → see home |
| Create story | Home → tap "Create" → pick mode → pick tone → tap "Start" → see playing |
| Story choices | Playing → tap choice → see new node → repeat |
| Paywall | Profile → tap "Upgrade" → see plans → close |
| Report abuse | Profile → "Report" → select category → describe → submit |

## Performance Tests

| Test | Tool | Target |
|------|------|--------|
| API load test | k6 | 1000 req/s sustained, p99 < 2s |
| Story generation throughput | k6 | 100 concurrent sessions, no failures |
| Mobile cold start | manual | < 3 seconds on mid-range Android |
| Mobile memory | Xcode Instruments / Android Profiler | < 200MB peak |

## Security Tests

- [ ] OWASP ZAP scan against staging API
- [ ] SQL injection: run sqlmap against all POST endpoints
- [ ] JWT: verify expired tokens are rejected
- [ ] Rate limiting: verify OTP endpoints throttled at 3/min
- [ ] RBAC: verify non-admin users get 403 on /admin/* endpoints
- [ ] Input validation: send oversized payloads (>1MB) and verify rejection

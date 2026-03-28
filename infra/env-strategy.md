# Environment & Secrets Strategy

## Environment Tiers

| Tier | Branch | Auto-deploy | Secrets Source | DB |
|------|--------|-------------|---------------|-----|
| local | any | no | `.env.local` file | docker-compose postgres |
| development | develop | on merge | GitHub Environment Secrets | RDS dev instance |
| staging | main (manual) | workflow_dispatch | GitHub Environment Secrets | RDS staging instance |
| production | main (manual) | workflow_dispatch + approval | GitHub Environment Secrets + AWS Secrets Manager | RDS production (Multi-AZ) |

## Secrets Classification

### Critical (rotate quarterly, never log)
- `JWT_SECRET` — 256-bit random, unique per environment
- `ENCRYPTION_SECRET` — 32-byte key for AES-256-GCM preference encryption
- `DATABASE_URL` — connection string with credentials
- `REDIS_PASSWORD` — Redis auth

### Service Credentials (rotate on compromise)
- `APPLE_SHARED_SECRET` — App Store Server API
- `GOOGLE_SERVICE_ACCOUNT_KEY` — Play Store API
- `GOOGLE_CLIENT_SECRET` — OAuth
- `APPLE_PRIVATE_KEY` — Apple Sign-In

### API Keys (rotate annually)
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY`
- `ELEVENLABS_API_KEY`, `DEEPGRAM_API_KEY`
- `SENTRY_DSN`

## Secrets Injection

### Local Development
```bash
cp .env.example .env.local
# Edit .env.local with development values
# Never commit .env.local (in .gitignore)
```

### CI/CD (GitHub Actions)
- Secrets stored in GitHub Environment Secrets (per environment)
- Injected as environment variables in workflow steps
- Never printed to logs (`add-mask` used for dynamic values)

### Production (recommended)
- Use AWS Secrets Manager or GCP Secret Manager
- Fetch at container startup via init script or sidecar
- Auto-rotation enabled for database credentials
- Reference: `aws secretsmanager get-secret-value --secret-id katha/prod/db`

## Secret Rotation Runbook

1. Generate new secret value
2. Add new value to Secrets Manager as a new version
3. Deploy API with both old and new values accepted (dual-read)
4. Verify all instances using new value
5. Remove old value
6. Record rotation in admin audit log

## WAF Recommendations

Deploy a Web Application Firewall in front of the API:

### AWS WAF Rules (recommended for India deployment)
1. **Rate limiting**: 1000 req/5min per IP (in addition to app-level throttle)
2. **Geo-blocking**: Allow IN, US, GB, SG; block known bad-actor countries
3. **SQL injection protection**: AWS Managed Rules - SQL injection rule set
4. **XSS protection**: AWS Managed Rules - Cross-site scripting rule set
5. **Bot control**: AWS Managed Rules - Bot control (block scrapers)
6. **IP reputation**: AWS Managed Rules - IP reputation list
7. **Request size limit**: 8KB body max (except file upload endpoints)

### Cloudflare Alternative
- Enable "Under Attack" mode during incidents
- Rate limiting rules per endpoint
- Bot Fight Mode enabled
- India-edge PoP for low latency (Mumbai, Chennai)

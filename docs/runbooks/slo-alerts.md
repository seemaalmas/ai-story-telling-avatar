# SLOs, SLIs, and Alert Configuration

## Service Level Objectives

| Service | SLI | SLO Target | Measurement Window |
|---------|-----|------------|-------------------|
| API availability | Successful responses (non-5xx) / total requests | 99.9% | 30-day rolling |
| API latency (p50) | 50th percentile response time | < 100ms | 30-day rolling |
| API latency (p99) | 99th percentile response time | < 2000ms | 30-day rolling |
| Story generation | Successful story starts / total attempts | 99.5% | 7-day rolling |
| TTS synthesis | Successful synthesis / total requests | 99.5% | 7-day rolling |
| Auth (login/OTP) | Successful auth / total attempts (excl. invalid creds) | 99.9% | 30-day rolling |
| Database | Successful queries / total queries | 99.99% | 30-day rolling |

## Error Budget

- **99.9% monthly SLO** = 43.2 minutes of allowed downtime per month
- **99.5% weekly SLO** = 50.4 minutes of allowed downtime per week

Burn rate alerts:
- **Fast burn** (14.4x): 2% of monthly budget consumed in 1 hour → SEV-1
- **Slow burn** (3x): 10% of monthly budget consumed in 6 hours → SEV-2

## Alert Configuration

### Critical (PagerDuty / SMS)
```yaml
- name: api_error_rate_high
  condition: rate(http_responses_total{status=~"5.."}[5m]) / rate(http_responses_total[5m]) > 0.01
  for: 2m
  severity: critical
  action: Page on-call

- name: api_latency_p99_high
  condition: histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) > 5
  for: 5m
  severity: critical

- name: database_connection_pool_exhausted
  condition: prisma_pool_active_connections / prisma_pool_max_connections > 0.9
  for: 1m
  severity: critical

- name: disk_usage_critical
  condition: node_filesystem_avail_bytes / node_filesystem_size_bytes < 0.1
  for: 5m
  severity: critical
```

### Warning (Slack #alerts)
```yaml
- name: api_error_rate_elevated
  condition: rate(http_responses_total{status=~"5.."}[15m]) / rate(http_responses_total[15m]) > 0.005
  for: 10m
  severity: warning

- name: story_generation_slow
  condition: histogram_quantile(0.95, rate(story_generation_duration_seconds_bucket[15m])) > 10
  for: 5m
  severity: warning

- name: redis_memory_high
  condition: redis_memory_used_bytes / redis_memory_max_bytes > 0.8
  for: 10m
  severity: warning

- name: open_abuse_reports_high
  condition: abuse_reports_open_total > 20
  for: 1h
  severity: warning
```

### Info (Slack #ops)
```yaml
- name: deployment_completed
  condition: on deployment webhook
  severity: info

- name: kill_switch_activated
  condition: on admin audit action = "kill_switch_*"
  severity: info
```

## OpenTelemetry Setup

```bash
# Add to API container environment
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318
OTEL_SERVICE_NAME=katha-api
OTEL_RESOURCE_ATTRIBUTES=deployment.environment=production,service.version=0.1.0
```

The TracingInterceptor in `common/interceptors/tracing.interceptor.ts` is the integration point.
Replace Logger calls with OTel span creation when the collector is deployed.

## Sentry Integration

```bash
# Add to .env
SENTRY_DSN=https://xxx@o123.ingest.sentry.io/456

# In main.ts (when SENTRY_DSN is set):
# import * as Sentry from '@sentry/node';
# Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV });
```

The GlobalExceptionFilter and TracingInterceptor both have TODO comments marking
exactly where to add `Sentry.captureException()` calls.

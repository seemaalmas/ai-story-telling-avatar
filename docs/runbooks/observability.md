# Observability Setup Guide

## Architecture

```
┌─────────┐    ┌─────────┐    ┌──────────┐
│ API     │───▶│ OTel    │───▶│ Grafana  │
│ Worker  │    │ Collector│    │ Cloud /  │
│ Admin   │    │         │    │ Tempo    │
└─────────┘    └────┬────┘    └──────────┘
                    │
              ┌─────▼─────┐
              │ Prometheus │──▶ Grafana dashboards
              └───────────┘

┌─────────┐    ┌──────────┐
│ API     │───▶│ Sentry   │ (crash reporting)
│ Mobile  │    └──────────┘
└─────────┘
```

## OpenTelemetry Integration

### 1. Install packages
```bash
npm install @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node \
  @opentelemetry/exporter-trace-otlp-http @opentelemetry/exporter-metrics-otlp-http
```

### 2. Create `apps/api/src/tracing.ts`
```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';

const sdk = new NodeSDK({
  serviceName: 'katha-api',
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT + '/v1/traces',
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT + '/v1/metrics',
    }),
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
```

### 3. Import before anything else in `main.ts`
```typescript
import './tracing'; // Must be first import
import { NestFactory } from '@nestjs/core';
```

### 4. Environment variables
```bash
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318
OTEL_SERVICE_NAME=katha-api
OTEL_RESOURCE_ATTRIBUTES=deployment.environment=production
```

## Sentry Crash Reporting

### Backend
```bash
npm install @sentry/node
```

In `main.ts`:
```typescript
import * as Sentry from '@sentry/node';
if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV });
}
```

In `GlobalExceptionFilter`:
```typescript
if (status >= 500) {
  Sentry.captureException(exception);
}
```

### Mobile (React Native)
```bash
npx expo install @sentry/react-native
```

In `app/_layout.tsx`:
```typescript
import * as Sentry from '@sentry/react-native';
Sentry.init({ dsn: process.env.EXPO_PUBLIC_SENTRY_DSN });
```

## Key Metrics to Track

| Metric | Type | Labels |
|--------|------|--------|
| `http_requests_total` | Counter | method, path, status |
| `http_request_duration_ms` | Histogram | method, path |
| `story_sessions_active` | Gauge | mode |
| `story_generation_duration_ms` | Histogram | mode, tone |
| `tts_synthesis_duration_ms` | Histogram | provider, language |
| `auth_login_total` | Counter | method (email, otp, google, apple), success |
| `subscription_purchases_total` | Counter | plan, platform |
| `abuse_reports_total` | Counter | category, status |
| `feature_flag_evaluations_total` | Counter | flag, result |

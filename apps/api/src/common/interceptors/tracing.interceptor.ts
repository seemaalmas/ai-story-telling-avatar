import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';

/**
 * Request tracing interceptor.
 *
 * Assigns a unique trace ID to every request, logs timing, and attaches
 * the trace ID to the response headers for correlation.
 *
 * In production, replace the Logger calls with OpenTelemetry span exports:
 *
 *   import { trace, SpanStatusCode } from '@opentelemetry/api';
 *   const tracer = trace.getTracer('katha-api');
 *   const span = tracer.startSpan(`${method} ${url}`);
 *   span.setAttribute('http.method', method);
 *   span.setAttribute('http.url', url);
 *   span.setAttribute('http.status_code', statusCode);
 *   span.end();
 *
 * Wire up the OTel SDK in a separate file (see docs/runbooks/observability.md).
 */
@Injectable()
export class TracingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    const traceId = (req.headers['x-trace-id'] as string) ?? randomUUID();
    const startMs = Date.now();

    // Attach trace ID to request and response
    (req as unknown as Record<string, unknown>).traceId = traceId;
    res.setHeader('x-trace-id', traceId);

    return next.handle().pipe(
      tap({
        next: () => {
          const durationMs = Date.now() - startMs;
          this.logger.log(
            `${req.method} ${req.url} ${res.statusCode} ${durationMs}ms [${traceId}]`,
          );
        },
        error: (err: Error) => {
          const durationMs = Date.now() - startMs;
          this.logger.error(
            `${req.method} ${req.url} ERR ${durationMs}ms [${traceId}] ${err.message}`,
          );

          // TODO: Report to Sentry / crash reporting
          // Sentry.captureException(err, { extra: { traceId, url: req.url } });
        },
      }),
    );
  }
}

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /** Lightweight liveness probe — always 200 if process is running. */
  @Get()
  @ApiOperation({ summary: 'Liveness probe' })
  liveness() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  /** Deep readiness probe — checks all critical dependencies. */
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe (deep dependency check)' })
  async readiness() {
    const checks: Record<string, { status: string; latencyMs?: number }> = {};

    const dbStart = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = { status: 'up', latencyMs: Date.now() - dbStart };
    } catch {
      checks.database = { status: 'down', latencyMs: Date.now() - dbStart };
    }

    const redisHost = this.config.get('redis.host');
    checks.redis = { status: redisHost ? 'configured' : 'not_configured' };

    const allUp = Object.values(checks).every((c) => c.status !== 'down');

    return {
      status: allUp ? 'ready' : 'degraded',
      version: '0.1.0',
      environment: this.config.get('app.env'),
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  /** Startup probe — returns 200 once app is initialized. */
  @Get('startup')
  @ApiOperation({ summary: 'Startup probe' })
  startup() {
    return { status: 'started', timestamp: new Date().toISOString() };
  }
}

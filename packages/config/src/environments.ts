export type Environment = 'local' | 'development' | 'staging' | 'production';

export interface EnvironmentConfig {
  name: Environment;
  apiUrl: string;
  debug: boolean;
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    prettyPrint: boolean;
  };
  database: {
    poolMin: number;
    poolMax: number;
    ssl: boolean;
  };
  redis: {
    tls: boolean;
  };
  cors: {
    origins: string[];
  };
  rateLimit: {
    ttl: number;
    limit: number;
  };
}

export const environments: Record<Environment, EnvironmentConfig> = {
  local: {
    name: 'local',
    apiUrl: 'http://localhost:7000',
    debug: true,
    logging: { level: 'debug', prettyPrint: true },
    database: { poolMin: 2, poolMax: 10, ssl: false },
    redis: { tls: false },
    cors: { origins: ['http://localhost:7001', 'http://localhost:7002'] },
    rateLimit: { ttl: 60000, limit: 1000 },
  },
  development: {
    name: 'development',
    apiUrl: 'https://dev-api.katha.ai',
    debug: true,
    logging: { level: 'debug', prettyPrint: false },
    database: { poolMin: 2, poolMax: 20, ssl: true },
    redis: { tls: false },
    cors: { origins: ['https://dev-admin.katha.ai'] },
    rateLimit: { ttl: 60000, limit: 500 },
  },
  staging: {
    name: 'staging',
    apiUrl: 'https://staging-api.katha.ai',
    debug: false,
    logging: { level: 'info', prettyPrint: false },
    database: { poolMin: 5, poolMax: 30, ssl: true },
    redis: { tls: true },
    cors: { origins: ['https://staging-admin.katha.ai'] },
    rateLimit: { ttl: 60000, limit: 200 },
  },
  production: {
    name: 'production',
    apiUrl: 'https://api.katha.ai',
    debug: false,
    logging: { level: 'warn', prettyPrint: false },
    database: { poolMin: 10, poolMax: 50, ssl: true },
    redis: { tls: true },
    cors: { origins: ['https://admin.katha.ai'] },
    rateLimit: { ttl: 60000, limit: 100 },
  },
};

export function getEnvironmentConfig(env?: string): EnvironmentConfig {
  const envName = (env ?? process.env.NODE_ENV ?? 'local') as Environment;
  return environments[envName] ?? environments.local;
}

#!/usr/bin/env node
/*
 * Loads env files the same way the API does, then runs a command.
 *
 * Prisma CLI only reads `.env` files — it ignores `.env.development`.
 * This wrapper bridges that gap so `db:migrate`, `db:seed` etc. work
 * without a local `.env` file.
 *
 * Usage (in package.json scripts):
 *   "db:migrate": "node ../../scripts/with-env.js prisma migrate dev"
 */

/* eslint-disable no-console */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const apiRoot = path.join(repoRoot, 'apps', 'api');

// Load env files in priority order (first value wins per key).
function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const src = fs.readFileSync(filePath, 'utf8');
  for (const raw of src.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const k = line.slice(0, eq).trim();
    let v = line.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (process.env[k] === undefined) {
      process.env[k] = v;
    }
  }
}

// Same order as NestJS ConfigModule in app.module.ts
loadEnv(path.join(apiRoot, '.env.local'));
loadEnv(path.join(apiRoot, '.env'));
loadEnv(path.join(apiRoot, '.env.development'));
loadEnv(path.join(repoRoot, '.env.local'));
loadEnv(path.join(repoRoot, '.env'));
loadEnv(path.join(repoRoot, '.env.development'));

const cmd = process.argv.slice(2).join(' ');
if (!cmd) {
  console.error('Usage: node with-env.js <command>');
  process.exit(1);
}

try {
  execSync(cmd, { stdio: 'inherit', env: process.env });
} catch (e) {
  process.exit(e.status ?? 1);
}

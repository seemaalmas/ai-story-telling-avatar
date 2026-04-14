#!/usr/bin/env node
/*
 * DB Preflight Check
 * -------------------
 * Diagnoses the most common local-dev database errors before the API starts.
 *
 * Specifically catches:
 *   - DATABASE_URL pointing at Supabase/Supavisor (causes "Tenant or user not found")
 *   - Postgres not reachable on localhost:5432 (Docker not started)
 *   - OS-level DATABASE_URL overriding the repo's .env.development
 *
 * Run from repo root or apps/api:
 *   node scripts/db-preflight.js
 */

/* eslint-disable no-console */
const fs = require('fs');
const net = require('net');
const path = require('path');

// Track which file defined DATABASE_URL so we can tell the user EXACTLY which
// file to edit when it points at the wrong DB.
let databaseUrlSource = process.env.DATABASE_URL ? '<OS environment>' : null;
const initialDatabaseUrl = process.env.DATABASE_URL;

// ── Load env the SAME way the API does (so we diagnose what IT sees) ────
// Priority (first hit wins, unless process.env already has a value):
//   apps/api/.env.local -> apps/api/.env -> apps/api/.env.development
//   -> repo root .env.local -> .env -> .env.development
function tryLoadDotenv(p) {
  if (!fs.existsSync(p)) return false;
  const before = process.env.DATABASE_URL;
  try {
    require('dotenv').config({ path: p });
    console.log(`  loaded env: ${p}`);
  } catch {
    // dotenv may not be installed at root; fall back to manual parse
    const src = fs.readFileSync(p, 'utf8');
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
      if (process.env[k] === undefined) process.env[k] = v;
    }
    console.log(`  loaded env (manual): ${p}`);
  }
  const after = process.env.DATABASE_URL;
  if (!before && after && !databaseUrlSource) {
    databaseUrlSource = p;
  }
  return true;
}

const repoRoot = path.resolve(__dirname, '..');
const apiRoot = path.join(repoRoot, 'apps', 'api');

console.log('\n── DB Preflight ────────────────────────────────────────');
console.log(`  cwd:        ${process.cwd()}`);
console.log(`  repo root:  ${repoRoot}`);

for (const p of [
  path.join(apiRoot, '.env.local'),
  path.join(apiRoot, '.env'),
  path.join(apiRoot, '.env.development'),
  path.join(repoRoot, '.env.local'),
  path.join(repoRoot, '.env'),
  path.join(repoRoot, '.env.development'),
]) {
  tryLoadDotenv(p);
}

const url = process.env.DATABASE_URL;

if (!url) {
  fail([
    'DATABASE_URL is not set.',
    '',
    'Fix:',
    '  1) Copy .env.example to .env.local at the repo root',
    '  2) OR ensure .env.development exists (committed default)',
    '  3) On Windows, make sure you do NOT have a conflicting system env var',
  ]);
}

// Mask the password so we can safely print it.
// The password may contain '@' so we split on the LAST '@' before host.
function maskUrl(u) {
  const schemeIdx = u.indexOf('://');
  if (schemeIdx < 0) return u;
  const afterScheme = u.slice(schemeIdx + 3);
  const lastAt = afterScheme.lastIndexOf('@');
  if (lastAt < 0) return u;
  const userInfo = afterScheme.slice(0, lastAt);
  const hostPart = afterScheme.slice(lastAt);
  const colonIdx = userInfo.indexOf(':');
  const username = colonIdx < 0 ? userInfo : userInfo.slice(0, colonIdx);
  return `${u.slice(0, schemeIdx + 3)}${username}:***${hostPart}`;
}
const masked = maskUrl(url);
console.log(`  DATABASE_URL: ${masked}`);
console.log(`  set by:       ${databaseUrlSource ?? '<unknown>'}`);

let parsed;
try {
  parsed = new URL(url);
} catch (e) {
  fail([`DATABASE_URL is not a valid URL: ${e.message}`]);
}

const host = parsed.hostname;
const port = Number(parsed.port || 5432);
const user = decodeURIComponent(parsed.username || '');

// ── Check the API's own port isn't already in use (common Windows pain) ─
const apiPort = Number(process.env.APP_PORT || 7000);
const tester = net.createServer();
tester.once('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    fail([
      `Port ${apiPort} is already in use.`,
      '',
      'This is almost always a previous "npm run dev" that did not shut down',
      'cleanly (common on Windows — Ctrl+C does not always kill children).',
      '',
      'Find and kill it:',
      '  Windows (cmd/PowerShell):',
      `    netstat -ano | findstr :${apiPort}`,
      '    taskkill /PID <PID> /F',
      '',
      '  One-liner (cmd.exe):',
      `    for /f "tokens=5" %a in ('netstat -ano ^| findstr :${apiPort}') do taskkill /PID %a /F`,
      '',
      '  macOS / Linux:',
      `    lsof -ti:${apiPort} | xargs kill -9`,
      '',
      'Or run:',
      '    npm run ports:free',
    ]);
  }
  // Non-EADDRINUSE errors (e.g. permission): ignore and continue to DB probe.
  runDbProbe();
});
tester.once('listening', () => {
  tester.close(() => runDbProbe());
});
tester.listen(apiPort, '0.0.0.0');

function runDbProbe() {

// ── Detect the "Tenant or user not found" scenario ─────────────────────
const isSupabasePooler =
  /supabase\.(co|com)$/.test(host) || /pooler\.supabase/.test(host) || host.includes('supavisor');

if (isSupabasePooler) {
  fail([
    `DATABASE_URL points at Supabase/Supavisor pooler (${host}).`,
    '',
    'This is what causes: "FATAL: Tenant or user not found".',
    '',
    'Most common cause: an OS-level DATABASE_URL environment variable on Windows',
    'overrides the repo\'s .env.development.  Fix it ONE of these ways:',
    '',
    '  A) Unset the OS env var in the SAME terminal, then retry:',
    '       PowerShell:   Remove-Item Env:DATABASE_URL',
    '       cmd.exe:      set DATABASE_URL=',
    '',
    '  B) Permanently remove it (Windows):',
    '       System Properties -> Environment Variables -> delete DATABASE_URL',
    '',
    '  C) If you actually want to use Supabase, set the pooler user correctly:',
    '       postgresql://postgres.<project-ref>:<pwd>@<region>.pooler.supabase.com:6543/postgres',
    '',
    '  D) Otherwise use local Postgres (recommended for dev):',
    '       npm run docker:up',
    '       DATABASE_URL in .env.development already points at it',
  ]);
}

// ── TCP reachability check (no driver needed) ──────────────────────────
console.log(`  probing tcp ${host}:${port} ...`);

const socket = new net.Socket();
let finished = false;
const done = (ok, err) => {
  if (finished) return;
  finished = true;
  socket.destroy();
  if (ok) {
    console.log(`  OK: ${host}:${port} is reachable`);
    console.log('  Preflight passed. Starting app...\n');
    process.exit(0);
  }
  fail([
    `Cannot reach Postgres at ${host}:${port} (${err}).`,
    '',
    'If host is "localhost": the Docker Postgres is not running.',
    '  npm run docker:up',
    '',
    'Then verify the container is healthy:',
    '  docker ps --filter name=katha-postgres',
  ]);
};

socket.setTimeout(3000);
socket.once('connect', () => done(true));
socket.once('timeout', () => done(false, 'timeout after 3s'));
socket.once('error', (err) => done(false, err.code || err.message));
socket.connect(port, host);

}  // end runDbProbe

function fail(lines) {
  console.error('\n  X PREFLIGHT FAILED\n');
  for (const l of lines) console.error(`    ${l}`);
  console.error('');
  process.exit(1);
}
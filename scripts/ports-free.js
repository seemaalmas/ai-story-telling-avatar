#!/usr/bin/env node
/*
 * Free ports used by Katha AI services.
 *
 * Usage:
 *   node scripts/ports-free.js              # frees 7000, 7001, 7002
 *   node scripts/ports-free.js 7000 8080    # frees specific ports
 *
 * Works on Windows, macOS, and Linux.  Safe to run when nothing is listening.
 */

/* eslint-disable no-console */
const { execSync } = require('child_process');
const os = require('os');

const argPorts = process.argv.slice(2).map(Number).filter((n) => Number.isInteger(n));
const DEFAULT_PORTS = [7000, 7001, 7002];
const ports = argPorts.length ? argPorts : DEFAULT_PORTS;

const isWindows = os.platform() === 'win32';

function sh(cmd) {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
  } catch {
    return '';
  }
}

function freePortUnix(port) {
  const out = sh(`lsof -ti:${port}`);
  const pids = out.split('\n').map((s) => s.trim()).filter(Boolean);
  if (!pids.length) {
    console.log(`  ${port}: free`);
    return;
  }
  for (const pid of pids) {
    sh(`kill -9 ${pid}`);
    console.log(`  ${port}: killed PID ${pid}`);
  }
}

function freePortWindows(port) {
  // netstat output columns are whitespace-delimited; PID is the last one.
  const out = sh(`netstat -ano | findstr :${port}`);
  const pids = new Set();
  for (const line of out.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Only match LISTENING rows to avoid killing random outbound connections.
    if (!/LISTENING/i.test(trimmed) && !/UDP/i.test(trimmed)) continue;
    // Must exactly match :<port> to avoid false-positives like :70001
    if (!new RegExp(`[:.]${port}\\b`).test(trimmed)) continue;
    const cols = trimmed.split(/\s+/);
    const pid = cols[cols.length - 1];
    if (/^\d+$/.test(pid) && pid !== '0') pids.add(pid);
  }
  if (!pids.size) {
    console.log(`  ${port}: free`);
    return;
  }
  for (const pid of pids) {
    sh(`taskkill /PID ${pid} /F`);
    console.log(`  ${port}: killed PID ${pid}`);
  }
}

console.log(`Freeing ports: ${ports.join(', ')}`);
for (const p of ports) {
  if (isWindows) freePortWindows(p);
  else freePortUnix(p);
}
console.log('Done.');

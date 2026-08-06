#!/usr/bin/env node
/**
 * Smoke probe for host-style proxy + upstream BFF (81067).
 * Expects BFF on OPENSHELL_BFF_URL (default :8943) or starts checks via local proxy.
 *
 * Usage:
 *   # Direct against BFF:
 *   OPENSHELL_BFF_URL=http://127.0.0.1:8943 npm run poc:proxy-check
 *   # Via host-style rewrite (start poc:proxy first):
 *   USE_HOST_PROXY=1 npm run poc:proxy-check
 */
const BFF = (process.env.OPENSHELL_BFF_URL ?? 'http://127.0.0.1:8943').replace(/\/+$/, '');
const USE_HOST_PROXY = process.env.USE_HOST_PROXY === '1';
const PROXY = `http://127.0.0.1:${process.env.PROXY_LISTEN_PORT ?? 18080}`;

const base = USE_HOST_PROXY ? `${PROXY}/_bff/openshell/api` : `${BFF}/api`;

async function probe(path) {
  const url = `${base}${path}`;
  try {
    const res = await fetch(url);
    const text = await res.text();
    console.log(`${res.status} ${url}`);
    console.log(text.slice(0, 400));
    return res.status;
  } catch (err) {
    console.error(`FAIL ${url}:`, err.message);
    return 0;
  }
}

const health = await probe('/v1/healthz');
const ready = await probe('/v1/readyz');
const workspaces = await probe('/v1/workspaces');

const ok = health === 200 && ready === 200;
if (!ok) {
  console.error(
    '\nExpected healthz=200 and readyz=200 (gateway must be up). workspaces status logged for evidence.',
  );
  process.exitCode = 1;
} else {
  console.log('\nProxy/BFF smoke OK (healthz + readyz). workspaces status:', workspaces);
}

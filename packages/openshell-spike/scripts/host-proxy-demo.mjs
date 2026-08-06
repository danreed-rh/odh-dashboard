#!/usr/bin/env node
/**
 * Host-style proxy demo for RHOAIENG-81067.
 * Mimics odh-dashboard module-federation rewrite:
 *   /_bff/openshell/api → /api  (upstream routes live under /api/v1/…)
 *
 * Usage:
 *   OPENSHELL_BFF_URL=http://127.0.0.1:8080 node scripts/host-proxy-demo.mjs
 *   # then: curl -s http://127.0.0.1:18080/_bff/openshell/api/v1/healthz
 *   #       curl -s http://127.0.0.1:18080/_bff/openshell/api/v1/readyz
 */
import http from 'node:http';

const LISTEN_PORT = Number(process.env.PROXY_LISTEN_PORT ?? 18080);
const BFF = (process.env.OPENSHELL_BFF_URL ?? 'http://127.0.0.1:8080').replace(
  /\/+$/,
  '',
);
const PREFIX = '/_bff/openshell/api';

const server = http.createServer((req, res) => {
  const url = req.url ?? '/';
  if (!url.startsWith(PREFIX)) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error: 'not_found',
        hint: `use ${PREFIX}/v1/healthz or ${PREFIX}/v1/readyz`,
      }),
    );
    return;
  }

  // Rewrite: /_bff/openshell/api/v1/healthz → /api/v1/healthz
  const rewritten = `/api${url.slice(PREFIX.length)}` || '/api';
  const target = new URL(rewritten, `${BFF}/`);

  const headers = { ...req.headers, host: target.host };
  // Preserve odh-style auth header forwarding for authenticated probes.
  const proxyReq = http.request(
    target,
    { method: req.method, headers },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
      proxyRes.pipe(res);
    },
  );
  proxyReq.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error: 'bad_gateway',
        message: err.message,
        bff: BFF,
        rewritten,
      }),
    );
  });
  req.pipe(proxyReq);
});

server.listen(LISTEN_PORT, '127.0.0.1', () => {
  console.log(
    `Host-style proxy listening on http://127.0.0.1:${LISTEN_PORT}${PREFIX}/… → ${BFF}/api/…`,
  );
  console.log(
    `Try: curl -s http://127.0.0.1:${LISTEN_PORT}${PREFIX}/v1/healthz`,
  );
  console.log(
    `Try: curl -s http://127.0.0.1:${LISTEN_PORT}${PREFIX}/v1/readyz`,
  );
});

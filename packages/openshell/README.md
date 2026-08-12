# @odh-dashboard/openshell (spike POC)

Spike-grade Module Federation adapter that consumes **openshell-dashboard** via the PR #10 `build:lib` exports (`file:` dependency until npm publish).

See also: [`../openshell-spike/SPIKE.md`](../openshell-spike/SPIKE.md), [`../openshell-spike/FEDERATION-STRATEGY.md`](../openshell-spike/FEDERATION-STRATEGY.md).

## Prerequisites

1. Sibling clone: `/Users/dareed/Dev/openshell-dashboard` on `main` (includes [PR #25](https://github.com/Gkrumbach07/openshell-dashboard/pull/25) CSS deletion) — or adjust the `file:` path in `frontend/package.json`
2. Upstream lib build:
   ```bash
   cd ../openshell-dashboard/frontend && npm install && npm run build:lib
   ```
3. OpenShell gateway reachable (port-forward cluster gateway or local)
4. Enable feature flag `openshell` (`?devFeatureFlags` in the dashboard URL)

## Run

```bash
# Install remote deps (resolves file: openshell-dashboard)
npm run install:module

# Terminal A — upstream BFF on module service port
OPENSHELL_GATEWAY_URL=127.0.0.1:17670 npm run poc:bff

# Terminal B — optional host-style proxy smoke (without full odh host)
npm run poc:proxy
npm run poc:proxy-check   # direct BFF
USE_HOST_PROXY=1 npm run poc:proxy-check

# Terminal C — MF remote (required for nav + routes; do not also put them in package-root extensions.ts or the host registers them twice)
npm run poc:frontend

# Terminal D — odh-dashboard host with DEV_MODE + openshell flag
# Restart host after changing module-federation in this package.json (backend reads it at boot).
# Navigate to /openshell/sandboxes
```

**Auth (spike):** `AUTH_DISABLED=true` on `poc:bff`. Keep `authorize: false` on the `/_bff/openshell/api` proxy so the host does **not** inject the OpenShift user token — that token is invalid for the OpenShell gateway and causes `401 invalid token` / failed sandbox loads.
**Extensions:** Package-root `extensions.ts` stays empty (host-static). Area/nav/routes live only in the MF remote (`frontend/src/odh/extensions.ts`), same pattern as agent-ops.

## What this proves

| Spike | Proof |
|-------|--------|
| 81066 | Barrel imports from `openshell-dashboard/pages\|api\|components`; list→detail via `onViewSandbox` + controlled tabs; Query v5 local; React/PF(+router) shared |
| 81067 | Host proxy `/_bff/openshell/api` → `/api`; upstream BFF binary; healthz/readyz + workspaces **200** against live gateway |

**CSS:** Upstream [PR #25](https://github.com/Gkrumbach07/openshell-dashboard/pull/25) removed co-located package CSS; pages use PF props/utilities. No ODH sync or webpack remap needed. Third-party `@xterm/xterm/css/xterm.css` remains a consumer bundler concern when the terminal tab is enabled.

**Not in scope:** npm publish, cluster manifests, Cypress, terminal WebSockets, production auth-bridge.

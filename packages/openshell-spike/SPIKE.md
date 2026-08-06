# OpenShell dual spike — RHOAIENG-81066 + RHOAIENG-81067

Spike package on branch `RHOAIENG-81066/openshell-ui-mf`. **Not** a production Module Federation remote.

**Scaffold architecture (locked):** [FEDERATION-STRATEGY.md](./FEDERATION-STRATEGY.md)

Tickets:

- [RHOAIENG-81066](https://redhat.atlassian.net/browse/RHOAIENG-81066) — UI package consume in odh MF plugin
- [RHOAIENG-81067](https://redhat.atlassian.net/browse/RHOAIENG-81067) — BFF + gateway from odh-dashboard

Upstream:

- Repo: https://github.com/Gkrumbach07/openshell-dashboard
- Consume contract: [PR #10](https://github.com/Gkrumbach07/openshell-dashboard/pull/10) (merged) — `build:lib`, exports, host callbacks, `/readyz`
- Follow-ups merged after #10 that matter for odh: proxy-delegated auth (#12), API base path (#14)

Local clone used for this spike: `/Users/dareed/Dev/openshell-dashboard` (sibling of this worktree).

---

## How to re-run verification

```bash
# 1) Upstream lib build
cd /Users/dareed/Dev/openshell-dashboard/frontend
npm install && npm run build:lib

# 2) Consume proof (81066)
cd /Users/dareed/Dev/odh-fork-review/packages/openshell-spike
npm run verify

# 3) BFF binary (81067)
cd /Users/dareed/Dev/openshell-dashboard/backend
go build -o /tmp/openshell-bff ./cmd/server
AUTH_DISABLED=true PORT=18081 OPENSHELL_GATEWAY_URL=127.0.0.1:50051 /tmp/openshell-bff

# 4) Host-style proxy demo
cd /Users/dareed/Dev/odh-fork-review/packages/openshell-spike
OPENSHELL_BFF_URL=http://127.0.0.1:18081 npm run proxy:demo
# curl http://127.0.0.1:18080/_bff/openshell/api/v1/healthz
# curl http://127.0.0.1:18080/_bff/openshell/api/v1/readyz
```

---

## RHOAIENG-81066 — UI consume findings

### Documented consume path

1. Build upstream package: `npm run build:lib` in `openshell-dashboard/frontend` → `dist/` with barrels for `./pages`, `./components`, `./api`, `./types`, `./slots`.
2. Consume via **file/git path** until [npm publish #11](https://github.com/Gkrumbach07/openshell-dashboard/pull/11) lands (do not block scaffold on registry).
3. Proof in this package:
   - `scripts/verify-exports.mjs` — all five exports resolve to built JS + `.d.ts`
   - `src/consumePoc.ts` + `npm run verify:types` — TypeScript imports `SandboxListPage`, `SandboxDetailPage`, `setApiBasePath`, `setSessionExpiredHandler`, `AlertProvider`

### Shared dependency check

| Dependency | Upstream peer | odh host (`frontend/`) | mlflow frontend | Risk |
|------------|---------------|------------------------|-----------------|------|
| `react` / `react-dom` | `^18.3.1` | `^18.3.1` | `^18` | Low — align as MF singleton |
| `@patternfly/react-core` (+ icons/table) | `^6.2.0` (code-editor/log-viewer newer) | `6.4.x` | `^6.3.1` | Low–medium — PF6 compatible; pin shared singleton to host |
| `react-router-dom` | **`^6.30.0`** | **`^7.17.0`** | **`^7.16.0`** | **High** — major mismatch. Upstream pages still call `useNavigate` / `useSearchParams` as fallback. Prefer host-supplied callbacks (`onViewSandbox`, controlled tabs) and keep router as singleton **or** get upstream to peer `^6 \|\| ^7` |
| `@tanstack/react-query` | **`^5.59.0`** | **`^4.44.0`** | (not direct) | **High** — major mismatch. Duplicate QueryClient risk if both versions load. Scaffold must either bump host/module to v5 for OpenShell remote only (isolated QueryClient) or request upstream dual-support |

**Recommendation:** treat OpenShell remote’s React Query as **not** shared with host until versions align; share React + PatternFly as singletons; do **not** share `react-router-dom` until upstream peers v7 or odh standardizes.

### Host provider / callback inventory

| Need | Upstream surface | Host must supply |
|------|------------------|------------------|
| API prefix | `setApiBasePath(prefix)` — prefixes paths that already include `/api/v1/...` | Call with `/_bff/openshell` so browser hits `/_bff/openshell/api/v1/...` |
| Session expiry | `setSessionExpiredHandler(fn)` on 401 | Map to odh logout / session-expired UX (default is `window.location.reload`) |
| Alerts | `AlertProvider` / `useAlerts` (from `app/AlertContext`, re-exported via `./components`) | Wrap pages in `AlertProvider` (or re-export in odh wrapper) |
| List → detail nav | `SandboxListPage` `onViewSandbox?(name, tab?)` | Prefer callback; else page uses `useNavigate` |
| Detail tabs | `SandboxDetailPage` `activeTab` / `onTabChange` | Prefer controlled props; else `useSearchParams` |
| React Query | Pages use TanStack hooks | Provide `QueryClientProvider` with a client compatible with upstream v5 |
| Slots | `./slots` (`SlotProvider` / extension points) | Wire when cross-module triggers are needed (epic) |
| Login / dev session | `LoginPage` imports `setDevSession` from `app/authStore` | **Do not** use LoginPage in odh federated mode; host auth owns session |

### Blockers / remaining `app/` coupling

Still imported from pages/components into the published lib (included in `tsconfig.build.json`):

- **`../app/AlertContext`** — used widely; mitigated because `AlertProvider` is in `./components` export and `dist/app/` is emitted. Host can wrap with exported provider. Prefer upstream move to `./components` only (no `app/` path) for cleanliness.
- **`LoginPage` → `app/authStore`** — standalone/dev only; exclude from odh routes.
- **Role hooks** — `useUserRole` / `useWorkspaceRole` live under **`./api/rbac`** (good — not `app/`). They call gateway-backed APIs; fine behind auth.
- **Terminal WebSocket** — `SandboxTerminalTab` builds `ws://host/api/v1/.../terminal` (hardcoded `/api/v1`, not `apiBasePath`). **Blocker for federated proxy path** unless upstream uses `apiBasePath` for WS URLs (file follow-up upstream).

No separate upstream issues filed from this spike yet; recommend filing:

1. Peer `react-router-dom` for v6|v7 (or document “callbacks required in v7 hosts”).
2. Peer / document TanStack Query v5 vs host v4 isolation.
3. Terminal (and any absolute `/api/v1` WS) must honor `setApiBasePath`.

### Next scaffold story recommendation

| Item | Recommendation |
|------|----------------|
| Package name | `@odh-dashboard/openshell` under `packages/openshell/` |
| MF remote name | `openshell` |
| Local UI port | `9113` (avoids core-bff on `9112`) |
| Service port | `8943` |
| Host proxy | `path: /_bff/openshell/api` → `pathRewrite: /api` (mlflow-style `/_bff/…`) |
| Frontend constant | `BFF_API_PREFIX = '/_bff/openshell/api/v1'` for any host-owned fetch; upstream pages use `setApiBasePath('/_bff/openshell')` |
| Wrapper | Mirror `packages/mlflow/frontend/src/odh/MlflowWrapper.tsx`: providers + `setApiBasePath` + `setSessionExpiredHandler` + `AlertProvider` + QueryClient |
| Consume | Prefer published npm when #11 lands; until then `file:` / git submodule / vendored `dist` in CI |

---

## RHOAIENG-81067 — BFF + gateway findings

### Local BFF run

- Built: `go build -o /tmp/openshell-bff ./cmd/server` from upstream `backend/`.
- Ran with `AUTH_DISABLED=true`, `PORT=18081`, `OPENSHELL_GATEWAY_URL=127.0.0.1:50051` (no real gateway in this environment).

| Probe | Result |
|-------|--------|
| `GET /api/v1/healthz` | **200** `{"status":"ok"}` — liveness, no gateway |
| `GET /api/v1/readyz` | **503** `not_ready` / `gateway unreachable` — proves readiness checks gateway (expected without gateway) |
| `GET /api/v1/auth/config` | **200** — public bootstrap |

With a real gateway (`make dev-full` / `OPENSHELL_GATEWAY_URL` + optional `GATEWAY_CA_CERT`), `/api/v1/readyz` should return 200. This spike documents the **failure mode** and path layout when gateway is absent.

### Host-style proxy proven

Demo: `scripts/host-proxy-demo.mjs` rewrites `/_bff/openshell/api` → `/api` (same shape as odh [`backend/src/utils/proxy.ts`](../../backend/src/utils/proxy.ts) / mlflow `module-federation.proxy`).

| Probe via proxy | Result |
|-----------------|--------|
| `GET /_bff/openshell/api/v1/healthz` | **200** |
| `GET /_bff/openshell/api/v1/readyz` | **503** (gateway down — rewrite still correct) |

### Auth notes (auth-bridge follow-on)

Code today (post [#12](https://github.com/Gkrumbach07/openshell-dashboard/pull/12)) is **proxy-delegated auth**, not browser OIDC PKCE to the BFF:

- Default token header: **`x-forwarded-access-token`** (`AUTH_TOKEN_HEADER`)
- Default user header: **`x-auth-request-user`**
- BFF forwards that token to the gateway on gRPC calls
- `AUTH_DISABLED=true` is **dev only** — never for production odh

Verified:

| Call | Result |
|------|--------|
| `GET /api/v1/auth/whoami` without token (`AUTH_DISABLED=false`) | **401** `missing auth proxy token header` |
| Same with `x-forwarded-access-token` + `x-auth-request-user` | **200** identity (username fallback when gateway user RPC unavailable) |

**Alignment with odh:** mlflow/model-registry/agent-ops Deployments already use `--auth-token-header=x-forwarded-access-token` and empty prefix. Upstream OpenShell BFF defaults match that header name. Host `registerProxy` with `authorize: true` also stamps `Authorization: Bearer`, but OpenShell reads **`x-forwarded-access-token`**, which the host already forwards from oauth-proxy.

**Gaps for auth-bridge story:**

1. Confirm gateway accepts the **same** OpenShift/oauth-proxy access token OpenShell expects (OIDC subject/groups claims) — may need token exchange if issuers differ.
2. Ensure `x-auth-request-user` (or configure `AUTH_USER_HEADER` to whatever odh injects) is populated when needed for display fallback.
3. README still describes legacy browser OIDC PKCE — **stale vs code**; trust `backend/internal/auth/proxy.go` + flags.
4. WebSocket terminal upgrade through host proxy (feature flag off if proxy cannot upgrade).

### Packaging recommendation

**Prefer shipping the upstream BFF binary as the module Deployment container** (matches epic preference).

Rationale:

- Full gateway client + `/api/v1` surface + `/readyz` already exist; reimplementing in an odh-owned Go adapter duplicates work and drifts from upstream SDK migration (#2).
- Auth header defaults already match odh federated BFF convention.
- Image can be upstream multi-stage `make build` or odh Dockerfile that builds from upstream Go module.

Thin odh adapter only if gateway auth/token shape cannot be satisfied without odh-specific translation — treat as fallback after auth-bridge spike, not default.

### Follow-on packaging checklist

| Item | Suggestion |
|------|------------|
| Module image | Build upstream BFF (+ optional static UI assets) like `manifests/modules/mlflow/` |
| Host proxy | `/_bff/openshell/api` → `/api`, `authorize: true` |
| Env | `OPENSHELL_GATEWAY_URL`, `GATEWAY_CA_CERT`, `AUTH_DISABLED=false`, `AUTH_TOKEN_HEADER=x-forwarded-access-token`, feature flags as needed |
| Probes | liveness `/api/v1/healthz`, readiness `/api/v1/readyz` |
| NetworkPolicy | Allow host → openshell-ui Service; openshell-ui → gateway |
| Service port | `8943` (recommended; unused in current validate:ports) |

---

## Out of scope (confirmed)

- Full production module onboarding / Cypress / cluster manifests
- Removing `packages/agent-ops` (restored from upstream/main)
- Implementing production auth-bridge / token exchange (notes captured only)
- Blocking on npm publish #11

---

## Decision lock (scaffold)

Architecture choices for the production scaffold are locked in **[FEDERATION-STRATEGY.md](./FEDERATION-STRATEGY.md)**.

| Decision | Lock |
|----------|------|
| UI source | npm lib (git/file interim) |
| MF ownership | ODH `packages/openshell` adapter |
| BFF | Upstream binary/image as module Deployment |
| Proxy | `/_bff/openshell/api` → `/api` |
| Shared deps | React + PF (+ router for host wrappers); Query v5 local |
| Auth | Proxy-delegated; auth-bridge spike before GA |
| Terminal | Feature-gated until WS + `apiBasePath` fixed |

---

## Faithful POC (implemented) — `packages/openshell`

Replaces the agent-ops gut. See [`packages/openshell/README.md`](../openshell/README.md).

### AC evidence — RHOAIENG-81066

| AC | Evidence |
|----|----------|
| Documented consume path in odh federated package | `file:../../../../openshell-dashboard/frontend` + barrel imports in `OpenshellWrapper` / routes; `DEPLOYMENT_MODE=federated npm run build:prod` → `remoteEntry.js` |
| Shared dependency check | MF shares React, react-dom, react-router(-dom), PF; **does not** share `@tanstack/react-query` (v5 local) |
| Host provider/callback inventory | `AlertProvider`, `QueryClientProvider`, `setApiBasePath('/_bff/openshell')`, `setSessionExpiredHandler`, `onSelect` (name click) + `onViewSandbox` (tab actions), controlled `activeTab`/`onTabChange` |
| `app/` / packaging blockers | AlertContext still under `app/` in dist; **CSS not in `build:lib`** — run `packages/openshell` `npm run poc:sync-css` after each lib build (copies CSS into `dist/`); host static bundle also needs those files |
| Scaffold recommendation | Keep evolving [`packages/openshell`](../openshell/); feature flag `openshell` wired |

### AC evidence — RHOAIENG-81067

| AC | Evidence |
|----|----------|
| BFF + live gateway | `PORT=8943` + `OPENSHELL_GATEWAY_URL=127.0.0.1:17670` → `readyz` `{"status":"ready"}`, `GET /api/v1/workspaces` **200** with Active workspace |
| Host-style proxy | `/_bff/openshell/api` → `/api` via `scripts/host-proxy-demo.mjs`; `USE_HOST_PROXY=1 npm run poc:proxy-check` all **200** |
| Packaging recommendation | Prefer upstream BFF binary as module Deployment (unchanged); POC runs binary only, no in-tree Go |
| Auth notes | `AUTH_DISABLED=false`: whoami **401** without token; **200** with `x-forwarded-access-token` + `x-auth-request-user`. POC UI smoke may use `AUTH_DISABLED=true`. Gateway JWT acceptance of oauth-proxy tokens still **unproven** (auth-bridge) |

### Superseded gut POC

[`packages/agent-ops/SPIKE-POC.md`](../agent-ops/SPIKE-POC.md) — marked superseded; agent-ops restored from `upstream/main`.

# OpenShell POC — SUPERSEDED

The agent-ops gut POC is **superseded** by [`packages/openshell/`](../openshell/).

| Old (this doc) | New |
|----------------|-----|
| Gutted `agentOps` remote | Clean `openshell` MF package |
| Webpack aliases to narrow `dist` files | PR #10 `file:` + barrel imports |
| `/agent-ops` proxy | `/_bff/openshell/api` → `/api` |
| `WorkspaceListPage` only | `SandboxListPage` + `SandboxDetailPage` with host callbacks |

See:

- [`packages/openshell/README.md`](../openshell/README.md) — how to run
- [`packages/openshell-spike/SPIKE.md`](../openshell-spike/SPIKE.md) — AC evidence
- [`packages/openshell-spike/FEDERATION-STRATEGY.md`](../openshell-spike/FEDERATION-STRATEGY.md) — locked architecture

`packages/agent-ops` was restored from `upstream/main`. Do not re-gut it for OpenShell.

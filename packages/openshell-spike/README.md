# @odh-dashboard/openshell-spike

Local spike artifacts for **RHOAIENG-81066** (UI consume) and **RHOAIENG-81067** (BFF + gateway).

| Doc | Purpose |
|-----|---------|
| **[FEDERATION-STRATEGY.md](./FEDERATION-STRATEGY.md)** | Locked architecture for `packages/openshell` |
| **[SPIKE.md](./SPIKE.md)** | Findings + AC evidence |
| [packages/openshell README](../openshell/README.md) | Faithful MF POC (PR #10 consume path) |
| [agent-ops SPIKE-POC.md](../agent-ops/SPIKE-POC.md) | Superseded gut POC |

```bash
# Requires sibling clone: ../openshell-dashboard with frontend `npm run build:lib`
npm run verify
```

This package is **not** an MF remote. The federated POC remote is `@odh-dashboard/openshell`.

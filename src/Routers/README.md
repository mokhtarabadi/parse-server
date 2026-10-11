# src/Routers/

Promise-based REST routers, one per API area (`GlobalConfigRouter`,
`UsersRouter`, `FunctionsRouter`, …). Mounted by `src/ParseServer.ts`.

- Entry: each router extends `PromiseRouter` and defines `mountRoutes()`.
- Invariants: routers orchestrate controllers/adapters; they own no storage
  logic. `GlobalConfigRouter` serves `GET/PUT /config`; A/B evaluation is
  delegated to `src/Experiments/ExperimentsConfigResolver.js` (fail-open —
  any evaluation failure returns the plain global payload).

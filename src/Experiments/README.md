# Experiments (native A/B evaluation)

This directory adds per-user experiment evaluation to Parse Server WITHOUT
changing the global Config contract (`_GlobalConfig` row, identical payload).

- `ExperimentsEvaluator.js` — pure bucket/variant helpers (SHA-256 mod 100,
  widen-only stickiness, fail-closed). Test vectors: `vip_for_new_10` /
  `vftE0NKr0C` → 86, `NXqFcxQhF2` → 56, `exp-a` / `probe-user-001` → 60.
- Wired in `Routers/GlobalConfigRouter.js`: `GET /config?abEvaluate=true`
  with an authenticated user attaches `abEvaluated: [{key, variant}]`.
  Opt-in only (zero cost otherwise), master/anonymous unaffected, any failure
  falls back to the plain global payload. Old SDKs ignore the new field.

Rollback: delete this directory + revert the router hunk; the endpoint
behaves exactly like upstream.

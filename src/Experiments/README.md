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
  Evaluation runs through the shared `ExperimentsConfigResolver.js`
  (`resolveAbEvaluated`), the single code path for every read surface.
- Wired in `GraphQL/loaders/configQueries.js`: separate client-safe
  `clientConfig(paramName, abEvaluate = false)` query for authenticated
  users. The master-only `cloudConfig` query is byte-identical (no A/B
  path). `ConfigValue` gains a nullable `abEvaluated: [ExperimentVerdict]`
  field, null unless evaluated — old clients unaffected.
- Cloud Code needs no change: `@Config` routes to `/config`
  (`cloud-code/Parse.Cloud.js`), so it inherits the REST A/B path.
- Empty-signal contract: REST attaches `abEvaluated: []` when opted in but
  unevaluable (legacy shape); GraphQL returns `abEvaluated: null` unless
  evaluated. Clients must treat `[]` and `null` identically (no verdicts).

Rollback: delete `ExperimentsConfigResolver.js`, revert the router GET hunk
to call `evaluateAll` directly, remove `clientConfig` + `ExperimentVerdict`
from the loader, delete the four `*Ab*.spec.js` / `GraphQLClientConfig.spec.js`
specs. Every surface then behaves exactly like upstream.

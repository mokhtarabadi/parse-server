# src/Experiments/ DECISIONS

- 2026-10-11: Added shared `ExperimentsConfigResolver.js` so REST, GraphQL,
  and Cloud Code config reads evaluate through one fail-open path instead of
  per-surface copies. Evaluator stays pure (SHA-256 bucketing, fail-closed).
- 2026-10-11: O2 GraphQL design — separate `clientConfig` query; master-only
  `cloudConfig` frozen. Old clients see no shape change.
- 2026-10-11: PUT strips client-echoed `abEvaluated` so derived verdicts are
  never persisted into global params.

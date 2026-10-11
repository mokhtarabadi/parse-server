# src/Routers/ DECISIONS

- 2026-10-11: `GlobalConfigRouter` GET delegates A/B evaluation to the shared
  Experiments resolver with byte-identical behavior (same opt-in gating,
  same `users` lookup, same legacy `abEvaluated: []` fallback, same routes).

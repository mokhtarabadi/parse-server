# src/GraphQL/loaders/

Code-first GraphQL query/mutation builders, one file per area. Each exports
`load(parseGraphQLSchema)` plus its resolver functions for unit testing.

- `configQueries.js`: master-only `cloudConfig` (frozen, no A/B path) plus
  client-safe `clientConfig(paramName, abEvaluate)` served through the shared
  Experiments resolver. Shared `ConfigValue` type carries a nullable
  `abEvaluated: [ExperimentVerdict]` field (null unless evaluated).
- `configMutations.js`: `updateCloudConfig` delegates to
  `GlobalConfigRouter.updateGlobalConfig`; writes store plain params only.

# src/GraphQL/loaders/ DECISIONS

- 2026-10-11: O2 client query — new `clientConfig` instead of extending
  master-only `cloudConfig`, so dashboards and old clients see zero shape
  change. Auth required; master and opt-out get the plain global view.

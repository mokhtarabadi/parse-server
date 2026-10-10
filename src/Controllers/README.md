# src/Controllers/

Request and business-logic controllers (e.g. `DatabaseController`,
`UserController`, `SchemaController`).

- Entry: `index.js` re-exports the controllers.
- Invariants: controllers orchestrate adapters; they do not own transport or
  storage details. Keep per-controller behavior covered by `spec/` suites.

# src/

Server implementation root (CommonJS, Express 5).

- Entry surface: `src/ParseServer.js` (check exact filename when wiring new routes).
- Subareas: `Controllers/` (request/business logic), `Adapters/` (storage, cache,
  auth, push, pub/sub), `cloud-code/`, `GraphQL/`, `Routers/` (when present),
  `cli/` (bin definitions).
- Conventions: `docs/conventions.md` §2–§4. Never edit `lib/` (build output)
  or `src/vendor/` by hand.

# src/Adapters/

Swappable ports and adapters grouped by area: `Auth/`, `Cache/`, `Storage/`
(`Mongo/`, `Postgres/`), `Files/`, `Push/`, `PubSub/`, `Logger/`, `Email/`,
`MessageQueue/`, `WebSocketServer/`.

- Loader: `AdapterLoader.js` resolves adapter modules at startup.
- Invariants: each adapter honors its base interface (`*Adapter.js`); new
  adapters ship with a spec under `spec/` and a section in the area README.

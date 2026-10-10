# Conventions — parse-server

> Coding and workflow conventions bound to `AGENTS.md`. Keep minimal; expand
> only when a real task forces it.

## 1. Language & runtime

- Node.js + Express 5. Source lives in `src/` (CommonJS `require`), specs in
  `spec/` (Jasmine). Build output `lib/` is generated; never edit by hand.

## 2. Naming & layout

- One class/module per file; file name matches the export (`DatabaseController.js`
  exports `DatabaseController`).
- Adapters live under `src/Adapters/<Area>/`; controllers under `src/Controllers/`;
  CLI under `src/cli/`. New areas get their own directory + sibling docs (§6).

## 3. Style & lint

- ESLint is the gate (`eslint.config.js` at root and `spec/eslint.config.js`).
- Prettier (`.prettierrc`) for formatting. Match surrounding style in edited files.

## 4. Tests & verification

- Specs: `spec/**/*.spec.js` run via Jasmine (`npm test` invokes the suite).
- Every code change MUST be verified before claiming done; record the exact
  command, expected vs actual result, and exit code in the task file.

## 5. Commits & changelog

- Conventional Commits; releases via semantic-release (`.releaserc/`).
- User-facing changes update `CHANGELOG.md` / `changelogs/`; agent-structure
  changes note the date and scope only.

## 6. Folder docs

- When inspecting or editing inside a component directory, read its sibling
  `README.md` + `DECISIONS.md` first; update them when contracts or decisions change.
- Minimal scaffold per directory: purpose, public entry points, key invariants.

## 7. Safety

- ZAC holds: no `git add` / `commit` / `checkout` / `push` by the agent.
- Never touch parent dirs, `src/vendor/`, or `lib/`.

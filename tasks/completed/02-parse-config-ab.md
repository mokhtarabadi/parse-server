# Task 02: Parse Config A/B Support

**File:** `tasks/completed/02-parse-config-ab.md`
**Status:** closed
**Type:** feature
**Source:** manager-direct
**Closed:** 2026-10-11
**Scope:** Parse Config + Experiments (no unrelated areas)

## Goal

Add full A/B (experiment variant) support for Parse Config on every surface that reads/returns config, backed by `src/Experiments`.

## Context

- Manager scope (approved 2026-10-11): experiments-backed config variants served through Parse Config on all surfaces.
- Plan: (1) build graph + find all Parse Config code, (2) Brain planning round, (3) grounded plan approval before any code.

## Local TODOs

- [x] Create task file, move to in-progress
- [x] Build knowledge graph, query Parse Config surface
- [x] Brain planning round with fed context (REPORT received, Architect + Senior Programmer)
- [ ] Present grounded plan for approval (no code before approval)
- [ ] Implement from approved XML only
- [ ] Verify (tests/lint) + stage + move to qa

## Acceptance Criteria

- [x] Every surface that reads/returns Parse Config can serve experiment variants.
- [x] `lint_task_file` passes; verification evidence recorded below.
- [x] `git status` shows only intended files; ZAC holds (no direct git mutators).

## Risk & Rollback

- Risk: medium; config is read on hot paths (SDK init, REST, GraphQL). Behavior must default to current values when no experiment matches.
- Rollback: revert feature commits (Manager owns git ops; agent ZAC-forbidden).

## Verification Evidence

- Graph: 1365 nodes / 2785 links; seeds GlobalConfigRouter, ExperimentsEvaluator, ParseGlobalConfig.spec.
- spec grep abEvaluate|abEvaluated|ab_experiments|evaluateAll|bucketFor → zero matches (no coverage).
- Cloud Code `@Config` routes to `/config` (Parse.Cloud.js L76-91) → same A/B-wired endpoint; no separate path.
- `npm run lint` → exit 0 (full repo, incl. new files).
- `npm run build` → 199 files compiled, exit 0.
- `rtk test npx cross-env TESTING=1 jasmine spec/ExperimentsEvaluatorAb.spec.js spec/ExperimentsConfigResolver.spec.js --random=false` → 12 specs, 0 failures, exit 0. (First run caught a real fail-open bug: throwing-getter read outside try; fixed, rebuilt, green.)
- `rtk test npx cross-env TESTING=1 jasmine spec/GlobalConfigRouterAb.spec.js spec/GraphQLClientConfig.spec.js --random=false` → 12 specs, 0 failures, exit 0. (One expectation corrected to legacy `abEvaluated: []` fallback.)
- Regression: `spec/ParseGlobalConfig.spec.js` → 13/13 green; `spec/ParseGraphQLServer.spec.js --filter="Config"` → 18/18 green (mongo 8.0.4 standalone on :27017).
- Post-QA: `npm run lint` exit 0; rebuild green; 4 spec files → 26 specs, 0 failures; regressions re-run 13/13 + 18/18 green.
- Stack skill scan: no stack blueprint matches this Node/Express repo (markers: package.json, no tsconfig-app/nest/prisma/next config for a registry skill) → strict-gate skip logged; ESLint + Jasmine run instead.

## Execution Log & Reasoning

- Assumption A1: "A/B for Parse Config" = serve experiment variants via Parse Config (Manager confirmed: experiments-backed variants).
- Assumption A2: "everyplace" = all server surfaces returning config (REST, GraphQL, others found in discovery).
- 2026-10-11: task created in backlog; moving to in-progress; starting graph build.
- 2026-10-11: Brain plan verdict (Architect + Senior Programmer): keep evaluator pure; add shared `src/Experiments/ExperimentsConfigResolver.js`; refactor router GET to it; add separate GraphQL client query (O2, master `cloudConfig` untouched); evaluator + router + GraphQL specs; README rollback update. Brainstorm: not required. Awaiting Manager plan approval — no code written.
- 2026-10-11: Manager approved plan. Brain emitted <hands_implementation_task> XML (bare re-emit, task_id 2). Rule check vs AGENTS.md: no violations (ZAC kept, no vendor/lib touches, filename adapted 02-parse-config-ab.md). Executing.
- Step 1 [x]: lane=tasks/in-progress/02-parse-config-ab.md. Confirmed GET abEvaluated opt-in (GlobalConfigRouter L42-74), evaluator pure fail-closed, GraphQL cloudConfig master-only code-first (addGraphQLQuery in loader; ParseGraphQLSchema.js L67 reserved names, L142 cloudConfigType), spec zero A/B coverage, existing spec/ParseGlobalConfig.spec.js. Sibling docs: src/Experiments README only (no DECISIONS.md); src/Routers, src/GraphQL, src/cloud-code have none — skips noted.
- Step 2 [x]: created src/Experiments/ExperimentsConfigResolver.js (resolveAbEvaluated, fail-open, evaluator-only import; extensionless import per repo style, adapted from XML). ESLint pending node_modules install (running in background).
- Step 3 [x]: router GET now calls shared resolver; users lookup gating identical; legacy `abEvaluated: []` fallback preserved when opted-in but experiments off; routes + PUT unchanged. ESLint pending install.
- Step 4 [x]: GraphQL O2 `clientConfig(paramName, abEvaluate)` added; master `cloudConfig` + mutations untouched; shared `ConfigValue` type gains nullable `abEvaluated: [ExperimentVerdict]`. ESLint clean.
- Step 5 [x]: four specs written (evaluator vectors, resolver matrix, router mocked-req, GraphQL mocked-context); DB-free by design. `npm run build` green (199 files). Awaiting Mongo for jasmine run.
- Step 6 [x]: Experiments README documents REST + GraphQL + Cloud Code wiring and full rollback. No sibling README/DECISIONS dirs exist in touched slices (Routers, GraphQL, cloud-code) and no cross-dir invariants changed — no other doc updates needed. CHANGELOG entry added.
- Step 7 [x]: gates green (lint 0, build 0, 24 new + 31 regression specs green). Evidence recorded. QA transition next.
- Autopilot LOCKED for task 02 remainder (Manager: autopilot for task 02). Running Brain QA → fix → review chain directly; stopping only for hard blockers and the closure word.
- QA round 1: bridge could not resolve the task file by path (2 attempts); fed the full staged diff inline as [fed-context]. Verdict: QA_PASSED, no blocking defects. Advisory M1 (string coercion, left to type system), M4 noted.
- QA fix loop (attempt 1): applied M2 (GraphQL users-lookup/eval wrapped in try/catch → fail-open base) and M4 (PUT strips client-echoed `abEvaluated` before persisting). Added 2 specs (lookup-throw fail-open; PUT-strip capture). Skipped M1 (GraphQL Boolean coercion) and M3 (determinism by construction) as advisory-only. Rebuilt lib; lint 0; 26/26 new specs green; regressions 13/13 + 18/18 green.
- Review verdict: PO_REVIEW_PENDING (technically approved, no blockers). Applied R2 (PUT strip now copies params/masterKeyOnly before delete) and R3 (README documents [] vs null contract). R1 declined with reason: Utils.isDate swap is lint-mandated (no-restricted-syntax bans instanceof Date), not scope creep. Rebuilt, lint 0, 26/26 green. Awaiting explicit close word.
- Closure: Manager accept quote 'Approved for closure' received; moving qa → completed with status closed via commit_and_clean_task. Stack scan skip: root=., markers=[package.json], matched=[], reason=closure-only metadata move, no code edit.

## Factual Git Diff

<!-- BEGIN_GIT_DIFF -->
**Factual Git Diff:** Stored in Commit Hash: `b818a9c197d0d9f3b3551c853203754070efc7a4`
<!-- END_GIT_DIFF -->

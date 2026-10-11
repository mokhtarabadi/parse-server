# Task 001: A/B testing review follow-ups (resolver tests + wiring proof)

**File:** `tasks/completed/001-ab-testing-review-followups.md`
**Source:** manager
**Type:** improvement
**Status:** closed

## Goal

Harden the native A/B path that the code graph already confirms: evaluator, resolver, REST + GraphQL wiring, docs.

## Findings (verified via code graph, 854 nodes)

- `src/Experiments/ExperimentsEvaluator.js` (`evaluateAll`) + `src/Experiments/ExperimentsConfigResolver.js` (`resolveAbEvaluated`) + `src/Experiments/README.md`: IMPLEMENTED.
- Wired into `src/Routers/GlobalConfigRouter.js` (REST `GET /config?abEvaluate=true`) and `src/GraphQL/loaders/configQueries.js` (`clientConfig`, `cloudConfig` untouched, `load`).
- Open: graph shows NO test files under `src/Experiments/` — kill-switch, master/opt-out, fail-open, and bucket vectors (86/56/60) have no automated proof in this repo.

## Local TODOs

- [x] Add unit tests for evaluator vectors + resolver gates (kill, master user, anonymous/opt-out, unreadable config fail-open)
- [x] Prove `PUT /config` strips any client-echoed evaluated field and never persists it
- [x] Confirm default fetch path is byte-identical to upstream (zero perf/regression risk)

## Acceptance Criteria

- [x] New Experiments tests green; vectors match Android/cloud mirrors (86/56/60)
- [x] Opt-in, master, anonymous, and failure paths all covered

## Verification Evidence

- **Test command:** `rtk test npx cross-env TESTING=1 jasmine spec/ExperimentsEvaluatorAb.spec.js spec/ExperimentsConfigResolver.spec.js spec/GlobalConfigRouterAb.spec.js spec/GraphQLClientConfig.spec.js --random=false`
- **Actual result:** 26 specs, 0 failures (mongo 8.0.4 standalone :27017)
- **Exit code:** 0
- **Regression:** `spec/ParseGlobalConfig.spec.js` 13/13 green; `spec/ParseGraphQLServer.spec.js --filter="Config"` 18/18 green.
- Vectors 86/56/60 asserted at `spec/ExperimentsEvaluatorAb.spec.js:12-14`.

## Risk & Rollback

- **Risk:** resolver regression breaks standard Config fetch
- **Rollback plan:** delete `src/Experiments/`, revert router hunk; endpoint behaves like upstream

## Execution Log & Reasoning

- 2026-10-11: picked up from backlog. Finding: every TODO was already satisfied by task-02 specs (no new code written — verification-only). TODO1 → `spec/ExperimentsEvaluatorAb.spec.js` (vectors, kill, fail-close) + `spec/ExperimentsConfigResolver.spec.js` (7-case fail-open matrix: opt-out, flag-off, master, anonymous, absent, throw, matrix). TODO2 → `spec/GlobalConfigRouterAb.spec.js` "never persists client-echoed abEvaluated". TODO3 → fresh re-run: 26/26 + 13/13 + 18/18 green. No duplication created.
- Brain QA: QA_PASSED (verification-without-code accepted; zero source edits, no new risk; coverage claims confirmed).
- Brain review: PO_REVIEW_PENDING (technically approved; I1/I2 low, no blockers; R1 keep verification-only).
- Closure: Manager accept quote 'Approved for closure' received; moving qa → completed via commit_and_clean_task.

## Factual Git Diff

<!-- BEGIN_GIT_DIFF -->
**Factual Git Diff:** Stored in Commit Hash: `47c70756cd54541f6e05017f8a523be630940015`
<!-- END_GIT_DIFF -->

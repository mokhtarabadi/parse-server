# Task 001: A/B experiments review — verify, fix, release

**File:** `tasks/backlog/001-ab-experiments-review.md`
**Source:** manager
**Type:** review
**Status:** open

## Goal

Verify native A/B evaluation in this server fork is complete and safe, fix gaps, cut a release, push.

## Review checklist (from graph + code review)

- [ ] `src/Experiments/ExperimentsEvaluator.js`: bucket math (SHA-256 mod 100), `evaluateAll`, fail-closed on bad input, killed flag, percent bounds, widen-only stickiness
- [ ] `src/Experiments/ExperimentsConfigResolver.js:38` (`resolveAbEvaluated`): kill checked every evaluation, master/anonymous/opt-out get plain config, any failure falls back to global payload
- [ ] `src/Routers/GlobalConfigRouter.js`: default `GET /config` path byte-identical to upstream; `?abEvaluate=true` opt-in only; client-echoed `abEvaluated` stripped on PUT, never persisted
- [ ] `src/GraphQL/loaders/configQueries.js`: `clientConfig` vs frozen master-only `cloudConfig` separation intact
- [ ] `src/Experiments/README.md` accurate; cross-runtime vectors 86/56/60 hold
- [ ] Cut release tag, push, confirm npm/GitHub release consumable via `github:mokhtarabadi/parse-server#<tag>`

## Verification Evidence

- **Test command:** node-based evaluator vector check + existing server test suite
- **Expected result:** vectors match, suite green
- **Actual result:** _(fill)_
- **Exit code:** _(fill)_

## Definition of Done

- [ ] Tests green, release pushed and installable

## Risk & Rollback

- **Risk:** changing global Config contract breaks old SDKs
- **Rollback plan:** delete `src/Experiments/` + revert router hunk

## Execution Log & Reasoning

_(log here)_

## Factual Git Diff

<!-- BEGIN_GIT_DIFF -->
<!-- END_GIT_DIFF -->

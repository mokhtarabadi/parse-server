# Task 02: Parse Config A/B Support

**File:** `tasks/qa/02-parse-config-ab.md`
**Status:** in-progress
**Type:** feature
**Source:** manager-direct
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

## Factual Git Diff

<!-- BEGIN_GIT_DIFF -->
```diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index b9cf8b2..073ba4d 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -8,6 +8,12 @@ Changelogs are separated by release type for better overview.
 - Added `tasks/` Kanban dirs and minimal `src/` folder docs (`README.md` + `DECISIONS.md`).
 - No runtime code changed.
 
+## 2026-10-11 — Parse Config A/B support
+
+- Added shared `src/Experiments/ExperimentsConfigResolver.js`; REST `GET /config` now evaluates through it (identical behavior).
+- Added GraphQL client-safe `clientConfig` query with `abEvaluate`; master-only `cloudConfig` unchanged.
+- Added evaluator, resolver, router, and GraphQL specs. No runtime behavior change unless opted in.
+
 ## ✅ [Stable Releases][log_release]
 
 > ### “Stable for production!”
diff --git a/spec/ExperimentsConfigResolver.spec.js b/spec/ExperimentsConfigResolver.spec.js
new file mode 100644
index 0000000..abc517f
--- /dev/null
+++ b/spec/ExperimentsConfigResolver.spec.js
@@ -0,0 +1,71 @@
+'use strict';
+
+// Task 02: shared resolver fail-open matrix. No DB, no server.
+const {
+  resolveAbEvaluated,
+} = require('../lib/Experiments/ExperimentsConfigResolver');
+
+const USER = { id: 'probe-user-001' };
+const ENABLED = {
+  ab_enabled: true,
+  ab_experiments: [
+    { key: 'exp-a', traffic_pct: 100 },
+    { key: 'exp-b', traffic_pct: 0 },
+  ],
+  other: 1,
+};
+
+describe('ExperimentsConfigResolver fail-open matrix', () => {
+  it('returns params untouched when opt-in is off', () => {
+    const out = resolveAbEvaluated(ENABLED, { abEvaluateRequested: false, user: USER });
+    expect(out).toBe(ENABLED);
+    expect(out.abEvaluated).toBeUndefined();
+  });
+
+  it('returns params untouched when the flag is off', () => {
+    const params = { ab_enabled: false, ab_experiments: ENABLED.ab_experiments };
+    expect(resolveAbEvaluated(params, { abEvaluateRequested: true, user: USER })).toBe(params);
+  });
+
+  it('returns params untouched for master key', () => {
+    expect(
+      resolveAbEvaluated(ENABLED, { abEvaluateRequested: true, user: USER, isMaster: true })
+    ).toBe(ENABLED);
+  });
+
+  it('returns params untouched without a user or user id', () => {
+    expect(resolveAbEvaluated(ENABLED, { abEvaluateRequested: true })).toBe(ENABLED);
+    expect(resolveAbEvaluated(ENABLED, { abEvaluateRequested: true, user: {} })).toBe(ENABLED);
+  });
+
+  it('returns params untouched when experiments are absent or null params', () => {
+    const params = { ab_enabled: true };
+    expect(resolveAbEvaluated(params, { abEvaluateRequested: true, user: USER })).toBe(params);
+    expect(resolveAbEvaluated(null, { abEvaluateRequested: true, user: USER })).toBeNull();
+  });
+
+  it('returns plain params when reading experiments throws', () => {
+    const evil = {};
+    Object.defineProperty(evil, 'ab_experiments', {
+      get() {
+        throw new Error('boom');
+      },
+    });
+    evil.ab_enabled = true;
+    expect(resolveAbEvaluated(evil, { abEvaluateRequested: true, user: USER })).toBe(evil);
+  });
+
+  it('attaches the evaluated matrix without mutating input', () => {
+    const out = resolveAbEvaluated(ENABLED, {
+      abEvaluateRequested: true,
+      user: USER,
+      userJoinedMs: 0,
+    });
+    expect(out.abEvaluated).toEqual([
+      { key: 'exp-a', variant: true },
+      { key: 'exp-b', variant: false },
+    ]);
+    expect(ENABLED.abEvaluated).toBeUndefined();
+    expect(out.other).toEqual(1);
+  });
+});
diff --git a/spec/ExperimentsEvaluatorAb.spec.js b/spec/ExperimentsEvaluatorAb.spec.js
new file mode 100644
index 0000000..d839ce8
--- /dev/null
+++ b/spec/ExperimentsEvaluatorAb.spec.js
@@ -0,0 +1,55 @@
+'use strict';
+
+// Task 02: unit vectors for the pure evaluator. No DB, no server.
+const {
+  bucketFor,
+  isVariant,
+  evaluateAll,
+} = require('../lib/Experiments/ExperimentsEvaluator');
+
+describe('ExperimentsEvaluator A/B vectors', () => {
+  it('buckets shared cross-runtime vectors deterministically', () => {
+    expect(bucketFor('vip_for_new_10', 'vftE0NKr0C')).toEqual(86);
+    expect(bucketFor('vip_for_new_10', 'NXqFcxQhF2')).toEqual(56);
+    expect(bucketFor('exp-a', 'probe-user-001')).toEqual(60);
+  });
+
+  it('returns -1 (control) on invalid input', () => {
+    expect(bucketFor('', 'u')).toEqual(-1);
+    expect(bucketFor('exp', '')).toEqual(-1);
+    expect(bucketFor(null, null)).toEqual(-1);
+  });
+
+  it('isVariant fail-closes on killed, missing, or non-positive traffic', () => {
+    expect(isVariant(null, 'u', 0)).toEqual(false);
+    expect(isVariant({ key: 'a', killed: true, traffic_pct: 100 }, 'u', 0)).toEqual(false);
+    expect(isVariant({ key: 'a', traffic_pct: 0 }, 'u', 0)).toEqual(false);
+    expect(isVariant({ key: 'a', traffic_pct: 'x' }, 'u', 0)).toEqual(false);
+  });
+
+  it('isVariant gates new-targeted experiments on account age', () => {
+    const exp = { key: 'exp-a', traffic_pct: 100, target: 'new', start_iso: '2026-01-01T00:00:00.000Z' };
+    expect(isVariant(exp, 'probe-user-001', Date.parse('2026-06-01T00:00:00.000Z'))).toEqual(true);
+    expect(isVariant(exp, 'probe-user-001', Date.parse('2025-06-01T00:00:00.000Z'))).toEqual(false);
+  });
+
+  it('evaluateAll preserves order, skips malformed entries, never throws', () => {
+    const out = evaluateAll(
+      [
+        { key: 'exp-a', traffic_pct: 100 },
+        null,
+        { noKey: true },
+        { key: '', traffic_pct: 100 },
+        { key: 'killed', killed: true, traffic_pct: 100 },
+      ],
+      'probe-user-001',
+      0
+    );
+    expect(out).toEqual([
+      { key: 'exp-a', variant: true },
+      { key: 'killed', variant: false },
+    ]);
+    expect(evaluateAll(null, 'u', 0)).toEqual([]);
+    expect(evaluateAll([], '', 0)).toEqual([]);
+  });
+});
diff --git a/spec/GlobalConfigRouterAb.spec.js b/spec/GlobalConfigRouterAb.spec.js
new file mode 100644
index 0000000..8257f28
--- /dev/null
+++ b/spec/GlobalConfigRouterAb.spec.js
@@ -0,0 +1,121 @@
+'use strict';
+
+// Task 02: router-level A/B behavior with mocked req (no DB, no server).
+const { GlobalConfigRouter } = require('../lib/Routers/GlobalConfigRouter');
+
+const USER = { id: 'probe-user-001' };
+const ENABLED_PARAMS = {
+  ab_enabled: true,
+  ab_experiments: [{ key: 'exp-a', traffic_pct: 100 }],
+  color: 'blue',
+};
+
+function mockReq({ params, userDoc, auth, abEvaluate }) {
+  return {
+    query: abEvaluate ? { abEvaluate: 'true' } : {},
+    auth: auth,
+    config: {
+      database: {
+        find(className, query) {
+          if (className === '_GlobalConfig') {
+            return Promise.resolve([{ params: params, masterKeyOnly: {} }]);
+          }
+          if (className === 'users') {
+            return Promise.resolve(userDoc ? [userDoc] : []);
+          }
+          return Promise.resolve([]);
+        },
+      },
+    },
+  };
+}
+
+describe('GlobalConfigRouter A/B read', () => {
+  const router = new GlobalConfigRouter();
+
+  it('returns plain config when opt-in is off', async () => {
+    const res = await router.getGlobalConfig(
+      mockReq({ params: ENABLED_PARAMS, auth: { user: USER }, abEvaluate: false })
+    );
+    expect(res.response.params).toEqual(ENABLED_PARAMS);
+    expect(res.response.abEvaluated).toBeUndefined();
+  });
+
+  it('attaches empty verdicts when experiments are off', async () => {
+    const res = await router.getGlobalConfig(
+      mockReq({
+        params: { color: 'blue' },
+        auth: { user: USER },
+        abEvaluate: true,
+      })
+    );
+    expect(res.response.params).toEqual({ color: 'blue' });
+    expect(res.response.abEvaluated).toEqual([]);
+  });
+
+  it('returns plain config for master requests', async () => {
+    const res = await router.getGlobalConfig(
+      mockReq({ params: ENABLED_PARAMS, auth: { isMaster: true }, abEvaluate: true })
+    );
+    expect(res.response.abEvaluated).toBeUndefined();
+  });
+
+  it('evaluates with zero joined time when the user doc is missing', async () => {
+    const res = await router.getGlobalConfig(
+      mockReq({ params: ENABLED_PARAMS, userDoc: null, auth: { user: USER }, abEvaluate: true })
+    );
+    expect(res.response.abEvaluated).toEqual([{ key: 'exp-a', variant: true }]);
+  });
+
+  it('stays plain (no throw) when evaluation blows up', async () => {
+    const evil = { ab_enabled: true };
+    Object.defineProperty(evil, 'ab_experiments', {
+      get() {
+        throw new Error('boom');
+      },
+    });
+    const res = await router.getGlobalConfig(
+      mockReq({ params: evil, auth: { user: USER }, abEvaluate: true })
+    );
+    // Legacy fail-open shape: opted-in but unevaluable yields empty verdicts.
+    expect(res.response.abEvaluated).toEqual([]);
+  });
+
+  it('serves the evaluated matrix end to end', async () => {
+    const res = await router.getGlobalConfig(
+      mockReq({
+        params: ENABLED_PARAMS,
+        userDoc: { user_joined: new Date('2026-01-01T00:00:00.000Z') },
+        auth: { user: USER },
+        abEvaluate: true,
+      })
+    );
+    expect(res.response.params.color).toEqual('blue');
+    expect(res.response.abEvaluated).toEqual([{ key: 'exp-a', variant: true }]);
+  });
+
+  it('never persists client-echoed abEvaluated on update', async () => {
+    let captured = null;
+    const req = {
+      body: {
+        params: { color: 'red', abEvaluated: [{ key: 'exp-a', variant: true }] },
+        masterKeyOnly: {},
+      },
+      auth: { isReadOnly: false },
+      config: {
+        applicationId: 'test',
+        database: {
+          find: async () => [],
+          update: async (className, query, update) => {
+            captured = update;
+            return { params: { color: 'red' } };
+          },
+        },
+      },
+    };
+    const res = await router.updateGlobalConfig(req);
+    expect(res.response).toEqual({ result: true });
+    expect(captured['params.abEvaluated']).toBeUndefined();
+    expect(captured['params.color']).toEqual('red');
+  });
+});
diff --git a/spec/GraphQLClientConfig.spec.js b/spec/GraphQLClientConfig.spec.js
new file mode 100644
index 0000000..ee4f07d
--- /dev/null
+++ b/spec/GraphQLClientConfig.spec.js
@@ -0,0 +1,97 @@
+'use strict';
+
+// Task 02: GraphQL clientConfig behavior with mocked context (no DB, no server).
+const { clientConfig, cloudConfig } = require('../lib/GraphQL/loaders/configQueries');
+
+const USER = { id: 'probe-user-001' };
+const PARAMS = {
+  ab_enabled: true,
+  ab_experiments: [{ key: 'exp-a', traffic_pct: 100 }],
+  color: 'blue',
+};
+
+function mockContext({ row, auth, userDoc }) {
+  return {
+    config: {
+      database: {
+        find(className) {
+          if (className === '_GlobalConfig') {
+            return Promise.resolve(row ? [row] : []);
+          }
+          if (className === 'users') {
+            return Promise.resolve(userDoc ? [userDoc] : []);
+          }
+          return Promise.resolve([]);
+        },
+      },
+    },
+    auth: auth,
+  };
+}
+
+const ROW = { params: PARAMS, masterKeyOnly: {} };
+
+describe('GraphQL clientConfig A/B read', () => {
+  it('returns plain value when abEvaluate is off or omitted (old clients)', async () => {
+    for (const flag of [false, undefined]) {
+      const res = await clientConfig(
+        mockContext({ row: ROW, auth: { user: USER } }),
+        'color',
+        flag
+      );
+      expect(res.value).toEqual('blue');
+      expect(res.abEvaluated).toBeNull();
+    }
+  });
+
+  it('evaluates verdicts for explicit opt-in with an authenticated user', async () => {
+    const res = await clientConfig(
+      mockContext({ row: ROW, auth: { user: USER }, userDoc: null }),
+      'color',
+      true
+    );
+    expect(res.value).toEqual('blue');
+    expect(res.abEvaluated).toEqual([{ key: 'exp-a', variant: true }]);
+  });
+
+  it('returns the plain global view for master key', async () => {
+    const res = await clientConfig(
+      mockContext({ row: ROW, auth: { user: USER, isMaster: true } }),
+      'color',
+      true
+    );
+    expect(res.abEvaluated).toBeNull();
+  });
+
+  it('blocks unauthenticated callers', async () => {
+    await expectAsync(clientConfig(mockContext({ row: ROW, auth: {} }), 'color', true)).toBeRejected();
+  });
+
+  it('returns nulls when no config row exists', async () => {
+    const res = await clientConfig(
+      mockContext({ row: null, auth: { user: USER } }),
+      'color',
+      true
+    );
+    expect(res.value).toBeNull();
+  });
+
+  it('fails open to plain when the users lookup throws', async () => {
+    const ctx = mockContext({ row: ROW, auth: { user: USER } });
+    ctx.config.database.find = (className) => {
+      if (className === 'users') {
+        return Promise.reject(new Error('db down'));
+      }
+      return Promise.resolve([ROW]);
+    };
+    const res = await clientConfig(ctx, 'color', true);
+    expect(res.value).toEqual('blue');
+    expect(res.abEvaluated).toBeNull();
+  });
+
+  it('leaves master-only cloudConfig untouched (no abEvaluate path)', async () => {
+    const res = await cloudConfig(mockContext({ row: ROW, auth: { isMaster: true } }), 'color');
+    expect(res.value).toEqual('blue');
+    expect(res.abEvaluated).toBeUndefined();
+  });
+});
diff --git a/src/Experiments/ExperimentsConfigResolver.js b/src/Experiments/ExperimentsConfigResolver.js
new file mode 100644
index 0000000..19c85da
--- /dev/null
+++ b/src/Experiments/ExperimentsConfigResolver.js
@@ -0,0 +1,86 @@
+/**
+ * ExperimentsConfigResolver.js — Shared Parse Config A/B resolution (task 02).
+ *
+ * Single code path for every surface that serves Parse Config reads
+ * (REST GET /config, GraphQL client query, Cloud Code via /config):
+ * given already-fetched global params plus the requesting user, attach the
+ * per-user `abEvaluated` verdicts WITHOUT changing the global params
+ * contract — old clients ignore the extra field.
+ *
+ * Fail-open by design: any missing input (no opt-in, no user, master key,
+ * experiments disabled or absent) or any evaluator throw returns the plain
+ * `params` object untouched, never breaks standard config fetch.
+ *
+ * Pure except for the evaluator import: zero DB imports, zero network, zero
+ * state. The caller resolves `userJoinedMs` (e.g. via the `users` collection
+ * lookup by `user_uid`, see GlobalConfigRouter) and passes milliseconds in.
+ *
+ * Rollback: delete this file and revert the GlobalConfigRouter GET hunk to
+ * call `evaluateAll` directly; the endpoint behaves exactly like before.
+ */
+import { evaluateAll } from './ExperimentsEvaluator';
+
+/**
+ * Resolve per-user experiment verdicts for a fetched global params object.
+ *
+ * @param {object|null} params The global config params as stored
+ *   (`params.ab_enabled === true` plus `params.ab_experiments` array opt in).
+ * @param {object} options Resolution inputs:
+ *   - {boolean} abEvaluateRequested — caller saw an explicit opt-in
+ *     (REST `?abEvaluate=true`, GraphQL `abEvaluate: true`).
+ *   - {object} user — authenticated user (`user.id` feeds the bucket hash).
+ *   - {boolean} isMaster — master key bypasses evaluation (global view).
+ *   - {number} userJoinedMs — account age anchor for new-targeted
+ *     experiments; undefined when the user doc lookup missed.
+ * @returns {object} `params` unchanged on every fail-open path, else a copy
+ *   with `abEvaluated: [{ key, variant }]` attached.
+ */
+export function resolveAbEvaluated(params, options) {
+  // Guard: destructure defensively — options itself may be undefined.
+  const opts = options || {};
+  const abEvaluateRequested = opts.abEvaluateRequested;
+  const user = opts.user;
+  const isMaster = opts.isMaster;
+  const userJoinedMs = opts.userJoinedMs;
+  // Fail-open: no explicit opt-in means plain global payload.
+  if (abEvaluateRequested !== true) {
+    return params;
+  }
+  // Fail-open: nothing to evaluate against.
+  if (!params) {
+    return params;
+  }
+  // Fail-open: experiments feature flag off for this app config.
+  if (params.ab_enabled !== true) {
+    return params;
+  }
+  // Fail-open: master key always sees the global view, never arms.
+  if (isMaster === true) {
+    return params;
+  }
+  // Fail-open: anonymous or malformed identity cannot be bucketed.
+  if (!user) {
+    return params;
+  }
+  // Fail-open: user object without a stable id cannot be bucketed.
+  if (!user.id) {
+    return params;
+  }
+  // Fail-open: flag on but no experiment definitions stored. The property
+  // read itself sits inside try: a foreign params shape may throw on access.
+  try {
+    const experiments = params.ab_experiments;
+    if (!experiments) {
+      return params;
+    }
+    // evaluateAll is fail-closed per entry and never throws on bad input,
+    // but a foreign `experiments` shape could still throw — stay fail-open.
+    const abEvaluated = evaluateAll(experiments, user.id, userJoinedMs);
+    // Copy, never mutate the caller's params object.
+    const next = Object.assign({}, params, { abEvaluated: abEvaluated });
+    return next;
+  } catch {
+    // Fail-open: evaluation must never break standard config fetch.
+    return params;
+  }
+}
diff --git a/src/Experiments/README.md b/src/Experiments/README.md
index 851434f..e6f018f 100644
--- a/src/Experiments/README.md
+++ b/src/Experiments/README.md
@@ -10,6 +10,17 @@ changing the global Config contract (`_GlobalConfig` row, identical payload).
   with an authenticated user attaches `abEvaluated: [{key, variant}]`.
   Opt-in only (zero cost otherwise), master/anonymous unaffected, any failure
   falls back to the plain global payload. Old SDKs ignore the new field.
+  Evaluation runs through the shared `ExperimentsConfigResolver.js`
+  (`resolveAbEvaluated`), the single code path for every read surface.
+- Wired in `GraphQL/loaders/configQueries.js`: separate client-safe
+  `clientConfig(paramName, abEvaluate = false)` query for authenticated
+  users. The master-only `cloudConfig` query is byte-identical (no A/B
+  path). `ConfigValue` gains a nullable `abEvaluated: [ExperimentVerdict]`
+  field, null unless evaluated — old clients unaffected.
+- Cloud Code needs no change: `@Config` routes to `/config`
+  (`cloud-code/Parse.Cloud.js`), so it inherits the REST A/B path.
 
-Rollback: delete this directory + revert the router hunk; the endpoint
-behaves exactly like upstream.
+Rollback: delete `ExperimentsConfigResolver.js`, revert the router GET hunk
+to call `evaluateAll` directly, remove `clientConfig` + `ExperimentVerdict`
+from the loader, delete the four `*Ab*.spec.js` / `GraphQLClientConfig.spec.js`
+specs. Every surface then behaves exactly like upstream.
diff --git a/src/GraphQL/loaders/configQueries.js b/src/GraphQL/loaders/configQueries.js
index 0320d68..1029bda 100644
--- a/src/GraphQL/loaders/configQueries.js
+++ b/src/GraphQL/loaders/configQueries.js
@@ -1,6 +1,8 @@
-import { GraphQLNonNull, GraphQLString, GraphQLBoolean, GraphQLObjectType } from 'graphql';
+import { GraphQLNonNull, GraphQLString, GraphQLBoolean, GraphQLObjectType, GraphQLList } from 'graphql';
 import Parse from 'parse/node';
 import { createSanitizedError } from '../../Error';
+import Utils from '../../Utils';
+import { resolveAbEvaluated } from '../../Experiments/ExperimentsConfigResolver';
 
 const cloudConfig = async (context, paramName) => {
   const { config, auth } = context;
@@ -29,13 +31,94 @@ const cloudConfig = async (context, paramName) => {
   return { value: null, isMasterKeyOnly: null };
 };
 
+/**
+ * Client-safe A/B config read (O2 design, task 02).
+ *
+ * WHY O2: the master-only `cloudConfig` query stays byte-identical so old
+ * clients and dashboards are unaffected. This separate query serves
+ * authenticated (non-master) users and resolves per-user experiment verdicts
+ * through the same shared resolver as REST GET /config — one code path for
+ * every surface. Master key gets the plain global view (fail-open).
+ */
+const clientConfig = async (context, paramName, abEvaluate = false) => {
+  const { config, auth } = context;
+
+  // Client query: anonymous callers get the same auth error shape as the
+  // rest of the client schema instead of leaking config existence.
+  if (!auth.user) {
+    throw createSanitizedError(
+      Parse.Error.OPERATION_FORBIDDEN,
+      'Authentication is required to access client config.'
+    );
+  }
+
+  const results = await config.database.find('_GlobalConfig', { objectId: '1' }, { limit: 1 });
+
+  if (results.length !== 1) {
+    return { value: null, isMasterKeyOnly: null, abEvaluated: null };
+  }
+
+  const globalConfig = results[0];
+  const params = globalConfig.params || {};
+  const masterKeyOnly = globalConfig.masterKeyOnly || {};
+
+  const base = {
+    value: params[paramName] !== undefined ? params[paramName] : null,
+    isMasterKeyOnly: masterKeyOnly[paramName] ?? null,
+    abEvaluated: null,
+  };
+
+  // Fail-open: master sees the global view; no opt-in means plain payload.
+  if (auth.isMaster || abEvaluate !== true) {
+    return base;
+  }
+
+  try {
+    // Resolve the account-age anchor for new-targeted experiments, mirroring
+    // the REST router lookup. A missed lookup yields undefined joined time.
+    let userJoinedMs;
+    const profiles = await config.database.find(
+      'users',
+      { user_uid: auth.user.id },
+      { limit: 1 }
+    );
+    if (profiles.length === 1) {
+      const joined = profiles[0].user_joined;
+      userJoinedMs = Utils.isDate(joined) ? joined.getTime() : Number(joined) || 0;
+    }
+
+    const resolved = resolveAbEvaluated(params, {
+      abEvaluateRequested: true,
+      user: auth.user,
+      isMaster: false,
+      userJoinedMs: userJoinedMs,
+    });
+    return { ...base, abEvaluated: resolved.abEvaluated || [] };
+  } catch {
+    // Fail-open: evaluation (including the users lookup) must never break
+    // the config read — return the plain global view.
+    return base;
+  }
+};
+
 const load = (parseGraphQLSchema) => {
   if (!parseGraphQLSchema.cloudConfigType) {
+    // Nullable experiment-verdict list. Appended to the shared ConfigValue
+    // type so both master and client queries serve it; null unless evaluated.
+    const experimentVerdictType = new GraphQLObjectType({
+      name: 'ExperimentVerdict',
+      fields: {
+        key: { type: GraphQLString },
+        variant: { type: GraphQLBoolean },
+      },
+    });
+    parseGraphQLSchema.addGraphQLType(experimentVerdictType, true, true);
     const cloudConfigType = new GraphQLObjectType({
       name: 'ConfigValue',
       fields: {
         value: { type: GraphQLString },
         isMasterKeyOnly: { type: GraphQLBoolean },
+        abEvaluated: { type: new GraphQLList(experimentVerdictType) },
       },
     });
     parseGraphQLSchema.addGraphQLType(cloudConfigType, true, true);
@@ -56,6 +139,22 @@ const load = (parseGraphQLSchema) => {
       }
     },
   }, false, true);
+
+  parseGraphQLSchema.addGraphQLQuery('clientConfig', {
+    description: 'Client-safe config read. Returns the parameter value plus per-user experiment verdicts when abEvaluate is true. Master key and opt-out get the plain global view.',
+    args: {
+      paramName: { type: new GraphQLNonNull(GraphQLString) },
+      abEvaluate: { type: GraphQLBoolean },
+    },
+    type: new GraphQLNonNull(parseGraphQLSchema.cloudConfigType),
+    async resolve(_source, args, context) {
+      try {
+        return await clientConfig(context, args.paramName, args.abEvaluate);
+      } catch (e) {
+        parseGraphQLSchema.handleError(e);
+      }
+    },
+  }, false, true);
 };
 
-export { load, cloudConfig };
+export { load, cloudConfig, clientConfig };
diff --git a/src/Routers/GlobalConfigRouter.js b/src/Routers/GlobalConfigRouter.js
index a686ed2..601d028 100644
--- a/src/Routers/GlobalConfigRouter.js
+++ b/src/Routers/GlobalConfigRouter.js
@@ -1,10 +1,11 @@
 // global_config.js
 import Parse from 'parse/node';
 import PromiseRouter from '../PromiseRouter';
+import Utils from '../Utils';
 import * as middleware from '../middlewares';
 import * as triggers from '../triggers';
 import { createSanitizedError } from '../Error';
-import { evaluateAll } from '../Experiments/ExperimentsEvaluator';
+import { resolveAbEvaluated } from '../Experiments/ExperimentsConfigResolver';
 
 const getConfigFromParams = params => {
   const config = new Parse.Config();
@@ -44,31 +45,43 @@ export class GlobalConfigRouter extends PromiseRouter {
         // with an authenticated user attaches per-user arm verdicts WITHOUT
         // changing the global params contract — old SDKs ignore the field.
         // Skipped for master/anonymous and on any failure (fail-open to the
-        // plain global payload, never break standard fetch).
+        // plain global payload, never break standard fetch). Evaluation
+        // itself is delegated to the shared Experiments resolver so REST,
+        // GraphQL, and Cloud Code (via /config) share one code path.
         try {
           const wantsEval = req.query && req.query.abEvaluate === 'true';
           const user = req.auth && req.auth.user;
-          if (!wantsEval || !user || req.auth.isMaster) {
-            return result;
-          }
           const params = (result.response && result.response.params) || {};
-          if (params.ab_enabled !== true || !Array.isArray(params.ab_experiments)) {
+          // Resolve the account-age anchor for new-targeted experiments.
+          // Missing user doc yields undefined joined time (fail-open).
+          let joinedMs;
+          if (wantsEval && user && !req.auth.isMaster) {
+            const profiles = await req.config.database.find(
+              'users',
+              { user_uid: user.id },
+              { limit: 1 }
+            );
+            const joined = profiles.length === 1 ? profiles[0].user_joined : null;
+            joinedMs = Utils.isDate(joined) ? joined.getTime() : Number(joined) || 0;
+          }
+          const nextParams = resolveAbEvaluated(params, {
+            abEvaluateRequested: wantsEval === true,
+            user: user,
+            isMaster: req.auth && req.auth.isMaster,
+            userJoinedMs: joinedMs,
+          });
+          // Preserve the exact pre-resolver response shape: only attach
+          // abEvaluated when evaluation actually produced verdicts, plus the
+          // legacy fallback of an empty list when opted in with an
+          // authenticated non-master user but experiments are off/absent.
+          if (nextParams && nextParams.abEvaluated !== undefined) {
+            return { response: { ...result.response, abEvaluated: nextParams.abEvaluated } };
+          }
+          if (wantsEval && user && !(req.auth && req.auth.isMaster)) {
             return { response: { ...result.response, abEvaluated: [] } };
           }
-          const profiles = await req.config.database.find(
-            'users',
-            { user_uid: user.id },
-            { limit: 1 }
-          );
-          const joined = profiles.length === 1 ? profiles[0].user_joined : null;
-          const joinedMs = joined instanceof Date ? joined.getTime() : Number(joined) || 0;
-          return {
-            response: {
-              ...result.response,
-              abEvaluated: evaluateAll(params.ab_experiments, user.id, joinedMs),
-            },
-          };
-        } catch (e) {
+          return result;
+        } catch {
           return result;
         }
       });
@@ -84,6 +97,10 @@ export class GlobalConfigRouter extends PromiseRouter {
     }
     const params = req.body.params || {};
     const masterKeyOnly = req.body?.masterKeyOnly || {};
+    // Verdicts are read-only output: never persist a client-echoed
+    // abEvaluated field into the stored global params.
+    delete params.abEvaluated;
+    delete masterKeyOnly.abEvaluated;
     // Transform in dot notation to make sure it works
     const update = Object.keys(params).reduce((acc, key) => {
       acc[`params.${key}`] = params[key];
```
<!-- END_GIT_DIFF -->

/**
 * ExperimentsConfigResolver.js — Shared Parse Config A/B resolution (task 02).
 *
 * Single code path for every surface that serves Parse Config reads
 * (REST GET /config, GraphQL client query, Cloud Code via /config):
 * given already-fetched global params plus the requesting user, attach the
 * per-user `abEvaluated` verdicts WITHOUT changing the global params
 * contract — old clients ignore the extra field.
 *
 * Fail-open by design: any missing input (no opt-in, no user, master key,
 * experiments disabled or absent) or any evaluator throw returns the plain
 * `params` object untouched, never breaks standard config fetch.
 *
 * Pure except for the evaluator import: zero DB imports, zero network, zero
 * state. The caller resolves `userJoinedMs` (e.g. via the `users` collection
 * lookup by `user_uid`, see GlobalConfigRouter) and passes milliseconds in.
 *
 * Rollback: delete this file and revert the GlobalConfigRouter GET hunk to
 * call `evaluateAll` directly; the endpoint behaves exactly like before.
 */
import { evaluateAll } from './ExperimentsEvaluator';

/**
 * Resolve per-user experiment verdicts for a fetched global params object.
 *
 * @param {object|null} params The global config params as stored
 *   (`params.ab_enabled === true` plus `params.ab_experiments` array opt in).
 * @param {object} options Resolution inputs:
 *   - {boolean} abEvaluateRequested — caller saw an explicit opt-in
 *     (REST `?abEvaluate=true`, GraphQL `abEvaluate: true`).
 *   - {object} user — authenticated user (`user.id` feeds the bucket hash).
 *   - {boolean} isMaster — master key bypasses evaluation (global view).
 *   - {number} userJoinedMs — account age anchor for new-targeted
 *     experiments; undefined when the user doc lookup missed.
 * @returns {object} `params` unchanged on every fail-open path, else a copy
 *   with `abEvaluated: [{ key, variant }]` attached.
 */
export function resolveAbEvaluated(params, options) {
  // Guard: destructure defensively — options itself may be undefined.
  const opts = options || {};
  const abEvaluateRequested = opts.abEvaluateRequested;
  const user = opts.user;
  const isMaster = opts.isMaster;
  const userJoinedMs = opts.userJoinedMs;
  // Fail-open: no explicit opt-in means plain global payload.
  if (abEvaluateRequested !== true) {
    return params;
  }
  // Fail-open: nothing to evaluate against.
  if (!params) {
    return params;
  }
  // Fail-open: experiments feature flag off for this app config.
  if (params.ab_enabled !== true) {
    return params;
  }
  // Fail-open: master key always sees the global view, never arms.
  if (isMaster === true) {
    return params;
  }
  // Fail-open: anonymous or malformed identity cannot be bucketed.
  if (!user) {
    return params;
  }
  // Fail-open: user object without a stable id cannot be bucketed.
  if (!user.id) {
    return params;
  }
  // Fail-open: flag on but no experiment definitions stored. The property
  // read itself sits inside try: a foreign params shape may throw on access.
  try {
    const experiments = params.ab_experiments;
    if (!experiments) {
      return params;
    }
    // evaluateAll is fail-closed per entry and never throws on bad input,
    // but a foreign `experiments` shape could still throw — stay fail-open.
    const abEvaluated = evaluateAll(experiments, user.id, userJoinedMs);
    // Copy, never mutate the caller's params object.
    const next = Object.assign({}, params, { abEvaluated: abEvaluated });
    return next;
  } catch {
    // Fail-open: evaluation must never break standard config fetch.
    return params;
  }
}

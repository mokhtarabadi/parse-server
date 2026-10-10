/**
 * ExperimentsEvaluator.js — Native per-user experiment evaluation (fork).
 *
 * Parse Config is global by design (one _GlobalConfig row, identical payload
 * for every client). This module adds the missing dimension WITHOUT changing
 * that contract: given already-fetched definitions + a user id, it evaluates
 * each experiment locally with a deterministic hash. Same math on every
 * runtime (Android ParseExperiments, cloud abBucket, this module) — verified
 * by shared vectors: bucketFor('vip_for_new_10','vftE0NKr0C')===86,
 * ('vip_for_new_10','NXqFcxQhF2')===56, ('exp-a','probe-user-001')===60.
 *
 * Pure: zero Parse imports, zero network, zero state. Safe in any thread.
 */
import { createHash } from 'node:crypto';

const MODULUS = 100;

/**
 * Stable bucket 0-99 for a user in an experiment, or -1 on invalid input
 * (callers treat -1 as control).
 */
export function bucketFor(experimentKey, userId) {
  if (!experimentKey || !userId) {
    return -1;
  }
  const hash = createHash('sha256').update(experimentKey + '\n' + userId, 'utf8').digest();
  const head = ((hash[0] << 24) | (hash[1] << 16) | (hash[2] << 8) | hash[3]) >>> 0;
  return head % MODULUS;
}

/**
 * Variant verdict for one experiment map. Fail-closed at every step:
 * missing/killed experiment, unreadable or non-positive percent, old account
 * for new-targeted experiments, or invalid bucket all yield false.
 */
export function isVariant(exp, userId, joinedAtMs) {
  if (!exp || exp.killed) {
    return false;
  }
  const pct = Number(exp.traffic_pct);
  if (!Number.isFinite(pct) || pct <= 0) {
    return false;
  }
  if (exp.target === 'new') {
    const start = Date.parse(exp.start_iso);
    if (!Number.isFinite(start) || !(joinedAtMs >= start)) {
      return false;
    }
  }
  const bucket = bucketFor(exp.key, userId);
  return bucket >= 0 && bucket < Math.min(pct, 100);
}

/**
 * Evaluates a list of experiment definitions for a user. Skips malformed
 * entries. Returns [{ key, variant }] in input order — no writes, no reads.
 */
export function evaluateAll(experiments, userId, joinedAtMs) {
  if (!Array.isArray(experiments) || !userUidValid(userId)) {
    return [];
  }
  const out = [];
  for (const exp of experiments) {
    if (!exp || typeof exp.key !== 'string' || !exp.key) {
      continue;
    }
    out.push({ key: exp.key, variant: isVariant(exp, userId, joinedAtMs) });
  }
  return out;
}

function userUidValid(userId) {
  return typeof userId === 'string' && userId.length > 0;
}

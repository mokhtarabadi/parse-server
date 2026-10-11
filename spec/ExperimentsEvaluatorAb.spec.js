'use strict';

// Task 02: unit vectors for the pure evaluator. No DB, no server.
const {
  bucketFor,
  isVariant,
  evaluateAll,
} = require('../lib/Experiments/ExperimentsEvaluator');

describe('ExperimentsEvaluator A/B vectors', () => {
  it('buckets shared cross-runtime vectors deterministically', () => {
    expect(bucketFor('vip_for_new_10', 'vftE0NKr0C')).toEqual(86);
    expect(bucketFor('vip_for_new_10', 'NXqFcxQhF2')).toEqual(56);
    expect(bucketFor('exp-a', 'probe-user-001')).toEqual(60);
  });

  it('returns -1 (control) on invalid input', () => {
    expect(bucketFor('', 'u')).toEqual(-1);
    expect(bucketFor('exp', '')).toEqual(-1);
    expect(bucketFor(null, null)).toEqual(-1);
  });

  it('isVariant fail-closes on killed, missing, or non-positive traffic', () => {
    expect(isVariant(null, 'u', 0)).toEqual(false);
    expect(isVariant({ key: 'a', killed: true, traffic_pct: 100 }, 'u', 0)).toEqual(false);
    expect(isVariant({ key: 'a', traffic_pct: 0 }, 'u', 0)).toEqual(false);
    expect(isVariant({ key: 'a', traffic_pct: 'x' }, 'u', 0)).toEqual(false);
  });

  it('isVariant gates new-targeted experiments on account age', () => {
    const exp = { key: 'exp-a', traffic_pct: 100, target: 'new', start_iso: '2026-01-01T00:00:00.000Z' };
    expect(isVariant(exp, 'probe-user-001', Date.parse('2026-06-01T00:00:00.000Z'))).toEqual(true);
    expect(isVariant(exp, 'probe-user-001', Date.parse('2025-06-01T00:00:00.000Z'))).toEqual(false);
  });

  it('evaluateAll preserves order, skips malformed entries, never throws', () => {
    const out = evaluateAll(
      [
        { key: 'exp-a', traffic_pct: 100 },
        null,
        { noKey: true },
        { key: '', traffic_pct: 100 },
        { key: 'killed', killed: true, traffic_pct: 100 },
      ],
      'probe-user-001',
      0
    );
    expect(out).toEqual([
      { key: 'exp-a', variant: true },
      { key: 'killed', variant: false },
    ]);
    expect(evaluateAll(null, 'u', 0)).toEqual([]);
    expect(evaluateAll([], '', 0)).toEqual([]);
  });
});

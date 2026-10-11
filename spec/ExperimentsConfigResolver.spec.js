'use strict';

// Task 02: shared resolver fail-open matrix. No DB, no server.
const {
  resolveAbEvaluated,
} = require('../lib/Experiments/ExperimentsConfigResolver');

const USER = { id: 'probe-user-001' };
const ENABLED = {
  ab_enabled: true,
  ab_experiments: [
    { key: 'exp-a', traffic_pct: 100 },
    { key: 'exp-b', traffic_pct: 0 },
  ],
  other: 1,
};

describe('ExperimentsConfigResolver fail-open matrix', () => {
  it('returns params untouched when opt-in is off', () => {
    const out = resolveAbEvaluated(ENABLED, { abEvaluateRequested: false, user: USER });
    expect(out).toBe(ENABLED);
    expect(out.abEvaluated).toBeUndefined();
  });

  it('returns params untouched when the flag is off', () => {
    const params = { ab_enabled: false, ab_experiments: ENABLED.ab_experiments };
    expect(resolveAbEvaluated(params, { abEvaluateRequested: true, user: USER })).toBe(params);
  });

  it('returns params untouched for master key', () => {
    expect(
      resolveAbEvaluated(ENABLED, { abEvaluateRequested: true, user: USER, isMaster: true })
    ).toBe(ENABLED);
  });

  it('returns params untouched without a user or user id', () => {
    expect(resolveAbEvaluated(ENABLED, { abEvaluateRequested: true })).toBe(ENABLED);
    expect(resolveAbEvaluated(ENABLED, { abEvaluateRequested: true, user: {} })).toBe(ENABLED);
  });

  it('returns params untouched when experiments are absent or null params', () => {
    const params = { ab_enabled: true };
    expect(resolveAbEvaluated(params, { abEvaluateRequested: true, user: USER })).toBe(params);
    expect(resolveAbEvaluated(null, { abEvaluateRequested: true, user: USER })).toBeNull();
  });

  it('returns plain params when reading experiments throws', () => {
    const evil = {};
    Object.defineProperty(evil, 'ab_experiments', {
      get() {
        throw new Error('boom');
      },
    });
    evil.ab_enabled = true;
    expect(resolveAbEvaluated(evil, { abEvaluateRequested: true, user: USER })).toBe(evil);
  });

  it('attaches the evaluated matrix without mutating input', () => {
    const out = resolveAbEvaluated(ENABLED, {
      abEvaluateRequested: true,
      user: USER,
      userJoinedMs: 0,
    });
    expect(out.abEvaluated).toEqual([
      { key: 'exp-a', variant: true },
      { key: 'exp-b', variant: false },
    ]);
    expect(ENABLED.abEvaluated).toBeUndefined();
    expect(out.other).toEqual(1);
  });
});

'use strict';

// Task 02: GraphQL clientConfig behavior with mocked context (no DB, no server).
const { clientConfig, cloudConfig } = require('../lib/GraphQL/loaders/configQueries');

const USER = { id: 'probe-user-001' };
const PARAMS = {
  ab_enabled: true,
  ab_experiments: [{ key: 'exp-a', traffic_pct: 100 }],
  color: 'blue',
};

function mockContext({ row, auth, userDoc }) {
  return {
    config: {
      database: {
        find(className) {
          if (className === '_GlobalConfig') {
            return Promise.resolve(row ? [row] : []);
          }
          if (className === 'users') {
            return Promise.resolve(userDoc ? [userDoc] : []);
          }
          return Promise.resolve([]);
        },
      },
    },
    auth: auth,
  };
}

const ROW = { params: PARAMS, masterKeyOnly: {} };

describe('GraphQL clientConfig A/B read', () => {
  it('returns plain value when abEvaluate is off or omitted (old clients)', async () => {
    for (const flag of [false, undefined]) {
      const res = await clientConfig(
        mockContext({ row: ROW, auth: { user: USER } }),
        'color',
        flag
      );
      expect(res.value).toEqual('blue');
      expect(res.abEvaluated).toBeNull();
    }
  });

  it('evaluates verdicts for explicit opt-in with an authenticated user', async () => {
    const res = await clientConfig(
      mockContext({ row: ROW, auth: { user: USER }, userDoc: null }),
      'color',
      true
    );
    expect(res.value).toEqual('blue');
    expect(res.abEvaluated).toEqual([{ key: 'exp-a', variant: true }]);
  });

  it('returns the plain global view for master key', async () => {
    const res = await clientConfig(
      mockContext({ row: ROW, auth: { user: USER, isMaster: true } }),
      'color',
      true
    );
    expect(res.abEvaluated).toBeNull();
  });

  it('blocks unauthenticated callers', async () => {
    await expectAsync(clientConfig(mockContext({ row: ROW, auth: {} }), 'color', true)).toBeRejected();
  });

  it('returns nulls when no config row exists', async () => {
    const res = await clientConfig(
      mockContext({ row: null, auth: { user: USER } }),
      'color',
      true
    );
    expect(res.value).toBeNull();
  });

  it('fails open to plain when the users lookup throws', async () => {
    const ctx = mockContext({ row: ROW, auth: { user: USER } });
    ctx.config.database.find = (className) => {
      if (className === 'users') {
        return Promise.reject(new Error('db down'));
      }
      return Promise.resolve([ROW]);
    };
    const res = await clientConfig(ctx, 'color', true);
    expect(res.value).toEqual('blue');
    expect(res.abEvaluated).toBeNull();
  });

  it('leaves master-only cloudConfig untouched (no abEvaluate path)', async () => {
    const res = await cloudConfig(mockContext({ row: ROW, auth: { isMaster: true } }), 'color');
    expect(res.value).toEqual('blue');
    expect(res.abEvaluated).toBeUndefined();
  });
});

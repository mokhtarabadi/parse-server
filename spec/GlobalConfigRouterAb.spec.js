'use strict';

// Task 02: router-level A/B behavior with mocked req (no DB, no server).
const { GlobalConfigRouter } = require('../lib/Routers/GlobalConfigRouter');

const USER = { id: 'probe-user-001' };
const ENABLED_PARAMS = {
  ab_enabled: true,
  ab_experiments: [{ key: 'exp-a', traffic_pct: 100 }],
  color: 'blue',
};

function mockReq({ params, userDoc, auth, abEvaluate }) {
  return {
    query: abEvaluate ? { abEvaluate: 'true' } : {},
    auth: auth,
    config: {
      database: {
        find(className, query) {
          if (className === '_GlobalConfig') {
            return Promise.resolve([{ params: params, masterKeyOnly: {} }]);
          }
          if (className === 'users') {
            return Promise.resolve(userDoc ? [userDoc] : []);
          }
          return Promise.resolve([]);
        },
      },
    },
  };
}

describe('GlobalConfigRouter A/B read', () => {
  const router = new GlobalConfigRouter();

  it('returns plain config when opt-in is off', async () => {
    const res = await router.getGlobalConfig(
      mockReq({ params: ENABLED_PARAMS, auth: { user: USER }, abEvaluate: false })
    );
    expect(res.response.params).toEqual(ENABLED_PARAMS);
    expect(res.response.abEvaluated).toBeUndefined();
  });

  it('attaches empty verdicts when experiments are off', async () => {
    const res = await router.getGlobalConfig(
      mockReq({
        params: { color: 'blue' },
        auth: { user: USER },
        abEvaluate: true,
      })
    );
    expect(res.response.params).toEqual({ color: 'blue' });
    expect(res.response.abEvaluated).toEqual([]);
  });

  it('returns plain config for master requests', async () => {
    const res = await router.getGlobalConfig(
      mockReq({ params: ENABLED_PARAMS, auth: { isMaster: true }, abEvaluate: true })
    );
    expect(res.response.abEvaluated).toBeUndefined();
  });

  it('evaluates with zero joined time when the user doc is missing', async () => {
    const res = await router.getGlobalConfig(
      mockReq({ params: ENABLED_PARAMS, userDoc: null, auth: { user: USER }, abEvaluate: true })
    );
    expect(res.response.abEvaluated).toEqual([{ key: 'exp-a', variant: true }]);
  });

  it('stays plain (no throw) when evaluation blows up', async () => {
    const evil = { ab_enabled: true };
    Object.defineProperty(evil, 'ab_experiments', {
      get() {
        throw new Error('boom');
      },
    });
    const res = await router.getGlobalConfig(
      mockReq({ params: evil, auth: { user: USER }, abEvaluate: true })
    );
    // Legacy fail-open shape: opted-in but unevaluable yields empty verdicts.
    expect(res.response.abEvaluated).toEqual([]);
  });

  it('serves the evaluated matrix end to end', async () => {
    const res = await router.getGlobalConfig(
      mockReq({
        params: ENABLED_PARAMS,
        userDoc: { user_joined: new Date('2026-01-01T00:00:00.000Z') },
        auth: { user: USER },
        abEvaluate: true,
      })
    );
    expect(res.response.params.color).toEqual('blue');
    expect(res.response.abEvaluated).toEqual([{ key: 'exp-a', variant: true }]);
  });

  it('never persists client-echoed abEvaluated on update', async () => {
    let captured = null;
    const req = {
      body: {
        params: { color: 'red', abEvaluated: [{ key: 'exp-a', variant: true }] },
        masterKeyOnly: {},
      },
      auth: { isReadOnly: false },
      config: {
        applicationId: 'test',
        database: {
          find: async () => [],
          update: async (className, query, update) => {
            captured = update;
            return { params: { color: 'red' } };
          },
        },
      },
    };
    const res = await router.updateGlobalConfig(req);
    expect(res.response).toEqual({ result: true });
    expect(captured['params.abEvaluated']).toBeUndefined();
    expect(captured['params.color']).toEqual('red');
  });
});

// global_config.js
import Parse from 'parse/node';
import PromiseRouter from '../PromiseRouter';
import Utils from '../Utils';
import * as middleware from '../middlewares';
import * as triggers from '../triggers';
import { createSanitizedError } from '../Error';
import { resolveAbEvaluated } from '../Experiments/ExperimentsConfigResolver';

const getConfigFromParams = params => {
  const config = new Parse.Config();
  for (const attr in params) {
    config.attributes[attr] = Parse._decode(undefined, params[attr]);
  }
  return config;
};

export class GlobalConfigRouter extends PromiseRouter {
  getGlobalConfig(req) {
    return req.config.database
      .find('_GlobalConfig', { objectId: '1' }, { limit: 1 })
      .then(results => {
        if (results.length != 1) {
          // If there is no config in the database - return empty config.
          return { response: { params: {} } };
        }
        const globalConfig = results[0];
        if (!req.auth.isMaster && globalConfig.masterKeyOnly !== undefined) {
          for (const param in globalConfig.params) {
            if (globalConfig.masterKeyOnly[param]) {
              delete globalConfig.params[param];
              delete globalConfig.masterKeyOnly[param];
            }
          }
        }
        return {
          response: {
            params: globalConfig.params,
            masterKeyOnly: globalConfig.masterKeyOnly,
          },
        };
      })
      .then(async result => {
        // Native experiment evaluation (opt-in): GET /config?abEvaluate=true
        // with an authenticated user attaches per-user arm verdicts WITHOUT
        // changing the global params contract — old SDKs ignore the field.
        // Skipped for master/anonymous and on any failure (fail-open to the
        // plain global payload, never break standard fetch). Evaluation
        // itself is delegated to the shared Experiments resolver so REST,
        // GraphQL, and Cloud Code (via /config) share one code path.
        try {
          const wantsEval = req.query && req.query.abEvaluate === 'true';
          const user = req.auth && req.auth.user;
          const params = (result.response && result.response.params) || {};
          // Resolve the account-age anchor for new-targeted experiments.
          // Missing user doc yields undefined joined time (fail-open).
          let joinedMs;
          if (wantsEval && user && !req.auth.isMaster) {
            const profiles = await req.config.database.find(
              'users',
              { user_uid: user.id },
              { limit: 1 }
            );
            const joined = profiles.length === 1 ? profiles[0].user_joined : null;
            joinedMs = Utils.isDate(joined) ? joined.getTime() : Number(joined) || 0;
          }
          const nextParams = resolveAbEvaluated(params, {
            abEvaluateRequested: wantsEval === true,
            user: user,
            isMaster: req.auth && req.auth.isMaster,
            userJoinedMs: joinedMs,
          });
          // Preserve the exact pre-resolver response shape: only attach
          // abEvaluated when evaluation actually produced verdicts, plus the
          // legacy fallback of an empty list when opted in with an
          // authenticated non-master user but experiments are off/absent.
          if (nextParams && nextParams.abEvaluated !== undefined) {
            return { response: { ...result.response, abEvaluated: nextParams.abEvaluated } };
          }
          if (wantsEval && user && !(req.auth && req.auth.isMaster)) {
            return { response: { ...result.response, abEvaluated: [] } };
          }
          return result;
        } catch {
          return result;
        }
      });
  }

  async updateGlobalConfig(req) {
    if (req.auth.isReadOnly) {
      throw createSanitizedError(
        Parse.Error.OPERATION_FORBIDDEN,
        "read-only masterKey isn't allowed to update the config.",
        req.config
      );
    }
    // Copy: verdict stripping must not mutate the caller's request body.
    const params = { ...(req.body.params || {}) };
    const masterKeyOnly = { ...(req.body?.masterKeyOnly || {}) };
    // Verdicts are read-only output: never persist a client-echoed
    // abEvaluated field into the stored global params.
    delete params.abEvaluated;
    delete masterKeyOnly.abEvaluated;
    // Transform in dot notation to make sure it works
    const update = Object.keys(params).reduce((acc, key) => {
      acc[`params.${key}`] = params[key];
      acc[`masterKeyOnly.${key}`] = masterKeyOnly[key] || false;
      return acc;
    }, {});
    const className = triggers.getClassName(Parse.Config);
    const hasBeforeSaveHook = triggers.triggerExists(className, triggers.Types.beforeSave, req.config.applicationId);
    const hasAfterSaveHook = triggers.triggerExists(className, triggers.Types.afterSave, req.config.applicationId);
    let originalConfigObject;
    let updatedConfigObject;
    const configObject = new Parse.Config();
    configObject.attributes = params;

    const results = await req.config.database.find('_GlobalConfig', { objectId: '1' }, { limit: 1 });
    const isNew = results.length !== 1;
    if (!isNew && (hasBeforeSaveHook || hasAfterSaveHook)) {
      originalConfigObject = getConfigFromParams(results[0].params);
    }
    try {
      await triggers.maybeRunGlobalConfigTrigger(triggers.Types.beforeSave, req.auth, configObject, originalConfigObject, req.config, req.context);
      if (isNew) {
        await req.config.database.update('_GlobalConfig', { objectId: '1' }, update, { upsert: true }, true)
        updatedConfigObject = configObject;
      } else {
        const result = await req.config.database.update('_GlobalConfig', { objectId: '1' }, update, {}, true);
        updatedConfigObject = getConfigFromParams(result.params);
      }
      await triggers.maybeRunGlobalConfigTrigger(triggers.Types.afterSave, req.auth, updatedConfigObject, originalConfigObject, req.config, req.context);
      return { response: { result: true } }
    } catch (err) {
      const error = triggers.resolveError(err, {
        code: Parse.Error.SCRIPT_FAILED,
        message: 'Script failed. Unknown error.',
      });
      throw error;
    }
  }

  mountRoutes() {
    this.route('GET', '/config', req => {
      return this.getGlobalConfig(req);
    });
    this.route('PUT', '/config', middleware.promiseEnforceMasterKeyAccess, req => {
      return this.updateGlobalConfig(req);
    });
  }
}

export default GlobalConfigRouter;

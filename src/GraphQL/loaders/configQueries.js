import { GraphQLNonNull, GraphQLString, GraphQLBoolean, GraphQLObjectType, GraphQLList } from 'graphql';
import Parse from 'parse/node';
import { createSanitizedError } from '../../Error';
import Utils from '../../Utils';
import { resolveAbEvaluated } from '../../Experiments/ExperimentsConfigResolver';

const cloudConfig = async (context, paramName) => {
  const { config, auth } = context;

  if (!auth.isMaster) {
    throw createSanitizedError(
      Parse.Error.OPERATION_FORBIDDEN,
      'Master Key is required to access GlobalConfig.'
    );
  }

  const results = await config.database.find('_GlobalConfig', { objectId: '1' }, { limit: 1 });

  if (results.length !== 1) {
    return { value: null, isMasterKeyOnly: null };
  }

  const globalConfig = results[0];
  const params = globalConfig.params || {};
  const masterKeyOnly = globalConfig.masterKeyOnly || {};

  if (params[paramName] !== undefined) {
    return { value: params[paramName], isMasterKeyOnly: masterKeyOnly[paramName] ?? null };
  }

  return { value: null, isMasterKeyOnly: null };
};

/**
 * Client-safe A/B config read (O2 design, task 02).
 *
 * WHY O2: the master-only `cloudConfig` query stays byte-identical so old
 * clients and dashboards are unaffected. This separate query serves
 * authenticated (non-master) users and resolves per-user experiment verdicts
 * through the same shared resolver as REST GET /config — one code path for
 * every surface. Master key gets the plain global view (fail-open).
 */
const clientConfig = async (context, paramName, abEvaluate = false) => {
  const { config, auth } = context;

  // Client query: anonymous callers get the same auth error shape as the
  // rest of the client schema instead of leaking config existence.
  if (!auth.user) {
    throw createSanitizedError(
      Parse.Error.OPERATION_FORBIDDEN,
      'Authentication is required to access client config.'
    );
  }

  const results = await config.database.find('_GlobalConfig', { objectId: '1' }, { limit: 1 });

  if (results.length !== 1) {
    return { value: null, isMasterKeyOnly: null, abEvaluated: null };
  }

  const globalConfig = results[0];
  const params = globalConfig.params || {};
  const masterKeyOnly = globalConfig.masterKeyOnly || {};

  const base = {
    value: params[paramName] !== undefined ? params[paramName] : null,
    isMasterKeyOnly: masterKeyOnly[paramName] ?? null,
    abEvaluated: null,
  };

  // Fail-open: master sees the global view; no opt-in means plain payload.
  if (auth.isMaster || abEvaluate !== true) {
    return base;
  }

  try {
    // Resolve the account-age anchor for new-targeted experiments, mirroring
    // the REST router lookup. A missed lookup yields undefined joined time.
    let userJoinedMs;
    const profiles = await config.database.find(
      'users',
      { user_uid: auth.user.id },
      { limit: 1 }
    );
    if (profiles.length === 1) {
      const joined = profiles[0].user_joined;
      userJoinedMs = Utils.isDate(joined) ? joined.getTime() : Number(joined) || 0;
    }

    const resolved = resolveAbEvaluated(params, {
      abEvaluateRequested: true,
      user: auth.user,
      isMaster: false,
      userJoinedMs: userJoinedMs,
    });
    return { ...base, abEvaluated: resolved.abEvaluated || [] };
  } catch {
    // Fail-open: evaluation (including the users lookup) must never break
    // the config read — return the plain global view.
    return base;
  }
};

const load = (parseGraphQLSchema) => {
  if (!parseGraphQLSchema.cloudConfigType) {
    // Nullable experiment-verdict list. Appended to the shared ConfigValue
    // type so both master and client queries serve it; null unless evaluated.
    const experimentVerdictType = new GraphQLObjectType({
      name: 'ExperimentVerdict',
      fields: {
        key: { type: GraphQLString },
        variant: { type: GraphQLBoolean },
      },
    });
    parseGraphQLSchema.addGraphQLType(experimentVerdictType, true, true);
    const cloudConfigType = new GraphQLObjectType({
      name: 'ConfigValue',
      fields: {
        value: { type: GraphQLString },
        isMasterKeyOnly: { type: GraphQLBoolean },
        abEvaluated: { type: new GraphQLList(experimentVerdictType) },
      },
    });
    parseGraphQLSchema.addGraphQLType(cloudConfigType, true, true);
    parseGraphQLSchema.cloudConfigType = cloudConfigType;
  }

  parseGraphQLSchema.addGraphQLQuery('cloudConfig', {
    description: 'Returns the value of a specific parameter from GlobalConfig.',
    args: {
      paramName: { type: new GraphQLNonNull(GraphQLString) },
    },
    type: new GraphQLNonNull(parseGraphQLSchema.cloudConfigType),
    async resolve(_source, args, context) {
      try {
        return await cloudConfig(context, args.paramName);
      } catch (e) {
        parseGraphQLSchema.handleError(e);
      }
    },
  }, false, true);

  parseGraphQLSchema.addGraphQLQuery('clientConfig', {
    description: 'Client-safe config read. Returns the parameter value plus per-user experiment verdicts when abEvaluate is true. Master key and opt-out get the plain global view.',
    args: {
      paramName: { type: new GraphQLNonNull(GraphQLString) },
      abEvaluate: { type: GraphQLBoolean },
    },
    type: new GraphQLNonNull(parseGraphQLSchema.cloudConfigType),
    async resolve(_source, args, context) {
      try {
        return await clientConfig(context, args.paramName, args.abEvaluate);
      } catch (e) {
        parseGraphQLSchema.handleError(e);
      }
    },
  }, false, true);
};

export { load, cloudConfig, clientConfig };

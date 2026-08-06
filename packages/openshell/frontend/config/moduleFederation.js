/* eslint-disable import/no-extraneous-dependencies, n/no-extraneous-require */
const { ModuleFederationPlugin } = require('@module-federation/enhanced/webpack');
const deps = require('../package.json').dependencies;

/**
 * Spike MF config (RHOAIENG-81066).
 * Share React + PatternFly + router (host wrappers need host Router context).
 * Do NOT share @tanstack/react-query — upstream is v5; host is v4.
 */
const moduleFederationConfig = {
  name: 'openshell',
  filename: 'remoteEntry.js',
  shared: {
    react: { singleton: true, requiredVersion: deps.react },
    'react-dom': { singleton: true, requiredVersion: deps['react-dom'] },
    'react-router': { singleton: true, requiredVersion: deps['react-router'] },
    'react-router-dom': { singleton: true, requiredVersion: deps['react-router-dom'] },
    '@patternfly/react-core': {
      singleton: true,
      requiredVersion: deps['@patternfly/react-core'],
    },
    '@odh-dashboard/internal': { singleton: true, requiredVersion: '*' },
    '@odh-dashboard/plugin-core': { singleton: true, requiredVersion: '*' },
    '@odh-dashboard/ui-core': { singleton: true, requiredVersion: '*' },
  },
  exposes: {
    './extensions': './src/odh/extensions',
    './extension-points': './src/odh/extension-points',
  },
  runtime: false,
  dts: false,
};

module.exports = {
  moduleFederationPlugins: [new ModuleFederationPlugin(moduleFederationConfig)],
};

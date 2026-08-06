module.exports = require('@odh-dashboard/eslint-config')
  .extend({
    ignorePatterns: ['scripts/**/*'],
    settings: {
      'import/core-modules': ['openshell-dashboard'],
    },
    rules: {
      'import/no-extraneous-dependencies': 'off',
      'n/no-missing-import': 'off',
      'n/no-unpublished-import': 'off',
    },
  })
  .recommendedReactTypescript(__dirname);

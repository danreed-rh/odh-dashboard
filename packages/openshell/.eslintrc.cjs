module.exports = require('@odh-dashboard/eslint-config')
  .extend({
    ignorePatterns: ['scripts/**/*', 'frontend/dist/**/*'],
    settings: {
      'import/core-modules': ['openshell-dashboard'],
    },
    rules: {
      'import/no-extraneous-dependencies': [
        'error',
        {
          packageDir: [__dirname, `${__dirname}/frontend`],
          devDependencies: true,
        },
      ],
    },
  })
  .recommendedReactTypescript(__dirname);

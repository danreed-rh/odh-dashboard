const path = require('path');

/**
 * Upstream build:lib emits JS under dist/ but leaves CSS in src/.
 * Host + MF remotes resolve `import './Foo.css'` next to dist JS and fail.
 * Remap the resolve context from …/dist/… → …/src/… for those CSS imports.
 *
 * Realpath (symlinks: true): …/openshell-dashboard/frontend/dist/…
 * Package root via node_modules: …/openshell-dashboard/dist/…
 */
class OpenshellCssFromSrcPlugin {
  apply(compiler) {
    compiler.hooks.normalModuleFactory.tap('OpenshellCssFromSrcPlugin', (factory) => {
      factory.hooks.beforeResolve.tap('OpenshellCssFromSrcPlugin', (resolveData) => {
        if (!resolveData?.request?.endsWith('.css') || !resolveData.context) {
          return;
        }
        const { context } = resolveData;
        if (!context.includes(`${path.sep}openshell-dashboard${path.sep}`)) {
          return;
        }
        if (context.includes(`${path.sep}frontend${path.sep}dist${path.sep}`)) {
          // Webpack resolve mutation — intentional.
          // eslint-disable-next-line no-param-reassign
          resolveData.context = context.replace(
            `${path.sep}frontend${path.sep}dist${path.sep}`,
            `${path.sep}frontend${path.sep}src${path.sep}`,
          );
          return;
        }
        if (context.includes(`${path.sep}openshell-dashboard${path.sep}dist${path.sep}`)) {
          // eslint-disable-next-line no-param-reassign
          resolveData.context = context.replace(
            `${path.sep}openshell-dashboard${path.sep}dist${path.sep}`,
            `${path.sep}openshell-dashboard${path.sep}src${path.sep}`,
          );
        }
      });
    });
  }
}

module.exports = OpenshellCssFromSrcPlugin;

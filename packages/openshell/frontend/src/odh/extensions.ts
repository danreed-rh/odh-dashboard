import type {
  AreaExtension,
  NavExtension,
  RouteExtension,
} from '@odh-dashboard/plugin-core/extension-points';

// Keep in sync with ./const.ts (value imports are disallowed in extensions.ts).
const OPENSHELL_AREA_ID = 'openshell';
const OPENSHELL_BASE_PATH = '/openshell';
const OPENSHELL_SANDBOXES_PATH = `${OPENSHELL_BASE_PATH}/sandboxes`;

const extensions: (AreaExtension | NavExtension | RouteExtension)[] = [
  {
    type: 'app.area',
    properties: {
      id: OPENSHELL_AREA_ID,
      featureFlags: ['openshell'],
    },
  },
  {
    type: 'app.navigation/href',
    flags: {
      required: [OPENSHELL_AREA_ID],
    },
    properties: {
      id: 'openshell-sandboxes',
      title: 'OpenShell',
      href: OPENSHELL_SANDBOXES_PATH,
      section: 'ai-hub',
      path: `${OPENSHELL_BASE_PATH}/*`,
    },
  },
  {
    type: 'app.route',
    flags: {
      required: [OPENSHELL_AREA_ID],
    },
    properties: {
      path: `${OPENSHELL_BASE_PATH}/*`,
      component: () => import('./OpenshellRoutes'),
    },
  },
];

export default extensions;

import type { Extension } from '@openshift/dynamic-plugin-sdk';

/**
 * Host-static extensions only (workspace `./extensions` export).
 * Area, nav, and routes live in the MF remote (`frontend/src/odh/extensions.ts`)
 * so they are not registered twice when `poc:frontend` is running.
 */
const extensions: Extension[] = [];

export default extensions;

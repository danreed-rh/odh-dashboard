/**
 * Consume PoC for RHOAIENG-81066.
 * Proves TypeScript can resolve upstream package export barrels after `npm run build:lib`.
 * Not mounted in the host dashboard — spike only.
 */
import { SandboxListPage, SandboxDetailPage } from 'openshell-dashboard/pages';
import { setApiBasePath, setSessionExpiredHandler } from 'openshell-dashboard/api';
import { AlertProvider } from 'openshell-dashboard/components';
import type { ComponentType } from 'react';

// Host wrapper must call these before rendering pages that hit the BFF.
setApiBasePath('/_bff/openshell');
setSessionExpiredHandler(() => {
  // Host maps 401 → odh session-expired UX (logout / re-auth).
});

export type OpenshellHostInventory = {
  /** PatternFly toast stack — pages call useAlerts from AlertContext (re-exported). */
  AlertProvider: typeof AlertProvider;
  /** List → detail navigation; replaces hardcoded useNavigate when provided. */
  onViewSandbox?: (name: string, tab?: string) => void;
  /** Controlled tabs on SandboxDetailPage (falls back to useSearchParams). */
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  /**
   * Prefix for host proxy. Upstream API helpers already use `/api/v1/...` paths,
   * so base should be `/_bff/openshell` → browser hits `/_bff/openshell/api/v1/...`
   * which the host rewrites to `/api/v1/...` on the BFF.
   */
  apiBasePath: string;
  /** 401 handler for host session UX. */
  onSessionExpired: () => void;
};

export const consumedPages: {
  SandboxListPage: ComponentType<{
    workspace: string;
    onViewSandbox?: (name: string, tab?: string) => void;
  }>;
  SandboxDetailPage: ComponentType<{
    workspace: string;
    sandboxName: string;
    activeTab?: string;
    onTabChange?: (tab: string) => void;
  }>;
} = {
  SandboxListPage,
  SandboxDetailPage,
};

export const hostInventoryDemo: OpenshellHostInventory = {
  AlertProvider,
  apiBasePath: '/_bff/openshell',
  onSessionExpired: () => undefined,
  onViewSandbox: (name, tab) => {
    void name;
    void tab;
  },
};

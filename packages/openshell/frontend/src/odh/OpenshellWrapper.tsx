import * as React from 'react';
import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AlertProvider } from 'openshell-dashboard/components';
import { setApiBasePath, setSessionExpiredHandler } from 'openshell-dashboard/api';
import { BFF_API_BASE } from './const';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

// Must run before child queries mount (useEffect is too late → bare /api hits odh host 404).
setApiBasePath(BFF_API_BASE);

/**
 * Host inventory for PR #10 / #14 consume path:
 * QueryClient (v5 local), AlertProvider, api base path, session-expired handler.
 * Do not mount upstream LoginPage — odh owns auth.
 *
 * Spike auth: BFF runs with AUTH_DISABLED; do not forward ODH kube tokens
 * (module-federation.authorize=false). Clear any leftover openshell session token.
 */
const OpenshellWrapper: React.FC = () => {
  useEffect(() => {
    try {
      window.sessionStorage.removeItem('openshell-dashboard.token');
      window.sessionStorage.removeItem('openshell-dashboard.refreshToken');
      window.sessionStorage.removeItem('openshell-dashboard.devMode');
    } catch {
      // ignore
    }
    setSessionExpiredHandler(() => {
      // eslint-disable-next-line no-console
      console.warn(
        '[openshell] session expired (401) — map to odh logout / session-expired UX in auth-bridge',
      );
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AlertProvider>
        <Outlet />
      </AlertProvider>
    </QueryClientProvider>
  );
};

export default OpenshellWrapper;

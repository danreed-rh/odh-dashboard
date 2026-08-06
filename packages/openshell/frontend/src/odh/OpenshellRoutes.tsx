import * as React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import OpenshellWrapper from './OpenshellWrapper';
import { OPENSHELL_SANDBOXES_PATH } from './const';

const SandboxListRoute = React.lazy(() => import('./SandboxListRoute'));
const SandboxDetailRoute = React.lazy(() => import('./SandboxDetailRoute'));

/**
 * Nested routes under /openshell/* — list → detail via host navigate callbacks.
 */
const OpenshellRoutes: React.FC = () => (
  <Routes>
    <Route element={<OpenshellWrapper />}>
      <Route index element={<Navigate to={OPENSHELL_SANDBOXES_PATH} replace />} />
      <Route
        path="sandboxes"
        element={
          <React.Suspense fallback={null}>
            <SandboxListRoute />
          </React.Suspense>
        }
      />
      <Route
        path="sandboxes/:sandboxName"
        element={
          <React.Suspense fallback={null}>
            <SandboxDetailRoute />
          </React.Suspense>
        }
      />
      <Route path="*" element={<Navigate to={OPENSHELL_SANDBOXES_PATH} replace />} />
    </Route>
  </Routes>
);

export default OpenshellRoutes;

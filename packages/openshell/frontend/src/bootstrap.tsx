/**
 * Federated remote bootstrap. Host loads extensions via MF; this mount is for
 * standalone webpack serve smoke only.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <div>OpenShell MF remote — load via odh-dashboard host</div>
    </React.StrictMode>,
  );
}

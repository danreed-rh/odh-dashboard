import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { SandboxListPage } from 'openshell-dashboard/pages';
import { OPENSHELL_SANDBOXES_PATH, OPENSHELL_SPIKE_WORKSPACE } from './const';

/**
 * ODH-owned route: proves PR #10 host-owned navigation.
 * - onSelect: primary name/row click (upstream SandboxTableRow → onNameClick)
 * - onViewSandbox: kebab actions that open a specific tab (Logs / Terminal)
 */
const SandboxListRoute: React.FC = () => {
  const navigate = useNavigate();

  const openSandbox = (name: string, tab?: string) => {
    const tabQuery = tab && tab !== 'details' ? `?tab=${encodeURIComponent(tab)}` : '';
    navigate(`${OPENSHELL_SANDBOXES_PATH}/${encodeURIComponent(name)}${tabQuery}`);
  };

  return (
    <SandboxListPage
      workspace={OPENSHELL_SPIKE_WORKSPACE}
      onSelect={(name) => openSandbox(name)}
      onViewSandbox={openSandbox}
    />
  );
};

export default SandboxListRoute;

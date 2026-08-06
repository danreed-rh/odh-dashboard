import * as React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { SandboxDetailPage } from 'openshell-dashboard/pages';
import { OPENSHELL_SANDBOXES_PATH, OPENSHELL_SPIKE_WORKSPACE } from './const';

/**
 * ODH-owned route: proves PR #10 controlled tabs (activeTab / onTabChange).
 */
const SandboxDetailRoute: React.FC = () => {
  const { sandboxName = '' } = useParams<{ sandboxName: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = searchParams.get('tab') || 'details';

  if (!sandboxName) {
    navigate(OPENSHELL_SANDBOXES_PATH, { replace: true });
    return null;
  }

  return (
    <SandboxDetailPage
      workspace={OPENSHELL_SPIKE_WORKSPACE}
      sandboxName={decodeURIComponent(sandboxName)}
      activeTab={activeTab}
      onTabChange={(tab) => {
        if (tab === 'details') {
          setSearchParams({}, { replace: true });
        } else {
          setSearchParams({ tab }, { replace: true });
        }
      }}
    />
  );
};

export default SandboxDetailRoute;

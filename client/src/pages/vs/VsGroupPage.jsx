import React from 'react';
import { useParams } from 'react-router-dom';
// Constants
import { VS_GROUP_PAGE_URL } from '@/utils/constants/routes';
// Components
import AppPageHead from '@/components/utils/AppPageHead';
import AppPageShell from '@/components/common/AppPageShell';
import VsDetail from '@/components/vs/VsDetail';

// One Vs mode comparison (signed in, and in it): the medal table, everything compared, the
// badges, the link, your map and the starter's changes (VsDetail).
function VsGroupPage() {
  const { groupId } = useParams();
  return (
    <>
      <AppPageHead route={VS_GROUP_PAGE_URL} />
      <AppPageShell width='max-w-3xl' mainProps={{ 'aria-labelledby': 'vs-page-heading' }}>
        <VsDetail groupId={groupId} />
      </AppPageShell>
    </>
  );
}

export default VsGroupPage;

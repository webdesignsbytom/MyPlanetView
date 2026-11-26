import React from 'react';
// Constants
import { VS_PAGE_URL } from '@/utils/constants/routes';
// Hooks
import useMustVerifyEmail from '@/hooks/useMustVerifyEmail';
// Components
import AppPageHead from '@/components/utils/AppPageHead';
import AppPageShell from '@/components/common/AppPageShell';
import PageTitleCard from '@/components/common/PageTitleCard';
import VsListCard from '@/components/vs/VsListCard';
import VsCreateCard from '@/components/vs/VsCreateCard';

// Vs mode (docs/API.md "Vs mode"; signed in): the comparisons you're in, then starting one.
function VsPage() {
  const mustVerify = useMustVerifyEmail();
  return (
    <>
      <AppPageHead route={VS_PAGE_URL} />
      <AppPageShell width='max-w-3xl' mainProps={{ 'aria-labelledby': 'vs-list-heading' }}>
        <PageTitleCard
          page='Friends'
          title='Vs mode'
          headingId='vs-list-heading'
          subtitle='Everything compared with up to seven friends, with gold, silver and bronze for the top three. They see names and numbers, never your map.'
        />
        <VsListCard />
        <VsCreateCard locked={mustVerify} />
      </AppPageShell>
    </>
  );
}

export default VsPage;

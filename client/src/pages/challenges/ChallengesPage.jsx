import React from 'react';
// Constants
import { CHALLENGES_PAGE_URL } from '@/utils/constants/routes';
// Hooks
import useMustVerifyEmail from '@/hooks/useMustVerifyEmail';
// Components
import AppPageHead from '@/components/utils/AppPageHead';
import AppPageShell from '@/components/common/AppPageShell';
import PageTitleCard from '@/components/common/PageTitleCard';
import ChallengeListCard from '@/components/challenges/ChallengeListCard';
import ChallengeCreateCard from '@/components/challenges/ChallengeCreateCard';

// Friends challenges (docs/API.md, "Friends challenges"; signed in): the ones you're in,
// then starting one.
function ChallengesPage() {
  const mustVerify = useMustVerifyEmail();
  return (
    <>
      <AppPageHead route={CHALLENGES_PAGE_URL} />
      <AppPageShell width='max-w-3xl' mainProps={{ 'aria-labelledby': 'challenges-page-heading' }}>
        <PageTitleCard
          page='Friends'
          title='Challenges'
          headingId='challenges-page-heading'
          subtitle='Race your friends between two dates: new countries, landmarks, theme photos. They see names and counts, never your map.'
        />
        <ChallengeListCard />
        <ChallengeCreateCard locked={mustVerify} />
      </AppPageShell>
    </>
  );
}

export default ChallengesPage;

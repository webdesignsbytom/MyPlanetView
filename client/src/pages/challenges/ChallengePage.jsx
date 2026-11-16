import React from 'react';
import { useParams } from 'react-router-dom';
// Constants
import { CHALLENGE_PAGE_URL } from '@/utils/constants/routes';
// Components
import AppPageHead from '@/components/utils/AppPageHead';
import AppPageShell from '@/components/common/AppPageShell';
import ChallengeDetail from '@/components/challenges/ChallengeDetail';

// One friends challenge (signed in, and in it): its leaderboard, the invite link, your map
// and the starter's changes (ChallengeDetail).
function ChallengePage() {
  const { challengeId } = useParams();
  return (
    <>
      <AppPageHead route={CHALLENGE_PAGE_URL} />
      <AppPageShell width='max-w-3xl' mainProps={{ 'aria-labelledby': 'challenge-page-heading' }}>
        <ChallengeDetail challengeId={challengeId} />
      </AppPageShell>
    </>
  );
}

export default ChallengePage;

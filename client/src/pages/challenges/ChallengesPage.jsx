import React from 'react';
import { Link } from 'react-router-dom';
// Constants
import { CHALLENGES_PAGE_URL, VS_PAGE_URL } from '@/utils/constants/routes';
// Hooks
import useMustVerifyEmail from '@/hooks/useMustVerifyEmail';
// Components
import AppPageHead from '@/components/utils/AppPageHead';
import AppPageShell from '@/components/common/AppPageShell';
import PageTitleCard from '@/components/common/PageTitleCard';
import PaperCard from '@/components/common/PaperCard';
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
        {/* Vs mode (26 Nov 2026): everything at once, with medals, no dates */}
        <PaperCard title='Vs mode' titleId='challenges-vs-heading'>
          <p className='text-sm'>
            Rather compare everything at once? Countries, landmarks, badges, flights and more, with up to seven friends and gold, silver and bronze in each.{' '}
            <Link to={VS_PAGE_URL} className='font-medium underline underline-offset-4'>
              Open Vs mode
            </Link>
          </p>
        </PaperCard>
      </AppPageShell>
    </>
  );
}

export default ChallengesPage;

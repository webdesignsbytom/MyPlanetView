import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
// Api
import { getChallenge } from '@/api/challengesApi';
// Hooks
import useMustVerifyEmail from '@/hooks/useMustVerifyEmail';
// Constants
import { CHALLENGES_PAGE_URL } from '@/utils/constants/routes';
// Components
import PageTitleCard from '@/components/common/PageTitleCard';
import PaperCard from '@/components/common/PaperCard';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
import ChallengeLeaderboard from './ChallengeLeaderboard';
import ChallengeInviteCard from './ChallengeInviteCard';
import ChallengeMyMapCard from './ChallengeMyMapCard';
import ChallengeSettingsCard from './ChallengeSettingsCard';
// Utils
import { CHALLENGE_MEASURES, STATUS_WORDS, dateRange, measureLabel } from '@/utils/challenges/challengeWords';

// One challenge's page: what it counts and when, the leaderboard, the link to invite
// friends, the map that counts for you, and for the starter the changes and deleting it.
// Anyone not in it is told it doesn't exist (the server's 404).
function ChallengeDetail({ challengeId }) {
  const mustVerify = useMustVerifyEmail();
  const [state, setState] = useState({ challenge: null, error: null });

  useEffect(() => {
    let cancelled = false;
    setState({ challenge: null, error: null });
    getChallenge(challengeId)
      .then(({ challenge }) => {
        if (!cancelled) setState({ challenge, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ challenge: null, error: err.friendlyMessage || 'This challenge couldn’t be opened.' });
      });
    return () => {
      cancelled = true;
    };
  }, [challengeId]);

  const { challenge, error } = state;
  const replace = (updated) => setState({ challenge: updated, error: null });

  if (error) {
    return (
      <PaperCard title='Challenge' titleId='challenge-page-heading'>
        <p role='alert' className='text-sm'>
          {error}
        </p>
        <Link to={CHALLENGES_PAGE_URL} className='text-sm font-medium underline underline-offset-4'>
          Your challenges
        </Link>
      </PaperCard>
    );
  }
  if (!challenge) {
    return (
      <div className='grid place-items-center py-10' role='status'>
        <LoadingSpinner lg />
        <span className='sr-only'>Loading the challenge…</span>
      </div>
    );
  }

  return (
    <>
      <PageTitleCard
        page={STATUS_WORDS[challenge.status]}
        title={challenge.title}
        headingId='challenge-page-heading'
        subtitle={`${measureLabel(challenge.measure)}, ${dateRange(challenge)}${challenge.target ? `. First to ${challenge.target}.` : '.'}`}
      />
      <PaperCard title='Leaderboard' titleId='challenge-board-heading'>
        <p className='text-sm opacity-80'>{CHALLENGE_MEASURES[challenge.measure]?.description}</p>
        <ChallengeLeaderboard measure={challenge.measure} members={challenge.members} />
      </PaperCard>
      {challenge.status === 'ENDED' ? null : (
        <ChallengeInviteCard challenge={challenge} canReset={challenge.youStartedIt && !mustVerify} onChanged={replace} />
      )}
      <ChallengeMyMapCard challenge={challenge} locked={mustVerify} onChanged={replace} />
      {challenge.youStartedIt && !mustVerify ? <ChallengeSettingsCard challenge={challenge} onChanged={replace} /> : null}
    </>
  );
}

export default ChallengeDetail;

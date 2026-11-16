import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
// Api
import { getMyChallenges } from '@/api/challengesApi';
// Constants
import { challengePath } from '@/utils/constants/routes';
// Components
import PaperCard from '@/components/common/PaperCard';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
// Utils
import { STATUS_WORDS, countWords, dateRange, measureLabel } from '@/utils/challenges/challengeWords';

// The challenges you're in, newest joined first: each its title (a link to its page), what
// it counts, its dates and state, how many are in, and your own count. The ranks are on
// each challenge's page.
function ChallengeListCard() {
  const [state, setState] = useState({ challenges: null, error: null });

  useEffect(() => {
    let cancelled = false;
    getMyChallenges()
      .then(({ challenges }) => {
        if (!cancelled) setState({ challenges: challenges || [], error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ challenges: [], error: err.friendlyMessage || 'Your challenges couldn’t be loaded.' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const { challenges, error } = state;
  return (
    <PaperCard title='Your challenges' titleId='your-challenges-heading'>
      {challenges === null ? (
        <div className='grid place-items-center py-4' role='status'>
          <LoadingSpinner md />
          <span className='sr-only'>Loading your challenges…</span>
        </div>
      ) : error ? (
        <p role='alert' className='text-sm text-status-critical'>
          {error}
        </p>
      ) : challenges.length === 0 ? (
        <p className='text-sm'>None yet. Start one below and send your friends the link, or open a link a friend sent you.</p>
      ) : (
        <ul className='grid gap-3'>
          {challenges.map((challenge) => (
            <li key={challenge.id} className='ticket-edge grid gap-1 bg-paper-cream px-4 py-3'>
              <p className='grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2'>
                <Link to={challengePath(challenge.id)} className='font-travel text-lg uppercase leading-tight tracking-wide text-poster-red-deep underline underline-offset-4 hover:no-underline'>
                  {challenge.title}
                </Link>
                <span className='text-xs font-semibold uppercase tracking-wide text-colour9'>{STATUS_WORDS[challenge.status]}</span>
              </p>
              <p className='text-sm'>
                {measureLabel(challenge.measure)} · {dateRange(challenge)}
                {challenge.target ? ` · first to ${challenge.target}` : ''}
              </p>
              <p className='text-sm'>
                You: {challenge.counting ? countWords(challenge.measure, challenge.myCount) : 'no map counting'}
                {challenge.reachedTarget ? ' (target reached)' : ''} · {challenge.memberCount === 1 ? 'just you so far' : `${challenge.memberCount} people`}
              </p>
            </li>
          ))}
        </ul>
      )}
    </PaperCard>
  );
}

export default ChallengeListCard;

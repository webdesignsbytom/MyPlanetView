import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
// Api
import { getMyVsGroups } from '@/api/vsApi';
// Constants
import { vsPath } from '@/utils/constants/routes';
// Components
import PaperCard from '@/components/common/PaperCard';
import LoadingSpinner from '@/components/utils/LoadingSpinner';

/** The comparisons you're in, newest joined first (26 Nov 2026): each its title, a link, and how many are in. */
function VsListCard() {
  const [state, setState] = useState({ groups: null, error: null });

  useEffect(() => {
    let cancelled = false;
    getMyVsGroups()
      .then(({ groups }) => {
        if (!cancelled) setState({ groups: groups || [], error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ groups: [], error: err.friendlyMessage || 'Your comparisons couldn’t be loaded.' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const { groups, error } = state;
  return (
    <PaperCard title='Your comparisons' titleId='your-vs-heading'>
      {groups === null ? (
        <div className='grid place-items-center py-4' role='status'>
          <LoadingSpinner md />
          <span className='sr-only'>Loading your comparisons…</span>
        </div>
      ) : error ? (
        <p role='alert' className='text-sm text-status-critical'>
          {error}
        </p>
      ) : groups.length === 0 ? (
        <p className='text-sm'>None yet. Start one below and send your friends the link, or open a link a friend sent you.</p>
      ) : (
        <ul className='grid gap-3'>
          {groups.map((group) => (
            <li key={group.id} className='ticket-edge grid gap-1 bg-paper-cream px-4 py-3' data-vs-group={group.id}>
              <Link to={vsPath(group.id)} className='font-travel text-lg uppercase leading-tight tracking-wide text-poster-red-deep underline underline-offset-4 hover:no-underline'>
                {group.title}
              </Link>
              <p className='text-sm'>
                {group.memberCount === 1 ? 'Just you so far' : `${group.memberCount} people`}
                {group.youStartedIt ? ' · you started it' : ''}
                {group.hasMap ? '' : ' · no map counting for you'}
              </p>
            </li>
          ))}
        </ul>
      )}
    </PaperCard>
  );
}

export default VsListCard;

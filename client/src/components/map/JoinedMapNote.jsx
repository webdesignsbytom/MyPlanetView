import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
// Components
import LuggageTag from './LuggageTag';
import CloseStamp from '@/components/common/CloseStamp';
// Utils
import { ROLE_WITH_ARTICLE } from '@/utils/sharing/shareRoles';

/**
 * A luggage tag for someone who has just signed up from an invite and landed on the map they
 * were invited to (RegisterForm passes `joinedByInvite` in the address's state; 19 Nov 2026):
 * what they are on it, and that their own map waits under "Your maps". Closes with its stamp;
 * gone on the next visit, as the state goes with the history entry.
 */
function JoinedMapNote({ mapName, role, className = '' }) {
  const location = useLocation();
  const [closed, setClosed] = useState(false);
  if (closed || !location.state?.post?.joinedByInvite || role === 'OWNER') return null;

  return (
    <LuggageTag as='section' aria-label='Welcome' className={`max-w-[min(24rem,calc(100vw-1.5rem))] text-sm ${className}`}>
      <span className='grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2'>
        <span className='grid gap-1'>
          <span className='font-semibold'>
            Welcome! You’re {ROLE_WITH_ARTICLE[role] || 'a viewer'} of “{mapName}”.
          </span>
          <span className='text-xs'>Your own map is waiting for you under “Your maps”.</span>
        </span>
        <CloseStamp small label='Hide this note' onClick={() => setClosed(true)} />
      </span>
    </LuggageTag>
  );
}

export default JoinedMapNote;

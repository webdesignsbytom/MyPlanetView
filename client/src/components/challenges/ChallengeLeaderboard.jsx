import React from 'react';
// Icons
import { FaFlagCheckered } from 'react-icons/fa';
// Utils
import { countWords, ordinal } from '@/utils/challenges/challengeWords';

// A challenge's leaderboard (docs/API.md, "Friends challenges"): names and counts only,
// never a map, a photo or a place. With a target, those who reached it come first (the
// first there leads) with a chequered flag; equal places share a rank. "You" is marked,
// and someone whose map no longer counts says so.
function ChallengeLeaderboard({ measure, members }) {
  return (
    <ol className='grid gap-2' aria-label='Leaderboard'>
      {members.map((member, index) => (
        <li
          key={`${member.name}-${index}`}
          className={`grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3 border-2 px-3 py-2 ${
            member.isYou ? 'border-poster-red bg-paper-cream' : 'border-dashed border-poster-brown/50'
          }`}
        >
          <span className='font-travel text-xl uppercase leading-none text-colour9'>{ordinal(member.rank)}</span>
          <span className='grid min-w-0'>
            <span className='truncate font-semibold'>
              {member.name}
              {member.isYou ? ' (you)' : ''}
            </span>
            <span className='text-xs opacity-80'>
              {member.startedIt ? 'Started it' : null}
              {member.startedIt && !member.counting ? ' · ' : null}
              {member.counting ? null : 'No map counting'}
            </span>
          </span>
          <span className='grid grid-cols-reg items-center gap-1.5 text-sm font-medium'>
            {member.reachedTarget ? (
              <>
                <FaFlagCheckered aria-hidden='true' className='text-poster-red-deep' />
                <span className='sr-only'>Reached the target:</span>
              </>
            ) : null}
            {countWords(measure, member.count)}
          </span>
        </li>
      ))}
    </ol>
  );
}

export default ChallengeLeaderboard;

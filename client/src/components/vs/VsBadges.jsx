import React, { useState } from 'react';
// Utils
import { badgeWords } from '@/utils/achievements/badges';

const SHOWN = 12;

/**
 * Badges compared (26 Nov 2026): the badges some of the people counted have and others don't,
 * each with who has it, the rarest first; the ones everyone has are counted, not listed.
 */
function VsBadges({ members }) {
  const [all, setAll] = useState(false);
  const counted = members.filter((m) => m.counting);
  const holders = new Map();
  for (const member of counted) {
    for (const key of member.badges) {
      if (!holders.has(key)) holders.set(key, []);
      holders.get(key).push(member);
    }
  }
  const shared = [...holders.values()].filter((list) => list.length === counted.length).length;
  const some = [...holders.entries()]
    .filter(([, list]) => list.length < counted.length)
    .sort((a, b) => a[1].length - b[1].length || badgeWords(a[0]).name.localeCompare(badgeWords(b[0]).name));
  const shown = all ? some : some.slice(0, SHOWN);
  const who = (list) => list.map((m) => (m.isYou ? 'you' : m.name)).join(', ');

  return (
    <div className='grid gap-3' data-vs-badges=''>
      <p className='text-sm'>
        {counted.length < 2
          ? 'Once a friend joins, the badges one of you has and the other doesn’t show here.'
          : !some.length
            ? shared
              ? `You all have the same ${shared === 1 ? 'badge' : `${shared} badges`}.`
              : 'No badges yet.'
            : shared
              ? `${shared} ${shared === 1 ? 'badge' : 'badges'} you all have. These are the ones only some of you have:`
              : 'No badge yet that you all have. These are the ones only some of you have:'}
      </p>
      {counted.length >= 2 && some.length ? (
        <ul className='grid gap-1 text-sm sm:grid-cols-2'>
          {shown.map(([key, list]) => (
            <li key={key} className='grid border-b border-dashed border-poster-brown/40 py-1' data-vs-badge={key}>
              <span className='font-medium'>{badgeWords(key).name}</span>
              <span className='text-xs'>Only {who(list)}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {!all && some.length > SHOWN ? (
        <button type='button' onClick={() => setAll(true)} className='justify-self-start text-sm font-medium underline underline-offset-2'>
          Show all {some.length}
        </button>
      ) : null}
    </div>
  );
}

export default VsBadges;

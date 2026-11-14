import React from 'react';
import { Link } from 'react-router-dom';
// Constants
import { mapPath } from '@/utils/constants/routes';
// Utils
import { ROLE_LABELS } from '@/utils/sharing/shareRoles';
import { plural } from '@/utils/functions/plural';

// One map in the switcher, as a ticket: its name, whose it is (if not yours), and what's
// on it. The open map has a solid brown edge, the others a dashed one.
function MapSwitcherItem({ map, current, onPick }) {
  const details = [
    map.role === 'OWNER' ? null : `${ROLE_LABELS[map.role]}${map.ownerName ? `, ${map.ownerName}’s map` : ''}`,
    plural(map.counts?.countries ?? 0, 'country', 'countries'),
    plural(map.counts?.photos ?? 0, 'photo'),
  ].filter(Boolean);

  return (
    <li>
      <Link
        to={mapPath(map.id)}
        onClick={onPick}
        aria-current={current ? 'page' : undefined}
        className={`grid gap-0.5 border-2 border-poster-brown px-3 py-2 transition hover:border-solid hover:bg-poster-paper/30 ${
          current ? 'paper-aged text-poster-ink' : 'border-dashed'
        }`}
      >
        <span className='font-travel text-lg uppercase leading-tight tracking-wide'>{map.name}</span>
        <span className='text-xs opacity-80'>{details.join(' · ')}</span>
      </Link>
    </li>
  );
}

export default MapSwitcherItem;

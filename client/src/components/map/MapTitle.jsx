import React from 'react';
// Icons
import { IoChevronDown } from 'react-icons/io5';
// Utils
import { ROLE_LABELS } from '@/utils/sharing/shareRoles';
// Components
import LuggageTag from './LuggageTag';

const GROUP_LABELS = { SOLO: 'Solo', COUPLE: 'Couple', FAMILY: 'Family' };

// The map's name, top left, on a luggage tag. Opens the map switcher when there's one to open
// (`onIntent`: hovered, focused or pressed, to fetch the switcher's code first).
function MapTitle({ map, role, onOpenSwitcher, onIntent, shared = false }) {
  const detail = [
    GROUP_LABELS[map.groupType],
    role !== 'OWNER' ? `${ROLE_LABELS[role] || 'Viewer'}${shared ? ', from a shared link' : ''}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <LuggageTag
      as={onOpenSwitcher ? 'button' : 'div'}
      {...(onOpenSwitcher
        ? {
            type: 'button',
            onClick: onOpenSwitcher,
            onPointerEnter: onIntent,
            onFocus: onIntent,
            onPointerDown: onIntent,
            'aria-label': `${map.name}. Switch map`,
          }
        : {})}
      className={onOpenSwitcher ? 'transition hover:brightness-105' : ''}
    >
      <span className='grid grid-cols-rev items-center gap-2'>
        <span className='grid'>
          <span className='font-travel text-lg uppercase leading-tight tracking-wide text-poster-red-deep'>{map.name}</span>
          <span className='text-xs text-poster-ink/80'>{detail}</span>
        </span>
        {onOpenSwitcher ? <IoChevronDown aria-hidden='true' className='text-poster-brown' /> : null}
      </span>
    </LuggageTag>
  );
}

export default MapTitle;

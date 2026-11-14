import React from 'react';
// Icons
import { IoChevronDown } from 'react-icons/io5';
// Utils
import { ROLE_LABELS } from '@/utils/sharing/shareRoles';

const GROUP_LABELS = { SOLO: 'Solo', COUPLE: 'Couple', FAMILY: 'Family' };

// The map's name, top left. Opens the map switcher when there's one to open.
function MapTitle({ map, role, onOpenSwitcher, shared = false }) {
  const detail = [
    GROUP_LABELS[map.groupType],
    role !== 'OWNER' ? `${ROLE_LABELS[role] || 'Viewer'}${shared ? ', from a shared link' : ''}` : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const Tag = onOpenSwitcher ? 'button' : 'div';

  return (
    <Tag
      {...(onOpenSwitcher ? { type: 'button', onClick: onOpenSwitcher, 'aria-label': `${map.name}. Switch map` } : {})}
      className={`pointer-events-auto grid grid-cols-reg items-center gap-2 rounded-lg border-2 border-map-edge bg-map-panel px-3 py-1.5 text-left text-map-ink shadow-lift-sm ${
        onOpenSwitcher ? 'hover:brightness-105' : ''
      }`}
    >
      <span className='grid'>
        <span className='text-base font-semibold'>{map.name}</span>
        <span className='text-xs opacity-80'>{detail}</span>
      </span>
      {onOpenSwitcher ? <IoChevronDown aria-hidden='true' /> : null}
    </Tag>
  );
}

export default MapTitle;

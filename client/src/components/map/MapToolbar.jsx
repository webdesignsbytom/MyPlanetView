import React from 'react';
import { useNavigate } from 'react-router-dom';
// Icons
import { IoHome, IoSettings, IoShareSocial } from 'react-icons/io5';
import { IoIosImages, IoIosStats } from 'react-icons/io';
import { FaHistory, FaListOl, FaRoute } from 'react-icons/fa';
// Constants
import { HOME_PAGE_URL } from '@/utils/constants/routes';
// Components
import MapRoundButton from './MapRoundButton';

// The old site's tool strip, as a parchment strip of rubber stamps: a column on the
// right on wide screens, a row along the bottom on phones. `tools` lists which panels
// this viewer can open; settings comes last (the bottom of the column, the end of the row).
// `onIntent(id)` runs as a stamp is hovered, focused or pressed (to fetch its panel's code).
// With every tool (eight stamps), a phone's row packs them closer so it still fits a
// 390px screen without scrolling.
function MapToolbar({ openPanel, onToggle, onIntent, canUpload, canShare, showHome = true }) {
  const navigate = useNavigate();

  const tools = [
    { id: 'stats', label: 'Travel statistics', icon: <IoIosStats aria-hidden='true' /> },
    { id: 'countries', label: 'Country list', icon: <FaListOl aria-hidden='true' /> },
    { id: 'trips', label: 'Trips', icon: <FaRoute aria-hidden='true' /> },
    { id: 'timeline', label: 'Timeline', icon: <FaHistory aria-hidden='true' /> },
    ...(canUpload ? [{ id: 'upload', label: 'Add photos', icon: <IoIosImages aria-hidden='true' /> }] : []),
    ...(canShare ? [{ id: 'share', label: 'Share this map', icon: <IoShareSocial aria-hidden='true' /> }] : []),
    { id: 'settings', label: 'Map settings', icon: <IoSettings aria-hidden='true' /> },
  ];
  const crowded = tools.length + (showHome ? 1 : 0) >= 8;

  return (
    <nav
      aria-label='Map tools'
      className={`ticket-edge paper-aged pointer-events-auto grid max-w-[calc(100vw-1.5rem)] grid-flow-col overflow-x-auto py-3 md:max-w-none md:grid-flow-row md:gap-2 md:overflow-visible md:px-3 pointer-fine:gap-2.5 pointer-fine:px-3.25 pointer-fine:py-2.5 md:pointer-fine:px-2.5 md:pointer-fine:py-3.25 ${
        crowded ? 'gap-1 px-2' : 'gap-2 px-3'
      }`}
    >
      {showHome ? (
        <MapRoundButton label='Home page' onClick={() => navigate(HOME_PAGE_URL)}>
          <IoHome aria-hidden='true' />
        </MapRoundButton>
      ) : null}
      {tools.map((tool) => (
        <MapRoundButton
          key={tool.id}
          label={tool.label}
          pressed={openPanel === tool.id}
          onClick={() => onToggle(tool.id)}
          onIntent={onIntent ? () => onIntent(tool.id) : undefined}
        >
          {tool.icon}
        </MapRoundButton>
      ))}
    </nav>
  );
}

export default MapToolbar;

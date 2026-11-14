import React from 'react';
import { useNavigate } from 'react-router-dom';
// Icons
import { IoHome, IoSettings, IoShareSocial } from 'react-icons/io5';
import { IoIosImages, IoIosStats } from 'react-icons/io';
import { FaListOl, FaRoute } from 'react-icons/fa';
// Constants
import { HOME_PAGE_URL } from '@/utils/constants/routes';
// Components
import MapRoundButton from './MapRoundButton';

// The old site's tool strip: a column on the right on wide screens, a row along the
// bottom on phones. `tools` lists which panels this viewer can open.
function MapToolbar({ openPanel, onToggle, canUpload, canShare, showHome = true }) {
  const navigate = useNavigate();

  const tools = [
    { id: 'settings', label: 'Map settings', icon: <IoSettings aria-hidden='true' /> },
    { id: 'stats', label: 'Travel statistics', icon: <IoIosStats aria-hidden='true' /> },
    { id: 'countries', label: 'Country list', icon: <FaListOl aria-hidden='true' /> },
    { id: 'trips', label: 'Trips', icon: <FaRoute aria-hidden='true' /> },
    ...(canUpload ? [{ id: 'upload', label: 'Add photos', icon: <IoIosImages aria-hidden='true' /> }] : []),
    ...(canShare ? [{ id: 'share', label: 'Share this map', icon: <IoShareSocial aria-hidden='true' /> }] : []),
  ];

  return (
    <nav
      aria-label='Map tools'
      className='pointer-events-auto grid max-w-[calc(100vw-1.5rem)] grid-flow-col gap-2 overflow-x-auto rounded-full border-2 border-map-edge bg-map-panel-alt px-3 py-2 shadow-lift md:max-w-none md:grid-flow-row md:overflow-visible md:px-2 md:py-3'
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
        >
          {tool.icon}
        </MapRoundButton>
      ))}
    </nav>
  );
}

export default MapToolbar;

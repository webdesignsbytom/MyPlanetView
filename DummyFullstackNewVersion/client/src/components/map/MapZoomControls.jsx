import React from 'react';
// Icons
import { FiMinus, FiPlus } from 'react-icons/fi';
import { TbWorld } from 'react-icons/tb';
// Components
import MapRoundButton from './MapRoundButton';

// Zoom buttons for anyone without a wheel or a pinch
function MapZoomControls({ viewport }) {
  return (
    <div className='grid gap-2' role='group' aria-label='Zoom'>
      <MapRoundButton label='Zoom in' onClick={viewport.zoomIn}>
        <FiPlus aria-hidden='true' />
      </MapRoundButton>
      <MapRoundButton label='Zoom out' onClick={viewport.zoomOut}>
        <FiMinus aria-hidden='true' />
      </MapRoundButton>
      <MapRoundButton label='Show the whole world' onClick={viewport.reset}>
        <TbWorld aria-hidden='true' />
      </MapRoundButton>
    </div>
  );
}

export default MapZoomControls;

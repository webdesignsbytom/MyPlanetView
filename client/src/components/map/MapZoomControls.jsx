import React from 'react';
// Icons
import { FiMinus, FiPlus } from 'react-icons/fi';
import { TbWorld } from 'react-icons/tb';
// Components
import MapRoundButton from './MapRoundButton';

// Zoom buttons for anyone without a wheel or a pinch: rubber stamps on a parchment strip,
// like the toolbar, in a row (a column covered New Zealand in the bottom-right corner)
function MapZoomControls({ viewport }) {
  return (
    <div className='ticket-edge paper-aged grid grid-flow-col gap-2 p-3 pointer-fine:gap-2.5 pointer-fine:px-3.25 pointer-fine:py-2.5' role='group' aria-label='Zoom'>
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

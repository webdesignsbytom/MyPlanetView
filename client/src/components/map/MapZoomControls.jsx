import React from 'react';
// Icons
import { FiMinus, FiPlus } from 'react-icons/fi';
import { TbWorld } from 'react-icons/tb';
// Components
import MapRoundButton from './MapRoundButton';

// Zoom buttons for anyone without a wheel or a pinch: rubber stamps on a parchment strip,
// like the toolbar, in a row (a column covered New Zealand in the bottom-right corner):
// minus, then plus (19 Nov 2026, the user's wish). The third shows everything: the world,
// or on a country's own map (CountryMapView) the country (`resetLabel`, `onReset`). On touch
// screens (phones and tablets) the whole strip is drawn 10% smaller (CSS `zoom`, which
// shrinks its box and tap targets too, not only the drawing; 19 Nov 2026, the user's wish).
function MapZoomControls({ viewport, resetLabel = 'Show the whole world', onReset }) {
  return (
    <div className='ticket-edge paper-aged grid grid-flow-col gap-2 p-3 pointer-coarse:[zoom:0.9] pointer-fine:gap-2.5 pointer-fine:px-3.25 pointer-fine:py-2.5' role='group' aria-label='Zoom'>
      <MapRoundButton label='Zoom out' onClick={viewport.zoomOut}>
        <FiMinus aria-hidden='true' />
      </MapRoundButton>
      <MapRoundButton label='Zoom in' onClick={viewport.zoomIn}>
        <FiPlus aria-hidden='true' />
      </MapRoundButton>
      <MapRoundButton label={resetLabel} onClick={onReset ?? viewport.reset}>
        <TbWorld aria-hidden='true' />
      </MapRoundButton>
    </div>
  );
}

export default MapZoomControls;

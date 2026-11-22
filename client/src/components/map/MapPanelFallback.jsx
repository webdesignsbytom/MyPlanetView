import React from 'react';
// Components
import MapPanel from './MapPanel';
import LoadingSpinner from '@/components/utils/LoadingSpinner';

// Stands in for a map panel whose code is still on its way (a slow connection), or
// couldn't be fetched (`failed`). Loading takes no focus, so the real panel still knows
// what opened it.
function MapPanelFallback({ failed = false, onClose }) {
  if (failed) {
    return (
      <MapPanel title='Not opened' onClose={onClose}>
        <p role='alert' className='text-sm'>
          This couldn’t be opened. Check your connection, then reload the page.
        </p>
      </MapPanel>
    );
  }
  return (
    <div role='status' className='ticket-edge pointer-events-auto grid w-full place-items-center bg-paper-cream px-5 py-6 md:w-[28.5rem]'>
      <LoadingSpinner />
    </div>
  );
}

export default MapPanelFallback;

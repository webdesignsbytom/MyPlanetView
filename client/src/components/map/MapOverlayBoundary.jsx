import React, { Suspense } from 'react';
// Components
import MapPanelFallback from './MapPanelFallback';
// Utils
import ErrorBoundary from '@/utils/error/ErrorBoundary';

// A lazy dialog over the map (sharing, the photo viewer, the slideshow, the tips, paying for
// a map) inside its own error boundary: code that couldn't download (offline), or a render
// error, shows "Not opened" with a close stamp instead of replacing the whole map page, and
// the next open tries again (lazyMapPanels.js gives a fresh component; 19 Nov 2026, the audit)
function MapOverlayBoundary({ onClose, children }) {
  return (
    <ErrorBoundary
      fallback={
        <div className='fixed inset-0 z-50 grid place-items-center p-3'>
          <MapPanelFallback failed onClose={onClose} />
        </div>
      }
    >
      <Suspense fallback={null}>{children}</Suspense>
    </ErrorBoundary>
  );
}

export default MapOverlayBoundary;

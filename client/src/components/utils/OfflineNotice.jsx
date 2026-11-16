import React, { useSyncExternalStore } from 'react';
// Components
import LuggageTag from '../map/LuggageTag';

// Whether the browser is online, as a store: the first render (and the pre-render) says
// online, so hydration matches; the real answer comes straight after
const subscribe = (onChange) => {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
};
const isOnline = () => navigator.onLine;
const onlineAtBuild = () => true;

// The installed app (PWA) can open with no connection: it says so instead of an empty
// map, and goes once the connection is back (docs/FEATURE-PLAN.md, "Installable app")
function OfflineNotice() {
  const online = useSyncExternalStore(subscribe, isOnline, onlineAtBuild);
  if (online) return null;
  return (
    <div className='pointer-events-none fixed inset-x-0 bottom-4 z-50 grid justify-items-center px-4'>
      <LuggageTag role='status' className='max-w-sm'>
        <p className='font-main text-sm'>
          <strong className='font-semibold'>You’re offline.</strong> Your map needs a connection; it will come back by
          itself when you’re online.
        </p>
      </LuggageTag>
    </div>
  );
}

export default OfflineNotice;

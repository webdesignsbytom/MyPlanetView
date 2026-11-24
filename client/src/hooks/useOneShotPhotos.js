import { useEffect, useState } from 'react';

// Life's One Shots' photo credits (utils/oneShots/oneShotPhotos.js, generated) are their own
// chunk, fetched the first time they're wanted and kept for the session, as the landmarks'
// (hooks/useLandmarkPhotos.js). Until they arrive the items show without photos.
let loaded = null;
let pending = null;

export function preloadOneShotPhotos() {
  pending ||= import('@/utils/oneShots/oneShotPhotos').then(
    (module) => (loaded = module),
    (err) => {
      pending = null;
      throw err;
    },
  );
  return pending;
}

export default function useOneShotPhotos({ enabled = true } = {}) {
  const [data, setData] = useState(loaded);
  useEffect(() => {
    if (!enabled) return undefined;
    if (loaded) {
      setData(loaded);
      return undefined;
    }
    let live = true;
    preloadOneShotPhotos().then(
      (module) => live && setData(module),
      () => {},
    );
    return () => {
      live = false;
    };
  }, [enabled]);
  return enabled ? data : null;
}

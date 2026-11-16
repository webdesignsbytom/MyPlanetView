import { useEffect, useState } from 'react';

// The landmark photos' credits (utils/map/landmarkPhotos.js, generated: about 1,300
// entries) are their own chunk, fetched the first time a landmark list shows and kept
// for the session. Until they arrive the list shows without photos.
let loaded = null;
let pending = null;

export function preloadLandmarkPhotos() {
  pending ||= import('@/utils/map/landmarkPhotos').then(
    (module) => (loaded = module),
    (err) => {
      pending = null;
      throw err;
    },
  );
  return pending;
}

export default function useLandmarkPhotos() {
  const [data, setData] = useState(loaded);
  useEffect(() => {
    if (loaded) return undefined;
    let live = true;
    preloadLandmarkPhotos().then(
      (module) => live && setData(module),
      () => {},
    );
    return () => {
      live = false;
    };
  }, []);
  return data;
}

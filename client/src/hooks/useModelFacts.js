import { useEffect, useState } from 'react';

// What the landmark models' cards say about their places (utils/map/landmarkModelFacts.js,
// generated: a few sentences and facts for each of the 885 models, about 200 KB gzip) is its
// own chunk, fetched the first time a card opens and kept for the session. Until it arrives
// the card shows without them.
let loaded = null;
let pending = null;

export function preloadModelFacts() {
  pending ||= import('@/utils/map/landmarkModelFacts').then(
    (module) => (loaded = module),
    (err) => {
      pending = null;
      throw err;
    },
  );
  return pending;
}

export default function useModelFacts() {
  const [data, setData] = useState(loaded);
  useEffect(() => {
    if (loaded) return undefined;
    let live = true;
    preloadModelFacts().then(
      (module) => live && setData(module),
      () => {},
    );
    return () => {
      live = false;
    };
  }, []);
  return data;
}

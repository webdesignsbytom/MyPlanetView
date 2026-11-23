import { useEffect, useState } from 'react';
// Api
import { getLandmarks } from '@/api/travelApi';
// Utils
import { isUkNation } from '@/utils/map/ukNations';
import { inRegionArea, isRegion, regionParent } from '@/utils/map/regionPlaces';

// Landmarks are reference data (seeded, never edited by users), so they're fetched once
// per session, all of them (1,366 since 23 Nov 2026, about 90 kB gzipped; the browser keeps
// the answer an hour): the map's pins, every country's list and the photo, stop and moment
// forms all come from that one request. A failed request is forgotten, so the next use
// tries again.
let all = null;
let allLoaded = null; // the list itself, once it's here
const byCountry = new Map();

function loadAll() {
  all ||= getLandmarks()
    .then(({ landmarks }) => (allLoaded = landmarks || []))
    .catch((err) => {
      all = null;
      throw err;
    });
  return all;
}

// One array per country, so a country's list keeps its identity between uses. A UK nation's
// (a map that splits the UK) are the UK landmarks the server says are in it (`nation`); a
// region's (Bali), its country's landmarks inside it (regionPlaces.js REGION_AREA).
const inPlace = (code) => {
  if (isUkNation(code)) return (l) => l.nation === code;
  if (isRegion(code)) return (l) => l.countryCode === regionParent(code) && inRegionArea(code, l.latitude, l.longitude);
  return (l) => l.countryCode === code;
};
function pick(list, countryCode) {
  if (!countryCode) return list;
  if (!byCountry.has(countryCode)) byCountry.set(countryCode, list.filter(inPlace(countryCode)));
  return byCountry.get(countryCode);
}

/** Start fetching the landmarks before anything asks (the map page, when pins will show). */
export function preloadLandmarks() {
  return loadAll().catch(() => {});
}

/** Landmarks in one country, or every landmark when `countryCode` is empty. */
export default function useLandmarks(countryCode, { enabled = true } = {}) {
  const [state, setState] = useState({ landmarks: [], loading: false, error: null });

  useEffect(() => {
    if (!enabled) return undefined;
    // Already here: straight in, with no "Loading" in between
    if (allLoaded) {
      setState({ landmarks: pick(allLoaded, countryCode), loading: false, error: null });
      return undefined;
    }
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    loadAll()
      .then((list) => pick(list, countryCode))
      .then((landmarks) => {
        if (!cancelled) setState({ landmarks, loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ landmarks: [], loading: false, error: err.friendlyMessage || 'Landmarks could not be loaded.' });
      });
    return () => {
      cancelled = true;
    };
  }, [countryCode, enabled]);

  return state;
}

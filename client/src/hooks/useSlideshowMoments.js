import { useEffect, useState } from 'react';
// Api
import { getMomentPage } from '@/api/travelApi';

const PAGE = 60;
// Enough for a family's story; a show with more plays the first this many
const MOST_PAGES = 5;
const NONE = [];

/**
 * The dated moments a slideshow puts between its photos (docs/FEATURE-PLAN.md, "Moments":
 * slideshows), oldest first: the map's, a trip's or a share link's (`source`), one
 * `country`'s when the show is a country's. Undated notes have no place in a show in date
 * order, so they're left out; a shuffled show has none (`enabled` false). A failure
 * leaves the show without them, never stops it. `ready` once they're in (or none are
 * wanted), so the show starts with its slides in their final order.
 * -> `{ moments: [moment], ready }`
 */
export default function useSlideshowMoments({ source, country = null, enabled = true }) {
  const [state, setState] = useState({ moments: NONE, ready: !enabled });
  const { mapId, tripId, shareCode } = source;

  useEffect(() => {
    if (!enabled) {
      setState({ moments: NONE, ready: true });
      return undefined;
    }
    setState({ moments: NONE, ready: false });
    let cancelled = false;
    (async () => {
      const all = [];
      let cursor;
      for (let page = 0; page < MOST_PAGES; page += 1) {
        const result = await getMomentPage({ mapId, tripId, shareCode, country: country || undefined, cursor, limit: PAGE });
        all.push(...(result.moments || []));
        cursor = result.nextCursor;
        if (!cursor) break;
      }
      if (!cancelled) setState({ moments: all.filter((moment) => moment.happenedOn), ready: true });
    })().catch(() => {
      if (!cancelled) setState({ moments: NONE, ready: true });
    });
    return () => {
      cancelled = true;
    };
  }, [mapId, tripId, shareCode, country, enabled]);

  return state;
}

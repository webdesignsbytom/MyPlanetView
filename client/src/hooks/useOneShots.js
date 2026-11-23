import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
// Api
import { deleteOneShot, getOneShots, saveOneShot } from '@/api/travelApi';

/**
 * A map's Life's One Shots (docs/API.md "Life's One Shots"): its ticks, and for the owner and
 * editors what its flights suggest, loaded with the map (`mapId`, or a share link's
 * `shareCode`; neither: nothing). `save(itemKey, body)` ticks one or changes its tick and
 * answers the server's `{ oneShot, created, countryCode }`; `remove(itemKey)` takes one off at
 * once, and if the server says no, reads the list again (so it comes back). A failed read leaves the list empty, with
 * `error` saying so; `reload()` asks again.
 */
export default function useOneShots({ mapId = null, shareCode = null }) {
  const [state, setState] = useState({ oneShots: [], suggestions: [], loading: Boolean(mapId || shareCode), error: null });
  const runRef = useRef(0);

  const load = useCallback(async () => {
    if (!mapId && !shareCode) return;
    const run = ++runRef.current;
    try {
      const { oneShots = [], suggestions = [] } = await getOneShots({ mapId, shareCode });
      if (run === runRef.current) setState({ oneShots, suggestions, loading: false, error: null });
    } catch (err) {
      if (run === runRef.current) setState((prev) => ({ ...prev, loading: false, error: err?.friendlyMessage || 'Life’s One Shots couldn’t be loaded.' }));
    }
  }, [mapId, shareCode]);

  useEffect(() => {
    setState({ oneShots: [], suggestions: [], loading: Boolean(mapId || shareCode), error: null });
    load();
  }, [load, mapId, shareCode]);

  const save = useCallback(
    async (itemKey, body) => {
      const answer = await saveOneShot(mapId, itemKey, body);
      setState((prev) => ({
        ...prev,
        oneShots: [answer.oneShot, ...prev.oneShots.filter((tick) => tick.itemKey !== itemKey)],
        suggestions: prev.suggestions.filter((suggestion) => suggestion.itemKey !== itemKey),
      }));
      return answer;
    },
    [mapId],
  );

  const remove = useCallback(
    async (itemKey) => {
      setState((prev) => ({ ...prev, oneShots: prev.oneShots.filter((tick) => tick.itemKey !== itemKey) }));
      try {
        await deleteOneShot(mapId, itemKey);
      } catch (err) {
        // The server's word on what's ticked: the tick comes back
        await load();
        throw err;
      }
      // What it was ticked from may be suggested again
      load();
    },
    [mapId, load],
  );

  return { ...state, save, remove, reload: load };
}

// The map page's One Shots for what's deep in its panels (a country's ticket lists what's been
// seen there): `{ oneShots, open(itemKey) }`, `open` null where the panel can't be opened
export const OneShotsContext = createContext(Object.freeze({ oneShots: [], open: null }));

export const useOneShotsHere = () => useContext(OneShotsContext);

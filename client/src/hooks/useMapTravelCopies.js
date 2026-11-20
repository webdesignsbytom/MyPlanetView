import { useCallback, useEffect, useRef, useState } from 'react';
// Api
import { continueTravelCopy, getMapTravelCopies } from '@/api/travelCopiesApi';

// A wait between runs when one made no progress (another run is copying it)
const IDLE_WAIT_MS = 2000;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * A map's requests to copy travels (docs/API.md, "Travel copies"), for its owner or a
 * co-owner: `incoming` (from this map, to decide) and `outgoing` (onto it, asked by them).
 * An approved copy is carried on here, a run after another, until it's done (the daily cron
 * finishes any left). `put(request)` puts a changed request in its list.
 */
export default function useMapTravelCopies(mapId, { enabled = true } = {}) {
  const [state, setState] = useState({ incoming: [], outgoing: [], loading: enabled, error: null });
  const alive = useRef(true);
  const running = useRef(new Set());

  const reload = useCallback(async () => {
    if (!enabled || !mapId) return;
    try {
      const { incoming = [], outgoing = [] } = await getMapTravelCopies(mapId);
      if (alive.current) setState({ incoming, outgoing, loading: false, error: null });
    } catch (err) {
      if (alive.current) setState((s) => ({ ...s, loading: false, error: err.friendlyMessage || 'The requests couldn’t be loaded.' }));
    }
  }, [mapId, enabled]);

  useEffect(() => {
    alive.current = true;
    reload();
    return () => {
      alive.current = false;
    };
  }, [reload]);

  const put = useCallback(
    (request) =>
      setState((s) => {
        const swap = (list) => list.map((r) => (r.id === request.id ? { ...r, ...request } : r));
        return { ...s, incoming: swap(s.incoming), outgoing: swap(s.outgoing) };
      }),
    [],
  );

  // Carry each approved copy on to the end, one run at a time
  useEffect(() => {
    for (const request of [...state.incoming, ...state.outgoing]) {
      if (request.status !== 'APPROVED' || running.current.has(request.id)) continue;
      running.current.add(request.id);
      (async () => {
        let current = request;
        try {
          while (alive.current && current.status === 'APPROVED') {
            const before = current.progress.done;
            current = (await continueTravelCopy(current.id)).request;
            if (!current) break;
            if (alive.current) put(current);
            if (current.status === 'APPROVED' && current.progress.done === before) await wait(IDLE_WAIT_MS);
          }
        } catch {
          // Left for the next visit, or the daily cron
        } finally {
          running.current.delete(request.id);
        }
      })();
    }
  }, [state.incoming, state.outgoing, put]);

  return { ...state, reload, put };
}

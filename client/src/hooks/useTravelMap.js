import { useCallback, useEffect, useRef, useState } from 'react';
// Api
import {
  createTraveller,
  createTrip,
  deleteTraveller,
  deleteVisit,
  getMap,
  getMapStats,
  getMapTrips,
  putVisit,
  removeTripFromMap,
  tickLandmark,
  untickLandmark,
  updateMap,
  updateTraveller,
} from '@/api/travelApi';
// Utils
import { forgetMapLists } from '@/utils/map/mapListCache';
import { impliedVisits } from '@/utils/map/specialPlaces';

const EMPTY = { map: null, trips: [], loading: true, error: null };

// Visits put in place of the ones with the same country (or added)
const withVisits = (visits, changed) => {
  if (!changed?.length) return visits;
  const codes = new Set(changed.map((v) => v.countryCode));
  return [...visits.filter((v) => !codes.has(v.countryCode)), ...changed];
};

/**
 * One travel map: its details, travellers, visited countries, stats and trips, with
 * the changes an editor can make. Visit changes show at once and roll back on failure;
 * with `optimistic: false` (an email address not verified yet, which the server refuses)
 * they wait for the server, so nothing flickers on and off. A visit that brings another
 * with it (the South Pole visited: Antarctica too, the server's `implied`) shows both
 * together, and rolls both back together.
 */
// Is the map on show still the one a change was made to? One answered after the page moved
// to another map must never land on that map (19 Nov 2026, the audit)
const onMap = (prev, mapId) => prev.map?.id === mapId;

export default function useTravelMap(mapId, { optimistic = true } = {}) {
  const [state, setState] = useState(EMPTY);
  const optimisticRef = useRef(optimistic);
  useEffect(() => {
    optimisticRef.current = optimistic;
  }, [optimistic]);

  // Only the newest load's answer counts (17 Nov 2026, the audit): on /map the remembered
  // map starts loading before the map list confirms it, and a slower answer for that one
  // (or its 404) must never replace the map that's open
  const loadRef = useRef(0);
  // Refreshes are numbered too (below), and visit changes counted: started, and still saving
  const refreshRef = useRef(0);
  const editsRef = useRef({ started: 0, pending: 0 });
  const load = useCallback(async () => {
    if (!mapId) return;
    const run = ++loadRef.current;
    refreshRef.current += 1;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [{ map }, { trips }] = await Promise.all([getMap(mapId), getMapTrips(mapId)]);
      if (run !== loadRef.current) return;
      setState({ map, trips: trips || [], loading: false, error: null });
    } catch (err) {
      if (run !== loadRef.current) return;
      setState({ map: null, trips: [], loading: false, error: err.friendlyMessage || 'This map could not be loaded.' });
    }
  }, [mapId]);

  useEffect(() => {
    setState(EMPTY);
    load();
  }, [load]);

  // The map and its trips again, without the loading state (the map stays on screen):
  // after photos change, as an upload or a photo's new country can add a PHOTO visit,
  // and moving or deleting photos changes the trips' counts
  // Only the newest refresh's answer counts, and a load drops any refresh before it. A visit
  // changed since one was asked for, or still being saved when it was, keeps the visits on
  // screen: the server may have answered before the change was saved (19 Nov 2026, the audit:
  // a country marked with a new moment flipped back to unmarked)
  // The visits a reply brought that were set aside (an upload's PHOTO visit, say) come with
  // the next one: asked for once every visit change is saved (setVisit), or at once
  const staleVisitsRef = useRef(false);
  const refresh = useCallback(async () => {
    if (!mapId) return;
    const ask = async () => {
      const run = ++refreshRef.current;
      const edits = { ...editsRef.current };
      try {
        const [{ map }, { trips }] = await Promise.all([getMap(mapId), getMapTrips(mapId)]);
        if (run !== refreshRef.current) return;
        const visitsMoved = edits.pending > 0 || editsRef.current.started !== edits.started;
        // Never onto another map (the page moved on while it was asked for)
        setState((prev) => {
          if (!(prev.map && map && prev.map.id === map.id)) return prev;
          const next = visitsMoved ? { ...map, visits: prev.map.visits, stats: prev.map.stats } : map;
          return { ...prev, map: next, trips: trips || prev.trips };
        });
        if (visitsMoved) {
          if (editsRef.current.pending) staleVisitsRef.current = true;
          else await ask();
        }
      } catch {
        // A nicety; the next full load corrects it
      }
    };
    await ask();
  }, [mapId]);

  const refreshStats = useCallback(async () => {
    try {
      const { stats } = await getMapStats(mapId);
      setState((prev) => (prev.map?.id === mapId ? { ...prev, map: { ...prev.map, stats } } : prev));
    } catch {
      // Stats are a nicety; the next full load corrects them
    }
  }, [mapId]);

  // status: 'VISITED' | 'LIVED' | 'WANT_TO_GO', or null to clear the country
  const setVisit = useCallback(
    async (countryCode, status, extra = {}) => {
      // A failure undoes only this change: this country and what it brought with it, as
      // they were (17 Nov 2026, the audit: the whole list came back, undoing other
      // countries changed meanwhile)
      let restore = null;
      const show = () =>
        setState((prev) => {
          if (!onMap(prev, mapId)) return prev;
          const implied = status ? impliedVisits(prev.map.visits, countryCode, status) : [];
          const affected = new Set([countryCode, ...implied.map((v) => v.countryCode)]);
          const before = prev.map.visits.filter((v) => affected.has(v.countryCode));
          restore = (visits) => [...visits.filter((v) => !affected.has(v.countryCode)), ...before];
          const others = prev.map.visits.filter((v) => v.countryCode !== countryCode);
          const current = prev.map.visits.find((v) => v.countryCode === countryCode);
          const visits = status
            ? withVisits(
                [...others, { ...(current || { source: 'MANUAL', firstVisitedOn: null, notes: null }), countryCode, status, ...extra }],
                implied,
              )
            : others;
          return { ...prev, map: { ...prev.map, visits } };
        });
      // The server's word on what the change brought with it
      const showImplied = (implied) =>
        setState((prev) =>
          onMap(prev, mapId) && implied?.length ? { ...prev, map: { ...prev.map, visits: withVisits(prev.map.visits, implied) } } : prev,
        );
      const optimisticNow = optimisticRef.current;
      editsRef.current.started += 1;
      editsRef.current.pending += 1;
      if (optimisticNow) show();
      try {
        const answer = status ? await putVisit(mapId, countryCode, { status, ...extra }) : await deleteVisit(mapId, countryCode);
        if (!optimisticNow) show();
        showImplied(answer?.implied);
        refreshStats();
      } catch (err) {
        setState((prev) => (onMap(prev, mapId) && restore ? { ...prev, map: { ...prev.map, visits: restore(prev.map.visits) } } : prev));
        throw err;
      } finally {
        editsRef.current.pending -= 1;
        if (!editsRef.current.pending && staleVisitsRef.current) {
          staleVisitsRef.current = false;
          refresh();
        }
      }
    },
    [mapId, refresh, refreshStats],
  );

  const saveMapDetails = useCallback(
    async (body) => {
      const { map } = await updateMap(mapId, body);
      forgetMapLists(); // the switcher lists maps by name
      // PATCH's answer has no `ads` (only GET /maps/:mapId says how often cards show): keep it
      setState((prev) => (onMap(prev, mapId) ? { ...prev, map: map ? { ...map, ads: map.ads ?? prev.map?.ads } : prev.map } : prev));
    },
    [mapId],
  );

  // The map's style, for everyone who opens it (docs/API.md "Map styles"; the owner and
  // co-owners): shown at once, then saved; if the save fails, the map is read again, so it
  // shows the style it really has
  const setMapStyle = useCallback(
    async (style) => {
      setState((prev) => (onMap(prev, mapId) ? { ...prev, map: { ...prev.map, style } } : prev));
      try {
        await updateMap(mapId, { style });
      } catch {
        refresh();
      }
    },
    [mapId, refresh],
  );

  // The map's own design as it now stands (docs/API.md "Map designs"): shown at once while
  // it's edited, and with the server's answer after each save
  const setDesign = useCallback(
    (design) => setState((prev) => (onMap(prev, mapId) ? { ...prev, map: { ...prev.map, design } } : prev)),
    [mapId],
  );

  // A landmark ticked "been here", or not (docs/API.md "Collecting"): shown at once, undone if
  // it fails. A tick can mark its country visited, so the map is read again quietly after one.
  const setLandmarkBeen = useCallback(
    async (landmarkId, been) => {
      const apply = (on) =>
        setState((prev) => {
          if (!onMap(prev, mapId)) return prev;
          const ids = (prev.map.tickedLandmarkIds || []).filter((id) => id !== landmarkId);
          return { ...prev, map: { ...prev.map, tickedLandmarkIds: on ? [...ids, landmarkId] : ids } };
        });
      apply(been);
      try {
        if (been) {
          await tickLandmark(mapId, landmarkId);
          refresh();
        } else await untickLandmark(mapId, landmarkId);
      } catch (err) {
        apply(!been);
        throw err;
      }
    },
    [mapId, refresh],
  );

  const addTraveller = useCallback(
    async (body) => {
      const { traveller } = await createTraveller(mapId, body);
      setState((prev) =>
        onMap(prev, mapId) ? { ...prev, map: { ...prev.map, travellers: [...prev.map.travellers, traveller] } } : prev,
      );
      return traveller;
    },
    [mapId],
  );

  const editTraveller = useCallback(
    async (travellerId, body) => {
      const { traveller } = await updateTraveller(mapId, travellerId, body);
      setState((prev) =>
        onMap(prev, mapId)
          ? {
              ...prev,
              map: { ...prev.map, travellers: prev.map.travellers.map((t) => (t.id === travellerId ? traveller : t)) },
            }
          : prev,
      );
    },
    [mapId],
  );

  const removeTraveller = useCallback(
    async (travellerId) => {
      await deleteTraveller(mapId, travellerId);
      setState((prev) =>
        onMap(prev, mapId)
          ? { ...prev, map: { ...prev.map, travellers: prev.map.travellers.filter((t) => t.id !== travellerId) } }
          : prev,
      );
    },
    [mapId],
  );

  const addTrip = useCallback(
    async (body) => {
      const { trip } = await createTrip(mapId, body);
      setState((prev) => (onMap(prev, mapId) ? { ...prev, trips: [trip, ...prev.trips] } : prev));
      refreshStats();
      return trip;
    },
    [mapId, refreshStats],
  );

  // A group trip taken off this map (its owner, or whoever added it): the countries it
  // marked stay; the trips count goes down
  const unlinkTrip = useCallback(
    async (tripId) => {
      await removeTripFromMap(tripId, mapId);
      setState((prev) => (onMap(prev, mapId) ? { ...prev, trips: prev.trips.filter((t) => t.id !== tripId) } : prev));
      forgetMapLists();
      refreshStats();
    },
    [mapId, refreshStats],
  );

  return {
    ...state,
    reload: load,
    refresh,
    refreshStats,
    setVisit,
    saveMapDetails,
    setDesign,
    setMapStyle,
    setLandmarkBeen,
    addTraveller,
    editTraveller,
    removeTraveller,
    addTrip,
    unlinkTrip,
  };
}

import { useCallback, useEffect, useState } from 'react';
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
  updateMap,
  updateTraveller,
} from '@/api/travelApi';

const EMPTY = { map: null, trips: [], loading: true, error: null };

/**
 * One travel map: its details, travellers, visited countries, stats and trips, with
 * the changes an editor can make. Visit changes show at once and roll back on failure.
 */
export default function useTravelMap(mapId) {
  const [state, setState] = useState(EMPTY);

  const load = useCallback(async () => {
    if (!mapId) return;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [{ map }, { trips }] = await Promise.all([getMap(mapId), getMapTrips(mapId)]);
      setState({ map, trips: trips || [], loading: false, error: null });
    } catch (err) {
      setState({ map: null, trips: [], loading: false, error: err.friendlyMessage || 'This map could not be loaded.' });
    }
  }, [mapId]);

  useEffect(() => {
    setState(EMPTY);
    load();
  }, [load]);

  const refreshStats = useCallback(async () => {
    try {
      const { stats } = await getMapStats(mapId);
      setState((prev) => (prev.map ? { ...prev, map: { ...prev.map, stats } } : prev));
    } catch {
      // Stats are a nicety; the next full load corrects them
    }
  }, [mapId]);

  // status: 'VISITED' | 'LIVED' | 'WANT_TO_GO', or null to clear the country
  const setVisit = useCallback(
    async (countryCode, status, extra = {}) => {
      let previous = null;
      setState((prev) => {
        if (!prev.map) return prev;
        previous = prev.map.visits;
        const others = prev.map.visits.filter((v) => v.countryCode !== countryCode);
        const current = prev.map.visits.find((v) => v.countryCode === countryCode);
        const visits = status
          ? [...others, { ...(current || { source: 'MANUAL', firstVisitedOn: null, notes: null }), countryCode, status, ...extra }]
          : others;
        return { ...prev, map: { ...prev.map, visits } };
      });
      try {
        if (status) await putVisit(mapId, countryCode, { status, ...extra });
        else await deleteVisit(mapId, countryCode);
        refreshStats();
      } catch (err) {
        setState((prev) => (prev.map && previous ? { ...prev, map: { ...prev.map, visits: previous } } : prev));
        throw err;
      }
    },
    [mapId, refreshStats],
  );

  const saveMapDetails = useCallback(
    async (body) => {
      const { map } = await updateMap(mapId, body);
      setState((prev) => ({ ...prev, map: map || prev.map }));
    },
    [mapId],
  );

  const addTraveller = useCallback(
    async (body) => {
      const { traveller } = await createTraveller(mapId, body);
      setState((prev) =>
        prev.map ? { ...prev, map: { ...prev.map, travellers: [...prev.map.travellers, traveller] } } : prev,
      );
      return traveller;
    },
    [mapId],
  );

  const editTraveller = useCallback(
    async (travellerId, body) => {
      const { traveller } = await updateTraveller(mapId, travellerId, body);
      setState((prev) =>
        prev.map
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
        prev.map
          ? { ...prev, map: { ...prev.map, travellers: prev.map.travellers.filter((t) => t.id !== travellerId) } }
          : prev,
      );
    },
    [mapId],
  );

  const addTrip = useCallback(
    async (body) => {
      const { trip } = await createTrip(mapId, body);
      setState((prev) => ({ ...prev, trips: [trip, ...prev.trips] }));
      refreshStats();
      return trip;
    },
    [mapId, refreshStats],
  );

  return {
    ...state,
    reload: load,
    refreshStats,
    setVisit,
    saveMapDetails,
    addTraveller,
    editTraveller,
    removeTraveller,
    addTrip,
  };
}

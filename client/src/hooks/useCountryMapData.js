import { useCallback, useEffect, useState } from 'react';
// Api
import { clearSubdivision, getPins, getSubdivisions, setSubdivision } from '@/api/travelApi';
// Utils
import { loadCountryMap } from '@/utils/map/countryMapGeo';

/**
 * One country's own map (docs/API.md "Country maps"): its outlines (`geo`, the generated
 * module), the states the map has marked (`statuses`: code → status) and its pins, from
 * `source` ({ mapId } or { shareCode }). `pinsVersion` going up reloads the pins (a pin
 * changed in its panel). `setStatus(code, status)` (null clears) shows the change at once
 * and undoes it if the server refuses; it resolves to the visits the change brought (its
 * country, a region), so the world map can catch up.
 */
export default function useCountryMapData({ source, code, pinsVersion = 0 }) {
  const [geo, setGeo] = useState(null);
  const [statuses, setStatuses] = useState(() => new Map());
  const [pins, setPins] = useState([]);
  const [error, setError] = useState(null);
  const mapId = source.mapId;
  const shareCode = source.shareCode;

  useEffect(() => {
    let live = true;
    setGeo(null);
    setError(null);
    const where = shareCode ? { shareCode } : { mapId };
    Promise.all([loadCountryMap(code), getSubdivisions(where, code)])
      .then(([map, { subdivisions = [] }]) => {
        if (!live) return;
        setGeo(map);
        setStatuses(new Map(subdivisions.map((s) => [s.code, s.status])));
      })
      .catch((err) => live && setError(err.friendlyMessage || 'This country’s map could not be loaded.'));
    return () => {
      live = false;
    };
  }, [code, mapId, shareCode]);

  useEffect(() => {
    let live = true;
    getPins(shareCode ? { shareCode } : { mapId }, code)
      .then(({ pins: list = [] }) => live && setPins(list))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [code, mapId, shareCode, pinsVersion]);

  const setStatus = useCallback(
    async (stateCode, status) => {
      let before;
      setStatuses((prev) => {
        before = prev.get(stateCode) ?? null;
        const next = new Map(prev);
        if (status) next.set(stateCode, status);
        else next.delete(stateCode);
        return next;
      });
      try {
        if (!status) {
          await clearSubdivision(mapId, stateCode);
          return [];
        }
        const { implied = [] } = await setSubdivision(mapId, stateCode, status);
        return implied;
      } catch (err) {
        setStatuses((prev) => {
          const next = new Map(prev);
          if (before) next.set(stateCode, before);
          else next.delete(stateCode);
          return next;
        });
        throw err;
      }
    },
    [mapId],
  );

  return { geo, statuses, pins, error, setStatus };
}

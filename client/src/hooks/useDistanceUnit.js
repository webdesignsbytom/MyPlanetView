import { createContext, useContext } from 'react';

// The unit the map being shown writes its distances in, 'km' or 'miles'
// (utils/map/distanceUnits.js `distanceUnitFor`: the viewer's setting, else miles for a map
// whose home is in the United States; 24 Nov 2026, the user's wish). The map page and share
// links provide it, so the statistics and the flight log follow it without it being passed
// down. Outside one it's kilometres.
const DistanceUnitContext = createContext('km');

export const DistanceUnitProvider = DistanceUnitContext.Provider;

export default function useDistanceUnit() {
  return useContext(DistanceUnitContext);
}

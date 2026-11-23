// The airports a flight can name (utils/flights/airportData.js, generated from OurAirports by
// images/src/tools/airports.mjs), loaded once, only by the flight log (about 115 KB compressed).
let loading = null;

/** Every airport: IATA code -> [name, city, place, latitude, longitude, UK nation or null]. */
export const loadAirports = () =>
  (loading ??= import('./airportData')
    .then((module) => module.AIRPORT_DATA)
    .catch((err) => {
      loading = null;
      throw err;
    }));

/** One airport from the data: `{ code, name, city, place, latitude, longitude, nation }`, or null. */
export function airportFrom(data, code) {
  const key = typeof code === 'string' ? code.trim().toUpperCase() : '';
  const row = data?.[key];
  if (!row) return null;
  const [name, city, place, latitude, longitude, nation] = row;
  return { code: key, name, city, place, latitude, longitude, nation };
}

/** Where an airport is on a map: its UK nation on a map that splits the UK, else its place. */
export const placeOfAirport = (airport, splitUk) => (splitUk && airport.nation ? airport.nation : airport.place);

/** "London (LHR)", or the airport's own name when it has no city. */
export const airportLabel = (airport) => `${airport.city || airport.name} (${airport.code})`;

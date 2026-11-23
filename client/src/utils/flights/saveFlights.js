// Saving a boarding pass's flights (23 Nov 2026, the user's wish: "the trip and its countries fill
// in automatically"): the trip (a new one, made with its stops, or one of the map's), the flights,
// then the places ticked that the map hasn't marked yet. The calls come in `api`, so it's tested
// on its own.

/** Where a new trip from these flights stands today: done, under way or still to come. */
export function tripStatusFor({ startDate, endDate }, today) {
  if (endDate < today) return 'COMPLETED';
  return startDate <= today ? 'ACTIVE' : 'PLANNED';
}

/**
 * `{ mapId, flights, source, trip: { kind: 'none' | 'existing' | 'new', tripId?, title?,
 * startDate?, endDate? }, stops: [{ code, city }] (a new trip's), ticked: [codes], visitsByCode,
 * today ("YYYY-MM-DD") }` with `api: { createTrip, createStop, addFlights, setVisit }`.
 * -> `{ tripId, added, skipped, marked }`
 */
export async function saveFlights({ mapId, flights, source, trip, stops = [], ticked = [], visitsByCode = {}, today }, api) {
  let tripId = trip.kind === 'existing' ? trip.tripId : null;
  let stopCodes = new Set();
  let tripMarksVisits = false;
  if (trip.kind === 'new') {
    const status = tripStatusFor(trip, today);
    const made = await api.createTrip(mapId, { title: trip.title, startDate: trip.startDate, endDate: trip.endDate, status });
    tripId = made.trip.id;
    for (const stop of stops) await api.createStop(tripId, { countryCode: stop.code, ...(stop.city ? { placeName: stop.city } : {}) });
    stopCodes = new Set(stops.map((stop) => stop.code));
    // A completed trip marks its stops' places itself (docs/API.md "Trips")
    tripMarksVisits = status === 'COMPLETED';
  }
  const saved = await api.addFlights(mapId, {
    source,
    ...(tripId ? { tripId } : {}),
    flights: flights.map(({ from, to, flownOn, carrier, flightNumber }) => ({ from, to, flownOn, carrier: carrier || null, flightNumber: flightNumber || null })),
  });
  const marked = [];
  for (const code of ticked) {
    if (visitsByCode[code] || (tripMarksVisits && stopCodes.has(code))) continue;
    await api.setVisit(code, 'VISITED');
    marked.push(code);
  }
  return { tripId, added: saved.flights?.length ?? 0, skipped: saved.skipped ?? 0, marked };
}

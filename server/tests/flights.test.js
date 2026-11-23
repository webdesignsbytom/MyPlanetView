// The flight log: the rules (src/utils/flights.js), pure, over the airports' data.
import { describe, expect, it } from 'vitest';
import { FLIGHTS_PER_REQUEST, airportByCode, flightDistanceKm, flightTotals, parseFlights } from '../src/utils/flights.js';

describe('airportByCode', () => {
  it('finds an airport by its IATA code, with its place on the map', () => {
    expect(airportByCode('lhr')).toMatchObject({ code: 'LHR', city: 'London', place: 'GB', nation: 'XE' });
    // The Canaries' airports are in the Canary Islands, as the map draws them
    expect(airportByCode('LPA').place).toBe('IC');
    expect(airportByCode('PRN').place).toBe('XK');
  });
  it('is null for a code no airport has', () => {
    expect(airportByCode('QQQ')).toBeNull();
    expect(airportByCode(null)).toBeNull();
  });
});

describe('flightDistanceKm', () => {
  it('is the great circle between two airports', () => {
    const km = flightDistanceKm(airportByCode('LHR'), airportByCode('JFK'));
    expect(km).toBeGreaterThan(5500);
    expect(km).toBeLessThan(5600);
  });
});

describe('parseFlights', () => {
  const flight = (over = {}) => ({ from: 'LHR', to: 'JFK', flownOn: '2026-06-01', carrier: 'ba', flightNumber: '117', ...over });

  it('makes rows to save, with the distance', () => {
    const [row] = parseFlights([flight()], { source: 'BOARDING_PASS' });
    expect(row).toMatchObject({ fromAirport: 'LHR', toAirport: 'JFK', carrier: 'BA', flightNumber: '117', source: 'BOARDING_PASS' });
    expect(row.flownOn).toEqual(new Date('2026-06-01T00:00:00Z'));
    expect(row.distanceKm).toBeGreaterThan(5500);
  });
  it('takes a flight with no airline or number', () => {
    expect(parseFlights([flight({ carrier: null, flightNumber: '' })])[0]).toMatchObject({ carrier: null, flightNumber: null, source: 'MANUAL' });
  });
  it('refuses an unknown or same airport, a bad day, airline or number, and too many', () => {
    expect(parseFlights([flight({ to: 'QQQ' })])).toBeNull();
    expect(parseFlights([flight({ to: 'LHR' })])).toBeNull();
    expect(parseFlights([flight({ flownOn: '2026-02-30' })])).toBeNull();
    expect(parseFlights([flight({ flownOn: null })])).toBeNull();
    expect(parseFlights([flight({ carrier: 'BRITISH' })])).toBeNull();
    expect(parseFlights([flight({ flightNumber: '12345' })])).toBeNull();
    expect(parseFlights([])).toBeNull();
    expect(parseFlights(Array.from({ length: FLIGHTS_PER_REQUEST + 1 }, () => flight()))).toBeNull();
    expect(parseFlights('LHR-JFK')).toBeNull();
    expect(parseFlights([null])).toBeNull();
  });
});

describe('flightTotals', () => {
  it('counts flights, distance, airports once, airlines and the longest', () => {
    const totals = flightTotals([
      { id: 'a', fromAirport: 'LHR', toAirport: 'JFK', carrier: 'BA', distanceKm: 5555 },
      { id: 'b', fromAirport: 'JFK', toAirport: 'LHR', carrier: 'VS', distanceKm: 5555 },
      { id: 'c', fromAirport: 'LHR', toAirport: 'CDG', carrier: 'BA', distanceKm: 347 },
      { id: 'd', fromAirport: 'CDG', toAirport: 'NRT', carrier: null, distanceKm: 9700 },
    ]);
    expect(totals).toEqual({
      flights: 4,
      distanceKm: 21157,
      airports: ['CDG', 'JFK', 'LHR', 'NRT'],
      airlines: 2,
      longest: { id: 'd', fromAirport: 'CDG', toAirport: 'NRT', distanceKm: 9700 },
    });
    expect(flightTotals([])).toEqual({ flights: 0, distanceKm: 0, airports: [], airlines: 0, longest: null });
  });
});

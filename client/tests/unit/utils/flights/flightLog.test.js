// The flight log's rules and words (utils/flights/flightLog.js, airports.js, saveFlights.js).
import { describe, expect, it, vi } from 'vitest';
import { aroundTheWorld, distanceWords, flightCode, flightDays, flightKm, flightPlaces, tripForDay } from '@/utils/flights/flightLog';
import { airportFrom, airportLabel, loadAirports, placeOfAirport } from '@/utils/flights/airports';
import { saveFlights, tripStatusFor } from '@/utils/flights/saveFlights';

const DATA = {
  LHR: ['London Heathrow Airport', 'London', 'GB', 51.4707, -0.4599, 'XE'],
  DXB: ['Dubai International Airport', 'Dubai', 'AE', 25.2498, 55.371, null],
  SYD: ['Sydney Kingsford Smith International Airport', 'Sydney', 'AU', -33.9461, 151.177, null],
  JFK: ['John F. Kennedy International Airport', 'New York', 'US', 40.6394, -73.7793, null],
  LGW: ['London Gatwick Airport', 'London', 'GB', 51.1487, -0.1857, 'XE'],
  XNA: ['Northwest Arkansas Airport', '', 'US', 36.28, -94.31, null],
};
const airportOf = (code) => airportFrom(DATA, code);
const flight = (from, to, flownOn) => ({ from, to, flownOn });

describe('airports', () => {
  it('finds one by its code, places it on a split or whole UK map, and names it', () => {
    expect(airportOf('lhr')).toMatchObject({ code: 'LHR', city: 'London', place: 'GB', nation: 'XE' });
    expect(airportOf('QQQ')).toBeNull();
    expect(placeOfAirport(airportOf('LHR'), true)).toBe('XE');
    expect(placeOfAirport(airportOf('LHR'), false)).toBe('GB');
    expect(airportLabel(airportOf('JFK'))).toBe('New York (JFK)');
    expect(airportLabel(airportOf('XNA'))).toBe('Northwest Arkansas Airport (XNA)');
  });
  it('loads the whole list once', async () => {
    const data = await loadAirports();
    expect(data.LHR[2]).toBe('GB');
    expect(await loadAirports()).toBe(data);
  });
});

describe('flightPlaces', () => {
  it('lists each place once, a change of planes as a connection', () => {
    const flights = [flight('LHR', 'DXB', '2026-11-16'), flight('DXB', 'SYD', '2026-11-17'), flight('SYD', 'LHR', '2026-12-01')];
    expect(flightPlaces(flights, airportOf, false)).toEqual([
      { code: 'GB', connection: false },
      { code: 'AE', connection: true },
      { code: 'AU', connection: false },
    ]);
    // A UK nation on a split map
    expect(flightPlaces([flight('LGW', 'JFK', '2026-06-01')], airportOf, true).map((p) => p.code)).toEqual(['XE', 'US']);
  });
  it('a stopover of days isn’t a connection, nor a place also visited properly', () => {
    expect(flightPlaces([flight('LHR', 'DXB', '2026-11-16'), flight('DXB', 'SYD', '2026-11-20')], airportOf, false)[1]).toEqual({ code: 'AE', connection: false });
    const twice = [flight('LHR', 'DXB', '2026-11-16'), flight('DXB', 'SYD', '2026-11-16'), flight('SYD', 'DXB', '2026-12-01'), flight('DXB', 'JFK', '2026-12-09')];
    expect(flightPlaces(twice, airportOf, false).find((p) => p.code === 'AE').connection).toBe(false);
  });
  it('skips an airport it doesn’t know', () => {
    expect(flightPlaces([flight('LHR', 'QQQ', '2026-01-01')], airportOf, false)).toEqual([{ code: 'GB', connection: false }]);
  });
});

describe('the log’s helpers', () => {
  it('takes a trip’s days from its flights', () => {
    expect(flightDays([flight('A', 'B', '2026-06-08'), flight('B', 'A', '2026-06-01')])).toEqual({ startDate: '2026-06-01', endDate: '2026-06-08' });
    expect(flightDays([])).toEqual({ startDate: '', endDate: '' });
  });
  it('finds the map’s own trip whose days hold the flight', () => {
    const trips = [
      { id: 'g', linked: true, startDate: '2026-06-01', endDate: '2026-06-30' },
      { id: 't', startDate: '2026-06-01', endDate: '2026-06-10' },
    ];
    expect(tripForDay(trips, '2026-06-05').id).toBe('t');
    expect(tripForDay(trips, '2026-07-01')).toBeNull();
  });
  it('measures and words a flight', () => {
    expect(flightKm(airportOf('LHR'), airportOf('JFK'))).toBeGreaterThan(5500);
    expect(distanceWords(5555)).toBe('5,555 km (3,452 miles)');
    expect(flightCode({ carrier: 'BA', flightNumber: '117' })).toBe('BA 117');
    expect(flightCode({ carrier: null, flightNumber: null })).toBe('');
    expect(aroundTheWorld(40075 * 2.34)).toBe(2.3);
  });
});

describe('saveFlights', () => {
  const api = () => ({
    createTrip: vi.fn().mockResolvedValue({ trip: { id: 'trip-new' } }),
    createStop: vi.fn().mockResolvedValue({}),
    addFlights: vi.fn().mockResolvedValue({ flights: [{}, {}], skipped: 0 }),
    setVisit: vi.fn().mockResolvedValue({}),
  });
  const flights = [
    { from: 'LHR', to: 'JFK', flownOn: '2026-06-01', carrier: 'BA', flightNumber: '117' },
    { from: 'JFK', to: 'LHR', flownOn: '2026-06-08', carrier: '', flightNumber: '' },
  ];

  it('says how a trip stands today', () => {
    expect(tripStatusFor({ startDate: '2026-06-01', endDate: '2026-06-08' }, '2026-11-23')).toBe('COMPLETED');
    expect(tripStatusFor({ startDate: '2026-11-20', endDate: '2026-11-30' }, '2026-11-23')).toBe('ACTIVE');
    expect(tripStatusFor({ startDate: '2026-12-01', endDate: '2026-12-08' }, '2026-11-23')).toBe('PLANNED');
  });

  it('makes a done trip with its stops, logs the flights on it, and marks only what the trip doesn’t', async () => {
    const calls = api();
    const result = await saveFlights(
      {
        mapId: 'm1',
        flights,
        source: 'BOARDING_PASS',
        trip: { kind: 'new', title: 'Trip to New York', startDate: '2026-06-01', endDate: '2026-06-08' },
        stops: [{ code: 'US', city: 'New York' }],
        ticked: ['GB', 'US'],
        visitsByCode: {},
        today: '2026-11-23',
      },
      calls,
    );
    expect(calls.createTrip).toHaveBeenCalledWith('m1', { title: 'Trip to New York', startDate: '2026-06-01', endDate: '2026-06-08', status: 'COMPLETED' });
    expect(calls.createStop).toHaveBeenCalledWith('trip-new', { countryCode: 'US', placeName: 'New York' });
    expect(calls.addFlights).toHaveBeenCalledWith('m1', {
      source: 'BOARDING_PASS',
      tripId: 'trip-new',
      flights: [
        { from: 'LHR', to: 'JFK', flownOn: '2026-06-01', carrier: 'BA', flightNumber: '117' },
        { from: 'JFK', to: 'LHR', flownOn: '2026-06-08', carrier: null, flightNumber: null },
      ],
    });
    // The done trip marks the US itself; the UK isn't a stop
    expect(calls.setVisit.mock.calls).toEqual([['GB', 'VISITED']]);
    expect(result).toEqual({ tripId: 'trip-new', added: 2, skipped: 0, marked: ['GB'] });
  });

  it('logs flights on an existing trip, or none, marking only places not on the map', async () => {
    const calls = api();
    const result = await saveFlights({ mapId: 'm1', flights, source: 'MANUAL', trip: { kind: 'existing', tripId: 't1' }, ticked: ['GB', 'US'], visitsByCode: { GB: 'LIVED' }, today: '2026-11-23' }, calls);
    expect(calls.createTrip).not.toHaveBeenCalled();
    expect(calls.addFlights.mock.calls[0][1].tripId).toBe('t1');
    expect(result.marked).toEqual(['US']);
    const none = api();
    await saveFlights({ mapId: 'm1', flights, source: 'MANUAL', trip: { kind: 'none' }, ticked: [], today: '2026-11-23' }, none);
    expect(none.addFlights.mock.calls[0][1]).not.toHaveProperty('tripId');
    expect(none.setVisit).not.toHaveBeenCalled();
  });
});

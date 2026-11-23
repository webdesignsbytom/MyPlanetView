// @vitest-environment node
// Life's One Shots' rules: the client's copy (mock mode, the page's counting) answers as the server's.
import { describe, expect, it } from 'vitest';
import * as client from '@/utils/oneShots/oneShotRules';
import * as server from '../../../../../server/src/utils/oneShots.js';
import { airportByCode } from '../../../../../server/src/utils/flights.js';
import { AIRPORT_DATA } from '@/utils/flights/airportData';
import { airportFrom } from '@/utils/flights/airports';

const T1 = '11111111-1111-4111-8111-111111111111';

describe('parseOneShotInput', () => {
  it('answers as the server does', () => {
    const cases = [
      ['lion', {}],
      ['lion', { seenOn: '2024-03', countryCode: 'KE', photoId: T1, notes: '  At dawn ', travellerIds: [T1] }],
      ['lion', { seenOn: null, countryCode: '', photoId: null, notes: '' }],
      ['lion', { seenOn: '2024-02-31' }],
      ['lion', { countryCode: 'kenya' }],
      ['lion', { notes: 5 }],
      ['lion', { travellerIds: [T1, T1] }],
      ['lion', { source: 'FLIGHT' }],
      ['equator', { source: 'FLIGHT' }],
      ['unicorn', {}],
    ];
    // The client keeps a date as its day ("2024-03-01"), the server as a Date
    const asDay = (result) =>
      result.ok && result.value.seenOn instanceof Date ? { ...result, value: { ...result.value, seenOn: result.value.seenOn.toISOString().slice(0, 10) } } : result;
    for (const [key, body] of cases) expect(client.parseOneShotInput(key, body), JSON.stringify(body)).toEqual(asDay(server.parseOneShotInput(key, body)));
  });

  it('takes the mock’s own ids for photos and travellers', () => {
    expect(client.parseOneShotInput('lion', { photoId: 'photo-eiffel', travellerIds: ['trav-test'] }).ok).toBe(true);
  });
});

describe('the lines a flight crossed', () => {
  const client2 = (code) => airportFrom(AIRPORT_DATA, code);
  it('are the server’s, flight for flight', () => {
    for (const [from, to] of [['LHR', 'JNB'], ['NRT', 'HNL'], ['LAX', 'SYD'], ['OSL', 'TOS'], ['LHR', 'CDG']]) {
      expect([...client.flightCrossings(client2(from), client2(to))].sort(), `${from}-${to}`).toEqual([...server.flightCrossings(airportByCode(from), airportByCode(to))].sort());
    }
  });

  it('suggest the same', () => {
    const flights = [
      { id: 'f1', fromAirport: 'LHR', toAirport: 'NBO', flownOn: '2019-03-02' },
      { id: 'f2', fromAirport: 'NRT', toAirport: 'HNL', flownOn: '2022-08-09' },
    ];
    const visited = new Set(['XN']);
    expect(client.oneShotSuggestions({ flights, airportOf: client2, visited })).toEqual(
      server.oneShotSuggestions({ flights: flights.map((f) => ({ ...f, flownOn: new Date(`${f.flownOn}T00:00:00Z`) })), airportOf: airportByCode, visited }),
    );
  });

  it('count each list as the server does', () => {
    const keys = ['lion', 'leopard', 'northern-lights', 'equator', 'unicorn'];
    expect(client.oneShotCounts(keys)).toEqual(server.oneShotCounts(keys));
  });
});

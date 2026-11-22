// @vitest-environment node
// Saving a map's set-up (src/utils/map/saveMapSetup.js): what changed, in an order the server
// accepts (a map never without a traveller, never more than its kind has room for). The API
// and the map lists are mocked; every call goes into one log, in order.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GROUP_TYPES, MAX_TRAVELLERS, maxTravellersFor, minTravellersFor, saveMapSetup } from '@/utils/map/saveMapSetup';
import { createTraveller, deleteTraveller, updateMap, updateTraveller } from '@/api/travelApi';
import { forgetMapLists } from '@/utils/map/mapListCache';

vi.mock('@/api/travelApi', () => ({ createTraveller: vi.fn(), deleteTraveller: vi.fn(), updateMap: vi.fn(), updateTraveller: vi.fn() }));
vi.mock('@/utils/map/mapListCache', () => ({ forgetMapLists: vi.fn() }));

let log;
beforeEach(() => {
  log = [];
  createTraveller.mockReset().mockImplementation(async (_m, body) => log.push(['create', body.name, body.position]));
  deleteTraveller.mockReset().mockImplementation(async (_m, id) => log.push(['delete', id]));
  updateTraveller.mockReset().mockImplementation(async (_m, id, body) => log.push(['update', id, body.name]));
  updateMap.mockReset().mockImplementation(async (_m, body) => log.push(['map', body]));
  forgetMapLists.mockReset();
});

const person = (id, name, fields = {}) => ({ id, name, birthCountryCode: null, favouriteCountryCode: null, ...fields });
const map = (travellers, fields = {}) => ({ name: 'Our map', groupType: 'COUPLE', splitUk: true, travellers, ...fields });
// The form as loaded: positions follow the list
const loaded = (travellers) => travellers.map((t, position) => ({ ...t, position }));

describe('the kinds of map', () => {
  it('are one traveller, two, or a family of two to twenty', () => {
    expect(GROUP_TYPES.map((g) => [g.value, g.minTravellers, g.maxTravellers])).toEqual([
      ['SOLO', 1, 1],
      ['COUPLE', 2, 2],
      ['FAMILY', 2, 20],
    ]);
    expect(MAX_TRAVELLERS).toBe(20);
  });

  it('say how many each takes, with one to twenty for a kind they don’t know', () => {
    expect(minTravellersFor('COUPLE')).toBe(2);
    expect(maxTravellersFor('SOLO')).toBe(1);
    expect(minTravellersFor('OTHER')).toBe(1);
    expect(maxTravellersFor(undefined)).toBe(20);
  });
});

describe('saveMapSetup', () => {
  const sam = person('t1', 'Sam');
  const alex = person('t2', 'Alex');

  it('sends nothing when nothing changed', async () => {
    const original = map(loaded([sam, alex]));
    await saveMapSetup('m1', original, { ...original, travellers: original.travellers });
    expect(log).toEqual([]);
    expect(forgetMapLists).not.toHaveBeenCalled();
  });

  it('renames the map, trimmed, and forgets the map lists that show its name', async () => {
    const original = map(loaded([sam, alex]));
    await saveMapSetup('m1', original, { ...original, name: '  Our travels ' });
    expect(log).toEqual([['map', { name: 'Our travels', groupType: 'COUPLE', splitUk: true }]]);
    expect(forgetMapLists).toHaveBeenCalled();
  });

  it('sends the UK’s nations being turned off, or the kind changing', async () => {
    const original = map(loaded([sam, alex]));
    await saveMapSetup('m1', original, { ...original, splitUk: false });
    expect(log).toEqual([['map', { name: 'Our map', groupType: 'COUPLE', splitUk: false }]]);
    log = [];
    await saveMapSetup('m1', original, { ...original, groupType: 'FAMILY' });
    expect(log[0][1].groupType).toBe('FAMILY');
  });

  it('never changes the map itself for someone who can’t rename it, but still saves the travellers', async () => {
    const original = map(loaded([sam, alex]));
    await saveMapSetup('m1', original, { ...original, name: 'Mine now', travellers: [sam, { ...alex, name: 'Alexa' }] }, { canRename: false });
    expect(log).toEqual([['update', 't2', 'Alexa']]);
  });

  it('updates only the travellers that changed, trimmed, in their new places', async () => {
    const original = map(loaded([sam, alex]), { groupType: 'FAMILY' });
    await saveMapSetup('m1', original, { ...original, travellers: [{ ...alex, name: ' Alex ' }, sam] });
    // Swapping them moves both
    expect(log).toEqual([
      ['update', 't2', 'Alex'],
      ['update', 't1', 'Sam'],
    ]);
  });

  it('updates a traveller whose countries changed', async () => {
    const original = map(loaded([sam]), { groupType: 'SOLO' });
    await saveMapSetup('m1', original, { ...original, travellers: [{ ...sam, birthCountryCode: 'GB' }] });
    expect(updateTraveller).toHaveBeenCalledWith('m1', 't1', { name: 'Sam', birthCountryCode: 'GB', favouriteCountryCode: null, position: 0 });
  });

  it('leaves out travellers with no name', async () => {
    const original = map(loaded([sam]), { groupType: 'FAMILY' });
    await saveMapSetup('m1', original, { ...original, travellers: [sam, { name: '   ' }, { name: 'Lily' }] });
    expect(log).toEqual([['create', 'Lily', 1]]);
  });

  it('takes people off before the map becomes a smaller kind, then adds the new ones', async () => {
    const lily = person('t3', 'Lily');
    const original = map(loaded([sam, alex, lily]), { groupType: 'FAMILY' });
    await saveMapSetup('m1', original, { ...original, groupType: 'COUPLE', travellers: [sam, alex] });
    expect(log).toEqual([
      ['delete', 't3'],
      ['map', { name: 'Our map', groupType: 'COUPLE', splitUk: true }],
    ]);
  });

  it('keeps one old traveller back until just before the last new one, when none is kept', async () => {
    const original = map(loaded([sam, alex]));
    await saveMapSetup('m1', original, { ...original, travellers: [{ name: 'Jo' }, { name: 'Kim' }] });
    // Never nobody on the map, never three on a couple's map
    expect(log).toEqual([
      ['delete', 't1'],
      ['create', 'Jo', 0],
      ['delete', 't2'],
      ['create', 'Kim', 1],
    ]);
  });

  it('turns the last old traveller into the one new person, as the server never deletes a map’s last', async () => {
    const original = map(loaded([sam]), { groupType: 'SOLO' });
    await saveMapSetup('m1', original, { ...original, travellers: [{ name: 'Jo', birthCountryCode: 'IE' }] });
    expect(log).toEqual([['update', 't1', 'Jo']]);
    expect(updateTraveller).toHaveBeenCalledWith('m1', 't1', { name: 'Jo', birthCountryCode: 'IE', favouriteCountryCode: null, position: 0 });
    expect(deleteTraveller).not.toHaveBeenCalled();
  });

  it('turns the one kept back into the new person when two are replaced by one', async () => {
    const original = map(loaded([sam, alex]), { groupType: 'FAMILY' });
    await saveMapSetup('m1', original, { ...original, groupType: 'SOLO', travellers: [{ name: 'Jo' }] });
    expect(log).toEqual([
      ['delete', 't1'],
      ['map', { name: 'Our map', groupType: 'SOLO', splitUk: true }],
      ['update', 't2', 'Jo'],
    ]);
  });

  it('with every name cleared, adds nobody and takes the one held back off last', async () => {
    const original = map(loaded([sam]), { groupType: 'SOLO' });
    await saveMapSetup('m1', original, { ...original, travellers: [{ ...sam, name: '' }] });
    // The server refuses to delete a map's last traveller, so this save ends in its error
    expect(log).toEqual([['delete', 't1']]);
  });
});

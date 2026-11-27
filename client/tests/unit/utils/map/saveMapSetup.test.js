// @vitest-environment node
// Saving a map's set-up (src/utils/map/saveMapSetup.js): what changed, in an order the server
// accepts (a map never without a traveller, never more than its kind has room for). The API
// and the map lists are mocked; every call goes into one log, in order.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  GROUP_TYPES,
  MAX_TRAVELLERS,
  NEEDS_A_TRAVELLER,
  NEEDS_EVERY_NAME,
  maxTravellersFor,
  minTravellersFor,
  saveMapSetup,
  saveTravellerDetails,
} from '@/utils/map/saveMapSetup';
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
    expect(updateTraveller).toHaveBeenCalledWith('m1', 't1', { name: 'Sam', lastName: null, nationalityCode: null, birthCountryCode: 'GB', favouriteCountryCode: null, position: 0 });
  });

  // 27 Nov 2026, the user's wish: a nationality, for the passport
  it('sends a nationality set, changed or cleared, and nothing when it stayed the same', async () => {
    const original = map(loaded([sam]), { groupType: 'SOLO' });
    await saveMapSetup('m1', original, { ...original, travellers: [{ ...sam, nationalityCode: 'IE' }] });
    expect(updateTraveller).toHaveBeenLastCalledWith('m1', 't1', expect.objectContaining({ nationalityCode: 'IE' }));
    const set = map(loaded([{ ...sam, nationalityCode: 'IE' }]), { groupType: 'SOLO' });
    updateTraveller.mockClear();
    await saveMapSetup('m1', set, { ...set, travellers: [{ ...sam, nationalityCode: 'IE' }] });
    expect(updateTraveller).not.toHaveBeenCalled();
    await saveMapSetup('m1', set, { ...set, travellers: [{ ...sam, nationalityCode: '' }] });
    expect(updateTraveller).toHaveBeenLastCalledWith('m1', 't1', expect.objectContaining({ nationalityCode: null }));
  });

  // 27 Nov 2026, the user's wish: a last name, for the passport's surname
  it('sends a last name set, trimmed, changed or cleared, and nothing when it stayed the same', async () => {
    const original = map(loaded([sam]), { groupType: 'SOLO' });
    await saveMapSetup('m1', original, { ...original, travellers: [{ ...sam, lastName: '  Carter ' }] });
    expect(updateTraveller).toHaveBeenLastCalledWith('m1', 't1', expect.objectContaining({ name: 'Sam', lastName: 'Carter' }));
    const named = map(loaded([{ ...sam, lastName: 'Carter' }]), { groupType: 'SOLO' });
    updateTraveller.mockClear();
    await saveMapSetup('m1', named, { ...named, travellers: [{ ...sam, lastName: 'Carter' }] });
    expect(updateTraveller).not.toHaveBeenCalled();
    await saveMapSetup('m1', named, { ...named, travellers: [{ ...sam, lastName: '' }] });
    expect(updateTraveller).toHaveBeenLastCalledWith('m1', 't1', expect.objectContaining({ lastName: null }));
  });

  // 23 Nov 2026: each traveller's optional date of birth
  it('sends a date of birth set, changed or cleared, and nothing when it stayed the same', async () => {
    const original = map(loaded([person('t1', 'Sam', { birthDate: '1985-03-04' }), alex]));
    await saveMapSetup('m1', original, { ...original, travellers: [{ ...original.travellers[0], birthDate: '1985-03-04' }, { ...alex, birthDate: '1987-07-08' }] });
    expect(log).toEqual([['update', 't2', 'Alex']]);
    expect(updateTraveller).toHaveBeenCalledWith('m1', 't2', { name: 'Alex', lastName: null, nationalityCode: null, birthCountryCode: null, favouriteCountryCode: null, birthDate: '1987-07-08', position: 1 });
    log = [];
    await saveMapSetup('m1', original, { ...original, travellers: [{ ...original.travellers[0], birthDate: '' }, alex] });
    expect(updateTraveller).toHaveBeenLastCalledWith('m1', 't1', { name: 'Sam', lastName: null, nationalityCode: null, birthCountryCode: null, favouriteCountryCode: null, birthDate: null, position: 0 });
    // A new traveller's goes with them
    log = [];
    await saveMapSetup('m1', map(loaded([sam]), { groupType: 'FAMILY' }), { ...map([sam], { groupType: 'FAMILY' }), travellers: [sam, { name: 'Mia', birthDate: '2026-11-01' }] });
    expect(createTraveller).toHaveBeenLastCalledWith('m1', expect.objectContaining({ name: 'Mia', birthDate: '2026-11-01', position: 1 }));
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
    await saveMapSetup('m1', original, { ...original, travellers: [{ name: 'Jo', lastName: null, nationalityCode: null, birthCountryCode: 'IE' }] });
    expect(log).toEqual([['update', 't1', 'Jo']]);
    expect(updateTraveller).toHaveBeenCalledWith('m1', 't1', { name: 'Jo', lastName: null, nationalityCode: null, birthCountryCode: 'IE', favouriteCountryCode: null, position: 0 });
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

  it('with every name cleared, says so and sends nothing', async () => {
    const original = map(loaded([sam]), { groupType: 'SOLO' });
    // Saving would have deleted the map's last traveller, which the server refuses
    const saving = saveMapSetup('m1', original, { ...original, name: 'Renamed', travellers: [{ ...sam, name: '  ' }] });
    await expect(saving).rejects.toMatchObject({ friendlyMessage: NEEDS_A_TRAVELLER });
    expect(NEEDS_A_TRAVELLER).toBe('Add at least one traveller’s name.');
    expect(log).toEqual([]);
  });
});

// 27 Nov 2026, the user's wish: the travellers' details changed under the passport
describe('saveTravellerDetails', () => {
  // As the passport loads them: no place in the list
  const before = [
    { id: 't1', name: 'Charlie', lastName: null, nationalityCode: null, birthCountryCode: 'GB', favouriteCountryCode: null, birthDate: '1990-01-14' },
    { id: 't2', name: 'Alex', lastName: null, nationalityCode: 'IE', birthCountryCode: 'IE', favouriteCountryCode: 'JP', birthDate: null },
  ];
  const asForm = (t) => ({ ...t, lastName: t.lastName || '', nationalityCode: t.nationalityCode || '', favouriteCountryCode: t.favouriteCountryCode || '', birthDate: t.birthDate || '' });

  it('sends only the travellers that changed, trimmed, never their place in the list, and gives back what was saved', async () => {
    updateTraveller.mockImplementation(async (_m, id, body) => ({ traveller: { id, ...body } }));
    const form = before.map(asForm);
    form[0] = { ...form[0], lastName: '  Reid ', nationalityCode: 'GB' };
    const saved = await saveTravellerDetails('m1', before, form);
    expect(updateTraveller).toHaveBeenCalledTimes(1);
    const [mapId, id, body] = updateTraveller.mock.calls[0];
    expect([mapId, id]).toEqual(['m1', 't1']);
    expect(body).toEqual({ name: 'Charlie', lastName: 'Reid', nationalityCode: 'GB', birthCountryCode: 'GB', favouriteCountryCode: null, birthDate: '1990-01-14' });
    expect(body).not.toHaveProperty('position');
    expect(saved).toEqual([expect.objectContaining({ id: 't1', lastName: 'Reid' })]);
  });

  it('sends nothing when nothing changed, and clears what was emptied', async () => {
    updateTraveller.mockImplementation(async (_m, id, body) => ({ traveller: { id, ...body } }));
    expect(await saveTravellerDetails('m1', before, before.map(asForm))).toEqual([]);
    expect(updateTraveller).not.toHaveBeenCalled();
    const form = before.map(asForm);
    form[1] = { ...form[1], nationalityCode: '', favouriteCountryCode: '' };
    await saveTravellerDetails('m1', before, form);
    expect(updateTraveller).toHaveBeenCalledWith('m1', 't2', expect.objectContaining({ nationalityCode: null, favouriteCountryCode: null }));
  });

  it('refuses a traveller with no first name before sending anything', async () => {
    const form = before.map(asForm);
    form[1] = { ...form[1], name: '  ' };
    await expect(saveTravellerDetails('m1', before, form)).rejects.toMatchObject({ friendlyMessage: NEEDS_EVERY_NAME });
    expect(updateTraveller).not.toHaveBeenCalled();
  });
});

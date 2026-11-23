import { beforeEach, describe, expect, it } from 'vitest';
import { setMapSplitUk } from '@/dev/mock/ukNationSplit';
import { HOME_MAP, TOM_MAP, db, freshStore } from './mockApi';

beforeEach(() => freshStore());

const map = (id) => db().maps.find((m) => m.id === id);
const visit = (mapId, code) => db().visits.find((v) => v.mapId === mapId && v.countryCode === code);
const photo = (id) => db().photos.find((p) => p.id === id);

describe('setMapSplitUk', () => {
  it('moves the UK’s photos and moments to their nations, and marks the nations', () => {
    setMapSplitUk(map(HOME_MAP), true);
    expect(map(HOME_MAP).splitUk).toBe(true);
    expect(photo('photo-tower-bridge').countryCode).toBe('XE');
    expect(photo('photo-edinburgh-castle').countryCode).toBe('XC');
    expect(db().moments.find((m) => m.id === 'moment-born').countryCode).toBe('XE');
    expect(visit(HOME_MAP, 'XE')).toMatchObject({ status: 'VISITED', source: 'PHOTO' });
    expect(visit(HOME_MAP, 'XC')).toMatchObject({ status: 'VISITED', source: 'PHOTO' });
    // The UK's own visit, marked by hand with a note, stays
    expect(visit(HOME_MAP, 'GB')).toMatchObject({ status: 'LIVED', notes: 'Home' });
  });

  it('turned off, merges the nations into one UK visit and remembers each row’s nation', () => {
    setMapSplitUk(map(HOME_MAP), true);
    visit(HOME_MAP, 'XC').notes = 'Highlands';
    setMapSplitUk(map(HOME_MAP), false);
    expect(map(HOME_MAP).splitUk).toBe(false);
    expect(db().visits.some((v) => v.mapId === HOME_MAP && ['XE', 'XC', 'XW', 'XI'].includes(v.countryCode))).toBe(false);
    expect(visit(HOME_MAP, 'GB')).toMatchObject({ status: 'LIVED', notes: 'Home' });
    expect(photo('photo-edinburgh-castle')).toMatchObject({ countryCode: 'GB', ukNation: 'XC' });
    expect(map(HOME_MAP).ukNationVisits.nations.map((v) => v.countryCode).sort()).toEqual(['XC', 'XE']);
    expect(map(HOME_MAP).ukNationVisits.uk).toEqual({ status: 'LIVED', notes: 'Home' });
  });

  it('turned on again with the UK as it was left, brings the nations’ own visits back', () => {
    setMapSplitUk(map(HOME_MAP), true);
    visit(HOME_MAP, 'XC').notes = 'Highlands';
    setMapSplitUk(map(HOME_MAP), false);
    setMapSplitUk(map(HOME_MAP), true);
    expect(visit(HOME_MAP, 'XC').notes).toBe('Highlands');
    expect(photo('photo-edinburgh-castle')).toMatchObject({ countryCode: 'XC', ukNation: null });
    expect(visit(HOME_MAP, 'GB')).toBeUndefined();
    expect(map(HOME_MAP).ukNationVisits).toBeNull();
  });

  it('merges nations with no UK visit into a new one, their notes named', () => {
    const tom = map(TOM_MAP);
    tom.splitUk = true;
    db().visits = db().visits.filter((v) => v.mapId !== TOM_MAP);
    db().visits.push(
      { mapId: TOM_MAP, countryCode: 'XW', status: 'VISITED', source: 'MANUAL', firstVisitedOn: '2010-01-01', notes: 'Rain' },
      { mapId: TOM_MAP, countryCode: 'XE', status: 'LIVED', source: 'MANUAL', firstVisitedOn: '1990-01-01', notes: null },
    );
    setMapSplitUk(tom, false);
    expect(visit(TOM_MAP, 'GB')).toMatchObject({ status: 'LIVED', firstVisitedOn: '1990-01-01', notes: 'Wales: Rain' });
  });

  it('does nothing when the map is already that way', () => {
    const before = JSON.stringify(db());
    setMapSplitUk(map(HOME_MAP), false);
    expect(JSON.stringify(db())).toBe(before);
  });
});

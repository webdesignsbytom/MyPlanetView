import { beforeEach, describe, expect, it } from 'vitest';
import {
  ROLES,
  formatShareCode,
  getDb,
  getMockRole,
  loadStore,
  me,
  newId,
  newShareCode,
  normaliseShareCode,
  resetStore,
  saveStore,
  session,
  setMockRole,
  shareUrlFor,
} from '@/dev/mock/store';
import { buildSeed } from '@/dev/mock/seed';
import { FRAN_MAP, HOME_MAP, freshStore } from './mockApi';

const STORE_KEY = 'mpvMockStore.v6';
const saved = () => JSON.parse(localStorage.getItem(STORE_KEY));
/** A store as an older version saved it: the seed, less `drop`, plus `change`. */
function saveOld(drop = [], change = (db) => db) {
  const db = buildSeed();
  for (const key of drop) delete db[key];
  localStorage.setItem(STORE_KEY, JSON.stringify(change(db)));
}

beforeEach(() => freshStore());

describe('the mock role', () => {
  it('is USER unless a known role was chosen', () => {
    expect(ROLES).toEqual(['USER', 'ADMIN', 'DEVELOPER']);
    expect(getMockRole()).toBe('USER');
    setMockRole('ADMIN');
    expect(getMockRole()).toBe('ADMIN');
    setMockRole('KING');
    expect(getMockRole()).toBe('ADMIN');
    localStorage.setItem('mpvMockRole', 'KING');
    expect(getMockRole()).toBe('USER');
  });

  it('is given to the test user when the store loads', () => {
    setMockRole('DEVELOPER');
    loadStore();
    expect(me().role).toBe('DEVELOPER');
  });
});

describe('loadStore', () => {
  it('saves the store it loads, and reads back what was saved', () => {
    expect(saved().maps.map((m) => m.id)).toEqual(getDb().maps.map((m) => m.id));
    getDb().maps[0].name = 'Changed';
    saveStore();
    loadStore();
    expect(getDb().maps[0].name).toBe('Changed');
  });

  it('starts from the seed when what was saved can’t be read', () => {
    localStorage.setItem(STORE_KEY, '{not json');
    resetStore();
    localStorage.setItem(STORE_KEY, '{not json');
    loadStore();
    expect(getDb().maps.some((m) => m.id === HOME_MAP)).toBe(true);
  });

  it('drops this session’s uploads, which died with the last page, and every link to them', () => {
    saveOld([], (db) => {
      db.photos.push({ id: 'p-blob', mapId: HOME_MAP, countryCode: 'FR', image: { kind: 'blob', thumbKey: 'k' }, createdAt: new Date().toISOString() });
      db.photoLandmarks.push({ photoId: 'p-blob', mapId: HOME_MAP, landmarkId: 'lm-eiffel-tower', confirmed: true });
      db.landmarkCovers = [{ mapId: HOME_MAP, landmarkId: 'lm-eiffel-tower', photoId: 'p-blob' }];
      db.themeEntries.push({ themeId: 't', photoId: 'p-blob', mapId: HOME_MAP });
      db.trips[0].coverPhotoId = 'p-blob';
      db.moments[0].photoIds = ['p-blob', 'photo-eiffel'];
      return db;
    });
    const db = loadStore();
    expect(db.photos.some((p) => p.id === 'p-blob')).toBe(false);
    expect(db.photoLandmarks.some((pl) => pl.photoId === 'p-blob')).toBe(false);
    expect(db.landmarkCovers).toEqual([]);
    expect(db.themeEntries.some((e) => e.photoId === 'p-blob')).toBe(false);
    expect(db.trips[0].coverPhotoId).toBeNull();
    expect(db.moments[0].photoIds).toEqual(['photo-eiffel']);
  });

  it('upgrades a store saved before plans, collecting, moments, group trips and covers', () => {
    saveOld(['subscriptions', 'planGrants', 'landmarkVisits', 'moments', 'tripMaps', 'landmarkCovers', 'travelCopyRequests']);
    const db = loadStore();
    expect(db.subscriptions.find((s) => s.userId === 'mock-user')).toMatchObject({ plan: 'REGULAR', extraMaps: 1 });
    for (const key of ['planGrants', 'landmarkVisits', 'moments', 'tripMaps', 'landmarkCovers', 'travelCopyRequests']) expect(db[key]).toEqual([]);
  });

  it('adds the seed’s promo codes, and drops the old per-code offers', () => {
    saveOld(['promoCodes']);
    expect(loadStore().promoCodes.map((p) => p.code)).toEqual(['SAMTRAVELS', 'TRAVELTALK']);
    saveOld([], (db) => {
      db.promoCodes[0].offerPlan = 'PREMIUM';
      db.promoCodes[0].offerDays = 60;
      db.users[3].promoOfferGrantedAt = '2026-01-01T00:00:00.000Z';
      return db;
    });
    const db = loadStore();
    expect('offerPlan' in db.promoCodes[0] || 'offerDays' in db.promoCodes[0]).toBe(false);
    expect('promoOfferGrantedAt' in db.users[3]).toBe(false);
    expect(db.users[3].promoTrialUsedAt).toBeNull();
  });

  it('adds the travel offers, themes, challenges, goals, badges and country maps a store lacks', () => {
    saveOld(['offers', 'offerClicks', 'goals', 'badgeAwards', 'challenges', 'challengeEntries', 'subdivisionVisits', 'pins', 'pinVisits'], (db) => {
      db.themes = [];
      return db;
    });
    const db = loadStore();
    expect(db.offers.length).toBeGreaterThan(20);
    expect(db.offerClicks.length).toBe(4);
    expect(db.goals.map((g) => g.id)).toEqual(['goal-ten', 'goal-bucket', 'goal-isles', 'goal-sam-asia']);
    expect(db.badgeAwards.length).toBeGreaterThan(0);
    expect(db.challenges.map((c) => c.id)).toEqual(['challenge-two-years']);
    expect(db.challengeEntries).toHaveLength(3);
    expect(db.subdivisionVisits.map((v) => v.code)).toEqual(['US-NY', 'US-MA']);
    expect(db.pins.map((p) => p.id)).toEqual(['pin-paris']);
    expect(db.pinVisits).toHaveLength(2);
    const month = new Date().toISOString().slice(0, 7);
    expect(db.themes.some((t) => String(t.month).slice(0, 7) === month)).toBe(true);
  });

  it('awards what an older store has already earned three days back, so no pop-up greets it', () => {
    saveOld(['badgeAwards']);
    const db = loadStore();
    const days = (Date.now() - Date.parse(db.badgeAwards[0].earnedAt)) / 86400000;
    expect(days).toBeGreaterThan(2.9);
    expect(days).toBeLessThan(3.1);
  });

  it('adds Fran’s First Class map to a store saved before videos, once', () => {
    saveOld([], (db) => {
      db.maps = db.maps.filter((m) => m.id !== FRAN_MAP);
      db.photos = db.photos.filter((p) => p.mapId !== FRAN_MAP);
      return db;
    });
    const db = loadStore();
    expect(db.maps.filter((m) => m.id === FRAN_MAP)).toHaveLength(1);
    expect(db.photos.filter((p) => p.kind === 'VIDEO')).toHaveLength(4);
    loadStore();
    expect(getDb().users.filter((u) => u.id === 'mock-fran')).toHaveLength(1);
  });

  it('gives every photo a gallery position and a shotAt', () => {
    saveOld([], (db) => {
      db.photos.forEach((p) => {
        delete p.countryPosition;
        delete p.tripPosition;
        delete p.shotAt;
      });
      return db;
    });
    const db = loadStore();
    expect(db.photos.every((p) => Number.isFinite(p.countryPosition) && p.shotAt)).toBe(true);
    expect(db.photos.find((p) => p.id === 'photo-eiffel').shotAt).toBe('2019-04-12T19:40:00.000Z');
  });

  it('fixes share codes saved with lookalike letters', () => {
    saveOld([], (db) => {
      db.maps[0].shareCode = 'L1OIU0ABCDEF';
      return db;
    });
    expect(loadStore().maps[0].shareCode).toBe('KTQJVDABCDEF');
  });
});

describe('resetStore', () => {
  it('goes back to the seed and saves it', () => {
    getDb().maps = [];
    resetStore();
    expect(getDb().maps.length).toBeGreaterThan(4);
    expect(saved().maps.length).toBe(getDb().maps.length);
    expect(getDb().badgeAwards.length).toBeGreaterThan(0);
  });
});

describe('share codes', () => {
  it('makes 12 characters with no lookalikes', () => {
    for (let i = 0; i < 50; i++) expect(newShareCode()).toMatch(/^[23456789ABCDEFGHJKMNPQRSTVWXYZ]{12}$/);
  });

  it('shows a code in fours and links it', () => {
    expect(formatShareCode('K7QXM2PA9RTW')).toBe('K7QX-M2PA-9RTW');
    expect(formatShareCode(null)).toBe('');
    expect(shareUrlFor('K7QXM2PA9RTW')).toBe(`${window.location.origin}/shared/K7QX-M2PA-9RTW`);
  });

  it('reads a code whatever its case, spaces and dashes, and nothing that can’t be one', () => {
    expect(normaliseShareCode(' k7qx-m2pa 9rtw ')).toBe('K7QXM2PA9RTW');
    expect(normaliseShareCode('K7QXM2PA9RT')).toBeNull();
    expect(normaliseShareCode('K7QXM2PA9RTO')).toBeNull();
    expect(normaliseShareCode(undefined)).toBeNull();
  });
});

describe('newId and the session', () => {
  it('makes unique ids', () => {
    expect(newId()).not.toBe(newId());
  });

  it('starts signed in, with no uploads', () => {
    expect(session.signedIn).toBe(true);
    expect(session.blobs.size).toBe(0);
    expect(session.presigned.size).toBe(0);
  });
});

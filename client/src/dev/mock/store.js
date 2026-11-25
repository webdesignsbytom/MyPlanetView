// Mock mode only (npm run dev:mock). The in-browser "database": seeded demo data,
// saved to localStorage so edits survive a reload. Uploaded files live as blob URLs
// for the session only, so photos uploaded in mock mode are dropped on reload.
import { getStoredItem, removeStoredItem, setStoredItem } from '@/utils/functions/safeStorage';
import { buildSeed } from './seed';
import { fillPhotoPositions, fillShotAt } from './photoOrder';
import { awardQuietly } from './achievements';
import { addFirstClassMap } from './seedFirstClass';
import { ensureThemes } from './themes';

// v2: the test user's map got the real test photos (16 Nov 2026); a new key seeds them
// for everyone, as older saved stores would keep the poster stand-ins.
// v3: moments, group trips (trips added to other maps) and Tom's map (16 Nov 2026)
// v4: the passport (16 Nov 2026): confirmed landmark matches (stamps) on the seeded
// photos, each match with its map and confirmation date, and the stamps' picked photos
// v5: real names for the seeded people (17 Nov 2026): the test user is Charlie Reid
// v6: travel copies (19 Nov 2026): Alex's family map "The Morgans", with the test user on it
// as a viewer and as its traveller Charlie, to bring travels from
// v7: the demo couple's travels (24 Nov 2026): 20 places in a clear order, every kind of trip,
// birth dates, the timeline, heritage sites ticked and the strings tied (data/demoTravels.js)
const STORE_KEY = 'mpvMockStore.v7';
const ROLE_KEY = 'mpvMockRole';

export const ROLES = ['USER', 'ADMIN', 'DEVELOPER'];

let db = null;

// Not saved: the signed-in flag, uploaded blobs, and files waiting to be confirmed
export const session = {
  signedIn: true,
  blobs: new Map(), // storage key -> blob URL
  presigned: new Map(), // photoId -> { mapId, tripId, keys: { THUMB, DISPLAY, ORIGINAL or PRINT } }
};

export function getMockRole() {
  const role = getStoredItem(ROLE_KEY);
  return ROLES.includes(role) ? role : 'USER';
}

export function setMockRole(role) {
  if (ROLES.includes(role)) setStoredItem(ROLE_KEY, role);
}

export function loadStore() {
  const saved = getStoredItem(STORE_KEY);
  if (saved) {
    try {
      db = JSON.parse(saved);
      // Session uploads point at blob URLs that died with the last page
      const dropped = new Set(db.photos.filter((p) => p.image?.kind === 'blob').map((p) => p.id));
      if (dropped.size) {
        db.photos = db.photos.filter((p) => !dropped.has(p.id));
        db.photoLandmarks = db.photoLandmarks.filter((pl) => !dropped.has(pl.photoId));
        db.landmarkCovers = (db.landmarkCovers || []).filter((c) => !dropped.has(c.photoId));
        db.themeEntries = (db.themeEntries || []).filter((e) => !dropped.has(e.photoId));
        db.trips.forEach((t) => {
          if (dropped.has(t.coverPhotoId)) t.coverPhotoId = null;
        });
        (db.moments || []).forEach((m) => {
          m.photoIds = m.photoIds.filter((id) => !dropped.has(id));
        });
      }
    } catch {
      db = null;
    }
  }
  if (!db) db = buildSeed();
  // Stores saved before the plans (16 Nov 2026): the seed's subscription, no memberships
  if (!Array.isArray(db.subscriptions)) db.subscriptions = buildSeed().subscriptions;
  if (!Array.isArray(db.planGrants)) db.planGrants = [];
  // Landmarks ticked "been here" (docs/API.md "Collecting"): { mapId, landmarkId, createdAt }
  if (!Array.isArray(db.landmarkVisits)) db.landmarkVisits = [];
  // Life's One Shots (24 Nov 2026): a store from before them gets the seed's
  if (!Array.isArray(db.oneShots)) db.oneShots = buildSeed().oneShots;
  // Strings between places (docs/API.md "Strings"): { id, mapId, from, to, createdAt }
  if (!Array.isArray(db.mapStrings)) db.mapStrings = [];
  // "Guess where I was" (docs/API.md): the seed's game in a store saved before it, and its plays
  if (!Array.isArray(db.guessGames)) db.guessGames = buildSeed().guessGames;
  if (!Array.isArray(db.guessPlays)) db.guessPlays = buildSeed().guessPlays;
  // Slideshows of chosen photos (docs/API.md "Photo slideshows"): the seed's in an older store
  if (!Array.isArray(db.photoShows)) db.photoShows = buildSeed().photoShows;
  // The flight log (docs/API.md "Flights")
  if (!Array.isArray(db.flights)) db.flights = buildSeed().flights;
  if (!Array.isArray(db.moments)) db.moments = [];
  if (!Array.isArray(db.tripMaps)) db.tripMaps = [];
  if (!Array.isArray(db.landmarkCovers)) db.landmarkCovers = [];
  // Stores saved before promo codes (16 Nov 2026): the seed's codes, so no new key is needed
  if (!Array.isArray(db.promoCodes)) db.promoCodes = buildSeed().promoCodes;
  // ...and before the free month replaced each code's own offer (the same day)
  db.promoCodes.forEach((promo) => {
    delete promo.offerPlan;
    delete promo.offerDays;
  });
  db.users.forEach((user) => {
    if ('promoOfferGrantedAt' in user) {
      user.promoTrialUsedAt ??= null;
      delete user.promoOfferGrantedAt;
    }
  });
  // ...and before travel offers (16 Nov 2026): the example offers and their tallies
  if (!Array.isArray(db.offers)) db.offers = buildSeed().offers;
  if (!Array.isArray(db.offerClicks)) db.offerClicks = buildSeed().offerClicks;
  [...db.maps, ...db.trips].forEach((item) => {
    item.shareCode = fixCode(item.shareCode);
  });
  // ...and before videos (16 Nov 2026): Fran's First Class map of videos, shared with the
  // test user, added row by row (seedFirstClass.js), so no new key is needed
  addFirstClassMap(db);
  // The seed, and stores saved before photos could be rearranged
  fillPhotoPositions(db.photos);
  // ...or had a shotAt (the slideshows' order), and before badges and goals: the seed's
  // goals, and what the data has already earned, awarded quietly (no pop-up)
  fillShotAt(db.photos);
  if (!Array.isArray(db.goals)) db.goals = buildSeed().goals;
  if (!Array.isArray(db.badgeAwards)) awardQuietly(db, QUIET_AWARD_DATE());
  // ...and before monthly photo themes (16 Nov 2026), or saved in an earlier month: the
  // example themes it lacks, so there's always one running
  ensureThemes(db);
  // ...and before friends challenges (16 Nov 2026): none, unless the seed has them
  if (!Array.isArray(db.challenges)) db.challenges = buildSeed().challenges;
  if (!Array.isArray(db.challengeEntries)) db.challengeEntries = buildSeed().challengeEntries;
  // ...and before country maps (18 Nov 2026): the seed's states and pin
  if (!Array.isArray(db.subdivisionVisits)) db.subdivisionVisits = buildSeed().subdivisionVisits;
  if (!Array.isArray(db.pins)) db.pins = buildSeed().pins;
  if (!Array.isArray(db.pinVisits)) db.pinVisits = buildSeed().pinVisits;
  // ...and before travel copies (19 Nov 2026): none asked for
  if (!Array.isArray(db.travelCopyRequests)) db.travelCopyRequests = [];
  // ...and before feedback (25 Nov 2026): the seed's examples
  if (!Array.isArray(db.feedback)) db.feedback = buildSeed().feedback;
  db.users[0].role = getMockRole();
  saveStore();
  return db;
}

// When the seed's badges were earned: a few days back, so a new one shows as new
const QUIET_AWARD_DATE = () => new Date(Date.now() - 3 * 86400000).toISOString();

export function saveStore() {
  setStoredItem(STORE_KEY, JSON.stringify(db));
}

export function resetStore() {
  removeStoredItem(STORE_KEY);
  db = buildSeed();
  fillPhotoPositions(db.photos);
  fillShotAt(db.photos);
  awardQuietly(db, QUIET_AWARD_DATE());
  db.users[0].role = getMockRole();
  saveStore();
}

export const getDb = () => db;
export const me = () => db.users[0];

export const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `mock-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

// Share codes, as server/src/utils/shareCodes.js: stored as 12 characters with no
// lookalikes, shown and linked as XXXX-XXXX-XXXX, and normalised on lookup (case, spaces
// and dashes don't matter; anything that can't be a code finds nothing).
const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';
const CODE_LENGTH = 12;
export function newShareCode() {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return code;
}

export const formatShareCode = (code) => String(code || '').match(/.{1,4}/g)?.join('-') ?? '';

export function normaliseShareCode(input) {
  const code = String(input ?? '').toUpperCase().replace(/[\s-]/g, '');
  if (code.length !== CODE_LENGTH || [...code].some((char) => !CODE_ALPHABET.includes(char))) return null;
  return code;
}

export const shareUrlFor = (code) => `${window.location.origin}/shared/${formatShareCode(code)}`;

// Stores saved before the codes were checked had some with lookalike letters
const LOOKALIKES = { L: 'K', I: 'J', O: 'Q', U: 'V', 0: 'D', 1: 'T' };
const fixCode = (code) => [...String(code)].map((char) => LOOKALIKES[char] || char).join('');

// Mock mode only (npm run dev:mock). The in-browser "database": seeded demo data,
// saved to localStorage so edits survive a reload. Uploaded files live as blob URLs
// for the session only, so photos uploaded in mock mode are dropped on reload.
import { getStoredItem, removeStoredItem, setStoredItem } from '@/utils/functions/safeStorage';
import { buildSeed } from './seed';

const STORE_KEY = 'mpvMockStore.v1';
const ROLE_KEY = 'mpvMockRole';

export const ROLES = ['USER', 'ADMIN', 'DEVELOPER'];

let db = null;

// Not saved: the signed-in flag, uploaded blobs, and files waiting to be confirmed
export const session = {
  signedIn: true,
  blobs: new Map(), // storage key -> blob URL
  presigned: new Map(), // photoId -> { mapId, tripId, keys: { THUMB, DISPLAY, ORIGINAL } }
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
        db.trips.forEach((t) => {
          if (dropped.has(t.coverPhotoId)) t.coverPhotoId = null;
        });
      }
    } catch {
      db = null;
    }
  }
  if (!db) db = buildSeed();
  [...db.maps, ...db.trips].forEach((item) => {
    item.shareCode = fixCode(item.shareCode);
  });
  db.users[0].role = getMockRole();
  saveStore();
  return db;
}

export function saveStore() {
  setStoredItem(STORE_KEY, JSON.stringify(db));
}

export function resetStore() {
  removeStoredItem(STORE_KEY);
  db = buildSeed();
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

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

const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';
export function newShareCode() {
  let code = '';
  for (let i = 0; i < 12; i++) code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return code;
}

export const normaliseCode = (code) => String(code || '').toUpperCase().replace(/[\s-]/g, '');
export const shareUrlFor = (code) => `${window.location.origin}/shared/${code}`;

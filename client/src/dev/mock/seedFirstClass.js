// Mock mode only. The First Class demo (docs/API.md, "Videos"): Fran, who pays yearly for
// First Class, and her map of the four NASA clips in the repo's seed-videos/, shared with
// the test user as a viewer, so videos can be watched without uploading one. (The server's
// seed gives the same clips to its First Class account, firstclass@gmail.com.) The badge's
// Plan dropdown makes the test user First Class too, for their own uploads.
//
// Added by buildSeed, and to a store saved before it (store.js), one row at a time, so a
// store that already has them is left as it is.
import { SEED_VIDEOS } from './data/seedVideos';

export const FRAN_ID = 'mock-fran';
export const FRAN_MAP_ID = 'map-fran';
const TEST_USER_ID = 'mock-user';

const daysAgo = (days) => new Date(Date.now() - days * 86400000).toISOString();
const addMissing = (list, row, same) => {
  if (!list.some(same)) list.push(row);
};

/** Fran, her plan, her map, and its videos, into `db` (where missing). Returns `db`. */
export function addFirstClassMap(db) {
  addMissing(
    db.users,
    {
      id: FRAN_ID,
      name: 'Fran First',
      email: 'firstclass@example.test',
      role: 'USER',
      emailVerified: true,
      isActive: true,
      image: null,
      createdAt: daysAgo(400),
      updatedAt: daysAgo(30),
    },
    (u) => u.id === FRAN_ID,
  );
  addMissing(
    db.subscriptions,
    {
      userId: FRAN_ID,
      plan: 'PREMIUM',
      interval: 'YEAR',
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 200 * 86400000).toISOString(),
      cancelAtPeriodEnd: false,
      extraMaps: 0,
      stripeCustomerId: 'cus_mock_fran',
    },
    (s) => s.userId === FRAN_ID,
  );
  addMissing(
    db.maps,
    {
      id: FRAN_MAP_ID,
      name: "Fran's views from orbit",
      groupType: 'SOLO',
      isDefault: true,
      ownerId: FRAN_ID,
      linkAccess: 'RESTRICTED',
      shareCode: 'FRNV7DXQ2KPM',
      graceUntil: null,
      createdAt: daysAgo(380),
    },
    (m) => m.id === FRAN_MAP_ID,
  );
  addMissing(
    db.travellers,
    { id: 'trav-fran', mapId: FRAN_MAP_ID, name: 'Fran', position: 0, userId: FRAN_ID, birthCountryCode: 'NG', favouriteCountryCode: 'IS' },
    (t) => t.id === 'trav-fran',
  );
  // The test user watches as a viewer: the videos play, nothing can be changed
  addMissing(
    db.mapMembers,
    { mapId: FRAN_MAP_ID, userId: TEST_USER_ID, role: 'VIEWER', createdAt: daysAgo(6) },
    (m) => m.mapId === FRAN_MAP_ID && m.userId === TEST_USER_ID,
  );
  SEED_VIDEOS.forEach((clip, index) => {
    addMissing(
      db.visits,
      { mapId: FRAN_MAP_ID, countryCode: clip.countryCode, status: 'VISITED', source: 'PHOTO', firstVisitedOn: null, notes: null },
      (v) => v.mapId === FRAN_MAP_ID && v.countryCode === clip.countryCode,
    );
    // A video: no position (videos keep none), its country chosen; its file is the clip,
    // and its poster frames are the country's poster (as the server's seed does without
    // a poster.webp in the clip's folder)
    addMissing(
      db.photos,
      {
        id: `video-${clip.slug}`,
        mapId: FRAN_MAP_ID,
        uploaderId: FRAN_ID,
        tripId: null,
        kind: 'VIDEO',
        durationS: clip.durationS,
        countryCode: clip.countryCode,
        caption: clip.caption,
        takenAt: clip.takenAt,
        latitude: null,
        longitude: null,
        width: clip.width,
        height: clip.height,
        hidden: false,
        image: { kind: 'seedVideo', slug: clip.slug, poster: clip.countryCode.toLowerCase() },
        createdAt: daysAgo(20 - index),
      },
      (p) => p.id === `video-${clip.slug}`,
    );
  });
  return db;
}

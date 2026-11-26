// Mock mode only. The demo data a fresh mock session starts with: the signed-in
// test user's couple's map (owned: the demo couple's travels, the server seed's history too,
// 20 places in a clear order with every kind of trip; homeHistory below), a map someone shared with them, a trip shared on
// its own, a group trip from Tom's map that Alex added to the test user's map, moments,
// the test user's plan (Business with one extra map), and the admin lists. The test user's map has real photos (the repo's
// seed-photos/, from Wikimedia Commons); the other maps use posters as stand-ins, but for
// Alex's family map "The Morgans" (travel copies, docs/API.md: the test user is on it as a
// viewer and as its traveller Charlie, not linked to the account), which reuses three of them.
import { seedPhotoBySlug } from './data/seedPhotos';
// The demo couple's travels, the server seed's own (generated: scripts/generate-mock-travels.mjs)
import {
  DEMO_FLIGHTS,
  DEMO_LANDMARK_TICKS,
  DEMO_MOMENTS,
  DEMO_ONE_SHOTS,
  DEMO_STATES,
  DEMO_STRINGS,
  DEMO_TRAVELLERS,
  DEMO_TRIPS,
  DEMO_VISITS,
} from './data/demoTravels';
import { EXAMPLE_OFFERS } from './data/offers';
// Fran's First Class map of videos, shared with the test user (seedFirstClass.js)
import { addFirstClassMap } from './seedFirstClass';
// The example monthly photo themes (the server's seed/themes.js)
import { exampleThemeEntries, exampleThemes } from './themes';
import { exampleFeedback } from './feedback';

// Every mock user's password: the one the server's seed gives its users (CLAUDE.md, "Seed")
export const MOCK_PASSWORD = '12345678';

const daysFromNow = (days) => new Date(Date.now() + days * 86400000).toISOString();
const daysAgo = (days) => daysFromNow(-days);

// The example offers as the server stores them: every field, ids fixed by place in the file
export const exampleOfferId = (index) => `0ffe0000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`;
export const exampleOffers = () =>
  EXAMPLE_OFFERS.map((offer, index) => ({
    id: exampleOfferId(index),
    blurb: null,
    countryCode: null,
    imageKey: null,
    weight: 1,
    active: true,
    startsAt: null,
    endsAt: null,
    ...offer,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(30),
  }));
// Clicks per offer, UTC day ("YYYY-MM-DD") and placement, as OfferClickDaily keeps them
const exampleOfferClicks = () => {
  const day = (n) => daysAgo(n).slice(0, 10);
  return [
    { offerId: exampleOfferId(0), day: day(1), placement: 'GALLERY', count: 3 },
    { offerId: exampleOfferId(0), day: day(1), placement: 'TRAVEL_DESK', count: 1 },
    { offerId: exampleOfferId(5), day: day(2), placement: 'GALLERY', count: 2 },
    { offerId: exampleOfferId(5), day: day(4), placement: 'SLIDESHOW', count: 1 },
  ];
};

// A real test photo's picture and size (data/seedPhotos.js), and a whole photo from it
const seedImage = (slug) => {
  const { width, height } = seedPhotoBySlug(slug);
  return { width, height, image: { kind: 'seed', slug } };
};
const seedPhoto = (slug, fields) => {
  const photo = seedPhotoBySlug(slug);
  return {
    id: `photo-${slug}`,
    countryCode: photo.countryCode,
    caption: photo.caption,
    latitude: photo.latitude,
    longitude: photo.longitude,
    hidden: false,
    ...seedImage(slug),
    ...fields,
  };
};
// The test photos the five demo photos below don't already use
const MORE_SEED_PHOTOS = [
  'mont-saint-michel',
  'louvre',
  'florence-cathedral',
  'cinque-terre',
  'venice-grand-canal',
  'sagrada-familia',
  'lower-manhattan',
  'golden-gate-bridge',
  'tower-bridge',
  'edinburgh-castle',
  'cliffs-of-moher',
];
// The photos' ids: the five demo photos keep the ids they had before the test photos came
const PHOTO_IDS = { 'eiffel-tower': 'photo-eiffel', colosseum: 'photo-colosseum', alhambra: 'photo-alhambra', 'amsterdam-canal': 'photo-dam', 'belem-tower': 'photo-hidden' };
const photoIdOf = (slug) => PHOTO_IDS[slug] ?? `photo-${slug}`;
// A test photo's date and trip (seed-photos/photos.json, the server seed's too)
const photoTrip = (slug) => (seedPhotoBySlug(slug).trip ? `trip-${seedPhotoBySlug(slug).trip}` : null);
const photoTaken = (slug) => seedPhotoBySlug(slug).takenAt;

const USER_ID = 'mock-user';
const ALEX_ID = 'mock-alex';
const SAM_ID = 'mock-sam';
const JO_ID = 'mock-jo';
const TOM_ID = 'mock-tom';

// A photo matched to a landmark, as the server stores it: with the photo's map, and when it
// was confirmed (null while it's a suggestion). GPS suggestions carry their distance.
const landmarkMatch = (photoId, mapId, landmarkId, { source = 'GPS', distanceM = null, confirmedDaysAgo = null } = {}) => ({
  photoId,
  mapId,
  landmarkId,
  source,
  distanceM,
  confirmed: confirmedDaysAgo !== null,
  confirmedAt: confirmedDaysAgo !== null ? daysAgo(confirmedDaysAgo) : null,
});

// A moment (docs/API.md "Moments"); `happenedOn` is the first day of what's known. A pin
// (`latitude`, `longitude`) is seen by editors always, by viewers only when `spotShared`
const moment = (id, fields) => ({
  id,
  tripId: null,
  text: null,
  happenedOn: null,
  datePrecision: null,
  landmarkId: null,
  placeName: null,
  latitude: null,
  longitude: null,
  spotShared: false,
  hidden: false,
  travellerIds: [],
  photoIds: [],
  createdAt: daysAgo(30),
  updatedAt: daysAgo(30),
  ...fields,
});

// A personal goal (docs/API.md "Badges and goals"): each kind fills only its own field
const goal = (id, fields) => ({
  id,
  title: null,
  target: null,
  countryCodes: [],
  region: null,
  deadline: null,
  achievedAt: null,
  ...fields,
  updatedAt: fields.createdAt,
});

const user = (id, name, email, extra = {}) => ({
  id,
  name,
  email,
  role: 'USER',
  emailVerified: true,
  isActive: true,
  image: null,
  createdAt: daysAgo(120),
  updatedAt: daysAgo(10),
  ...extra,
});

// The test user's map is the demo couple's travels (data/demoTravels.js, the server seed's
// history too; 24 Nov 2026, the user's wish: 20 places in a clear order, every kind of trip,
// both births and the timeline, heritage sites ticked, the strings tied): Charlie is the owner,
// Alex the partner. Ids are the history's keys (`trip-italy`, `stop-rome`, `moment-born`).
const HOME_TRAVELLERS = { owner: 'trav-test', partner: 'trav-alex' };
const HOME_NAMES = { owner: 'Charlie', partner: 'Alex' };
const HOME_USERS = { owner: USER_ID, partner: ALEX_ID };
const named = (text) => (text ? text.replace(/\{owner\}/g, HOME_NAMES.owner).replace(/\{partner\}/g, HOME_NAMES.partner) : null);
const landmarkIdOf = (slug) => (slug ? `lm-${slug}` : null);
const travellerIdsOf = (who) => who.map((t) => HOME_TRAVELLERS[t]);
// A moment only the partner was in is theirs; the rest the owner's
const madeBy = (who) => (who.length === 1 && who[0] === 'partner' ? ALEX_ID : USER_ID);
// The Italian summer's flights keep their ids
const FLIGHT_IDS = { 'italy:LHR': 'flight-rome-out', 'italy:PSA': 'flight-pisa-home' };

function homeHistory(mapId) {
  const trips = DEMO_TRIPS.map((trip) => ({
    id: `trip-${trip.key}`,
    mapId,
    createdById: HOME_USERS[trip.createdBy],
    title: named(trip.title),
    description: trip.description,
    status: trip.status,
    startDate: trip.startDate,
    endDate: trip.endDate,
    coverPhotoId: trip.cover ? photoIdOf(trip.cover) : null,
    linkAccess: trip.linkAccess ?? 'RESTRICTED',
    shareCode: trip.shareCode,
    travellerIds: travellerIdsOf(trip.travellers),
    // Written up the evening it ended; a trip still to come or under way, lately
    createdAt: trip.status === 'COMPLETED' ? `${trip.endDate}T20:00:00.000Z` : daysAgo(20),
  }));
  const stops = DEMO_TRIPS.flatMap((trip) =>
    trip.stops.map((stop, position) => ({
      id: `stop-${stop.key}`,
      tripId: `trip-${trip.key}`,
      position,
      countryCode: stop.countryCode,
      landmarkId: landmarkIdOf(stop.landmark),
      placeName: stop.placeName,
      arriveOn: stop.arriveOn,
      leaveOn: stop.leaveOn,
      notes: stop.notes,
    })),
  );
  const moments = DEMO_MOMENTS.map((m) =>
    moment(`moment-${m.key}`, {
      mapId,
      createdById: madeBy(m.travellers),
      kind: m.kind,
      title: named(m.title),
      text: m.text ?? null,
      happenedOn: m.happenedOn,
      datePrecision: m.datePrecision,
      countryCode: m.countryCode,
      landmarkId: landmarkIdOf(m.landmark),
      placeName: m.placeName ?? null,
      latitude: m.spot?.latitude ?? null,
      longitude: m.spot?.longitude ?? null,
      spotShared: m.spot?.shared ?? false,
      tripId: m.trip ? `trip-${m.trip}` : null,
      hidden: m.hidden ?? false,
      travellerIds: travellerIdsOf(m.travellers),
      photoIds: (m.photos ?? []).map(photoIdOf),
    }),
  );
  return {
    visits: DEMO_VISITS.map((visit) => ({ mapId, ...visit })),
    trips,
    stops,
    moments,
    landmarkVisits: DEMO_LANDMARK_TICKS.map((tick) => ({ mapId, landmarkId: landmarkIdOf(tick.landmark), createdById: HOME_USERS[tick.by], createdAt: `${tick.on}T12:00:00.000Z` })),
    flights: DEMO_FLIGHTS.map((f, i) => ({
      id: FLIGHT_IDS[`${f.trip}:${f.from}`] ?? `flight-${f.trip}-${i}`,
      mapId,
      tripId: `trip-${f.trip}`,
      from: f.from,
      to: f.to,
      flownOn: f.flownOn,
      carrier: f.carrier,
      flightNumber: f.flightNumber,
      distanceKm: f.distanceKm,
      source: f.source,
      createdById: HOME_USERS[f.by],
      createdAt: `${f.flownOn}T22:00:00.000Z`,
    })),
    oneShots: DEMO_ONE_SHOTS.map((shot) => ({
      id: `oneshot-${shot.itemKey}`,
      mapId,
      itemKey: shot.itemKey,
      seenOn: shot.seenOn,
      datePrecision: shot.datePrecision,
      countryCode: shot.countryCode,
      photoIds: [],
      notes: shot.notes,
      source: 'MANUAL',
      travellerIds: travellerIdsOf(shot.travellers),
      createdById: USER_ID,
      createdAt: daysAgo(60),
    })),
    // Tied in the order the places were first visited, oldest first
    mapStrings: DEMO_STRINGS.map(([from, to], i) => ({ id: `string-${from}-${to}`, mapId, from, to, createdAt: new Date(Date.parse(daysAgo(60)) + i * 1000).toISOString() })),
    subdivisionVisits: DEMO_STATES.map((code) => ({ mapId, code, countryCode: 'US', status: 'VISITED' })),
  };
}

export const buildSeed = () => addFirstClassMap(buildBaseSeed());

function buildBaseSeed() {
  const homeMap = 'map-home';
  const home = homeHistory(homeMap);
  const samMap = 'map-sam';
  const joMap = 'map-jo';
  const samTrip = 'trip-sam-asia';
  const lisbonTrip = 'trip-jo-lisbon';
  // Tom's group trip, which Alex (on it as an editor) added to the test user's map: the
  // test user isn't on it, so it shows there with its limited fields only
  const tomMap = 'map-tom';
  const stagTrip = 'trip-tom-stag';
  // Alex's family map (travel copies, docs/API.md): Alex, the test user's traveller Charlie
  // (not linked to their account: the test user says which one they are) and Nora. The test
  // user views it, and can ask for copies of the Easter trip they went on (two photos and a
  // hidden one), the moment about them and the photo of Ireland
  const morgansMap = 'map-morgans';
  const morgansTrip = 'trip-morgans-spain';

  return {
    version: 1,
    users: [
      user(USER_ID, 'Charlie Reid', 'test@myplanetview.local'),
      user(ALEX_ID, 'Alex Morgan', 'alex@example.test'),
      user(SAM_ID, 'Sam Rivers', 'sam@example.test'),
      // Both signed up with the podcast's code (promoCodes below)
      user(JO_ID, 'Jo Patel', 'jo@example.test', { promoCodeId: 'promo-traveltalk' }),
      user(TOM_ID, 'Tom Baker', 'tom@example.test', { promoCodeId: 'promo-traveltalk' }),
      user('mock-admin', 'Ada Lawson', 'admin@example.test', { role: 'ADMIN' }),
      user('mock-paused', 'Pat Quinn', 'paused@example.test', { isActive: false }),
    ],
    maps: [
      { id: homeMap, name: "Charlie & Alex's travels", groupType: 'COUPLE', isDefault: true, ownerId: USER_ID, linkAccess: 'RESTRICTED', shareCode: 'K7QXM2PA9RTW', createdAt: daysAgo(90) },
      { id: samMap, name: "Sam's gap year", groupType: 'SOLO', isDefault: true, ownerId: SAM_ID, linkAccess: 'ANYONE_WITH_LINK', shareCode: 'SAMG4PYEAR22', createdAt: daysAgo(200) },
      { id: joMap, name: "Jo's family trips", groupType: 'FAMILY', isDefault: true, ownerId: JO_ID, linkAccess: 'RESTRICTED', shareCode: 'J0FAM7TRP5QX'.replace('0', 'D'), createdAt: daysAgo(150) },
      { id: tomMap, name: "Tom's map", groupType: 'SOLO', isDefault: true, ownerId: TOM_ID, linkAccess: 'RESTRICTED', shareCode: 'TQMB7KX2PRG4', createdAt: daysAgo(300) },
      { id: morgansMap, name: 'The Morgans', groupType: 'FAMILY', isDefault: true, ownerId: ALEX_ID, linkAccess: 'RESTRICTED', shareCode: 'MRGNSFAM7KQX', createdAt: daysAgo(400) },
    ],
    travellers: [
      { id: 'trav-test', mapId: homeMap, name: 'Charlie', position: 0, userId: USER_ID, ...DEMO_TRAVELLERS.owner },
      { id: 'trav-alex', mapId: homeMap, name: 'Alex', position: 1, userId: ALEX_ID, ...DEMO_TRAVELLERS.partner },
      { id: 'trav-sam', mapId: samMap, name: 'Sam', position: 0, userId: SAM_ID, birthCountryCode: 'AU', favouriteCountryCode: 'TH', birthDate: '1996-02-20' },
      { id: 'trav-jo', mapId: joMap, name: 'Jo', position: 0, userId: JO_ID, birthCountryCode: 'GB', favouriteCountryCode: 'PT', birthDate: '1985-09-12' },
      { id: 'trav-jo-kid', mapId: joMap, name: 'Mia', position: 1, userId: null, birthCountryCode: 'GB', favouriteCountryCode: null, birthDate: '2018-03-15' },
      { id: 'trav-tom', mapId: tomMap, name: 'Tom', position: 0, userId: TOM_ID, birthCountryCode: 'GB', favouriteCountryCode: 'CZ', birthDate: '1989-11-02' },
      { id: 'trav-morgan-alex', mapId: morgansMap, name: 'Alex', position: 0, userId: ALEX_ID, birthCountryCode: 'IE', favouriteCountryCode: 'IT', birthDate: DEMO_TRAVELLERS.partner.birthDate },
      { id: 'trav-morgan-charlie', mapId: morgansMap, name: 'Charlie', position: 1, userId: null, birthCountryCode: 'GB', favouriteCountryCode: null, birthDate: DEMO_TRAVELLERS.owner.birthDate },
      { id: 'trav-morgan-nora', mapId: morgansMap, name: 'Nora', position: 2, userId: null, birthCountryCode: 'IE', favouriteCountryCode: 'ES', birthDate: '1962-04-22' },
    ],
    mapMembers: [
      { mapId: homeMap, userId: ALEX_ID, role: 'EDITOR', createdAt: daysAgo(80) },
      { mapId: homeMap, userId: SAM_ID, role: 'VIEWER', createdAt: daysAgo(30) },
      { mapId: samMap, userId: USER_ID, role: 'VIEWER', createdAt: daysAgo(25) },
      { mapId: morgansMap, userId: USER_ID, role: 'VIEWER', createdAt: daysAgo(8) },
    ],
    tripMembers: [
      { tripId: lisbonTrip, userId: USER_ID, role: 'EDITOR', createdAt: daysAgo(12) },
      { tripId: stagTrip, userId: ALEX_ID, role: 'EDITOR', createdAt: daysAgo(14) },
    ],
    // Group trips shown on other maps (docs/API.md "Group trips"): who added each, and when
    tripMaps: [{ tripId: stagTrip, mapId: homeMap, addedById: ALEX_ID, createdAt: daysAgo(10) }],
    invites: [
      { id: 'invite-jo', email: 'jo@example.test', role: 'VIEWER', mapId: homeMap, tripId: null, invitedById: USER_ID, token: null, expiresAt: daysFromNow(9), acceptedAt: null },
      // Open /invite/demo-invite to accept this one (the Jo family map, as a viewer)
      { id: 'invite-demo', email: 'test@myplanetview.local', role: 'VIEWER', mapId: joMap, tripId: null, invitedById: JO_ID, token: 'demo-invite', expiresAt: daysFromNow(14), acceptedAt: null },
    ],
    visits: [
      ...home.visits,
      { mapId: samMap, countryCode: 'TH', status: 'VISITED', source: 'TRIP', firstVisitedOn: '2024-01-10', notes: 'Next time: the islands in the south.' },
      { mapId: samMap, countryCode: 'VN', status: 'VISITED', source: 'TRIP', firstVisitedOn: '2024-02-02', notes: null },
      { mapId: samMap, countryCode: 'KH', status: 'VISITED', source: 'TRIP', firstVisitedOn: '2024-02-20', notes: null },
      { mapId: samMap, countryCode: 'AU', status: 'LIVED', source: 'MANUAL', firstVisitedOn: '2001-01-01', notes: null },
      { mapId: joMap, countryCode: 'PT', status: 'VISITED', source: 'TRIP', firstVisitedOn: '2026-10-03', notes: null },
      { mapId: joMap, countryCode: 'GB', status: 'LIVED', source: 'MANUAL', firstVisitedOn: null, notes: null },
      { mapId: tomMap, countryCode: 'GB', status: 'LIVED', source: 'MANUAL', firstVisitedOn: null, notes: null },
      { mapId: morgansMap, countryCode: 'IE', status: 'LIVED', source: 'MANUAL', firstVisitedOn: null, notes: null },
      { mapId: morgansMap, countryCode: 'ES', status: 'VISITED', source: 'TRIP', firstVisitedOn: '2010-04-01', notes: null },
    ],
    trips: [
      ...home.trips,
      { id: samTrip, mapId: samMap, createdById: SAM_ID, title: 'South-East Asia loop', description: null, status: 'COMPLETED', startDate: '2024-01-08', endDate: '2024-03-01', coverPhotoId: null, linkAccess: 'RESTRICTED', shareCode: 'SEAK22P7MKQ3', travellerIds: ['trav-sam'], createdAt: daysAgo(190) },
      { id: lisbonTrip, mapId: joMap, createdById: JO_ID, title: 'Lisbon weekend', description: 'Planning together: add ideas!', status: 'COMPLETED', startDate: '2026-10-03', endDate: '2026-10-06', coverPhotoId: null, linkAccess: 'RESTRICTED', shareCode: 'K5BNWK3ND7QT', travellerIds: ['trav-jo', 'trav-jo-kid'], createdAt: daysAgo(40) },
      { id: stagTrip, mapId: tomMap, createdById: TOM_ID, title: 'Stag do in Prague', description: 'Three nights, eleven friends.', status: 'PLANNED', startDate: '2027-05-14', endDate: '2027-05-17', coverPhotoId: null, linkAccess: 'RESTRICTED', shareCode: 'STGPRG5QW8MN', travellerIds: ['trav-tom'], createdAt: daysAgo(15) },
      { id: morgansTrip, mapId: morgansMap, createdById: ALEX_ID, title: 'Spain at Easter', description: 'Barcelona, then the train to Granada.', status: 'COMPLETED', startDate: '2010-04-01', endDate: '2010-04-10', coverPhotoId: 'photo-morgans-sagrada', linkAccess: 'RESTRICTED', shareCode: 'MRGN7SPAQX42', travellerIds: ['trav-morgan-alex', 'trav-morgan-charlie', 'trav-morgan-nora'], createdAt: daysAgo(390) },
    ],
    stops: [
      ...home.stops,
      { id: 'stop-bangkok', tripId: samTrip, position: 0, countryCode: 'TH', landmarkId: null, placeName: 'Bangkok', arriveOn: '2024-01-08', leaveOn: '2024-02-01', notes: null },
      { id: 'stop-hanoi', tripId: samTrip, position: 1, countryCode: 'VN', landmarkId: null, placeName: 'Hanoi', arriveOn: '2024-02-01', leaveOn: '2024-02-19', notes: null },
      { id: 'stop-siem', tripId: samTrip, position: 2, countryCode: 'KH', landmarkId: null, placeName: 'Siem Reap', arriveOn: '2024-02-19', leaveOn: '2024-03-01', notes: null },
      { id: 'stop-lisbon', tripId: lisbonTrip, position: 0, countryCode: 'PT', landmarkId: 'lm-tower-of-belem', placeName: 'Lisbon', arriveOn: '2026-10-03', leaveOn: '2026-10-06', notes: null },
      { id: 'stop-prague', tripId: stagTrip, position: 0, countryCode: 'CZ', landmarkId: 'lm-prague-castle', placeName: 'Prague', arriveOn: '2027-05-14', leaveOn: '2027-05-17', notes: null },
      { id: 'stop-morgans-barcelona', tripId: morgansTrip, position: 0, countryCode: 'ES', landmarkId: null, placeName: 'Barcelona', arriveOn: '2010-04-01', leaveOn: '2010-04-06', notes: null },
      { id: 'stop-morgans-granada', tripId: morgansTrip, position: 1, countryCode: 'ES', landmarkId: 'lm-alhambra', placeName: 'Granada', arriveOn: '2010-04-06', leaveOn: '2010-04-10', notes: null },
    ],
    // Moments (docs/API.md "Moments"). The test user's map: the demo couple's timeline (both
    // births, the move, engaged, married, the trips' days; one hidden from viewers: homeHistory).
    // Sam's map: one on his trip and one
    // hidden. Jo's map: one on the Lisbon trip (the test user edits that trip alone) and one
    // that isn't, which the test user can't see.
    moments: [
      ...home.moments,
      moment('moment-angkor', { mapId: samMap, createdById: SAM_ID, kind: 'SAW_OR_DID', title: 'Sunrise at Angkor Wat', happenedOn: '2024-02-21', datePrecision: 'DAY', countryCode: 'KH', landmarkId: 'lm-angkor-wat', latitude: 13.4125, longitude: 103.867, spotShared: true, tripId: samTrip, travellerIds: ['trav-sam'] }),
      moment('moment-passport', { mapId: samMap, createdById: SAM_ID, kind: 'SAW_OR_DID', title: 'Lost my passport in Bangkok', happenedOn: '2024-01-15', datePrecision: 'DAY', countryCode: 'TH', hidden: true, tripId: samTrip, travellerIds: ['trav-sam'], photoIds: ['photo-bangkok'] }),
      moment('moment-nata', { mapId: joMap, createdById: JO_ID, kind: 'SAW_OR_DID', title: 'Pastéis de nata at Belém', happenedOn: '2026-10-04', datePrecision: 'DAY', countryCode: 'PT', landmarkId: 'lm-tower-of-belem', tripId: lisbonTrip, travellerIds: ['trav-jo', 'trav-jo-kid'], photoIds: ['photo-lisbon'] }),
      moment('moment-mia', { mapId: joMap, createdById: JO_ID, kind: 'BORN', title: 'Mia was born', happenedOn: '2018-03-01', datePrecision: 'MONTH', countryCode: 'GB', travellerIds: ['trav-jo-kid'] }),
      moment('moment-morgans-churros', { mapId: morgansMap, createdById: ALEX_ID, kind: 'SAW_OR_DID', title: 'Charlie’s first churros', happenedOn: '2010-04-03', datePrecision: 'DAY', countryCode: 'ES', placeName: 'Barcelona', tripId: morgansTrip, travellerIds: ['trav-morgan-charlie'], photoIds: ['photo-morgans-sagrada'] }),
    ],
    // Personal goals (docs/API.md "Badges and goals"). The test user's map: twenty-five
    // countries by a deadline (20 of 25: each visit's first day is before it), a bucket list of
    // its "want to go" countries (0 of 3), and the British Isles, reached. Sam's map: one the
    // test user (a viewer there) can only read. The badges the data has already earned are
    // awarded quietly when the store is made (store.js, awardQuietly), so no pop-up greets
    // the first visit.
    goals: [
      goal('goal-ten', { mapId: homeMap, createdById: USER_ID, kind: 'COUNTRY_COUNT', title: 'Twenty-five countries by the end of 2027', target: 25, deadline: '2027-12-31', createdAt: daysAgo(60) }),
      goal('goal-bucket', { mapId: homeMap, createdById: ALEX_ID, kind: 'COUNTRY_LIST', title: 'Our bucket list', countryCodes: ['JP', 'PE', 'IS'], createdAt: daysAgo(45) }),
      goal('goal-isles', { mapId: homeMap, createdById: USER_ID, kind: 'REGION', region: 'british-isles', achievedAt: daysAgo(80), createdAt: daysAgo(85) }),
      goal('goal-sam-asia', { mapId: samMap, createdById: SAM_ID, kind: 'REGION', title: 'All of Southeast Asia', region: 'southeast-asia', createdAt: daysAgo(150) }),
    ],
    // image.kind 'seed' = one of the real test photos in the repo's seed-photos/ (served
    // at /seed-photos in development; data/seedPhotos.js); 'asset' = one of the site's
    // posters, named as in posterData.js, standing in on the other people's maps
    photos: [
      { id: 'photo-eiffel', mapId: homeMap, uploaderId: USER_ID, tripId: photoTrip('eiffel-tower'), countryCode: 'FR', caption: 'Evening by the Seine', takenAt: photoTaken('eiffel-tower'), latitude: 48.8583, longitude: 2.2944, ...seedImage('eiffel-tower'), hidden: false, createdAt: daysAgo(60) },
      { id: 'photo-colosseum', mapId: homeMap, uploaderId: ALEX_ID, tripId: photoTrip('colosseum'), countryCode: 'IT', caption: 'First morning in Rome', takenAt: photoTaken('colosseum'), latitude: 41.8901, longitude: 12.4923, ...seedImage('colosseum'), hidden: false, createdAt: daysAgo(50) },
      { id: 'photo-alhambra', mapId: homeMap, uploaderId: USER_ID, tripId: photoTrip('alhambra'), countryCode: 'ES', caption: 'Granada', takenAt: photoTaken('alhambra'), latitude: 37.1762, longitude: -3.5882, ...seedImage('alhambra'), hidden: false, createdAt: daysAgo(40) },
      { id: 'photo-dam', mapId: homeMap, uploaderId: USER_ID, tripId: photoTrip('amsterdam-canal'), countryCode: 'NL', caption: 'Canals at dusk', takenAt: photoTaken('amsterdam-canal'), latitude: 52.3731, longitude: 4.8926, ...seedImage('amsterdam-canal'), hidden: false, createdAt: daysAgo(30) },
      { id: 'photo-hidden', mapId: homeMap, uploaderId: USER_ID, tripId: photoTrip('belem-tower'), countryCode: 'PT', caption: 'Hidden from viewers (editors only)', takenAt: photoTaken('belem-tower'), latitude: 38.6916, longitude: -9.2159, ...seedImage('belem-tower'), hidden: true, createdAt: daysAgo(20) },
      // The rest of the test photos, on the same map: several per country, each on the trip
      // it was taken on (seed-photos/photos.json)
      ...MORE_SEED_PHOTOS.map((slug, index) => seedPhoto(slug, {
        mapId: homeMap,
        uploaderId: seedPhotoBySlug(slug).uploader === 'partner' ? ALEX_ID : USER_ID,
        tripId: photoTrip(slug),
        takenAt: photoTaken(slug),
        createdAt: daysAgo(70 + index),
      })),
      { id: 'photo-bangkok', mapId: samMap, uploaderId: SAM_ID, tripId: samTrip, countryCode: 'TH', caption: 'Temple roofs', takenAt: '2024-01-12T09:00:00.000Z', latitude: null, longitude: null, width: 1024, height: 1792, hidden: false, image: { kind: 'asset', name: 'th' }, createdAt: daysAgo(180) },
      { id: 'photo-lisbon', mapId: joMap, uploaderId: JO_ID, tripId: lisbonTrip, countryCode: 'PT', caption: 'Belém', takenAt: '2026-10-04T11:00:00.000Z', latitude: 38.6916, longitude: -9.216, width: 1024, height: 1792, hidden: false, image: { kind: 'asset', name: 'pt' }, createdAt: daysAgo(35) },
      // The Morgans' (Alex's family map): the Easter trip's two photos and a hidden one, and Ireland
      seedPhoto('sagrada-familia', { id: 'photo-morgans-sagrada', mapId: morgansMap, uploaderId: ALEX_ID, tripId: morgansTrip, caption: 'Sagrada Família, still building', takenAt: '2010-04-02T11:00:00.000Z', createdAt: daysAgo(380) }),
      seedPhoto('alhambra', { id: 'photo-morgans-alhambra', mapId: morgansMap, uploaderId: ALEX_ID, tripId: morgansTrip, caption: 'The Alhambra at last', takenAt: '2010-04-07T17:30:00.000Z', createdAt: daysAgo(379) }),
      seedPhoto('alhambra', { id: 'photo-morgans-hidden', mapId: morgansMap, uploaderId: ALEX_ID, tripId: morgansTrip, caption: 'Hidden from viewers (editors only)', takenAt: '2010-04-08T10:00:00.000Z', hidden: true, createdAt: daysAgo(378) }),
      seedPhoto('cliffs-of-moher', { id: 'photo-morgans-moher', mapId: morgansMap, uploaderId: ALEX_ID, caption: 'Christmas walk on the cliffs', takenAt: '2012-12-27T13:00:00.000Z', createdAt: daysAgo(370) }),
    ],
    // Landmark matches: a confirmed one stamps the map's passport (docs/API.md "Passport").
    // The test user's map has photo stamps in seven countries (and 12 more from the landmarks
    // the demo couple ticked "been here": landmarkVisits): two photos of Paris's banks of the
    // Seine (so an editor can pick the stamp's photo), Belém only on a hidden photo (a stamp
    // for editors alone), and the Alhambra still a suggestion (no stamp yet). Sam's map has
    // one, for the passport's viewers.
    photoLandmarks: [
      landmarkMatch('photo-eiffel', homeMap, 'lm-eiffel-tower', { distanceM: 12, confirmedDaysAgo: 60 }),
      landmarkMatch('photo-eiffel', homeMap, 'lm-paris-banks-of-the-seine', { source: 'MANUAL', confirmedDaysAgo: 59 }),
      landmarkMatch('photo-louvre', homeMap, 'lm-paris-banks-of-the-seine', { source: 'MANUAL', confirmedDaysAgo: 58 }),
      landmarkMatch('photo-mont-saint-michel', homeMap, 'lm-mont-saint-michel', { distanceM: 1812, confirmedDaysAgo: 70 }),
      landmarkMatch('photo-colosseum', homeMap, 'lm-colosseum', { distanceM: 14, confirmedDaysAgo: 50 }),
      landmarkMatch('photo-florence-cathedral', homeMap, 'lm-historic-centre-of-florence', { distanceM: 1270, confirmedDaysAgo: 49 }),
      landmarkMatch('photo-cinque-terre', homeMap, 'lm-portovenere-and-cinque-terre', { distanceM: 140, confirmedDaysAgo: 49 }),
      landmarkMatch('photo-venice-grand-canal', homeMap, 'lm-venice-and-its-lagoon', { distanceM: 479, confirmedDaysAgo: 48 }),
      landmarkMatch('photo-alhambra', homeMap, 'lm-alhambra', { distanceM: 15 }),
      landmarkMatch('photo-sagrada-familia', homeMap, 'lm-works-of-gaudi-sagrada-familia', { source: 'MANUAL', confirmedDaysAgo: 40 }),
      landmarkMatch('photo-hidden', homeMap, 'lm-tower-of-belem', { distanceM: 24, confirmedDaysAgo: 20 }),
      landmarkMatch('photo-dam', homeMap, 'lm-amsterdam-canal-ring', { distanceM: 876, confirmedDaysAgo: 30 }),
      landmarkMatch('photo-tower-bridge', homeMap, 'lm-tower-of-london', { distanceM: 311, confirmedDaysAgo: 75 }),
      landmarkMatch('photo-edinburgh-castle', homeMap, 'lm-old-and-new-towns-of-edinburgh', { distanceM: 1215, confirmedDaysAgo: 74 }),
      landmarkMatch('photo-cliffs-of-moher', homeMap, 'lm-cliffs-of-moher', { source: 'MANUAL', confirmedDaysAgo: 72 }),
      landmarkMatch('photo-bangkok', samMap, 'lm-historic-city-of-ayutthaya', { source: 'MANUAL', confirmedDaysAgo: 170 }),
      landmarkMatch('photo-lisbon', joMap, 'lm-tower-of-belem', { distanceM: 8, confirmedDaysAgo: 34 }),
      landmarkMatch('photo-morgans-alhambra', morgansMap, 'lm-alhambra', { distanceM: 15, confirmedDaysAgo: 370 }),
    ],
    // Taking your travels with you (docs/API.md "Travel copies"): none asked for yet
    travelCopyRequests: [],
    // The photo an editor picked for a stamp (none yet: each shows its earliest photo)
    landmarkCovers: [],
    // World Heritage Sites and other landmarks ticked "been here" (they stamp the passport too)
    landmarkVisits: home.landmarkVisits,
    // Strings between places: every place tied to the one visited before it
    mapStrings: home.mapStrings,
    // "Guess where I was" (docs/API.md): a game of the test user's photos, played once by Sam
    guessGames: [
      {
        id: 'guess-home',
        mapId: homeMap,
        code: 'GWHR2WAS7MAP',
        title: 'Guess where we were',
        photoIds: ['photo-eiffel', 'photo-colosseum', 'photo-dam', 'photo-alhambra'],
        createdById: USER_ID,
        createdAt: daysAgo(6),
      },
    ],
    // Slideshows of chosen photos (docs/API.md "Photo slideshows"): three of the test user's
    // photos, shared by their own link
    photoShows: [
      {
        id: 'show-home',
        mapId: homeMap,
        code: 'SPN2SHW8TRP5',
        title: 'Our favourite photos',
        photoIds: ['photo-colosseum', 'photo-eiffel', 'photo-dam'],
        seconds: 5,
        createdById: USER_ID,
        createdAt: daysAgo(3),
        updatedAt: daysAgo(3),
      },
    ],
    // Postcards (docs/API.md "Postcards"): two the test user sent, each by its own link, never
    // part of a map: a country's card from France, and the Colosseum's from Italy
    postcards: [
      {
        id: 'postcard-france',
        code: 'PST2CRD8FRNC',
        senderId: USER_ID,
        kind: 'COUNTRY',
        countryCode: 'FR',
        landmarkId: null,
        pictureKey: null,
        style: 'classic',
        message: 'Bonjour Gran!\nParis is lovely in the rain. We climbed the Eiffel Tower and ate far too many croissants.',
        toName: 'Gran',
        fromName: 'Charlie',
        createdAt: daysAgo(4),
      },
      {
        id: 'postcard-rome',
        code: 'PST2CRD8RMEC',
        senderId: USER_ID,
        kind: 'LANDMARK',
        countryCode: 'IT',
        landmarkId: 'lm-colosseum',
        pictureKey: null,
        style: 'airmail',
        message: 'Ciao! The Colosseum is even bigger than in the films.',
        toName: 'Sam',
        fromName: 'Charlie & Alex',
        createdAt: daysAgo(2),
      },
    ],
    // Life's One Shots (24 Nov 2026): a puffin off Ireland, and the safari's
    oneShots: home.oneShots,
    // The flight log (docs/API.md "Flights"): every trip's flights
    flights: home.flights,
    guessPlays: [
      { id: 'guess-play-sam', gameId: 'guess-home', points: [1000, 1000, 540, 440], score: 2980, name: 'Sam', finishedAt: daysAgo(5), createdAt: daysAgo(5) },
    ],
    // Plans (docs/API.md, "Plans and billing"). The test user pays monthly for Business
    // and one extra map: originals kept, and room for one more map than the one they own
    // (the switcher's "New map" works). Everyone else is on Economy. The mock badge's
    // Plan and Extra maps controls change the test user's.
    subscriptions: [
      { userId: USER_ID, plan: 'REGULAR', interval: 'MONTH', status: 'active', currentPeriodEnd: daysFromNow(18), cancelAtPeriodEnd: false, extraMaps: 1, stripeCustomerId: 'cus_mock_test' },
    ],
    planGrants: [],
    // Influencer codes (docs/API.md, "Promo codes"): a creator's code (up to 500 sign-ups)
    // and a podcast's (Jo and Tom used it). Each gives the same offer: the follower's first
    // month free on a paid plan, as a trial on their first paid Checkout
    promoCodes: [
      { id: 'promo-samtravels', code: 'SAMTRAVELS', label: 'Sam’s Travels on YouTube, spring 2027', active: true, maxUses: 500, endsAt: daysFromNow(120), createdById: 'mock-admin', createdAt: daysAgo(20) },
      { id: 'promo-traveltalk', code: 'TRAVELTALK', label: 'Travel Talk podcast', active: true, maxUses: null, endsAt: null, createdById: 'mock-admin', createdAt: daysAgo(45) },
    ],
    // Travel offers (docs/API.md, "Travel offers"): the server's example file, as an import
    // leaves them (fixed ids by place in the file), and a few days of click tallies
    offers: exampleOffers(),
    offerClicks: exampleOfferClicks(),
    // Monthly photo themes (docs/API.md, "Photo themes"): last month's, this month's and ten
    // more, with two of the test user's photos in this month's and one in last month's
    themes: exampleThemes(),
    // A friends challenge (docs/API.md, "Friends challenges") Sam started, with the test user
    // and Jo in. Fixed dates, so the counts never move: the test user 2 countries (Italy,
    // France), Jo 1 (Portugal), Sam 0
    challenges: [
      {
        id: 'challenge-two-years',
        title: 'Two years on the road',
        measure: 'COUNTRIES',
        startsOn: '2025-01-01',
        endsOn: '2026-12-31',
        target: null,
        joinCode: 'CHA2YR5RDTRP',
        createdById: SAM_ID,
        createdAt: daysAgo(60),
      },
    ],
    challengeEntries: [
      { challengeId: 'challenge-two-years', userId: SAM_ID, mapId: samMap, joinedAt: daysAgo(60) },
      { challengeId: 'challenge-two-years', userId: USER_ID, mapId: homeMap, joinedAt: daysAgo(50) },
      { challengeId: 'challenge-two-years', userId: JO_ID, mapId: joMap, joinedAt: daysAgo(40) },
    ],
    // Vs mode (docs/API.md "Vs mode", 26 Nov 2026): the test user's comparison with Sam and Jo,
    // and one of Sam's the test user isn't in yet (its link opens the join page)
    vsGroups: [
      { id: 'vs-friends', title: 'Who has travelled most?', joinCode: 'VS22FRND8MAX', createdById: USER_ID, createdAt: daysAgo(30) },
      { id: 'vs-sams-crew', title: 'Sam’s crew', joinCode: 'SAMCRW22VS88', createdById: SAM_ID, createdAt: daysAgo(20) },
    ],
    vsMembers: [
      { groupId: 'vs-friends', userId: USER_ID, mapId: homeMap, joinedAt: daysAgo(30) },
      { groupId: 'vs-friends', userId: SAM_ID, mapId: samMap, joinedAt: daysAgo(28) },
      { groupId: 'vs-friends', userId: JO_ID, mapId: joMap, joinedAt: daysAgo(25) },
      { groupId: 'vs-sams-crew', userId: SAM_ID, mapId: samMap, joinedAt: daysAgo(20) },
      { groupId: 'vs-sams-crew', userId: TOM_ID, mapId: tomMap, joinedAt: daysAgo(19) },
    ],
    // Country maps (18 Nov 2026): the US's New York, Massachusetts and California (the first trip),
    // and a pin in Paris gone back to twice, each visit with its own photos
    subdivisionVisits: home.subdivisionVisits,
    pins: [
      { id: 'pin-paris', mapId: homeMap, countryCode: 'FR', name: 'Paris', notes: 'Our city: we keep coming back.', latitude: 48.8566, longitude: 2.3522, hidden: false, createdById: USER_ID, createdAt: daysAgo(60) },
    ],
    pinVisits: [
      { id: 'pin-visit-paris-2019', pinId: 'pin-paris', visitedOn: '2019-04-01', datePrecision: 'MONTH', notes: 'Engaged by the Eiffel Tower.', photoIds: ['photo-eiffel'], createdAt: daysAgo(60) },
      { id: 'pin-visit-paris-2025', pinId: 'pin-paris', visitedOn: '2025-05-01', datePrecision: 'MONTH', notes: 'Back for the Louvre.', photoIds: ['photo-louvre'], createdAt: daysAgo(20) },
    ],
    themeEntries: exampleThemeEntries(new Date(), {
      mapId: homeMap,
      userId: USER_ID,
      current: ['photo-dam', 'photo-eiffel'],
      last: ['photo-alhambra'],
    }),
    mapSettings: null,
    // Feedback sent from the map (docs/API.md "Feedback"): a problem with a screenshot, an idea
    // in progress and a question answered, for the admin page
    feedback: exampleFeedback({ userId: USER_ID, otherId: SAM_ID, mapId: homeMap, daysAgo }),
    contactForms: [
      { id: 'contact-1', name: 'Priya Shah', email: 'priya@example.test', message: 'Can I share one trip without sharing my whole map?', imageKey: null, createdAt: daysAgo(3) },
      { id: 'contact-2', name: 'Tom Lee', email: 'tom.lee@example.test', message: 'Love the posters. Will there be one for Peru?', imageKey: null, createdAt: daysAgo(9) },
    ],
    events: [
      { id: 'event-1', level: 'INFO', status: 'OPEN', important: false, domain: 'user', action: 'login', message: 'User signed in', statusCode: 200, path: '/api/auth/sign-in/email', method: 'POST', requestId: 'req-1', metadata: null, actorId: USER_ID, targetId: null, createdAt: daysAgo(1) },
      { id: 'event-2', level: 'WARNING', status: 'OPEN', important: true, domain: 'sharing', action: 'invite', message: 'Invite sent to an address with no account', statusCode: 201, path: '/api/maps/map-home/members', method: 'POST', requestId: 'req-2', metadata: null, actorId: USER_ID, targetId: null, createdAt: daysAgo(2) },
      { id: 'event-3', level: 'ERROR', status: 'ACKNOWLEDGED', important: false, domain: 'photo', action: 'confirm', message: 'Upload larger than the display size cap', statusCode: 413, path: '/api/maps/map-home/photos', method: 'POST', requestId: 'req-3', metadata: null, actorId: ALEX_ID, targetId: null, createdAt: daysAgo(5) },
      { id: 'event-4', level: 'CRITICAL', status: 'RESOLVED', important: true, domain: 'server', action: 'error', message: 'Database connection lost (demo row)', statusCode: 500, path: '/api/maps', method: 'GET', requestId: 'req-4', metadata: null, actorId: null, targetId: null, createdAt: daysAgo(12) },
    ],
  };
}

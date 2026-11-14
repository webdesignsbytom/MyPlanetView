// Mock mode only. The demo data a fresh mock session starts with: the signed-in
// test user's couple's map (owned), a map someone shared with them, a trip shared on
// its own, and the admin lists. Photos use the site's own poster images as stand-ins.

const daysFromNow = (days) => new Date(Date.now() + days * 86400000).toISOString();
const daysAgo = (days) => daysFromNow(-days);

const USER_ID = 'mock-user';
const ALEX_ID = 'mock-alex';
const SAM_ID = 'mock-sam';
const JO_ID = 'mock-jo';

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

export function buildSeed() {
  const homeMap = 'map-home';
  const samMap = 'map-sam';
  const joMap = 'map-jo';
  const italyTrip = 'trip-italy';
  const japanTrip = 'trip-japan';
  const samTrip = 'trip-sam-asia';
  const lisbonTrip = 'trip-jo-lisbon';

  return {
    version: 1,
    users: [
      user(USER_ID, 'Test Traveller', 'test@myplanetview.local'),
      user(ALEX_ID, 'Alex Morgan', 'alex@example.test'),
      user(SAM_ID, 'Sam Rivers', 'sam@example.test'),
      user(JO_ID, 'Jo Patel', 'jo@example.test'),
      user('mock-admin', 'Ada Admin', 'admin@example.test', { role: 'ADMIN' }),
      user('mock-paused', 'Pat Paused', 'paused@example.test', { isActive: false }),
    ],
    maps: [
      { id: homeMap, name: "Test & Alex's travels", groupType: 'COUPLE', isDefault: true, ownerId: USER_ID, linkAccess: 'RESTRICTED', shareCode: 'K7QXM2PA9RTW', createdAt: daysAgo(90) },
      { id: samMap, name: "Sam's gap year", groupType: 'SOLO', isDefault: true, ownerId: SAM_ID, linkAccess: 'ANYONE_WITH_LINK', shareCode: 'SAMG4PYEAR22', createdAt: daysAgo(200) },
      { id: joMap, name: "Jo's family trips", groupType: 'FAMILY', isDefault: true, ownerId: JO_ID, linkAccess: 'RESTRICTED', shareCode: 'J0FAM7TRP5QX'.replace('0', 'D'), createdAt: daysAgo(150) },
    ],
    travellers: [
      { id: 'trav-test', mapId: homeMap, name: 'Test', position: 0, userId: USER_ID, birthCountryCode: 'GB', favouriteCountryCode: 'JP' },
      { id: 'trav-alex', mapId: homeMap, name: 'Alex', position: 1, userId: ALEX_ID, birthCountryCode: 'IE', favouriteCountryCode: 'IT' },
      { id: 'trav-sam', mapId: samMap, name: 'Sam', position: 0, userId: SAM_ID, birthCountryCode: 'AU', favouriteCountryCode: 'TH' },
      { id: 'trav-jo', mapId: joMap, name: 'Jo', position: 0, userId: JO_ID, birthCountryCode: 'GB', favouriteCountryCode: 'PT' },
      { id: 'trav-jo-kid', mapId: joMap, name: 'Mia', position: 1, userId: null, birthCountryCode: 'GB', favouriteCountryCode: null },
    ],
    mapMembers: [
      { mapId: homeMap, userId: ALEX_ID, role: 'EDITOR', createdAt: daysAgo(80) },
      { mapId: homeMap, userId: SAM_ID, role: 'VIEWER', createdAt: daysAgo(30) },
      { mapId: samMap, userId: USER_ID, role: 'VIEWER', createdAt: daysAgo(25) },
    ],
    tripMembers: [{ tripId: lisbonTrip, userId: USER_ID, role: 'EDITOR', createdAt: daysAgo(12) }],
    invites: [
      { id: 'invite-jo', email: 'jo@example.test', role: 'VIEWER', mapId: homeMap, tripId: null, invitedById: USER_ID, token: null, expiresAt: daysFromNow(9), acceptedAt: null },
      // Open /invite/demo-invite to accept this one (the Jo family map, as a viewer)
      { id: 'invite-demo', email: 'test@myplanetview.local', role: 'VIEWER', mapId: joMap, tripId: null, invitedById: JO_ID, token: 'demo-invite', expiresAt: daysFromNow(14), acceptedAt: null },
    ],
    visits: [
      { mapId: homeMap, countryCode: 'GB', status: 'LIVED', source: 'MANUAL', firstVisitedOn: '1990-05-01', notes: 'Home' },
      { mapId: homeMap, countryCode: 'IE', status: 'LIVED', source: 'MANUAL', firstVisitedOn: '2012-09-01', notes: null },
      { mapId: homeMap, countryCode: 'FR', status: 'VISITED', source: 'PHOTO', firstVisitedOn: '2019-04-12', notes: null },
      { mapId: homeMap, countryCode: 'ES', status: 'VISITED', source: 'MANUAL', firstVisitedOn: '2018-08-03', notes: null },
      { mapId: homeMap, countryCode: 'IT', status: 'VISITED', source: 'TRIP', firstVisitedOn: '2025-07-02', notes: null },
      { mapId: homeMap, countryCode: 'PT', status: 'VISITED', source: 'MANUAL', firstVisitedOn: '2021-10-20', notes: null },
      { mapId: homeMap, countryCode: 'NL', status: 'VISITED', source: 'MANUAL', firstVisitedOn: '2016-03-11', notes: null },
      { mapId: homeMap, countryCode: 'US', status: 'VISITED', source: 'MANUAL', firstVisitedOn: '2014-06-20', notes: 'New York and Boston' },
      { mapId: homeMap, countryCode: 'JP', status: 'WANT_TO_GO', source: 'MANUAL', firstVisitedOn: null, notes: 'Cherry blossom season' },
      { mapId: homeMap, countryCode: 'PE', status: 'WANT_TO_GO', source: 'MANUAL', firstVisitedOn: null, notes: null },
      { mapId: homeMap, countryCode: 'IS', status: 'WANT_TO_GO', source: 'MANUAL', firstVisitedOn: null, notes: null },
      { mapId: samMap, countryCode: 'TH', status: 'VISITED', source: 'TRIP', firstVisitedOn: '2024-01-10', notes: null },
      { mapId: samMap, countryCode: 'VN', status: 'VISITED', source: 'TRIP', firstVisitedOn: '2024-02-02', notes: null },
      { mapId: samMap, countryCode: 'KH', status: 'VISITED', source: 'TRIP', firstVisitedOn: '2024-02-20', notes: null },
      { mapId: samMap, countryCode: 'AU', status: 'LIVED', source: 'MANUAL', firstVisitedOn: '2001-01-01', notes: null },
      { mapId: joMap, countryCode: 'PT', status: 'VISITED', source: 'TRIP', firstVisitedOn: '2026-10-03', notes: null },
      { mapId: joMap, countryCode: 'GB', status: 'LIVED', source: 'MANUAL', firstVisitedOn: null, notes: null },
    ],
    trips: [
      { id: italyTrip, mapId: homeMap, createdById: USER_ID, title: 'Italian summer', description: 'Rome to Florence by train, with a few days by the sea.', status: 'COMPLETED', startDate: '2025-07-02', endDate: '2025-07-16', coverPhotoId: 'photo-colosseum', linkAccess: 'RESTRICTED', shareCode: 'TRPTAL7SMR42', travellerIds: ['trav-test', 'trav-alex'], createdAt: daysAgo(140) },
      { id: japanTrip, mapId: homeMap, createdById: USER_ID, title: 'Japan in spring', description: 'Tokyo, Kyoto and a day at Mount Fuji.', status: 'PLANNED', startDate: '2027-04-01', endDate: '2027-04-14', coverPhotoId: null, linkAccess: 'RESTRICTED', shareCode: 'JPNSPR7NG289', travellerIds: ['trav-test', 'trav-alex'], createdAt: daysAgo(20) },
      { id: samTrip, mapId: samMap, createdById: SAM_ID, title: 'South-East Asia loop', description: null, status: 'COMPLETED', startDate: '2024-01-08', endDate: '2024-03-01', coverPhotoId: null, linkAccess: 'RESTRICTED', shareCode: 'SEAL22P7MKQ3', travellerIds: ['trav-sam'], createdAt: daysAgo(190) },
      { id: lisbonTrip, mapId: joMap, createdById: JO_ID, title: 'Lisbon weekend', description: 'Planning together: add ideas!', status: 'COMPLETED', startDate: '2026-10-03', endDate: '2026-10-06', coverPhotoId: null, linkAccess: 'RESTRICTED', shareCode: 'L5BNWK3ND7QT', travellerIds: ['trav-jo', 'trav-jo-kid'], createdAt: daysAgo(40) },
    ],
    stops: [
      { id: 'stop-rome', tripId: italyTrip, position: 0, countryCode: 'IT', landmarkId: 'lm-colosseum', placeName: 'Rome', arriveOn: '2025-07-02', leaveOn: '2025-07-07', notes: null },
      { id: 'stop-florence', tripId: italyTrip, position: 1, countryCode: 'IT', landmarkId: null, placeName: 'Florence', arriveOn: '2025-07-07', leaveOn: '2025-07-12', notes: 'Uffizi booked for the 9th' },
      { id: 'stop-cinque', tripId: italyTrip, position: 2, countryCode: 'IT', landmarkId: null, placeName: 'Cinque Terre', arriveOn: '2025-07-12', leaveOn: '2025-07-16', notes: null },
      { id: 'stop-tokyo', tripId: japanTrip, position: 0, countryCode: 'JP', landmarkId: null, placeName: 'Tokyo', arriveOn: '2027-04-01', leaveOn: '2027-04-06', notes: null },
      { id: 'stop-fuji', tripId: japanTrip, position: 1, countryCode: 'JP', landmarkId: 'lm-mount-fuji', placeName: null, arriveOn: '2027-04-06', leaveOn: '2027-04-07', notes: null },
      { id: 'stop-kyoto', tripId: japanTrip, position: 2, countryCode: 'JP', landmarkId: null, placeName: 'Kyoto', arriveOn: '2027-04-07', leaveOn: '2027-04-14', notes: null },
      { id: 'stop-bangkok', tripId: samTrip, position: 0, countryCode: 'TH', landmarkId: null, placeName: 'Bangkok', arriveOn: '2024-01-08', leaveOn: '2024-02-01', notes: null },
      { id: 'stop-hanoi', tripId: samTrip, position: 1, countryCode: 'VN', landmarkId: null, placeName: 'Hanoi', arriveOn: '2024-02-01', leaveOn: '2024-02-19', notes: null },
      { id: 'stop-siem', tripId: samTrip, position: 2, countryCode: 'KH', landmarkId: null, placeName: 'Siem Reap', arriveOn: '2024-02-19', leaveOn: '2024-03-01', notes: null },
      { id: 'stop-lisbon', tripId: lisbonTrip, position: 0, countryCode: 'PT', landmarkId: 'lm-tower-of-belem', placeName: 'Lisbon', arriveOn: '2026-10-03', leaveOn: '2026-10-06', notes: null },
    ],
    // image.kind 'asset' = one of the site's posters, named as in posterData.js
    photos: [
      { id: 'photo-eiffel', mapId: homeMap, uploaderId: USER_ID, tripId: null, countryCode: 'FR', caption: 'Evening by the Seine', takenAt: '2019-04-12T19:40:00.000Z', latitude: 48.8583, longitude: 2.2944, width: 1024, height: 1792, hidden: false, image: { kind: 'asset', name: 'fr' }, createdAt: daysAgo(60) },
      { id: 'photo-colosseum', mapId: homeMap, uploaderId: ALEX_ID, tripId: italyTrip, countryCode: 'IT', caption: 'First morning in Rome', takenAt: '2025-07-03T08:15:00.000Z', latitude: 41.8901, longitude: 12.4923, width: 1024, height: 1024, hidden: false, image: { kind: 'asset', name: 'it' }, createdAt: daysAgo(50) },
      { id: 'photo-alhambra', mapId: homeMap, uploaderId: USER_ID, tripId: null, countryCode: 'ES', caption: 'Granada', takenAt: '2018-08-05T17:00:00.000Z', latitude: 37.1762, longitude: -3.5882, width: 1024, height: 1024, hidden: false, image: { kind: 'asset', name: 'es' }, createdAt: daysAgo(40) },
      { id: 'photo-dam', mapId: homeMap, uploaderId: USER_ID, tripId: null, countryCode: 'NL', caption: 'Canals at dusk', takenAt: '2016-03-12T18:30:00.000Z', latitude: 52.3731, longitude: 4.8926, width: 1024, height: 1024, hidden: false, image: { kind: 'asset', name: 'nl' }, createdAt: daysAgo(30) },
      { id: 'photo-hidden', mapId: homeMap, uploaderId: USER_ID, tripId: null, countryCode: 'PT', caption: 'Hidden from viewers (editors only)', takenAt: '2021-10-21T12:00:00.000Z', latitude: 38.6916, longitude: -9.2159, width: 1024, height: 1792, hidden: true, image: { kind: 'asset', name: 'pt' }, createdAt: daysAgo(20) },
      { id: 'photo-bangkok', mapId: samMap, uploaderId: SAM_ID, tripId: samTrip, countryCode: 'TH', caption: 'Temple roofs', takenAt: '2024-01-12T09:00:00.000Z', latitude: null, longitude: null, width: 1024, height: 1792, hidden: false, image: { kind: 'asset', name: 'th' }, createdAt: daysAgo(180) },
      { id: 'photo-lisbon', mapId: joMap, uploaderId: JO_ID, tripId: lisbonTrip, countryCode: 'PT', caption: 'Belém', takenAt: '2026-10-04T11:00:00.000Z', latitude: 38.6916, longitude: -9.216, width: 1024, height: 1792, hidden: false, image: { kind: 'asset', name: 'pt' }, createdAt: daysAgo(35) },
    ],
    photoLandmarks: [
      { photoId: 'photo-eiffel', landmarkId: 'lm-eiffel-tower', source: 'GPS', distanceM: 12, confirmed: true },
      { photoId: 'photo-colosseum', landmarkId: 'lm-colosseum', source: 'GPS', distanceM: 14, confirmed: true },
      { photoId: 'photo-alhambra', landmarkId: 'lm-alhambra', source: 'GPS', distanceM: 15, confirmed: false },
      { photoId: 'photo-lisbon', landmarkId: 'lm-tower-of-belem', source: 'GPS', distanceM: 8, confirmed: true },
    ],
    mapSettings: null,
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

// The demo couple's travels (24 Nov 2026, the user's wish: "have the countries visited in a clear
// order seperated by a few weeks for each country. so i can see clear travel/trips and string on
// the map. have full details for a member/s timeline data. all born dates and travel dates. add
// a few hertiage sites visited. basically have all the trip variations ... and at least 15
// countries visted so i can check all the things work").
//
// One history for both seeds: the server's (seed/travel.js and seed/moments.js, on the USER's
// map, "Sam & Alex's travels") and mock mode's (the client's generated copy,
// src/dev/mock/data/demoTravels.js, from `node scripts/generate-mock-travels.mjs` in client/;
// seed.js, on "Charlie & Alex's travels"). `owner` and `partner` are the map's two travellers
// (the account holder and the partner with their own login); `{owner}` and `{partner}` in a
// title are their names. Landmarks are named by slug (the seed's: slugify(name)), photos by their
// seed-photos/ slug (seed-photos/photos.json gives each its date and trip).
//
// The story: born in Manchester (1990) and Dublin (1991), living in Dublin since 2012; a first
// trip together in 2014, then a country at a time, each trip months or years apart, engaged in
// Paris (2019), married in Dublin (2022), a honeymoon, a year off around the world in 2023-24
// (nine countries, three weeks in each), Paris again and Italy in 2025, Venice and Alex's
// conference in Vienna in 2026, Norway now (an active trip), Japan planned for spring 2027 and
// Patagonia some day. 18 countries visited and 2 lived in, on five continents. Japan, Peru and
// Iceland are wishes (the bucket list goal); Germany, Chile, Kenya, Brazil, Peru, Egypt, Japan,
// Iceland, Canada, Thailand, Vietnam, Cambodia and Australia stay off the map, as the e2e
// tests mark or compare them.
import { airportByCode, flightDistanceKm } from '../../../src/utils/flights.js';

export const DEMO_TRAVELLERS = {
  owner: { birthDate: '1990-01-14', birthCountryCode: 'GB', favouriteCountryCode: 'JP' },
  partner: { birthDate: '1991-06-03', birthCountryCode: 'IE', favouriteCountryCode: 'IT' },
};

// Every place on the map: lived in, visited (with its first visit: each its own day, so the
// passport's pages and the strings follow one clear order) or wished for. `source` as each
// would have come: trips completed (TRIP), a photo (PHOTO) or marked by hand (MANUAL).
export const DEMO_VISITS = [
  { countryCode: 'GB', status: 'LIVED', source: 'MANUAL', firstVisitedOn: '1990-01-14', notes: 'Home' },
  { countryCode: 'IE', status: 'LIVED', source: 'MANUAL', firstVisitedOn: '2012-09-01', notes: null },
  { countryCode: 'US', status: 'VISITED', source: 'TRIP', firstVisitedOn: '2014-06-20', notes: 'New York and Boston, then San Francisco' },
  { countryCode: 'NL', status: 'VISITED', source: 'MANUAL', firstVisitedOn: '2016-03-11', notes: null },
  { countryCode: 'ES', status: 'VISITED', source: 'MANUAL', firstVisitedOn: '2018-08-03', notes: null },
  { countryCode: 'FR', status: 'VISITED', source: 'PHOTO', firstVisitedOn: '2019-04-10', notes: null },
  { countryCode: 'PT', status: 'VISITED', source: 'MANUAL', firstVisitedOn: '2021-10-20', notes: null },
  { countryCode: 'GR', status: 'VISITED', source: 'TRIP', firstVisitedOn: '2022-06-25', notes: 'The honeymoon' },
  { countryCode: 'TR', status: 'VISITED', source: 'TRIP', firstVisitedOn: '2022-07-09', notes: null },
  { countryCode: 'MA', status: 'VISITED', source: 'TRIP', firstVisitedOn: '2023-09-01', notes: null },
  { countryCode: 'JO', status: 'VISITED', source: 'TRIP', firstVisitedOn: '2023-09-22', notes: null },
  { countryCode: 'TZ', status: 'VISITED', source: 'TRIP', firstVisitedOn: '2023-10-13', notes: 'Go back for the migration' },
  { countryCode: 'ZA', status: 'VISITED', source: 'TRIP', firstVisitedOn: '2023-11-03', notes: null },
  { countryCode: 'IN', status: 'VISITED', source: 'TRIP', firstVisitedOn: '2023-11-24', notes: null },
  { countryCode: 'MY', status: 'VISITED', source: 'TRIP', firstVisitedOn: '2023-12-15', notes: null },
  { countryCode: 'NZ', status: 'VISITED', source: 'TRIP', firstVisitedOn: '2024-01-05', notes: null },
  { countryCode: 'MX', status: 'VISITED', source: 'TRIP', firstVisitedOn: '2024-01-26', notes: null },
  { countryCode: 'CU', status: 'VISITED', source: 'TRIP', firstVisitedOn: '2024-02-16', notes: null },
  { countryCode: 'IT', status: 'VISITED', source: 'TRIP', firstVisitedOn: '2025-07-02', notes: null },
  { countryCode: 'AT', status: 'VISITED', source: 'TRIP', firstVisitedOn: '2026-03-10', notes: null },
  { countryCode: 'JP', status: 'WANT_TO_GO', source: 'MANUAL', firstVisitedOn: null, notes: 'Cherry blossom season' },
  { countryCode: 'PE', status: 'WANT_TO_GO', source: 'MANUAL', firstVisitedOn: null, notes: null },
  { countryCode: 'IS', status: 'WANT_TO_GO', source: 'MANUAL', firstVisitedOn: null, notes: null },
];

// Every kind of trip: completed ones of one place, several places and several countries; one
// only the owner went on and one only the partner; a return to a country already visited; one
// shared by link; an active one (now); a planned one with dates (the countdown) and one with
// none. `key` names it (the mock's ids: `trip-<key>`, `stop-<key>`); `travellers` who went;
// `cover` a photo's slug.
export const DEMO_TRIPS = [
  {
    key: 'usa',
    title: 'Coast to coast: our first trip',
    description: 'New York, Boston and San Francisco: our first holiday together.',
    status: 'COMPLETED',
    startDate: '2014-06-20',
    endDate: '2014-07-05',
    travellers: ['owner', 'partner'],
    createdBy: 'owner',
    shareCode: 'CST2CSTFRST4',
    cover: 'lower-manhattan',
    stops: [
      { key: 'new-york', countryCode: 'US', landmark: 'statue-of-liberty', placeName: 'New York', arriveOn: '2014-06-20', leaveOn: '2014-06-25', notes: null },
      { key: 'boston', countryCode: 'US', landmark: null, placeName: 'Boston', arriveOn: '2014-06-25', leaveOn: '2014-06-28', notes: 'Fenway on the 26th' },
      { key: 'san-francisco', countryCode: 'US', landmark: 'golden-gate-bridge', placeName: 'San Francisco', arriveOn: '2014-06-28', leaveOn: '2014-07-05', notes: null },
    ],
  },
  {
    key: 'amsterdam',
    title: 'Amsterdam weekend',
    description: null,
    status: 'COMPLETED',
    startDate: '2016-03-11',
    endDate: '2016-03-14',
    travellers: ['owner', 'partner'],
    createdBy: 'owner',
    shareCode: 'AMSTRDMWKND2',
    cover: 'amsterdam-canal',
    stops: [{ key: 'amsterdam', countryCode: 'NL', landmark: 'amsterdam-canal-ring', placeName: 'Amsterdam', arriveOn: '2016-03-11', leaveOn: '2016-03-14', notes: null }],
  },
  {
    key: 'spain',
    title: 'Granada and Barcelona',
    description: 'The Alhambra first, then the train to Barcelona.',
    status: 'COMPLETED',
    startDate: '2018-08-03',
    endDate: '2018-08-12',
    travellers: ['owner', 'partner'],
    createdBy: 'partner',
    shareCode: 'GRNDBRCNA8X3',
    cover: 'alhambra',
    stops: [
      { key: 'granada', countryCode: 'ES', landmark: 'alhambra', placeName: 'Granada', arriveOn: '2018-08-03', leaveOn: '2018-08-08', notes: null },
      { key: 'barcelona', countryCode: 'ES', landmark: 'works-of-gaudi-sagrada-familia', placeName: 'Barcelona', arriveOn: '2018-08-08', leaveOn: '2018-08-12', notes: null },
    ],
  },
  {
    key: 'paris',
    title: 'Paris in spring',
    description: 'Four days in Paris, two by the sea at Mont-Saint-Michel.',
    status: 'COMPLETED',
    startDate: '2019-04-10',
    endDate: '2019-04-16',
    travellers: ['owner', 'partner'],
    createdBy: 'owner',
    shareCode: 'PRSSPRNG2Q9A',
    cover: 'eiffel-tower',
    stops: [
      { key: 'paris', countryCode: 'FR', landmark: 'eiffel-tower', placeName: 'Paris', arriveOn: '2019-04-10', leaveOn: '2019-04-14', notes: null },
      { key: 'mont-saint-michel', countryCode: 'FR', landmark: 'mont-saint-michel', placeName: null, arriveOn: '2019-04-14', leaveOn: '2019-04-16', notes: 'Check the tides' },
    ],
  },
  {
    key: 'lisbon',
    title: 'Lisbon long weekend',
    description: 'A weekend away with friends: Alex stayed home.',
    status: 'COMPLETED',
    startDate: '2021-10-20',
    endDate: '2021-10-24',
    travellers: ['owner'],
    createdBy: 'owner',
    shareCode: 'PTWKND7RT3XS',
    cover: null,
    stops: [{ key: 'lisbon-weekend', countryCode: 'PT', landmark: 'tower-of-belem', placeName: 'Lisbon', arriveOn: '2021-10-20', leaveOn: '2021-10-24', notes: null }],
  },
  {
    key: 'honeymoon',
    title: 'Honeymoon: Athens and Istanbul',
    description: 'Two weeks in Athens, one in Istanbul.',
    status: 'COMPLETED',
    startDate: '2022-06-25',
    endDate: '2022-07-16',
    travellers: ['owner', 'partner'],
    createdBy: 'partner',
    shareCode: 'HNYMNATH7ST2',
    cover: null,
    stops: [
      { key: 'athens', countryCode: 'GR', landmark: 'acropolis-of-athens', placeName: 'Athens', arriveOn: '2022-06-25', leaveOn: '2022-07-09', notes: null },
      { key: 'istanbul', countryCode: 'TR', landmark: 'historic-areas-of-istanbul', placeName: 'Istanbul', arriveOn: '2022-07-09', leaveOn: '2022-07-16', notes: null },
    ],
  },
  {
    key: 'world',
    title: 'A year off: around the world',
    description: 'Nine countries, three weeks in each.',
    status: 'COMPLETED',
    startDate: '2023-09-01',
    endDate: '2024-03-08',
    travellers: ['owner', 'partner'],
    createdBy: 'owner',
    // Anyone with the link can see this one
    linkAccess: 'ANYONE_WITH_LINK',
    shareCode: 'WRDTRP9FFA4X',
    cover: null,
    stops: [
      { key: 'marrakesh', countryCode: 'MA', landmark: 'medina-of-marrakesh', placeName: 'Marrakesh', arriveOn: '2023-09-01', leaveOn: '2023-09-22', notes: null },
      { key: 'petra', countryCode: 'JO', landmark: 'petra', placeName: 'Wadi Musa', arriveOn: '2023-09-22', leaveOn: '2023-10-13', notes: null },
      { key: 'serengeti', countryCode: 'TZ', landmark: 'serengeti-national-park', placeName: 'Serengeti', arriveOn: '2023-10-13', leaveOn: '2023-11-03', notes: 'Camp with no fences: stay in the tent at night' },
      { key: 'cape-town', countryCode: 'ZA', landmark: 'table-mountain', placeName: 'Cape Town', arriveOn: '2023-11-03', leaveOn: '2023-11-24', notes: null },
      { key: 'agra', countryCode: 'IN', landmark: 'taj-mahal', placeName: 'Agra', arriveOn: '2023-11-24', leaveOn: '2023-12-15', notes: null },
      { key: 'kuala-lumpur', countryCode: 'MY', landmark: 'petronas-towers', placeName: 'Kuala Lumpur', arriveOn: '2023-12-15', leaveOn: '2024-01-05', notes: null },
      { key: 'queenstown', countryCode: 'NZ', landmark: 'milford-sound', placeName: 'Queenstown', arriveOn: '2024-01-05', leaveOn: '2024-01-26', notes: null },
      { key: 'merida', countryCode: 'MX', landmark: 'chichen-itza', placeName: 'Mérida', arriveOn: '2024-01-26', leaveOn: '2024-02-16', notes: null },
      { key: 'havana', countryCode: 'CU', landmark: 'old-havana', placeName: 'Havana', arriveOn: '2024-02-16', leaveOn: '2024-03-08', notes: null },
    ],
  },
  {
    key: 'paris-again',
    title: 'Paris again',
    description: 'Back for the Louvre.',
    status: 'COMPLETED',
    startDate: '2025-05-03',
    endDate: '2025-05-06',
    travellers: ['owner', 'partner'],
    createdBy: 'partner',
    shareCode: 'PRSAGN25MAY3',
    cover: 'louvre',
    stops: [{ key: 'paris-again', countryCode: 'FR', landmark: 'paris-banks-of-the-seine', placeName: 'Paris', arriveOn: '2025-05-03', leaveOn: '2025-05-06', notes: null }],
  },
  {
    key: 'italy',
    title: 'Italian summer',
    description: 'Rome to Florence by train, with a few days by the sea.',
    status: 'COMPLETED',
    startDate: '2025-07-02',
    endDate: '2025-07-16',
    travellers: ['owner', 'partner'],
    createdBy: 'owner',
    shareCode: 'TRPTAK7SMR42',
    cover: 'colosseum',
    stops: [
      { key: 'rome', countryCode: 'IT', landmark: 'colosseum', placeName: 'Rome', arriveOn: '2025-07-02', leaveOn: '2025-07-07', notes: null },
      { key: 'florence', countryCode: 'IT', landmark: null, placeName: 'Florence', arriveOn: '2025-07-07', leaveOn: '2025-07-12', notes: 'Uffizi booked for the 9th' },
      { key: 'cinque', countryCode: 'IT', landmark: null, placeName: 'Cinque Terre', arriveOn: '2025-07-12', leaveOn: '2025-07-16', notes: null },
    ],
  },
  {
    key: 'venice',
    title: 'Venice for Carnival',
    description: null,
    status: 'COMPLETED',
    startDate: '2026-02-13',
    endDate: '2026-02-17',
    travellers: ['owner', 'partner'],
    createdBy: 'owner',
    shareCode: 'VNCCRNVA26KQ',
    cover: 'venice-grand-canal',
    stops: [{ key: 'venice', countryCode: 'IT', landmark: 'venice-and-its-lagoon', placeName: 'Venice', arriveOn: '2026-02-13', leaveOn: '2026-02-17', notes: null }],
  },
  {
    key: 'vienna',
    title: '{partner}’s conference in Vienna',
    description: 'Work, then a day at Schönbrunn.',
    status: 'COMPLETED',
    startDate: '2026-03-10',
    endDate: '2026-03-13',
    travellers: ['partner'],
    createdBy: 'partner',
    shareCode: 'VNNCNF26MRCH',
    cover: null,
    stops: [{ key: 'vienna', countryCode: 'AT', landmark: 'schonbrunn-palace', placeName: 'Vienna', arriveOn: '2026-03-10', leaveOn: '2026-03-13', notes: null }],
  },
  {
    key: 'norway',
    title: 'Norway in November',
    description: 'Bergen, then the fjords. Northern lights, please.',
    status: 'ACTIVE',
    startDate: '2026-11-18',
    endDate: '2026-11-29',
    travellers: ['owner', 'partner'],
    createdBy: 'owner',
    shareCode: 'NRWYNVMBR26X',
    cover: null,
    stops: [
      { key: 'bergen', countryCode: 'NO', landmark: 'bryggen', placeName: 'Bergen', arriveOn: '2026-11-18', leaveOn: '2026-11-23', notes: null },
      { key: 'geiranger', countryCode: 'NO', landmark: 'west-norwegian-fjords-geirangerfjord', placeName: null, arriveOn: '2026-11-23', leaveOn: '2026-11-29', notes: null },
    ],
  },
  {
    key: 'japan',
    title: 'Japan in spring',
    description: 'Tokyo, Kyoto and a day at Mount Fuji.',
    status: 'PLANNED',
    startDate: '2027-04-01',
    endDate: '2027-04-14',
    travellers: ['owner', 'partner'],
    createdBy: 'owner',
    shareCode: 'JPNSPR7NG289',
    cover: null,
    stops: [
      { key: 'tokyo', countryCode: 'JP', landmark: null, placeName: 'Tokyo', arriveOn: '2027-04-01', leaveOn: '2027-04-06', notes: null },
      { key: 'fuji', countryCode: 'JP', landmark: 'mount-fuji', placeName: null, arriveOn: '2027-04-06', leaveOn: '2027-04-07', notes: null },
      { key: 'kyoto', countryCode: 'JP', landmark: null, placeName: 'Kyoto', arriveOn: '2027-04-07', leaveOn: '2027-04-14', notes: null },
    ],
  },
  {
    key: 'patagonia',
    title: 'One day: Patagonia',
    description: 'No dates yet.',
    status: 'PLANNED',
    startDate: null,
    endDate: null,
    travellers: ['owner', 'partner'],
    createdBy: 'partner',
    shareCode: 'PTGNYSMDAY8K',
    cover: null,
    stops: [{ key: 'perito-moreno', countryCode: 'AR', landmark: 'perito-moreno-glacier', placeName: null, arriveOn: null, leaveOn: null, notes: null }],
  },
];

// The timeline: both births, the move, the first trip, engaged, married, an anniversary, and a
// trip's days (safari, hike, dive, tour, meal, show, beach): `trip` names its trip, `photos`
// its photos by slug. The birth in Manchester has a pin no one else sees; the engagement's is
// shared; one is hidden from viewers.
export const DEMO_MOMENTS = [
  { key: 'born', kind: 'BORN', title: '{owner} was born', text: 'In a snowstorm, apparently.', happenedOn: '1990-01-14', datePrecision: 'DAY', countryCode: 'GB', placeName: 'Manchester', spot: { latitude: 53.4808, longitude: -2.2426, shared: false }, travellers: ['owner'] },
  { key: 'partner-born', kind: 'BORN', title: '{partner} was born', happenedOn: '1991-06-03', datePrecision: 'DAY', countryCode: 'IE', placeName: 'Dublin', travellers: ['partner'] },
  { key: 'dublin', kind: 'MOVED_HERE', title: 'Moved to Dublin', happenedOn: '2012-09-01', datePrecision: 'MONTH', countryCode: 'IE', placeName: 'Dublin', travellers: ['owner', 'partner'], photos: ['cliffs-of-moher'] },
  { key: 'first-trip', kind: 'FIRST_TRIP', title: 'Our first trip together', text: 'Two weeks, three cities, one very small suitcase.', happenedOn: '2014-06-20', datePrecision: 'DAY', countryCode: 'US', landmark: 'statue-of-liberty', trip: 'usa', travellers: ['owner', 'partner'], photos: ['lower-manhattan'] },
  { key: 'flamenco', kind: 'SHOW', title: 'Saw flamenco in Granada', happenedOn: '2018-08-04', datePrecision: 'DAY', countryCode: 'ES', landmark: 'alhambra', trip: 'spain', travellers: ['partner'], photos: ['alhambra'] },
  { key: 'engaged', kind: 'ENGAGEMENT', title: 'Got engaged at the Eiffel Tower', text: 'Alex said yes before the lights came on.', happenedOn: '2019-04-12', datePrecision: 'DAY', countryCode: 'FR', landmark: 'eiffel-tower', spot: { latitude: 48.8584, longitude: 2.2945, shared: true }, trip: 'paris', travellers: ['owner', 'partner'], photos: ['eiffel-tower'] },
  { key: 'wedding', kind: 'WEDDING', title: 'Our wedding', text: 'In the rain, in Dublin, with everyone.', happenedOn: '2022-06-18', datePrecision: 'DAY', countryCode: 'IE', placeName: 'Dublin', travellers: ['owner', 'partner'] },
  { key: 'acropolis', kind: 'TOUR', title: 'Sunset at the Acropolis', happenedOn: '2022-06-26', datePrecision: 'DAY', countryCode: 'GR', landmark: 'acropolis-of-athens', trip: 'honeymoon', travellers: ['owner', 'partner'] },
  { key: 'tagine', kind: 'MEAL', title: 'Tagine in the Jemaa el-Fnaa', happenedOn: '2023-09-03', datePrecision: 'DAY', countryCode: 'MA', landmark: 'jemaa-el-fnaa', trip: 'world', travellers: ['owner', 'partner'] },
  { key: 'petra', kind: 'TOUR', title: 'Petra by candlelight', happenedOn: '2023-09-24', datePrecision: 'DAY', countryCode: 'JO', landmark: 'petra', trip: 'world', travellers: ['owner', 'partner'] },
  { key: 'safari', kind: 'SAFARI', title: 'Lions on the second morning', text: 'A pride of eleven, ten metres from the jeep.', happenedOn: '2023-10-15', datePrecision: 'DAY', countryCode: 'TZ', landmark: 'serengeti-national-park', trip: 'world', travellers: ['owner', 'partner'] },
  { key: 'table-mountain', kind: 'HIKE', title: 'Up Table Mountain the hard way', happenedOn: '2023-11-05', datePrecision: 'DAY', countryCode: 'ZA', landmark: 'table-mountain', trip: 'world', travellers: ['owner', 'partner'] },
  { key: 'taj', kind: 'SAW_OR_DID', title: 'The Taj Mahal at dawn', happenedOn: '2023-11-26', datePrecision: 'DAY', countryCode: 'IN', landmark: 'taj-mahal', trip: 'world', travellers: ['owner', 'partner'] },
  { key: 'dive', kind: 'DIVE', title: '{owner}’s first dive', happenedOn: '2023-12-20', datePrecision: 'DAY', countryCode: 'MY', placeName: 'Perhentian Islands', trip: 'world', travellers: ['owner'] },
  { key: 'beach', kind: 'BEACH', title: 'Christmas Day on the beach', happenedOn: '2023-12-25', datePrecision: 'DAY', countryCode: 'MY', placeName: 'Langkawi', trip: 'world', travellers: ['owner', 'partner'] },
  { key: 'milford', kind: 'SAW_OR_DID', title: 'Milford Sound in the rain', happenedOn: '2024-01-08', datePrecision: 'DAY', countryCode: 'NZ', landmark: 'milford-sound', trip: 'world', travellers: ['owner', 'partner'] },
  { key: 'lucha', kind: 'SHOW', title: 'Lucha libre in Mexico City', happenedOn: '2024-01-28', datePrecision: 'DAY', countryCode: 'MX', placeName: 'Mexico City', trip: 'world', travellers: ['partner'] },
  { key: 'anniversary', kind: 'ANNIVERSARY', title: 'Ten years since our first trip', happenedOn: '2024-06-20', datePrecision: 'DAY', countryCode: 'IE', placeName: 'Dublin', travellers: ['owner', 'partner'] },
  { key: 'gelato', kind: 'MEAL', title: 'Best gelato of the trip', text: 'Pistachio, by the Ponte Vecchio.', happenedOn: '2025-07-09', datePrecision: 'DAY', countryCode: 'IT', placeName: 'Florence', trip: 'italy', travellers: ['owner', 'partner'], photos: ['florence-cathedral'] },
  { key: 'carnival', kind: 'CELEBRATION', title: 'Masks at the Carnival', happenedOn: '2026-02-14', datePrecision: 'DAY', countryCode: 'IT', landmark: 'venice-and-its-lagoon', trip: 'venice', travellers: ['owner', 'partner'], photos: ['venice-grand-canal'] },
  { key: 'schonbrunn', kind: 'SAW_OR_DID', title: '{partner} skipped a session for Schönbrunn', happenedOn: '2026-03-12', datePrecision: 'DAY', countryCode: 'AT', landmark: 'schonbrunn-palace', trip: 'vienna', travellers: ['partner'] },
  { key: 'party', kind: 'CELEBRATION', title: 'Planning a surprise party', text: 'Editors only: keep it quiet!', happenedOn: null, datePrecision: null, countryCode: 'PT', hidden: true, travellers: ['owner'] },
];

// World Heritage Sites and other landmarks ticked "been here" (no photo to stamp them): each
// stamps the passport, dated by its tick, by whoever ticked it
export const DEMO_LANDMARK_TICKS = [
  { landmark: 'statue-of-liberty', on: '2014-06-21', by: 'owner' },
  { landmark: 'acropolis-of-athens', on: '2022-06-26', by: 'partner' },
  { landmark: 'historic-areas-of-istanbul', on: '2022-07-10', by: 'partner' },
  { landmark: 'medina-of-marrakesh', on: '2023-09-02', by: 'owner' },
  { landmark: 'petra', on: '2023-09-24', by: 'owner' },
  { landmark: 'serengeti-national-park', on: '2023-10-15', by: 'owner' },
  { landmark: 'table-mountain', on: '2023-11-05', by: 'owner' },
  { landmark: 'taj-mahal', on: '2023-11-26', by: 'owner' },
  { landmark: 'milford-sound', on: '2024-01-08', by: 'owner' },
  { landmark: 'chichen-itza', on: '2024-01-28', by: 'partner' },
  { landmark: 'old-havana', on: '2024-02-17', by: 'owner' },
  { landmark: 'schonbrunn-palace', on: '2026-03-12', by: 'partner' },
];

// The flight log: the trips' flights (`trip` its trip), from boarding passes or typed
const flight = (trip, flownOn, from, to, carrier, flightNumber, source = 'BOARDING_PASS', by = 'owner') => ({
  trip,
  flownOn,
  from,
  to,
  carrier,
  flightNumber,
  source,
  by,
  distanceKm: flightDistanceKm(airportByCode(from), airportByCode(to)),
});
export const DEMO_FLIGHTS = [
  flight('usa', '2014-06-20', 'DUB', 'JFK', 'EI', '105'),
  flight('usa', '2014-07-05', 'SFO', 'DUB', 'EI', '146'),
  flight('amsterdam', '2016-03-11', 'DUB', 'AMS', 'EI', '602', 'MANUAL'),
  flight('spain', '2018-08-03', 'DUB', 'AGP', 'FR', '7046', 'MANUAL'),
  flight('spain', '2018-08-12', 'BCN', 'DUB', 'EI', '565', 'MANUAL'),
  flight('paris', '2019-04-10', 'DUB', 'CDG', 'EI', '520'),
  flight('honeymoon', '2022-06-25', 'DUB', 'ATH', 'EI', '402'),
  flight('honeymoon', '2022-07-16', 'IST', 'DUB', 'TK', '1975'),
  flight('world', '2023-09-01', 'DUB', 'RAK', 'FR', '7208'),
  flight('world', '2023-09-22', 'RAK', 'AMM', 'RJ', '274', 'MANUAL'),
  flight('world', '2023-10-13', 'AMM', 'JRO', 'RJ', '532', 'MANUAL'),
  flight('world', '2023-11-03', 'JRO', 'CPT', 'MN', '602', 'MANUAL'),
  flight('world', '2023-11-24', 'CPT', 'DEL', 'EK', '773', 'MANUAL'),
  flight('world', '2023-12-15', 'DEL', 'KUL', 'MH', '191'),
  flight('world', '2024-01-05', 'KUL', 'AKL', 'MH', '145'),
  flight('world', '2024-01-26', 'AKL', 'MEX', 'AM', '12'),
  flight('world', '2024-02-16', 'MEX', 'HAV', 'AM', '453'),
  flight('world', '2024-03-08', 'HAV', 'MAD', 'IB', '6620'),
  flight('world', '2024-03-08', 'MAD', 'DUB', 'IB', '3720'),
  flight('paris-again', '2025-05-03', 'DUB', 'CDG', 'EI', '520'),
  flight('italy', '2025-07-02', 'LHR', 'FCO', 'BA', '548'),
  flight('italy', '2025-07-16', 'PSA', 'LGW', 'U2', '8148', 'MANUAL'),
  flight('venice', '2026-02-13', 'DUB', 'VCE', 'EI', '422'),
  flight('venice', '2026-02-17', 'VCE', 'DUB', 'EI', '423'),
  flight('vienna', '2026-03-10', 'DUB', 'VIE', 'OS', '458', 'MANUAL', 'partner'),
  flight('norway', '2026-11-18', 'DUB', 'BGO', 'DY', '1365'),
];

// Life's One Shots: a puffin at home, and the safari's
export const DEMO_ONE_SHOTS = [
  { itemKey: 'puffin', seenOn: '2013-06-01', datePrecision: 'MONTH', countryCode: 'IE', notes: 'On the Skelligs', travellers: ['owner'] },
  { itemKey: 'lion', seenOn: '2023-10-15', datePrecision: 'DAY', countryCode: 'TZ', notes: 'A pride of eleven', travellers: ['owner', 'partner'] },
  { itemKey: 'african-elephant', seenOn: '2023-10-16', datePrecision: 'DAY', countryCode: 'TZ', notes: null, travellers: ['owner', 'partner'] },
  { itemKey: 'giraffe', seenOn: '2023-10-18', datePrecision: 'DAY', countryCode: 'TZ', notes: null, travellers: ['owner', 'partner'] },
  { itemKey: 'rhino', seenOn: '2023-11-10', datePrecision: 'DAY', countryCode: 'ZA', notes: 'Two white rhinos at dusk', travellers: ['owner'] },
];

// The states of the US visited (country maps)
export const DEMO_STATES = ['US-NY', 'US-MA', 'US-CA'];

// The strings: every place visited or lived in, tied to the one before it in the order first
// visited (as a newly visited place is tied: MapExperience tieToPrevious). `[from, to]` in code
// order, as the server keeps them.
export const DEMO_STRINGS = DEMO_VISITS.filter((v) => v.status === 'VISITED' || v.status === 'LIVED')
  .sort((a, b) => a.firstVisitedOn.localeCompare(b.firstVisitedOn))
  .flatMap((v, i, all) => (i ? [[all[i - 1].countryCode, v.countryCode].sort()] : []));

// Mock mode only: the repo's seed-photos/photos.json (real photos from Wikimedia
// Commons; credits in seed-photos/README.md), for the demo photos in seed.js. The files
// themselves are served in development at /seed-photos (vite.config.js). Re-generate
// this list when photos.json changes. Never imported outside src/dev/mock.

export const SEED_PHOTOS = [
  { slug: 'eiffel-tower', countryCode: 'FR', caption: 'The Eiffel Tower in spring', takenAt: '2025-05-04T10:20:00.000Z', uploader: 'owner', latitude: null, longitude: null, width: 1920, height: 1280 },
  { slug: 'mont-saint-michel', countryCode: 'FR', caption: 'Mont Saint-Michel at low tide', takenAt: '2023-07-18T19:05:00.000Z', uploader: 'owner', latitude: 48.619314, longitude: -1.512455, width: 1920, height: 1361 },
  { slug: 'louvre', countryCode: 'FR', caption: 'The Louvre’s Richelieu wing', takenAt: '2025-05-05T15:40:00.000Z', uploader: 'partner', latitude: 48.860582, longitude: 2.335979, width: 1920, height: 1246 },
  { slug: 'colosseum', countryCode: 'IT', caption: 'Inside the Colosseum', takenAt: '2025-05-11T09:30:00.000Z', uploader: 'partner', latitude: 41.890713, longitude: 12.491491, width: 1920, height: 2885 },
  { slug: 'florence-cathedral', countryCode: 'IT', caption: 'Florence by night', takenAt: '2024-09-02T21:10:00.000Z', uploader: 'owner', latitude: 43.763202, longitude: 11.264102, width: 1920, height: 1440 },
  { slug: 'cinque-terre', countryCode: 'IT', caption: 'Manarola and the coast', takenAt: '2024-09-05T17:45:00.000Z', uploader: 'owner', latitude: 44.106883, longitude: 9.727424, width: 1920, height: 1280 },
  { slug: 'venice-grand-canal', countryCode: 'IT', caption: 'The Grand Canal from the Rialto', takenAt: '2024-09-08T11:00:00.000Z', uploader: 'partner', latitude: 45.438053, longitude: 12.335911, width: 1920, height: 853 },
  { slug: 'alhambra', countryCode: 'ES', caption: 'The Court of the Lions', takenAt: '2021-06-16T12:30:00.000Z', uploader: 'owner', latitude: 37.177037, longitude: -3.589236, width: 1920, height: 2684 },
  { slug: 'sagrada-familia', countryCode: 'ES', caption: 'Sagrada Família', takenAt: '2021-06-19T10:15:00.000Z', uploader: 'owner', latitude: null, longitude: null, width: 1920, height: 2983 },
  { slug: 'belem-tower', countryCode: 'PT', caption: 'Belém Tower', takenAt: '2022-04-10T16:20:00.000Z', uploader: 'partner', latitude: 38.692048, longitude: -9.216345, width: 1920, height: 1403 },
  { slug: 'amsterdam-canal', countryCode: 'NL', caption: 'Canal houses at blue hour', takenAt: '2023-03-11T19:30:00.000Z', uploader: 'owner', latitude: 52.376792, longitude: 4.898098, width: 1920, height: 1536 },
  { slug: 'lower-manhattan', countryCode: 'US', caption: 'Lower Manhattan from Jersey City', takenAt: '2018-10-21T18:00:00.000Z', uploader: 'owner', latitude: 40.714997, longitude: -74.033185, width: 1920, height: 960 },
  { slug: 'golden-gate-bridge', countryCode: 'US', caption: 'The Golden Gate from Crissy Field', takenAt: '2018-10-25T14:10:00.000Z', uploader: 'owner', latitude: 37.804167, longitude: -122.459722, width: 1920, height: 539 },
  { slug: 'tower-bridge', countryCode: 'GB', caption: 'Tower Bridge', takenAt: '2024-01-14T13:00:00.000Z', uploader: 'partner', latitude: 51.505456, longitude: -0.075357, width: 1920, height: 1280 },
  { slug: 'edinburgh-castle', countryCode: 'GB', caption: 'Edinburgh Castle', takenAt: '2024-11-02T11:25:00.000Z', uploader: 'owner', latitude: 55.948463, longitude: -3.197356, width: 1920, height: 1378 },
  { slug: 'cliffs-of-moher', countryCode: 'IE', caption: 'The Cliffs of Moher', takenAt: '2019-08-03T15:50:00.000Z', uploader: 'partner', latitude: 52.9724, longitude: -9.429578, width: 1920, height: 1080 },
];

export const seedPhotoBySlug = (slug) => SEED_PHOTOS.find((p) => p.slug === slug);

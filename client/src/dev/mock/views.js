// Mock mode only. Roles and response shapes, following docs/API.md (and the
// server's utils/access.js and utils/mapStats.js) so the client can't tell the difference.
import { COUNTRIES } from '@/utils/map/countries';
import { posterUrl } from '@/utils/map/posterData';
import { projectToMap } from '@/utils/map/projection';
import { PARENT_PLACE, isSpecialPlace, withParentPlaces } from '@/utils/map/specialPlaces';
import { isRegion } from '@/utils/map/regionPlaces';
import { UK, countedCountryCodes, placeOnMap } from '@/utils/map/ukNations';
import { MAP_STYLE_IDS } from '@/utils/map/mapStyles';
import { ukNationAt } from './ukNationLookup';
import { LANDMARKS } from './data/landmarks';
import { getDb, me, session } from './store';
import { byPosition, byShotAt } from './photoOrder';
import { pageAfter, parseShuffleSeed, shuffled } from './shuffle';
import { effectivePlan, mapPlanFields, mapSlots, uploadRules } from './plans';
import { supporterBadge } from '@/utils/plans/supporterBadge';
import { unMembersVisited } from '@/utils/map/unMembers';
import { mockPlayback } from './stream';
import { mockUpload } from './uploads';
import { photoThemes } from './themes';
import { designsView } from './mapDesigns';
import { compareMoments } from '@/utils/moments/momentDates';
import { PLACE_POSITIONS, countriesInWorld, daysAway, homeOf, lifeAwayShare, travelExtras } from './travelStats';

export const slugify = (text) =>
  String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const continentByCode = new Map(COUNTRIES.map((c) => [c.code, c.continent]));
export const countryExists = (code) => continentByCode.has(code);

// GET /api/landmarks' rows, by name as the server lists them (all 1,366: data/landmarks.js)
export const LANDMARK_ROWS = LANDMARKS.map((lm) => {
  const slug = slugify(lm.name);
  const pin = projectToMap(lm.latitude, lm.longitude);
  return {
    id: `lm-${slug}`,
    name: lm.name,
    slug,
    countryCode: lm.countryCode,
    latitude: lm.latitude,
    longitude: lm.longitude,
    pinX: Math.round(pin.x * 10) / 10,
    pinY: Math.round(pin.y * 10) / 10,
    matchRadiusM: lm.matchRadiusM,
    isUnesco: lm.isUnesco,
    wikidataId: lm.wikidataId,
    // As the server's list: a UK landmark's nation, for maps that split the UK
    ...(lm.countryCode === UK ? { nation: ukNationAt(lm.latitude, lm.longitude) } : {}),
  };
}).sort((a, b) => a.name.localeCompare(b.name));
const LANDMARK_BY_ID = new Map(LANDMARK_ROWS.map((l) => [l.id, l]));
export const landmarkById = (id) => LANDMARK_BY_ID.get(id) || null;

// Roles
const RANK = { VIEWER: 1, EDITOR: 2, CO_OWNER: 3, OWNER: 4 };
export const higherRole = (a, b) => (!a ? b || null : !b ? a : RANK[a] >= RANK[b] ? a : b);
export const atLeast = (role, needed) => Boolean(role && RANK[role] >= RANK[needed]);

export function mapRole(map) {
  if (!map || !session.signedIn) return null;
  if (map.ownerId === me().id) return 'OWNER';
  return getDb().mapMembers.find((m) => m.mapId === map.id && m.userId === me().id)?.role || null;
}

export function tripRole(trip) {
  if (!trip) return null;
  const map = getDb().maps.find((m) => m.id === trip.mapId);
  const own = session.signedIn ? getDb().tripMembers.find((m) => m.tripId === trip.id && m.userId === me().id)?.role : null;
  return higherRole(mapRole(map), own || null);
}

export const photoRole = (photo) => {
  const trip = photo.tripId ? getDb().trips.find((t) => t.id === photo.tripId) : null;
  return trip ? tripRole(trip) : mapRole(getDb().maps.find((m) => m.id === photo.mapId));
};

export const userName = (id) => getDb().users.find((u) => u.id === id)?.name || 'Someone';

// Photos
export function photoUrls(photo) {
  // A real test photo from the repo's seed-photos/, which the dev server serves
  // (vite.config.js), in the three copies an upload makes
  if (photo.image?.kind === 'seed') {
    const folder = `/seed-photos/${photo.image.slug}`;
    return { thumb: `${folder}/thumb.webp`, display: `${folder}/display.webp`, original: `${folder}/original.jpg` };
  }
  // A demo video (seed-videos/, which the dev server serves at /seed-videos once the file
  // has been downloaded): its country's poster stands in for its thumbnails
  if (photo.image?.kind === 'seedVideo') {
    const poster = posterUrl(photo.image.poster, 'avif');
    return { thumb: poster, display: poster, video: `/seed-videos/${photo.image.slug}/video.mp4` };
  }
  // A video uploaded this session, in the mock Stream (./stream.js): its thumbnails and
  // playback link once "converted"
  if (photo.image?.kind === 'stream') {
    const links = mockPlayback(photo.image.uid);
    return { thumb: links?.thumb ?? null, display: links?.display ?? null, video: links?.videoUrl ?? null };
  }
  // A poster stands in for a demo photo, at every size
  if (photo.image?.kind === 'asset') {
    const url = posterUrl(photo.image.name, 'avif');
    return { thumb: url, display: url, original: url };
  }
  return {
    thumb: session.blobs.get(photo.image?.thumbKey) || null,
    display: session.blobs.get(photo.image?.displayKey) || session.blobs.get(photo.image?.thumbKey) || null,
    original: session.blobs.get(photo.image?.originalKey) || null,
    print: session.blobs.get(photo.image?.printKey) || null,
  };
}

export const photoThumbUrl = (photo) => photoUrls(photo).thumb;

// The best copy a photo keeps, as the server's bestCopySize: its original (Business and
// First Class maps; the demo photos have one), else its print copy (Economy), else none.
// A video has none: Stream keeps no original to hand back.
function bestCopy(photo) {
  if (photo.kind === 'VIDEO') return null;
  if (['seed', 'asset'].includes(photo.image?.kind) || photo.image?.originalKey) return 'ORIGINAL';
  return photo.image?.printKey ? 'PRINT' : null;
}

const photoLandmarks = (photo, role) =>
  getDb()
    .photoLandmarks.filter((pl) => pl.photoId === photo.id && (atLeast(role, 'EDITOR') || pl.confirmed))
    .map((pl) => ({ pl, lm: landmarkById(pl.landmarkId) }))
    .filter(({ lm }) => lm);

// Videos (docs/API.md, "Videos"): Stream converts each one first. A saved video is
// PROCESSING until its readyAt (the mock's MOCK_CONVERT_MS after saving), then READY, as
// Stream's notice would make it; the seeded ones have no state, and are ready. A FAILED
// one stays so.
const isVideo = (photo) => photo.kind === 'VIDEO';
export function videoStateOf(photo) {
  if (!isVideo(photo)) return null;
  if (photo.videoState === 'PROCESSING' && photo.readyAt && Date.parse(photo.readyAt) <= Date.now()) photo.videoState = 'READY';
  return photo.videoState || 'READY';
}
const videoReady = (photo) => videoStateOf(photo) === 'READY';

// Hidden photos are for editors only, and so are videos that aren't ready (the server's
// canSeePhoto): for anyone else they don't exist
export const canSeePhoto = (photo, role) =>
  atLeast(role, 'VIEWER') && (!photo.hidden || atLeast(role, 'EDITOR')) && (!isVideo(photo) || videoReady(photo) || atLeast(role, 'EDITOR'));

export function photoListItem(photo, role) {
  const item = {
    id: photo.id,
    kind: photo.kind || 'PHOTO',
    durationS: photo.durationS ?? null,
    caption: photo.caption,
    takenAt: photo.takenAt,
    countryCode: photo.countryCode,
    tripId: photo.tripId,
    width: photo.width,
    height: photo.height,
    // A video has its pictures only once it's ready (Stream's thumbnails)
    thumbUrl: isVideo(photo) && !videoReady(photo) ? null : photoUrls(photo).thumb,
    landmarks: photoLandmarks(photo, role).map(({ pl, lm }) => ({ id: lm.id, name: lm.name, confirmed: pl.confirmed })),
  };
  if (atLeast(role, 'EDITOR')) {
    item.hidden = photo.hidden;
    if (isVideo(photo)) item.videoState = videoStateOf(photo);
  }
  return item;
}

// A video's display picture and playback link, when it's ready (else neither)
const videoLinks = (photo) => {
  if (!videoReady(photo)) return { displayUrl: null, videoUrl: null };
  const urls = photoUrls(photo);
  return { displayUrl: urls.display, videoUrl: urls.video ?? urls.original ?? null };
};

// The best copy for a download list (`best=1`, docs/API.md "Downloads"), as the server's
// views.js bestFile: `{ copy, url, contentType, bytes, width, height }`, or null (a video,
// or a photo with neither). The demo photos' sizes aren't known (`bytes` null), as an old
// photo's on the server; one uploaded this session knows its blob's.
function bestFile(photo) {
  const copy = bestCopy(photo);
  if (!copy) return null;
  const urls = photoUrls(photo);
  const url = copy === 'ORIGINAL' ? urls.original : urls.print;
  if (!url) return null;
  const key = copy === 'ORIGINAL' ? photo.image?.originalKey : photo.image?.printKey;
  const meta = (key && mockUpload(key)) || {};
  return {
    copy,
    url,
    contentType: meta.contentType ?? (url.endsWith('.avif') ? 'image/avif' : 'image/jpeg'),
    bytes: meta.bytes ?? null,
    width: photo.width || null,
    height: photo.height || null,
  };
}

export function photoDetail(photo, role) {
  const urls = photoUrls(photo);
  // A photo's monthly themes (docs/API.md, "Photo themes"), for everyone who sees it
  const detail = {
    ...photoListItem(photo, role),
    ...(isVideo(photo) ? videoLinks(photo) : { displayUrl: urls.display, themes: photoThemes(getDb(), photo.id) }),
  };
  if (atLeast(role, 'EDITOR')) {
    const best = bestCopy(photo);
    Object.assign(detail, {
      originalUrl: best === 'ORIGINAL' ? urls.original : best === 'PRINT' ? urls.print : null,
      bestCopy: best,
      latitude: photo.latitude,
      longitude: photo.longitude,
      landmarks: photoLandmarks(photo, role).map(({ pl, lm }) => ({
        id: lm.id,
        name: lm.name,
        confirmed: pl.confirmed,
        source: pl.source,
        distanceM: pl.distanceM,
      })),
    });
  }
  return detail;
}

// In the gallery's order, as the server: a trip's list in the trip's order, a country's
// (or the unplaced photos) in that gallery's order, the whole map's newest upload first.
// cursor = the id of the last photo of the previous page.
// `unplaced=1`: only the photos with no country. Returns { error } for a bad filter.
// The slideshows' (docs/API.md, "Slideshows"): `order=taken` (oldest taken first, by
// shotAt), `order=shuffle&seed=N` (the server's shuffle: the same seed, the same order; a
// cursor no longer in it is a 400) and `display=1` (each photo's displayUrl too).
// The download lists' `best=1` (docs/API.md "Downloads"): each photo's best copy, for
// editors only and never through a share link (`allowBest: false`), else a 403; pages of 200.
const PHOTO_ORDERS = ['gallery', 'taken', 'shuffle'];
const BAD_FILTER = { error: 'Malformed data.' };
const NO_BEST = { error: 'You do not have permission to do that.', status: 403 };
const isFlagValue = (value) => value === undefined || ['1', 'true', '0', 'false'].includes(value);
// Unplaced: no country, or on a map that splits the UK, in the UK with its nation not chosen
// yet (as the server's photoListWhere)
const isUnplaced = (photo) =>
  !photo.countryCode || (photo.countryCode === UK && Boolean(getDb().maps.find((m) => m.id === photo.mapId)?.splitUk));

export function photoPage(
  photos,
  role,
  { country, unplaced, tripId, landmark, cursor, limit, order = 'gallery', seed, display, best },
  { allowBest = true } = {}
) {
  if (!isFlagValue(best)) return BAD_FILTER;
  const withBest = best === '1' || best === 'true';
  if (withBest && (!allowBest || !atLeast(role, 'EDITOR'))) return NO_BEST;
  const size = Math.min(Math.max(Number(limit) || 30, 1), withBest ? 200 : 60);
  const onlyUnplaced = unplaced === '1' || unplaced === 'true';
  if (unplaced !== undefined && !onlyUnplaced && unplaced !== '0' && unplaced !== 'false') return BAD_FILTER;
  if (onlyUnplaced && country !== undefined) return BAD_FILTER;
  if (!PHOTO_ORDERS.includes(order)) return BAD_FILTER;
  const shuffleSeed = order === 'shuffle' ? parseShuffleSeed(seed) : null;
  if (order === 'shuffle' && shuffleSeed === null) return BAD_FILTER;
  const withDisplay = display === '1' || display === 'true';
  if (display !== undefined && !withDisplay && display !== '0' && display !== 'false') return BAD_FILTER;
  // A landmark's photos (the stamp photo picker): confirmed as it, in any country, oldest
  // taken first, as the server lists them
  const atLandmark = landmark
    ? new Set(getDb().photoLandmarks.filter((pl) => pl.landmarkId === landmark && pl.confirmed).map((pl) => pl.photoId))
    : null;
  const sort =
    order === 'taken' || atLandmark
      ? byShotAt
      : tripId
        ? byPosition('tripPosition')
        : onlyUnplaced || country
          ? byPosition('countryPosition')
          : (a, b) => (a.createdAt < b.createdAt ? 1 : -1);
  let list = photos
    .filter((p) => canSeePhoto(p, role))
    .filter((p) => (onlyUnplaced ? isUnplaced(p) : !country || p.countryCode === country))
    .filter((p) => !tripId || p.tripId === tripId)
    .filter((p) => !atLandmark || atLandmark.has(p.id))
    .sort(sort);
  const item = (p) => {
    if (withBest) return { ...photoListItem(p, role), best: bestFile(p) };
    if (!withDisplay) return photoListItem(p, role);
    if (isVideo(p)) return { ...photoListItem(p, role), ...videoLinks(p) };
    return { ...photoListItem(p, role), displayUrl: photoUrls(p).display };
  };
  if (order === 'shuffle') {
    // Every id in the list, shuffled the same way for the same seed, then this page of it
    const byId = new Map(list.map((p) => [p.id, p]));
    const slice = pageAfter(shuffled([...byId.keys()], shuffleSeed), cursor, size);
    if (!slice) return BAD_FILTER;
    list = slice.ids.map((id) => byId.get(id));
    return { photos: list.map(item), nextCursor: slice.more ? slice.ids[slice.ids.length - 1] : null };
  }
  const start = cursor ? list.findIndex((p) => p.id === cursor) + 1 : 0;
  const page = list.slice(start, start + size);
  const nextCursor = start + size < list.length ? page[page.length - 1].id : null;
  return { photos: page.map(item), nextCursor };
}

// Maps
const visibleMapPhotos = (map, role) => getDb().photos.filter((p) => p.mapId === map.id && canSeePhoto(p, role));

// As the server's utils/mapStats.js: countries leave out the special places (Antarctica
// and the poles), which have their own count; the continents count every visit (Antarctica
// and the South Pole give the seventh); per person, countries only
/** The landmarks a map has stamped (a confirmed photo the caller can see), as the server's. */
export function stampedLandmarkIds(map, role) {
  const photoIds = new Set(visibleMapPhotos(map, role).map((p) => p.id));
  return [...new Set(getDb().photoLandmarks.filter((pl) => pl.confirmed && photoIds.has(pl.photoId)).map((pl) => pl.landmarkId))];
}

export function mapStats(map, role) {
  const db = getDb();
  const counted = new Set(
    db.visits.filter((v) => v.mapId === map.id && (v.status === 'VISITED' || v.status === 'LIVED')).map((v) => v.countryCode),
  );
  // On a map that splits the UK, its nations count one each (utils/map/ukNations.js)
  const countries = countedCountryCodes([...counted].filter((c) => !isSpecialPlace(c)), map.splitUk);
  const specialPlaces = [...counted].filter(isSpecialPlace);
  // Regions (Bali, Tasmania) have their own count, and their country opens the continent
  const regions = [...counted].filter(isRegion);
  const continents = new Set([...counted].filter((c) => !isRegion(c)).map((c) => continentByCode.get(c)).filter(Boolean));
  const photos = visibleMapPhotos(map, role);
  // Stamped by a photo or ticked "been here" (a tick stamps the passport too: 23 Nov 2026)
  const ticked = (db.landmarkVisits || []).filter((v) => v.mapId === map.id).map((v) => v.landmarkId);
  const landmarks = [...new Set([...stampedLandmarkIds(map, role), ...ticked])];
  const trips = db.trips.filter((t) => t.mapId === map.id);
  // The group trips added from other maps count too; per person, only the map's own trips
  // Each completed trip's stops (with their landmarks' positions) and dates, for the extras too
  const completed = trips
    .filter((t) => t.status === 'COMPLETED')
    .map((t) => {
      const stops = db.stops
        .filter((s) => s.tripId === t.id)
        .map((s) => ({ ...s, landmark: s.landmarkId ? landmarkById(s.landmarkId) : null }));
      return { id: t.id, title: t.title, travellerIds: t.travellerIds, countryCodes: stops.map((s) => s.countryCode), startDate: t.startDate, endDate: t.endDate, stops };
    });
  const travellers = db.travellers.filter((t) => t.mapId === map.id).sort((a, b) => a.position - b.position);
  const homeCountryCode = homeOf({ homeCountryCode: map.homeCountryCode ?? null, ownerId: map.ownerId, travellers });
  return {
    countries: countries.length,
    specialPlaces: specialPlaces.length,
    regions: regions.length,
    continents: continents.size,
    photos: photos.length,
    landmarks: landmarks.length,
    trips: trips.length + linkedTrips(map.id).length,
    // Each person's countries and days away (23 Nov 2026), from the completed trips they went on;
    // for editors, the share of their life that is (from a date of birth, else null)
    byTraveller: travellers.map((t) => {
      const theirs = completed.filter((trip) => trip.travellerIds.includes(t.id));
      const codes = theirs.flatMap((trip) => trip.countryCodes.filter((c) => !isSpecialPlace(c)));
      const days = daysAway(theirs);
      return {
        travellerId: t.id,
        name: t.name,
        countries: countedCountryCodes(codes, map.splitUk).length,
        daysAway: days,
        ...(atLeast(role, 'EDITOR') ? { lifeAwayShare: lifeAwayShare(days, t.birthDate ?? null) } : {}),
      };
    }),
    // How much of the world, the days away, the distance and the furthest place (21 Nov 2026)
    countriesInWorld: countriesInWorld(Boolean(map.splitUk)),
    // Collector's counts (24 Nov 2026): the UN's 193 member states been to
    unCountries: unMembersVisited([...counted]).length,
    ...travelExtras({ completedTrips: completed, visitedCodes: [...counted], positions: PLACE_POSITIONS, homeCountryCode }),
  };
}

// The maps you own also say whether each is locked, and its transfer's grace period
export function mapSummary(map, role) {
  const stats = mapStats(map, role);
  return {
    id: map.id,
    name: map.name,
    groupType: map.groupType,
    isDefault: map.isDefault,
    role,
    ownerName: userName(map.ownerId),
    counts: { countries: stats.countries, photos: stats.photos, trips: stats.trips },
    ...(role === 'OWNER' ? { locked: mapSlots(map.ownerId).lockedIds.includes(map.id), tier: mapSlots(map.ownerId).tiers[map.id], graceUntil: map.graceUntil || null } : {}),
  };
}

// The style a map is shown in to everyone (the server's utils/mapSettings.js mapStyleOf;
// docs/API.md "Map styles"): its own, else its owner's own, else null. The mock keeps map
// settings for the test user alone, so other people's maps have only their own.
export function mapStyleOf(map) {
  if (MAP_STYLE_IDS.includes(map.style)) return map.style;
  const owners = map.ownerId === me().id ? getDb().mapSettings?.style : null;
  return MAP_STYLE_IDS.includes(owners) ? owners : null;
}

// `withPlan`: the map routes' own answers, where the owner and editors also get the
// owner's plan, locked, graceUntil, photoCounts, videoCounts and uploadRules (never through a share link)
export function mapView(map, role, { withPlan = false } = {}) {
  const db = getDb();
  return {
    ...(withPlan && atLeast(role, 'EDITOR') ? mapPlanFields(map) : {}),
    id: map.id,
    name: map.name,
    groupType: map.groupType,
    isDefault: map.isDefault,
    // The UK as its four nations (docs/API.md "The UK's nations")
    splitUk: Boolean(map.splitUk),
    // Its home as set (null: from a traveller's birth country; the stats carry the one in use)
    homeCountryCode: map.homeCountryCode ?? null,
    // The style everyone sees it in: its own, else the owner's (null: each viewer's own)
    style: mapStyleOf(map),
    role,
    ownerName: userName(map.ownerId),
    // The owner's paid plan on the banner, unless they turned it off (docs/API.md "The
    // supporter badge"): the mock keeps map settings for the test user alone
    supporter: supporterBadge({
      accountPlan: effectivePlan(map.ownerId).plan,
      ownerSettings: map.ownerId === me().id ? db.mapSettings : null,
      role,
    }),
    travellers: db.travellers
      .filter((t) => t.mapId === map.id)
      .sort((a, b) => a.position - b.position)
      .map((t) => {
        const out = { id: t.id, name: t.name, position: t.position, birthCountryCode: t.birthCountryCode, favouriteCountryCode: t.favouriteCountryCode };
        // The account it's linked to, and the date of birth (23 Nov 2026), for editors only
        if (atLeast(role, 'EDITOR')) {
          out.userId = t.userId;
          out.birthDate = t.birthDate ?? null;
        }
        return out;
      }),
    visits: db.visits
      .filter((v) => v.mapId === map.id)
      // When each was marked, as the server's (the seed's have none)
      .map(({ countryCode, status, source, firstVisitedOn, notes, createdAt }) => ({ countryCode, status, source, firstVisitedOn, notes, markedAt: createdAt ?? null })),
    stats: mapStats(map, role),
    // Everyone's: the moments per country, hidden ones for the owner and editors only
    momentCountsByCountry: momentCountsByCountry(map.id, { includeHidden: atLeast(role, 'EDITOR') }),
    // The moments pinned to a spot (as the server's findMomentSpots): every pin for editors,
    // the shared ones on visible moments for anyone else
    momentSpots: momentSpots(map.id, { includeHidden: atLeast(role, 'EDITOR') }),
    // The passport's stamped landmarks, to mark their pins (hidden photos' for editors)
    stampedLandmarkIds: stampedLandmarkIds(map, role),
    // The landmarks ticked "been here" (docs/API.md "Collecting")
    tickedLandmarkIds: (db.landmarkVisits || []).filter((v) => v.mapId === map.id).map((v) => v.landmarkId),
    // The strings tied between its places, for everyone who opens it (docs/API.md "Strings")
    // Each with its kind (25 Nov 2026): one from before kinds is VISITED
    strings: (db.mapStrings || []).filter((s) => s.mapId === map.id).map(({ id, kind, from, to }) => ({ id, kind: kind === 'PLANNED' ? 'PLANNED' : 'VISITED', from, to })),
    // Its own designs, one per map style, for everyone who opens it (docs/API.md "Map designs")
    designs: designsView(map),
  };
}

/** The map's pinned moments, `[{ id, kind, title, countryCode, latitude, longitude }]`, in date order. */
export function momentSpots(mapId, { includeHidden = false } = {}) {
  return getDb()
    .moments.filter((m) => m.mapId === mapId && m.latitude != null && (includeHidden || (!m.hidden && m.spotShared)))
    .sort(compareMoments)
    .map(({ id, kind, title, countryCode, latitude, longitude }) => ({ id, kind, title, countryCode, latitude, longitude }));
}

/** The map's moments per country, `{ [code]: n }`; countries with none are left out. */
export function momentCountsByCountry(mapId, { includeHidden = false } = {}) {
  const counts = {};
  for (const m of getDb().moments) {
    if (m.mapId !== mapId || (m.hidden && !includeHidden)) continue;
    counts[m.countryCode] = (counts[m.countryCode] || 0) + 1;
  }
  return counts;
}

// Group trips (docs/API.md "Group trips"): trips added to a map from other maps
// (TripMap links), which show in its trips and count in its stats

/** The trips added to a map from other maps. */
export const linkedTrips = (mapId) => {
  const db = getDb();
  return db.tripMaps
    .filter((l) => l.mapId === mapId)
    .map((l) => db.trips.find((t) => t.id === l.tripId))
    .filter(Boolean);
};

/** Every map a trip's countries go on when it's completed: its own, and those it was added to. */
export const tripMapIds = (trip) => [trip.mapId, ...getDb().tripMaps.filter((l) => l.tripId === trip.id).map((l) => l.mapId)];

// A trip's stops' countries, in stop order, each once
const tripCountryCodes = (tripId) => [
  ...new Set(
    getDb()
      .stops.filter((s) => s.tripId === tripId)
      .sort((a, b) => a.position - b.position)
      .map((s) => s.countryCode),
  ),
];

/** As the server's byTripOrder: undated first, then the latest start first, then the newest. */
export function byTripOrder(a, b) {
  if (!a.startDate !== !b.startDate) return a.startDate ? 1 : -1;
  if (a.startDate && b.startDate && a.startDate !== b.startDate) return a.startDate < b.startDate ? 1 : -1;
  return String(b.createdAt).localeCompare(String(a.createdAt));
}

/**
 * A group trip in another map's list: someone with a role on the trip itself (`canOpen`)
 * gets its summary too; anyone else only its title, dates, status and countries.
 */
export function linkedTripSummary(trip, { canOpen, role = null }) {
  const limited = {
    id: trip.id,
    title: trip.title,
    status: trip.status,
    startDate: trip.startDate,
    endDate: trip.endDate,
    countryCodes: tripCountryCodes(trip.id),
    linked: true,
    organiserMapName: getDb().maps.find((m) => m.id === trip.mapId)?.name || '',
    canOpen,
  };
  return canOpen ? { ...tripSummary(trip, role), ...limited } : limited;
}

/**
 * A map's trips for someone with `role` on it: its own trips and the group trips added to
 * it, in one list, in the trips' order. A linked trip opens only for someone with a role
 * on the trip itself; through a share link (`viaShareLink`), never. Its own trips carry
 * their stops' places (`countryCodes`, for the planned trips the map outlines), except
 * through a share link, as on the server.
 */
export function mapTripsView(map, role, { viaShareLink = false } = {}) {
  const own = getDb()
    .trips.filter((t) => t.mapId === map.id)
    .map((trip) => ({
      trip,
      view: { ...tripSummary(trip, role), ...(viaShareLink ? {} : { countryCodes: tripCountryCodes(trip.id) }), linked: false, canOpen: true },
    }));
  const linked = linkedTrips(map.id).map((trip) => {
    const onTrip = viaShareLink ? null : tripRole(trip);
    return {
      trip,
      view: atLeast(onTrip, 'VIEWER') ? linkedTripSummary(trip, { canOpen: true, role: onTrip }) : linkedTripSummary(trip, { canOpen: false }),
    };
  });
  return [...own, ...linked].sort((a, b) => byTripOrder(a.trip, b.trip)).map((row) => row.view);
}

/**
 * Which of the signed-in user's own maps (owned or edited) show the trip, first added
 * first, each with whether they may take it off (they added it, or own that map), and
 * whether they own or edit a map besides the trip's own to add it to.
 */
function myMapsFor(trip) {
  const db = getDb();
  if (!session.signedIn) return { links: [], canAdd: false };
  const mine = db.maps.filter((m) => atLeast(mapRole(m), 'EDITOR'));
  const links = db.tripMaps
    .filter((l) => l.tripId === trip.id && mine.some((m) => m.id === l.mapId))
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
    .map((l) => {
      const map = mine.find((m) => m.id === l.mapId);
      return { mapId: map.id, name: map.name, canRemove: l.addedById === me().id || map.ownerId === me().id };
    });
  return { links, canAdd: mine.some((m) => m.id !== trip.mapId) };
}

// Trips. As the server (controllers/helpers/views.js): a hidden cover photo isn't shown
// to anyone below editor, neither its picture nor its id.
function visibleCover(trip, role) {
  const photo = trip.coverPhotoId ? getDb().photos.find((p) => p.id === trip.coverPhotoId) : null;
  return photo && canSeePhoto(photo, role) ? photo : null;
}
const coverThumb = (trip, role) => {
  const photo = visibleCover(trip, role);
  return photo ? photoUrls(photo).thumb : null;
};

export function tripSummary(trip, role) {
  const db = getDb();
  return {
    id: trip.id,
    mapId: trip.mapId,
    title: trip.title,
    status: trip.status,
    startDate: trip.startDate,
    endDate: trip.endDate,
    coverThumbUrl: coverThumb(trip, role),
    stopCount: db.stops.filter((s) => s.tripId === trip.id).length,
    photoCount: db.photos.filter((p) => p.tripId === trip.id && canSeePhoto(p, role)).length,
    travellerIds: [...trip.travellerIds],
  };
}

// `viaShareLink`: opened through /shared/:code, where canOpenMap and canDelete are always false.
// canDelete as the server's canDeleteTrip: the map's owner or an editor of the map (someone
// added to the trip alone edits it, but can't delete it)
export function tripView(trip, role, { viaShareLink = false } = {}) {
  const db = getDb();
  const map = db.maps.find((m) => m.id === trip.mapId);
  // Group trips: the caller's own maps showing it, and whether they have one to add it to
  const myMaps = viaShareLink ? { links: [], canAdd: false } : myMapsFor(trip);
  return {
    id: trip.id,
    mapId: trip.mapId,
    mapName: map?.name || '',
    splitUk: Boolean(map?.splitUk),
    canOpenMap: !viaShareLink && Boolean(mapRole(map)),
    canDelete: !viaShareLink && atLeast(mapRole(map), 'EDITOR'),
    onMyMaps: myMaps.links,
    canAddToMyMap: myMaps.canAdd,
    title: trip.title,
    description: trip.description,
    status: trip.status,
    startDate: trip.startDate,
    endDate: trip.endDate,
    coverPhotoId: visibleCover(trip, role)?.id || null,
    coverThumbUrl: coverThumb(trip, role),
    role,
    travellerIds: [...trip.travellerIds],
    travellers: db.travellers
      .filter((t) => t.mapId === trip.mapId)
      .sort((a, b) => a.position - b.position)
      .map((t) => ({ id: t.id, name: t.name })),
    stops: db.stops
      .filter((s) => s.tripId === trip.id)
      .sort((a, b) => a.position - b.position)
      .map((s) => ({
        id: s.id,
        position: s.position,
        countryCode: s.countryCode,
        landmarkId: s.landmarkId,
        landmarkName: landmarkById(s.landmarkId)?.name || null,
        placeName: s.placeName,
        arriveOn: s.arriveOn,
        leaveOn: s.leaveOn,
        notes: s.notes,
      })),
    // The map owner's plan, for whoever can upload to the trip (not through a share link)
    ...(!viaShareLink && atLeast(role, 'EDITOR') && map ? { uploadRules: uploadRules(map) } : {}),
  };
}

// As the server's createMissingVisits (domain/maps.js): a WANT_TO_GO country becomes
// VISITED, a missing one is added as VISITED (no first-visit date), and an existing
// VISITED or LIVED one is left alone. The South Pole brings Antarctica with it, the same
// way (utils/map/specialPlaces.js). Returns the visits it added or changed.
export function markVisited(mapId, countryCode, source) {
  if (!countryCode) return [];
  const db = getDb();
  const changed = [];
  // As each map keeps places: a UK nation is the UK on a map that doesn't split it (a group
  // trip's stop on someone else's map)
  const place = placeOnMap(countryCode, Boolean(db.maps.find((m) => m.id === mapId)?.splitUk));
  for (const code of withParentPlaces([place])) {
    const visit = db.visits.find((v) => v.mapId === mapId && v.countryCode === code);
    if (!visit) {
      const added = { mapId, countryCode: code, status: 'VISITED', source, firstVisitedOn: null, notes: null, createdAt: new Date().toISOString() };
      db.visits.push(added);
      changed.push(added);
    } else if (visit.status === 'WANT_TO_GO') {
      // A wish become a visit was marked visited now, as the server's (24 Nov 2026)
      Object.assign(visit, { status: 'VISITED', source, createdAt: new Date().toISOString() });
      changed.push(visit);
    }
  }
  return changed;
}

// A status set by hand: the places it brings with it (the South Pole visited or lived:
// Antarctica), added or turned VISITED as markVisited does. As the server's upsertVisit,
// the `implied` of PUT /maps/:mapId/visits/:countryCode.
export function markParentsVisited(mapId, countryCode, status) {
  const parent = PARENT_PLACE[countryCode];
  if (!parent || (status !== 'VISITED' && status !== 'LIVED')) return [];
  return markVisited(mapId, parent, 'MANUAL');
}

export function distanceM(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

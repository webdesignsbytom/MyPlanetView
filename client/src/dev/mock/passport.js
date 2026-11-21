// Mock mode only: the passport (docs/API.md, "Passport"), as the server builds it
// (server/src/services/travel/passport.js and domain/passport.js). A landmark is stamped
// by a confirmed photo of it on the map; below editor, hidden photos neither stamp nor count.
import { COUNTRIES } from '@/utils/map/countries';
import { landmarkPlace } from '@/utils/map/ukNations';
import { isSpecialPlace } from '@/utils/map/specialPlaces';
import { isRegion } from '@/utils/map/regionPlaces';
import { getDb } from './store';
import { LANDMARK_ROWS, atLeast, landmarkById, photoThumbUrl, userName } from './views';
import { mapPlanId } from './plans';
import { planOf } from '@/utils/constants/plans';

const CONTINENT_BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c.continent]));
const COUNTED = new Set(['VISITED', 'LIVED']);

// When a photo was taken, or uploaded when its file had no date (the server's shotAt)
const shotAt = (photo) => photo.shotAt || photo.takenAt || photo.createdAt;
const time = (value) => (value ? new Date(value).getTime() : Infinity);
const dateOnly = (value) => (value ? new Date(value).toISOString().slice(0, 10) : null);
const byShot = (a, b) => time(shotAt(a)) - time(shotAt(b)) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/**
 * Each stamped landmark on a map: its earliest confirmed photo (by when it was taken), how
 * many confirmed photos it has, and when it was first confirmed. `includeHidden` for the
 * owner and editors; `inScope` (one traveller's passport) a test each photo must pass.
 * -> `[{ landmark, photo, photoCount, confirmedAt }]`
 */
export function mapStamps(mapId, { includeHidden, inScope = null }) {
  const db = getDb();
  const photoById = new Map(db.photos.map((p) => [p.id, p]));
  const byLandmark = new Map();
  for (const match of db.photoLandmarks) {
    const photo = photoById.get(match.photoId);
    if (!photo || !match.confirmed || (match.mapId ?? photo.mapId) !== mapId) continue;
    if (photo.hidden && !includeHidden) continue;
    if (inScope && !inScope(photo)) continue;
    const landmark = landmarkById(match.landmarkId);
    if (!landmark) continue;
    if (!byLandmark.has(landmark.id)) byLandmark.set(landmark.id, { landmark, photos: [], confirmedAt: null });
    const stamp = byLandmark.get(landmark.id);
    stamp.photos.push(photo);
    if (match.confirmedAt && (!stamp.confirmedAt || match.confirmedAt < stamp.confirmedAt)) stamp.confirmedAt = match.confirmedAt;
  }
  return [...byLandmark.values()].map(({ landmark, photos, confirmedAt }) => ({
    landmark,
    photo: photos.sort(byShot)[0],
    photoCount: photos.length,
    confirmedAt,
  }));
}

/**
 * One traveller's places and stamps (the server's travellerFacts): their completed trips'
 * stops, the places of the photos on any trip of theirs or in a moment about them, those
 * moments' places and where they were born; the stamps of those photos; `firstAt` the day
 * each place was first reached.
 */
function travellerFacts(map, traveller, { editor, placeOf }) {
  const db = getDb();
  const trips = db.trips.filter((t) => t.mapId === map.id && (t.travellerIds || []).includes(traveller.id));
  const tripIds = new Set(trips.map((t) => t.id));
  const moments = (db.moments || []).filter((m) => m.mapId === map.id && (m.travellerIds || []).includes(traveller.id) && (editor || !m.hidden));
  const momentPhotoIds = new Set(moments.flatMap((m) => m.photoIds || []));
  const inScope = (photo) => tripIds.has(photo.tripId) || momentPhotoIds.has(photo.id);
  const stamps = mapStamps(map.id, { includeHidden: editor, inScope });

  const firstAt = new Map();
  const reach = (code, date) => {
    if (!code) return;
    const known = firstAt.get(code);
    if (!firstAt.has(code) || (date && (!known || time(date) < time(known)))) firstAt.set(code, date || null);
  };
  for (const trip of trips.filter((t) => t.status === 'COMPLETED')) {
    for (const stop of db.stops.filter((s) => s.tripId === trip.id)) reach(stop.countryCode, stop.arriveOn || trip.startDate);
  }
  for (const moment of moments) reach(moment.countryCode, moment.happenedOn);
  for (const photo of db.photos) {
    if (photo.mapId === map.id && photo.countryCode && (editor || !photo.hidden) && inScope(photo)) reach(photo.countryCode, shotAt(photo));
  }
  for (const stamp of stamps) reach(placeOf(stamp.landmark), shotAt(stamp.photo));
  if (traveller.birthCountryCode) reach(traveller.birthCountryCode, null);
  return { stamps, firstAt };
}

/**
 * The whole passport, as `role` may see it (the server's buildPassport); `travellerId`: that
 * traveller's own. -> null for a traveller not on the map
 */
export function buildPassport(map, role, { travellerId = null } = {}) {
  const db = getDb();
  const editor = atLeast(role, 'EDITOR');
  const travellers = db.travellers
    .filter((t) => t.mapId === map.id)
    .sort((a, b) => a.position - b.position)
    .map(({ id, name, birthCountryCode, favouriteCountryCode }) => ({ id, name, birthCountryCode, favouriteCountryCode }));
  const holder = travellerId ? (travellers.find((t) => t.id === travellerId) ?? null) : null;
  if (travellerId && !holder) return null;
  const visits = db.visits.filter((v) => v.mapId === map.id);
  const visitByCode = new Map(visits.map((v) => [v.countryCode, v]));
  // Mock visits have no creation time: the order they were added stands in for it
  const order = new Map(visits.map((v, index) => [v.countryCode, index]));
  const markedAt = (code) => order.get(code) ?? Infinity;
  const own = holder ? travellerFacts(map, holder, { editor, placeOf: (landmark) => landmarkPlace(landmark, map.splitUk) }) : null;
  const visited = own ? new Set(own.firstAt.keys()) : new Set(visits.filter((v) => COUNTED.has(v.status)).map((v) => v.countryCode));
  const stamps = own ? own.stamps : mapStamps(map.id, { includeHidden: editor });

  // Each country's earliest photo on the map (when it was taken)
  const firstPhotoAt = new Map();
  for (const photo of db.photos) {
    if (photo.mapId !== map.id || !photo.countryCode || (photo.hidden && !editor)) continue;
    const at = shotAt(photo);
    if (!firstPhotoAt.has(photo.countryCode) || time(at) < time(firstPhotoAt.get(photo.countryCode))) firstPhotoAt.set(photo.countryCode, at);
  }
  const enteredOn = own ? (code) => own.firstAt.get(code) ?? null : (code) => firstPhotoAt.get(code) ?? visitByCode.get(code)?.firstVisitedOn ?? null;

  // The pages: every country marked visited or lived, plus any with a stamp, in the order
  // they were first visited (undated last, by when they were marked)
  // On a map that splits the UK, a UK landmark's page is its nation's (as the server)
  const placeOf = (landmark) => landmarkPlace(landmark, map.splitUk);
  const codes = new Set([...visited, ...stamps.map((s) => placeOf(s.landmark))]);
  const ordered = [...codes].sort(
    (a, b) => time(enteredOn(a)) - time(enteredOn(b)) || markedAt(a) - markedAt(b) || a.localeCompare(b),
  );

  // Each stamp's photo: the one picked (unless it's hidden from this caller), else the earliest
  const photoById = new Map(db.photos.map((p) => [p.id, p]));
  const covers = (db.landmarkCovers || []).filter((c) => c.mapId === map.id && photoById.has(c.photoId));
  const coverOf = new Map(covers.filter((c) => editor || !photoById.get(c.photoId).hidden).map((c) => [c.landmarkId, c.photoId]));
  const chosen = new Set(covers.map((c) => c.landmarkId));

  const pages = ordered.map((code) => {
    const onPage = stamps
      .filter((s) => placeOf(s.landmark) === code)
      .sort((a, b) => time(shotAt(a.photo)) - time(shotAt(b.photo)) || a.landmark.name.localeCompare(b.landmark.name));
    const stamped = new Set(onPage.map((s) => s.landmark.id));
    return {
      countryCode: code,
      // VISITED or LIVED; null on a page that has only stamps (even if marked "want to go"); on a
      // traveller's own, the map's status, else VISITED
      status: COUNTED.has(visitByCode.get(code)?.status) ? visitByCode.get(code).status : own ? 'VISITED' : null,
      enteredOn: dateOnly(enteredOn(code)),
      stamps: onPage.map((s) => {
        const photo = photoById.get(coverOf.get(s.landmark.id)) || s.photo;
        return {
          landmarkId: s.landmark.id,
          name: s.landmark.name,
          isUnesco: s.landmark.isUnesco,
          stampedOn: dateOnly(shotAt(s.photo)),
          photoCount: s.photoCount,
          photo: { id: photo.id, thumbUrl: photoThumbUrl(photo) },
          // Editors: whether someone picked the photo (else it's the earliest)
          ...(editor ? { photoChosen: chosen.has(s.landmark.id) } : {}),
          // The map's moments at this landmark, oldest first (hidden ones for editors only)
          moments: (db.moments || [])
            .filter((m) => m.mapId === map.id && m.landmarkId === s.landmark.id && (editor || !m.hidden))
            .sort((a, b) => (a.happenedOn || '9999') < (b.happenedOn || '9999') ? -1 : (a.happenedOn || '9999') > (b.happenedOn || '9999') ? 1 : 0)
            .map((m) => ({ id: m.id, title: m.title, kind: m.kind, happenedOn: m.happenedOn, datePrecision: m.datePrecision })),
        };
      }),
      toStamp: LANDMARK_ROWS.filter((l) => placeOf(l) === code && !stamped.has(l.id)).map((l) => ({
        id: l.id,
        name: l.name,
        isUnesco: l.isUnesco,
      })),
    };
  });

  const counted = [...visited];
  const countries = counted.filter((code) => !isSpecialPlace(code) && !isRegion(code));
  return {
    // The owner's plan picks the cover, as on the server
    map: {
      id: map.id,
      name: map.name,
      groupType: map.groupType,
      ownerName: userName(map.ownerId),
      plan: { id: planOf(mapPlanId(map)).id, name: planOf(mapPlanId(map)).name },
      // Whose passport this is: one traveller's own, or null for the whole map's
      traveller: holder ? { id: holder.id, name: holder.name } : null,
    },
    travellers,
    pages,
    totals: {
      countries: countries.length,
      specialPlaces: counted.filter(isSpecialPlace).length,
      regions: counted.filter(isRegion).length,
      continents: new Set(counted.filter((code) => !isRegion(code)).map((code) => CONTINENT_BY_CODE.get(code)).filter(Boolean)).size,
      landmarks: stamps.length,
      unesco: stamps.filter((s) => s.landmark.isUnesco).length,
    },
  };
}

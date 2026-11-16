// Mock mode only: the passport (docs/API.md, "Passport"), as the server builds it
// (server/src/services/travel/passport.js and domain/passport.js). A landmark is stamped
// by a confirmed photo of it on the map; below editor, hidden photos neither stamp nor count.
import { COUNTRIES } from '@/utils/map/countries';
import { isSpecialPlace } from '@/utils/map/specialPlaces';
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
 * owner and editors. -> `[{ landmark, photo, photoCount, confirmedAt }]`
 */
export function mapStamps(mapId, { includeHidden }) {
  const db = getDb();
  const photoById = new Map(db.photos.map((p) => [p.id, p]));
  const byLandmark = new Map();
  for (const match of db.photoLandmarks) {
    const photo = photoById.get(match.photoId);
    if (!photo || !match.confirmed || (match.mapId ?? photo.mapId) !== mapId) continue;
    if (photo.hidden && !includeHidden) continue;
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

/** The whole passport, as `role` may see it (the server's buildPassport). */
export function buildPassport(map, role) {
  const db = getDb();
  const editor = atLeast(role, 'EDITOR');
  const visits = db.visits.filter((v) => v.mapId === map.id);
  const visitByCode = new Map(visits.map((v) => [v.countryCode, v]));
  // Mock visits have no creation time: the order they were added stands in for it
  const order = new Map(visits.map((v, index) => [v.countryCode, index]));
  const markedAt = (code) => order.get(code) ?? Infinity;
  const visited = new Set(visits.filter((v) => COUNTED.has(v.status)).map((v) => v.countryCode));
  const stamps = mapStamps(map.id, { includeHidden: editor });

  // Each country's earliest photo on the map (when it was taken)
  const firstPhotoAt = new Map();
  for (const photo of db.photos) {
    if (photo.mapId !== map.id || !photo.countryCode || (photo.hidden && !editor)) continue;
    const at = shotAt(photo);
    if (!firstPhotoAt.has(photo.countryCode) || time(at) < time(firstPhotoAt.get(photo.countryCode))) firstPhotoAt.set(photo.countryCode, at);
  }
  const enteredOn = (code) => firstPhotoAt.get(code) ?? visitByCode.get(code)?.firstVisitedOn ?? null;

  // The pages: every country marked visited or lived, plus any with a stamp, in the order
  // they were first visited (undated last, by when they were marked)
  const codes = new Set([...visited, ...stamps.map((s) => s.landmark.countryCode)]);
  const ordered = [...codes].sort(
    (a, b) => time(enteredOn(a)) - time(enteredOn(b)) || markedAt(a) - markedAt(b) || a.localeCompare(b),
  );

  // Each stamp's photo: the one picked (unless it's hidden from this caller), else the earliest
  const photoById = new Map(db.photos.map((p) => [p.id, p]));
  const covers = (db.landmarkCovers || []).filter((c) => c.mapId === map.id && photoById.has(c.photoId));
  const coverOf = new Map(covers.filter((c) => editor || !photoById.get(c.photoId).hidden).map((c) => [c.landmarkId, c.photoId]));
  const chosen = new Set(covers.map((c) => c.landmarkId));

  const pages = ordered.map((code) => {
    const own = stamps
      .filter((s) => s.landmark.countryCode === code)
      .sort((a, b) => time(shotAt(a.photo)) - time(shotAt(b.photo)) || a.landmark.name.localeCompare(b.landmark.name));
    const stamped = new Set(own.map((s) => s.landmark.id));
    return {
      countryCode: code,
      // VISITED or LIVED; null on a page that has only stamps (even if marked "want to go")
      status: COUNTED.has(visitByCode.get(code)?.status) ? visitByCode.get(code).status : null,
      enteredOn: dateOnly(enteredOn(code)),
      stamps: own.map((s) => {
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
      toStamp: LANDMARK_ROWS.filter((l) => l.countryCode === code && !stamped.has(l.id)).map((l) => ({
        id: l.id,
        name: l.name,
        isUnesco: l.isUnesco,
      })),
    };
  });

  const counted = [...visited];
  const countries = counted.filter((code) => !isSpecialPlace(code));
  return {
    // The owner's plan picks the cover, as on the server
    map: {
      id: map.id,
      name: map.name,
      groupType: map.groupType,
      ownerName: userName(map.ownerId),
      plan: { id: planOf(mapPlanId(map)).id, name: planOf(mapPlanId(map)).name },
    },
    travellers: db.travellers
      .filter((t) => t.mapId === map.id)
      .sort((a, b) => a.position - b.position)
      .map(({ id, name, birthCountryCode, favouriteCountryCode }) => ({ id, name, birthCountryCode, favouriteCountryCode })),
    pages,
    totals: {
      countries: countries.length,
      specialPlaces: counted.length - countries.length,
      continents: new Set(counted.map((code) => CONTINENT_BY_CODE.get(code)).filter(Boolean)).size,
      landmarks: stamps.length,
      unesco: stamps.filter((s) => s.landmark.isUnesco).length,
    },
  };
}

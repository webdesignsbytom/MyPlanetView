// Mock mode only: the order of photos in a gallery, as the server keeps it
// (server/src/utils/photoOrder.js and domain/photos.js). Each photo has a position in
// its country's gallery on its map (the unplaced photos are one gallery) and one in its
// trip's; smallest first. A new photo goes first; a moved one takes the halfway point
// between its new neighbours, and the gallery is renumbered when there's no room.

const STEP = 1024;
export const POSITION_FIELD = { country: 'countryPosition', trip: 'tripPosition' };

const sameGallery = (gallery, photo) =>
  gallery === 'trip'
    ? (p) => Boolean(photo.tripId) && p.tripId === photo.tripId
    : (p) => p.mapId === photo.mapId && (p.countryCode || null) === (photo.countryCode || null);

const byId = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
export const byPosition = (field) => (a, b) => a[field] - b[field] || byId(a, b);
const newestFirst = (a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : -byId(a, b));

/** The rest of the photo's gallery, in order. */
const othersInGallery = (photos, gallery, photo) =>
  photos.filter((p) => p.id !== photo.id && sameGallery(gallery, photo)(p)).sort(byPosition(POSITION_FIELD[gallery]));

/** The position for a photo going first in its gallery. */
export function firstPosition(photos, gallery, photo) {
  const [first] = othersInGallery(photos, gallery, photo);
  return first ? first[POSITION_FIELD[gallery]] - STEP : 0;
}

function between(before, after) {
  if (before === null && after === null) return 0;
  if (before === null) return after - STEP;
  if (after === null) return before + STEP;
  const middle = before + (after - before) / 2;
  return middle > before && middle < after ? middle : null;
}

/** Moves `photo` straight after `afterId` (first when null). -> false when `afterId` isn't in that gallery. */
export function movePhotoAfter(photos, gallery, photo, afterId) {
  const field = POSITION_FIELD[gallery];
  const place = () => {
    const others = othersInGallery(photos, gallery, photo);
    const at = afterId ? others.findIndex((p) => p.id === afterId) : -1;
    if (afterId && at < 0) return undefined;
    const before = afterId ? others[at][field] : null;
    const next = others[at + 1];
    return between(before, next ? next[field] : null);
  };
  let position = place();
  if (position === undefined) return false;
  if (position === null) {
    // No room left between the neighbours: renumber the gallery, keeping its order
    photos
      .filter(sameGallery(gallery, photo))
      .sort(byPosition(field))
      .forEach((p, index) => {
        p[field] = (index + 1) * STEP;
      });
    position = place();
  }
  photo[field] = position;
  return true;
}

/** Stores saved before photos had positions: number each gallery newest upload first, as before. */
export function fillPhotoPositions(photos) {
  for (const [gallery, field] of Object.entries(POSITION_FIELD)) {
    if (photos.every((p) => Number.isFinite(p[field]))) continue;
    const groups = new Map();
    for (const photo of photos) {
      const key = gallery === 'trip' ? photo.tripId || '' : `${photo.mapId}|${photo.countryCode || ''}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(photo);
    }
    for (const group of groups.values()) {
      group.sort(newestFirst).forEach((p, index) => {
        p[field] = (index + 1) * STEP;
      });
    }
  }
}

// The slideshows' order (docs/API.md, "Slideshows"): each photo's `shotAt` is when it was
// taken, or when it was uploaded if the file had no date, as the server keeps it
// (domain/photos.js). Saving a photo, and changing or clearing its takenAt, sets it again.
export const shotAtOf = (photo) => photo.takenAt || photo.createdAt;
export const setShotAt = (photo) => {
  photo.shotAt = shotAtOf(photo);
};
/** Stores saved before photos had a shotAt (and the seed). */
export function fillShotAt(photos) {
  for (const photo of photos) if (!photo.shotAt) setShotAt(photo);
}
const timeOf = (value) => new Date(value).getTime() || 0;
/** Oldest taken first, then by id (`order=taken`). */
export const byShotAt = (a, b) => timeOf(a.shotAt ?? shotAtOf(a)) - timeOf(b.shotAt ?? shotAtOf(b)) || byId(a, b);

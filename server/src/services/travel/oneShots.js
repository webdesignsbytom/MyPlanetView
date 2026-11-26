// Life's One Shots (docs/API.md "Life's One Shots"): a map's ticks as sent, and what its
// flights and poles suggest ticking. The rules are utils/oneShots.js.
import { signPhotoUrl } from '../s3/mediaService.js';
import { findOneShots } from '../../domain/oneShots.js';
import { findFlightsForMap } from '../../domain/flights.js';
import { findMapVisitsForStats } from '../../domain/maps.js';
import { airportByCode } from '../../utils/flights.js';
import { oneShotSuggestions } from '../../utils/oneShots.js';
import { COUNTED_VISIT_STATUSES, toDateOnly } from '../../utils/travelValidation.js';

// One photo as sent: its id and its thumbnail and display copy, signed
async function photoView(photo) {
  const keyOf = (size) => photo.variants.find((v) => v.size === size)?.media.key;
  const [thumbUrl, displayUrl] = await Promise.all(['THUMB', 'DISPLAY'].map((size) => (keyOf(size) ? signPhotoUrl(keyOf(size)) : null)));
  return { id: photo.id, thumbUrl, displayUrl: displayUrl || thumbUrl };
}

/**
 * Ticks as sent: `{ id, itemKey, seenOn, datePrecision, countryCode, notes, source,
 * travellerIds, photos: [{ id, thumbUrl, displayUrl }], photo, createdAt }`: its photos in
 * order, `photo` the first (the one on its card) or null. A hidden photo shows only to the
 * owner and editors (`editor`); anyone else gets the tick without it.
 */
export async function oneShotViews(rows, { editor }) {
  return Promise.all(
    rows.map(async (row) => {
      const photos = await Promise.all(row.photos.map((p) => p.photo).filter((photo) => editor || !photo.hidden).map(photoView));
      return {
        id: row.id,
        itemKey: row.itemKey,
        seenOn: toDateOnly(row.seenOn),
        datePrecision: row.datePrecision,
        countryCode: row.countryCode,
        notes: row.notes,
        source: row.source,
        travellerIds: row.travellers.map((t) => t.travellerId),
        photos,
        photo: photos[0] ?? null,
        createdAt: row.createdAt,
      };
    }),
  );
}

/**
 * A map's ticks for someone who can see it, and for the owner and editors (`editor`) what
 * its flights and poles suggest ticking (none for anyone else: a viewer can't tick).
 * -> `{ oneShots, suggestions }`
 */
export async function mapOneShots(mapId, { editor }) {
  const [rows, flights, visits] = await Promise.all([
    findOneShots(mapId),
    editor ? findFlightsForMap(mapId) : [],
    editor ? findMapVisitsForStats(mapId) : [],
  ]);
  const oneShots = await oneShotViews(rows, { editor });
  const suggestions = editor
    ? oneShotSuggestions({
        flights,
        airportOf: airportByCode,
        visited: new Set(visits.filter((v) => COUNTED_VISIT_STATUSES.includes(v.status)).map((v) => v.countryCode)),
        ticked: new Set(rows.map((row) => row.itemKey)),
      })
    : [];
  return { oneShots, suggestions };
}

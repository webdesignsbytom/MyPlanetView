// Life's One Shots (docs/API.md "Life's One Shots"): a map's ticks as sent, and what its
// flights and poles suggest ticking. The rules are utils/oneShots.js.
import { signPhotoUrl } from '../s3/mediaService.js';
import { findThumbKeys } from '../../domain/passport.js';
import { findOneShots } from '../../domain/oneShots.js';
import { findFlightsForMap } from '../../domain/flights.js';
import { findMapVisitsForStats } from '../../domain/maps.js';
import { airportByCode } from '../../utils/flights.js';
import { oneShotSuggestions } from '../../utils/oneShots.js';
import { COUNTED_VISIT_STATUSES, toDateOnly } from '../../utils/travelValidation.js';

/**
 * Ticks as sent: `{ id, itemKey, seenOn, datePrecision, countryCode, notes, source,
 * travellerIds, photo: { id, thumbUrl } | null, createdAt }`. A hidden photo shows only to
 * the owner and editors (`editor`); anyone else gets the tick without it.
 */
export async function oneShotViews(rows, { editor }) {
  const shown = (row) => (row.photo && (editor || !row.photo.hidden) ? row.photo.id : null);
  const thumbKeys = await findThumbKeys([...new Set(rows.map(shown).filter(Boolean))]);
  return Promise.all(
    rows.map(async (row) => {
      const photoId = shown(row);
      return {
        id: row.id,
        itemKey: row.itemKey,
        seenOn: toDateOnly(row.seenOn),
        datePrecision: row.datePrecision,
        countryCode: row.countryCode,
        notes: row.notes,
        source: row.source,
        travellerIds: row.travellers.map((t) => t.travellerId),
        photo: photoId ? { id: photoId, thumbUrl: thumbKeys.has(photoId) ? await signPhotoUrl(thumbKeys.get(photoId)) : null } : null,
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

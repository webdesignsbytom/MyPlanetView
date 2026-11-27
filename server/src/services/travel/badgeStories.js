// The story behind a badge (docs/API.md "Badges and goals"; the rules in utils/badgeStories.js):
// the map's facts as its badges count them (loadMapFacts, as the caller may see them), shaped
// into the things each badge counts, in the order they happened.
import { STORY_KINDS, badgeStory, mapPlaces, oneShotItems, stampItems, storyBadge, travellerPlaces } from '../../utils/badgeStories.js';
import { toDateOnly } from '../../utils/travelValidation.js';
import { signPhotoUrl } from '../s3/mediaService.js';
import { loadMapFacts } from './achievements.js';
import { findCompletedTripsForTravellers } from '../../domain/achievements.js';
import { findMapSplitUk, findMapTravellers, findNthPhoto } from '../../domain/maps.js';
import { findOneShotDates } from '../../domain/oneShots.js';
import { findThemesEnteredByMap } from '../../domain/themes.js';
import { findThumbKeys } from '../../domain/passport.js';
import { continentsByCode } from '../../controllers/helpers/countries.js';
import { landmarkTotals } from '../../controllers/helpers/landmarks.js';

/** The photo that reached a photo badge's count, with its thumbnail (none for a video). */
async function photoItem(mapId, need, includeHidden) {
  const photo = await findNthPhoto(mapId, need, { includeHidden });
  if (!photo) return null;
  const thumbs = await findThumbKeys([photo.id]);
  return {
    id: photo.id,
    video: photo.kind === 'VIDEO',
    code: photo.countryCode ?? null,
    addedOn: toDateOnly(photo.createdAt),
    takenOn: toDateOnly(photo.takenAt),
    thumbUrl: thumbs.has(photo.id) ? await signPhotoUrl(thumbs.get(photo.id)) : null,
  };
}

/**
 * A badge's story on a map (utils/badgeStories.js badgeStory), counted as the caller may see the
 * map (`includeHidden` for the owner and editors). With `travellerId`, one traveller's travel
 * badge, from the completed trips they were on, each place with the trip that took them there.
 * -> `{ story }`, `{ badgeNotFound: true }` or `{ travellerNotFound: true }`
 */
export async function mapBadgeStory(mapId, key, { includeHidden, travellerId = null }) {
  const badge = storyBadge(key, { traveller: Boolean(travellerId) });
  if (!badge) return { badgeNotFound: true };

  if (travellerId) {
    const [people, trips, continentByCode, splitUk] = await Promise.all([
      findMapTravellers(mapId),
      findCompletedTripsForTravellers(mapId),
      continentsByCode(),
      findMapSplitUk(mapId),
    ]);
    if (!people.some((person) => person.id === travellerId)) return { travellerNotFound: true };
    const story = badgeStory(key, { places: travellerPlaces(trips, travellerId), continentByCode, splitUk });
    return story ? { story } : { badgeNotFound: true };
  }

  const kind = STORY_KINDS[badge.measure];
  const facts = await loadMapFacts(mapId, { includeHidden });
  const [oneShots, themes, photo, totals] = await Promise.all([
    kind === 'oneShots' ? findOneShotDates(mapId).then(oneShotItems) : [],
    kind === 'themes'
      ? findThemesEnteredByMap(mapId, { includeHidden }).then((rows) =>
          rows.map((t) => ({ title: t.title, month: toDateOnly(t.month), on: toDateOnly(t.firstEnteredAt) }))
        )
      : [],
    kind === 'photos' && facts.photos >= badge.need ? photoItem(mapId, badge.need, includeHidden) : null,
    badge.measure === 'collection' ? landmarkTotals(facts.splitUk) : new Map(),
  ]);
  const story = badgeStory(key, {
    places: kind === 'places' ? mapPlaces(facts) : [],
    stamps: kind === 'stamps' ? stampItems(facts.stamps) : [],
    oneShots,
    themes,
    photos: facts.photos,
    photo,
    splitUk: facts.splitUk,
    continentByCode: facts.continentByCode,
    landmarkTotals: totals,
  });
  if (!story) return { badgeNotFound: true };
  // The stamp that earned it shows its photo, as in the passport (a tick has none)
  const earned = kind === 'stamps' && story.earnedWith !== null ? story.items[story.earnedWith] : null;
  if (earned) {
    const photoId = facts.stamps.find((s) => s.landmarkId === earned.landmarkId)?.photoId ?? null;
    const thumbs = photoId ? await findThumbKeys([photoId]) : new Map();
    earned.thumbUrl = thumbs.has(photoId) ? await signPhotoUrl(thumbs.get(photoId)) : null;
  }
  return { story };
}

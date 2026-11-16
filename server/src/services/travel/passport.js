// The passport (docs/API.md, "Passport"): a cover, a photo page of the travellers, a page
// per country in the order they were first visited, each with its landmark stamps and
// the landmarks still to stamp, and the totals.
import { canEdit } from '../../utils/access.js';
import { isSpecialPlace } from '../../utils/specialPlaces.js';
import { COUNTED_VISIT_STATUSES, toDateOnly } from '../../utils/travelValidation.js';
import { signPhotoUrl } from '../s3/mediaService.js';
import {
  findLandmarkCovers,
  findLandmarksInCountries,
  findPassportMap,
  findPassportTravellers,
  findThumbKeys,
  findVisitsForPassport,
} from '../../domain/passport.js';
import { loadMapFacts } from './achievements.js';

const time = (date) => (date ? new Date(date).getTime() : Infinity);

/**
 * The whole passport, as `role` may see it: below editor, hidden photos neither stamp nor
 * show, and a stamp whose chosen photo is hidden shows its earliest visible one instead.
 * -> null when the map is gone
 */
export async function buildPassport(mapId, role) {
  const editor = canEdit(role);
  const [map, travellers, visits, covers, facts] = await Promise.all([
    findPassportMap(mapId),
    findPassportTravellers(mapId),
    findVisitsForPassport(mapId),
    findLandmarkCovers(mapId),
    loadMapFacts(mapId, { includeHidden: editor }),
  ]);
  if (!map) return null;

  // The pages: every country marked visited or lived, plus any with a stamp
  const visitByCode = new Map(visits.map((v) => [v.countryCode, v]));
  const codes = new Set([...facts.visited, ...facts.stamps.map((s) => s.countryCode)]);
  const enteredOn = (code) => facts.firstPhotoAt.get(code) ?? visitByCode.get(code)?.firstVisitedOn ?? null;
  const ordered = [...codes].sort(
    (a, b) =>
      time(enteredOn(a)) - time(enteredOn(b)) ||
      time(visitByCode.get(a)?.createdAt) - time(visitByCode.get(b)?.createdAt) ||
      a.localeCompare(b)
  );

  // Each stamp's photo: the chosen one (unless it's hidden from this caller), else the
  // earliest confirmed one the caller can see
  const coverOf = new Map(covers.filter((c) => editor || !c.hidden).map((c) => [c.landmarkId, c.photoId]));
  const chosenOf = new Map(covers.map((c) => [c.landmarkId, c.photoId]));
  const photoOf = (stamp) => coverOf.get(stamp.landmarkId) ?? stamp.photoId;
  const thumbKeys = await findThumbKeys([...new Set(facts.stamps.map(photoOf))]);
  const thumbUrl = async (photoId) => (thumbKeys.has(photoId) ? signPhotoUrl(thumbKeys.get(photoId)) : null);

  const stampsByCountry = new Map();
  for (const stamp of facts.stamps) {
    if (!stampsByCountry.has(stamp.countryCode)) stampsByCountry.set(stamp.countryCode, []);
    stampsByCountry.get(stamp.countryCode).push(stamp);
  }
  const landmarksByCountry = new Map();
  for (const landmark of await findLandmarksInCountries(ordered)) {
    if (!landmarksByCountry.has(landmark.countryCode)) landmarksByCountry.set(landmark.countryCode, []);
    landmarksByCountry.get(landmark.countryCode).push(landmark);
  }

  const pages = await Promise.all(
    ordered.map(async (code) => {
      const stamps = (stampsByCountry.get(code) ?? []).sort((a, b) => a.firstShotAt - b.firstShotAt || a.name.localeCompare(b.name));
      const stamped = new Set(stamps.map((s) => s.landmarkId));
      return {
        countryCode: code,
        // VISITED or LIVED; null on a page that has only stamps (even if marked "want to go")
        status: COUNTED_VISIT_STATUSES.includes(visitByCode.get(code)?.status) ? visitByCode.get(code).status : null,
        enteredOn: toDateOnly(enteredOn(code)),
        stamps: await Promise.all(
          stamps.map(async (stamp) => ({
            landmarkId: stamp.landmarkId,
            name: stamp.name,
            isUnesco: stamp.isUnesco,
            stampedOn: toDateOnly(stamp.firstShotAt),
            photoCount: stamp.photoCount,
            photo: { id: photoOf(stamp), thumbUrl: await thumbUrl(photoOf(stamp)) },
            // Editors: whether someone picked the photo (else it's the earliest)
            ...(editor ? { photoChosen: chosenOf.has(stamp.landmarkId) } : {}),
          }))
        ),
        toStamp: (landmarksByCountry.get(code) ?? [])
          .filter((l) => !stamped.has(l.id))
          .map((l) => ({ id: l.id, name: l.name, isUnesco: l.isUnesco })),
      };
    })
  );

  const counted = [...facts.visited];
  const countries = counted.filter((code) => !isSpecialPlace(code));
  return {
    map: { id: map.id, name: map.name, groupType: map.groupType, ownerName: map.owner?.name ?? null },
    travellers,
    pages,
    totals: {
      countries: countries.length,
      specialPlaces: counted.length - countries.length,
      continents: new Set(counted.map((code) => facts.continentByCode.get(code)).filter(Boolean)).size,
      landmarks: facts.stamps.length,
      unesco: facts.stamps.filter((s) => s.isUnesco).length,
    },
  };
}

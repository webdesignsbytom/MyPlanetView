// The passport (docs/API.md, "Passport"): a cover, a photo page of the travellers, a page
// per country in the order they were first visited, each with its landmark stamps and
// the landmarks still to stamp, and the totals. One traveller's own passport (21 Nov 2026,
// the user's wish: each child's own passport, from the family map) has only their places
// and stamps: travellerFacts.
import { canEdit, canManage } from '../../utils/access.js';
import { isSpecialPlace } from '../../utils/specialPlaces.js';
import { isRegion } from '../../utils/regionPlaces.js';
import { COUNTED_VISIT_STATUSES, toDateOnly } from '../../utils/travelValidation.js';
import { signPhotoUrl } from '../s3/mediaService.js';
import {
  findFirstPhotoByCountry,
  findLandmarkCovers,
  findLandmarkMoments,
  findLandmarksInCountries,
  findPassportMap,
  findPassportTravellers,
  findStamps,
  findThumbKeys,
  findTravellerTravel,
  findTravellerTrips,
  findVisitsForPassport,
} from '../../domain/passport.js';
import { findMapSplitUk } from '../../domain/maps.js';
import { continentsByCode } from '../../controllers/helpers/countries.js';
import { loadMapFacts, stampsFrom } from './achievements.js';
import { landmarkPlace, placeOnMap } from '../../utils/ukNations.js';
import { loadMapPlan } from './plans.js';
import { planOf } from '../../utils/constants/plans.js';
import { earliestOf, passportPageOrder } from '../../utils/passportOrder.js';
import { travellingSince } from '../../utils/travellerPassport.js';
import { isPassportColour } from '../../utils/passportCovers.js';
import { homeOf } from '../../utils/travelStats.js';

/**
 * The passport photo a traveller's page shows (25 Nov 2026): the map photo chosen for it, with
 * its crop (the DISPLAY copy signed, as a photo's; a hidden one for editors only), else the
 * picture on their own account (a linked traveller's), else null (their initials).
 * -> `{ source: 'MAP'|'ACCOUNT', photoId, url, width, height, focusX, focusY, zoom }` or null
 */
async function portraitOf(row, editor) {
  const photo = row.portraitPhoto;
  const key = photo?.variants?.[0]?.media?.key;
  if (photo && key && photo.kind === 'PHOTO' && (editor || !photo.hidden)) {
    return {
      source: 'MAP',
      photoId: photo.id,
      url: await signPhotoUrl(key),
      width: photo.width ?? null,
      height: photo.height ?? null,
      focusX: row.portraitFocusX ?? 0.5,
      focusY: row.portraitFocusY ?? 0.5,
      zoom: row.portraitZoom ?? 1,
    };
  }
  if (row.user?.image) return { source: 'ACCOUNT', photoId: null, url: row.user.image, width: null, height: null, focusX: 0.5, focusY: 0.5, zoom: 1 };
  return null;
}

/**
 * A traveller as their passport page shows them (docs/API.md "Passport"; 25 Nov 2026, the
 * user's wish: "improve passport page for user avatars and info"): their photo (portraitOf),
 * where they were born and their favourite country, the date of birth for editors only (as the
 * map's reply), the day they were added to the map (the "date of issue"), when they started
 * travelling (`since`: their first trip that isn't still planned) and their signature. Never
 * the account they're linked to.
 */
export async function passportTravellerView(row, { editor, since = null }) {
  return {
    id: row.id,
    name: row.name,
    // The passport's Surname (27 Nov 2026)
    lastName: row.lastName ?? null,
    // The passport's Nationality (27 Nov 2026)
    nationalityCode: row.nationalityCode ?? null,
    birthCountryCode: row.birthCountryCode ?? null,
    favouriteCountryCode: row.favouriteCountryCode ?? null,
    ...(editor ? { birthDate: toDateOnly(row.birthDate) } : {}),
    issuedOn: toDateOnly(row.createdAt),
    travellingSince: toDateOnly(since),
    photo: await portraitOf(row, editor),
    signature: row.signature ?? null,
  };
}

/** Each traveller's first trip that isn't still planned: Map travellerId -> Date. */
export async function travellingSinceByTraveller(mapId) {
  const byTraveller = new Map();
  for (const row of await findTravellerTrips(mapId)) {
    if (!byTraveller.has(row.travellerId)) byTraveller.set(row.travellerId, []);
    byTraveller.get(row.travellerId).push(row.trip);
  }
  return new Map([...byTraveller].map(([id, trips]) => [id, travellingSince(trips)]));
}

/**
 * One traveller's facts, in the shape the passport reads from loadMapFacts: `visited` is the
 * places they've been (their completed trips' stops, the places of the photos on any trip
 * of theirs or in a moment about them, those moments' places, where they were born) and
 * `stamps` those photos' confirmed landmarks; `firstAt` the day each place was first reached
 * (null when nothing says).
 */
async function travellerFacts(mapId, traveller, { includeHidden }) {
  const [travel, splitUk, continentByCode] = await Promise.all([
    findTravellerTravel(mapId, traveller.id, { includeHidden }),
    findMapSplitUk(mapId),
    continentsByCode(),
  ]);
  // Their ticks are the ones made by their own account (a child with no login has none)
  const scope = {
    tripIds: travel.trips.map((t) => t.id),
    photoIds: [...new Set(travel.moments.flatMap((m) => m.photoIds))],
    userId: traveller.userId ?? null,
  };
  const [stampRows, firstPhotoAt] = await Promise.all([
    findStamps(mapId, { includeHidden, scope }),
    findFirstPhotoByCountry(mapId, { includeHidden, scope }),
  ]);
  const stamps = await stampsFrom(stampRows, splitUk);

  const firstAt = new Map();
  const reach = (code, date) => {
    if (!code) return;
    const at = date ? new Date(date) : null;
    const known = firstAt.get(code);
    if (!firstAt.has(code) || (at && (!known || at < known))) firstAt.set(code, at);
  };
  for (const trip of travel.trips.filter((t) => t.status === 'COMPLETED')) {
    for (const stop of trip.stops) reach(stop.countryCode, stop.arriveOn ?? trip.startDate);
  }
  for (const moment of travel.moments) reach(moment.countryCode, moment.happenedOn);
  for (const [code, at] of firstPhotoAt) reach(code, at);
  for (const stamp of stamps) reach(stamp.countryCode, stamp.firstShotAt);
  // A traveller's places are countries (a birth in Scotland is the UK's)
  if (traveller.birthCountryCode) reach(traveller.birthCountryCode, null);
  return { visited: new Set(firstAt.keys()), stamps, firstAt, continentByCode, splitUk };
}

/**
 * The whole passport, as `role` may see it: below editor, hidden photos neither stamp nor
 * show, and a stamp whose chosen photo is hidden shows its earliest visible one instead.
 * `travellerId`: that traveller's own passport (travellerFacts), its cover theirs.
 * -> null when the map is gone; `{ travellerNotFound: true }` for a traveller not on it
 */
export async function buildPassport(mapId, role, { travellerId = null } = {}) {
  const editor = canEdit(role);
  const [map, travellers, visits, covers, mapPlan, since] = await Promise.all([
    findPassportMap(mapId),
    findPassportTravellers(mapId),
    findVisitsForPassport(mapId),
    findLandmarkCovers(mapId),
    loadMapPlan(mapId),
    travellingSinceByTraveller(mapId),
  ]);
  if (!map) return null;
  const holder = travellerId ? (travellers.find((t) => t.id === travellerId) ?? null) : null;
  if (travellerId && !holder) return { travellerNotFound: true };
  const facts = holder ? await travellerFacts(mapId, holder, { includeHidden: editor }) : await loadMapFacts(mapId, { includeHidden: editor });

  // The pages: every country marked visited or lived, plus any with a stamp (one
  // traveller's: every place they've been)
  const visitByCode = new Map(visits.map((v) => [v.countryCode, v]));
  const codes = new Set([...facts.visited, ...facts.stamps.map((s) => s.countryCode)]);
  // The first visit: the earlier of its first photo and the first visit as set (the UK lived in
  // since 1990 enters then, not with its first photo)
  const enteredOn = holder
    ? (code) => facts.firstAt.get(code) ?? null
    : (code) => earliestOf(facts.firstPhotoAt.get(code), visitByCode.get(code)?.firstVisitedOn);
  // In the order visited, an undated place on the day it was marked (24 Nov 2026, the user's wish)
  const ordered = passportPageOrder(codes, { enteredOn, markedAt: (code) => visitByCode.get(code)?.createdAt ?? null });

  // Each stamp's photo: the chosen one (unless it's hidden from this caller), else the
  // earliest confirmed one the caller can see
  const coverOf = new Map(covers.filter((c) => editor || !c.hidden).map((c) => [c.landmarkId, c.photoId]));
  const chosenOf = new Map(covers.map((c) => [c.landmarkId, c.photoId]));
  // A landmark ticked "been here" with no photo has none (null)
  const photoOf = (stamp) => coverOf.get(stamp.landmarkId) ?? stamp.photoId;
  const [thumbKeys, moments] = await Promise.all([
    findThumbKeys([...new Set(facts.stamps.map(photoOf).filter(Boolean))]),
    findLandmarkMoments(mapId, [...new Set(facts.stamps.map((s) => s.landmarkId))], { includeHidden: editor }),
  ]);
  // The moments that happened at each stamped landmark
  const momentsAt = new Map();
  for (const moment of moments) {
    if (!momentsAt.has(moment.landmarkId)) momentsAt.set(moment.landmarkId, []);
    momentsAt.get(moment.landmarkId).push({
      id: moment.id,
      title: moment.title,
      kind: moment.kind,
      happenedOn: toDateOnly(moment.happenedOn),
      datePrecision: moment.datePrecision,
    });
  }
  const thumbUrl = async (photoId) => (thumbKeys.has(photoId) ? signPhotoUrl(thumbKeys.get(photoId)) : null);

  const stampsByCountry = new Map();
  for (const stamp of facts.stamps) {
    if (!stampsByCountry.has(stamp.countryCode)) stampsByCountry.set(stamp.countryCode, []);
    stampsByCountry.get(stamp.countryCode).push(stamp);
  }
  // Each page's landmarks: on a map that splits the UK, a nation's are the UK landmarks in it
  const landmarksByCountry = new Map();
  const landmarkCodes = [...new Set(ordered.map((code) => placeOnMap(code, false)))];
  for (const landmark of await findLandmarksInCountries(landmarkCodes)) {
    const place = landmarkPlace(landmark, facts.splitUk);
    if (!landmarksByCountry.has(place)) landmarksByCountry.set(place, []);
    landmarksByCountry.get(place).push(landmark);
  }

  const pages = await Promise.all(
    ordered.map(async (code) => {
      const stamps = (stampsByCountry.get(code) ?? []).sort((a, b) => a.firstShotAt - b.firstShotAt || a.name.localeCompare(b.name));
      const stamped = new Set(stamps.map((s) => s.landmarkId));
      return {
        countryCode: code,
        // VISITED or LIVED; null on a page that has only stamps (even if marked "want to go"); on
        // a traveller's own, the map's status, else VISITED (they've been)
        status: COUNTED_VISIT_STATUSES.includes(visitByCode.get(code)?.status) ? visitByCode.get(code).status : holder ? 'VISITED' : null,
        enteredOn: toDateOnly(enteredOn(code)),
        stamps: await Promise.all(
          stamps.map(async (stamp) => ({
            landmarkId: stamp.landmarkId,
            name: stamp.name,
            isUnesco: stamp.isUnesco,
            stampedOn: toDateOnly(stamp.firstShotAt),
            photoCount: stamp.photoCount,
            // Ticked "been here" with no photo (23 Nov 2026): a stamp with no picture
            ticked: stamp.ticked,
            photo: photoOf(stamp) ? { id: photoOf(stamp), thumbUrl: await thumbUrl(photoOf(stamp)) } : null,
            // The map's moments at this landmark (hidden ones for editors only)
            moments: momentsAt.get(stamp.landmarkId) ?? [],
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

  // Regions (Bali, Tasmania) have their own visa page, but count only as their own total
  const counted = [...facts.visited];
  const countries = counted.filter((code) => !isSpecialPlace(code) && !isRegion(code));
  return {
    // The owner's plan picks the cover (Economy, Business, First Class), as it picks every rule
    map: {
      id: map.id,
      name: map.name,
      groupType: map.groupType,
      ownerName: map.owner?.name ?? null,
      plan: { id: planOf(mapPlan?.plan).id, name: planOf(mapPlan?.plan).name },
      // Whose passport this is: one traveller's own, or null for the whole map's
      traveller: holder ? { id: holder.id, name: holder.name } : null,
      // Home, on every traveller's page (the map's, else the owner's birthplace: utils/travelStats.js)
      homeCountryCode: homeOf({ homeCountryCode: map.homeCountryCode, ownerId: map.ownerId, travellers }),
      // Whether the caller may change the travellers' photos and signatures (the map's editors)
      canEdit: editor,
      // The cover's colour (26 Nov 2026; null: the plan's own), and whether the caller may
      // choose it (the owner and co-owners, as the map's style)
      passportColour: isPassportColour(map.passportColour) ? map.passportColour : null,
      canChooseCover: canManage(role),
    },
    // Each traveller's page (passportTravellerView), never the account they're linked to
    travellers: await Promise.all(travellers.map((row) => passportTravellerView(row, { editor, since: since.get(row.id) ?? null }))),
    pages,
    totals: {
      countries: countries.length,
      specialPlaces: counted.filter(isSpecialPlace).length,
      regions: counted.filter(isRegion).length,
      continents: new Set(counted.filter((code) => !isRegion(code)).map((code) => facts.continentByCode.get(code)).filter(Boolean)).size,
      landmarks: facts.stamps.length,
      unesco: facts.stamps.filter((s) => s.isUnesco).length,
    },
  };
}

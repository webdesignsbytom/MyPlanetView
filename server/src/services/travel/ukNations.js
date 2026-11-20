// Turning a map's UK split on or off (docs/API.md "The UK's nations"; utils/ukNations.js):
// one transaction moves the map's UK visits, photos, trip stops and moments between the
// UK (GB) and its four nations, then sets TravelMap.splitUk. Nothing is deleted.
//
// On: each photo, stop and moment in the UK goes to the nation it was in when the split
// was last turned off (`ukNation`), else the one its GPS position is in (photos), else its
// landmark's; anything else stays in the UK, "nation not chosen", for the person to
// place (the map asks). The nations get the visits their photos (PHOTO) and completed
// trips' stops (TRIP) bring, and their visits from before are put back (the stash in
// TravelMap.ukNationVisits) if the UK's visit is still as it left it. A UK visit that no
// longer says anything the nations don't (it came from located photos or stops, has no
// note, and nothing is left in the UK) goes; one marked by hand stays, to be given its
// nations.
//
// Off: the nations' visits become one UK visit (the highest status, the earliest date,
// their notes), kept in the stash; photos, stops and moments go back to the UK,
// remembering their nation in `ukNation`.
import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma.js';
import { COUNTED_VISIT_STATUSES, NOTES_MAX } from '../../utils/travelValidation.js';
import { placesOfSubdivision } from '../../utils/subdivisions.js';
import { UK, UK_NATION_CODES, UK_NATION_NAMES, isUkNation, landmarkPlace, ukNationAt } from '../../utils/ukNations.js';
import { createMissingVisits } from '../../domain/maps.js';

const STATUS_RANK = { WANT_TO_GO: 1, VISITED: 2, LIVED: 3 };
const VISIT_FIELDS = { countryCode: true, status: true, source: true, firstVisitedOn: true, notes: true };

const nationOrNull = (code) => (isUkNation(code) ? code : null);

// Move rows to their places: `targets` is [[id, nation]]; one updateMany per nation
async function moveTo(model, targets, tx) {
  for (const nation of UK_NATION_CODES) {
    const ids = targets.filter(([, place]) => place === nation).map(([id]) => id);
    if (ids.length) await tx[model].updateMany({ where: { id: { in: ids } }, data: { countryCode: nation, ukNation: null } });
  }
}

// The visit the nations' visits make as one: the highest status, the earliest first visit,
// the UK's own note or else theirs (named), and where the highest came from
function mergedUkVisit(ukVisit, nationVisits) {
  const all = [...(ukVisit ? [ukVisit] : []), ...nationVisits];
  const best = all.reduce((a, b) => (STATUS_RANK[b.status] > STATUS_RANK[a.status] ? b : a));
  const dates = all.map((v) => v.firstVisitedOn).filter(Boolean).sort((a, b) => a - b);
  const notes =
    ukVisit?.notes ||
    nationVisits
      .filter((v) => v.notes)
      .map((v) => `${UK_NATION_NAMES[v.countryCode]}: ${v.notes}`)
      .join('\n\n')
      .slice(0, NOTES_MAX) ||
    null;
  return { status: best.status, source: best.source, firstVisitedOn: dates[0] ?? null, notes };
}

// The map's row locked first (FOR NO KEY UPDATE, as a photo save takes it): a photo saved at
// the same moment waits, then sees the new setting (createPhotoInDB; 19 Nov 2026, the audit)
const lockMap = (tx, mapId) => tx.$queryRaw`SELECT 1 FROM "travel_map" WHERE "id" = ${mapId} FOR NO KEY UPDATE`;

async function splitOn(mapId, tx) {
  await lockMap(tx, mapId);
  const map = await tx.travelMap.findUnique({ where: { id: mapId }, select: { splitUk: true, ukNationVisits: true } });
  if (!map || map.splitUk) return;

  // Photos: remembered, else GPS, else a confirmed landmark's nation
  const photos = await tx.photo.findMany({
    where: { mapId, countryCode: UK },
    select: {
      id: true,
      ukNation: true,
      latitude: true,
      longitude: true,
      landmarks: { where: { confirmed: true }, select: { landmark: { select: { countryCode: true, latitude: true, longitude: true } } } },
    },
  });
  const photoTargets = photos.map((p) => {
    const gps = p.latitude !== null && p.longitude !== null ? ukNationAt(p.latitude, p.longitude) : null;
    const atLandmark = p.landmarks.map((m) => nationOrNull(landmarkPlace(m.landmark, true))).find(Boolean) ?? null;
    return [p.id, nationOrNull(p.ukNation) ?? gps ?? atLandmark];
  });
  await moveTo('photo', photoTargets, tx);

  // Trip stops (on this map's own trips) and moments: remembered, else their landmark's
  const located = (row) => nationOrNull(row.ukNation) ?? (row.landmark ? nationOrNull(landmarkPlace(row.landmark, true)) : null);
  const LANDMARK = { select: { countryCode: true, latitude: true, longitude: true } };
  const stops = await tx.tripStop.findMany({
    where: { countryCode: UK, trip: { mapId } },
    select: { id: true, ukNation: true, landmark: LANDMARK, trip: { select: { status: true } } },
  });
  const stopTargets = stops.map((s) => [s.id, located(s)]);
  await moveTo('tripStop', stopTargets, tx);
  // A moment: remembered, else the nation its pin is in, else its landmark's (19 Nov 2026,
  // the audit: a birth pinned in Manchester stayed in the UK)
  const moments = await tx.moment.findMany({
    where: { mapId, countryCode: UK },
    select: { id: true, ukNation: true, latitude: true, longitude: true, landmark: LANDMARK },
  });
  const pinned = (m) => (m.latitude !== null && m.longitude !== null ? ukNationAt(m.latitude, m.longitude) : null);
  await moveTo('moment', moments.map((m) => [m.id, nationOrNull(m.ukNation) ?? pinned(m) ?? located(m)]), tx);

  // Visits: the nations' from before, then what the moved photos and completed trips bring
  const ukVisit = await tx.countryVisit.findUnique({ where: { mapId_countryCode: { mapId, countryCode: UK } }, select: VISIT_FIELDS });
  const stash = map.ukNationVisits;
  const restoring = Boolean(ukVisit && stash?.uk && stash.uk.status === ukVisit.status && (stash.uk.notes ?? null) === (ukVisit.notes ?? null));
  if (restoring) {
    await tx.countryVisit.createMany({
      data: (stash.nations || [])
        .filter((v) => isUkNation(v.countryCode))
        .map((v) => ({ ...v, mapId, firstVisitedOn: v.firstVisitedOn ? new Date(v.firstVisitedOn) : null })),
      skipDuplicates: true,
    });
  }
  const withPhotos = [...new Set(photoTargets.map(([, n]) => n).filter(Boolean))];
  await createMissingVisits(mapId, withPhotos, 'PHOTO', tx);
  const fromTrips = [...new Set(stops.map((s, i) => (s.trip.status === 'COMPLETED' ? stopTargets[i][1] : null)).filter(Boolean))];
  await createMissingVisits(mapId, fromTrips, 'TRIP', tx);
  // UK states marked visited or lived bring their nation, as marking one on a split map does
  const states = await tx.subdivisionVisit.findMany({
    where: { mapId, countryCode: UK, status: { in: [...COUNTED_VISIT_STATUSES] } },
    select: { subdivisionCode: true },
  });
  const fromStates = [...new Set(states.flatMap((s) => placesOfSubdivision(s.subdivisionCode, true)).filter(isUkNation))];
  await createMissingVisits(mapId, fromStates, 'MANUAL', tx);

  // The UK's own visit: gone once the nations say all it did
  if (ukVisit) {
    const leftInUk = photoTargets.some(([, n]) => !n) || stopTargets.some(([, n]) => !n);
    const nationCount = await tx.countryVisit.count({ where: { mapId, countryCode: { in: [...UK_NATION_CODES] } } });
    const redundant = restoring || (ukVisit.source !== 'MANUAL' && !ukVisit.notes && !leftInUk && nationCount > 0);
    if (redundant) await tx.countryVisit.delete({ where: { mapId_countryCode: { mapId, countryCode: UK } } });
  }

  await tx.travelMap.update({ where: { id: mapId }, data: { splitUk: true, ukNationVisits: Prisma.DbNull } });
}

async function splitOff(mapId, tx) {
  await lockMap(tx, mapId);
  const map = await tx.travelMap.findUnique({ where: { id: mapId }, select: { splitUk: true } });
  if (!map || !map.splitUk) return;

  // Visits: the nations' become one UK visit, and are kept for turning the split on again
  const nationVisits = await tx.countryVisit.findMany({
    where: { mapId, countryCode: { in: [...UK_NATION_CODES] } },
    select: VISIT_FIELDS,
  });
  let stash = null;
  if (nationVisits.length) {
    const ukVisit = await tx.countryVisit.findUnique({ where: { mapId_countryCode: { mapId, countryCode: UK } }, select: VISIT_FIELDS });
    const merged = mergedUkVisit(ukVisit, nationVisits);
    await tx.countryVisit.deleteMany({ where: { mapId, countryCode: { in: [...UK_NATION_CODES] } } });
    await tx.countryVisit.upsert({
      where: { mapId_countryCode: { mapId, countryCode: UK } },
      create: { mapId, countryCode: UK, ...merged },
      update: merged,
    });
    stash = {
      nations: nationVisits.map((v) => ({ ...v, firstVisitedOn: v.firstVisitedOn ? v.firstVisitedOn.toISOString() : null })),
      uk: { status: merged.status, notes: merged.notes },
    };
  }

  // Photos, stops (on this map's own trips) and moments go back to the UK, remembering
  for (const nation of UK_NATION_CODES) {
    await tx.photo.updateMany({ where: { mapId, countryCode: nation }, data: { countryCode: UK, ukNation: nation } });
    await tx.tripStop.updateMany({ where: { countryCode: nation, trip: { mapId } }, data: { countryCode: UK, ukNation: nation } });
    await tx.moment.updateMany({ where: { mapId, countryCode: nation }, data: { countryCode: UK, ukNation: nation } });
  }

  await tx.travelMap.update({ where: { id: mapId }, data: { splitUk: false, ukNationVisits: stash ?? Prisma.DbNull } });
}

/** Show the map's UK as its four nations (`on`), or as one country again. One transaction. */
export const setMapSplitUk = (mapId, on) => prisma.$transaction((tx) => (on ? splitOn(mapId, tx) : splitOff(mapId, tx)));

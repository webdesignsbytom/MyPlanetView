// Turning a map's UK split on or off in the mock: a copy of the server's
// services/travel/ukNations.js over the mock's store (keep the two in step). On: each UK
// photo, stop and moment goes to its remembered nation (`ukNation`), else its GPS one
// (photos), else its landmark's; anything else stays in the UK; the nations get the
// visits their photos and completed trips bring, and their visits from before come back
// (the map's `ukNationVisits`) if the UK's visit is as it left it. A UK visit that says no
// more than the nations goes. Off: the nations' visits become one UK visit (kept for
// later), and everything goes back to the UK remembering its nation.
import { getDb } from './store';
import { landmarkById, markVisited } from './views';
import { ukNationAt } from './ukNationLookup';
import { UK, isUkNation, landmarkPlace } from '@/utils/map/ukNations';

const STATUS_RANK = { WANT_TO_GO: 1, VISITED: 2, LIVED: 3 };
const NAMES = { XE: 'England', XC: 'Scotland', XW: 'Wales', XI: 'Northern Ireland' };
const NOTES_MAX = 1000;

const nationOrNull = (code) => (isUkNation(code) ? code : null);
const landmarkNation = (landmarkId) => {
  const landmark = landmarkId ? landmarkById(landmarkId) : null;
  return landmark ? nationOrNull(landmarkPlace(landmark, true)) : null;
};
const visitOf = (db, mapId, code) => db.visits.find((v) => v.mapId === mapId && v.countryCode === code) || null;

function splitOn(db, map) {
  const tripIds = new Set(db.trips.filter((t) => t.mapId === map.id).map((t) => t.id));
  const confirmedAt = (photoId) =>
    db.photoLandmarks.filter((pl) => pl.photoId === photoId && pl.confirmed).map((pl) => landmarkNation(pl.landmarkId)).find(Boolean) ?? null;

  const photos = db.photos.filter((p) => p.mapId === map.id && p.countryCode === UK);
  const photoTargets = photos.map((p) => {
    const gps = Number.isFinite(p.latitude) && Number.isFinite(p.longitude) ? ukNationAt(p.latitude, p.longitude) : null;
    return [p, nationOrNull(p.ukNation) ?? gps ?? confirmedAt(p.id)];
  });
  const stops = db.stops.filter((s) => tripIds.has(s.tripId) && s.countryCode === UK);
  const stopTargets = stops.map((s) => [s, nationOrNull(s.ukNation) ?? landmarkNation(s.landmarkId)]);
  // A moment: remembered, else the nation its pin is in, else its landmark's (as the server)
  const moments = db.moments.filter((m) => m.mapId === map.id && m.countryCode === UK);
  const pinned = (m) => (Number.isFinite(m.latitude) && Number.isFinite(m.longitude) ? ukNationAt(m.latitude, m.longitude) : null);
  const momentTargets = moments.map((m) => [m, nationOrNull(m.ukNation) ?? pinned(m) ?? landmarkNation(m.landmarkId)]);
  for (const [row, nation] of [...photoTargets, ...stopTargets, ...momentTargets]) {
    if (nation) Object.assign(row, { countryCode: nation, ukNation: null });
  }

  // Visits: the nations' from before, then what the moved photos and completed trips bring
  const ukVisit = visitOf(db, map.id, UK);
  const stash = map.ukNationVisits;
  const restoring = Boolean(ukVisit && stash?.uk && stash.uk.status === ukVisit.status && (stash.uk.notes ?? null) === (ukVisit.notes ?? null));
  if (restoring) {
    for (const v of stash.nations || []) if (isUkNation(v.countryCode) && !visitOf(db, map.id, v.countryCode)) db.visits.push({ ...v, mapId: map.id });
  }
  // The map is split from here, so markVisited keeps the nations as they are
  map.splitUk = true;
  for (const nation of new Set(photoTargets.map(([, n]) => n).filter(Boolean))) markVisited(map.id, nation, 'PHOTO');
  const completed = (stop) => db.trips.find((t) => t.id === stop.tripId)?.status === 'COMPLETED';
  for (const nation of new Set(stopTargets.filter(([s, n]) => n && completed(s)).map(([, n]) => n))) markVisited(map.id, nation, 'TRIP');

  if (ukVisit) {
    const leftInUk = photoTargets.some(([, n]) => !n) || stopTargets.some(([, n]) => !n);
    const nations = db.visits.some((v) => v.mapId === map.id && isUkNation(v.countryCode));
    if (restoring || (ukVisit.source !== 'MANUAL' && !ukVisit.notes && !leftInUk && nations)) {
      db.visits = db.visits.filter((v) => v !== ukVisit);
    }
  }
  map.ukNationVisits = null;
}

function splitOff(db, map) {
  const nationVisits = db.visits.filter((v) => v.mapId === map.id && isUkNation(v.countryCode));
  let stash = null;
  if (nationVisits.length) {
    const ukVisit = visitOf(db, map.id, UK);
    const all = [...(ukVisit ? [ukVisit] : []), ...nationVisits];
    const best = all.reduce((a, b) => (STATUS_RANK[b.status] > STATUS_RANK[a.status] ? b : a));
    const dates = all.map((v) => v.firstVisitedOn).filter(Boolean).sort();
    const notes =
      ukVisit?.notes ||
      nationVisits
        .filter((v) => v.notes)
        .map((v) => `${NAMES[v.countryCode]}: ${v.notes}`)
        .join('\n\n')
        .slice(0, NOTES_MAX) ||
      null;
    const merged = { status: best.status, source: best.source, firstVisitedOn: dates[0] ?? null, notes };
    db.visits = db.visits.filter((v) => !(v.mapId === map.id && isUkNation(v.countryCode)));
    if (ukVisit) Object.assign(ukVisit, merged);
    else db.visits.push({ mapId: map.id, countryCode: UK, ...merged });
    stash = {
      nations: nationVisits.map(({ countryCode, status, source, firstVisitedOn, notes: n }) => ({ countryCode, status, source, firstVisitedOn, notes: n })),
      uk: { status: merged.status, notes: merged.notes },
    };
  }
  const tripIds = new Set(db.trips.filter((t) => t.mapId === map.id).map((t) => t.id));
  for (const row of [
    ...db.photos.filter((p) => p.mapId === map.id),
    ...db.stops.filter((s) => tripIds.has(s.tripId)),
    ...db.moments.filter((m) => m.mapId === map.id),
  ]) {
    if (isUkNation(row.countryCode)) Object.assign(row, { ukNation: row.countryCode, countryCode: UK });
  }
  map.splitUk = false;
  map.ukNationVisits = stash;
}

/** Show the map's UK as its four nations (`on`), or as one country again. */
export function setMapSplitUk(map, on) {
  if (Boolean(map.splitUk) === Boolean(on)) return;
  const db = getDb();
  if (on) splitOn(db, map);
  else splitOff(db, map);
}

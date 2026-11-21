// Mock mode only: "Your year in travel" (docs/API.md "Year in travel"), as the server's
// utils/recaps.js and controllers/recaps.js, counted over the store: one calendar year (UTC)
// of a map, counting what the caller may see (hidden photos and moments for editors only).
import { COUNTRIES } from '@/utils/map/countries';
import { isSpecialPlace } from '@/utils/map/specialPlaces';
import { isRegion } from '@/utils/map/regionPlaces';
import { countedCountryCodes } from '@/utils/map/ukNations';
import { getDb } from './store';
import { atLeast, canSeePhoto, landmarkById, photoListItem, photoUrls } from './views';

const continentByCode = new Map(COUNTRIES.map((c) => [c.code, c.continent]));
const COUNTED = ['VISITED', 'LIVED'];
const HIGHLIGHTS = 6;
const STAMPS_LISTED = 12;

/** A year from the address: 1900 to next year, else null. */
export function parseRecapYear(value, now = new Date()) {
  const year = /^\d{4}$/.test(String(value ?? '')) ? Number(value) : NaN;
  return Number.isInteger(year) && year >= 1900 && year <= now.getUTCFullYear() + 1 ? year : null;
}

const yearOf = (date) => (date ? new Date(date).getUTCFullYear() : null);
const inYear = (date, year) => yearOf(date) === year;

// The trips the year counts: done or under way, touching the year; their stops in it
function tripsInYear(trips, stops, year) {
  const from = new Date(Date.UTC(year, 0, 1));
  const to = new Date(Date.UTC(year + 1, 0, 1));
  return trips
    .filter((trip) => trip.status === 'COMPLETED' || trip.status === 'ACTIVE')
    .map((trip) => ({ trip, stops: stops.filter((stop) => stop.tripId === trip.id) }))
    .filter(({ trip, stops: own }) => {
      const start = trip.startDate ? new Date(trip.startDate) : null;
      const end = trip.endDate ? new Date(trip.endDate) : start;
      if (!start && !end) return own.some((stop) => inYear(stop.arriveOn, year));
      return (start ?? end) < to && (end ?? start) >= from;
    })
    .map(({ trip, stops: own }) => ({ trip, codes: own.filter((stop) => !stop.arriveOn || inYear(stop.arriveOn, year)).map((s) => s.countryCode) }));
}

/** The recap reply for `map` and `year`, as the caller (`role`) may see it. */
export function yearRecap(map, role, year) {
  const db = getDb();
  const editor = atLeast(role, 'EDITOR');
  const photos = db.photos.filter((p) => p.mapId === map.id && canSeePhoto(p, role));
  const yearPhotos = photos.filter((p) => inYear(p.shotAt ?? p.takenAt ?? p.createdAt, year));
  const visits = db.visits.filter((v) => v.mapId === map.id && v.firstVisitedOn && COUNTED.includes(v.status));
  const ownTrips = db.trips.filter((t) => t.mapId === map.id);
  const trips = tripsInYear(ownTrips, db.stops, year);
  const moments = db.moments.filter((m) => m.mapId === map.id && (editor || !m.hidden));
  const yearMoments = moments.filter((m) => inYear(m.happenedOn, year));

  const firstVisits = visits.filter((v) => inYear(v.firstVisitedOn, year)).map((v) => v.countryCode);
  const places = [
    ...new Set([
      ...yearPhotos.map((p) => p.countryCode).filter(Boolean),
      ...trips.flatMap((t) => t.codes),
      ...yearMoments.map((m) => m.countryCode).filter(Boolean),
      ...firstVisits,
    ]),
  ].sort();
  const countries = countedCountryCodes(places.filter((code) => !isSpecialPlace(code)), map.splitUk);
  const continents = new Set(places.filter((code) => !isRegion(code)).map((code) => continentByCode.get(code)).filter(Boolean));

  const stills = yearPhotos.filter((p) => (p.kind || 'PHOTO') === 'PHOTO');
  const byCountry = new Map();
  for (const photo of stills) if (photo.countryCode) byCountry.set(photo.countryCode, (byCountry.get(photo.countryCode) ?? 0) + 1);
  const top = [...byCountry].map(([countryCode, n]) => ({ countryCode, photos: n })).sort((a, b) => b.photos - a.photos || a.countryCode.localeCompare(b.countryCode));
  const shotAt = (p) => new Date(p.shotAt ?? p.takenAt ?? p.createdAt).getTime();
  const highlights = top.slice(0, HIGHLIGHTS).map(({ countryCode }) => {
    const first = stills.filter((p) => p.countryCode === countryCode).sort((a, b) => shotAt(a) - shotAt(b) || a.id.localeCompare(b.id))[0];
    return { ...photoListItem(first, role), displayUrl: photoUrls(first).display };
  });

  const stamped = new Map();
  const yearIds = new Set(yearPhotos.map((p) => p.id));
  for (const pl of db.photoLandmarks) {
    if (!pl.confirmed || !yearIds.has(pl.photoId) || stamped.has(pl.landmarkId)) continue;
    const landmark = landmarkById(pl.landmarkId);
    if (landmark) stamped.set(pl.landmarkId, { id: landmark.id, name: landmark.name, countryCode: landmark.countryCode });
  }
  const stampList = [...stamped.values()].sort((a, b) => a.name.localeCompare(b.name));

  const years = new Set([
    ...photos.map((p) => yearOf(p.shotAt ?? p.takenAt ?? p.createdAt)),
    ...visits.map((v) => yearOf(v.firstVisitedOn)),
    ...ownTrips.filter((t) => t.status !== 'PLANNED').flatMap((t) => [yearOf(t.startDate), yearOf(t.endDate)]),
    ...moments.map((m) => yearOf(m.happenedOn)),
  ]);

  return {
    year,
    places,
    countries: countries.length,
    newCountries: countedCountryCodes(firstVisits.filter((code) => !isSpecialPlace(code)), map.splitUk).sort(),
    specialPlaces: places.filter(isSpecialPlace).length,
    continents: continents.size,
    photos: stills.length,
    videos: yearPhotos.length - stills.length,
    topCountries: top.slice(0, 3),
    moments: yearMoments.length,
    trips: trips.map(({ trip }) => ({ id: trip.id, title: trip.title, status: trip.status, startDate: trip.startDate ?? null, endDate: trip.endDate ?? null })),
    years: [...years].filter(Boolean).sort((a, b) => b - a),
    stamps: { count: stampList.length, landmarks: stampList.slice(0, STAMPS_LISTED) },
    highlights,
  };
}

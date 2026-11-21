// Reading a Polarsteps download (docs/API.md "Importing from Polarsteps"; 21 Nov 2026, the
// user's wish). Polarsteps doesn't document it; this follows what open-source readers of it
// found (each trip a folder `<slug>_<id>` holding `trip.json` and `locations.json`, each step
// a folder `<slug>_<stepId>` with `photos/` and `videos/`), and doesn't rely on the details
// they disagree on: every `trip.json` anywhere is a trip, and a photo belongs to the step whose
// id ends one of the folders it's in (else to the trip). `trip.json`: `id`, `name`,
// `start_date`/`end_date` (Unix seconds; no end while a trip runs), `timezone_id`, and
// `all_steps`, each `{ id, name, display_name, description, start_time, timezone_id,
// location: { name, country_code, lat, lon } }`. The route (`locations.json`) is never read.
import { COUNTRY_BY_CODE } from '@/utils/map/countries';

const IMAGE_TYPES = Object.freeze({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' });
const VIDEO = /\.(mp4|mov|m4v|3gp|webm|avi)$/i;
const HEIC = /\.(heic|heif)$/i;
// What the map's moments take (server utils/moments.js)
const TITLE_MAX = 120;
const TEXT_MAX = 2000;

const keyPart = (text) => String(text).replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 120);
const folderOf = (path) => path.slice(0, path.lastIndexOf('/') + 1);
const number = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : null);
const cut = (text, max) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

/** "YYYY-MM-DD" of a Unix time in a time zone (UTC when the zone isn't one the browser knows). */
export function dayOf(seconds, timeZone) {
  if (!Number.isFinite(seconds)) return null;
  const date = new Date(seconds * 1000);
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timeZone || 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

function stepFrom(raw, tripZone) {
  if (!raw || raw.is_deleted || raw.id == null) return null;
  const location = raw.location && typeof raw.location === 'object' ? raw.location : {};
  const code = typeof location.country_code === 'string' ? location.country_code.toUpperCase() : '';
  const seconds = Number(raw.start_time);
  const placeName = typeof location.name === 'string' ? location.name.trim() : '';
  const title = String(raw.name || raw.display_name || placeName || '').trim();
  return {
    id: String(raw.id),
    title: cut(title || 'A step of the trip', TITLE_MAX),
    text: cut(typeof raw.description === 'string' ? raw.description.trim() : '', TEXT_MAX),
    time: Number.isFinite(seconds) ? seconds * 1000 : 0,
    date: dayOf(seconds, raw.timezone_id || tripZone),
    takenAt: Number.isFinite(seconds) ? new Date(seconds * 1000).toISOString() : null,
    // Only a place the map has (Polarsteps uses ISO codes, as the map does)
    countryCode: COUNTRY_BY_CODE[code] ? code : null,
    placeName: placeName ? cut(placeName, TITLE_MAX) : null,
    latitude: number(location.lat),
    longitude: number(location.lon),
    photos: [],
    videos: 0,
    unreadable: 0,
  };
}

/** A trip's stops: its steps in order, one after another in the same place made one stop. */
export function stopsOf(steps) {
  const stops = [];
  for (const step of steps) {
    if (!step.countryCode) continue;
    const last = stops.at(-1);
    if (last && last.countryCode === step.countryCode && last.placeName === step.placeName) {
      if (step.date && step.date !== last.arriveOn) last.leaveOn = step.date;
      continue;
    }
    stops.push({
      countryCode: step.countryCode,
      placeName: step.placeName,
      arriveOn: step.date,
      leaveOn: null,
      latitude: step.latitude,
      longitude: step.longitude,
    });
  }
  return stops;
}

const statusOf = ({ start_date: start, end_date: end }, now) => {
  if (Number.isFinite(Number(end)) && end && Number(end) * 1000 <= now.getTime()) return 'COMPLETED';
  if (Number.isFinite(Number(start)) && Number(start) * 1000 > now.getTime()) return 'PLANNED';
  return 'ACTIVE';
};

function tripFrom(json, folder, files, now) {
  if (!json || typeof json !== 'object' || json.id == null || json.is_deleted) return null;
  const tripId = String(json.id);
  const zone = typeof json.timezone_id === 'string' ? json.timezone_id : null;
  const steps = (Array.isArray(json.all_steps) ? json.all_steps : [])
    .map((raw) => stepFrom(raw, zone))
    .filter(Boolean)
    .sort((a, b) => a.time - b.time);
  const byId = new Map(steps.map((step) => [step.id, step]));
  // Photos the trip has but no step claims (an older layout): the trip's own
  const loose = { id: null, countryCode: null, placeName: null, takenAt: null, photos: [], videos: 0, unreadable: 0 };

  for (const file of files) {
    const inside = file.path.slice(folder.length);
    const parts = inside.split('/');
    const name = parts.at(-1);
    if (!name || name.startsWith('.') || /^thumbs\.db$/i.test(name) || /\.json$/i.test(name)) continue;
    const stepId = parts
      .slice(0, -1)
      .map((part) => /_(\d+)$/.exec(part)?.[1])
      .find((id) => id && byId.has(id));
    const owner = stepId ? byId.get(stepId) : loose;
    const ext = /\.([a-z0-9]+)$/i.exec(name)?.[1]?.toLowerCase() ?? '';
    if (IMAGE_TYPES[ext]) {
      owner.photos.push({ entry: file, name, type: IMAGE_TYPES[ext], key: `polarsteps:photo:${stepId ?? `trip-${keyPart(tripId)}`}/${keyPart(inside)}` });
    } else if (VIDEO.test(name)) owner.videos += 1;
    else if (HEIC.test(name)) owner.unreadable += 1;
  }
  for (const holder of [...steps, loose]) holder.photos.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  const startDate = dayOf(Number(json.start_date), zone) ?? steps[0]?.date ?? null;
  const endDate = json.end_date ? dayOf(Number(json.end_date), zone) : null;
  const all = [...steps, loose];
  return {
    id: tripId,
    key: `polarsteps:trip:${keyPart(tripId)}`,
    title: cut(String(json.name || '').trim() || 'A trip', TITLE_MAX),
    status: statusOf(json, now),
    startDate,
    endDate,
    steps,
    loose,
    stops: stopsOf(steps),
    countries: [...new Set(steps.map((step) => step.countryCode).filter(Boolean))],
    photos: all.reduce((n, holder) => n + holder.photos.length, 0),
    videos: all.reduce((n, holder) => n + holder.videos, 0),
    unreadable: all.reduce((n, holder) => n + holder.unreadable, 0),
    stories: steps.filter((step) => step.text && step.countryCode).length,
  };
}

/**
 * The trips in a download (exportFiles.js): `[{ id, key, title, status, startDate, endDate,
 * steps, loose, stops, countries, photos, videos, unreadable, stories }]`, oldest first.
 * Throws with a message people can read when there's no trip in it.
 */
export async function readPolarstepsExport(files, { now = new Date() } = {}) {
  const tripFiles = files.filter((file) => /(^|\/)trip\.json$/i.test(file.path));
  const trips = [];
  for (const entry of tripFiles) {
    let json;
    try {
      json = JSON.parse(await (await entry.read()).text());
    } catch {
      continue;
    }
    const folder = folderOf(entry.path);
    const trip = tripFrom(
      json,
      folder,
      files.filter((file) => file !== entry && file.path.startsWith(folder)),
      now,
    );
    if (trip) trips.push(trip);
  }
  if (!trips.length) {
    throw new Error('No Polarsteps trips were found in that. Choose the zip Polarsteps emailed you, or the folder you unzipped it to.');
  }
  return trips.sort((a, b) => String(a.startDate ?? '').localeCompare(String(b.startDate ?? '')));
}

/** A trip as `POST /maps/:mapId/imports/polarsteps` takes it. */
export const tripPayload = (trip) => ({
  key: trip.key,
  title: trip.title,
  status: trip.status,
  startDate: trip.startDate,
  endDate: trip.endDate,
  stops: trip.stops,
});

/** A step's story as a moment (with its photos imported this run, 20 at most). */
export const storyPayload = (step, { tripId, photoIds = [] }) => ({
  kind: 'SAW_OR_DID',
  title: step.title,
  text: step.text,
  countryCode: step.countryCode,
  happenedOn: step.date,
  placeName: step.placeName,
  tripId,
  photoIds: photoIds.slice(0, 20),
  importedFrom: `polarsteps:moment:${keyPart(step.id)}`,
});

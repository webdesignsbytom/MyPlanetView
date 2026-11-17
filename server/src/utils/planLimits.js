// The plan limits on photos and people (docs/API.md, "Map limits"). Pure: callers count,
// these decide and word the answer. A map's limits are always its owner's plan.
import { EDITORS_PER_MAP, PEOPLE_PER_TRIP, isTopPlan, planOf } from './constants/plans.js';

// ── Which copies a photo keeps ───────────────────────────────────────────────

export const PHOTO_SIZE_MESSAGES = Object.freeze({
  noOriginalOnFree: 'Economy keeps a print-quality copy, not the original.',
  printRequiredOnFree: 'Economy keeps a print-quality copy of each photo: send a PRINT copy with the other two.',
  printNotNeeded: 'This map keeps the original, so it needs no print copy.',
});

/**
 * The sizes a photo on a map with this owner's plan may send, beyond THUMB and DISPLAY
 * (always required): a plan that keeps originals takes an ORIGINAL (optional) and no
 * PRINT; Economy needs a PRINT and takes no ORIGINAL. -> null, or the 400 message
 */
export function checkPhotoSizesForPlan(sizes, planId) {
  const keepsOriginals = planOf(planId).limits.keepsOriginals;
  if (keepsOriginals) return sizes.includes('PRINT') ? PHOTO_SIZE_MESSAGES.printNotNeeded : null;
  if (sizes.includes('ORIGINAL')) return PHOTO_SIZE_MESSAGES.noOriginalOnFree;
  if (!sizes.includes('PRINT')) return PHOTO_SIZE_MESSAGES.printRequiredOnFree;
  return null;
}

/** The best copy a photo keeps: its ORIGINAL, else its PRINT copy, else null. */
export const bestCopySize = (sizes) => (sizes.includes('ORIGINAL') ? 'ORIGINAL' : sizes.includes('PRINT') ? 'PRINT' : null);

// ── Photos per country, on each map ──────────────────────────────────────────

const number = (n) => Number(n).toLocaleString('en-GB');

/**
 * "30 of 30 photos of France on this map. Upgrade to add more." (no upgrade line on the top
 * plan). With no `countryName`, the photos with no country, which count as a gallery of their
 * own (17 Nov 2026, the audit: they had no cap, so Economy's storage had none either).
 */
export const countryFullMessage = ({ count, cap, countryName, planId }) =>
  `${number(count)} of ${number(cap)} photos ${countryName ? `of ${countryName}` : 'with no country'} on this map.${
    isTopPlan(planId) ? '' : ' Upgrade to add more.'
  }`;

/**
 * Would `adding` more photos of one country go over the map's cap? `count` is the map's
 * photos there now (hidden ones too, whoever uploaded them). -> null, or the 409 message
 */
export function checkCountryCap({ count, adding = 1, planId, countryName }) {
  const cap = planOf(planId).limits.photosPerCountry;
  if (count + adding <= cap) return null;
  return countryFullMessage({ count: Math.min(count, cap), cap, countryName, planId });
}

// ── Videos (First Class; docs/API.md "Videos") ───────────────────────────────

export const VIDEO_MESSAGES = Object.freeze({
  notOnPlan: 'Videos are part of First Class. Upgrade this map’s owner to add them.',
  sizes: 'A video sends a THUMB and a DISPLAY poster frame and its file as the ORIGINAL.',
  duration: 'A video can be up to 3 minutes long.',
  landmark: 'Landmark stamps come from photos, not videos.',
  useVideoUpload: 'Videos upload through POST /maps/:mapId/videos/upload.',
});

/** Can a map with this owner's plan take videos? -> null, or the 403 message */
export const checkVideoAllowed = (planId) => (planOf(planId).limits.videos ? null : VIDEO_MESSAGES.notOnPlan);

/** A video's files: exactly THUMB, DISPLAY and ORIGINAL. -> null, or the 400 message */
export const checkVideoSizes = (sizes) =>
  sizes.length === 3 && ['THUMB', 'DISPLAY', 'ORIGINAL'].every((s) => sizes.includes(s)) ? null : VIDEO_MESSAGES.sizes;

/** "20 of 20 videos of France on this map." (videos have their own cap, apart from photos) */
export function checkVideoCap({ count, adding = 1, planId, countryName }) {
  const cap = planOf(planId).limits.videosPerCountry;
  if (count + adding <= cap) return null;
  return `${number(Math.min(count, cap))} of ${number(cap)} videos ${countryName ? `of ${countryName}` : 'with no country'} on this map.`;
}

// ── The storage safety net (paid plans) ──────────────────────────────────────

const gigabytes = (bytes) => `${Math.round(bytes / 1000 ** 3)} GB`;

/**
 * Would `addingBytes` take the map's stored photo files over the plan's safety net?
 * Economy has none (its caps per country keep it small). -> null, or the 409 message
 */
export function checkStorageCap({ storedBytes, addingBytes, planId }) {
  const cap = planOf(planId).limits.storageCapBytes;
  if (cap === null || Number(storedBytes) + Number(addingBytes) <= cap) return null;
  return `This map has used its ${gigabytes(cap)} of photo storage. Delete some photos to add more.`;
}

// ── People ───────────────────────────────────────────────────────────────────

export const PEOPLE_CAP_MESSAGES = Object.freeze({
  editors: `A map can have up to ${EDITORS_PER_MAP} editors.`,
  tripPeople: `A trip can have up to ${PEOPLE_PER_TRIP} people.`,
});

/**
 * Adding or promoting an editor on a map: `editors` counts the map's EDITOR members and
 * pending EDITOR invites, leaving out the person being added (re-adding someone who is
 * already an editor changes nothing). -> null, or the 409 message
 */
export const checkEditorCap = ({ editors }) => (editors + 1 > EDITORS_PER_MAP ? PEOPLE_CAP_MESSAGES.editors : null);

/**
 * Adding someone to a trip: `people` counts its members of any role and pending
 * invites, leaving out the person being added. -> null, or the 409 message
 */
export const checkTripPeopleCap = ({ people }) => (people + 1 > PEOPLE_PER_TRIP ? PEOPLE_CAP_MESSAGES.tripPeople : null);

// ── Locked maps ──────────────────────────────────────────────────────────────

export const LOCKED_MAP_MESSAGE =
  "This map isn't paid for, so it can't take new photos. Its owner can pay for it as an extra map, or make it their main map.";

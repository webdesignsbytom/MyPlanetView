// What a postcard is drawn from (26 Nov 2026; docs/SITE-DESIGN.md "Postcards"): the art the site
// already has. Its front (27 Nov 2026, the user's wish: "a photo that covers the postcard ... a
// cool city photo, or a wilderness photo, or a famous landmark photo") is one photo across the
// whole card: the sender's own; else the chosen landmark's photo (a city, the wilderness or a
// landmark), its full-size copy where there is one (postcardPhotos.js), its small one otherwise;
// else the place's travel poster; else its outline on the sea. Under the big letters, the
// landmark's name. The stamp on the back is a 3D model (the landmark's, else the place's), else
// the poster, else the outline. Only the postcard's own code imports this, so the models' list
// stays out of the map's first load.
import { COUNTRY_BY_CODE } from '@/utils/map/countries';
import { postersFor, posterUrl } from '@/utils/map/posterData';
import { landmarkPhotoInfo } from '@/utils/map/landmarkPhotoInfo';
import { mediaUrlFrom } from '@/utils/media/mediaUrl';
import { modelForLandmark, modelsForPlace } from '@/utils/map/celebrationModels';
import { countryOutline } from '@/utils/map/countryOutline';
import { countryOf } from '@/utils/map/ukNations';
import { COUNTRY_LANDMARKS } from '@/content/countries/landmarks.generated';
import { pastelNumberFor } from '@/utils/map/visitStatus';
import { SHARE_CARD_COLOURS } from '@/utils/constants/brandColours';
import { shownKind } from './postcardRules';
import { POSTCARD_PHOTOS } from './postcardPhotos';

// A public file the canvas reads (a poster, a landmark's photo) is asked for under its own address
// with a mark, so a copy the browser cached for an <img> without CORS is never the one it reuses
const forCanvas = (url) => (url && /^https?:\/\//i.test(url) && !/X-Amz-/i.test(url) ? `${url}${url.includes('?') ? '&' : '?'}canvas=1` : url);

/** The place's main poster (a UK nation's or a region's, else its country's), or null. */
export function placePoster(code) {
  const [poster] = postersFor(code).length ? postersFor(code) : postersFor(countryOf(code));
  if (!poster) return null;
  const [w, h] = String(poster.ratio).split('/').map(Number);
  return { url: forCanvas(posterUrl(poster.name, 'webp')), ratio: w && h ? w / h : 2 / 3 };
}

/** The place's outline as the map draws it (its country's when it has none of its own, as Goa), or null. */
export const placeOutline = (code) => countryOutline(code) ?? countryOutline(countryOf(code));

/** A model's picture to draw: its 320 px image, its shape and name. */
const modelArt = (model) => (model ? { id: model.id, name: model.name, url: model.images[320], aspect: model.aspect } : null);

/**
 * The place's most famous model (a UK nation's own, else its country's), or null: its landmark
 * first in the country's well-known landmarks, as its guide lists them (Mount Fuji for Japan,
 * where every model is drawn at the same smallest size), then the tallest, then by name.
 */
export function placeModel(code) {
  for (const place of [code, countryOf(code)]) {
    const models = modelsForPlace(place, Infinity);
    if (!models.length) continue;
    const fame = new Map((COUNTRY_LANDMARKS[countryOf(place)] || []).map((landmark, i) => [landmark.wikidataId, i]));
    const rank = (model) => fame.get(model.landmark) ?? Infinity;
    return modelArt([...models].sort((a, b) => rank(a) - rank(b) || b.size - a.size || a.name.localeCompare(b.name))[0]);
  }
  return null;
}

/** A landmark's full-size postcard photo (1200 × 800, the public bucket's postcardPhotos/), or null. */
export const postcardPhotoUrl = (slug) => (POSTCARD_PHOTOS[slug] ? forCanvas(mediaUrlFrom({ objectKey: `postcardPhotos/${slug}-1200.webp` })) : null);

/** What a landmark's photo is of: 'c' a city, 'w' the wilderness, 'l' a landmark; null with no postcard photo. */
export const postcardPhotoGroup = (slug) => POSTCARD_PHOTOS[slug] ?? null;

/**
 * The art a card is drawn from. `card` is the server's view (`kind`, `countryCode`, `landmark`,
 * `pictureUrl`); `photos` the landmark photos' credits (useLandmarkPhotos), or null before they
 * arrive. -> `{ kind, placeName, subtitle, cover: { url, isPoster } | null, poster, outline,
 * colour, stamp, stampModel, credit }`
 */
export function postcardArt(card, photos = null) {
  const code = card.countryCode;
  const kind = shownKind({ kind: card.kind, landmark: card.landmark, hasPicture: Boolean(card.pictureUrl) });
  const landmark = kind === 'PHOTO' ? null : card.landmark || null;
  const info = landmark ? landmarkPhotoInfo(photos, landmark.slug) : null;
  const big = landmark ? postcardPhotoUrl(landmark.slug) : null;
  const poster = placePoster(code);
  let cover = null;
  if (kind === 'PHOTO') cover = { url: card.pictureUrl, isPoster: false };
  else if (big) cover = { url: big, isPoster: false };
  else if (info) cover = { url: forCanvas(info.webp), isPoster: false };
  else if (poster) cover = { url: poster.url, isPoster: true };
  const stampModel = (landmark ? modelArt(modelForLandmark(landmark)) : null) ?? placeModel(code);
  return {
    kind,
    placeName: COUNTRY_BY_CODE[code]?.name ?? code,
    subtitle: landmark?.name ?? null,
    cover,
    poster,
    outline: placeOutline(code),
    // The place's pastel on the map (its country's for a nation without its own)
    colour: SHARE_CARD_COLOURS.visits[pastelNumberFor(code) - 1] ?? SHARE_CARD_COLOURS.visits[0],
    stamp: stampModel ? 'model' : poster ? 'poster' : 'outline',
    stampModel,
    // The landmark's photographer, when their photo is on the front
    credit: landmark && info && (big || cover?.url === forCanvas(info.webp)) ? `Photo: ${info.author}, ${info.licence}` : null,
  };
}

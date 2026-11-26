// What a postcard is drawn from (26 Nov 2026; docs/SITE-DESIGN.md "Postcards"): the art the site
// already has, chosen by the card's kind. The user's wish: "a template for each country, and
// another template for each landmark using the images we already have".
// - A country's card: its travel poster (else its outline on the sea), its name in big
//   lettering, and its most famous little 3D model (else its outline).
// - A landmark's: its Commons photo as a print (credited on the back) and its 3D model; either
//   alone when it has only one, else the place's poster.
// - A photo card: the sender's own photo, the whole front.
// The stamp on the back is a 3D model (the landmark's, else the place's), else the poster, else
// the outline. Only the postcard's own code imports this, so the models' list stays out of the
// map's first load.
import { COUNTRY_BY_CODE } from '@/utils/map/countries';
import { postersFor, posterUrl } from '@/utils/map/posterData';
import { landmarkPhotoInfo } from '@/utils/map/landmarkPhotoInfo';
import { modelForLandmark, modelsForPlace } from '@/utils/map/celebrationModels';
import { countryOutline } from '@/utils/map/countryOutline';
import { countryOf } from '@/utils/map/ukNations';
import { COUNTRY_LANDMARKS } from '@/content/countries/landmarks.generated';
import { pastelNumberFor } from '@/utils/map/visitStatus';
import { SHARE_CARD_COLOURS } from '@/utils/constants/brandColours';
import { shownKind } from './postcardRules';

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

/**
 * The art a card is drawn from. `card` is the server's view (`kind`, `countryCode`, `landmark`,
 * `pictureUrl`); `photos` the landmark photos' credits (useLandmarkPhotos), or null before they
 * arrive. -> `{ kind, placeName, landmarkName, poster, outline, colour, landmarkPhoto, model,
 * photoUrl, stamp, credit }`
 */
export function postcardArt(card, photos = null) {
  const code = card.countryCode;
  const kind = shownKind({ kind: card.kind, landmark: card.landmark, hasPicture: Boolean(card.pictureUrl) });
  const landmark = kind === 'LANDMARK' ? card.landmark : null;
  const info = landmark ? landmarkPhotoInfo(photos, landmark.slug) : null;
  const landmarkPhoto = info ? { url: forCanvas(info.webp), author: info.author, licence: info.licence } : null;
  const ownModel = landmark ? modelArt(modelForLandmark(landmark)) : null;
  const model = ownModel ?? placeModel(code);
  const poster = placePoster(code);
  const outline = placeOutline(code);
  return {
    kind,
    placeName: COUNTRY_BY_CODE[code]?.name ?? code,
    landmarkName: landmark?.name ?? null,
    poster,
    outline,
    // The place's pastel on the map (its country's for a nation without its own)
    colour: SHARE_CARD_COLOURS.visits[pastelNumberFor(code) - 1] ?? SHARE_CARD_COLOURS.visits[0],
    landmarkPhoto,
    // A landmark's card shows its own model; a country's the place's best known
    model: kind === 'LANDMARK' ? ownModel : model,
    photoUrl: kind === 'PHOTO' ? card.pictureUrl : null,
    stamp: model ? 'model' : poster ? 'poster' : 'outline',
    stampModel: model,
    credit: landmarkPhoto ? `Photo: ${landmarkPhoto.author}, ${landmarkPhoto.licence}` : null,
  };
}

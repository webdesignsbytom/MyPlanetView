// Importing travel offers on the admin page (docs/API.md, "Travel offers"): reading the
// chosen file, what it will do before it's sent (new keys and keys to update), and the
// server's list of problems in words a non-developer can act on.
import { OFFER_KEY_PATTERN, OFFER_KINDS, OFFER_LIMITS, OFFER_PLACEMENTS, offersIn } from './offerRules';
import { offerUrlProblem } from './offerForm';

// The server reads JSON bodies up to 2,000 KB; 500 offers take a few hundred
export const OFFER_FILE_MAX_BYTES = 2000 * 1024;

const readText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error || new Error('The file couldn’t be read.'));
    reader.readAsText(file);
  });

/**
 * A chosen file -> `{ ok: true, payload, offers }` (the parsed file and its list), or
 * `{ ok: false, error }` with a sentence saying what's wrong with it.
 */
export async function readOfferFile(file) {
  const name = file?.name || 'That file';
  if (!file) return { ok: false, error: 'Choose a file first.' };
  if (file.size > OFFER_FILE_MAX_BYTES) {
    return { ok: false, error: `${name} is too big to import: a file can be up to 2 MB (500 offers fit easily).` };
  }
  let text;
  try {
    text = await readText(file);
  } catch {
    return { ok: false, error: `${name} couldn’t be read. Choose it again.` };
  }
  let payload;
  try {
    // A byte-order mark (some Windows editors add one) isn't JSON
    payload = JSON.parse(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text);
  } catch (err) {
    return {
      ok: false,
      error: `${name} isn’t a JSON file we can read. Check for a missing comma, quote or bracket (the browser says: ${err.message}).`,
    };
  }
  const offers = offersIn(payload);
  if (!offers) return { ok: false, error: `${name} doesn’t hold a list of offers: it should look like { "offers": [ … ] }.` };
  if (!offers.length || offers.length > OFFER_LIMITS.perImport) {
    return {
      ok: false,
      error: `An import holds 1 to ${OFFER_LIMITS.perImport} offers; ${name} has ${offers.length.toLocaleString('en-GB')}.`,
    };
  }
  return { ok: true, payload: Array.isArray(payload) ? { offers } : payload, offers };
}

/** What importing a list will do: the keys it makes and the keys it updates (by key). */
export function importPlan(offers, existingKeys) {
  const known = new Set(existingKeys);
  const newKeys = [];
  const updateKeys = [];
  offers.forEach((offer) => {
    const key = typeof offer?.key === 'string' ? offer.key : '';
    (known.has(key) ? updateKeys : newKeys).push(key);
  });
  return { total: offers.length, newKeys, updateKeys };
}

const quoted = (value) => (typeof value === 'string' ? `"${value}"` : JSON.stringify(value));

// What's wrong with one field of an offer in the file, as the end of a sentence
function fieldWords(field, offer, offers, index) {
  const value = offer && typeof offer === 'object' ? offer[field] : undefined;
  switch (field) {
    case 'offer':
      return 'it isn’t an offer: each one is written { "key": …, "partner": …, … } inside the list';
    case 'key': {
      if (typeof value !== 'string' || !value) return 'the key is missing';
      const earlier = offers.slice(0, index).findIndex((o) => o?.key === value);
      if (OFFER_KEY_PATTERN.test(value) && earlier >= 0) return `the key is already used by offer ${earlier + 1} in this file`;
      return 'the key must be 2 to 64 lower-case letters, digits and dashes, starting with a letter or digit';
    }
    case 'partner':
      return typeof value === 'string' || value == null ? 'the partner’s name is missing' : 'the partner’s name must be text';
    case 'title':
      return typeof value === 'string' || value == null ? 'the title (the card’s line) is missing' : 'the title must be text';
    case 'blurb':
      return 'the blurb must be text, or null for none';
    case 'kind':
      return `the kind must be one of ${OFFER_KINDS.join(', ')}`;
    case 'placements': {
      const list = OFFER_PLACEMENTS.join(', ');
      const unknown = Array.isArray(value) ? value.find((p) => !OFFER_PLACEMENTS.includes(p)) : undefined;
      if (unknown !== undefined) return `${quoted(unknown)} isn’t a place offers show (use ${list})`;
      return `it must show somewhere: give "placements" one or more of ${list}`;
    }
    case 'url':
      return offerUrlProblem(value) || 'the link isn’t one we can use';
    case 'countryCode':
      return `${quoted(value)} isn’t a country code we know: use two capital letters, such as "JP", or null for an offer for anywhere`;
    case 'imageKey':
      return 'the picture must be a file in the public bucket, such as "visitCountryPosters/jp-800.avif" (letters, digits and / _ . - only, ending .avif, .webp, .jpg, .jpeg or .png), or null for none';
    case 'weight':
      return `the weight must be a whole number from ${OFFER_LIMITS.weight.min} to ${OFFER_LIMITS.weight.max}`;
    case 'active':
      return '"active" must be true or false';
    case 'startsAt':
      return 'the start must be a date and time, such as "2027-06-01T00:00:00Z", or null';
    case 'endsAt':
      return typeof value === 'string' && !Number.isNaN(new Date(value).getTime())
        ? 'the end is before the start'
        : 'the end must be a date and time, such as "2027-08-31T23:59:59Z", or null';
    default:
      return `"${field}" isn’t right`;
  }
}

/**
 * The server's problems ([{ index, key, field }]) as list items: "Offer 3
 * (example-stays-jp): the link must start with https://". `offers` is the list that was
 * sent, to say exactly what's wrong.
 */
export function problemSentences(problems, offers = []) {
  return problems.map(({ index, key, field }) => {
    if (index === null || index === undefined) {
      return `The file must hold a list of 1 to ${OFFER_LIMITS.perImport} offers, written { "offers": [ … ] }`;
    }
    const label = `Offer ${index + 1}${key ? ` (${key})` : ''}`;
    return `${label}: ${fieldWords(field, offers[index], offers, index)}`;
  });
}

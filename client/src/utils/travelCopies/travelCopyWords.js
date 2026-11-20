// Taking your travels with you (docs/API.md, "Travel copies"): the words for requests.
import { countryName } from '@/utils/map/countries';

const counted = (n, one, many = `${one}s`) => `${Number(n || 0).toLocaleString('en-GB')} ${n === 1 ? one : many}`;

/** "140 photos, 2 trips and 3 moments" (what's left out when there's none of it). */
export function copyContents({ photos = 0, trips = 0, moments = 0 }) {
  const parts = [
    photos ? counted(photos, 'photo') : null,
    trips ? counted(trips, 'trip') : null,
    moments ? counted(moments, 'moment') : null,
  ].filter(Boolean);
  if (parts.length < 2) return parts[0] ?? 'nothing';
  return `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`;
}

/** A place in a choice: a country's name, or the photos with none. */
export const copyPlaceName = (code) => (code ? countryName(code) : 'Photos with no country');

/**
 * Where a request stands, for the person who asked (`mine`) or the map's owner:
 * "Waiting for an answer", "Copying: 60 of 140 photos", "Copied 140 photos (12 didn't fit)",
 * "Declined".
 */
export function copyStatusText(request) {
  const { status, progress, photos } = request;
  if (status === 'PENDING') return request.mine ? 'Waiting for an answer' : 'Waiting for you to approve or decline';
  if (status === 'APPROVED') return photos ? `Copying: ${progress.done} of ${counted(photos, 'photo')}` : 'Copying…';
  if (status === 'DECLINED') return 'Declined';
  const skipped = progress.skipped ? ` (${counted(progress.skipped, 'photo')} didn’t fit)` : '';
  return `Copied${progress.copied ? ` ${counted(progress.copied, 'photo')}` : ''}${skipped}`;
}

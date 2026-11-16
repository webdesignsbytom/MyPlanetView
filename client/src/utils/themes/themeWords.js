// Monthly photo themes' words (docs/API.md, "Photo themes"): a theme's month ("November
// 2026"), when it ends, and photo counts. Pure. A theme runs for its calendar month in UTC.

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "2026-11" -> "November 2026" */
export function monthLabel(month) {
  const [year, m] = String(month).split('-').map(Number);
  return MONTHS[m - 1] ? `${MONTHS[m - 1]} ${year}` : String(month);
}

/** "2026-11" -> "November's theme" (a theme named by its month) */
export function monthThemeLabel(month) {
  const name = MONTHS[Number(String(month).split('-')[1]) - 1];
  return name ? `${name}’s theme` : 'A monthly theme';
}

/** A theme's last day, from its `endsAt` (the first moment of the next month, UTC): "30 November" */
export function lastDayLabel(endsAt) {
  const last = new Date(Date.parse(endsAt) - 1);
  return Number.isNaN(last.getTime()) ? '' : `${last.getUTCDate()} ${MONTHS[last.getUTCMonth()]}`;
}

/** "1 photo", "3 photos", "No photos" */
export const photoCount = (n) => (n ? `${n.toLocaleString('en-GB')} ${n === 1 ? 'photo' : 'photos'}` : 'No photos');

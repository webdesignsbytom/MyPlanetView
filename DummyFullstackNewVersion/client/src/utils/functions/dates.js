// Dates as people read them ("14 Nov 2026"), and the YYYY-MM-DD a date input needs.
// Date-only values from the API ('2026-11-14') are read as that calendar day, in UTC.

export function formatDay(value) {
  if (!value) return '';
  const date = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export function formatDayRange(start, end) {
  if (start && end) return start === end ? formatDay(start) : `${formatDay(start)} – ${formatDay(end)}`;
  return formatDay(start || end);
}

// '2026-11-14T09:30:00.000Z' or '2026-11-14' -> '2026-11-14'
export const toDateInput = (value) => (value ? String(value).slice(0, 10) : '');

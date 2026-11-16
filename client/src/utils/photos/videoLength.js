// A video's length (whole seconds, as the API gives `durationS`), for the eye and for
// the ear: "1:30" on its tile, "1 minute 30 seconds" to a screen reader.

const whole = (seconds) => Math.max(0, Math.round(Number(seconds) || 0));

/** "0:42", "1:30", "3:00" */
export function formatVideoLength(seconds) {
  const s = whole(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** "42 seconds", "1 minute 30 seconds", "3 minutes" */
export function spokenVideoLength(seconds) {
  const s = whole(seconds);
  const minutes = Math.floor(s / 60);
  const rest = s % 60;
  const parts = [];
  if (minutes) parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
  if (rest || !minutes) parts.push(`${rest} ${rest === 1 ? 'second' : 'seconds'}`);
  return parts.join(' ');
}

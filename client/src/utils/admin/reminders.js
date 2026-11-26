// Mock mode's copy of the server's yearly reminders (server/src/utils/reminders.js), for the
// admin overview the mock answers (dev/mock/adminOverview.js); a test compares the two.
import { MAGNETIC_POLES_YEAR } from '@/utils/map/specialPlaces';

/**
 * The reminders due at `now`, each `{ key, title, text }`: the magnetic poles' pins, from the
 * January after the year they're for.
 */
export function dueReminders(now = new Date(), { polesYear = MAGNETIC_POLES_YEAR } = {}) {
  const year = now.getUTCFullYear();
  const due = [];
  if (year > polesYear) {
    due.push({
      key: 'magneticPoles',
      title: 'Move the magnetic poles',
      text:
        `The Magnetic North and South Poles drift 40 to 50 km a year, and their pins are still at ${polesYear}'s positions. ` +
        `Move them to ${year}'s (NOAA's World Magnetic Model gives them) in both country lists, set MAGNETIC_POLES_YEAR to ${year}, ` +
        'and run npm run db:reference on the live database.',
    });
  }
  return due;
}

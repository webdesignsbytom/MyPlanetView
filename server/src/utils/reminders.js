// The site's chores that come round with the calendar and nothing else would remind anyone of
// (26 Nov 2026, the user's wish: "can we notify the admins somehow?"): shown on the admin
// overview while due (utils/adminViews.js), and emailed to the admins once a year by the nightly
// job (services/system/reminders.js). Pure, so tested on its own (tests/reminders.test.js); the
// mock's copy is client/src/utils/admin/reminders.js, compared by a test.
import { MAGNETIC_POLES_YEAR } from './specialPlaces.js';

// Each reminder's audit-log action once emailed (one a year)
export const reminderAction = (key) => `reminder:${key}`;

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

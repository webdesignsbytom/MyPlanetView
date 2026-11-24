// Landmarks are seeded reference data that only change with a deploy (npm run db:reference),
// so where each one counts is read once per instance, as the country tables are
// (helpers/countries.js).
import { findLandmarkPlaces } from '../../domain/places.js';
import { UK, landmarkPlace } from '../../utils/ukNations.js';

let totalsPromise = null;

const countBy = (rows, splitUk) => {
  const totals = new Map();
  for (const row of rows) {
    const place = landmarkPlace(row, splitUk);
    totals.set(place, (totals.get(place) || 0) + 1);
  }
  return totals;
};

const loadTotals = () => {
  totalsPromise ??= findLandmarkPlaces()
    .then((rows) => {
      const whole = countBy(rows, false);
      const split = countBy(rows, true);
      // A map that splits the UK still lists a UK collection awarded before the split: the
      // whole UK's, as it was earned
      if (whole.has(UK)) split.set(UK, whole.get(UK));
      return { whole, split };
    })
    .catch((err) => {
      totalsPromise = null; // try again next time
      throw err;
    });
  return totalsPromise;
};

/**
 * How many landmarks each place has, a Map of place -> count (the country collections:
 * utils/badges.js). `splitUk`: the UK's are counted in their nations.
 */
export const landmarkTotals = async (splitUk) => {
  const { whole, split } = await loadTotals();
  return splitUk ? split : whole;
};

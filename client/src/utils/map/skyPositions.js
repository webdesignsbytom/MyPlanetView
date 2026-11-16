// Where the sun and the moon are overhead right now: the points on the Earth with each
// straight above (16 Nov 2026; the old rule only slid them across the screen by the hour).
// The map draws them there (components/map/SkyBodies.jsx), so they move with it.
//
// Low-precision formulas from the Astronomical Almanac (the sun to about 0.01°, the moon
// to about a degree, without parallax), far finer than the map can show:
// - the sun's ecliptic longitude from its mean longitude and anomaly;
// - the moon's ecliptic longitude and latitude from their six largest terms;
// - both turned into right ascension and declination with the obliquity of the ecliptic;
// - the longitude beneath each is its right ascension less Greenwich sidereal time, and the
//   latitude its declination.

const RAD = Math.PI / 180;
const sin = (deg) => Math.sin(deg * RAD);
const cos = (deg) => Math.cos(deg * RAD);
const DAY_MS = 86_400_000;
const J2000_MS = Date.UTC(2000, 0, 1, 12);

/** An angle in degrees as a longitude, -180 to 180. */
const asLongitude = (deg) => ((((deg + 180) % 360) + 360) % 360) - 180;

/** Ecliptic (longitude, latitude) to the point beneath, at day `d` since J2000. */
function pointBeneath(lambda, beta, d) {
  const obliquity = 23.439 - 0.0000004 * d;
  const declination = Math.asin(sin(beta) * cos(obliquity) + cos(beta) * sin(obliquity) * sin(lambda)) / RAD;
  const rightAscension = Math.atan2(sin(lambda) * cos(obliquity) - Math.tan(beta * RAD) * sin(obliquity), cos(lambda)) / RAD;
  const siderealTime = 280.46061837 + 360.98564736629 * d;
  return { latitude: declination, longitude: asLongitude(rightAscension - siderealTime) };
}

/** The sun's ecliptic longitude (degrees) at day `d` since J2000. */
export function sunLongitude(d) {
  const meanAnomaly = 357.529 + 0.98560028 * d;
  const meanLongitude = 280.459 + 0.98564736 * d;
  return meanLongitude + 1.915 * sin(meanAnomaly) + 0.02 * sin(2 * meanAnomaly);
}

/** The moon's ecliptic longitude and latitude (degrees) at day `d` since J2000. */
export function moonEcliptic(d) {
  const T = d / 36525;
  const longitude =
    218.32 +
    481267.881 * T +
    6.29 * sin(135.0 + 477198.87 * T) -
    1.27 * sin(259.3 - 413335.36 * T) +
    0.66 * sin(235.7 + 890534.22 * T) +
    0.21 * sin(269.9 + 954397.74 * T) -
    0.19 * sin(357.5 + 35999.05 * T) -
    0.11 * sin(186.5 + 966404.03 * T);
  const latitude =
    5.13 * sin(93.3 + 483202.02 * T) + 0.28 * sin(228.2 + 960400.89 * T) - 0.28 * sin(318.3 + 6003.15 * T) - 0.17 * sin(217.6 - 407332.21 * T);
  return { longitude, latitude };
}

/**
 * The points beneath the sun and the moon at `date`:
 * `{ sun: { latitude, longitude }, moon: { latitude, longitude } }`, in degrees.
 */
export function sunAndMoonAt(date) {
  const d = (date.getTime() - J2000_MS) / DAY_MS;
  const moon = moonEcliptic(d);
  return { sun: pointBeneath(sunLongitude(d), 0, d), moon: pointBeneath(moon.longitude, moon.latitude, d) };
}

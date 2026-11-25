// The icon on each badge's sticker (BadgeSticker) and on its share card (cardOptions.js
// badgeCardOptions): a continent's globe, a snowflake for Antarctica, a temple for World
// Heritage, a paw for wildlife, else its group's.
import {
  FaBinoculars,
  FaCalendarAlt,
  FaCamera,
  FaCompass,
  FaGlobe,
  FaGlobeAfrica,
  FaGlobeAmericas,
  FaGlobeAsia,
  FaGlobeEurope,
  FaLandmark,
  FaMapSigns,
  FaPaw,
  FaSnowflake,
  FaUniversity,
} from 'react-icons/fa';

const CONTINENT_ICONS = {
  'continent-africa': FaGlobeAfrica,
  'continent-asia': FaGlobeAsia,
  'continent-europe': FaGlobeEurope,
  'continent-north-america': FaGlobeAmericas,
  'continent-south-america': FaGlobeAmericas,
  'continent-oceania': FaGlobeAsia,
};

const GROUP_ICONS = {
  countries: FaGlobe,
  continents: FaGlobe,
  special: FaCompass,
  regions: FaMapSigns,
  landmarks: FaLandmark,
  oneShots: FaBinoculars,
  photos: FaCamera,
  themes: FaCalendarAlt,
};

/** The icon component for a badge (`{ key, group }`; a key alone falls back to the globe). */
export function badgeIcon({ key, group }) {
  if (CONTINENT_ICONS[key]) return CONTINENT_ICONS[key];
  if (key === 'antarctica') return FaSnowflake;
  if (String(key).startsWith('unesco-')) return FaUniversity;
  if (key === 'big-five' || String(key).startsWith('oneshots-wildlife-')) return FaPaw;
  return GROUP_ICONS[group] || FaGlobe;
}

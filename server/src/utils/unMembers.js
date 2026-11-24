// The UN's 193 member states, the plainest count of countries, the one "I've been to 60
// countries" usually means (docs/API.md "Stats", "Collector's counts"; 24 Nov 2026, the user's
// wish): our map has 226 places, territories among them, so its own count runs higher. Pure, so
// it's unit-tested; the client keeps a copy (utils/map/unMembers.js), compared by a test.
import { REGION_PARENT } from './regionPlaces.js';

// ISO 3166-1 alpha-2, every one a place on our map
export const UN_MEMBER_CODES = Object.freeze([
  'AF', 'AL', 'DZ', 'AD', 'AO', 'AG', 'AR', 'AM', 'AU', 'AT', 'AZ', 'BS', 'BH', 'BD', 'BB', 'BY', 'BE', 'BZ', 'BJ', 'BT',
  'BO', 'BA', 'BW', 'BR', 'BN', 'BG', 'BF', 'BI', 'CV', 'KH', 'CM', 'CA', 'CF', 'TD', 'CL', 'CN', 'CO', 'KM', 'CG', 'CR',
  'CI', 'HR', 'CU', 'CY', 'CZ', 'KP', 'CD', 'DK', 'DJ', 'DM', 'DO', 'EC', 'EG', 'SV', 'GQ', 'ER', 'EE', 'SZ', 'ET', 'FJ',
  'FI', 'FR', 'GA', 'GM', 'GE', 'DE', 'GH', 'GR', 'GD', 'GT', 'GN', 'GW', 'GY', 'HT', 'HN', 'HU', 'IS', 'IN', 'ID', 'IR',
  'IQ', 'IE', 'IL', 'IT', 'JM', 'JP', 'JO', 'KZ', 'KE', 'KI', 'KW', 'KG', 'LA', 'LV', 'LB', 'LS', 'LR', 'LY', 'LI', 'LT',
  'LU', 'MG', 'MW', 'MY', 'MV', 'ML', 'MT', 'MH', 'MR', 'MU', 'MX', 'FM', 'MD', 'MC', 'MN', 'ME', 'MA', 'MZ', 'MM', 'NA',
  'NR', 'NP', 'NL', 'NZ', 'NI', 'NE', 'NG', 'MK', 'NO', 'OM', 'PK', 'PW', 'PA', 'PG', 'PY', 'PE', 'PH', 'PL', 'PT', 'QA',
  'KR', 'RO', 'RU', 'RW', 'KN', 'LC', 'VC', 'WS', 'SM', 'ST', 'SA', 'SN', 'RS', 'SC', 'SL', 'SG', 'SK', 'SI', 'SB', 'SO',
  'ZA', 'SS', 'ES', 'LK', 'SD', 'SR', 'SE', 'CH', 'SY', 'TJ', 'TZ', 'TH', 'TL', 'TG', 'TO', 'TT', 'TN', 'TR', 'TM', 'TV',
  'UG', 'UA', 'AE', 'GB', 'US', 'UY', 'UZ', 'VU', 'VE', 'VN', 'YE', 'ZM', 'ZW',
]);
export const UN_MEMBER_TOTAL = UN_MEMBER_CODES.length;
const MEMBERS = new Set(UN_MEMBER_CODES);

// Our places that are part of a member state itself, so a visit counts for it: the UK's
// nations; the regions (Hawaii, Bali: utils/regionPlaces.js); and places with their own spot on
// our map that are in law part of the country, not a dependency: the Canaries (Spain), France's
// overseas departments and the Caribbean Netherlands. Territories (Greenland, Puerto Rico,
// Gibraltar), places outside the UN (Taiwan, Kosovo, Palestine, the Vatican, Western Sahara),
// Antarctica and the poles count for none.
export const UN_PART_OF = Object.freeze({
  XE: 'GB',
  XC: 'GB',
  XW: 'GB',
  XI: 'GB',
  ...REGION_PARENT,
  IC: 'ES',
  GF: 'FR',
  GP: 'FR',
  MQ: 'FR',
  RE: 'FR',
  YT: 'FR',
  BQ: 'NL',
});

/** The member state a place on our map counts for, or null. */
export const unMemberOf = (code) => {
  const member = UN_PART_OF[code] ?? code;
  return MEMBERS.has(member) ? member : null;
};

/** The member states these places (the map's visited and lived-in ones) count for, once each, A–Z by code. */
export const unMembersVisited = (codes) => [...new Set(codes.map(unMemberOf).filter(Boolean))].sort();

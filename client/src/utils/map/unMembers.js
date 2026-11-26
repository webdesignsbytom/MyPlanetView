// The UN's 193 member states (24 Nov 2026, the user's wish: a collector's count in the statistics,
// beside the map's own; the map itself never changes). A copy of the server's
// utils/unMembers.js, compared by a test: the server counts them (stats.unCountries), and the
// statistics panel lists the ones still to go.
import { REGION_PARENT } from './regionPlaces.js';
import { countsAsVisited } from './visitStatus.js';
import { countryName } from './countries.js';

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

// Our places that are part of a member state itself: the UK's nations, the regions, the
// Canaries, France's overseas departments and the Caribbean Netherlands. Territories, places
// outside the UN, Antarctica and the poles count for none.
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

/** The member states these places count for, once each, A–Z by code. */
export const unMembersVisited = (codes) => [...new Set(codes.map(unMemberOf).filter(Boolean))].sort();

/**
 * The statistics panel's count: from the map's visits (visited or lived in), the members been
 * to and the ones still to go, by name A–Z. -> `{ visited: string[], toGo: [{ code, name }], total }`
 */
export function unCountsFrom(visits = []) {
  const visited = unMembersVisited(visits.filter((v) => countsAsVisited(v.status)).map((v) => v.countryCode));
  const been = new Set(visited);
  const toGo = UN_MEMBER_CODES.filter((code) => !been.has(code))
    .map((code) => ({ code, name: countryName(code) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'en-GB'));
  return { visited, toGo, total: UN_MEMBER_TOTAL };
}

// Regions for the region badges and goals (docs/FEATURE-PLAN.md, "Travel challenges"):
// fixed lists of the map's own country codes (seed/data/countries.js; tests/regions.test.js
// checks every code is there). Each uses one common definition, named in its comment, so
// "every country in the Balkans" can't mean different things. The client copies this file
// (client/src/utils/constants/regions.js): change both together.

export const REGIONS = Object.freeze({
  // Denmark, Norway, Sweden (the Nordic countries are the wider set)
  scandinavia: { name: 'Scandinavia', codes: ['DK', 'NO', 'SE'] },
  nordic: { name: 'The Nordic countries', codes: ['DK', 'FI', 'IS', 'NO', 'SE'] },
  'baltic-states': { name: 'The Baltic states', codes: ['EE', 'LT', 'LV'] },
  'british-isles': { name: 'The British Isles', codes: ['GB', 'IE'] },
  benelux: { name: 'Benelux', codes: ['BE', 'LU', 'NL'] },
  iberia: { name: 'The Iberian Peninsula', codes: ['AD', 'ES', 'GI', 'PT'] },
  alps: { name: 'The Alpine countries', codes: ['AT', 'CH', 'DE', 'FR', 'IT', 'LI', 'MC', 'SI'] },
  // The EU's "Western Balkans"
  'western-balkans': { name: 'The Western Balkans', codes: ['AL', 'BA', 'ME', 'MK', 'RS', 'XK'] },
  caucasus: { name: 'The Caucasus', codes: ['AM', 'AZ', 'GE'] },
  'central-asia': { name: 'Central Asia', codes: ['KG', 'KZ', 'TJ', 'TM', 'UZ'] },
  'gulf-states': { name: 'The Gulf states', codes: ['AE', 'BH', 'KW', 'OM', 'QA', 'SA'] },
  maghreb: { name: 'The Maghreb', codes: ['DZ', 'LY', 'MA', 'MR', 'TN'] },
  // ASEAN's members plus Timor-Leste
  'southeast-asia': { name: 'Southeast Asia', codes: ['BN', 'ID', 'KH', 'LA', 'MM', 'MY', 'PH', 'SG', 'TH', 'TL', 'VN'] },
  'central-america': { name: 'Central America', codes: ['BZ', 'CR', 'GT', 'HN', 'NI', 'PA', 'SV'] },
  // The 13 independent Caribbean island states
  caribbean: {
    name: 'The Caribbean islands',
    codes: ['AG', 'BB', 'BS', 'CU', 'DM', 'DO', 'GD', 'HT', 'JM', 'KN', 'LC', 'TT', 'VC'],
  },
});

export const REGION_KEYS = Object.freeze(Object.keys(REGIONS));

// The six continents people live on (Antarctica has its own badge)
export const INHABITED_CONTINENTS = Object.freeze(['AFRICA', 'ASIA', 'EUROPE', 'NORTH_AMERICA', 'OCEANIA', 'SOUTH_AMERICA']);

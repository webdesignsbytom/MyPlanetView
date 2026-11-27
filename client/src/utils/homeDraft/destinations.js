// The new home page draft's destinations (dev only, /dev/home; the user's design in the repo's
// main-home/ folder): the places the turning globe shows on its cards. Each is a country by its
// ISO 3166 numeric code (world-atlas's ids), a place there, a line about it, its [longitude,
// latitude] and its photo; three have a smaller copy for their card. The photos' credits are
// in src/assets/homeDraft/CREDITS.txt.
import photo036 from '@/assets/homeDraft/036.jpg';
import photo076 from '@/assets/homeDraft/076.jpg';
import photo152 from '@/assets/homeDraft/152.jpg';
import photo242 from '@/assets/homeDraft/242.jpg';
import photo250 from '@/assets/homeDraft/250.jpg';
import photo356 from '@/assets/homeDraft/356.jpg';
import photo360 from '@/assets/homeDraft/360.jpg';
import photo392 from '@/assets/homeDraft/392.jpg';
import photo410 from '@/assets/homeDraft/410.jpg';
import photo484 from '@/assets/homeDraft/484.jpg';
import photo504 from '@/assets/homeDraft/504.jpg';
import photo512 from '@/assets/homeDraft/512.jpg';
import photo554 from '@/assets/homeDraft/554.jpg';
import photo604 from '@/assets/homeDraft/604.jpg';
import photo740 from '@/assets/homeDraft/740.jpg';
import photo764 from '@/assets/homeDraft/764.jpg';
import photo804 from '@/assets/homeDraft/804.jpg';
import photo818 from '@/assets/homeDraft/818.jpg';
import photo840 from '@/assets/homeDraft/840.jpg';
import photo882 from '@/assets/homeDraft/882.jpg';
import card036 from '@/assets/homeDraft/036-card.webp';
import card392 from '@/assets/homeDraft/392-card.webp';
import card764 from '@/assets/homeDraft/764-card.webp';

const PHOTOS = {
  '036': photo036,
  '076': photo076,
  '152': photo152,
  '242': photo242,
  '250': photo250,
  '356': photo356,
  '360': photo360,
  '392': photo392,
  '410': photo410,
  '484': photo484,
  '504': photo504,
  '512': photo512,
  '554': photo554,
  '604': photo604,
  '740': photo740,
  '764': photo764,
  '804': photo804,
  '818': photo818,
  '840': photo840,
  '882': photo882,
};

const CARD_PHOTOS = { '036': card036, '392': card392, '764': card764 };

const PLACES = [
  ['250', 'France', 'Mont Saint-Michel', 'A tidal island crowned by a medieval abbey.', -1.51, 48.64],
  ['804', 'Ukraine', 'Carpathian Mountains', 'Forested ridges in western Ukraine.', 24.5, 48.35],
  ['818', 'Egypt', 'Giza Plateau', 'Ancient pyramids on the edge of the desert.', 31.13, 29.98],
  ['512', 'Oman', 'Al Alam Palace', 'A royal palace on Muscat’s waterfront.', 58.59, 23.62],
  ['356', 'India', 'Hawa Mahal', 'Jaipur’s pink sandstone Palace of Winds.', 75.83, 26.92],
  ['764', 'Thailand', 'Railay Beach', 'Limestone cliffs rise above the Andaman Sea.', 98.84, 8.01],
  ['360', 'Indonesia', 'Mount Bromo', 'A volcanic cone in a vast sea of sand.', 112.95, -7.94],
  ['410', 'South Korea', 'Seongsan Ilchulbong', 'A volcanic crater on Jeju’s eastern coast.', 126.94, 33.46],
  ['392', 'Japan', 'Mount Fuji', 'A solitary volcanic peak above Honshu.', 138.73, 35.36],
  ['036', 'Australia', 'Uluru', 'A sandstone monolith in the Red Centre.', 131.04, -25.34],
  ['554', 'New Zealand', 'Aoraki / Mount Cook', 'The highest summit in the Southern Alps of New Zealand.', 170.14, -43.6],
  ['242', 'Fiji', 'Mamanuca Islands', 'Coral reefs fringe this Pacific island chain.', 177.1, -17.65],
  ['882', 'Samoa', 'Apia', 'Samoa’s capital sits on the north coast of Upolu.', -171.75, -13.83],
  ['840', 'United States', 'Haleakalā', 'A volcanic summit above the clouds on Maui.', -156.25, 20.71],
  ['484', 'Mexico', 'Chichén Itzá', 'A Maya city in the Yucatán Peninsula.', -88.57, 20.68],
  ['604', 'Peru', 'Machu Picchu', 'An Inca citadel high in the Andes.', -72.55, -13.16],
  ['152', 'Chile', 'Cuernos del Paine', 'Granite peaks in Chilean Patagonia.', -73.01, -50.99],
  ['740', 'Suriname', 'Rainforest canopy', 'Tropical forest covers much of the interior.', -56.5, 4.1],
  ['076', 'Brazil', 'Iguaçu Falls', 'Waterfalls thunder along the Argentine border.', -54.44, -25.69],
  ['504', 'Morocco', 'Aït Benhaddou', 'An earthen settlement on a former caravan route.', -7.13, 31.05],
];

export const HOME_DRAFT_PLACES = PLACES.map(([id, country, site, detail, lon, lat]) => ({
  id,
  country,
  site,
  detail,
  point: [lon, lat],
  image: PHOTOS[id],
  cardImage: CARD_PHOTOS[id] ?? null,
}));

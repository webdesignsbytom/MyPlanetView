import fs from 'node:fs';
import { test, expect, openMap, openTool, expectStats } from './fixtures.js';
import { COUNTRIES } from '../../src/utils/map/countries.js';

// Every landmark model's model.json (images/src/models/<id>/), as the export reads them: the maps
// each is on (`maps`), and whether a more famous one's picture keeps it off them (`onMap: false`;
// 23 Nov 2026, the user's decision)
const MODELS_DIR = new URL('../../../images/src/models/', import.meta.url);
const MODEL_INFO = fs
  .readdirSync(MODELS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && fs.existsSync(new URL(`${entry.name}/model.json`, MODELS_DIR)))
  .map((entry) => ({ id: entry.name, ...JSON.parse(fs.readFileSync(new URL(`${entry.name}/model.json`, MODELS_DIR), 'utf8')) }));
const CODE_BY_NAME = new Map(COUNTRIES.map((place) => [place.name, place.code]));

// A country opened on its own (docs/API.md "Country maps"; 18 Nov 2026, the user's wish): its
// states coloured as the map stands with them, and its pins, each with a visit for every time.
// The seeded map (src/dev/mock/seed.js) has New York and Massachusetts visited, and a pin in
// Paris with two visits; it counts 8 countries on 2 continents.

async function openCountryMap(page, name) {
  const list = await openTool(page, 'Country list', 'Countries');
  await list.getByRole('button', { name, exact: true }).click();
  const ticket = page.getByRole('dialog', { name });
  await ticket.getByRole('button', { name: `Open ${name} on its own map` }).click();
  const map = page.locator('[data-country-map]');
  await expect(map.getByRole('heading', { name })).toBeVisible();
  await expect(map.locator('[data-state]').first()).toBeVisible({ timeout: 15000 });
  return map;
}

/** Press the middle of a state (a compact one, so its middle is inside it). */
async function pressState(page, code) {
  const box = await page.locator(`[data-state="${code}"] path`).first().boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

test('a country opens on its own, with its states and a pin’s visits kept apart', async ({ page }) => {
  await openMap(page);
  const map = await openCountryMap(page, 'France');
  await expect(map.getByText('0 of 103 departments visited')).toBeVisible();
  // The pin in Paris: two visits, newest first, each with its own photos
  await map.locator('[data-pin]').first().click();
  const pin = page.getByRole('dialog', { name: 'Paris' });
  await expect(pin.getByText('France · 2 visits')).toBeVisible();
  const visits = pin.locator('[data-pin-visit]');
  await expect(visits).toHaveCount(2);
  await expect(visits.nth(0).getByRole('heading')).toHaveText('May 2025');
  await expect(visits.nth(1).getByRole('heading')).toHaveText('April 2019');
  await expect(visits.nth(0).getByRole('button', { name: /^Photo 1 of 1 from May 2025$/ })).toBeVisible();
  // Back to the world
  await pin.getByRole('button', { name: 'Close Paris' }).click();
  await map.getByRole('button', { name: 'World map' }).click();
  await expect(page.locator('[data-country-map]')).toHaveCount(0);
  await expect(page.locator('[data-code="FR"]')).toBeVisible();
  // The world map is a new <svg>: focus is on it, and its wheel still zooms (19 Nov 2026,
  // the audit: the listener had stayed on the old one)
  const world = page.locator('#main-content svg[role="application"]');
  await expect(world).toBeFocused();
  const before = await world.getAttribute('viewBox');
  const box = await world.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, -400);
  await expect.poll(() => world.getAttribute('viewBox')).not.toBe(before);
});

// The little 3D landmark models (22 Nov 2026, the user's wish): on the country maps only, each
// standing on its real spot, as Big Ben does on Westminster and the Eiffel Tower on Paris

/**
 * The model is drawn, its picture has loaded, and the spot its tile stands on is in the state
 * (`inBounds`: within the state's bounds, for a spot off its shore, as Liberty Island is).
 */
async function expectModelOn(map, id, stateCode, { inBounds = false } = {}) {
  const model = map.locator(`[data-landmark-model="${id}"]`);
  await expect(model.locator('image')).toBeVisible();
  await expect
    .poll(() =>
      model.locator('image').evaluate((image) => {
        const probe = new Image();
        probe.src = image.href.baseVal;
        return probe.decode().then(
          () => probe.naturalWidth,
          () => 0,
        );
      }),
    )
    .toBeGreaterThan(0);
  const onState = await model.evaluate(
    (group, { code, bounds }) => {
      const { e: x, f: y } = group.transform.baseVal.consolidate().matrix;
      const state = document.querySelector(`[data-state="${code}"]`);
      if (bounds) {
        const box = state.getBBox();
        return x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height;
      }
      const point = new DOMPoint(x, y);
      return [...state.querySelectorAll('path')].some((path) => path.isPointInFill(point));
    },
    { code: stateCode, bounds: inBounds },
  );
  expect(onState).toBe(true);
  return model;
}

/** A country's own map draws exactly the models its model.json files put on it, and no others. */
async function expectModelsOf(map, name) {
  const code = CODE_BY_NAME.get(name);
  const ids = MODEL_INFO.filter((info) => info.onMap !== false && info.maps.includes(code))
    .map((info) => info.id)
    .sort();
  expect(ids.length, name).toBeGreaterThan(0);
  await expect
    .poll(() => map.locator('[data-landmark-model]').evaluateAll((models) => models.map((model) => model.dataset.landmarkModel).sort()))
    .toEqual(ids);
}

test('Big Ben stands on Westminster on the United Kingdom’s own map', async ({ page }) => {
  await openMap(page);
  await expect(page.locator('[data-landmark-model]')).toHaveCount(0);
  const map = await openCountryMap(page, 'United Kingdom');
  await expectModelOn(map, 'big-ben', 'GB-WSM');
  // With the three nations' own (below) and the rest of its models
  await expectModelsOf(map, 'United Kingdom');
  // Only the country's own map has it: none on the world map
  await map.getByRole('button', { name: 'World map' }).click();
  await expect(page.locator('[data-country-map]')).toHaveCount(0);
  await expect(page.locator('[data-landmark-model]')).toHaveCount(0);
});

// Scotland's, Northern Ireland's and Wales' models (23 Nov 2026) are on their nation's own map and
// the United Kingdom's, as Big Ben is on England's and the UK's
test('the United Kingdom’s own map has Edinburgh Castle, the Giant’s Causeway and Caernarfon Castle too', async ({ page }) => {
  await openMap(page);
  const map = await openCountryMap(page, 'United Kingdom');
  await expectModelOn(map, 'edinburgh-castle', 'GB-EDH');
  await expectModelOn(map, 'giants-causeway', 'GB-MYL');
  await expectModelOn(map, 'caernarfon-castle', 'GB-GWN');
});

test('the Eiffel Tower stands on Paris on France’s own map, a little taller than Big Ben', async ({ page }) => {
  await openMap(page);
  const map = await openCountryMap(page, 'France');
  const tower = await expectModelOn(map, 'eiffel-tower', 'FR-75');
  await expectModelsOf(map, 'France');
  // Every model is drawn at one scale: at the same zoom the tower is taller than Big Ben (64 px
  // at zoom 1), and the pin in Paris is still drawn over it
  const height = await tower.locator('image').evaluate((image) => image.getBoundingClientRect().height);
  const zoom = await map.locator('svg[role="application"]').evaluate((svg) => svg.getBoundingClientRect().width / svg.viewBox.baseVal.width / 0.96);
  expect(height).toBeGreaterThan(Math.min(150, Math.max(40, 64 * Math.sqrt(zoom))) * 1.02);
  await map.locator('[data-pin]').first().click();
  await expect(page.getByRole('dialog', { name: 'Paris' })).toBeVisible();
});

test('the Colosseum stands on Rome on Italy’s own map, low and wide', async ({ page }) => {
  await openMap(page);
  const map = await openCountryMap(page, 'Italy');
  const colosseum = await expectModelOn(map, 'colosseum', 'IT-RM');
  await expectModelsOf(map, 'Italy');
  // Low and wide (drawn at least 0.7 of Big Ben's height, bigger than the one scale, so it reads at a glance)
  const box = await colosseum.locator('image').boundingBox();
  expect(box.width).toBeGreaterThan(box.height);
});

test('the Statue of Liberty stands in New York Harbor on the United States’ own map', async ({ page }) => {
  await openMap(page);
  const map = await openCountryMap(page, 'United States');
  // Liberty Island is off New York's shore at the map's detail: its spot is in the harbour
  await expectModelOn(map, 'statue-of-liberty', 'US-NY', { inBounds: true });
  await expectModelsOf(map, 'United States');
});

// The next five (22 Nov 2026), each on its own country's map, inside its state or province
for (const [country, id, area, place] of [
  ['India', 'taj-mahal', 'IN-UP', 'Uttar Pradesh'],
  ['Egypt', 'pyramids-of-giza', 'EG-GZ', 'Giza'],
  ['Australia', 'sydney-opera-house', 'AUS-2654', 'New South Wales'],
  ['Brazil', 'christ-the-redeemer', 'BR-RJ', 'Rio de Janeiro'],
  ['China', 'great-wall', 'CN-BJ', 'Beijing'],
  // and the five after them
  ['Japan', 'mount-fuji', 'JP-19', 'Yamanashi (its summit on the border)'],
  ['Greece', 'parthenon', 'GR-A1', 'Attica'],
  ['Spain', 'sagrada-familia', 'ES-B', 'Barcelona'],
  // Natural Earth swaps Moscow's two codes: RU-MOS is the city, "Moskva"
  ['Russia', 'saint-basils', 'RU-MOS', 'Moscow'],
  ['Mexico', 'chichen-itza', 'MX-YUC', 'Yucatán'],
  // and the five after those
  ['Peru', 'machu-picchu', 'PE-CUS', 'Cusco'],
  ['Cambodia', 'angkor-wat', 'KH-17', 'Siem Reap'],
  ['Jordan', 'petra', 'JO-MN', 'Ma’an'],
  ['Germany', 'neuschwanstein', 'DE-BY', 'Bavaria'],
  // Easter Island is in one of Chile's insets, part of Valparaíso
  ['Chile', 'moai', 'CL-VS', 'Valparaíso'],
  // and the five after those
  ['Netherlands', 'kinderdijk', 'NL-ZH', 'South Holland'],
  ['Turkey', 'hagia-sophia', 'TR-34', 'Istanbul'],
  ['Canada', 'cn-tower', 'CA-ON', 'Ontario'],
  ['United Arab Emirates', 'burj-khalifa', 'AE-DU', 'Dubai'],
  ['Singapore', 'marina-bay-sands', 'SG-01', 'Central Singapore'],
  // and the five after those
  ['South Africa', 'table-mountain', 'ZA-WC', 'the Western Cape'],
  ['Indonesia', 'borobudur', 'ID-JT', 'Central Java'],
  // Kuala Lumpur is inside Selangor on the map; the city's own outline is drawn over it
  ['Malaysia', 'petronas-towers', 'MY-14', 'Kuala Lumpur'],
  // and the five after those
  ['Tanzania', 'kilimanjaro', 'TZ-09', 'Kilimanjaro'],
  ['Myanmar', 'bagan', 'MM-04', 'Mandalay'],
  // Prague is inside Central Bohemia on the map; the city's own outline is drawn over it
  ['Czechia', 'prague-castle', 'CZ-PR', 'Prague'],
  // and the five after those
  ['Argentina', 'perito-moreno', 'AR-Z', 'Santa Cruz'],
  // Seoul is inside Gyeonggi on the map; the city's own outline is drawn over it
  ['South Korea', 'gyeongbokgung', 'KR-11', 'Seoul'],
  ['Cuba', 'old-havana', 'CU-03', 'Havana'],
  ['Norway', 'bryggen', 'NO-12', 'Hordaland'],
]) {
  test(`${country}’s own map has its landmark model, in ${place}`, async ({ page }) => {
    await openMap(page);
    const map = await openCountryMap(page, country);
    await expectModelOn(map, id, area);
    await expectModelsOf(map, country);
  });
}

// Spots just off their area's outline at the map's detail: within its bounds. The Tower of
// Belém stands in the Tagus; Victoria Falls is on the Zambezi, the border; Ha Long Bay is the bay
for (const [country, id, area, place] of [
  ['Portugal', 'belem-tower', 'PT-11', 'Lisbon'],
  ['Zambia', 'victoria-falls', 'ZM-07', 'Southern Province'],
  ['Vietnam', 'ha-long-bay', 'VN-13', 'Quảng Ninh'],
  // the Cliffs of Moher are Clare's very edge, the sea's side of its coastline at the map's detail
  ['Ireland', 'cliffs-of-moher', 'IE-CE', 'Clare'],
]) {
  test(`${country}’s own map has its landmark model, by ${place}`, async ({ page }) => {
    await openMap(page);
    const map = await openCountryMap(page, country);
    await expectModelOn(map, id, area, { inBounds: true });
    await expectModelsOf(map, country);
  });
}

// The hundred after them (23 Nov 2026), ten countries to a test, each map opened in turn: the
// model in its state or province, or (`true`) within its bounds, where the spot is off a coast
// the map draws coarsely or on an islet it doesn't draw (Gorée off Dakar, Suomenlinna off
// Helsinki, the Rock of Monaco, St George's harbour). Brussels, Budapest and Kyiv are drawn
// inside the region round them, their own outline over it. Natural Earth's Vatican is a small
// hexagon north of the basilica: St Peter's stands in its middle.
const MORE_MODELS = [
  ['Afghanistan', 'minaret-of-jam', 'AF-GHO', 'Ghor'],
  ['Albania', 'butrint', 'AL-12', 'Vlorë'],
  ['Armenia', 'geghard', 'AM-KT', 'Kotayk'],
  ['Austria', 'schonbrunn', 'AT-9', 'Vienna'],
  ['Azerbaijan', 'gobustan', 'AZ-BA', 'Baku'],
  ['Bangladesh', 'sundarbans', 'BD-D', 'Khulna', true],
  ['Belarus', 'mir-castle', 'BY-HR', 'Grodno'],
  ['Belgium', 'grand-place', 'BE-BRU', 'Brussels'],
  ['Bosnia and Herzegovina', 'mostar', 'BIH-2228', 'Herzegovina-Neretva'],
  ['Bulgaria', 'rila', 'BG-10', 'Kyustendil'],
  ['Colombia', 'ciudad-perdida', 'CO-MAG', 'Magdalena'],
  ['Costa Rica', 'stone-spheres', 'CR-P', 'Puntarenas'],
  ['Croatia', 'plitvice', 'HR-13', 'Zadar'],
  ['Cyprus', 'paphos', 'CY-05', 'Paphos', true],
  ['Denmark', 'tivoli', 'DK-84', 'the Capital Region', true],
  ['Djibouti', 'lake-assal', 'DJ-TA', 'Tadjourah'],
  ['Dominican Republic', 'santo-domingo', 'DO-01', 'the Distrito Nacional'],
  ['Ecuador', 'galapagos', 'EC-W', 'Galápagos'],
  ['Equatorial Guinea', 'malabo-cathedral', 'GQ-BN', 'Bioko Norte', true],
  ['Eritrea', 'fiat-tagliero', 'ER-AN', 'Anseba'],
  ['Estonia', 'tallinn', 'EE-37', 'Harju'],
  ['Ethiopia', 'lalibela', 'ET-AM', 'Amhara'],
  ['Finland', 'suomenlinna', 'FI-18', 'Uusimaa', true],
  ['Gabon', 'loango', 'GA-8', 'Ogooué-Maritime'],
  ['Georgia', 'gelati', 'GE-IM', 'Imereti'],
  ['Ghana', 'cape-coast-castle', 'GH-CP', 'the Central Region'],
  ['Greenland', 'ilulissat', 'GL-QA', 'Qaasuitsup'],
  ['Grenada', 'fort-george', 'GD-03', 'Saint George', true],
  ['Guatemala', 'tikal', 'GT-PE', 'Petén'],
  ['Guyana', 'kaieteur', 'GY-PT', 'Potaro-Siparuni'],
  ['Haiti', 'citadelle', 'HT-ND', 'Nord'],
  ['Honduras', 'copan', 'HN-CP', 'Copán'],
  ['Iceland', 'thingvellir', 'IS-8', 'Suðurland'],
  ['Iran', 'persepolis', 'IR-14', 'Fars'],
  ['Iraq', 'hatra', 'IQ-NI', 'Nineveh'],
  ['Kazakhstan', 'yasawi', 'KZ-YUZ', 'South Kazakhstan'],
  ['Kenya', 'maasai-mara', 'KE-700', 'the Rift Valley'],
  ['Kuwait', 'kuwait-towers', 'KW-KU', 'Al Asimah', true],
  ['Laos', 'wat-phou', 'LA-CH', 'Champasak'],
  ['Latvia', 'riga', 'LV-RIX', 'Riga'],
  ['Lebanon', 'baalbek', 'LB-BI', 'Beqaa'],
  ['Lesotho', 'thaba-bosiu', 'LS-A', 'Maseru'],
  ['Libya', 'leptis-magna', 'LY-MB', 'Al Marqab'],
  ['Liechtenstein', 'vaduz-castle', 'LI-11', 'Vaduz'],
  ['Lithuania', 'trakai', 'LT-VL', 'Vilnius County'],
  ['Luxembourg', 'bock-casemates', 'LU-L', 'Luxembourg'],
  ['Madagascar', 'tsingy', 'MDG-5876', 'Melaky'],
  ['Malawi', 'lake-malawi', 'MW-MG', 'Mangochi'],
  ['Mali', 'timbuktu', 'ML-6', 'Timbuktu'],
  ['Mauritius', 'le-morne', 'MU-BL', 'Black River', true],
  ['Moldova', 'orheiul-vechi', 'MD-CR', 'Criuleni'],
  ['Monaco', 'monaco-palace', 'MC-X01', 'Monaco', true],
  ['Mongolia', 'orkhon-valley', 'MN-055', 'Övörkhangai'],
  ['Montenegro', 'kotor', 'ME-06', 'Cetinje'],
  ['Morocco', 'marrakesh', 'MA-11', 'Marrakesh-Tensift-Al Haouz'],
  ['Mozambique', 'mozambique-island', 'MZ-N', 'Nampula', true],
  ['Namibia', 'etosha', 'NA-OT', 'Oshikoto'],
  ['Nepal', 'boudhanath', 'NP-BA', 'Bagmati'],
  ['New Zealand', 'milford-sound', 'NZ-STL', 'Southland', true],
  ['North Macedonia', 'ohrid', 'MK-58', 'Ohrid'],
  ['Oman', 'bahla-fort', 'OM-DA', 'Ad Dakhiliyah'],
  ['Pakistan', 'mohenjo-daro', 'PK-SD', 'Sindh'],
  ['Palau', 'rock-islands', 'PW-150', 'Koror'],
  ['Panama', 'panama-canal', 'PA-8', 'Panamá'],
  ['Paraguay', 'trinidad-mission', 'PY-7', 'Itapúa'],
  ['Philippines', 'banaue', 'PH-IFU', 'Ifugao'],
  ['Qatar', 'al-zubarah', 'QA-MS', 'Al Shamal'],
  ['Romania', 'peles-castle', 'RO-PH', 'Prahova'],
  ['Rwanda', 'volcanoes-np', 'RW-03', 'the Northern Province'],
  ['Saint Kitts and Nevis', 'brimstone-hill', 'KN-02', 'Saint Anne Sandy Point'],
  ['Saint Lucia', 'pitons', 'LC-10', 'Soufrière'],
  ['Samoa', 'papaseea', 'WS-TU', 'Tuamasaga'],
  ['San Marino', 'guaita-tower', 'SM-06', 'Borgo Maggiore'],
  ['Saudi Arabia', 'hegra', 'SA-03', 'Medina'],
  ['Senegal', 'goree', 'SN-DK', 'Dakar', true],
  ['Serbia', 'studenica', 'RS-18', 'Raška'],
  ['Seychelles', 'vallee-de-mai', 'SC-14', 'Grand’Anse Praslin'],
  ['Slovakia', 'spis-castle', 'SK-KI', 'Košice'],
  ['Slovenia', 'lake-bled', 'SI-003', 'Bled'],
  ['Sri Lanka', 'sigiriya', 'LK-22', 'Matale'],
  ['Sudan', 'meroe', 'SD-NR', 'River Nile'],
  ['Sweden', 'drottningholm', 'SE-AB', 'Stockholm'],
  ['Switzerland', 'chillon', 'CH-VD', 'Vaud'],
  ['Syria', 'palmyra', 'SY-HI', 'Homs'],
  ['Taiwan', 'taroko', 'TW-HUA', 'Hualien'],
  ['Tajikistan', 'karakul', 'TJ-GB', 'Gorno-Badakhshan'],
  ['Togo', 'koutammakou', 'TG-K', 'Kara'],
  ['Tonga', 'haamonga', 'TO-04', 'Tongatapu'],
  ['Tunisia', 'el-jem', 'TN-53', 'Mahdia'],
  ['Turkmenistan', 'darvaza', 'TM-D', 'Daşoguz'],
  ['Ukraine', 'saint-sophia', 'UA-30', 'Kyiv'],
  ['Uruguay', 'colonia', 'UY-CO', 'Colonia'],
  ['Uzbekistan', 'registan', 'UZ-SA', 'Samarkand'],
  ['Vatican City', 'st-peters', 'VA-X01', 'the Vatican'],
  ['Venezuela', 'angel-falls', 'VE-F', 'Bolívar'],
  ['Yemen', 'sanaa', 'YE-SA', 'Sanaa'],
  ['Zimbabwe', 'great-zimbabwe', 'ZW-MV', 'Masvingo'],
];

// Then one for every country map that had none (23 Nov 2026), the territories and small islands
// too; the UK's nations' three are tested above, the Great Blue Hole below. Within the bounds
// (`true`): islets and reefs the map doesn't draw (Big Major Cay's Pig Beach, Stingray City's
// sandbar, Managaha, Nan Madol, Bunce Island, Funafuti's atoll) and coasts drawn coarsely. Kunta
// Kinteh Island is mid-river, inside West Coast's bounds across from North Bank. Two spots were
// moved onto the map: Maho Beach 1.35 km east, by the runway, onto Sint Maarten's coarse outline;
// and Kiribati's map has no Phoenix Islands (it draws the Line Islands, the Gilberts as an inset),
// so their model stands in the sea between the two.
const LAST_MODELS = [
  ['Algeria', 'mzab-valley', 'DZ-47', 'Ghardaïa'],
  ['American Samoa', 'pola-island', 'AS-X01', 'Eastern'],
  ['Andorra', 'madriu-valley', 'AD-08', 'Escaldes-Engordany'],
  ['Angola', 'kissama', 'AO-BGO', 'Bengo'],
  ['Anguilla', 'wallblake-house', 'AI-X11', 'The Farrington'],
  ['Antigua and Barbuda', 'nelsons-dockyard', 'AG-06', 'Saint Paul'],
  ['Aruba', 'california-lighthouse', 'AW-X01', 'Aruba'],
  ['Bahamas', 'pig-beach', 'BS-BP', 'Black Point', true],
  ['Bahrain', 'qalat-al-bahrain', 'BH-13', 'Al Manāmah'],
  ['Barbados', 'bridgetown', 'BB-08', 'Saint Michael'],
  ['Benin', 'abomey', 'BJ-ZO', 'Zou'],
  ['Bermuda', 'st-george-bermuda', 'BM-SGE', 'Saint George’s'],
  ['Bhutan', 'tigers-nest', 'BT-11', 'Paro'],
  ['Bolivia', 'tiwanaku', 'BO-L', 'La Paz'],
  ['Botswana', 'okavango-delta', 'BW-NW', 'North-West'],
  ['British Virgin Islands', 'the-baths', 'VG-X01', 'the British Virgin Islands', true],
  ['Brunei', 'omar-ali-saifuddien-mosque', 'BN-BM', 'Brunei and Muara'],
  ['Burkina Faso', 'loropeni', 'BF-PON', 'Poni'],
  ['Burundi', 'kibira', 'BI-CI', 'Cibitoke'],
  ['Cameroon', 'dja', 'CM-ES', 'Est'],
  ['Canary Islands', 'teide', 'ES-TF', 'Santa Cruz de Tenerife'],
  ['Cape Verde', 'cidade-velha', 'CV-RS', 'Ribeira Grande de Santiago'],
  ['Caribbean Netherlands', 'bonaire-salt-pans', 'NL-BQ1', 'Bonaire'],
  ['Cayman Islands', 'stingray-city', 'KY-X01', 'the Cayman Islands', true],
  ['Central African Republic', 'manovo-gounda', 'CF-BB', 'Bamingui-Bangoran'],
  ['Chad', 'ennedi', 'TD-X01', 'Ennedi'],
  ['Comoros', 'karthala', 'KM-G', 'Andjazîdja'],
  ["Côte d'Ivoire", 'grand-bassam', 'CI-01', 'Lagunes', true],
  ['Curaçao', 'willemstad', 'CW-X01', 'Curaçao'],
  ['Democratic Republic of the Congo', 'virunga', 'CD-NK', 'Nord-Kivu'],
  ['Dominica', 'morne-trois-pitons', 'DM-09', 'Saint Patrick'],
  ['El Salvador', 'joya-de-ceren', 'SV-LI', 'La Libertad'],
  ['Eswatini', 'mlilwane', 'SZ-MA', 'Manzini'],
  ['Falkland Islands', 'volunteer-point', 'FK-X01', 'the Falkland Islands'],
  ['Faroe Islands', 'mulafossur', 'FO-X00', 'the Faroes', true],
  ['Fiji', 'sigatoka-dunes', 'FJ-W', 'Western', true],
  ['French Guiana', 'kourou-space-centre', 'FR-GF', 'French Guiana'],
  ['French Polynesia', 'taputapuatea', 'PF-X02', 'the Leeward Islands', true],
  ['Gambia', 'kunta-kinteh-island', 'GM-W', 'West Coast', true],
  ['Gibraltar', 'rock-of-gibraltar', 'GI-X01', 'Gibraltar'],
  ['Guadeloupe', 'carbet-falls', 'FR-GP', 'Guadeloupe'],
  ['Guam', 'two-lovers-point', 'GU-X01', 'Guam'],
  ['Guinea', 'fouta-djallon', 'GN-LA', 'Labé'],
  ['Guinea-Bissau', 'bijagos', 'GW-BL', 'Bolama', true],
  ['Israel', 'bahai-gardens', 'IL-HA', 'Haifa'],
  ['Jamaica', 'blue-mountains', 'JM-04', 'Portland'],
  ['Kiribati', 'phoenix-islands', 'KI-X01', 'Kiribati', true],
  ['Kosovo', 'gracanica', 'XK-X20', 'Pristina'],
  ['Kyrgyzstan', 'ala-archa', 'KG-C', 'Chuy'],
  ['Liberia', 'providence-island', 'LR-MO', 'Montserrado'],
  ['Maldives', 'muliaage-palace', 'MDV-5234', 'Malé'],
  ['Malta', 'valletta', 'MT-60', 'Valletta'],
  ['Martinique', 'mount-pelee', 'FR-MQ', 'Martinique'],
  ['Mauritania', 'chinguetti', 'MR-07', 'Adrar'],
  ['Mayotte', 'mont-choungui', 'FR-YT', 'Mayotte'],
  ['Micronesia', 'nan-madol', 'FM-PNI', 'Pohnpei', true],
  ['Montserrat', 'soufriere-hills', 'MS-A', 'Saint Anthony'],
  ['Nauru', 'command-ridge', 'NR-07', 'Buada'],
  ['Nicaragua', 'leon-cathedral', 'NI-LE', 'León'],
  ['Niger', 'agadez', 'NE-1', 'Agadez'],
  ['Nigeria', 'sukur', 'NG-AD', 'Adamawa'],
  ['North Korea', 'kaesong', 'KP-06', 'North Hwanghae'],
  ['Northern Mariana Islands', 'managaha', 'MP-X03', 'Saipan', true],
  ['Palestine', 'church-of-the-nativity', 'PS-WBK', 'the West Bank'],
  ['Papua New Guinea', 'kokoda-track', 'PG-CPM', 'Central'],
  ['Puerto Rico', 'el-morro', 'US-PR', 'Puerto Rico', true],
  ['Republic of the Congo', 'odzala', 'CG-15', 'Cuvette-Ouest'],
  ['Réunion', 'piton-de-la-fournaise', 'FR-RE', 'Réunion'],
  ['Saint Barthélemy', 'gustavia', 'BL-X00', 'Saint Barthélemy'],
  ['Saint Martin', 'fort-louis', 'MF-X00', 'Saint Martin'],
  ['Saint Vincent and the Grenadines', 'la-soufriere-svg', 'VC-03', 'Saint David'],
  ['São Tomé and Príncipe', 'pico-cao-grande', 'ST-S', 'São Tomé'],
  ['Sierra Leone', 'bunce-island', 'SL-N', 'the Northern Province', true],
  ['Sint Maarten', 'maho-beach', 'NL-SX', 'Sint Maarten'],
  ['Solomon Islands', 'east-rennell', 'SB-RB', 'Rennell and Bellona'],
  ['Somalia', 'laas-geel', 'SOL+00?', 'Somaliland'],
  ['South Sudan', 'boma', 'SS-JG', 'Jonglei'],
  ['Suriname', 'paramaribo', 'SR-PM', 'Paramaribo'],
  ['Timor-Leste', 'cristo-rei-dili', 'TL-DI', 'Dili', true],
  ['Trinidad and Tobago', 'pitch-lake', 'TT-SIP', 'Siparia'],
  ['Turks and Caicos Islands', 'grace-bay', 'TC-X03', 'Providenciales and West Caicos'],
  ['Tuvalu', 'funafuti', 'TV-X01', 'Tuvalu', true],
  ['Uganda', 'kasubi-tombs', 'UG-102', 'Kampala'],
  ['United States Virgin Islands', 'trunk-bay', 'VI-X03', 'Saint John'],
  ['Vanuatu', 'roi-mata', 'VU-SEE', 'Shefa'],
  ['Western Sahara', 'dakhla', 'EH-16', 'Oued Ed-Dahab', true],
];

// Then more for countries that had one (23 Nov 2026, images/src/models/NEXT-MODELS.md part 2), so a
// map shows several: those on the map (the rest are drawn for other uses, kept off it by a more
// famous one's picture; tested below). Within the bounds (`true`): spots on a coast or islet the
// map draws coarsely (the Great Barrier Reef, Komodo, Lamu, Galle's fort, Kronborg). Skellig
// Michael's islet isn't drawn at all: its model stands at sea off Kerry (the in-view test).
const EXTRA_MODELS = [
  ['Argentina', 'humahuaca', 'AR-Y', 'Jujuy'],
  ['Argentina', 'iguazu-falls', 'AR-N', 'Misiones'],
  ['Armenia', 'haghpat', 'AM-LO', 'Lori'],
  ['Australia', 'great-barrier-reef', 'AU-QLD', 'Queensland', true],
  ['Australia', 'uluru', 'AU-NT', 'Northern Territory'],
  ['Austria', 'hallstatt', 'AT-4', 'Oberösterreich'],
  ['Austria', 'salzburg', 'AT-5', 'Salzburg'],
  ['Azerbaijan', 'maiden-tower', 'AZ-BA', 'Bakı'],
  ['Belgium', 'bruges', 'BE-VWV', 'West Flanders'],
  ['Bolivia', 'salar-de-uyuni', 'BO-P', 'Potosí'],
  ['Bosnia and Herzegovina', 'visegrad-bridge', 'BA-X06', 'Foča'],
  ['Brazil', 'brasilia', 'BR-DF', 'Distrito Federal'],
  ['Brazil', 'lencois-maranhenses', 'BR-MA', 'Maranhão'],
  ['Brazil', 'teatro-amazonas', 'BR-AM', 'Amazonas'],
  ['Bulgaria', 'nessebar', 'BG-02', 'Burgas', true],
  ['Canada', 'chateau-frontenac', 'CA-QC', 'Québec', true],
  ['Canada', 'moraine-lake', 'CA-BC', 'British Columbia'],
  ['Chile', 'chiloe-churches', 'CL-LL', 'Los Lagos'],
  ['Chile', 'torres-del-paine', 'CL-MA', 'Magallanes y Antártica Chilena'],
  ['China', 'guilin', 'CN-GX', 'Guangxi'],
  ['China', 'potala-palace', 'CN-XZ', 'Xizang'],
  ['China', 'terracotta-army', 'CN-SN', 'Shaanxi'],
  ['Colombia', 'cartagena', 'CO-BOL', 'Bolívar'],
  ['Croatia', 'diocletians-palace', 'HR-17', 'Splitsko-Dalmatinska', true],
  ['Croatia', 'dubrovnik', 'HR-19', 'Dubrovacko-Neretvanska', true],
  ['Cuba', 'trinidad-cuba', 'CU-07', 'Sancti Spíritus'],
  ['Cuba', 'vinales', 'CU-01', 'Pinar del Río'],
  ['Czechia', 'cesky-krumlov', 'CZ-JC', 'Jihočeský'],
  ['Denmark', 'kronborg', 'DK-84', 'Hovedstaden', true],
  ['Ecuador', 'quito', 'EC-P', 'Pichincha'],
  ['Egypt', 'abu-simbel', 'EG-ASN', 'Aswan'],
  ['Egypt', 'karnak', 'EG-KN', 'Qina'],
  ['Ethiopia', 'gondar', 'ET-AM', 'Amhara'],
  ['Ethiopia', 'simien-mountains', 'ET-AM', 'Amhara'],
  ['France', 'carcassonne', 'FR-11', 'Aude'],
  ['France', 'chambord', 'FR-41', 'Loir-et-Cher'],
  ['France', 'mont-saint-michel', 'FR-50', 'Manche'],
  ['France', 'pont-du-gard', 'FR-30', 'Gard'],
  ['Georgia', 'svaneti-towers', 'GE-SZ', 'Samegrelo-Zemo Svaneti'],
  ['Germany', 'brandenburg-gate', 'DE-BE', 'Berlin'],
  ['Germany', 'cologne-cathedral', 'DE-NW', 'Nordrhein-Westfalen'],
  ['Greece', 'delphi', 'GR-H', 'Stereá Elláda'],
  ['Greece', 'meteora', 'GR-E', 'Thessalia'],
  ['Greece', 'santorini', 'GR-L', 'Notio Aigaio'],
  ['Guatemala', 'antigua-guatemala', 'GT-SA', 'Sacatepéquez'],
  ['Hungary', 'hungarian-parliament', 'HU-BU', 'Budapest'],
  ['Iceland', 'vatnajokull', 'IS-8', 'Suðurland'],
  ['India', 'golden-temple', 'IN-PB', 'Punjab'],
  ['India', 'hampi', 'IN-KA', 'Karnataka'],
  ['India', 'hawa-mahal', 'IN-RJ', 'Rajasthan'],
  ['India', 'red-fort', 'IN-DL', 'Delhi'],
  ['Indonesia', 'bali-subak', 'ID-BA', 'Bali'],
  ['Indonesia', 'komodo', 'ID-NT', 'Nusa Tenggara Timur', true],
  ['Iran', 'naqsh-e-jahan', 'IR-04', 'Esfahan'],
  ['Israel', 'masada', 'IL-D', 'HaDarom'],
  ['Italy', 'dolomites', 'IT-BL', 'Belluno'],
  ['Italy', 'leaning-tower', 'IT-PI', 'Pisa'],
  ['Italy', 'pompeii', 'IT-NA', 'Napoli'],
  ['Italy', 'trulli', 'IT-BA', 'Bari'],
  ['Italy', 'venice', 'IT-VE', 'Venezia'],
  ['Japan', 'himeji-castle', 'JP-28', 'Hyōgo'],
  ['Japan', 'itsukushima', 'JP-34', 'Hiroshima'],
  ['Japan', 'shirakawa-go', 'JP-21', 'Gifu'],
  ['Jordan', 'wadi-rum', 'JO-AQ', 'Aqaba'],
  ['Kenya', 'lamu', 'KE-300', 'Coast', true],
  ['Laos', 'luang-prabang', 'LA-LP', 'Louangphrabang'],
  ['Lebanon', 'cedars-of-god', 'LB-AS', 'North Lebanon'],
  ['Libya', 'ghadames', 'LY-GD', 'Ghadamis'],
  ['Lithuania', 'vilnius', 'LT-VL', 'Vilniaus'],
  ['Malaysia', 'kinabalu', 'MY-12', 'Sabah'],
  ['Malaysia', 'melaka', 'MY-04', 'Melaka', true],
  ['Mali', 'djenne', 'ML-5', 'Mopti'],
  ['Mexico', 'guanajuato', 'MX-GUA', 'Guanajuato'],
  ['Mexico', 'palenque', 'MX-CHP', 'Chiapas'],
  ['Mexico', 'teotihuacan', 'MX-MEX', 'México'],
  ['Morocco', 'ait-benhaddou', 'MA-13', 'Souss - Massa - Draâ'],
  ['Morocco', 'fez-tanneries', 'MA-05', 'Fès - Boulemane'],
  ['Namibia', 'deadvlei', 'NA-HA', 'Hardap'],
  ['Nepal', 'everest', 'NP-SA', 'Sagarmatha'],
  ['Netherlands', 'amsterdam-canals', 'NL-NH', 'Noord-Holland'],
  ['New Zealand', 'tongariro', 'NZ-MWT', 'Manawatu-Wanganui'],
  ['Norway', 'geirangerfjord', 'NO-15', 'Møre og Romsdal'],
  ['Pakistan', 'lahore-fort', 'PK-PB', 'Punjab'],
  ['Peru', 'nazca-lines', 'PE-ICA', 'Ica'],
  ['Philippines', 'underground-river', 'PHL-5533', 'Puerto Princesa'],
  ['Philippines', 'vigan', 'PH-ILS', 'Ilocos Sur'],
  ['Poland', 'krakow', 'PL-MA', 'Lesser Poland'],
  ['Poland', 'malbork', 'PL-PM', 'Pomeranian'],
  ['Portugal', 'porto', 'PT-13', 'Porto'],
  ['Romania', 'bran-castle', 'RO-BV', 'Brasov'],
  ['Romania', 'sighisoara', 'RO-MS', 'Mures'],
  ['Romania', 'voronet', 'RO-SV', 'Suceava'],
  ['Russia', 'kamchatka', 'RU-KAM', 'Kamchatka'],
  ['Russia', 'kizhi', 'RU-KR', 'Karelia'],
  ['Russia', 'lake-baikal', 'RU-IRK', 'Irkutsk'],
  ['Russia', 'saint-petersburg', 'RU-SPE', 'City of St. Petersburg'],
  ['Saudi Arabia', 'diriyah', 'SA-01', 'Ar Riyad'],
  ['Senegal', 'saint-louis', 'SN-SL', 'Saint-Louis', true],
  ['Singapore', 'botanic-gardens', 'SG-01', 'Central Singapore'],
  ['South Africa', 'drakensberg', 'ZA-NL', 'KwaZulu-Natal'],
  ['South Korea', 'bulguksa', 'KR-47', 'North Gyeongsang'],
  ['South Korea', 'seongsan', 'KR-49', 'Jeju'],
  ['Spain', 'alhambra', 'ES-GR', 'Granada'],
  ['Spain', 'segovia-aqueduct', 'ES-SG', 'Segovia'],
  ['Spain', 'seville-giralda', 'ES-SE', 'Sevilla'],
  ['Sri Lanka', 'galle-fort', 'LK-31', 'Gālla', true],
  ['Sri Lanka', 'temple-of-the-tooth', 'LK-21', 'Mahanuvara'],
  ['Sudan', 'gebel-barkal', 'SD-NO', 'Northern'],
  ['Sweden', 'visby', 'SE-I', 'Gotland'],
  ['Switzerland', 'jungfrau', 'CH-VS', 'Valais'],
  ['Switzerland', 'landwasser-viaduct', 'CH-GR', 'Graubünden'],
  ['Switzerland', 'matterhorn', 'CH-VS', 'Valais'],
  ['Syria', 'krak-des-chevaliers', 'SY-HI', 'Homs (Hims'],
  ['Tanzania', 'serengeti', 'TZ-13', 'Mara'],
  ['Tanzania', 'stone-town', 'TZ-15', 'Zanzibar West'],
  ['Thailand', 'grand-palace-bangkok', 'TH-10', 'Bangkok Metropolis'],
  ['Thailand', 'sukhothai', 'TH-64', 'Sukhothai'],
  ['Tunisia', 'carthage', 'TN-11', 'Tunis', true],
  ['Turkey', 'cappadocia', 'TR-50', 'Nevsehir'],
  ['Turkey', 'ephesus', 'TR-35', 'Izmir'],
  ['Turkey', 'pamukkale', 'TR-20', 'Denizli'],
  ['Ukraine', 'lviv', 'UA-46', "L'viv"],
  ['United Arab Emirates', 'sheikh-zayed-mosque', 'AE-AZ', 'Abu Dhabi', true],
  ['United Kingdom', 'stonehenge', 'GB-WIL', 'Wiltshire'],
  ['United States', 'golden-gate-bridge', 'US-CA', 'California', true],
  ['United States', 'grand-canyon', 'US-AZ', 'Arizona'],
  ['United States', 'half-dome', 'US-CA', 'California'],
  ['United States', 'mount-rushmore', 'US-SD', 'South Dakota'],
  ['United States', 'old-faithful', 'US-WY', 'Wyoming'],
  ['Uzbekistan', 'bukhara', 'UZ-BU', 'Bukhoro'],
  ['Uzbekistan', 'khiva', 'UZ-XO', 'Khorezm'],
  ['Vietnam', 'hoi-an', 'VN-27', 'Quàng Nam'],
  ['Yemen', 'shibam', 'YE-HD', 'Hadramawt'],
  ['Yemen', 'socotra', 'YE-HD', 'Hadramawt'],
  ['Zimbabwe', 'matobo-hills', 'ZW-MS', 'Matabeleland South'],
];
for (const models of [MORE_MODELS, LAST_MODELS, EXTRA_MODELS]) for (let i = 0; i < models.length; i += 10) {
  const group = models.slice(i, i + 10);
  test(`the landmark models from ${group[0][0]} to ${group.at(-1)[0]}, each on its own country’s map`, async ({ page }) => {
    test.setTimeout(240_000);
    await openMap(page);
    for (const [country, id, area, place, inBounds = false] of group) {
      await test.step(`${country}: ${id}, ${inBounds ? 'by' : 'in'} ${place}`, async () => {
        const map = await openCountryMap(page, country);
        await expectModelOn(map, id, area, { inBounds });
        await expectModelsOf(map, country);
        await map.getByRole('button', { name: 'World map' }).click();
        await expect(page.locator('[data-country-map]')).toHaveCount(0);
      });
    }
  });
}

// The map opens with its model's whole picture in view (CountryMapView's fit): Bikini Atoll is
// too small for Natural Earth's outlines, so its model stands at its real spot out at sea, west
// of the Marshall Islands' drawn atolls; Gorée's stood on the view's edge, half out of it. The
// Great Blue Hole is out at sea too, on Lighthouse Reef, which Belize's map doesn't draw; the
// Phoenix Islands' stands in the sea between Kiribati's two drawn groups (above)
for (const [country, id, whose] of [
  ['Marshall Islands', 'bikini-atoll', 'the Marshall Islands’'],
  ['Senegal', 'goree', 'Senegal’s'],
  ['Belize', 'great-blue-hole', 'Belize’s'],
  ['Kiribati', 'phoenix-islands', 'Kiribati’s'],
  ['Ireland', 'skellig-michael', 'Ireland’s'],
]) {
  test(`${whose} own map opens with its landmark model in view`, async ({ page }) => {
    await openMap(page);
    const map = await openCountryMap(page, country);
    const image = map.locator(`[data-landmark-model="${id}"] image`);
    await expect(image).toBeVisible();
    const svg = map.locator('svg[role="application"]');
    // The view is fitted a frame after the map draws
    await expect
      .poll(async () => {
        const [a, b] = [await image.boundingBox(), await svg.boundingBox()];
        return a.x >= b.x && a.y >= b.y && a.x + a.width <= b.x + b.width && a.y + a.height <= b.y + b.height;
      })
      .toBe(true);
  });
}

// Where two models' pictures would overlap, only the more famous shows (23 Nov 2026, the user's
// decision): Thailand's map has the Grand Palace, not Ayutthaya's chedis
test('a model kept off the map (onMap: false) isn’t drawn there', async ({ page }) => {
  await openMap(page);
  const map = await openCountryMap(page, 'Thailand');
  await expectModelOn(map, 'grand-palace-bangkok', 'TH-10');
  await expect(map.locator('[data-landmark-model="ayutthaya"]')).toHaveCount(0);
  await expectModelsOf(map, 'Thailand');
});

test('marking a state colours it and brings its country', async ({ page }) => {
  await openMap(page);
  const map = await openCountryMap(page, 'Canada');
  await pressState(page, 'CA-SK');
  const popover = page.getByRole('dialog', { name: 'Saskatchewan' });
  await popover.getByRole('button', { name: 'Visited' }).click();
  await expect(page.locator('[data-state="CA-SK"]')).toHaveAttribute('data-status', 'VISITED');
  await expect(map.getByText('1 of 13 provinces visited')).toBeVisible();
  // Canada came with it (North America already counted, through the US)
  await expectStats(page, '9 countries, 2 continents, 16 photos');
});

test('an editor drops a pin and saves its first visit', async ({ page }) => {
  await openMap(page);
  const map = await openCountryMap(page, 'United States');
  await expect(map.getByText('2 of 51 states visited')).toBeVisible();
  await map.getByRole('button', { name: 'Add a pin' }).click();
  await expect(map.getByText('Press the map where the pin goes.')).toBeVisible();
  await pressState(page, 'US-TX');
  const panel = page.getByRole('dialog', { name: 'New pin in United States' });
  await panel.getByRole('textbox', { name: 'Name' }).fill('Austin');
  // An exact spot: shared with the map's viewers only when chosen (19 Nov 2026, the user's decision)
  await expect(panel.getByRole('checkbox', { name: 'Show this pin to everyone the map is shared with' })).not.toBeChecked();
  await panel.getByRole('button', { name: 'Next: the first visit' }).click();
  await panel.getByRole('combobox', { name: 'When' }).selectOption('Only the year');
  await panel.getByRole('textbox', { name: 'Year' }).fill('2024');
  await panel.getByRole('button', { name: 'Save the pin' }).click();
  const pin = page.getByRole('dialog', { name: 'Austin' });
  await expect(pin.getByText('United States · 1 visit · only the map’s editors see it')).toBeVisible();
  await expect(pin.locator('[data-pin-visit]').getByRole('heading')).toHaveText('2024');
  await expect(map.locator('[data-pin]')).toHaveCount(1);

  // Going back: a second visit, kept apart from the first
  await pin.getByRole('button', { name: 'Add a visit' }).click();
  await pin.getByRole('combobox', { name: 'When' }).selectOption('Only the year');
  await pin.getByRole('textbox', { name: 'Year' }).fill('2025');
  await pin.getByRole('button', { name: 'Add the visit' }).click();
  await expect(pin.getByText('United States · 2 visits')).toBeVisible();
  await expect(pin.locator('[data-pin-visit]').getByRole('heading')).toHaveText(['2025', '2024']);
});

test('a country opens on its own on a phone too', { tag: '@phone' }, async ({ page }) => {
  await openMap(page);
  const map = await openCountryMap(page, 'United States');
  await expect(map.getByText('2 of 51 states visited')).toBeVisible();
  await expect(page.locator('[data-state="US-NY"]')).toHaveAttribute('data-status', 'VISITED');
  // A finger's drag and pinch are the map's own, as on the world map: without it the phone's
  // browser held back the touch moves, and panning was jerky (23 Nov 2026, the user's report)
  await expect(map.getByRole('application')).toHaveCSS('touch-action', 'none');
});

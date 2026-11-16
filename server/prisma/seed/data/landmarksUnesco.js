// UNESCO World Heritage Sites for the passport (docs/FEATURE-PLAN.md, "The passport"):
// one landmark per inscription, in the same shape as landmarks.js plus `isUnesco: true`.
//
// LOADED since 16 Nov 2026 (with the passport): prisma/seed/landmarks.js `landmarkRows()`
// joins it to landmarks.js for the seed and `npm run db:reference`, setting
// `Landmark.isUnesco`; the client's mock copy is made by
// client/scripts/generate-mock-landmarks.mjs.
//
// SOURCE: Wikidata (CC0), queried on 16 Nov 2026 at query.wikidata.org: items with a World
// Heritage Site ID (P757) or heritage designation (P1435) World Heritage Site (Q9259), with
// their coordinate (P625), country (P17 -> ISO alpha-2, P297), English label, instance of
// (P31) and area (P2046). UNESCO's public list (whc.unesco.org/en/list/xml: 1,273
// inscriptions after the 2026 session) was used only as a checklist, so each inscription
// appears once: the comment on each line is its UNESCO id number and inscription year.
//   - 1155 inscriptions are here and 118 are already one of the 177 in landmarks.js
//     (UNESCO_IN_EXISTING, below). The Phoenix Islands Protected Area, left out until
//     countries.js had Kiribati, was added on 16 Nov 2026 (open ocean; the point is
//     Wikidata's).
//   - `wikidataId` is the item the point comes from, as in landmarks.js. It's the
//     inscription's own item, unless its parts are far apart (a serial or transnational
//     site) or it has no coordinate: then the most visited part stands in, named in
//     brackets ("Frontiers of the Roman Empire (Hadrian's Wall)"), and the comment gives
//     the inscription's item ("site Q…"). A name in brackets on an inscription's own item
//     says where its point is ("Great Spa Towns of Europe (Spa)").
//   - Names are short English ones, as a traveller says them ("Mount Tai", "Forbidden
//     City"); slugs are unique together with landmarks.js; characters stay within the
//     client font's subset (no "Huế", "Uluṟu"). A country or place in brackets tells two
//     alike apart ("Iguazú National Park (Argentina)").
//
// COUNTRY: where the point lands on our map (src/utils/countryLookup.js). Where it lands
// within 4 map units of Wikidata's country, Wikidata's wins (the map is coarse at borders:
// Strasbourg, Kronborg, Preah Vihear); territories with their own entry in
// countries.js take it (Greenland GL, Canary Islands IC, Kosovo XK, Réunion RE, New
// Caledonia NC, French Polynesia PF, Martinique MQ, Bermuda BM, Puerto Rico PR, Curaçao CW).
// Andorra and Gibraltar have their own entries since 16 Nov 2026, so the
// Madriu-Perafita-Claror Valley is AD and Gorham's Cave GI (they were FR and ES), and the
// map finds Greece on Rhodes, Samos and Patmos (it found Turkey). Islands far out at sea
// land on no shape and keep Wikidata's country. The Old City of Jerusalem is Palestine
// (PS), where the map puts it, although Wikidata says Israel and it's within 4 units of
// Israel (the user's decision, 16 Nov 2026; landmarks.js's Western Wall too).
//
// RADIUS (`matchRadiusM`), on the scale of landmarks.js (building 300–800 m · site / old
// town 1–3 km · park, range, archipelago 10–60 km, never above MAX_MATCH_RADIUS_M):
//   - with an area on Wikidata (P2046, the smallest value): 1.2 × the radius of a circle
//     of that area, + 200 m;
//   - without one, by category: building 500 m, site and old town 1.5 km, natural 5 km,
//     mountain 8 km, island 10 km, park 20 km, archipelago and range 30 km;
//   - stretched to take in the site's other parts within 25 km (at most 5 km in a town,
//     15 km elsewhere);
//   - kept within the category's bounds: building 300–1,500 m, old town 1–6 km (a city
//     item's area is the municipality's, so it isn't used), site 1 km+, park 5 km+,
//     archipelago and range 10 km+, all at most 60 km. A few are set by hand where
//     Wikidata's area is wrong or the place needs it (Venice, Gaudí's Barcelona works).
// `category` isn't stored; it explains the radius, as in landmarks.js.
//
// UNESCO_IN_EXISTING: the landmarks.js items that already stand for an inscription (the
// same item, the inscription's main part, or for a big park its most visited spot:
// Perito Moreno Glacier for Los Glaciares, Angel Falls for Canaima, Milford Sound for Te
// Wahipounamu, Lake Karakul for Tajik National Park, Table Mountain for the Cape Floral
// Region). The passport migration marks them `isUnesco`; with this file that's one
// landmark per inscription. Landmarks that are only a part of a larger inscribed area
// (Colosseum, Eiffel Tower, Hagia Sophia, Western Wall, Prague Castle, Buda Castle, Jemaa
// el-Fnaa, Bock Casemates, Christ the Redeemer) aren't in it: their inscription is here.

export const UNESCO_LANDMARKS = [
  { countryCode: 'AF', name: 'Bamiyan Valley', category: 'site', latitude: 34.83204, longitude: 67.8268, matchRadiusM: 4500, wikidataId: 'Q50810144', isUnesco: true }, // WHS 208, 2003
  { countryCode: 'AL', name: 'Berat and Gjirokastër (Berat)', category: 'old town', latitude: 40.70222, longitude: 19.94694, matchRadiusM: 1500, wikidataId: 'Q64418433', isUnesco: true }, // WHS 569, 2005; site Q3664670
  { countryCode: 'DZ', name: "Al Qal'a of Beni Hammad", category: 'old town', latitude: 35.81389, longitude: 4.79333, matchRadiusM: 1500, wikidataId: 'Q500367', isUnesco: true }, // WHS 102, 1980
  { countryCode: 'DZ', name: 'Djémila', category: 'site', latitude: 36.32056, longitude: 5.73667, matchRadiusM: 1000, wikidataId: 'Q457362', isUnesco: true }, // WHS 191, 1982
  { countryCode: 'DZ', name: 'Kasbah of Algiers', category: 'old town', latitude: 36.78333, longitude: 3.06028, matchRadiusM: 1500, wikidataId: 'Q662102', isUnesco: true }, // WHS 565, 1992
  { countryCode: 'DZ', name: "M'Zab Valley", category: 'natural', latitude: 32.48722, longitude: 3.68139, matchRadiusM: 8000, wikidataId: 'Q724484', isUnesco: true }, // WHS 188, 1982
  { countryCode: 'DZ', name: "Tassili n'Ajjer", category: 'range', latitude: 25.66667, longitude: 9, matchRadiusM: 60000, wikidataId: 'Q190048', isUnesco: true }, // WHS 179, 1982
  { countryCode: 'DZ', name: 'Timgad', category: 'old town', latitude: 35.48424, longitude: 6.46867, matchRadiusM: 1500, wikidataId: 'Q459629', isUnesco: true }, // WHS 194, 1982
  { countryCode: 'DZ', name: 'Tipasa', category: 'site', latitude: 36.5951, longitude: 2.44077, matchRadiusM: 11000, wikidataId: 'Q3529269', isUnesco: true }, // WHS 193, 1982
  { countryCode: 'AD', name: 'Madriu-Perafita-Claror Valley', category: 'park', latitude: 42.49215, longitude: 1.59443, matchRadiusM: 5000, wikidataId: 'Q332800', isUnesco: true }, // WHS 1160, 2004
  { countryCode: 'AO', name: 'Mbanza Kongo', category: 'old town', latitude: -6.26667, longitude: 14.25, matchRadiusM: 1500, wikidataId: 'Q500189', isUnesco: true }, // WHS 1511, 2017
  { countryCode: 'AG', name: 'Antigua Naval Dockyard', category: 'site', latitude: 17.00455, longitude: -61.76007, matchRadiusM: 1300, wikidataId: 'Q124402010', isUnesco: true }, // WHS 1499, 2016
  { countryCode: 'AR', name: 'Cueva de las Manos', category: 'natural', latitude: -47.15, longitude: -70.66667, matchRadiusM: 1900, wikidataId: 'Q223385', isUnesco: true }, // WHS 936, 1999
  { countryCode: 'AR', name: 'ESMA Museum and Site of Memory', category: 'building', latitude: -34.53663, longitude: -58.46547, matchRadiusM: 800, wikidataId: 'Q28663704', isUnesco: true }, // WHS 1681, 2023
  { countryCode: 'AR', name: 'Guarani Jesuit Missions (San Ignacio Miní)', category: 'site', latitude: -27.25531, longitude: -55.5315, matchRadiusM: 1000, wikidataId: 'Q868799', isUnesco: true }, // WHS 275, 1983; site Q465960
  { countryCode: 'AR', name: 'Iguazú National Park (Argentina)', category: 'park', latitude: -25.66667, longitude: -54.4, matchRadiusM: 16000, wikidataId: 'Q57072712', isUnesco: true }, // WHS 303, 1984
  { countryCode: 'AR', name: 'Ischigualasto / Talampaya', category: 'park', latitude: -29.8, longitude: -67.83333, matchRadiusM: 36000, wikidataId: 'Q17132555', isUnesco: true }, // WHS 966, 2000
  { countryCode: 'AR', name: 'Jesuit Block and Estancias of Córdoba', category: 'building', latitude: -31.4181, longitude: -64.1872, matchRadiusM: 600, wikidataId: 'Q5994983', isUnesco: true }, // WHS 995, 2000; site Q837642
  { countryCode: 'AR', name: 'Los Alerces National Park', category: 'park', latitude: -42.8075, longitude: -71.89889, matchRadiusM: 30000, wikidataId: 'Q828291', isUnesco: true }, // WHS 1526, 2017
  { countryCode: 'AR', name: 'Península Valdés', category: 'park', latitude: -42.5, longitude: -63.93333, matchRadiusM: 41000, wikidataId: 'Q213237', isUnesco: true }, // WHS 937, 1999
  { countryCode: 'AR', name: 'Quebrada de Humahuaca', category: 'natural', latitude: -23.19986, longitude: -65.34886, matchRadiusM: 28000, wikidataId: 'Q28061', isUnesco: true }, // WHS 1116, 2003
  { countryCode: 'AM', name: 'Echmiatsin and Zvartnots', category: 'site', latitude: 40.15931, longitude: 44.29514, matchRadiusM: 4000, wikidataId: 'Q22026170', isUnesco: true }, // WHS 1011, 2000
  { countryCode: 'AM', name: 'Haghpat and Sanahin Monasteries', category: 'site', latitude: 41.095, longitude: 44.71028, matchRadiusM: 5000, wikidataId: 'Q16910825', isUnesco: true }, // WHS 777, 1996
  { countryCode: 'AU', name: 'Australian Convict Sites (Port Arthur)', category: 'site', latitude: -43.15639, longitude: 147.84722, matchRadiusM: 1000, wikidataId: 'Q999109', isUnesco: true }, // WHS 1306, 2010; site Q391496
  { countryCode: 'AU', name: 'Australian Fossil Mammal Sites (Naracoorte)', category: 'park', latitude: -37.03611, longitude: 140.79667, matchRadiusM: 5000, wikidataId: 'Q1135796', isUnesco: true }, // WHS 698, 1994; site Q15933552
  { countryCode: 'AU', name: 'Budj Bim Cultural Landscape', category: 'mountain', latitude: -38.0667, longitude: 141.917, matchRadiusM: 15000, wikidataId: 'Q260465', isUnesco: true }, // WHS 1577, 2019
  { countryCode: 'AU', name: 'Gondwana Rainforests (Lamington)', category: 'park', latitude: -28.1422, longitude: 153.115, matchRadiusM: 10000, wikidataId: 'Q751274', isUnesco: true }, // WHS 368, 1986; site Q643063
  { countryCode: 'AU', name: 'Great Barrier Reef', category: 'natural', latitude: -16.4, longitude: 145.8, matchRadiusM: 60000, wikidataId: 'Q7343', isUnesco: true }, // WHS 154, 1981
  { countryCode: 'AU', name: 'Greater Blue Mountains', category: 'park', latitude: -33.7, longitude: 150, matchRadiusM: 20000, wikidataId: 'Q934627', isUnesco: true }, // WHS 917, 2000
  { countryCode: 'AU', name: 'Heard and McDonald Islands', category: 'archipelago', latitude: -53.07833, longitude: 73.5075, matchRadiusM: 13000, wikidataId: 'Q131198', isUnesco: true }, // WHS 577, 1997
  { countryCode: 'AU', name: "K'gari (Fraser Island)", category: 'park', latitude: -25.24, longitude: 153.15, matchRadiusM: 29000, wikidataId: 'Q134905', isUnesco: true }, // WHS 630, 1992
  { countryCode: 'AU', name: 'Kakadu National Park', category: 'park', latitude: -13.0055, longitude: 132.5195, matchRadiusM: 60000, wikidataId: 'Q65096742', isUnesco: true }, // WHS 147, 1981
  { countryCode: 'AU', name: 'Lord Howe Island', category: 'archipelago', latitude: -31.55617, longitude: 159.07972, matchRadiusM: 26000, wikidataId: 'Q1869866', isUnesco: true }, // WHS 186, 1982
  { countryCode: 'AU', name: 'Macquarie Island', category: 'island', latitude: -54.63, longitude: 158.86, matchRadiusM: 8000, wikidataId: 'Q46650', isUnesco: true }, // WHS 629, 1997
  { countryCode: 'AU', name: 'Murujuga Cultural Landscape', category: 'park', latitude: -20.58333, longitude: 116.83333, matchRadiusM: 5000, wikidataId: 'Q25386203', isUnesco: true }, // WHS 1709, 2025
  { countryCode: 'AU', name: 'Ningaloo Coast', category: 'park', latitude: -22.739, longitude: 113.628, matchRadiusM: 57000, wikidataId: 'Q1541665', isUnesco: true }, // WHS 1369, 2011
  { countryCode: 'AU', name: 'Purnululu National Park', category: 'park', latitude: -17.44879, longitude: 128.54605, matchRadiusM: 19000, wikidataId: 'Q679568', isUnesco: true }, // WHS 1094, 2003
  { countryCode: 'AU', name: 'Royal Exhibition Building', category: 'site', latitude: -37.80611, longitude: 144.97028, matchRadiusM: 1000, wikidataId: 'Q15278460', isUnesco: true }, // WHS 1131, 2004
  { countryCode: 'AU', name: 'Shark Bay', category: 'park', latitude: -25.92897, longitude: 113.60465, matchRadiusM: 60000, wikidataId: 'Q38167074', isUnesco: true }, // WHS 578, 1991
  { countryCode: 'AU', name: 'Tasmanian Wilderness', category: 'park', latitude: -42.5957, longitude: 146.1729, matchRadiusM: 60000, wikidataId: 'Q138170', isUnesco: true }, // WHS 181, 1982
  { countryCode: 'AU', name: 'Uluru-Kata Tjuta National Park', category: 'park', latitude: -25.32208, longitude: 130.98573, matchRadiusM: 25000, wikidataId: 'Q251999', isUnesco: true }, // WHS 447, 1987
  { countryCode: 'AU', name: 'Wet Tropics of Queensland (Daintree)', category: 'park', latitude: -16.3, longitude: 145.2, matchRadiusM: 19000, wikidataId: 'Q1157644', isUnesco: true }, // WHS 486, 1988; site Q1135808
  { countryCode: 'AU', name: 'Willandra Lakes', category: 'park', latitude: -33.61814, longitude: 143.10141, matchRadiusM: 33000, wikidataId: 'Q747875', isUnesco: true }, // WHS 167, 1981
  { countryCode: 'AT', name: 'Danube Limes (Carnuntum)', category: 'site', latitude: 48.115, longitude: 16.861, matchRadiusM: 1200, wikidataId: 'Q108017566', isUnesco: true }, // WHS 1608, 2021
  { countryCode: 'AT', name: 'Fertő / Neusiedlersee', category: 'site', latitude: 47.80056, longitude: 16.73472, matchRadiusM: 5500, wikidataId: 'Q2925869', isUnesco: true }, // WHS 772, 2001
  { countryCode: 'AT', name: 'Graz Old Town and Schloss Eggenberg', category: 'old town', latitude: 47.07417, longitude: 15.39167, matchRadiusM: 4000, wikidataId: 'Q2326418', isUnesco: true }, // WHS 931, 1999
  { countryCode: 'AT', name: 'Hallstatt-Dachstein Salzkammergut', category: 'site', latitude: 47.5594, longitude: 13.6464, matchRadiusM: 10000, wikidataId: 'Q1033019', isUnesco: true }, // WHS 806, 1997
  { countryCode: 'AT', name: 'Historic Centre of Salzburg', category: 'old town', latitude: 47.7997, longitude: 13.0486, matchRadiusM: 1500, wikidataId: 'Q1621046', isUnesco: true }, // WHS 784, 1996
  { countryCode: 'AT', name: 'Historic Centre of Vienna', category: 'old town', latitude: 48.2084, longitude: 16.3722, matchRadiusM: 1500, wikidataId: 'Q11288310', isUnesco: true }, // WHS 1033, 2001
  { countryCode: 'AT', name: 'Semmering Railway', category: 'site', latitude: 47.643, longitude: 15.831, matchRadiusM: 1000, wikidataId: 'Q259313', isUnesco: true }, // WHS 785, 1998
  { countryCode: 'AT', name: 'Wachau', category: 'natural', latitude: 48.36444, longitude: 15.43417, matchRadiusM: 4000, wikidataId: 'Q192201', isUnesco: true }, // WHS 970, 2000
  { countryCode: 'AZ', name: 'Historic Centre of Sheki', category: 'old town', latitude: 41.19194, longitude: 47.17056, matchRadiusM: 3000, wikidataId: 'Q106762537', isUnesco: true }, // WHS 1549, 2019
  { countryCode: 'AZ', name: 'Khinalig and the Köç Yolu Route', category: 'site', latitude: 40.7059, longitude: 48.8854, matchRadiusM: 1500, wikidataId: 'Q122852382', isUnesco: true }, // WHS 1696, 2023
  { countryCode: 'AZ', name: 'Walled City of Baku', category: 'old town', latitude: 40.36667, longitude: 49.83333, matchRadiusM: 1500, wikidataId: 'Q29901643', isUnesco: true }, // WHS 958, 2000
  { countryCode: 'BH', name: 'Bahrain Pearling Trail', category: 'island', latitude: 26.25, longitude: 50.61, matchRadiusM: 13000, wikidataId: 'Q1889313', isUnesco: true }, // WHS 1364, 2012
  { countryCode: 'BH', name: 'Dilmun Burial Mounds', category: 'site', latitude: 26.14972, longitude: 50.51278, matchRadiusM: 9000, wikidataId: 'Q5276996', isUnesco: true }, // WHS 1542, 2019
  { countryCode: 'BH', name: "Qal'at al-Bahrain", category: 'site', latitude: 26.23361, longitude: 50.52056, matchRadiusM: 1000, wikidataId: 'Q740104', isUnesco: true }, // WHS 1192, 2005
  { countryCode: 'BD', name: 'Mosque City of Bagerhat', category: 'old town', latitude: 22.66097, longitude: 89.75855, matchRadiusM: 1500, wikidataId: 'Q799893', isUnesco: true }, // WHS 321, 1985
  { countryCode: 'BD', name: 'Paharpur Buddhist Vihara', category: 'site', latitude: 25.03111, longitude: 88.97694, matchRadiusM: 1500, wikidataId: 'Q305044', isUnesco: true }, // WHS 322, 1985
  { countryCode: 'BB', name: 'Historic Bridgetown and its Garrison', category: 'old town', latitude: 13.0975, longitude: -59.61667, matchRadiusM: 1500, wikidataId: 'Q36168', isUnesco: true }, // WHS 1376, 2011; site Q629210
  { countryCode: 'BY', name: 'Białowieża Forest', category: 'park', latitude: 52.75, longitude: 23.95, matchRadiusM: 26000, wikidataId: 'Q192666', isUnesco: true }, // WHS 33, 1979
  { countryCode: 'BY', name: 'Mir Castle', category: 'building', latitude: 53.45127, longitude: 26.47289, matchRadiusM: 600, wikidataId: 'Q209643', isUnesco: true }, // WHS 625, 2000
  { countryCode: 'BY', name: 'Nesvizh Castle', category: 'site', latitude: 53.22278, longitude: 26.69139, matchRadiusM: 1500, wikidataId: 'Q15278712', isUnesco: true }, // WHS 1196, 2005
  { countryCode: 'BE', name: 'Belfries of Belgium and France (Bruges)', category: 'building', latitude: 51.20798, longitude: 3.2253, matchRadiusM: 500, wikidataId: 'Q2441211', isUnesco: true }, // WHS 943, 1999; site Q750675
  { countryCode: 'BE', name: 'Boat Lifts of the Canal du Centre', category: 'site', latitude: 50.4714, longitude: 4.0945, matchRadiusM: 1000, wikidataId: 'Q99372', isUnesco: true }, // WHS 856, 1998
  { countryCode: 'BE', name: 'First World War Western Front (Menin Gate)', category: 'building', latitude: 50.85205, longitude: 2.89107, matchRadiusM: 300, wikidataId: 'Q1822397', isUnesco: true }, // WHS 1567, 2023; site Q64685453
  { countryCode: 'BE', name: 'Flemish Béguinages (Bruges)', category: 'building', latitude: 51.2, longitude: 3.21667, matchRadiusM: 300, wikidataId: 'Q2528092', isUnesco: true }, // WHS 855, 1998; site Q265453
  { countryCode: 'BE', name: 'Great Spa Towns of Europe (Spa)', category: 'site', latitude: 50.49222, longitude: 5.86694, matchRadiusM: 6000, wikidataId: 'Q16064866', isUnesco: true }, // WHS 1613, 2021
  { countryCode: 'BE', name: 'Historic Centre of Bruges', category: 'old town', latitude: 51.20891, longitude: 3.22527, matchRadiusM: 1500, wikidataId: 'Q5762117', isUnesco: true }, // WHS 996, 2000
  { countryCode: 'BE', name: 'Mining Sites of Wallonia (Grand-Hornu)', category: 'site', latitude: 50.43528, longitude: 3.83944, matchRadiusM: 1000, wikidataId: 'Q1025354', isUnesco: true }, // WHS 1344, 2012; site Q1921177
  { countryCode: 'BE', name: 'Neolithic Flint Mines at Spiennes', category: 'site', latitude: 50.41999, longitude: 3.98258, matchRadiusM: 1100, wikidataId: 'Q677879', isUnesco: true }, // WHS 1006, 2000
  { countryCode: 'BE', name: 'Plantin-Moretus Museum', category: 'building', latitude: 51.21829, longitude: 4.39816, matchRadiusM: 300, wikidataId: 'Q595802', isUnesco: true }, // WHS 1185, 2005
  { countryCode: 'BE', name: 'Stoclet House', category: 'building', latitude: 50.83514, longitude: 4.41625, matchRadiusM: 300, wikidataId: 'Q239028', isUnesco: true }, // WHS 1298, 2009
  { countryCode: 'BE', name: 'Tournai Cathedral', category: 'building', latitude: 50.6065, longitude: 3.3889, matchRadiusM: 300, wikidataId: 'Q391229', isUnesco: true }, // WHS 1009, 2000
  { countryCode: 'BE', name: 'Victor Horta Town Houses', category: 'site', latitude: 50.81667, longitude: 4.35, matchRadiusM: 4500, wikidataId: 'Q1426014', isUnesco: true }, // WHS 1005, 2000
  { countryCode: 'BZ', name: 'Belize Barrier Reef (Great Blue Hole)', category: 'natural', latitude: 17.31556, longitude: -87.53444, matchRadiusM: 1000, wikidataId: 'Q86486', isUnesco: true }, // WHS 764, 1996; site Q28361
  { countryCode: 'BJ', name: 'Royal Palaces of Abomey', category: 'building', latitude: 7.18645, longitude: 1.994, matchRadiusM: 1400, wikidataId: 'Q2425839', isUnesco: true }, // WHS 323, 1985
  { countryCode: 'BJ', name: 'W-Arly-Pendjari (Pendjari National Park)', category: 'park', latitude: 11.25, longitude: 1.51806, matchRadiusM: 36000, wikidataId: 'Q1474363', isUnesco: true }, // WHS 749, 1996; site Q25379596
  { countryCode: 'BM', name: 'Historic Town of St George, Bermuda', category: 'old town', latitude: 32.37944, longitude: -64.67778, matchRadiusM: 5000, wikidataId: 'Q7865260', isUnesco: true }, // WHS 983, 2000
  { countryCode: 'BO', name: 'Fuerte de Samaipata', category: 'site', latitude: -18.17836, longitude: -63.81899, matchRadiusM: 1000, wikidataId: 'Q876451', isUnesco: true }, // WHS 883, 1998
  { countryCode: 'BO', name: 'Historic City of Sucre', category: 'old town', latitude: -19.04799, longitude: -65.25959, matchRadiusM: 1500, wikidataId: 'Q16522830', isUnesco: true }, // WHS 566, 1991
  { countryCode: 'BO', name: 'Jesuit Missions of the Chiquitos (San Javier)', category: 'old town', latitude: -16.2748, longitude: -62.5072, matchRadiusM: 1500, wikidataId: 'Q281844', isUnesco: true }, // WHS 529, 1990; site Q33934
  { countryCode: 'BO', name: 'Noel Kempff Mercado National Park', category: 'park', latitude: -14.23028, longitude: -60.84667, matchRadiusM: 59000, wikidataId: 'Q650710', isUnesco: true }, // WHS 967, 2000
  { countryCode: 'BO', name: 'Potosí', category: 'old town', latitude: -19.58917, longitude: -65.75333, matchRadiusM: 1500, wikidataId: 'Q35045', isUnesco: true }, // WHS 420, 1987
  { countryCode: 'BO', name: 'Tiwanaku', category: 'site', latitude: -16.55472, longitude: -68.67333, matchRadiusM: 1500, wikidataId: 'Q61750', isUnesco: true }, // WHS 567, 2000
  { countryCode: 'BA', name: 'Mehmed Paša Sokolović Bridge', category: 'building', latitude: 43.78248, longitude: 19.28787, matchRadiusM: 500, wikidataId: 'Q210055', isUnesco: true }, // WHS 1260, 2007
  { countryCode: 'BA', name: 'Old Bridge of Mostar', category: 'building', latitude: 43.33728, longitude: 17.81503, matchRadiusM: 300, wikidataId: 'Q188528', isUnesco: true }, // WHS 946, 2005; site Q16333723
  { countryCode: 'BA', name: 'Stećci Tombstones (Radimlja)', category: 'site', latitude: 43.09256, longitude: 17.9232, matchRadiusM: 1000, wikidataId: 'Q43951677', isUnesco: true }, // WHS 1504, 2016; site Q29000652
  { countryCode: 'BA', name: 'Vjetrenica Cave', category: 'natural', latitude: 42.84583, longitude: 17.98389, matchRadiusM: 5000, wikidataId: 'Q2880621', isUnesco: true }, // WHS 1673, 2024
  { countryCode: 'BW', name: 'Okavango Delta', category: 'natural', latitude: -19.4, longitude: 22.9, matchRadiusM: 60000, wikidataId: 'Q650872', isUnesco: true }, // WHS 1432, 2014
  { countryCode: 'BW', name: 'Tsodilo Hills', category: 'site', latitude: -18.77167, longitude: 21.75417, matchRadiusM: 5000, wikidataId: 'Q214007', isUnesco: true }, // WHS 1021, 2001
  { countryCode: 'BR', name: 'Amazonia Theatres (Teatro Amazonas)', category: 'site', latitude: -3.13028, longitude: -60.0234, matchRadiusM: 1500, wikidataId: 'Q65561204', isUnesco: true }, // WHS 1774, 2026
  { countryCode: 'BR', name: 'Atlantic Forest South-East Reserves', category: 'park', latitude: -24.16667, longitude: -48, matchRadiusM: 47000, wikidataId: 'Q2521895', isUnesco: true }, // WHS 893, 1999
  { countryCode: 'BR', name: 'Bom Jesus do Congonhas', category: 'park', latitude: -20.50778, longitude: -43.86069, matchRadiusM: 5000, wikidataId: 'Q1595417', isUnesco: true }, // WHS 334, 1985
  { countryCode: 'BR', name: 'Brasília', category: 'old town', latitude: -15.79389, longitude: -47.88278, matchRadiusM: 8000, wikidataId: 'Q3391360', isUnesco: true }, // WHS 445, 1987; site Q2844
  { countryCode: 'BR', name: 'Carioca Landscapes of Rio de Janeiro', category: 'park', latitude: -22.94778, longitude: -43.29139, matchRadiusM: 15000, wikidataId: 'Q3374972', isUnesco: true }, // WHS 1100, 2012
  { countryCode: 'BR', name: 'Central Amazon (Anavilhanas)', category: 'park', latitude: -2.39472, longitude: -60.92056, matchRadiusM: 40000, wikidataId: 'Q392877', isUnesco: true }, // WHS 998, 2000; site Q2990490
  { countryCode: 'BR', name: 'Cerrado Reserves (Chapada dos Veadeiros)', category: 'park', latitude: -13.95, longitude: -47.4, matchRadiusM: 17000, wikidataId: 'Q750251', isUnesco: true }, // WHS 1035, 2001; site Q137787234
  { countryCode: 'BR', name: 'Discovery Coast Atlantic Forest', category: 'park', latitude: -16.44243, longitude: -39.06376, matchRadiusM: 23000, wikidataId: 'Q2487302', isUnesco: true }, // WHS 892, 1999
  { countryCode: 'BR', name: 'Fernando de Noronha and Atol das Rocas', category: 'park', latitude: -3.867, longitude: -32.446, matchRadiusM: 7500, wikidataId: 'Q1946032', isUnesco: true }, // WHS 1000, 2001; site Q15224654
  { countryCode: 'BR', name: 'Historic Centre of Diamantina', category: 'old town', latitude: -18.23333, longitude: -43.6, matchRadiusM: 1500, wikidataId: 'Q8343760', isUnesco: true }, // WHS 890, 1999
  { countryCode: 'BR', name: 'Historic Centre of Goiás', category: 'old town', latitude: -15.93328, longitude: -50.13336, matchRadiusM: 1500, wikidataId: 'Q8343761', isUnesco: true }, // WHS 993, 2001
  { countryCode: 'BR', name: 'Historic Centre of Olinda', category: 'old town', latitude: -8.01333, longitude: -34.845, matchRadiusM: 1500, wikidataId: 'Q8343764', isUnesco: true }, // WHS 189, 1982
  { countryCode: 'BR', name: 'Historic Centre of Salvador', category: 'old town', latitude: -12.9667, longitude: -38.5, matchRadiusM: 1500, wikidataId: 'Q5572706', isUnesco: true }, // WHS 309, 1985
  { countryCode: 'BR', name: 'Historic Centre of São Luís', category: 'old town', latitude: -2.52773, longitude: -44.3058, matchRadiusM: 1500, wikidataId: 'Q8343768', isUnesco: true }, // WHS 821, 1997
  { countryCode: 'BR', name: 'Iguaçu National Park (Brazil)', category: 'park', latitude: -25.5, longitude: -53.8, matchRadiusM: 28000, wikidataId: 'Q742315', isUnesco: true }, // WHS 355, 1986
  { countryCode: 'BR', name: 'Lençóis Maranhenses National Park', category: 'park', latitude: -2.48333, longitude: -43.13333, matchRadiusM: 6000, wikidataId: 'Q647777', isUnesco: true }, // WHS 1611, 2024
  { countryCode: 'BR', name: 'Ouro Preto', category: 'old town', latitude: -20.38577, longitude: -43.50364, matchRadiusM: 1500, wikidataId: 'Q3845692', isUnesco: true }, // WHS 124, 1980
  { countryCode: 'BR', name: 'Pampulha Modern Ensemble', category: 'old town', latitude: -19.85194, longitude: -43.97361, matchRadiusM: 1000, wikidataId: 'Q9850285', isUnesco: true }, // WHS 1493, 2016
  { countryCode: 'BR', name: 'Pantanal Conservation Area', category: 'park', latitude: -17.65, longitude: -57.43333, matchRadiusM: 25000, wikidataId: 'Q3179800', isUnesco: true }, // WHS 999, 2000; site Q99237891
  { countryCode: 'BR', name: 'Paraty and Ilha Grande', category: 'old town', latitude: -23.21944, longitude: -44.71472, matchRadiusM: 1500, wikidataId: 'Q926729', isUnesco: true }, // WHS 1308, 2019; site Q66057630
  { countryCode: 'BR', name: 'Peruaçu River Canyon', category: 'park', latitude: -15.11111, longitude: -44.22389, matchRadiusM: 5000, wikidataId: 'Q1051873', isUnesco: true }, // WHS 1747, 2025; site Q141673269
  { countryCode: 'BR', name: 'São Francisco Square, São Cristóvão', category: 'site', latitude: -11.01361, longitude: -37.20556, matchRadiusM: 1000, wikidataId: 'Q7214285', isUnesco: true }, // WHS 1272, 2010
  { countryCode: 'BR', name: 'Serra da Capivara National Park', category: 'park', latitude: -8.6667, longitude: -42.55, matchRadiusM: 22000, wikidataId: 'Q267394', isUnesco: true }, // WHS 606, 1991
  { countryCode: 'BR', name: 'Sítio Roberto Burle Marx', category: 'building', latitude: -23.02385, longitude: -43.54474, matchRadiusM: 600, wikidataId: 'Q56695607', isUnesco: true }, // WHS 1620, 2021
  { countryCode: 'BR', name: 'Valongo Wharf', category: 'site', latitude: -22.89711, longitude: -43.18739, matchRadiusM: 1000, wikidataId: 'Q20048515', isUnesco: true }, // WHS 1548, 2017
  { countryCode: 'BG', name: 'Ancient City of Nessebar', category: 'old town', latitude: 42.65611, longitude: 27.73, matchRadiusM: 1500, wikidataId: 'Q64617320', isUnesco: true }, // WHS 217, 1983
  { countryCode: 'BG', name: 'Boyana Church', category: 'building', latitude: 42.64467, longitude: 23.26617, matchRadiusM: 300, wikidataId: 'Q276553', isUnesco: true }, // WHS 42, 1979
  { countryCode: 'BG', name: 'Madara Rider', category: 'site', latitude: 43.27737, longitude: 27.11889, matchRadiusM: 1000, wikidataId: 'Q319296', isUnesco: true }, // WHS 43, 1979
  { countryCode: 'BG', name: 'Pirin National Park', category: 'park', latitude: 41.67222, longitude: 23.48778, matchRadiusM: 5000, wikidataId: 'Q651314', isUnesco: true }, // WHS 225, 1983
  { countryCode: 'BG', name: 'Rock-Hewn Churches of Ivanovo', category: 'building', latitude: 43.69556, longitude: 25.98806, matchRadiusM: 1100, wikidataId: 'Q503387', isUnesco: true }, // WHS 45, 1979
  { countryCode: 'BG', name: 'Srebarna Nature Reserve', category: 'park', latitude: 44.11112, longitude: 27.07221, matchRadiusM: 5000, wikidataId: 'Q122082', isUnesco: true }, // WHS 219, 1983
  { countryCode: 'BG', name: 'Thracian Tomb of Kazanlak', category: 'building', latitude: 42.62556, longitude: 25.39917, matchRadiusM: 400, wikidataId: 'Q301815', isUnesco: true }, // WHS 44, 1979
  { countryCode: 'BG', name: 'Thracian Tomb of Sveshtari', category: 'building', latitude: 43.74496, longitude: 26.7663, matchRadiusM: 1500, wikidataId: 'Q650531', isUnesco: true }, // WHS 359, 1985
  { countryCode: 'BF', name: 'Ancient Ferrous Metallurgy Sites (Douroula)', category: 'site', latitude: 12.58333, longitude: -3.3, matchRadiusM: 1000, wikidataId: 'Q2718415', isUnesco: true }, // WHS 1602, 2019; site Q65685157
  { countryCode: 'BF', name: 'Royal Court of Tiébélé', category: 'site', latitude: 11.08972, longitude: -0.96156, matchRadiusM: 1500, wikidataId: 'Q65684910', isUnesco: true }, // WHS 1713, 2024
  { countryCode: 'KH', name: 'Cambodian Memorial Sites', category: 'site', latitude: 11.48439, longitude: 104.90197, matchRadiusM: 1500, wikidataId: 'Q134721311', isUnesco: true }, // WHS 1748, 2025
  { countryCode: 'KH', name: 'Koh Ker', category: 'site', latitude: 13.74992, longitude: 104.54727, matchRadiusM: 1500, wikidataId: 'Q1778458', isUnesco: true }, // WHS 1667, 2023
  { countryCode: 'KH', name: 'Preah Vihear Temple', category: 'site', latitude: 14.39056, longitude: 104.68028, matchRadiusM: 1000, wikidataId: 'Q45949', isUnesco: true }, // WHS 1224, 2008
  { countryCode: 'KH', name: 'Sambor Prei Kuk', category: 'old town', latitude: 12.86728, longitude: 105.04002, matchRadiusM: 1500, wikidataId: 'Q1818746', isUnesco: true }, // WHS 1532, 2017
  { countryCode: 'CM', name: 'Diy-Gid-Biy of the Mandara Mountains', category: 'site', latitude: 10.91667, longitude: 13.83333, matchRadiusM: 3500, wikidataId: 'Q5285004', isUnesco: true }, // WHS 1745, 2025
  { countryCode: 'CA', name: 'Anticosti', category: 'natural', latitude: 49.53861, longitude: -63.24528, matchRadiusM: 9500, wikidataId: 'Q122707293', isUnesco: true }, // WHS 1686, 2023
  { countryCode: 'CA', name: 'Canadian Rocky Mountain Parks', category: 'park', latitude: 51.42472, longitude: -116.47972, matchRadiusM: 60000, wikidataId: 'Q72895', isUnesco: true }, // WHS 304, 1984
  { countryCode: 'CA', name: 'Dinosaur Provincial Park', category: 'park', latitude: 50.7617, longitude: -111.485, matchRadiusM: 6000, wikidataId: 'Q289466', isUnesco: true }, // WHS 71, 1979
  { countryCode: 'CA', name: 'Grand Pré', category: 'old town', latitude: 45.10889, longitude: -64.30917, matchRadiusM: 1500, wikidataId: 'Q1100749', isUnesco: true }, // WHS 1404, 2012
  { countryCode: 'CA', name: 'Gros Morne National Park', category: 'park', latitude: 49.68944, longitude: -57.73806, matchRadiusM: 29000, wikidataId: 'Q257598', isUnesco: true }, // WHS 419, 1987
  { countryCode: 'CA', name: 'Head-Smashed-In Buffalo Jump', category: 'site', latitude: 49.7494, longitude: -113.625, matchRadiusM: 4500, wikidataId: 'Q683110', isUnesco: true }, // WHS 158, 1981
  { countryCode: 'CA', name: 'Joggins Fossil Cliffs', category: 'natural', latitude: 45.75194, longitude: -64.41806, matchRadiusM: 1000, wikidataId: 'Q1439433', isUnesco: true }, // WHS 1285, 2008
  { countryCode: 'CA', name: "L'Anse aux Meadows", category: 'site', latitude: 51.59527, longitude: -55.53122, matchRadiusM: 6500, wikidataId: 'Q189113', isUnesco: true }, // WHS 4, 1978
  { countryCode: 'CA', name: 'Miguasha National Park', category: 'park', latitude: 48.11056, longitude: -66.36944, matchRadiusM: 5000, wikidataId: 'Q631128', isUnesco: true }, // WHS 686, 1999
  { countryCode: 'CA', name: 'Mistaken Point', category: 'park', latitude: 46.6319, longitude: -53.1903, matchRadiusM: 5000, wikidataId: 'Q3301928', isUnesco: true }, // WHS 1497, 2016
  { countryCode: 'CA', name: 'Nahanni National Park', category: 'park', latitude: 61.5971, longitude: -125.852, matchRadiusM: 47000, wikidataId: 'Q391391', isUnesco: true }, // WHS 24, 1978
  { countryCode: 'CA', name: 'Old Québec', category: 'old town', latitude: 46.80944, longitude: -71.21056, matchRadiusM: 1500, wikidataId: 'Q2114279', isUnesco: true }, // WHS 300, 1985
  { countryCode: 'CA', name: 'Old Town Lunenburg', category: 'old town', latitude: 44.37611, longitude: -64.30917, matchRadiusM: 1500, wikidataId: 'Q28833066', isUnesco: true }, // WHS 741, 1995
  { countryCode: 'CA', name: 'Pimachiowin Aki', category: 'park', latitude: 51, longitude: -95, matchRadiusM: 60000, wikidataId: 'Q7194595', isUnesco: true }, // WHS 1415, 2018
  { countryCode: 'CA', name: 'Red Bay Basque Whaling Station', category: 'site', latitude: 51.72692, longitude: -56.42953, matchRadiusM: 1300, wikidataId: 'Q3238270', isUnesco: true }, // WHS 1412, 2013
  { countryCode: 'CA', name: 'Rideau Canal', category: 'site', latitude: 45.42639, longitude: -75.69805, matchRadiusM: 3500, wikidataId: 'Q651323', isUnesco: true }, // WHS 1221, 2007; site Q18087815
  { countryCode: 'CA', name: 'SGang Gwaay', category: 'old town', latitude: 52.09889, longitude: -131.2175, matchRadiusM: 1500, wikidataId: 'Q240832', isUnesco: true }, // WHS 157, 1981
  { countryCode: 'CA', name: "Tr'ondëk-Klondike", category: 'park', latitude: 64, longitude: -139, matchRadiusM: 20000, wikidataId: 'Q65118617', isUnesco: true }, // WHS 1564, 2023
  { countryCode: 'CA', name: 'Waterton-Glacier Peace Park', category: 'park', latitude: 48.99606, longitude: -113.90417, matchRadiusM: 46000, wikidataId: 'Q828212', isUnesco: true }, // WHS 354, 1995
  { countryCode: 'CA', name: 'Wood Buffalo National Park', category: 'park', latitude: 59.3833, longitude: -112.983, matchRadiusM: 60000, wikidataId: 'Q391338', isUnesco: true }, // WHS 256, 1983
  { countryCode: 'CA', name: "Writing-on-Stone / Áísínai'pi", category: 'site', latitude: 49.0819, longitude: -111.617, matchRadiusM: 2500, wikidataId: 'Q8038519', isUnesco: true }, // WHS 1597, 2019
  { countryCode: 'IC', name: 'Garajonay National Park', category: 'park', latitude: 28.12625, longitude: -17.23722, matchRadiusM: 5000, wikidataId: 'Q464942', isUnesco: true }, // WHS 380, 1986
  { countryCode: 'IC', name: 'Risco Caído', category: 'site', latitude: 28.04356, longitude: -15.66126, matchRadiusM: 1500, wikidataId: 'Q55495511', isUnesco: true }, // WHS 1578, 2019
  { countryCode: 'IC', name: 'San Cristóbal de La Laguna', category: 'old town', latitude: 28.48528, longitude: -16.31667, matchRadiusM: 1500, wikidataId: 'Q54898', isUnesco: true }, // WHS 929, 1999
  { countryCode: 'IC', name: 'Teide National Park', category: 'park', latitude: 28.27646, longitude: -16.64267, matchRadiusM: 9500, wikidataId: 'Q715124', isUnesco: true }, // WHS 1258, 2007
  { countryCode: 'CF', name: 'Sangha Trinational (Dzanga-Ndoki)', category: 'park', latitude: 2.5, longitude: 16.1667, matchRadiusM: 59000, wikidataId: 'Q3364411', isUnesco: true }, // WHS 1380, 2012; site Q2580451
  { countryCode: 'TD', name: 'Ennedi Massif', category: 'range', latitude: 17.25, longitude: 22, matchRadiusM: 60000, wikidataId: 'Q1343339', isUnesco: true }, // WHS 1475, 2016
  { countryCode: 'TD', name: 'Lakes of Ounianga', category: 'natural', latitude: 18.98333, longitude: 20.66667, matchRadiusM: 5000, wikidataId: 'Q547375', isUnesco: true }, // WHS 1400, 2012
  { countryCode: 'CL', name: 'Chinchorro Settlements and Mummies', category: 'site', latitude: -18.482, longitude: -70.322, matchRadiusM: 1000, wikidataId: 'Q108096731', isUnesco: true }, // WHS 1634, 2021
  { countryCode: 'CL', name: 'Churches of Chiloé', category: 'site', latitude: -42.5, longitude: -73.76667, matchRadiusM: 15000, wikidataId: 'Q27964', isUnesco: true }, // WHS 971, 2000
  { countryCode: 'CL', name: 'Historic Quarter of Valparaíso', category: 'old town', latitude: -33.04064, longitude: -71.628, matchRadiusM: 1500, wikidataId: 'Q16333721', isUnesco: true }, // WHS 959, 2003
  { countryCode: 'CL', name: 'Humberstone Saltpeter Works', category: 'site', latitude: -20.20833, longitude: -69.79444, matchRadiusM: 1800, wikidataId: 'Q572895', isUnesco: true }, // WHS 1178, 2005
  { countryCode: 'CL', name: 'Sewell Mining Town', category: 'old town', latitude: -34.085, longitude: -70.3825, matchRadiusM: 1500, wikidataId: 'Q588417', isUnesco: true }, // WHS 1214, 2006
  { countryCode: 'CN', name: 'Ancient City of Pingyao', category: 'old town', latitude: 37.2014, longitude: 112.1544, matchRadiusM: 5000, wikidataId: 'Q65965285', isUnesco: true }, // WHS 812, 1997
  { countryCode: 'CN', name: 'Badain Jaran Desert', category: 'natural', latitude: 40.0725, longitude: 102.21, matchRadiusM: 60000, wikidataId: 'Q939033', isUnesco: true }, // WHS 1638, 2024
  { countryCode: 'CN', name: 'Beijing Central Axis', category: 'site', latitude: 39.89964, longitude: 116.39161, matchRadiusM: 1500, wikidataId: 'Q6112171', isUnesco: true }, // WHS 1714, 2024
  { countryCode: 'CN', name: 'Chengde Mountain Resort', category: 'site', latitude: 40.9875, longitude: 117.9375, matchRadiusM: 1500, wikidataId: 'Q1046818', isUnesco: true }, // WHS 703, 1994
  { countryCode: 'CN', name: 'Chengjiang Fossil Site', category: 'park', latitude: 24.66889, longitude: 102.97722, matchRadiusM: 5000, wikidataId: 'Q3485434', isUnesco: true }, // WHS 1388, 2012
  { countryCode: 'CN', name: 'China Danxia (Mount Danxia)', category: 'range', latitude: 25.03194, longitude: 113.74611, matchRadiusM: 10000, wikidataId: 'Q1165197', isUnesco: true }, // WHS 1335, 2010; site Q1286650
  { countryCode: 'CN', name: 'Classical Gardens of Suzhou', category: 'site', latitude: 31.32667, longitude: 120.62556, matchRadiusM: 5000, wikidataId: 'Q1144337', isUnesco: true }, // WHS 813, 1997
  { countryCode: 'CN', name: 'Dazu Rock Carvings', category: 'site', latitude: 29.71333, longitude: 105.70694, matchRadiusM: 15000, wikidataId: 'Q651278', isUnesco: true }, // WHS 912, 1999
  { countryCode: 'CN', name: 'Fanjingshan', category: 'park', latitude: 27.88333, longitude: 108.76667, matchRadiusM: 13000, wikidataId: 'Q24434043', isUnesco: true }, // WHS 1559, 2018
  { countryCode: 'CN', name: 'Forbidden City', category: 'building', latitude: 39.91583, longitude: 116.39083, matchRadiusM: 1000, wikidataId: 'Q80290', isUnesco: true }, // WHS 439, 1987; site Q4920250
  { countryCode: 'CN', name: 'Fujian Tulou', category: 'site', latitude: 24.6587, longitude: 116.975, matchRadiusM: 15000, wikidataId: 'Q718001', isUnesco: true }, // WHS 1113, 2008
  { countryCode: 'CN', name: 'Grand Canal', category: 'site', latitude: 30.26139, longitude: 120.22389, matchRadiusM: 10000, wikidataId: 'Q31347', isUnesco: true }, // WHS 1443, 2014
  { countryCode: 'CN', name: 'Historic Centre of Macao', category: 'old town', latitude: 22.191, longitude: 113.536, matchRadiusM: 2000, wikidataId: 'Q2601433', isUnesco: true }, // WHS 1110, 2005
  { countryCode: 'CN', name: 'Historic Monuments of Dengfeng', category: 'site', latitude: 34.45875, longitude: 113.06772, matchRadiusM: 14000, wikidataId: 'Q5934942', isUnesco: true }, // WHS 1305, 2010
  { countryCode: 'CN', name: 'Hoh Xil', category: 'park', latitude: 35.15, longitude: 91, matchRadiusM: 60000, wikidataId: 'Q1790760', isUnesco: true }, // WHS 1540, 2017
  { countryCode: 'CN', name: 'Honghe Hani Rice Terraces', category: 'site', latitude: 23.11719, longitude: 102.7377, matchRadiusM: 9000, wikidataId: 'Q11605230', isUnesco: true }, // WHS 1111, 2013
  { countryCode: 'CN', name: 'Huanglong', category: 'park', latitude: 32.74076, longitude: 103.83108, matchRadiusM: 17000, wikidataId: 'Q4107', isUnesco: true }, // WHS 638, 1992
  { countryCode: 'CN', name: 'Hubei Shennongjia', category: 'park', latitude: 31.5, longitude: 110.333, matchRadiusM: 18000, wikidataId: 'Q3457361', isUnesco: true }, // WHS 1509, 2016
  { countryCode: 'CN', name: 'Jingdezhen Porcelain Sites', category: 'site', latitude: 29.29722, longitude: 117.20194, matchRadiusM: 1500, wikidataId: 'Q140693109', isUnesco: true }, // WHS 1765, 2026
  { countryCode: 'CN', name: 'Jingmai Mountain Tea Forests', category: 'park', latitude: 22.20129, longitude: 100.02642, matchRadiusM: 20000, wikidataId: 'Q48928978', isUnesco: true }, // WHS 1665, 2023
  { countryCode: 'CN', name: 'Jiuzhaigou Valley', category: 'park', latitude: 33.2, longitude: 103.9, matchRadiusM: 18000, wikidataId: 'Q4111', isUnesco: true }, // WHS 637, 1992
  { countryCode: 'CN', name: 'Kaiping Diaolou and Villages', category: 'site', latitude: 22.26181, longitude: 112.52078, matchRadiusM: 15000, wikidataId: 'Q16303641', isUnesco: true }, // WHS 1112, 2007
  { countryCode: 'CN', name: 'Koguryo Capital Cities and Tombs', category: 'site', latitude: 41.15694, longitude: 126.18722, matchRadiusM: 15000, wikidataId: 'Q134873', isUnesco: true }, // WHS 1135, 2004
  { countryCode: 'CN', name: 'Kulangsu', category: 'island', latitude: 24.4475, longitude: 118.06194, matchRadiusM: 3000, wikidataId: 'Q1025339', isUnesco: true }, // WHS 1541, 2017
  { countryCode: 'CN', name: 'Liangzhu City', category: 'old town', latitude: 30.39667, longitude: 119.98528, matchRadiusM: 5000, wikidataId: 'Q15904183', isUnesco: true }, // WHS 1592, 2019
  { countryCode: 'CN', name: 'Longmen Grottoes', category: 'site', latitude: 34.55556, longitude: 112.46972, matchRadiusM: 1400, wikidataId: 'Q273834', isUnesco: true }, // WHS 1003, 2000
  { countryCode: 'CN', name: 'Lushan National Park', category: 'park', latitude: 29.56667, longitude: 115.96667, matchRadiusM: 20000, wikidataId: 'Q4047', isUnesco: true }, // WHS 778, 1996
  { countryCode: 'CN', name: 'Ming and Qing Imperial Tombs (Ming Tombs)', category: 'site', latitude: 40.25333, longitude: 116.2175, matchRadiusM: 2000, wikidataId: 'Q41135', isUnesco: true }, // WHS 1004, 2000; site Q817164
  { countryCode: 'CN', name: 'Mogao Caves', category: 'natural', latitude: 40.03722, longitude: 94.80417, matchRadiusM: 5000, wikidataId: 'Q43286', isUnesco: true }, // WHS 440, 1987
  { countryCode: 'CN', name: 'Mount Emei and Leshan Giant Buddha', category: 'site', latitude: 29.5449, longitude: 103.76925, matchRadiusM: 8500, wikidataId: 'Q16914686', isUnesco: true }, // WHS 779, 1996
  { countryCode: 'CN', name: 'Mount Huangshan', category: 'range', latitude: 30.125, longitude: 118.16667, matchRadiusM: 10000, wikidataId: 'Q36034', isUnesco: true }, // WHS 547, 1990
  { countryCode: 'CN', name: 'Mount Qingcheng and Dujiangyan', category: 'park', latitude: 30.9068, longitude: 103.5679, matchRadiusM: 20000, wikidataId: 'Q14230458', isUnesco: true }, // WHS 1001, 2000
  { countryCode: 'CN', name: 'Mount Sanqingshan', category: 'park', latitude: 28.95194, longitude: 118.05194, matchRadiusM: 32000, wikidataId: 'Q873358', isUnesco: true }, // WHS 1292, 2008
  { countryCode: 'CN', name: 'Mount Tai', category: 'mountain', latitude: 36.26667, longitude: 117.1, matchRadiusM: 11000, wikidataId: 'Q216059', isUnesco: true }, // WHS 437, 1987
  { countryCode: 'CN', name: 'Mount Wutai', category: 'mountain', latitude: 39.08139, longitude: 113.56694, matchRadiusM: 9500, wikidataId: 'Q120314', isUnesco: true }, // WHS 1279, 2009
  { countryCode: 'CN', name: 'Mount Wuyi', category: 'range', latitude: 27.71667, longitude: 117.68333, matchRadiusM: 14000, wikidataId: 'Q207692', isUnesco: true }, // WHS 911, 1999
  { countryCode: 'CN', name: 'Old Town of Lijiang', category: 'old town', latitude: 26.8667, longitude: 100.2333, matchRadiusM: 5000, wikidataId: 'Q65964838', isUnesco: true }, // WHS 811, 1997
  { countryCode: 'CN', name: 'Peking Man Site at Zhoukoudian', category: 'site', latitude: 39.68896, longitude: 115.92483, matchRadiusM: 1700, wikidataId: 'Q499552', isUnesco: true }, // WHS 449, 1987
  { countryCode: 'CN', name: 'Potala Palace', category: 'site', latitude: 29.65778, longitude: 91.11694, matchRadiusM: 2500, wikidataId: 'Q71229', isUnesco: true }, // WHS 707, 1994
  { countryCode: 'CN', name: 'Quanzhou', category: 'site', latitude: 24.71028, longitude: 118.44417, matchRadiusM: 15000, wikidataId: 'Q47001746', isUnesco: true }, // WHS 1561, 2021
  { countryCode: 'CN', name: 'Sichuan Giant Panda Sanctuaries', category: 'park', latitude: 30.83333, longitude: 103, matchRadiusM: 49000, wikidataId: 'Q629902', isUnesco: true }, // WHS 1213, 2006
  { countryCode: 'CN', name: 'Silk Roads (Giant Wild Goose Pagoda)', category: 'building', latitude: 34.21977, longitude: 108.95933, matchRadiusM: 400, wikidataId: 'Q1047061', isUnesco: true }, // WHS 1442, 2014; site Q17277933
  { countryCode: 'CN', name: 'South China Karst (Guilin)', category: 'natural', latitude: 25.0022, longitude: 110.4211, matchRadiusM: 10000, wikidataId: 'Q65966782', isUnesco: true }, // WHS 1248, 2007; site Q853364
  { countryCode: 'CN', name: 'Summer Palace', category: 'building', latitude: 39.9975, longitude: 116.2689, matchRadiusM: 1400, wikidataId: 'Q4132', isUnesco: true }, // WHS 880, 1998
  { countryCode: 'CN', name: 'Temple of Confucius, Qufu', category: 'site', latitude: 35.59651, longitude: 116.98445, matchRadiusM: 1100, wikidataId: 'Q1038473', isUnesco: true }, // WHS 704, 1994
  { countryCode: 'CN', name: 'Temple of Heaven', category: 'building', latitude: 39.8822, longitude: 116.4066, matchRadiusM: 1200, wikidataId: 'Q125445', isUnesco: true }, // WHS 881, 1998
  { countryCode: 'CN', name: 'Terracotta Army and Qin Mausoleum', category: 'site', latitude: 34.38167, longitude: 109.25389, matchRadiusM: 2500, wikidataId: 'Q910180', isUnesco: true }, // WHS 441, 1987
  { countryCode: 'CN', name: 'Three Parallel Rivers of Yunnan', category: 'park', latitude: 27.895, longitude: 98.40639, matchRadiusM: 60000, wikidataId: 'Q575035', isUnesco: true }, // WHS 1083, 2003
  { countryCode: 'CN', name: 'Tusi Sites (Laosicheng)', category: 'site', latitude: 29.01576, longitude: 109.93527, matchRadiusM: 1800, wikidataId: 'Q20687839', isUnesco: true }, // WHS 1474, 2015; site Q19852428
  { countryCode: 'CN', name: 'West Lake, Hangzhou', category: 'site', latitude: 30.2375, longitude: 120.14083, matchRadiusM: 4000, wikidataId: 'Q15660376', isUnesco: true }, // WHS 1334, 2011
  { countryCode: 'CN', name: 'Wudang Mountains', category: 'park', latitude: 32.44479, longitude: 111.05827, matchRadiusM: 20000, wikidataId: 'Q11124244', isUnesco: true }, // WHS 705, 1994
  { countryCode: 'CN', name: 'Wulingyuan (Zhangjiajie)', category: 'park', latitude: 29.34556, longitude: 110.46667, matchRadiusM: 11000, wikidataId: 'Q4187', isUnesco: true }, // WHS 640, 1992
  { countryCode: 'CN', name: 'Xanadu', category: 'old town', latitude: 42.35802, longitude: 116.18516, matchRadiusM: 1500, wikidataId: 'Q471765', isUnesco: true }, // WHS 1389, 2012
  { countryCode: 'CN', name: 'Xidi and Hongcun', category: 'park', latitude: 29.90444, longitude: 117.9875, matchRadiusM: 12000, wikidataId: 'Q15224718', isUnesco: true }, // WHS 1002, 2000
  { countryCode: 'CN', name: 'Xinjiang Tianshan (Bogda)', category: 'park', latitude: 43.8333, longitude: 88.2867, matchRadiusM: 14000, wikidataId: 'Q65967165', isUnesco: true }, // WHS 1414, 2013; site Q17993813
  { countryCode: 'CN', name: 'Xixia Imperial Tombs', category: 'site', latitude: 38.43503, longitude: 105.98717, matchRadiusM: 4500, wikidataId: 'Q1069411', isUnesco: true }, // WHS 1736, 2025
  { countryCode: 'CN', name: 'Yellow Sea–Bohai Gulf Bird Sanctuaries', category: 'park', latitude: 32.9319, longitude: 121.0168, matchRadiusM: 19000, wikidataId: 'Q66057620', isUnesco: true }, // WHS 1606, 2019
  { countryCode: 'CN', name: 'Yin Xu', category: 'old town', latitude: 36.1225, longitude: 114.31861, matchRadiusM: 1500, wikidataId: 'Q464904', isUnesco: true }, // WHS 1114, 2006
  { countryCode: 'CN', name: 'Yungang Grottoes', category: 'site', latitude: 40.10972, longitude: 113.12222, matchRadiusM: 1500, wikidataId: 'Q308805', isUnesco: true }, // WHS 1039, 2001
  { countryCode: 'CN', name: 'Zuojiang Huashan Rock Art', category: 'natural', latitude: 22.24833, longitude: 107.04228, matchRadiusM: 15000, wikidataId: 'Q1632877', isUnesco: true }, // WHS 1508, 2016
  { countryCode: 'CO', name: 'Cartagena Walled City and Fortresses', category: 'site', latitude: 10.41667, longitude: -75.53333, matchRadiusM: 1500, wikidataId: 'Q6091925', isUnesco: true }, // WHS 285, 1984
  { countryCode: 'CO', name: 'Chiribiquete National Park', category: 'park', latitude: 0.70061, longitude: -72.8054, matchRadiusM: 60000, wikidataId: 'Q2603196', isUnesco: true }, // WHS 1174, 2018
  { countryCode: 'CO', name: 'Coffee Cultural Landscape (Salento)', category: 'site', latitude: 4.63722, longitude: -75.57083, matchRadiusM: 15000, wikidataId: 'Q1576707', isUnesco: true }, // WHS 1121, 2011; site Q18417667
  { countryCode: 'CO', name: 'Los Katíos National Park', category: 'park', latitude: 7.8, longitude: -77.15, matchRadiusM: 18000, wikidataId: 'Q305169', isUnesco: true }, // WHS 711, 1994
  { countryCode: 'CO', name: 'Malpelo Sanctuary', category: 'park', latitude: 4, longitude: -81.6, matchRadiusM: 60000, wikidataId: 'Q108379504', isUnesco: true }, // WHS 1216, 2006
  { countryCode: 'CO', name: 'San Agustín Archaeological Park', category: 'site', latitude: 1.88444, longitude: -76.29611, matchRadiusM: 1500, wikidataId: 'Q2887224', isUnesco: true }, // WHS 744, 1995
  { countryCode: 'CO', name: 'Santa Cruz de Mompox', category: 'old town', latitude: 9.24047, longitude: -74.42308, matchRadiusM: 1500, wikidataId: 'Q8343767', isUnesco: true }, // WHS 742, 1995
  { countryCode: 'CO', name: 'Tierradentro', category: 'site', latitude: 2.583, longitude: -76.033, matchRadiusM: 1500, wikidataId: 'Q179506', isUnesco: true }, // WHS 743, 1995
  { countryCode: 'KM', name: 'Medinas of the Comoros Sultanates', category: 'old town', latitude: -11.7036, longitude: 43.25272, matchRadiusM: 1500, wikidataId: 'Q65724639', isUnesco: true }, // WHS 1768, 2026
  { countryCode: 'CR', name: 'Area de Conservación Guanacaste', category: 'park', latitude: 10.85, longitude: -85.61667, matchRadiusM: 26000, wikidataId: 'Q775154', isUnesco: true }, // WHS 928, 1999
  { countryCode: 'CR', name: 'Cocos Island National Park', category: 'park', latitude: 5.53333, longitude: -87.0667, matchRadiusM: 30000, wikidataId: 'Q6062995', isUnesco: true }, // WHS 820, 1997
  { countryCode: 'CR', name: 'Talamanca Range–La Amistad', category: 'park', latitude: 9.4069, longitude: -82.9386, matchRadiusM: 51000, wikidataId: 'Q6106226', isUnesco: true }, // WHS 205, 1983
  { countryCode: 'CI', name: 'Comoé National Park', category: 'park', latitude: 9.16361, longitude: -3.7725, matchRadiusM: 60000, wikidataId: 'Q501344', isUnesco: true }, // WHS 227, 1983
  { countryCode: 'CI', name: 'Grand-Bassam', category: 'old town', latitude: 5.1965, longitude: -3.7368, matchRadiusM: 1500, wikidataId: 'Q17990623', isUnesco: true }, // WHS 1322, 2012
  { countryCode: 'CI', name: 'Mount Nimba Nature Reserve', category: 'park', latitude: 7.603, longitude: -8.391, matchRadiusM: 9000, wikidataId: 'Q924276', isUnesco: true }, // WHS 155, 1981
  { countryCode: 'CI', name: 'Sudanese-Style Mosques (Kong)', category: 'building', latitude: 9.1492, longitude: -4.60945, matchRadiusM: 300, wikidataId: 'Q2311205', isUnesco: true }, // WHS 1648, 2021; site Q65725484
  { countryCode: 'CI', name: 'Taï National Park', category: 'park', latitude: 5.75, longitude: -7.12, matchRadiusM: 39000, wikidataId: 'Q328577', isUnesco: true }, // WHS 195, 1982
  { countryCode: 'HR', name: "Diocletian's Palace, Split", category: 'old town', latitude: 43.50833, longitude: 16.43889, matchRadiusM: 1000, wikidataId: 'Q17132416', isUnesco: true }, // WHS 97, 1979
  { countryCode: 'HR', name: 'Euphrasian Basilica, Poreč', category: 'old town', latitude: 45.22861, longitude: 13.59361, matchRadiusM: 1000, wikidataId: 'Q645105', isUnesco: true }, // WHS 809, 1997
  { countryCode: 'HR', name: 'Historic City of Trogir', category: 'park', latitude: 43.5125, longitude: 16.25167, matchRadiusM: 20000, wikidataId: 'Q17132483', isUnesco: true }, // WHS 810, 1997
  { countryCode: 'HR', name: 'Old City of Dubrovnik', category: 'old town', latitude: 42.6409, longitude: 18.1091, matchRadiusM: 2000, wikidataId: 'Q910661', isUnesco: true }, // WHS 95, 1979
  { countryCode: 'HR', name: 'Šibenik Cathedral', category: 'building', latitude: 43.73556, longitude: 15.88917, matchRadiusM: 300, wikidataId: 'Q391973', isUnesco: true }, // WHS 963, 2000
  { countryCode: 'HR', name: 'Stari Grad Plain', category: 'site', latitude: 43.18167, longitude: 16.63861, matchRadiusM: 2500, wikidataId: 'Q614212', isUnesco: true }, // WHS 1240, 2008
  { countryCode: 'CU', name: 'Alejandro de Humboldt National Park', category: 'park', latitude: 20.49675, longitude: -74.8579, matchRadiusM: 18000, wikidataId: 'Q48153', isUnesco: true }, // WHS 839, 2001
  { countryCode: 'CU', name: 'Desembarco del Granma National Park', category: 'park', latitude: 19.88333, longitude: -77.63333, matchRadiusM: 12000, wikidataId: 'Q909755', isUnesco: true }, // WHS 889, 1999
  { countryCode: 'CU', name: 'First Coffee Plantations of Cuba', category: 'site', latitude: 20.03, longitude: -75.3914, matchRadiusM: 20000, wikidataId: 'Q636714', isUnesco: true }, // WHS 1008, 2000
  { countryCode: 'CU', name: 'Historic Centre of Camagüey', category: 'old town', latitude: 22.1424, longitude: -80.4531, matchRadiusM: 1500, wikidataId: 'Q65122987', isUnesco: true }, // WHS 1270, 2008
  { countryCode: 'CU', name: 'Historic Centre of Cienfuegos', category: 'old town', latitude: 22.14556, longitude: -80.43639, matchRadiusM: 1500, wikidataId: 'Q8343758', isUnesco: true }, // WHS 1202, 2005
  { countryCode: 'CU', name: 'San Pedro de la Roca Castle', category: 'building', latitude: 19.96871, longitude: -75.8703, matchRadiusM: 900, wikidataId: 'Q910189', isUnesco: true }, // WHS 841, 1997
  { countryCode: 'CU', name: 'Trinidad and Valle de los Ingenios', category: 'site', latitude: 21.80306, longitude: -79.98444, matchRadiusM: 14000, wikidataId: 'Q15819677', isUnesco: true }, // WHS 460, 1988
  { countryCode: 'CU', name: 'Viñales Valley', category: 'natural', latitude: 22.61667, longitude: -83.71667, matchRadiusM: 5000, wikidataId: 'Q48108', isUnesco: true }, // WHS 840, 1999
  { countryCode: 'CW', name: 'Historic Willemstad', category: 'old town', latitude: 12.10614, longitude: -68.9342, matchRadiusM: 1500, wikidataId: 'Q17240216', isUnesco: true }, // WHS 819, 1997
  { countryCode: 'CY', name: 'Choirokoitia', category: 'site', latitude: 34.79673, longitude: 33.34372, matchRadiusM: 1000, wikidataId: 'Q385086', isUnesco: true }, // WHS 848, 1998
  { countryCode: 'CY', name: 'Painted Churches of Troodos', category: 'site', latitude: 34.92028, longitude: 33.09583, matchRadiusM: 15000, wikidataId: 'Q462702', isUnesco: true }, // WHS 351, 1985
  { countryCode: 'CZ', name: 'Český Krumlov', category: 'old town', latitude: 48.81667, longitude: 14.31667, matchRadiusM: 1500, wikidataId: 'Q64636277', isUnesco: true }, // WHS 617, 1992
  { countryCode: 'CZ', name: 'Erzgebirge Mining Region', category: 'site', latitude: 50.4065, longitude: 12.8373, matchRadiusM: 15000, wikidataId: 'Q1945612', isUnesco: true }, // WHS 1478, 2019
  { countryCode: 'CZ', name: 'Historic Centre of Prague', category: 'old town', latitude: 50, longitude: 14.56, matchRadiusM: 5000, wikidataId: 'Q64637410', isUnesco: true }, // WHS 616, 1992
  { countryCode: 'CZ', name: 'Holašovice', category: 'site', latitude: 48.96667, longitude: 14.26667, matchRadiusM: 1600, wikidataId: 'Q826452', isUnesco: true }, // WHS 861, 1998
  { countryCode: 'CZ', name: 'Holy Trinity Column, Olomouc', category: 'site', latitude: 49.59402, longitude: 17.25049, matchRadiusM: 1000, wikidataId: 'Q742362', isUnesco: true }, // WHS 859, 2000
  { countryCode: 'CZ', name: 'Jewish Quarter of Třebíč', category: 'site', latitude: 49.2172, longitude: 15.8789, matchRadiusM: 1000, wikidataId: 'Q16988075', isUnesco: true }, // WHS 1078, 2003
  { countryCode: 'CZ', name: 'Kladruby nad Labem Stud', category: 'site', latitude: 50.0567, longitude: 15.4843, matchRadiusM: 2500, wikidataId: 'Q64677110', isUnesco: true }, // WHS 1589, 2019
  { countryCode: 'CZ', name: 'Kroměříž Gardens and Castle', category: 'site', latitude: 49.29717, longitude: 17.38143, matchRadiusM: 1400, wikidataId: 'Q64642132', isUnesco: true }, // WHS 860, 1998
  { countryCode: 'CZ', name: 'Kutná Hora', category: 'site', latitude: 49.95, longitude: 15.26667, matchRadiusM: 2500, wikidataId: 'Q17117941', isUnesco: true }, // WHS 732, 1995
  { countryCode: 'CZ', name: 'Lednice-Valtice', category: 'site', latitude: 48.7758, longitude: 16.775, matchRadiusM: 8500, wikidataId: 'Q735278', isUnesco: true }, // WHS 763, 1996
  { countryCode: 'CZ', name: 'Litomyšl Castle', category: 'building', latitude: 49.87344, longitude: 16.31265, matchRadiusM: 300, wikidataId: 'Q2164885', isUnesco: true }, // WHS 901, 1999
  { countryCode: 'CZ', name: 'Telč', category: 'old town', latitude: 49.18333, longitude: 15.45, matchRadiusM: 1500, wikidataId: 'Q64640311', isUnesco: true }, // WHS 621, 1992
  { countryCode: 'CZ', name: 'Villa Tugendhat', category: 'building', latitude: 49.20722, longitude: 16.61583, matchRadiusM: 300, wikidataId: 'Q457453', isUnesco: true }, // WHS 1052, 2001
  { countryCode: 'CZ', name: 'Žatec and the Saaz Hops Landscape', category: 'old town', latitude: 50.32062, longitude: 13.61947, matchRadiusM: 5000, wikidataId: 'Q122898593', isUnesco: true }, // WHS 1558, 2023
  { countryCode: 'CZ', name: 'Zelená Hora Pilgrimage Church', category: 'building', latitude: 49.58, longitude: 15.94194, matchRadiusM: 300, wikidataId: 'Q752318', isUnesco: true }, // WHS 690, 1994
  { countryCode: 'CD', name: 'Garamba National Park', category: 'park', latitude: 4.19559, longitude: 29.48093, matchRadiusM: 48000, wikidataId: 'Q308893', isUnesco: true }, // WHS 136, 1980
  { countryCode: 'CD', name: 'Kahuzi-Biega National Park', category: 'park', latitude: -2.31481, longitude: 28.75867, matchRadiusM: 53000, wikidataId: 'Q457324', isUnesco: true }, // WHS 137, 1980
  { countryCode: 'CD', name: 'Okapi Wildlife Reserve', category: 'park', latitude: 2, longitude: 28.5, matchRadiusM: 60000, wikidataId: 'Q457304', isUnesco: true }, // WHS 718, 1996
  { countryCode: 'CD', name: 'Salonga National Park', category: 'park', latitude: -2, longitude: 21, matchRadiusM: 60000, wikidataId: 'Q328488', isUnesco: true }, // WHS 280, 1984
  { countryCode: 'CD', name: 'Virunga National Park', category: 'park', latitude: -0.5, longitude: 29.5, matchRadiusM: 60000, wikidataId: 'Q223589', isUnesco: true }, // WHS 63, 1979
  { countryCode: 'DK', name: 'Bony Fish Fossils of the Limfjord', category: 'park', latitude: 56.89565, longitude: 8.75196, matchRadiusM: 20000, wikidataId: 'Q127521592', isUnesco: true }, // WHS 1758, 2026
  { countryCode: 'DK', name: 'Jelling Mounds and Runic Stones', category: 'site', latitude: 55.75651, longitude: 9.41974, matchRadiusM: 1500, wikidataId: 'Q4993586', isUnesco: true }, // WHS 697, 1994
  { countryCode: 'DK', name: 'Kronborg Castle', category: 'building', latitude: 56.03861, longitude: 12.62194, matchRadiusM: 500, wikidataId: 'Q189358', isUnesco: true }, // WHS 696, 2000
  { countryCode: 'DK', name: 'Møns Klint', category: 'park', latitude: 54.96417, longitude: 12.55222, matchRadiusM: 20000, wikidataId: 'Q1517331', isUnesco: true }, // WHS 1728, 2025
  { countryCode: 'DK', name: 'Moravian Church Settlements', category: 'old town', latitude: 55.35556, longitude: 9.48139, matchRadiusM: 1500, wikidataId: 'Q128009257', isUnesco: true }, // WHS 1468, 2015
  { countryCode: 'DK', name: 'Par Force Hunting Landscape', category: 'site', latitude: 55.9136, longitude: 12.3578, matchRadiusM: 15000, wikidataId: 'Q10620357', isUnesco: true }, // WHS 1469, 2015
  { countryCode: 'DK', name: 'Roskilde Cathedral', category: 'building', latitude: 55.64267, longitude: 12.08031, matchRadiusM: 300, wikidataId: 'Q209705', isUnesco: true }, // WHS 695, 1995
  { countryCode: 'DK', name: 'Stevns Klint', category: 'park', latitude: 55.2822, longitude: 12.45, matchRadiusM: 20000, wikidataId: 'Q1614152', isUnesco: true }, // WHS 1416, 2014
  { countryCode: 'DK', name: 'Viking-Age Ring Fortresses (Fyrkat)', category: 'site', latitude: 56.62324, longitude: 9.77045, matchRadiusM: 1500, wikidataId: 'Q1478633', isUnesco: true }, // WHS 1660, 2023; site Q64518271
  { countryCode: 'EC', name: 'Historic Centre of Cuenca', category: 'old town', latitude: -2.8979, longitude: -79.0049, matchRadiusM: 1500, wikidataId: 'Q8343759', isUnesco: true }, // WHS 863, 1999
  { countryCode: 'EC', name: 'Historic Centre of Quito', category: 'old town', latitude: -0.22, longitude: -78.51208, matchRadiusM: 1500, wikidataId: 'Q8343766', isUnesco: true }, // WHS 2, 1978
  { countryCode: 'EC', name: 'Sangay National Park', category: 'park', latitude: -1.83333, longitude: -78.33333, matchRadiusM: 36000, wikidataId: 'Q839603', isUnesco: true }, // WHS 260, 1983
  { countryCode: 'EG', name: 'Abu Mena', category: 'site', latitude: 30.84105, longitude: 29.66349, matchRadiusM: 1000, wikidataId: 'Q9278', isUnesco: true }, // WHS 90, 1979
  { countryCode: 'EG', name: 'Ancient Thebes (Luxor)', category: 'park', latitude: 25.72056, longitude: 32.61028, matchRadiusM: 5500, wikidataId: 'Q141298543', isUnesco: true }, // WHS 87, 1979
  { countryCode: 'EG', name: 'Historic Cairo', category: 'old town', latitude: 30.046, longitude: 31.2627, matchRadiusM: 5000, wikidataId: 'Q1100964', isUnesco: true }, // WHS 89, 1979
  { countryCode: 'EG', name: 'Nubian Monuments (Abu Simbel)', category: 'site', latitude: 22.33694, longitude: 31.62556, matchRadiusM: 1000, wikidataId: 'Q134140', isUnesco: true }, // WHS 88, 1979; site Q4923872
  { countryCode: 'EG', name: 'Saint Catherine Area', category: 'site', latitude: 28.55623, longitude: 33.97543, matchRadiusM: 17000, wikidataId: 'Q2468771', isUnesco: true }, // WHS 954, 2002
  { countryCode: 'EG', name: 'Wadi Al-Hitan (Whale Valley)', category: 'natural', latitude: 29.27083, longitude: 30.04389, matchRadiusM: 5500, wikidataId: 'Q501833', isUnesco: true }, // WHS 1186, 2005
  { countryCode: 'EE', name: 'Struve Geodetic Arc (Tartu Observatory)', category: 'building', latitude: 58.3788, longitude: 26.72011, matchRadiusM: 500, wikidataId: 'Q2346055', isUnesco: true }, // WHS 1187, 2005; site Q192243
  { countryCode: 'ET', name: 'Aksum', category: 'site', latitude: 14.13019, longitude: 38.71861, matchRadiusM: 2500, wikidataId: 'Q107183452', isUnesco: true }, // WHS 15, 1980
  { countryCode: 'ET', name: 'Bale Mountains National Park', category: 'park', latitude: 6.75, longitude: 39.75, matchRadiusM: 32000, wikidataId: 'Q804881', isUnesco: true }, // WHS 111, 2023
  { countryCode: 'ET', name: 'Fasil Ghebbi', category: 'building', latitude: 12.60806, longitude: 37.46972, matchRadiusM: 500, wikidataId: 'Q464695', isUnesco: true }, // WHS 19, 1979
  { countryCode: 'ET', name: 'Gedeo Cultural Landscape', category: 'site', latitude: 5.1167, longitude: 38.6667, matchRadiusM: 1500, wikidataId: 'Q65886125', isUnesco: true }, // WHS 1641, 2023
  { countryCode: 'ET', name: 'Harar Jugol', category: 'old town', latitude: 9.3091, longitude: 42.1372, matchRadiusM: 1500, wikidataId: 'Q20053321', isUnesco: true }, // WHS 1189, 2006
  { countryCode: 'ET', name: 'Konso Cultural Landscape', category: 'site', latitude: 5.25, longitude: 37.48306, matchRadiusM: 10000, wikidataId: 'Q63614908', isUnesco: true }, // WHS 1333, 2011
  { countryCode: 'ET', name: 'Lower Valley of the Awash', category: 'natural', latitude: 11.1, longitude: 40.5794, matchRadiusM: 5000, wikidataId: 'Q6153869', isUnesco: true }, // WHS 10, 1980
  { countryCode: 'ET', name: 'Lower Valley of the Omo', category: 'site', latitude: 5.372, longitude: 36.725, matchRadiusM: 1500, wikidataId: 'Q10942550', isUnesco: true }, // WHS 17, 1980
  { countryCode: 'ET', name: 'Melka Kunture', category: 'site', latitude: 8.7025, longitude: 38.60833, matchRadiusM: 1500, wikidataId: 'Q3063392', isUnesco: true }, // WHS 13, 2024
  { countryCode: 'ET', name: 'Simien Mountains National Park', category: 'park', latitude: 13.18333, longitude: 38.06667, matchRadiusM: 8000, wikidataId: 'Q504315', isUnesco: true }, // WHS 9, 1978
  { countryCode: 'ET', name: 'Tiya', category: 'site', latitude: 8.43492, longitude: 38.61211, matchRadiusM: 1500, wikidataId: 'Q6130080', isUnesco: true }, // WHS 12, 1980
  { countryCode: 'FJ', name: 'Levuka', category: 'old town', latitude: -17.68338, longitude: 178.83453, matchRadiusM: 1000, wikidataId: 'Q17304996', isUnesco: true }, // WHS 1399, 2013
  { countryCode: 'FI', name: 'Aalto Works (Finlandia Hall)', category: 'building', latitude: 60.17606, longitude: 24.93346, matchRadiusM: 500, wikidataId: 'Q1142522', isUnesco: true }, // WHS 1752, 2026; site Q127518238
  { countryCode: 'FI', name: 'Old Rauma', category: 'old town', latitude: 61.12827, longitude: 21.51321, matchRadiusM: 1500, wikidataId: 'Q828417', isUnesco: true }, // WHS 582, 1991
  { countryCode: 'FI', name: 'Petäjävesi Old Church', category: 'building', latitude: 62.25014, longitude: 25.18394, matchRadiusM: 300, wikidataId: 'Q435829', isUnesco: true }, // WHS 584, 1994
  { countryCode: 'FI', name: 'Sammallahdenmäki', category: 'site', latitude: 61.11767, longitude: 21.77517, matchRadiusM: 1500, wikidataId: 'Q239748', isUnesco: true }, // WHS 579, 1999
  { countryCode: 'FI', name: 'Verla Mill', category: 'site', latitude: 61.06199, longitude: 26.64002, matchRadiusM: 1000, wikidataId: 'Q217447', isUnesco: true }, // WHS 751, 1996
  { countryCode: 'FR', name: 'Amiens Cathedral', category: 'building', latitude: 49.89457, longitude: 2.3021, matchRadiusM: 300, wikidataId: 'Q106934', isUnesco: true }, // WHS 162, 1981
  { countryCode: 'FR', name: 'Arles Roman and Romanesque Monuments', category: 'site', latitude: 43.67764, longitude: 4.63069, matchRadiusM: 1000, wikidataId: 'Q1279597', isUnesco: true }, // WHS 164, 1981
  { countryCode: 'FR', name: 'Bordeaux, Port of the Moon', category: 'old town', latitude: 44.83889, longitude: -0.57222, matchRadiusM: 1500, wikidataId: 'Q2249113', isUnesco: true }, // WHS 1256, 2007
  { countryCode: 'FR', name: 'Bourges Cathedral', category: 'building', latitude: 47.08222, longitude: 2.39917, matchRadiusM: 300, wikidataId: 'Q207985', isUnesco: true }, // WHS 635, 1992
  { countryCode: 'FR', name: 'Camino de Santiago, France (Saint-Jacques Tower)', category: 'building', latitude: 48.85776, longitude: 2.34878, matchRadiusM: 500, wikidataId: 'Q1431547', isUnesco: true }, // WHS 868, 1998; site Q2962473
  { countryCode: 'FR', name: 'Canal du Midi', category: 'site', latitude: 43.61111, longitude: 1.41833, matchRadiusM: 2500, wikidataId: 'Q202494', isUnesco: true }, // WHS 770, 1996
  { countryCode: 'FR', name: 'Causses and Cévennes', category: 'site', latitude: 44.2203, longitude: 3.4731, matchRadiusM: 37000, wikidataId: 'Q10444176', isUnesco: true }, // WHS 1153, 2011
  { countryCode: 'FR', name: 'Chaîne des Puys', category: 'park', latitude: 45.77939, longitude: 2.96511, matchRadiusM: 9000, wikidataId: 'Q64832437', isUnesco: true }, // WHS 1434, 2018
  { countryCode: 'FR', name: 'Champagne Hillsides, Houses and Cellars', category: 'site', latitude: 49.0775, longitude: 3.94611, matchRadiusM: 15000, wikidataId: 'Q20650698', isUnesco: true }, // WHS 1465, 2015
  { countryCode: 'FR', name: 'Chartres Cathedral', category: 'building', latitude: 48.44778, longitude: 1.48778, matchRadiusM: 300, wikidataId: 'Q180274', isUnesco: true }, // WHS 81, 1979
  { countryCode: 'FR', name: 'Chauvet Cave', category: 'natural', latitude: 44.38812, longitude: 4.41614, matchRadiusM: 1000, wikidataId: 'Q374096', isUnesco: true }, // WHS 1426, 2014
  { countryCode: 'FR', name: 'Cité de Carcassonne', category: 'building', latitude: 43.20644, longitude: 2.36379, matchRadiusM: 400, wikidataId: 'Q389269', isUnesco: true }, // WHS 345, 1997
  { countryCode: 'FR', name: 'Climats of Burgundy', category: 'site', latitude: 47.05806, longitude: 4.86444, matchRadiusM: 8000, wikidataId: 'Q20650612', isUnesco: true }, // WHS 1425, 2015
  { countryCode: 'FR', name: 'Cordouan Lighthouse', category: 'building', latitude: 45.58632, longitude: -1.17333, matchRadiusM: 1500, wikidataId: 'Q199234', isUnesco: true }, // WHS 1625, 2021
  { countryCode: 'FR', name: 'D-Day Landing Beaches', category: 'site', latitude: 49.37085, longitude: -0.87959, matchRadiusM: 1500, wikidataId: 'Q3390891', isUnesco: true }, // WHS 1581, 2026
  { countryCode: 'FR', name: 'Decorated Caves of the Vézère Valley', category: 'natural', latitude: 45.0575, longitude: 1.17, matchRadiusM: 15000, wikidataId: 'Q463159', isUnesco: true }, // WHS 85, 1979
  { countryCode: 'FR', name: 'Episcopal City of Albi', category: 'old town', latitude: 43.9283, longitude: 2.1425, matchRadiusM: 1500, wikidataId: 'Q1778266', isUnesco: true }, // WHS 1337, 2010
  { countryCode: 'FR', name: 'Fontenay Abbey', category: 'building', latitude: 47.63966, longitude: 4.38933, matchRadiusM: 400, wikidataId: 'Q464918', isUnesco: true }, // WHS 165, 1981
  { countryCode: 'FR', name: 'Fortifications of Vauban (Besançon)', category: 'building', latitude: 47.23139, longitude: 6.0325, matchRadiusM: 500, wikidataId: 'Q1329976', isUnesco: true }, // WHS 1283, 2008; site Q833781
  { countryCode: 'FR', name: 'French Austral Lands and Seas', category: 'park', latitude: -49.1397, longitude: 69.5811, matchRadiusM: 20000, wikidataId: 'Q3457508', isUnesco: true }, // WHS 1603, 2019
  { countryCode: 'FR', name: 'Gulf of Porto', category: 'park', latitude: 42.32519, longitude: 8.62883, matchRadiusM: 7500, wikidataId: 'Q15728421', isUnesco: true }, // WHS 258, 1983
  { countryCode: 'FR', name: 'Historic Centre of Avignon', category: 'old town', latitude: 43.95278, longitude: 4.80611, matchRadiusM: 1500, wikidataId: 'Q15241016', isUnesco: true }, // WHS 228, 1995
  { countryCode: 'FR', name: 'Historic Site of Lyon', category: 'old town', latitude: 45.76306, longitude: 4.82806, matchRadiusM: 1500, wikidataId: 'Q8399', isUnesco: true }, // WHS 872, 1998
  { countryCode: 'FR', name: "Le Corbusier's Architecture (Villa Savoye)", category: 'building', latitude: 48.92444, longitude: 2.02833, matchRadiusM: 500, wikidataId: 'Q940746', isUnesco: true }, // WHS 1321, 2016; site Q55619850
  { countryCode: 'FR', name: 'Le Havre', category: 'old town', latitude: 49.4891, longitude: 0.11522, matchRadiusM: 1500, wikidataId: 'Q2944797', isUnesco: true }, // WHS 1181, 2005
  { countryCode: 'FR', name: 'Loire Valley (Chambord)', category: 'building', latitude: 47.61611, longitude: 1.51722, matchRadiusM: 1000, wikidataId: 'Q205367', isUnesco: true }, // WHS 933, 2000; site Q2789507
  { countryCode: 'FR', name: 'Maison Carrée', category: 'site', latitude: 43.83819, longitude: 4.35611, matchRadiusM: 1500, wikidataId: 'Q677659', isUnesco: true }, // WHS 1569, 2023
  { countryCode: 'FR', name: 'Megaliths of Carnac', category: 'site', latitude: 47.61611, longitude: -3.08722, matchRadiusM: 15000, wikidataId: 'Q135287050', isUnesco: true }, // WHS 1725, 2025
  { countryCode: 'FR', name: 'Mont-Saint-Michel', category: 'site', latitude: 48.63556, longitude: -1.51056, matchRadiusM: 6000, wikidataId: 'Q17117964', isUnesco: true }, // WHS 80, 1979
  { countryCode: 'FR', name: 'Nice, Winter Resort of the Riviera', category: 'old town', latitude: 43.70169, longitude: 7.27231, matchRadiusM: 1500, wikidataId: 'Q108094935', isUnesco: true }, // WHS 1635, 2021
  { countryCode: 'FR', name: 'Nord-Pas de Calais Mining Basin (Lewarde)', category: 'building', latitude: 50.3317, longitude: 3.17262, matchRadiusM: 400, wikidataId: 'Q2945654', isUnesco: true }, // WHS 1360, 2012; site Q392215
  { countryCode: 'FR', name: 'Palace of Fontainebleau', category: 'building', latitude: 48.40222, longitude: 2.70056, matchRadiusM: 1000, wikidataId: 'Q201428', isUnesco: true }, // WHS 160, 1981
  { countryCode: 'FR', name: 'Palace of Versailles', category: 'site', latitude: 48.805, longitude: 2.11944, matchRadiusM: 2500, wikidataId: 'Q3034552', isUnesco: true }, // WHS 83, 1979
  { countryCode: 'FR', name: 'Paris, Banks of the Seine', category: 'old town', latitude: 48.85, longitude: 2.35889, matchRadiusM: 1500, wikidataId: 'Q2233532', isUnesco: true }, // WHS 600, 1991
  { countryCode: 'FR', name: 'Place Stanislas, Nancy', category: 'site', latitude: 48.69361, longitude: 6.18333, matchRadiusM: 1000, wikidataId: 'Q15728409', isUnesco: true }, // WHS 229, 1983
  { countryCode: 'FR', name: 'Pont du Gard', category: 'building', latitude: 43.9473, longitude: 4.5355, matchRadiusM: 300, wikidataId: 'Q189764', isUnesco: true }, // WHS 344, 1985
  { countryCode: 'FR', name: 'Provins', category: 'site', latitude: 48.55972, longitude: 3.29889, matchRadiusM: 1000, wikidataId: 'Q28827968', isUnesco: true }, // WHS 873, 2001
  { countryCode: 'FR', name: 'Pyrénées – Mont Perdu', category: 'park', latitude: 42.65, longitude: 0.05, matchRadiusM: 12000, wikidataId: 'Q3411434', isUnesco: true }, // WHS 773, 1997
  { countryCode: 'FR', name: 'Reims Cathedral', category: 'site', latitude: 49.25333, longitude: 4.03278, matchRadiusM: 1800, wikidataId: 'Q16912637', isUnesco: true }, // WHS 601, 1991
  { countryCode: 'FR', name: 'Roman Theatre of Orange', category: 'site', latitude: 44.13572, longitude: 4.80842, matchRadiusM: 1300, wikidataId: 'Q15726321', isUnesco: true }, // WHS 163, 1981
  { countryCode: 'FR', name: 'Royal Capetian Fortresses (Quéribus)', category: 'building', latitude: 42.83667, longitude: 2.62167, matchRadiusM: 500, wikidataId: 'Q667763', isUnesco: true }, // WHS 1755, 2026; site Q140698900
  { countryCode: 'FR', name: 'Royal Saltworks of Arc-et-Senans', category: 'site', latitude: 46.9375, longitude: 5.87639, matchRadiusM: 13000, wikidataId: 'Q15726441', isUnesco: true }, // WHS 203, 1982
  { countryCode: 'FR', name: 'Saint-Émilion', category: 'site', latitude: 44.89472, longitude: 0.15528, matchRadiusM: 5000, wikidataId: 'Q2987951', isUnesco: true }, // WHS 932, 1999
  { countryCode: 'FR', name: 'Saint-Savin Abbey Church', category: 'building', latitude: 46.56477, longitude: 0.86597, matchRadiusM: 700, wikidataId: 'Q1774129', isUnesco: true }, // WHS 230, 1983
  { countryCode: 'FR', name: 'Strasbourg Grande-Île and Neustadt', category: 'site', latitude: 48.58444, longitude: 7.74889, matchRadiusM: 1100, wikidataId: 'Q55523908', isUnesco: true }, // WHS 495, 1988
  { countryCode: 'FR', name: 'Vézelay', category: 'site', latitude: 47.46639, longitude: 3.74833, matchRadiusM: 2000, wikidataId: 'Q64401449', isUnesco: true }, // WHS 84, 1979
  { countryCode: 'PF', name: 'Marquesas Islands', category: 'archipelago', latitude: -8.9, longitude: -139.6, matchRadiusM: 22000, wikidataId: 'Q172697', isUnesco: true }, // WHS 1707, 2024
  { countryCode: 'PF', name: 'Taputapuātea', category: 'site', latitude: -16.83611, longitude: -151.35917, matchRadiusM: 3500, wikidataId: 'Q3287362', isUnesco: true }, // WHS 1529, 2017
  { countryCode: 'GA', name: 'Ivindo National Park', category: 'park', latitude: 0.088, longitude: 12.63, matchRadiusM: 29000, wikidataId: 'Q9055979', isUnesco: true }, // WHS 1653, 2021
  { countryCode: 'GA', name: 'Lopé-Okanda', category: 'site', latitude: -0.5, longitude: 11.5, matchRadiusM: 26000, wikidataId: 'Q14223008', isUnesco: true }, // WHS 1147, 2007
  { countryCode: 'GM', name: 'Stone Circles of Senegambia (Wassu)', category: 'site', latitude: 13.7, longitude: -14.87, matchRadiusM: 1000, wikidataId: 'Q2946555', isUnesco: true }, // WHS 1226, 2006; site Q98769058
  { countryCode: 'GE', name: 'Colchic Rainforests (Mtirala)', category: 'park', latitude: 41.68419, longitude: 41.85986, matchRadiusM: 12000, wikidataId: 'Q1951559', isUnesco: true }, // WHS 1616, 2021; site Q107694185
  { countryCode: 'GE', name: 'Historical Monuments of Mtskheta', category: 'site', latitude: 41.84389, longitude: 44.71639, matchRadiusM: 1500, wikidataId: 'Q16946829', isUnesco: true }, // WHS 708, 1994
  { countryCode: 'GE', name: 'Upper Svaneti', category: 'site', latitude: 42.91639, longitude: 43.01139, matchRadiusM: 1500, wikidataId: 'Q47496765', isUnesco: true }, // WHS 709, 1996
  { countryCode: 'DE', name: 'Aachen Cathedral', category: 'building', latitude: 50.77475, longitude: 6.08392, matchRadiusM: 500, wikidataId: 'Q5908', isUnesco: true }, // WHS 3, 1978
  { countryCode: 'DE', name: 'Alpine Pile Dwellings (Lake Constance)', category: 'site', latitude: 47.6746, longitude: 9.12099, matchRadiusM: 15000, wikidataId: 'Q4580', isUnesco: true }, // WHS 1363, 2011
  { countryCode: 'DE', name: 'Augsburg Water Management System', category: 'site', latitude: 48.3655, longitude: 10.902, matchRadiusM: 1000, wikidataId: 'Q55249696', isUnesco: true }, // WHS 1580, 2019
  { countryCode: 'DE', name: 'Augustusburg and Falkenlust, Brühl', category: 'site', latitude: 50.8275, longitude: 6.90806, matchRadiusM: 1500, wikidataId: 'Q156292', isUnesco: true }, // WHS 288, 1984
  { countryCode: 'DE', name: 'Bamberg Old Town', category: 'old town', latitude: 49.89167, longitude: 10.89167, matchRadiusM: 1500, wikidataId: 'Q3936', isUnesco: true }, // WHS 624, 1993; site Q114559132
  { countryCode: 'DE', name: 'Bauhaus Sites (Dessau)', category: 'site', latitude: 51.8392, longitude: 12.2267, matchRadiusM: 1500, wikidataId: 'Q516770', isUnesco: true }, // WHS 729, 1996; site Q14863645
  { countryCode: 'DE', name: 'Bergpark Wilhelmshöhe', category: 'building', latitude: 51.3167, longitude: 9.4, matchRadiusM: 1200, wikidataId: 'Q447441', isUnesco: true }, // WHS 1413, 2013
  { countryCode: 'DE', name: 'Berlin Modernist Estates (Hufeisensiedlung)', category: 'site', latitude: 52.4475, longitude: 13.4486, matchRadiusM: 1000, wikidataId: 'Q644490', isUnesco: true }, // WHS 1239, 2008; site Q19094
  { countryCode: 'DE', name: 'Bremen Town Hall and Roland', category: 'site', latitude: 53.07597, longitude: 8.80747, matchRadiusM: 1500, wikidataId: 'Q15238169', isUnesco: true }, // WHS 1087, 2004
  { countryCode: 'DE', name: 'Classical Weimar', category: 'site', latitude: 50.98333, longitude: 11.31667, matchRadiusM: 2000, wikidataId: 'Q467763', isUnesco: true }, // WHS 846, 1998
  { countryCode: 'DE', name: 'Cologne Cathedral', category: 'building', latitude: 50.94139, longitude: 6.95833, matchRadiusM: 500, wikidataId: 'Q4176', isUnesco: true }, // WHS 292, 1996
  { countryCode: 'DE', name: 'Corvey Abbey', category: 'building', latitude: 51.77778, longitude: 9.41, matchRadiusM: 400, wikidataId: 'Q56004', isUnesco: true }, // WHS 1447, 2014
  { countryCode: 'DE', name: 'Dessau-Wörlitz Garden Realm', category: 'site', latitude: 51.8636, longitude: 12.2814, matchRadiusM: 10000, wikidataId: 'Q157543', isUnesco: true }, // WHS 534, 2000
  { countryCode: 'DE', name: 'Fagus Factory', category: 'building', latitude: 51.9837, longitude: 9.81256, matchRadiusM: 500, wikidataId: 'Q685476', isUnesco: true }, // WHS 1368, 2011
  { countryCode: 'DE', name: 'Hedeby and the Danevirke', category: 'site', latitude: 54.46194, longitude: 9.45411, matchRadiusM: 15000, wikidataId: 'Q55312553', isUnesco: true }, // WHS 1553, 2018
  { countryCode: 'DE', name: "Hildesheim Cathedral and St Michael's", category: 'site', latitude: 52.15278, longitude: 9.94389, matchRadiusM: 1500, wikidataId: 'Q9710075', isUnesco: true }, // WHS 187, 1985
  { countryCode: 'DE', name: 'Ice Age Caves of the Swabian Jura', category: 'park', latitude: 48.38778, longitude: 9.76556, matchRadiusM: 20000, wikidataId: 'Q19285921', isUnesco: true }, // WHS 1527, 2017
  { countryCode: 'DE', name: 'Jewish-Medieval Heritage of Erfurt', category: 'site', latitude: 50.97864, longitude: 11.02925, matchRadiusM: 1500, wikidataId: 'Q122745617', isUnesco: true }, // WHS 1656, 2023
  { countryCode: 'DE', name: 'Lorsch Abbey', category: 'building', latitude: 49.65369, longitude: 8.56858, matchRadiusM: 1200, wikidataId: 'Q157550', isUnesco: true }, // WHS 515, 1991
  { countryCode: 'DE', name: 'Lower German Limes (Xanten)', category: 'site', latitude: 51.6667, longitude: 6.45, matchRadiusM: 1500, wikidataId: 'Q464588', isUnesco: true }, // WHS 1631, 2021; site Q1265889
  { countryCode: 'DE', name: 'Lübeck', category: 'old town', latitude: 53.86667, longitude: 10.69167, matchRadiusM: 1500, wikidataId: 'Q15813909', isUnesco: true }, // WHS 272, 1987
  { countryCode: 'DE', name: 'Luther Memorials (Wittenberg Castle Church)', category: 'building', latitude: 51.86639, longitude: 12.63778, matchRadiusM: 300, wikidataId: 'Q661752', isUnesco: true }, // WHS 783, 1996; site Q2250035
  { countryCode: 'DE', name: 'Margravial Opera House, Bayreuth', category: 'building', latitude: 49.94434, longitude: 11.57866, matchRadiusM: 500, wikidataId: 'Q278908', isUnesco: true }, // WHS 1379, 2012
  { countryCode: 'DE', name: 'Mathildenhöhe Darmstadt', category: 'site', latitude: 49.87543, longitude: 8.6665, matchRadiusM: 1000, wikidataId: 'Q314730', isUnesco: true }, // WHS 1614, 2021
  { countryCode: 'DE', name: 'Maulbronn Monastery', category: 'building', latitude: 49.0011, longitude: 8.8129, matchRadiusM: 500, wikidataId: 'Q157886', isUnesco: true }, // WHS 546, 1993
  { countryCode: 'DE', name: 'Messel Pit', category: 'natural', latitude: 49.9175, longitude: 8.75667, matchRadiusM: 1000, wikidataId: 'Q639217', isUnesco: true }, // WHS 720, 1995
  { countryCode: 'DE', name: 'Museum Island', category: 'island', latitude: 52.52139, longitude: 13.39556, matchRadiusM: 3000, wikidataId: 'Q151963', isUnesco: true }, // WHS 896, 1999
  { countryCode: 'DE', name: 'Naumburg Cathedral', category: 'building', latitude: 51.15472, longitude: 11.80389, matchRadiusM: 500, wikidataId: 'Q5938', isUnesco: true }, // WHS 1470, 2018
  { countryCode: 'DE', name: 'Old Town of Regensburg', category: 'old town', latitude: 49.01722, longitude: 12.09694, matchRadiusM: 1500, wikidataId: 'Q1246833', isUnesco: true }, // WHS 1155, 2006
  { countryCode: 'DE', name: 'Palaces and Parks of Potsdam', category: 'site', latitude: 52.4, longitude: 13.03333, matchRadiusM: 8000, wikidataId: 'Q852427', isUnesco: true }, // WHS 532, 1990
  { countryCode: 'DE', name: 'Palaces of Ludwig II (Neuschwanstein)', category: 'building', latitude: 47.55749, longitude: 10.74944, matchRadiusM: 300, wikidataId: 'Q4152', isUnesco: true }, // WHS 1726, 2025; site Q64825541
  { countryCode: 'DE', name: 'Primeval Beech Forests of Europe (Jasmund)', category: 'park', latitude: 54.55, longitude: 13.65, matchRadiusM: 5000, wikidataId: 'Q679173', isUnesco: true }, // WHS 1133, 2007; site Q156011
  { countryCode: 'DE', name: 'Quedlinburg', category: 'old town', latitude: 51.78333, longitude: 11.15, matchRadiusM: 1400, wikidataId: 'Q10300241', isUnesco: true }, // WHS 535, 1994
  { countryCode: 'DE', name: 'Rammelsberg and Goslar', category: 'old town', latitude: 51.82, longitude: 10.34, matchRadiusM: 5000, wikidataId: 'Q10649093', isUnesco: true }, // WHS 623, 1992
  { countryCode: 'DE', name: 'Reichenau Island', category: 'island', latitude: 47.69306, longitude: 9.06306, matchRadiusM: 3000, wikidataId: 'Q156439', isUnesco: true }, // WHS 974, 2000
  { countryCode: 'DE', name: 'Roman Monuments of Trier', category: 'site', latitude: 49.75, longitude: 6.63306, matchRadiusM: 8000, wikidataId: 'Q279968', isUnesco: true }, // WHS 367, 1986
  { countryCode: 'DE', name: 'Schwerin Residence Ensemble', category: 'site', latitude: 53.62417, longitude: 11.41889, matchRadiusM: 1500, wikidataId: 'Q47037432', isUnesco: true }, // WHS 1705, 2024
  { countryCode: 'DE', name: 'ShUM Sites (Speyer)', category: 'old town', latitude: 49.3161, longitude: 8.43972, matchRadiusM: 1000, wikidataId: 'Q1570913', isUnesco: true }, // WHS 1636, 2021; site Q109706388
  { countryCode: 'DE', name: 'Speicherstadt and Chilehaus', category: 'old town', latitude: 53.54333, longitude: 9.99194, matchRadiusM: 1500, wikidataId: 'Q20644172', isUnesco: true }, // WHS 1467, 2015
  { countryCode: 'DE', name: 'Speyer Cathedral', category: 'building', latitude: 49.31722, longitude: 8.4425, matchRadiusM: 500, wikidataId: 'Q22720', isUnesco: true }, // WHS 168, 1981
  { countryCode: 'DE', name: 'Stralsund and Wismar (Stralsund)', category: 'old town', latitude: 54.3025, longitude: 13.08528, matchRadiusM: 1500, wikidataId: 'Q64822259', isUnesco: true }, // WHS 1067, 2002; site Q1620833
  { countryCode: 'DE', name: 'Upper Middle Rhine Valley', category: 'site', latitude: 50.17361, longitude: 7.69417, matchRadiusM: 1500, wikidataId: 'Q6668852', isUnesco: true }, // WHS 1066, 2002
  { countryCode: 'DE', name: 'Völklingen Ironworks', category: 'site', latitude: 49.25056, longitude: 6.84528, matchRadiusM: 1000, wikidataId: 'Q127754', isUnesco: true }, // WHS 687, 1994
  { countryCode: 'DE', name: 'Wadden Sea', category: 'park', latitude: 53.52861, longitude: 8.55611, matchRadiusM: 60000, wikidataId: 'Q64590476', isUnesco: true }, // WHS 1314, 2009
  { countryCode: 'DE', name: 'Wartburg Castle', category: 'building', latitude: 50.96611, longitude: 10.30639, matchRadiusM: 500, wikidataId: 'Q151545', isUnesco: true }, // WHS 897, 1999
  { countryCode: 'DE', name: 'Wieskirche', category: 'building', latitude: 47.6806, longitude: 10.90044, matchRadiusM: 500, wikidataId: 'Q156675', isUnesco: true }, // WHS 271, 1983
  { countryCode: 'DE', name: 'Würzburg Residence', category: 'site', latitude: 49.79278, longitude: 9.93889, matchRadiusM: 1000, wikidataId: 'Q64822967', isUnesco: true }, // WHS 169, 1981
  { countryCode: 'DE', name: 'Zollverein Coal Mine', category: 'site', latitude: 51.4865, longitude: 7.04408, matchRadiusM: 1500, wikidataId: 'Q122026', isUnesco: true }, // WHS 975, 2001
  { countryCode: 'GH', name: 'Asante Traditional Buildings', category: 'site', latitude: 6.40111, longitude: -1.62583, matchRadiusM: 1500, wikidataId: 'Q1141003', isUnesco: true }, // WHS 35, 1980
  { countryCode: 'GI', name: "Gorham's Cave Complex", category: 'park', latitude: 36.1225, longitude: -5.34194, matchRadiusM: 5000, wikidataId: 'Q60346199', isUnesco: true }, // WHS 1500, 2016
  { countryCode: 'GR', name: 'Aigai (Vergina)', category: 'site', latitude: 40.47797, longitude: 22.32276, matchRadiusM: 3000, wikidataId: 'Q16963755', isUnesco: true }, // WHS 780, 1996
  { countryCode: 'GR', name: 'Byzantine Monuments of Thessaloniki', category: 'site', latitude: 40.6386, longitude: 22.9478, matchRadiusM: 1500, wikidataId: 'Q732708', isUnesco: true }, // WHS 456, 1988
  { countryCode: 'GR', name: 'Delos', category: 'island', latitude: 37.39111, longitude: 25.27111, matchRadiusM: 3000, wikidataId: 'Q173148', isUnesco: true }, // WHS 530, 1990
  { countryCode: 'GR', name: 'Delphi', category: 'site', latitude: 38.48201, longitude: 22.50022, matchRadiusM: 1000, wikidataId: 'Q17652439', isUnesco: true }, // WHS 393, 1987
  { countryCode: 'GR', name: 'Epidaurus', category: 'park', latitude: 37.5986, longitude: 23.0744, matchRadiusM: 20000, wikidataId: 'Q7698713', isUnesco: true }, // WHS 491, 1988
  { countryCode: 'GR', name: 'Hosios Loukas, Daphni and Nea Moni', category: 'building', latitude: 38.39514, longitude: 22.74632, matchRadiusM: 500, wikidataId: 'Q844841', isUnesco: true }, // WHS 537, 1990; site Q11317256
  { countryCode: 'GR', name: 'Medieval City of Rhodes', category: 'old town', latitude: 36.44306, longitude: 28.22694, matchRadiusM: 1500, wikidataId: 'Q876685', isUnesco: true }, // WHS 493, 1988
  { countryCode: 'GR', name: 'Meteora', category: 'site', latitude: 39.7125, longitude: 21.62667, matchRadiusM: 1900, wikidataId: 'Q3125051', isUnesco: true }, // WHS 455, 1988
  { countryCode: 'GR', name: 'Minoan Palaces (Knossos)', category: 'site', latitude: 35.29796, longitude: 25.16316, matchRadiusM: 1500, wikidataId: 'Q173527', isUnesco: true }, // WHS 1733, 2025; site Q64737740
  { countryCode: 'GR', name: 'Mount Athos', category: 'site', latitude: 40.15833, longitude: 24.32722, matchRadiusM: 13000, wikidataId: 'Q136100444', isUnesco: true }, // WHS 454, 1988
  { countryCode: 'GR', name: 'Mount Olympus', category: 'park', latitude: 40.0783, longitude: 22.3489, matchRadiusM: 20000, wikidataId: 'Q64737832', isUnesco: true }, // WHS 1719, 2026
  { countryCode: 'GR', name: 'Mycenae and Tiryns', category: 'park', latitude: 37.73333, longitude: 22.75, matchRadiusM: 20000, wikidataId: 'Q16945635', isUnesco: true }, // WHS 941, 1999
  { countryCode: 'GR', name: 'Mystras', category: 'site', latitude: 37.074, longitude: 22.3673, matchRadiusM: 1000, wikidataId: 'Q19053', isUnesco: true }, // WHS 511, 1989
  { countryCode: 'GR', name: 'Old Town of Corfu', category: 'old town', latitude: 39.62466, longitude: 19.92193, matchRadiusM: 1500, wikidataId: 'Q38283757', isUnesco: true }, // WHS 978, 2007
  { countryCode: 'GR', name: 'Olympia', category: 'site', latitude: 37.63833, longitude: 21.63, matchRadiusM: 1000, wikidataId: 'Q38888', isUnesco: true }, // WHS 517, 1989
  { countryCode: 'GR', name: 'Patmos Chorá and Monastery of St John', category: 'site', latitude: 37.3, longitude: 26.55, matchRadiusM: 2500, wikidataId: 'Q17132271', isUnesco: true }, // WHS 942, 1999
  { countryCode: 'GR', name: 'Philippi', category: 'site', latitude: 41.01207, longitude: 24.28458, matchRadiusM: 1500, wikidataId: 'Q379652', isUnesco: true }, // WHS 1517, 2016
  { countryCode: 'GR', name: 'Pythagoreion and Heraion of Samos', category: 'site', latitude: 37.67204, longitude: 26.88663, matchRadiusM: 6000, wikidataId: 'Q16363506', isUnesco: true }, // WHS 595, 1992
  { countryCode: 'GR', name: 'Temple of Apollo at Bassae', category: 'site', latitude: 37.42965, longitude: 21.90039, matchRadiusM: 1500, wikidataId: 'Q38278862', isUnesco: true }, // WHS 392, 1986
  { countryCode: 'GR', name: 'Zagori', category: 'site', latitude: 39.8667, longitude: 20.7, matchRadiusM: 22000, wikidataId: 'Q2712111', isUnesco: true }, // WHS 1695, 2023
  { countryCode: 'GL', name: 'Aasivissuit–Nipisat', category: 'site', latitude: 67.06393, longitude: -51.43321, matchRadiusM: 1500, wikidataId: 'Q16324987', isUnesco: true }, // WHS 1557, 2018
  { countryCode: 'GL', name: 'Ilulissat Icefjord', category: 'park', latitude: 69.15, longitude: -49.55, matchRadiusM: 43000, wikidataId: 'Q828071', isUnesco: true }, // WHS 1149, 2004
  { countryCode: 'GL', name: 'Kujataa', category: 'site', latitude: 61.16444, longitude: -45.59806, matchRadiusM: 15000, wikidataId: 'Q32904732', isUnesco: true }, // WHS 1536, 2017
  { countryCode: 'GT', name: 'Antigua Guatemala', category: 'site', latitude: 14.5565, longitude: -90.73381, matchRadiusM: 5500, wikidataId: 'Q65130425', isUnesco: true }, // WHS 65, 1979
  { countryCode: 'GT', name: 'Quiriguá', category: 'site', latitude: 15.26944, longitude: -89.04028, matchRadiusM: 1500, wikidataId: 'Q318422', isUnesco: true }, // WHS 149, 1981
  { countryCode: 'GT', name: "Tak'alik Ab'aj", category: 'park', latitude: 14.64583, longitude: -91.73611, matchRadiusM: 5000, wikidataId: 'Q1509537', isUnesco: true }, // WHS 1663, 2023
  { countryCode: 'HN', name: 'Río Plátano Biosphere Reserve', category: 'park', latitude: 15.6, longitude: -84.8, matchRadiusM: 26000, wikidataId: 'Q752181', isUnesco: true }, // WHS 196, 1982
  { countryCode: 'HU', name: 'Budapest, Banks of the Danube', category: 'old town', latitude: 47.48242, longitude: 19.07067, matchRadiusM: 3500, wikidataId: 'Q851122', isUnesco: true }, // WHS 400, 1987
  { countryCode: 'HU', name: 'Caves of Aggtelek and Slovak Karst', category: 'natural', latitude: 48.47178, longitude: 20.49532, matchRadiusM: 16000, wikidataId: 'Q608090', isUnesco: true }, // WHS 725, 1995
  { countryCode: 'HU', name: 'Early Christian Necropolis of Pécs', category: 'site', latitude: 46.07444, longitude: 18.22778, matchRadiusM: 1000, wikidataId: 'Q927535', isUnesco: true }, // WHS 853, 2000
  { countryCode: 'HU', name: 'Hollókő', category: 'old town', latitude: 47.99611, longitude: 19.59167, matchRadiusM: 1500, wikidataId: 'Q622865', isUnesco: true }, // WHS 401, 1987
  { countryCode: 'HU', name: 'Hortobágy National Park', category: 'park', latitude: 47.59458, longitude: 21.15678, matchRadiusM: 19000, wikidataId: 'Q61757', isUnesco: true }, // WHS 474, 1999
  { countryCode: 'HU', name: 'Pannonhalma Archabbey', category: 'building', latitude: 47.55278, longitude: 17.76111, matchRadiusM: 1500, wikidataId: 'Q936285', isUnesco: true }, // WHS 758, 1996
  { countryCode: 'HU', name: 'Tokaj Wine Region', category: 'site', latitude: 48.15, longitude: 21.35, matchRadiusM: 15000, wikidataId: 'Q64559620', isUnesco: true }, // WHS 1063, 2002
  { countryCode: 'IS', name: 'Surtsey', category: 'park', latitude: 63.30403, longitude: -20.60471, matchRadiusM: 5000, wikidataId: 'Q178124', isUnesco: true }, // WHS 1267, 2008
  { countryCode: 'IS', name: 'Vatnajökull National Park', category: 'park', latitude: 64.5, longitude: -17, matchRadiusM: 60000, wikidataId: 'Q1353292', isUnesco: true }, // WHS 1604, 2019
  { countryCode: 'IN', name: 'Agra Fort', category: 'building', latitude: 27.17958, longitude: 78.0213, matchRadiusM: 500, wikidataId: 'Q171857', isUnesco: true }, // WHS 251, 1983
  { countryCode: 'IN', name: 'Ajanta Caves', category: 'natural', latitude: 20.55342, longitude: 75.70047, matchRadiusM: 6500, wikidataId: 'Q184427', isUnesco: true }, // WHS 242, 1983
  { countryCode: 'IN', name: 'Bhimbetka Rock Shelters', category: 'natural', latitude: 22.93863, longitude: 77.61438, matchRadiusM: 3000, wikidataId: 'Q331603', isUnesco: true }, // WHS 925, 2003
  { countryCode: 'IN', name: 'Champaner-Pavagadh', category: 'site', latitude: 22.48333, longitude: 73.53333, matchRadiusM: 7500, wikidataId: 'Q844427', isUnesco: true }, // WHS 1101, 2004
  { countryCode: 'IN', name: 'Chhatrapati Shivaji Terminus', category: 'building', latitude: 18.9398, longitude: 72.8355, matchRadiusM: 300, wikidataId: 'Q235884', isUnesco: true }, // WHS 945, 2004
  { countryCode: 'IN', name: 'Churches and Convents of Goa', category: 'site', latitude: 15.5024, longitude: 73.9117, matchRadiusM: 1500, wikidataId: 'Q15726428', isUnesco: true }, // WHS 234, 1986
  { countryCode: 'IN', name: 'Dholavira', category: 'old town', latitude: 23.88611, longitude: 70.21667, matchRadiusM: 1500, wikidataId: 'Q9468', isUnesco: true }, // WHS 1645, 2021
  { countryCode: 'IN', name: 'Elephanta Caves', category: 'natural', latitude: 18.96333, longitude: 72.93139, matchRadiusM: 5000, wikidataId: 'Q649384', isUnesco: true }, // WHS 244, 1987
  { countryCode: 'IN', name: 'Ellora Caves', category: 'natural', latitude: 20.02639, longitude: 75.17917, matchRadiusM: 5000, wikidataId: 'Q189616', isUnesco: true }, // WHS 243, 1983
  { countryCode: 'IN', name: 'Fatehpur Sikri', category: 'old town', latitude: 27.09111, longitude: 77.66111, matchRadiusM: 1500, wikidataId: 'Q179046', isUnesco: true }, // WHS 255, 1986
  { countryCode: 'IN', name: 'Great Himalayan National Park', category: 'park', latitude: 31.80429, longitude: 77.95102, matchRadiusM: 11000, wikidataId: 'Q1544213', isUnesco: true }, // WHS 1406, 2014
  { countryCode: 'IN', name: 'Great Living Chola Temples', category: 'site', latitude: 10.78306, longitude: 79.1325, matchRadiusM: 1000, wikidataId: 'Q695229', isUnesco: true }, // WHS 250, 1987
  { countryCode: 'IN', name: 'Hampi', category: 'site', latitude: 15.33455, longitude: 76.46216, matchRadiusM: 4500, wikidataId: 'Q26732', isUnesco: true }, // WHS 241, 1986
  { countryCode: 'IN', name: 'Hill Forts of Rajasthan (Amber Fort)', category: 'building', latitude: 26.9859, longitude: 75.8507, matchRadiusM: 600, wikidataId: 'Q456817', isUnesco: true }, // WHS 247, 2013; site Q10428494
  { countryCode: 'IN', name: 'Historic City of Ahmedabad', category: 'old town', latitude: 23.0256, longitude: 72.5875, matchRadiusM: 1500, wikidataId: 'Q5472448', isUnesco: true }, // WHS 1551, 2017
  { countryCode: 'IN', name: 'Hoysala Temples', category: 'site', latitude: 13.21245, longitude: 75.99407, matchRadiusM: 1000, wikidataId: 'Q66023123', isUnesco: true }, // WHS 1670, 2023
  { countryCode: 'IN', name: "Humayun's Tomb", category: 'building', latitude: 28.59326, longitude: 77.2506, matchRadiusM: 600, wikidataId: 'Q189648', isUnesco: true }, // WHS 232, 1993
  { countryCode: 'IN', name: 'Jaipur City', category: 'old town', latitude: 26.915, longitude: 75.82, matchRadiusM: 1500, wikidataId: 'Q66485', isUnesco: true }, // WHS 1605, 2019
  { countryCode: 'IN', name: 'Jantar Mantar, Jaipur', category: 'building', latitude: 26.92472, longitude: 75.825, matchRadiusM: 300, wikidataId: 'Q508634', isUnesco: true }, // WHS 1338, 2010
  { countryCode: 'IN', name: 'Kaziranga National Park', category: 'park', latitude: 26.66667, longitude: 93.35, matchRadiusM: 14000, wikidataId: 'Q192764', isUnesco: true }, // WHS 337, 1985
  { countryCode: 'IN', name: 'Keoladeo National Park', category: 'park', latitude: 27.16667, longitude: 77.51667, matchRadiusM: 5000, wikidataId: 'Q235878', isUnesco: true }, // WHS 340, 1985
  { countryCode: 'IN', name: 'Khajuraho', category: 'site', latitude: 24.85, longitude: 79.93333, matchRadiusM: 3500, wikidataId: 'Q167298', isUnesco: true }, // WHS 240, 1986
  { countryCode: 'IN', name: 'Khangchendzonga National Park', category: 'park', latitude: 27.6563, longitude: 88.3123, matchRadiusM: 23000, wikidataId: 'Q2605019', isUnesco: true }, // WHS 1513, 2016
  { countryCode: 'IN', name: 'Konark Sun Temple', category: 'site', latitude: 19.88744, longitude: 86.0946, matchRadiusM: 1000, wikidataId: 'Q752091', isUnesco: true }, // WHS 246, 1984
  { countryCode: 'IN', name: 'Mahabalipuram', category: 'site', latitude: 12.61667, longitude: 80.19167, matchRadiusM: 1700, wikidataId: 'Q3522747', isUnesco: true }, // WHS 249, 1984
  { countryCode: 'IN', name: 'Mahabodhi Temple, Bodh Gaya', category: 'building', latitude: 24.696, longitude: 84.99136, matchRadiusM: 300, wikidataId: 'Q4513', isUnesco: true }, // WHS 1056, 2002
  { countryCode: 'IN', name: 'Manas Wildlife Sanctuary', category: 'park', latitude: 26.71667, longitude: 90.93333, matchRadiusM: 14000, wikidataId: 'Q506511', isUnesco: true }, // WHS 338, 1985
  { countryCode: 'IN', name: 'Maratha Military Landscapes', category: 'site', latitude: 20.7225, longitude: 73.9425, matchRadiusM: 3000, wikidataId: 'Q134720951', isUnesco: true }, // WHS 1739, 2025
  { countryCode: 'IN', name: 'Moidams of Charaideo', category: 'site', latitude: 26.94361, longitude: 94.875, matchRadiusM: 1500, wikidataId: 'Q6735332', isUnesco: true }, // WHS 1711, 2024
  { countryCode: 'IN', name: 'Mountain Railways of India (Darjeeling)', category: 'site', latitude: 27.045, longitude: 88.26722, matchRadiusM: 1000, wikidataId: 'Q463874', isUnesco: true }, // WHS 944, 1999; site Q4528
  { countryCode: 'IN', name: 'Nalanda Mahavihara', category: 'site', latitude: 25.1368, longitude: 85.44383, matchRadiusM: 1000, wikidataId: 'Q216243', isUnesco: true }, // WHS 1502, 2016
  { countryCode: 'IN', name: 'Nanda Devi and Valley of Flowers', category: 'park', latitude: 30.71667, longitude: 79.66667, matchRadiusM: 18000, wikidataId: 'Q15839097', isUnesco: true }, // WHS 335, 1988
  { countryCode: 'IN', name: 'Pattadakal', category: 'site', latitude: 15.95133, longitude: 75.81464, matchRadiusM: 1000, wikidataId: 'Q817250', isUnesco: true }, // WHS 239, 1987
  { countryCode: 'IN', name: 'Qutb Minar', category: 'site', latitude: 28.52438, longitude: 77.18543, matchRadiusM: 1500, wikidataId: 'Q1074330', isUnesco: true }, // WHS 233, 1993
  { countryCode: 'IN', name: 'Ramappa Temple', category: 'building', latitude: 18.25944, longitude: 79.9425, matchRadiusM: 400, wikidataId: 'Q3380656', isUnesco: true }, // WHS 1570, 2021
  { countryCode: 'IN', name: 'Rani ki Vav', category: 'site', latitude: 23.85892, longitude: 72.10162, matchRadiusM: 1000, wikidataId: 'Q7293002', isUnesco: true }, // WHS 922, 2014
  { countryCode: 'IN', name: 'Red Fort', category: 'building', latitude: 28.65583, longitude: 77.24028, matchRadiusM: 600, wikidataId: 'Q45957', isUnesco: true }, // WHS 231, 2007
  { countryCode: 'IN', name: 'Sanchi', category: 'site', latitude: 23.47944, longitude: 77.73972, matchRadiusM: 1500, wikidataId: 'Q181123', isUnesco: true }, // WHS 524, 1989
  { countryCode: 'IN', name: 'Santiniketan', category: 'old town', latitude: 23.6776, longitude: 87.6852, matchRadiusM: 1500, wikidataId: 'Q1026431', isUnesco: true }, // WHS 1375, 2023
  { countryCode: 'IN', name: 'Sarnath', category: 'old town', latitude: 25.38111, longitude: 83.02139, matchRadiusM: 1500, wikidataId: 'Q324394', isUnesco: true }, // WHS 927, 2026
  { countryCode: 'IN', name: 'Sundarbans National Park', category: 'park', latitude: 21.75, longitude: 88.75, matchRadiusM: 25000, wikidataId: 'Q532440', isUnesco: true }, // WHS 452, 1987
  { countryCode: 'IN', name: 'Victorian Gothic and Art Deco Mumbai', category: 'old town', latitude: 18.92981, longitude: 72.83008, matchRadiusM: 1000, wikidataId: 'Q16942531', isUnesco: true }, // WHS 1480, 2018
  { countryCode: 'IN', name: 'Western Ghats (Eravikulam)', category: 'park', latitude: 10.2, longitude: 77.083, matchRadiusM: 8000, wikidataId: 'Q1194252', isUnesco: true }, // WHS 1342, 2012; site Q4527
  { countryCode: 'ID', name: 'Bali Subak Landscape', category: 'site', latitude: -8.25917, longitude: 115.40278, matchRadiusM: 15000, wikidataId: 'Q17134727', isUnesco: true }, // WHS 1194, 2012
  { countryCode: 'ID', name: 'Cosmological Axis of Yogyakarta', category: 'old town', latitude: -7.80139, longitude: 110.36478, matchRadiusM: 1400, wikidataId: 'Q96012243', isUnesco: true }, // WHS 1671, 2023
  { countryCode: 'ID', name: 'Komodo National Park', category: 'park', latitude: -8.65162, longitude: 119.57657, matchRadiusM: 32000, wikidataId: 'Q4520', isUnesco: true }, // WHS 609, 1991
  { countryCode: 'ID', name: 'Lorentz National Park', category: 'park', latitude: -4.62973, longitude: 137.97268, matchRadiusM: 5000, wikidataId: 'Q4516', isUnesco: true }, // WHS 955, 1999
  { countryCode: 'ID', name: 'Ombilin Coal Mine, Sawahlunto', category: 'site', latitude: -0.68333, longitude: 100.767, matchRadiusM: 10000, wikidataId: 'Q16965955', isUnesco: true }, // WHS 1610, 2019
  { countryCode: 'ID', name: 'Prambanan', category: 'site', latitude: -7.75222, longitude: 110.49167, matchRadiusM: 1500, wikidataId: 'Q84403674', isUnesco: true }, // WHS 642, 1991
  { countryCode: 'ID', name: 'Sangiran Early Man Site', category: 'site', latitude: -7.45, longitude: 110.85, matchRadiusM: 5500, wikidataId: 'Q842328', isUnesco: true }, // WHS 593, 1996
  { countryCode: 'ID', name: 'Sumatra Rainforest (Gunung Leuser)', category: 'park', latitude: 3.5, longitude: 97.5, matchRadiusM: 39000, wikidataId: 'Q1335616', isUnesco: true }, // WHS 1167, 2004; site Q4521
  { countryCode: 'ID', name: 'Ujung Kulon National Park', category: 'park', latitude: -6.75, longitude: 105.33333, matchRadiusM: 19000, wikidataId: 'Q4522', isUnesco: true }, // WHS 608, 1991
  { countryCode: 'IR', name: 'Alamut Castle', category: 'building', latitude: 36.44472, longitude: 50.58611, matchRadiusM: 500, wikidataId: 'Q4706020', isUnesco: true }, // WHS 1770, 2026; site Q140698863
  { countryCode: 'IR', name: 'Armenian Monasteries of Iran (St Thaddeus)', category: 'building', latitude: 39.09222, longitude: 44.54444, matchRadiusM: 600, wikidataId: 'Q842826', isUnesco: true }, // WHS 1262, 2008; site Q841896
  { countryCode: 'IR', name: 'Bam Citadel', category: 'site', latitude: 29.11686, longitude: 58.36847, matchRadiusM: 2000, wikidataId: 'Q43277', isUnesco: true }, // WHS 1208, 2004
  { countryCode: 'IR', name: 'Bisotun', category: 'site', latitude: 34.38822, longitude: 47.43436, matchRadiusM: 1100, wikidataId: 'Q6547997', isUnesco: true }, // WHS 1222, 2006
  { countryCode: 'IR', name: 'Chogha Zanbil', category: 'site', latitude: 32.00833, longitude: 48.52083, matchRadiusM: 1500, wikidataId: 'Q4523', isUnesco: true }, // WHS 113, 1979
  { countryCode: 'IR', name: 'Golestan Palace', category: 'building', latitude: 35.67972, longitude: 51.42028, matchRadiusM: 400, wikidataId: 'Q210610', isUnesco: true }, // WHS 1422, 2013
  { countryCode: 'IR', name: 'Gonbad-e Qabus', category: 'building', latitude: 37.25812, longitude: 55.16899, matchRadiusM: 300, wikidataId: 'Q606763', isUnesco: true }, // WHS 1398, 2012
  { countryCode: 'IR', name: 'Hawraman/Uramanat', category: 'site', latitude: 35.10736, longitude: 46.47785, matchRadiusM: 22000, wikidataId: 'Q7899619', isUnesco: true }, // WHS 1647, 2021
  { countryCode: 'IR', name: 'Hegmataneh', category: 'site', latitude: 34.8065, longitude: 48.51625, matchRadiusM: 1500, wikidataId: 'Q696193', isUnesco: true }, // WHS 1716, 2024
  { countryCode: 'IR', name: 'Historic City of Yazd', category: 'old town', latitude: 31.90056, longitude: 54.36958, matchRadiusM: 1100, wikidataId: 'Q32979655', isUnesco: true }, // WHS 1544, 2017
  { countryCode: 'IR', name: 'Hyrcanian Forests (Golestan)', category: 'park', latitude: 37.4215, longitude: 55.7243, matchRadiusM: 9500, wikidataId: 'Q66057934', isUnesco: true }, // WHS 1584, 2019; site Q66057913
  { countryCode: 'IR', name: 'Jameh Mosque of Isfahan', category: 'building', latitude: 32.66972, longitude: 51.68528, matchRadiusM: 300, wikidataId: 'Q1256501', isUnesco: true }, // WHS 1397, 2012
  { countryCode: 'IR', name: 'Khorramabad Valley Prehistoric Sites', category: 'site', latitude: 33.50833, longitude: 48.21139, matchRadiusM: 1500, wikidataId: 'Q135274656', isUnesco: true }, // WHS 1744, 2025
  { countryCode: 'IR', name: 'Lut Desert', category: 'natural', latitude: 30.26389, longitude: 59.24111, matchRadiusM: 60000, wikidataId: 'Q767128', isUnesco: true }, // WHS 1505, 2016
  { countryCode: 'IR', name: 'Maymand', category: 'old town', latitude: 30.16806, longitude: 55.37556, matchRadiusM: 5000, wikidataId: 'Q1013465', isUnesco: true }, // WHS 1423, 2015
  { countryCode: 'IR', name: 'Naqsh-e Jahan Square', category: 'site', latitude: 32.65822, longitude: 51.67733, matchRadiusM: 1000, wikidataId: 'Q4519', isUnesco: true }, // WHS 115, 1979
  { countryCode: 'IR', name: 'Pasargadae', category: 'site', latitude: 30.2, longitude: 53.17944, matchRadiusM: 1100, wikidataId: 'Q230025', isUnesco: true }, // WHS 1106, 2004
  { countryCode: 'IR', name: 'Persian Caravanserai (Deyr-e Gachin)', category: 'building', latitude: 35.05828, longitude: 51.42011, matchRadiusM: 300, wikidataId: 'Q6394061', isUnesco: true }, // WHS 1668, 2023; site Q66030932
  { countryCode: 'IR', name: 'Persian Gardens (Eram Garden)', category: 'site', latitude: 29.63583, longitude: 52.52556, matchRadiusM: 1000, wikidataId: 'Q127963', isUnesco: true }, // WHS 1372, 2011; site Q10624489
  { countryCode: 'IR', name: 'Persian Qanat (Qasabeh)', category: 'site', latitude: 34.29, longitude: 58.65444, matchRadiusM: 4500, wikidataId: 'Q5937813', isUnesco: true }, // WHS 1506, 2016; site Q25998008
  { countryCode: 'IR', name: 'Sassanid Landscape of Fars (Bishapur)', category: 'site', latitude: 29.77778, longitude: 51.57083, matchRadiusM: 1100, wikidataId: 'Q477898', isUnesco: true }, // WHS 1568, 2018; site Q55379486
  { countryCode: 'IR', name: 'Shahr-i Sokhta', category: 'site', latitude: 30.59528, longitude: 61.33194, matchRadiusM: 1300, wikidataId: 'Q1025825', isUnesco: true }, // WHS 1456, 2014
  { countryCode: 'IR', name: 'Sheikh Safi al-Din Shrine, Ardabil', category: 'site', latitude: 38.24861, longitude: 48.29139, matchRadiusM: 1000, wikidataId: 'Q4243', isUnesco: true }, // WHS 1345, 2010
  { countryCode: 'IR', name: 'Shushtar Hydraulic System', category: 'site', latitude: 32.05372, longitude: 48.84869, matchRadiusM: 1200, wikidataId: 'Q2274974', isUnesco: true }, // WHS 1315, 2009
  { countryCode: 'IR', name: 'Soltaniyeh', category: 'site', latitude: 36.43472, longitude: 48.7975, matchRadiusM: 1500, wikidataId: 'Q4531', isUnesco: true }, // WHS 1188, 2005
  { countryCode: 'IR', name: 'Susa', category: 'site', latitude: 32.18944, longitude: 48.25611, matchRadiusM: 1500, wikidataId: 'Q180773', isUnesco: true }, // WHS 1455, 2015
  { countryCode: 'IR', name: 'Tabriz Bazaar', category: 'site', latitude: 38.08077, longitude: 46.29229, matchRadiusM: 1000, wikidataId: 'Q4399', isUnesco: true }, // WHS 1346, 2010
  { countryCode: 'IR', name: 'Takht-e Soleyman', category: 'site', latitude: 36.60472, longitude: 47.23417, matchRadiusM: 1000, wikidataId: 'Q115253', isUnesco: true }, // WHS 1077, 2003
  { countryCode: 'IR', name: 'Trans-Iranian Railway', category: 'site', latitude: 35.65831, longitude: 51.39833, matchRadiusM: 1500, wikidataId: 'Q162835', isUnesco: true }, // WHS 1585, 2021
  { countryCode: 'IQ', name: 'Ahwar of Southern Iraq (Ur)', category: 'site', latitude: 30.96222, longitude: 46.10444, matchRadiusM: 1000, wikidataId: 'Q5699', isUnesco: true }, // WHS 1481, 2016; site Q25933006
  { countryCode: 'IQ', name: 'Ashur', category: 'old town', latitude: 35.45667, longitude: 43.2625, matchRadiusM: 1500, wikidataId: 'Q200200', isUnesco: true }, // WHS 1130, 2003
  { countryCode: 'IQ', name: 'Babylon', category: 'site', latitude: 32.54178, longitude: 44.43164, matchRadiusM: 1000, wikidataId: 'Q100329356', isUnesco: true }, // WHS 278, 2019
  { countryCode: 'IQ', name: 'Erbil Citadel', category: 'building', latitude: 36.191, longitude: 44.009, matchRadiusM: 500, wikidataId: 'Q206236', isUnesco: true }, // WHS 1437, 2014
  { countryCode: 'IQ', name: 'Samarra', category: 'old town', latitude: 34.1959, longitude: 43.88568, matchRadiusM: 5000, wikidataId: 'Q170047', isUnesco: true }, // WHS 276, 2007
  { countryCode: 'IE', name: 'Brú na Bóinne', category: 'site', latitude: 53.69284, longitude: -6.44932, matchRadiusM: 1500, wikidataId: 'Q339489', isUnesco: true }, // WHS 659, 1993
  { countryCode: 'IE', name: 'Skellig Michael', category: 'island', latitude: 51.77111, longitude: -10.54056, matchRadiusM: 3000, wikidataId: 'Q207193', isUnesco: true }, // WHS 757, 1996
  { countryCode: 'IL', name: "Bahá'í Holy Places in Haifa", category: 'site', latitude: 32.81378, longitude: 34.98655, matchRadiusM: 1000, wikidataId: 'Q2149036', isUnesco: true }, // WHS 1220, 2008
  { countryCode: 'IL', name: "Bet She'arim", category: 'park', latitude: 32.70417, longitude: 35.12806, matchRadiusM: 5000, wikidataId: 'Q830805', isUnesco: true }, // WHS 1471, 2015
  { countryCode: 'IL', name: 'Biblical Tels (Megiddo)', category: 'site', latitude: 32.58528, longitude: 35.18444, matchRadiusM: 1000, wikidataId: 'Q208379', isUnesco: true }, // WHS 1108, 2005; site Q15477047
  { countryCode: 'IL', name: 'Caves of Maresha and Bet-Guvrin', category: 'park', latitude: 31.61306, longitude: 34.89833, matchRadiusM: 5000, wikidataId: 'Q2407530', isUnesco: true }, // WHS 1370, 2014
  { countryCode: 'IL', name: 'Incense Route Desert Cities', category: 'site', latitude: 31.0975, longitude: 34.65778, matchRadiusM: 15000, wikidataId: 'Q477578', isUnesco: true }, // WHS 1107, 2005
  { countryCode: 'IL', name: 'Masada', category: 'site', latitude: 31.31556, longitude: 35.35389, matchRadiusM: 1300, wikidataId: 'Q186312', isUnesco: true }, // WHS 1040, 2001
  { countryCode: 'IL', name: 'Mount Carmel Caves', category: 'park', latitude: 32.67083, longitude: 34.96611, matchRadiusM: 5000, wikidataId: 'Q1443478', isUnesco: true }, // WHS 1393, 2012
  { countryCode: 'IL', name: 'Old City of Acre', category: 'old town', latitude: 32.92611, longitude: 35.08389, matchRadiusM: 1500, wikidataId: 'Q126084', isUnesco: true }, // WHS 1042, 2001
  { countryCode: 'IL', name: 'White City of Tel Aviv', category: 'old town', latitude: 32.07778, longitude: 34.77389, matchRadiusM: 1500, wikidataId: 'Q159070', isUnesco: true }, // WHS 1096, 2003
  { countryCode: 'IT', name: 'Aeolian Islands', category: 'archipelago', latitude: 38.49667, longitude: 14.93583, matchRadiusM: 10000, wikidataId: 'Q179883', isUnesco: true }, // WHS 908, 2000
  { countryCode: 'IT', name: 'Amalfi Coast', category: 'natural', latitude: 40.63333, longitude: 14.6, matchRadiusM: 5000, wikidataId: 'Q212214', isUnesco: true }, // WHS 830, 1997
  { countryCode: 'IT', name: 'Appian Way', category: 'site', latitude: 41.84139, longitude: 12.5325, matchRadiusM: 1500, wikidataId: 'Q189417', isUnesco: true }, // WHS 1708, 2024; site Q129503044
  { countryCode: 'IT', name: 'Aquileia', category: 'site', latitude: 45.7683, longitude: 13.3675, matchRadiusM: 1500, wikidataId: 'Q3575761', isUnesco: true }, // WHS 825, 1998
  { countryCode: 'IT', name: 'Arab-Norman Palermo', category: 'site', latitude: 38.11083, longitude: 13.35306, matchRadiusM: 6500, wikidataId: 'Q20963672', isUnesco: true }, // WHS 1487, 2015
  { countryCode: 'IT', name: 'Assisi', category: 'site', latitude: 43.06617, longitude: 12.62244, matchRadiusM: 4000, wikidataId: 'Q16913154', isUnesco: true }, // WHS 990, 2000
  { countryCode: 'IT', name: 'Baroque Towns of Val di Noto (Noto)', category: 'old town', latitude: 36.88333, longitude: 15.08333, matchRadiusM: 1500, wikidataId: 'Q487174', isUnesco: true }, // WHS 1024, 2002; site Q18649472
  { countryCode: 'IT', name: 'Castel del Monte', category: 'building', latitude: 41.08475, longitude: 16.27093, matchRadiusM: 300, wikidataId: 'Q215897', isUnesco: true }, // WHS 398, 1996
  { countryCode: 'IT', name: 'Cerveteri and Tarquinia Necropolises', category: 'site', latitude: 42.00683, longitude: 12.10189, matchRadiusM: 1500, wikidataId: 'Q15602246', isUnesco: true }, // WHS 1158, 2004
  { countryCode: 'IT', name: 'Cilento and Vallo di Diano National Park', category: 'park', latitude: 40.28333, longitude: 15.26667, matchRadiusM: 27000, wikidataId: 'Q65016468', isUnesco: true }, // WHS 842, 1998
  { countryCode: 'IT', name: 'City of Verona', category: 'old town', latitude: 45.43861, longitude: 10.99389, matchRadiusM: 1500, wikidataId: 'Q3678423', isUnesco: true }, // WHS 797, 2000; site Q2028
  { countryCode: 'IT', name: 'Condominio Theatres of Central Italy (Fermo)', category: 'building', latitude: 43.16038, longitude: 13.71767, matchRadiusM: 300, wikidataId: 'Q3982289', isUnesco: true }, // WHS 1762, 2026; site Q127466372
  { countryCode: 'IT', name: "Crespi d'Adda", category: 'building', latitude: 45.59667, longitude: 9.53611, matchRadiusM: 700, wikidataId: 'Q726842', isUnesco: true }, // WHS 730, 1995
  { countryCode: 'IT', name: 'Dolomites', category: 'park', latitude: 46.61306, longitude: 12.16306, matchRadiusM: 20000, wikidataId: 'Q65028346', isUnesco: true }, // WHS 1237, 2009
  { countryCode: 'IT', name: 'Domus de Janas (Su Crucifissu Mannu)', category: 'site', latitude: 40.8103, longitude: 8.44418, matchRadiusM: 1500, wikidataId: 'Q3874164', isUnesco: true }, // WHS 1730, 2025; site Q1238775
  { countryCode: 'IT', name: 'Early Christian Monuments of Ravenna', category: 'site', latitude: 44.42042, longitude: 12.19625, matchRadiusM: 6000, wikidataId: 'Q16886821', isUnesco: true }, // WHS 788, 1996
  { countryCode: 'IT', name: 'Evaporitic Karst of the Apennines', category: 'park', latitude: 44.37994, longitude: 10.38892, matchRadiusM: 20000, wikidataId: 'Q122730699', isUnesco: true }, // WHS 1692, 2023
  { countryCode: 'IT', name: 'Ferrara and the Po Delta', category: 'old town', latitude: 44.83778, longitude: 11.61944, matchRadiusM: 5000, wikidataId: 'Q16735627', isUnesco: true }, // WHS 733, 1995
  { countryCode: 'IT', name: 'Genoa Palazzi dei Rolli', category: 'park', latitude: 44.41222, longitude: 8.93111, matchRadiusM: 20000, wikidataId: 'Q10293286', isUnesco: true }, // WHS 1211, 2006
  { countryCode: 'IT', name: "Hadrian's Villa", category: 'site', latitude: 41.94194, longitude: 12.77528, matchRadiusM: 1000, wikidataId: 'Q272777', isUnesco: true }, // WHS 907, 1999
  { countryCode: 'IT', name: 'Historic Centre of Florence', category: 'old town', latitude: 43.77306, longitude: 11.25611, matchRadiusM: 1500, wikidataId: 'Q2707802', isUnesco: true }, // WHS 174, 1982
  { countryCode: 'IT', name: 'Historic Centre of Naples', category: 'old town', latitude: 40.85139, longitude: 14.26278, matchRadiusM: 5000, wikidataId: 'Q832957', isUnesco: true }, // WHS 726, 1995
  { countryCode: 'IT', name: 'Historic Centre of Rome', category: 'old town', latitude: 41.8928, longitude: 12.4866, matchRadiusM: 4500, wikidataId: 'Q18448486', isUnesco: true }, // WHS 91, 1980
  { countryCode: 'IT', name: 'Historic Centre of Siena', category: 'old town', latitude: 43.31861, longitude: 11.33167, matchRadiusM: 1500, wikidataId: 'Q17163322', isUnesco: true }, // WHS 717, 1995
  { countryCode: 'IT', name: 'Historic Centre of Urbino', category: 'old town', latitude: 43.725, longitude: 12.63333, matchRadiusM: 1500, wikidataId: 'Q17163308', isUnesco: true }, // WHS 828, 1998
  { countryCode: 'IT', name: 'Ivrea, Industrial City', category: 'site', latitude: 45.4575, longitude: 7.8692, matchRadiusM: 1500, wikidataId: 'Q109123298', isUnesco: true }, // WHS 1538, 2018
  { countryCode: 'IT', name: 'Longobards in Italy (Cividale)', category: 'site', latitude: 46.09417, longitude: 13.43306, matchRadiusM: 1000, wikidataId: 'Q65028465', isUnesco: true }, // WHS 1318, 2011; site Q1214318
  { countryCode: 'IT', name: 'Mantua and Sabbioneta', category: 'site', latitude: 45.15944, longitude: 10.79444, matchRadiusM: 1500, wikidataId: 'Q15623665', isUnesco: true }, // WHS 1287, 2008
  { countryCode: 'IT', name: 'Medici Villas and Gardens (Boboli)', category: 'building', latitude: 43.7618, longitude: 11.24661, matchRadiusM: 300, wikidataId: 'Q888825', isUnesco: true }, // WHS 175, 2013; site Q574879
  { countryCode: 'IT', name: 'Modena Cathedral and Piazza Grande', category: 'site', latitude: 44.64624, longitude: 10.92568, matchRadiusM: 1500, wikidataId: 'Q15221022', isUnesco: true }, // WHS 827, 1997
  { countryCode: 'IT', name: 'Mount Etna', category: 'park', latitude: 37.76528, longitude: 15, matchRadiusM: 17000, wikidataId: 'Q499242', isUnesco: true }, // WHS 1427, 2013
  { countryCode: 'IT', name: 'Orto Botanico, Padua', category: 'site', latitude: 45.39953, longitude: 11.88068, matchRadiusM: 1000, wikidataId: 'Q598892', isUnesco: true }, // WHS 824, 1997
  { countryCode: 'IT', name: "Padua's Fresco Cycles", category: 'site', latitude: 45.41189, longitude: 11.87961, matchRadiusM: 1500, wikidataId: 'Q107674350', isUnesco: true }, // WHS 1623, 2021
  { countryCode: 'IT', name: 'Piazza del Duomo, Pisa', category: 'site', latitude: 43.72343, longitude: 10.39478, matchRadiusM: 1000, wikidataId: 'Q750245', isUnesco: true }, // WHS 395, 1987
  { countryCode: 'IT', name: 'Pienza', category: 'old town', latitude: 43.0766, longitude: 11.679, matchRadiusM: 1500, wikidataId: 'Q2945646', isUnesco: true }, // WHS 789, 1996
  { countryCode: 'IT', name: 'Pompeii and Herculaneum', category: 'site', latitude: 40.75, longitude: 14.48333, matchRadiusM: 14000, wikidataId: 'Q16920958', isUnesco: true }, // WHS 829, 1997
  { countryCode: 'IT', name: 'Porticoes of Bologna', category: 'site', latitude: 44.49139, longitude: 11.33278, matchRadiusM: 4500, wikidataId: 'Q3909051', isUnesco: true }, // WHS 1650, 2021
  { countryCode: 'IT', name: 'Portovenere and Cinque Terre', category: 'archipelago', latitude: 44.10694, longitude: 9.72917, matchRadiusM: 30000, wikidataId: 'Q10351991', isUnesco: true }, // WHS 826, 1997
  { countryCode: 'IT', name: 'Prosecco Hills', category: 'site', latitude: 45.953, longitude: 12.2261, matchRadiusM: 10000, wikidataId: 'Q65029145', isUnesco: true }, // WHS 1571, 2019
  { countryCode: 'IT', name: 'Residences of the House of Savoy', category: 'site', latitude: 45.0725, longitude: 7.68583, matchRadiusM: 14000, wikidataId: 'Q461272', isUnesco: true }, // WHS 823, 1997
  { countryCode: 'IT', name: 'Rock Drawings in Valcamonica', category: 'park', latitude: 46.02389, longitude: 10.35, matchRadiusM: 20000, wikidataId: 'Q945514', isUnesco: true }, // WHS 94, 1979
  { countryCode: 'IT', name: 'Royal Palace of Caserta', category: 'site', latitude: 41.07333, longitude: 14.32639, matchRadiusM: 4000, wikidataId: 'Q16962666', isUnesco: true }, // WHS 549, 1997
  { countryCode: 'IT', name: 'Sacri Monti (Varallo)', category: 'building', latitude: 45.81861, longitude: 8.25472, matchRadiusM: 400, wikidataId: 'Q2211082', isUnesco: true }, // WHS 1068, 2003; site Q753162
  { countryCode: 'IT', name: 'San Gimignano', category: 'old town', latitude: 43.46706, longitude: 11.0428, matchRadiusM: 1500, wikidataId: 'Q9724840', isUnesco: true }, // WHS 550, 1990
  { countryCode: 'IT', name: 'Santa Maria delle Grazie (The Last Supper)', category: 'building', latitude: 45.46583, longitude: 9.17111, matchRadiusM: 300, wikidataId: 'Q244952', isUnesco: true }, // WHS 93, 1980
  { countryCode: 'IT', name: 'Sassi of Matera', category: 'site', latitude: 40.66639, longitude: 16.61028, matchRadiusM: 2500, wikidataId: 'Q55739617', isUnesco: true }, // WHS 670, 1993
  { countryCode: 'IT', name: 'Su Nuraxi di Barumini', category: 'site', latitude: 39.70286, longitude: 8.99988, matchRadiusM: 1000, wikidataId: 'Q253241', isUnesco: true }, // WHS 833, 1997
  { countryCode: 'IT', name: 'Syracuse and Pantalica', category: 'site', latitude: 37.05944, longitude: 15.29306, matchRadiusM: 8000, wikidataId: 'Q15604441', isUnesco: true }, // WHS 1200, 2005
  { countryCode: 'IT', name: 'Trulli of Alberobello', category: 'site', latitude: 40.7825, longitude: 17.23694, matchRadiusM: 1500, wikidataId: 'Q16913064', isUnesco: true }, // WHS 787, 1996
  { countryCode: 'IT', name: "Val d'Orcia", category: 'natural', latitude: 43.06667, longitude: 11.55, matchRadiusM: 5000, wikidataId: 'Q217449', isUnesco: true }, // WHS 1026, 2004
  { countryCode: 'IT', name: 'Valley of the Temples, Agrigento', category: 'site', latitude: 37.28972, longitude: 13.59, matchRadiusM: 1000, wikidataId: 'Q636774', isUnesco: true }, // WHS 831, 1997
  { countryCode: 'IT', name: 'Venetian Works of Defence (Bergamo)', category: 'site', latitude: 45.70414, longitude: 9.67212, matchRadiusM: 1000, wikidataId: 'Q3867341', isUnesco: true }, // WHS 1533, 2017; site Q32797097
  { countryCode: 'IT', name: 'Venice and its Lagoon', category: 'old town', latitude: 45.43431, longitude: 12.33894, matchRadiusM: 6000, wikidataId: 'Q11352141', isUnesco: true }, // WHS 394, 1987
  { countryCode: 'IT', name: 'Vicenza and the Palladian Villas', category: 'old town', latitude: 45.55, longitude: 11.55, matchRadiusM: 5000, wikidataId: 'Q370956', isUnesco: true }, // WHS 712, 1994
  { countryCode: 'IT', name: "Villa d'Este", category: 'building', latitude: 41.9625, longitude: 12.79611, matchRadiusM: 300, wikidataId: 'Q746063', isUnesco: true }, // WHS 1025, 2001
  { countryCode: 'IT', name: 'Villa Romana del Casale', category: 'old town', latitude: 37.36472, longitude: 14.33455, matchRadiusM: 1000, wikidataId: 'Q505617', isUnesco: true }, // WHS 832, 1997
  { countryCode: 'IT', name: 'Vineyards of Langhe-Roero and Monferrato', category: 'site', latitude: 44.65194, longitude: 7.99417, matchRadiusM: 15000, wikidataId: 'Q17296768', isUnesco: true }, // WHS 1390, 2014
  { countryCode: 'JM', name: 'Port Royal', category: 'old town', latitude: 17.9375, longitude: -76.84139, matchRadiusM: 1500, wikidataId: 'Q685357', isUnesco: true }, // WHS 1595, 2025
  { countryCode: 'JP', name: 'Amami, Okinawa and Iriomote (Amami Ōshima)', category: 'island', latitude: 28.28333, longitude: 129.36667, matchRadiusM: 18000, wikidataId: 'Q697278', isUnesco: true }, // WHS 1574, 2021; site Q11444847
  { countryCode: 'JP', name: 'Asuka and Fujiwara Capitals', category: 'site', latitude: 34.47028, longitude: 135.82361, matchRadiusM: 1500, wikidataId: 'Q4811849', isUnesco: true }, // WHS 1757, 2026
  { countryCode: 'JP', name: 'Gusuku Sites of Ryukyu', category: 'site', latitude: 26.2086, longitude: 127.683, matchRadiusM: 15000, wikidataId: 'Q1333330', isUnesco: true }, // WHS 972, 2000
  { countryCode: 'JP', name: 'Hidden Christian Sites (Ōura Church)', category: 'building', latitude: 32.73417, longitude: 129.87028, matchRadiusM: 300, wikidataId: 'Q430626', isUnesco: true }, // WHS 1495, 2018; site Q93643
  { countryCode: 'JP', name: 'Himeji Castle', category: 'building', latitude: 34.83944, longitude: 134.69361, matchRadiusM: 900, wikidataId: 'Q188754', isUnesco: true }, // WHS 661, 1993
  { countryCode: 'JP', name: 'Hiraizumi', category: 'old town', latitude: 38.98861, longitude: 141.11028, matchRadiusM: 2000, wikidataId: 'Q2896261', isUnesco: true }, // WHS 1277, 2011
  { countryCode: 'JP', name: 'Hiroshima Peace Memorial', category: 'building', latitude: 34.39556, longitude: 132.45361, matchRadiusM: 300, wikidataId: 'Q231140', isUnesco: true }, // WHS 775, 1996
  { countryCode: 'JP', name: 'Historic Monuments of Ancient Kyoto', category: 'site', latitude: 35.06028, longitude: 135.75278, matchRadiusM: 15000, wikidataId: 'Q874027', isUnesco: true }, // WHS 688, 1994
  { countryCode: 'JP', name: 'Historic Monuments of Ancient Nara', category: 'site', latitude: 34.67556, longitude: 135.83944, matchRadiusM: 5500, wikidataId: 'Q1055749', isUnesco: true }, // WHS 870, 1998
  { countryCode: 'JP', name: 'Hōryū-ji', category: 'site', latitude: 34.61427, longitude: 135.73424, matchRadiusM: 1900, wikidataId: 'Q1333799', isUnesco: true }, // WHS 660, 1993
  { countryCode: 'JP', name: 'Itsukushima Shrine', category: 'building', latitude: 34.29577, longitude: 132.32011, matchRadiusM: 1500, wikidataId: 'Q191763', isUnesco: true }, // WHS 776, 1996
  { countryCode: 'JP', name: 'Iwami Ginzan Silver Mine', category: 'site', latitude: 35.10722, longitude: 132.4375, matchRadiusM: 9000, wikidataId: 'Q174139', isUnesco: true }, // WHS 1246, 2007
  { countryCode: 'JP', name: 'Jōmon Sites (Sannai-Maruyama)', category: 'site', latitude: 40.81167, longitude: 140.69556, matchRadiusM: 1000, wikidataId: 'Q911970', isUnesco: true }, // WHS 1632, 2021; site Q11402500
  { countryCode: 'JP', name: 'Kii Mountains Sacred Sites (Kumano)', category: 'site', latitude: 33.83694, longitude: 135.77639, matchRadiusM: 15000, wikidataId: 'Q611345', isUnesco: true }, // WHS 1142, 2004
  { countryCode: 'JP', name: 'Meiji Industrial Sites (Hashima)', category: 'island', latitude: 32.62778, longitude: 129.73833, matchRadiusM: 3000, wikidataId: 'Q285468', isUnesco: true }, // WHS 1484, 2015; site Q7751872
  { countryCode: 'JP', name: 'Mozu-Furuichi Kofun Group', category: 'site', latitude: 34.5622, longitude: 135.6094, matchRadiusM: 13000, wikidataId: 'Q55524104', isUnesco: true }, // WHS 1593, 2019
  { countryCode: 'JP', name: 'Ogasawara Islands (Chichijima)', category: 'island', latitude: 27.06667, longitude: 142.20833, matchRadiusM: 3000, wikidataId: 'Q1072125', isUnesco: true }, // WHS 1362, 2011; site Q13383295
  { countryCode: 'JP', name: 'Okinoshima and Munakata', category: 'island', latitude: 34.245, longitude: 130.1056, matchRadiusM: 3000, wikidataId: 'Q324638', isUnesco: true }, // WHS 1535, 2017
  { countryCode: 'JP', name: 'Sado Island Gold Mines', category: 'island', latitude: 38.04083, longitude: 138.25778, matchRadiusM: 15000, wikidataId: 'Q127378385', isUnesco: true }, // WHS 1698, 2024
  { countryCode: 'JP', name: 'Shirakami-Sanchi', category: 'range', latitude: 40.47, longitude: 140.13, matchRadiusM: 10000, wikidataId: 'Q501638', isUnesco: true }, // WHS 663, 1993
  { countryCode: 'JP', name: 'Shirakawa-go and Gokayama', category: 'site', latitude: 36.25694, longitude: 136.90639, matchRadiusM: 15000, wikidataId: 'Q877626', isUnesco: true }, // WHS 734, 1995
  { countryCode: 'JP', name: 'Shiretoko', category: 'park', latitude: 43.93333, longitude: 144.95, matchRadiusM: 18000, wikidataId: 'Q17208861', isUnesco: true }, // WHS 1193, 2005
  { countryCode: 'JP', name: 'Shrines and Temples of Nikkō', category: 'site', latitude: 36.7475, longitude: 139.61056, matchRadiusM: 1000, wikidataId: 'Q1063133', isUnesco: true }, // WHS 913, 1999
  { countryCode: 'JP', name: 'Tomioka Silk Mill', category: 'site', latitude: 36.2553, longitude: 138.8878, matchRadiusM: 15000, wikidataId: 'Q7769551', isUnesco: true }, // WHS 1449, 2014
  { countryCode: 'JP', name: 'Yakushima', category: 'island', latitude: 30.35861, longitude: 130.52861, matchRadiusM: 3000, wikidataId: 'Q242176', isUnesco: true }, // WHS 662, 1993
  { countryCode: 'JO', name: 'Aqaba Marine Reserve', category: 'park', latitude: 29.4307, longitude: 34.97184, matchRadiusM: 20000, wikidataId: 'Q31866622', isUnesco: true }, // WHS 1742, 2026
  { countryCode: 'JO', name: 'As-Salt', category: 'old town', latitude: 32.03917, longitude: 35.72722, matchRadiusM: 1500, wikidataId: 'Q867586', isUnesco: true }, // WHS 689, 2021
  { countryCode: 'JO', name: 'Baptism Site (Al-Maghtas)', category: 'site', latitude: 31.83722, longitude: 35.55028, matchRadiusM: 1400, wikidataId: 'Q12193567', isUnesco: true }, // WHS 1446, 2015
  { countryCode: 'JO', name: 'Quseir Amra', category: 'building', latitude: 31.80175, longitude: 36.58731, matchRadiusM: 500, wikidataId: 'Q499517', isUnesco: true }, // WHS 327, 1985
  { countryCode: 'JO', name: 'Umm el-Jimal', category: 'old town', latitude: 32.32667, longitude: 36.36972, matchRadiusM: 1500, wikidataId: 'Q3107493', isUnesco: true }, // WHS 1721, 2024
  { countryCode: 'JO', name: 'Umm er-Rasas', category: 'site', latitude: 31.49972, longitude: 35.91972, matchRadiusM: 1000, wikidataId: 'Q822842', isUnesco: true }, // WHS 1093, 2004
  { countryCode: 'JO', name: 'Wadi Rum', category: 'park', latitude: 29.5765, longitude: 35.41993, matchRadiusM: 17000, wikidataId: 'Q40729', isUnesco: true }, // WHS 1377, 2011
  { countryCode: 'KZ', name: 'Cold Winter Deserts of Turan', category: 'park', latitude: 44.02583, longitude: 79.03417, matchRadiusM: 20000, wikidataId: 'Q122731152', isUnesco: true }, // WHS 1693, 2023
  { countryCode: 'KZ', name: 'Rock Mosques of Mangystau (Beket-Ata)', category: 'building', latitude: 43.597, longitude: 54.07, matchRadiusM: 500, wikidataId: 'Q25490231', isUnesco: true }, // WHS 1760, 2026; site Q140697538
  { countryCode: 'KZ', name: 'Saryarka (Korgalzhyn)', category: 'park', latitude: 50.43333, longitude: 69.18889, matchRadiusM: 50000, wikidataId: 'Q1046294', isUnesco: true }, // WHS 1102, 2008; site Q2559020
  { countryCode: 'KZ', name: 'Tamgaly Petroglyphs', category: 'site', latitude: 43.80333, longitude: 75.535, matchRadiusM: 2000, wikidataId: 'Q943327', isUnesco: true }, // WHS 1145, 2004
  { countryCode: 'KZ', name: 'Western Tien-Shan (Aksu-Zhabagly)', category: 'park', latitude: 42.27611, longitude: 70.67417, matchRadiusM: 11000, wikidataId: 'Q65007090', isUnesco: true }, // WHS 1490, 2016; site Q16434635
  { countryCode: 'KE', name: 'Fort Jesus, Mombasa', category: 'building', latitude: -4.07117, longitude: 39.68206, matchRadiusM: 400, wikidataId: 'Q379080', isUnesco: true }, // WHS 1295, 2011
  { countryCode: 'KE', name: 'Gedi Ruins', category: 'old town', latitude: -3.30917, longitude: 40.01667, matchRadiusM: 1000, wikidataId: 'Q502518', isUnesco: true }, // WHS 1720, 2024
  { countryCode: 'KE', name: 'Kenya Lake System (Lake Nakuru)', category: 'natural', latitude: -0.36667, longitude: 36.08333, matchRadiusM: 9500, wikidataId: 'Q849508', isUnesco: true }, // WHS 1060, 2011; site Q2384313
  { countryCode: 'KE', name: 'Lake Turkana (Sibiloi)', category: 'park', latitude: 3.96056, longitude: 36.3425, matchRadiusM: 27000, wikidataId: 'Q1380559', isUnesco: true }, // WHS 801, 1997; site Q1647948
  { countryCode: 'KE', name: 'Lamu Old Town', category: 'old town', latitude: -2.28444, longitude: 40.8525, matchRadiusM: 5000, wikidataId: 'Q51100199', isUnesco: true }, // WHS 1055, 2001
  { countryCode: 'KE', name: 'Mijikenda Kaya Forests', category: 'park', latitude: -3.93194, longitude: 39.59611, matchRadiusM: 15000, wikidataId: 'Q1362222', isUnesco: true }, // WHS 1231, 2008
  { countryCode: 'KE', name: 'Mount Kenya National Park', category: 'park', latitude: -0.12389, longitude: 37.33667, matchRadiusM: 18000, wikidataId: 'Q1639468', isUnesco: true }, // WHS 800, 1997
  { countryCode: 'KE', name: 'Thimlich Ohinga', category: 'site', latitude: -0.89134, longitude: 34.32611, matchRadiusM: 1000, wikidataId: 'Q3524629', isUnesco: true }, // WHS 1450, 2018
  { countryCode: 'KI', name: 'Phoenix Islands Protected Area', category: 'park', latitude: -3.64972, longitude: -172.8575, matchRadiusM: 60000, wikidataId: 'Q863815', isUnesco: true }, // WHS 1325, 2010
  { countryCode: 'XK', name: 'Medieval Monuments in Kosovo (Gračanica)', category: 'site', latitude: 42.59833, longitude: 21.19333, matchRadiusM: 1500, wikidataId: 'Q1137661', isUnesco: true }, // WHS 724, 2004; site Q1982106
  { countryCode: 'KG', name: 'Sulaiman-Too', category: 'mountain', latitude: 40.52944, longitude: 72.78333, matchRadiusM: 3000, wikidataId: 'Q750190', isUnesco: true }, // WHS 1230, 2009
  { countryCode: 'LA', name: 'Luang Prabang', category: 'old town', latitude: 19.89, longitude: 102.13472, matchRadiusM: 1500, wikidataId: 'Q190165', isUnesco: true }, // WHS 479, 1995
  { countryCode: 'LA', name: 'Plain of Jars', category: 'natural', latitude: 19.43111, longitude: 103.1525, matchRadiusM: 15000, wikidataId: 'Q870258', isUnesco: true }, // WHS 1587, 2019
  { countryCode: 'LV', name: 'Old Town of Kuldīga', category: 'old town', latitude: 56.9675, longitude: 21.97056, matchRadiusM: 1500, wikidataId: 'Q122772994', isUnesco: true }, // WHS 1658, 2023
  { countryCode: 'LB', name: 'Anjar', category: 'old town', latitude: 33.72583, longitude: 35.92972, matchRadiusM: 1500, wikidataId: 'Q60977', isUnesco: true }, // WHS 293, 1984
  { countryCode: 'LB', name: 'Byblos', category: 'old town', latitude: 34.11667, longitude: 35.65, matchRadiusM: 1500, wikidataId: 'Q173532', isUnesco: true }, // WHS 295, 1984
  { countryCode: 'LB', name: 'Mount Amel Castles (Beaufort)', category: 'building', latitude: 33.32471, longitude: 35.53215, matchRadiusM: 500, wikidataId: 'Q476801', isUnesco: true }, // WHS 1810, 2026; site Q140592613
  { countryCode: 'LB', name: 'Qadisha Valley and Cedars of God', category: 'park', latitude: 34.28294, longitude: 35.95161, matchRadiusM: 10000, wikidataId: 'Q16946966', isUnesco: true }, // WHS 850, 1998
  { countryCode: 'LB', name: 'Rachid Karami International Fair', category: 'site', latitude: 34.43961, longitude: 35.82591, matchRadiusM: 1500, wikidataId: 'Q116448209', isUnesco: true }, // WHS 1702, 2023
  { countryCode: 'LB', name: 'Tyre', category: 'site', latitude: 33.26917, longitude: 35.19583, matchRadiusM: 1000, wikidataId: 'Q3991738', isUnesco: true }, // WHS 299, 1984
  { countryCode: 'LY', name: 'Cyrene', category: 'old town', latitude: 32.81667, longitude: 21.85, matchRadiusM: 1500, wikidataId: 'Q44112', isUnesco: true }, // WHS 190, 1982
  { countryCode: 'LY', name: 'Old Town of Ghadamès', category: 'old town', latitude: 30.132, longitude: 9.497, matchRadiusM: 1500, wikidataId: 'Q105973249', isUnesco: true }, // WHS 362, 1986
  { countryCode: 'LY', name: 'Sabratha', category: 'site', latitude: 32.80528, longitude: 12.485, matchRadiusM: 1000, wikidataId: 'Q15052130', isUnesco: true }, // WHS 184, 1982
  { countryCode: 'LY', name: 'Tadrart Acacus', category: 'range', latitude: 24.83343, longitude: 10.33332, matchRadiusM: 60000, wikidataId: 'Q308807', isUnesco: true }, // WHS 287, 1985
  { countryCode: 'LT', name: 'Curonian Spit', category: 'site', latitude: 55.27444, longitude: 20.97083, matchRadiusM: 13000, wikidataId: 'Q5595', isUnesco: true }, // WHS 994, 2000
  { countryCode: 'LT', name: 'Kernavė', category: 'park', latitude: 54.88056, longitude: 24.84167, matchRadiusM: 20000, wikidataId: 'Q12676460', isUnesco: true }, // WHS 1137, 2004
  { countryCode: 'LT', name: 'Modernist Kaunas', category: 'site', latitude: 54.89694, longitude: 23.92917, matchRadiusM: 1500, wikidataId: 'Q64462328', isUnesco: true }, // WHS 1661, 2023
  { countryCode: 'LT', name: 'Vilnius Old Town', category: 'old town', latitude: 54.68333, longitude: 25.28333, matchRadiusM: 1500, wikidataId: 'Q445649', isUnesco: true }, // WHS 541, 1994
  { countryCode: 'LU', name: 'City of Luxembourg Old Quarters', category: 'old town', latitude: 49.61056, longitude: 6.1325, matchRadiusM: 1500, wikidataId: 'Q52112669', isUnesco: true }, // WHS 699, 1994
  { countryCode: 'MG', name: 'Rainforests of the Atsinanana (Ranomafana)', category: 'park', latitude: -21.22, longitude: 47.43, matchRadiusM: 14000, wikidataId: 'Q1498242', isUnesco: true }, // WHS 1257, 2007; site Q564321
  { countryCode: 'MG', name: 'Royal Hill of Ambohimanga', category: 'old town', latitude: -18.75917, longitude: 47.56278, matchRadiusM: 1500, wikidataId: 'Q458167', isUnesco: true }, // WHS 950, 2001
  { countryCode: 'MW', name: 'Chongoni Rock Art', category: 'site', latitude: -14.29333, longitude: 34.27917, matchRadiusM: 8000, wikidataId: 'Q832262', isUnesco: true }, // WHS 476, 2006
  { countryCode: 'MW', name: 'Mount Mulanje', category: 'range', latitude: -15.9, longitude: 35.65, matchRadiusM: 30000, wikidataId: 'Q1510436', isUnesco: true }, // WHS 1201, 2025
  { countryCode: 'MY', name: 'FRIM Forest Park, Selangor', category: 'park', latitude: 3.23333, longitude: 101.63333, matchRadiusM: 20000, wikidataId: 'Q135315506', isUnesco: true }, // WHS 1734, 2025
  { countryCode: 'MY', name: 'Gunung Mulu National Park', category: 'park', latitude: 4.0425, longitude: 114.8125, matchRadiusM: 16000, wikidataId: 'Q61535', isUnesco: true }, // WHS 1013, 2000
  { countryCode: 'MY', name: 'Kinabalu Park', category: 'park', latitude: 6.15, longitude: 116.65, matchRadiusM: 19000, wikidataId: 'Q834893', isUnesco: true }, // WHS 1012, 2000
  { countryCode: 'MY', name: 'Lenggong Valley', category: 'site', latitude: 5.06791, longitude: 100.972, matchRadiusM: 9500, wikidataId: 'Q3370009', isUnesco: true }, // WHS 1396, 2012
  { countryCode: 'MY', name: 'Melaka and George Town (Melaka)', category: 'old town', latitude: 2.18889, longitude: 102.25111, matchRadiusM: 1500, wikidataId: 'Q61089', isUnesco: true }, // WHS 1223, 2008; site Q15278743
  { countryCode: 'MY', name: 'Niah Caves', category: 'park', latitude: 3.81389, longitude: 113.78139, matchRadiusM: 5000, wikidataId: 'Q1984562', isUnesco: true }, // WHS 1014, 2024
  { countryCode: 'ML', name: 'Bandiagara Escarpment', category: 'park', latitude: 14.41667, longitude: -3.31667, matchRadiusM: 39000, wikidataId: 'Q650546', isUnesco: true }, // WHS 516, 1989
  { countryCode: 'ML', name: 'Old Towns of Djenné', category: 'old town', latitude: 13.90639, longitude: -4.555, matchRadiusM: 4000, wikidataId: 'Q15278644', isUnesco: true }, // WHS 116, 1988
  { countryCode: 'ML', name: 'Tomb of Askia', category: 'building', latitude: 16.28972, longitude: -0.04444, matchRadiusM: 300, wikidataId: 'Q503823', isUnesco: true }, // WHS 1139, 2004
  { countryCode: 'MT', name: 'City of Valletta', category: 'old town', latitude: 35.89778, longitude: 14.5125, matchRadiusM: 1500, wikidataId: 'Q23800', isUnesco: true }, // WHS 131, 1980
  { countryCode: 'MT', name: 'Megalithic Temples of Malta (Ġgantija)', category: 'site', latitude: 36.04727, longitude: 14.2691, matchRadiusM: 1500, wikidataId: 'Q216862', isUnesco: true }, // WHS 132, 1980; site Q753383
  { countryCode: 'MQ', name: 'Mount Pelée and the Pitons of Martinique', category: 'park', latitude: 14.7582, longitude: -61.0731, matchRadiusM: 20000, wikidataId: 'Q64842970', isUnesco: true }, // WHS 1657, 2023
  { countryCode: 'MR', name: 'Ancient Ksour of Mauritania (Chinguetti)', category: 'old town', latitude: 20.4633, longitude: -12.3667, matchRadiusM: 1500, wikidataId: 'Q65921575', isUnesco: true }, // WHS 750, 1996; site Q2845953
  { countryCode: 'MU', name: 'Aapravasi Ghat', category: 'site', latitude: -20.15861, longitude: 57.50306, matchRadiusM: 1000, wikidataId: 'Q9276', isUnesco: true }, // WHS 1227, 2006
  { countryCode: 'MX', name: 'Aqueduct of Padre Tembleque', category: 'building', latitude: 19.83639, longitude: -98.66222, matchRadiusM: 1500, wikidataId: 'Q2840764', isUnesco: true }, // WHS 1463, 2015
  { countryCode: 'MX', name: 'Calakmul', category: 'park', latitude: 18.105, longitude: -89.81056, matchRadiusM: 39000, wikidataId: 'Q272771', isUnesco: true }, // WHS 1061, 2002
  { countryCode: 'MX', name: 'Camino Real de Tierra Adentro', category: 'site', latitude: 22.60806, longitude: -102.37917, matchRadiusM: 15000, wikidataId: 'Q911953', isUnesco: true }, // WHS 1351, 2010
  { countryCode: 'MX', name: 'Campeche', category: 'old town', latitude: 19.84722, longitude: -90.54167, matchRadiusM: 1500, wikidataId: 'Q5762131', isUnesco: true }, // WHS 895, 1999
  { countryCode: 'MX', name: 'Caves of Yagul and Mitla', category: 'natural', latitude: 16.95083, longitude: -96.42111, matchRadiusM: 5000, wikidataId: 'Q15661566', isUnesco: true }, // WHS 1352, 2010
  { countryCode: 'MX', name: 'El Pinacate and Gran Desierto de Altar', category: 'park', latitude: 32, longitude: -113.91667, matchRadiusM: 41000, wikidataId: 'Q3821829', isUnesco: true }, // WHS 1410, 2013
  { countryCode: 'MX', name: 'El Tajín', category: 'old town', latitude: 20.44806, longitude: -97.37824, matchRadiusM: 1200, wikidataId: 'Q753895', isUnesco: true }, // WHS 631, 1992
  { countryCode: 'MX', name: 'El Vizcaíno Whale Sanctuary', category: 'natural', latitude: 27.75, longitude: -114.25, matchRadiusM: 32000, wikidataId: 'Q2068929', isUnesco: true }, // WHS 554, 1993; site Q12201148
  { countryCode: 'MX', name: 'Guanajuato', category: 'old town', latitude: 21.01778, longitude: -101.25667, matchRadiusM: 1500, wikidataId: 'Q61306', isUnesco: true }, // WHS 482, 1988
  { countryCode: 'MX', name: 'Gulf of California Islands (Espíritu Santo)', category: 'island', latitude: 24.47139, longitude: -110.3325, matchRadiusM: 6500, wikidataId: 'Q1040858', isUnesco: true }, // WHS 1182, 2005; site Q2383410
  { countryCode: 'MX', name: 'Historic Centre of Morelia', category: 'old town', latitude: 19.7, longitude: -101.18333, matchRadiusM: 1500, wikidataId: 'Q3848089', isUnesco: true }, // WHS 585, 1991
  { countryCode: 'MX', name: 'Historic Centre of Puebla', category: 'old town', latitude: 19.04722, longitude: -98.20833, matchRadiusM: 1500, wikidataId: 'Q3848455', isUnesco: true }, // WHS 416, 1987
  { countryCode: 'MX', name: 'Historic Centre of Zacatecas', category: 'old town', latitude: 22.76667, longitude: -102.55, matchRadiusM: 1500, wikidataId: 'Q3848116', isUnesco: true }, // WHS 676, 1993
  { countryCode: 'MX', name: 'Hospicio Cabañas', category: 'building', latitude: 20.6769, longitude: -103.33733, matchRadiusM: 500, wikidataId: 'Q28416', isUnesco: true }, // WHS 815, 1997
  { countryCode: 'MX', name: 'Luis Barragán House and Studio', category: 'building', latitude: 19.41111, longitude: -99.1925, matchRadiusM: 300, wikidataId: 'Q1046414', isUnesco: true }, // WHS 1136, 2004
  { countryCode: 'MX', name: 'Mexico City Centre and Xochimilco', category: 'old town', latitude: 19.41833, longitude: -99.13278, matchRadiusM: 5000, wikidataId: 'Q15924695', isUnesco: true }, // WHS 412, 1987
  { countryCode: 'MX', name: 'Monarch Butterfly Biosphere Reserve', category: 'park', latitude: 19.60639, longitude: -100.24167, matchRadiusM: 8000, wikidataId: 'Q852546', isUnesco: true }, // WHS 1290, 2008
  { countryCode: 'MX', name: 'Oaxaca and Monte Albán', category: 'old town', latitude: 17.06194, longitude: -96.72167, matchRadiusM: 5000, wikidataId: 'Q16743243', isUnesco: true }, // WHS 415, 1987
  { countryCode: 'MX', name: 'Palenque', category: 'park', latitude: 17.48417, longitude: -92.04639, matchRadiusM: 5000, wikidataId: 'Q181427', isUnesco: true }, // WHS 411, 1987
  { countryCode: 'MX', name: 'Paquimé', category: 'site', latitude: 30.37583, longitude: -107.95556, matchRadiusM: 1000, wikidataId: 'Q853265', isUnesco: true }, // WHS 560, 1998
  { countryCode: 'MX', name: 'Popocatépetl Monasteries (Cuernavaca)', category: 'building', latitude: 18.92021, longitude: -99.23678, matchRadiusM: 300, wikidataId: 'Q5192604', isUnesco: true }, // WHS 702, 1994; site Q1141009
  { countryCode: 'MX', name: 'Querétaro', category: 'old town', latitude: 20.58333, longitude: -100.36667, matchRadiusM: 1500, wikidataId: 'Q3848141', isUnesco: true }, // WHS 792, 1996
  { countryCode: 'MX', name: 'Revillagigedo Islands', category: 'archipelago', latitude: 18.82139, longitude: -112.76389, matchRadiusM: 10000, wikidataId: 'Q849318', isUnesco: true }, // WHS 1510, 2016
  { countryCode: 'MX', name: 'San Miguel de Allende and Atotonilco', category: 'park', latitude: 20.91444, longitude: -100.74639, matchRadiusM: 12000, wikidataId: 'Q15613314', isUnesco: true }, // WHS 1274, 2008
  { countryCode: 'MX', name: "Sian Ka'an", category: 'park', latitude: 19.38333, longitude: -87.79167, matchRadiusM: 49000, wikidataId: 'Q559789', isUnesco: true }, // WHS 410, 1987
  { countryCode: 'MX', name: 'Sierra de San Francisco Rock Paintings', category: 'site', latitude: 27.65556, longitude: -112.91611, matchRadiusM: 29000, wikidataId: 'Q552005', isUnesco: true }, // WHS 714, 1993
  { countryCode: 'MX', name: 'Sierra Gorda Franciscan Missions', category: 'site', latitude: 21.20389, longitude: -99.46389, matchRadiusM: 15000, wikidataId: 'Q751146', isUnesco: true }, // WHS 1079, 2003
  { countryCode: 'MX', name: 'Tehuacán-Cuicatlán Valley', category: 'park', latitude: 18.2114, longitude: -97.3994, matchRadiusM: 26000, wikidataId: 'Q5853681', isUnesco: true }, // WHS 1534, 2018
  { countryCode: 'MX', name: 'Teotihuacan', category: 'site', latitude: 19.6925, longitude: -98.84389, matchRadiusM: 1300, wikidataId: 'Q172613', isUnesco: true }, // WHS 414, 1987
  { countryCode: 'MX', name: 'Tequila Agave Landscape', category: 'site', latitude: 20.88194, longitude: -103.83611, matchRadiusM: 2000, wikidataId: 'Q847764', isUnesco: true }, // WHS 1209, 2006; site Q2104675
  { countryCode: 'MX', name: 'Tlacotalpan', category: 'site', latitude: 18.61303, longitude: -95.65627, matchRadiusM: 1000, wikidataId: 'Q903792', isUnesco: true }, // WHS 862, 1998
  { countryCode: 'MX', name: 'UNAM Ciudad Universitaria', category: 'site', latitude: 19.33222, longitude: -99.18806, matchRadiusM: 1100, wikidataId: 'Q130025', isUnesco: true }, // WHS 1250, 2007
  { countryCode: 'MX', name: 'Uxmal', category: 'park', latitude: 20.3617, longitude: -89.7703, matchRadiusM: 15000, wikidataId: 'Q65455940', isUnesco: true }, // WHS 791, 1996
  { countryCode: 'MX', name: 'Wixárika Route to Wirikuta', category: 'site', latitude: 23.93333, longitude: -100.76667, matchRadiusM: 1500, wikidataId: 'Q5934961', isUnesco: true }, // WHS 1704, 2025
  { countryCode: 'MX', name: 'Xochicalco', category: 'site', latitude: 18.80431, longitude: -99.29664, matchRadiusM: 2000, wikidataId: 'Q797120', isUnesco: true }, // WHS 939, 1999
  { countryCode: 'FM', name: 'Nan Madol', category: 'site', latitude: 6.84194, longitude: 158.33222, matchRadiusM: 1000, wikidataId: 'Q846967', isUnesco: true }, // WHS 1503, 2016
  { countryCode: 'MN', name: 'Burkhan Khaldun', category: 'mountain', latitude: 48.78333, longitude: 109.16667, matchRadiusM: 35000, wikidataId: 'Q1010335', isUnesco: true }, // WHS 1440, 2015
  { countryCode: 'MN', name: 'Deer Stone Monuments (Uushigiin Övör)', category: 'site', latitude: 49.65536, longitude: 99.92833, matchRadiusM: 1500, wikidataId: 'Q136659732', isUnesco: true }, // WHS 1621, 2023; site Q66133349
  { countryCode: 'MN', name: 'Mongolian Altai Petroglyphs', category: 'site', latitude: 49.334, longitude: 88.3954, matchRadiusM: 3500, wikidataId: 'Q7849290', isUnesco: true }, // WHS 1382, 2011; site Q4361429
  { countryCode: 'MN', name: 'Uvs Nuur Basin (Uvs Lake)', category: 'park', latitude: 50.3, longitude: 92.7, matchRadiusM: 39000, wikidataId: 'Q81150', isUnesco: true }, // WHS 769, 2003; site Q64797735
  { countryCode: 'MN', name: 'Xiongnu Nobility Cemeteries (Noin-Ula)', category: 'site', latitude: 48.38622, longitude: 106.75497, matchRadiusM: 1500, wikidataId: 'Q4822100', isUnesco: true }, // WHS 1759, 2026; site Q140697603
  { countryCode: 'ME', name: 'Durmitor National Park', category: 'park', latitude: 43.1532, longitude: 19.03687, matchRadiusM: 12000, wikidataId: 'Q3364446', isUnesco: true }, // WHS 100, 1980
  { countryCode: 'MA', name: 'Aït Benhaddou', category: 'old town', latitude: 31.05, longitude: -7.13333, matchRadiusM: 1000, wikidataId: 'Q309436', isUnesco: true }, // WHS 444, 1987
  { countryCode: 'MA', name: 'Historic City of Meknes', category: 'old town', latitude: 33.89486, longitude: -5.56448, matchRadiusM: 1500, wikidataId: 'Q12352436', isUnesco: true }, // WHS 793, 1996
  { countryCode: 'MA', name: 'Mazagan (El Jadida)', category: 'old town', latitude: 33.25656, longitude: -8.50248, matchRadiusM: 1500, wikidataId: 'Q555360', isUnesco: true }, // WHS 1058, 2004
  { countryCode: 'MA', name: 'Medina of Essaouira', category: 'old town', latitude: 31.51441, longitude: -9.7689, matchRadiusM: 3000, wikidataId: 'Q11858823', isUnesco: true }, // WHS 753, 2001
  { countryCode: 'MA', name: 'Medina of Fez', category: 'old town', latitude: 34.0625, longitude: -4.9725, matchRadiusM: 2500, wikidataId: 'Q2072102', isUnesco: true }, // WHS 170, 1981
  { countryCode: 'MA', name: 'Medina of Marrakesh', category: 'old town', latitude: 31.63139, longitude: -7.98667, matchRadiusM: 4500, wikidataId: 'Q966780', isUnesco: true }, // WHS 331, 1985
  { countryCode: 'MA', name: 'Medina of Tétouan', category: 'old town', latitude: 35.57106, longitude: -5.36647, matchRadiusM: 1500, wikidataId: 'Q3847588', isUnesco: true }, // WHS 837, 1997
  { countryCode: 'MA', name: 'Rabat, Modern Capital and Historic City', category: 'old town', latitude: 34.0242, longitude: -6.8228, matchRadiusM: 3000, wikidataId: 'Q65926560', isUnesco: true }, // WHS 1401, 2012
  { countryCode: 'MA', name: 'Volubilis', category: 'site', latitude: 34.03996, longitude: -5.56269, matchRadiusM: 1000, wikidataId: 'Q391215', isUnesco: true }, // WHS 836, 1997
  { countryCode: 'MM', name: 'Pyu Ancient Cities (Sri Ksetra)', category: 'site', latitude: 18.81667, longitude: 95.31667, matchRadiusM: 3000, wikidataId: 'Q1535245', isUnesco: true }, // WHS 1444, 2014; site Q17277938
  { countryCode: 'NA', name: 'Namib Sand Sea', category: 'park', latitude: -24.88528, longitude: 15.40778, matchRadiusM: 20000, wikidataId: 'Q65241628', isUnesco: true }, // WHS 1430, 2013
  { countryCode: 'NA', name: 'Twyfelfontein', category: 'site', latitude: -20.59558, longitude: 14.37258, matchRadiusM: 1000, wikidataId: 'Q754791', isUnesco: true }, // WHS 1255, 2007
  { countryCode: 'NP', name: 'Chitwan National Park', category: 'park', latitude: 27.5, longitude: 84.33333, matchRadiusM: 21000, wikidataId: 'Q1075023', isUnesco: true }, // WHS 284, 1984
  { countryCode: 'NP', name: 'Lumbini', category: 'site', latitude: 27.4814, longitude: 83.27583, matchRadiusM: 1000, wikidataId: 'Q9213', isUnesco: true }, // WHS 666, 1997
  { countryCode: 'NP', name: 'Sagarmatha National Park', category: 'park', latitude: 27.89107, longitude: 86.69303, matchRadiusM: 23000, wikidataId: 'Q2211959', isUnesco: true }, // WHS 120, 1979
  { countryCode: 'NL', name: 'Amsterdam Canal Ring', category: 'old town', latitude: 52.36639, longitude: 4.88583, matchRadiusM: 2000, wikidataId: 'Q478707', isUnesco: true }, // WHS 1349, 2010
  { countryCode: 'NL', name: 'Beemster Polder', category: 'old town', latitude: 52.55, longitude: 4.9278, matchRadiusM: 1500, wikidataId: 'Q9900', isUnesco: true }, // WHS 899, 1999
  { countryCode: 'NL', name: 'Colonies of Benevolence (Veenhuizen)', category: 'old town', latitude: 53.0328, longitude: 6.3958, matchRadiusM: 1500, wikidataId: 'Q107783704', isUnesco: true }, // WHS 1555, 2021; site Q64590591
  { countryCode: 'NL', name: 'D.F. Wouda Steam Pumping Station', category: 'building', latitude: 52.84583, longitude: 5.67889, matchRadiusM: 400, wikidataId: 'Q1121835', isUnesco: true }, // WHS 867, 1998
  { countryCode: 'NL', name: 'Dutch Water Defence Lines', category: 'site', latitude: 52.05861, longitude: 5.16833, matchRadiusM: 15000, wikidataId: 'Q64590253', isUnesco: true }, // WHS 759, 1996
  { countryCode: 'NL', name: 'Eisinga Planetarium', category: 'building', latitude: 53.18738, longitude: 5.54375, matchRadiusM: 500, wikidataId: 'Q601223', isUnesco: true }, // WHS 1683, 2023
  { countryCode: 'NL', name: 'Kinderdijk Windmills', category: 'site', latitude: 51.88861, longitude: 4.63472, matchRadiusM: 1400, wikidataId: 'Q12012965', isUnesco: true }, // WHS 818, 1997
  { countryCode: 'NL', name: 'Rietveld Schröder House', category: 'building', latitude: 52.08533, longitude: 5.1476, matchRadiusM: 500, wikidataId: 'Q914231', isUnesco: true }, // WHS 965, 2000
  { countryCode: 'NL', name: 'Schokland', category: 'site', latitude: 52.63861, longitude: 5.77167, matchRadiusM: 2500, wikidataId: 'Q140869527', isUnesco: true }, // WHS 739, 1995
  { countryCode: 'NL', name: 'Van Nelle Factory', category: 'building', latitude: 51.92278, longitude: 4.43361, matchRadiusM: 400, wikidataId: 'Q2328849', isUnesco: true }, // WHS 1441, 2014
  { countryCode: 'NC', name: 'Lagoons of New Caledonia (Grand Lagon Sud)', category: 'park', latitude: -22.5125, longitude: 166.95972, matchRadiusM: 38000, wikidataId: 'Q64399599', isUnesco: true }, // WHS 1115, 2008; site Q1330981
  { countryCode: 'NZ', name: 'NZ Sub-Antarctic Islands (Auckland Islands)', category: 'archipelago', latitude: -50.7, longitude: 166.1, matchRadiusM: 17000, wikidataId: 'Q326951', isUnesco: true }, // WHS 877, 1998; site Q46275
  { countryCode: 'NZ', name: 'Tongariro National Park', category: 'park', latitude: -39.2, longitude: 175.58333, matchRadiusM: 19000, wikidataId: 'Q202845', isUnesco: true }, // WHS 421, 1990
  { countryCode: 'NI', name: 'León Cathedral', category: 'building', latitude: 12.435, longitude: -86.8781, matchRadiusM: 300, wikidataId: 'Q48605', isUnesco: true }, // WHS 1236, 2011
  { countryCode: 'NE', name: 'Historic Centre of Agadez', category: 'old town', latitude: 16.9744, longitude: 7.9896, matchRadiusM: 1500, wikidataId: 'Q47800464', isUnesco: true }, // WHS 1268, 2013
  { countryCode: 'NG', name: 'Osun-Osogbo Sacred Grove', category: 'park', latitude: 7.75556, longitude: 4.55222, matchRadiusM: 5000, wikidataId: 'Q621498', isUnesco: true }, // WHS 1118, 2005
  { countryCode: 'KP', name: 'Koguryo Tombs', category: 'site', latitude: 38.86306, longitude: 125.415, matchRadiusM: 12000, wikidataId: 'Q277525', isUnesco: true }, // WHS 1091, 2004
  { countryCode: 'KP', name: 'Mount Kumgang', category: 'range', latitude: 38.65676, longitude: 128.1049, matchRadiusM: 30000, wikidataId: 'Q495501', isUnesco: true }, // WHS 1642, 2025
  { countryCode: 'NO', name: 'Rjukan-Notodden Industrial Heritage', category: 'site', latitude: 59.87861, longitude: 8.59361, matchRadiusM: 1500, wikidataId: 'Q20643889', isUnesco: true }, // WHS 1486, 2015
  { countryCode: 'NO', name: 'Rock Art of Alta', category: 'site', latitude: 69.94694, longitude: 23.18778, matchRadiusM: 13000, wikidataId: 'Q433634', isUnesco: true }, // WHS 352, 1985
  { countryCode: 'NO', name: 'Røros Mining Town', category: 'site', latitude: 62.57389, longitude: 11.38556, matchRadiusM: 1000, wikidataId: 'Q19387263', isUnesco: true }, // WHS 55, 1980
  { countryCode: 'NO', name: 'Urnes Stave Church', category: 'building', latitude: 61.29806, longitude: 7.3225, matchRadiusM: 300, wikidataId: 'Q210678', isUnesco: true }, // WHS 58, 1979
  { countryCode: 'NO', name: 'Vega Archipelago', category: 'archipelago', latitude: 65.63333, longitude: 11.9, matchRadiusM: 30000, wikidataId: 'Q829084', isUnesco: true }, // WHS 1143, 2004
  { countryCode: 'NO', name: 'West Norwegian Fjords (Geirangerfjord)', category: 'natural', latitude: 62.09444, longitude: 7.08056, matchRadiusM: 5000, wikidataId: 'Q193989', isUnesco: true }, // WHS 1195, 2005; site Q12269990
  { countryCode: 'OM', name: 'Aflaj of Oman (Falaj Daris)', category: 'site', latitude: 22.9833, longitude: 57.5333, matchRadiusM: 1500, wikidataId: 'Q66134053', isUnesco: true }, // WHS 1207, 2006; site Q25495
  { countryCode: 'OM', name: 'Ancient City of Qalhat', category: 'old town', latitude: 22.7, longitude: 59.3699, matchRadiusM: 1500, wikidataId: 'Q680322', isUnesco: true }, // WHS 1537, 2018
  { countryCode: 'OM', name: 'Bat, Al-Khutm and Al-Ayn', category: 'site', latitude: 23.27, longitude: 56.745, matchRadiusM: 1500, wikidataId: 'Q25496', isUnesco: true }, // WHS 434, 1988
  { countryCode: 'OM', name: 'Land of Frankincense (Al Baleed)', category: 'site', latitude: 17.00892, longitude: 54.13456, matchRadiusM: 1000, wikidataId: 'Q12184607', isUnesco: true }, // WHS 1010, 2000; site Q118468
  { countryCode: 'PK', name: 'Lahore Fort and Shalamar Gardens', category: 'site', latitude: 31.59028, longitude: 74.30972, matchRadiusM: 7500, wikidataId: 'Q155727', isUnesco: true }, // WHS 171, 1981
  { countryCode: 'PK', name: 'Makli Necropolis, Thatta', category: 'park', latitude: 24.75639, longitude: 67.89861, matchRadiusM: 20000, wikidataId: 'Q10332177', isUnesco: true }, // WHS 143, 1981
  { countryCode: 'PK', name: 'Rohtas Fort', category: 'building', latitude: 32.96528, longitude: 73.57642, matchRadiusM: 500, wikidataId: 'Q155188', isUnesco: true }, // WHS 586, 1997
  { countryCode: 'PK', name: 'Takht-i-Bahi', category: 'park', latitude: 34.32083, longitude: 71.94583, matchRadiusM: 20000, wikidataId: 'Q15240737', isUnesco: true }, // WHS 140, 1980
  { countryCode: 'PK', name: 'Taxila', category: 'site', latitude: 33.74583, longitude: 72.7875, matchRadiusM: 13000, wikidataId: 'Q156093', isUnesco: true }, // WHS 139, 1980
  { countryCode: 'PS', name: 'Ancient Jericho', category: 'site', latitude: 31.87172, longitude: 35.44456, matchRadiusM: 1000, wikidataId: 'Q2402267', isUnesco: true }, // WHS 1687, 2023
  { countryCode: 'PS', name: 'Battir: Land of Olives and Vines', category: 'site', latitude: 31.71972, longitude: 35.13056, matchRadiusM: 1500, wikidataId: 'Q18031707', isUnesco: true }, // WHS 1492, 2014
  { countryCode: 'PS', name: 'Hebron Old Town', category: 'old town', latitude: 31.52528, longitude: 35.10833, matchRadiusM: 1500, wikidataId: 'Q35584069', isUnesco: true }, // WHS 1565, 2017
  { countryCode: 'PS', name: 'Old City of Jerusalem', category: 'old town', latitude: 31.77821, longitude: 35.23191, matchRadiusM: 1500, wikidataId: 'Q15726304', isUnesco: true }, // WHS 148, 1981; where the map puts it (Wikidata: Israel)
  { countryCode: 'PS', name: 'Saint Hilarion Monastery', category: 'site', latitude: 31.44722, longitude: 34.36639, matchRadiusM: 1500, wikidataId: 'Q7697530', isUnesco: true }, // WHS 1749, 2024
  { countryCode: 'PS', name: 'Sebastia', category: 'old town', latitude: 32.26667, longitude: 35.18333, matchRadiusM: 1500, wikidataId: 'Q2918480', isUnesco: true }, // WHS 1809, 2026
  { countryCode: 'PA', name: 'Coiba National Park', category: 'park', latitude: 7.48, longitude: -81.79, matchRadiusM: 15000, wikidataId: 'Q741636', isUnesco: true }, // WHS 1138, 2005
  { countryCode: 'PA', name: 'Colonial Transisthmian Route (Casco Viejo)', category: 'old town', latitude: 8.9525, longitude: -79.535, matchRadiusM: 1500, wikidataId: 'Q2945651', isUnesco: true }, // WHS 1582, 2025; site Q65508609
  { countryCode: 'PA', name: 'Darién National Park', category: 'park', latitude: 7.73611, longitude: -77.54722, matchRadiusM: 52000, wikidataId: 'Q48608', isUnesco: true }, // WHS 159, 1981
  { countryCode: 'PA', name: 'Portobelo and San Lorenzo', category: 'site', latitude: 9.55389, longitude: -79.65583, matchRadiusM: 1500, wikidataId: 'Q3320082', isUnesco: true }, // WHS 135, 1980
  { countryCode: 'PG', name: 'Kuk Early Agricultural Site', category: 'site', latitude: -5.7825, longitude: 144.33, matchRadiusM: 1000, wikidataId: 'Q1165562', isUnesco: true }, // WHS 887, 2008
  { countryCode: 'PE', name: 'Caral', category: 'site', latitude: -10.89361, longitude: -77.52028, matchRadiusM: 1900, wikidataId: 'Q219279', isUnesco: true }, // WHS 1269, 2009
  { countryCode: 'PE', name: 'Chan Chan', category: 'site', latitude: -8.11056, longitude: -79.075, matchRadiusM: 2500, wikidataId: 'Q277540', isUnesco: true }, // WHS 366, 1986
  { countryCode: 'PE', name: 'Chankillo', category: 'site', latitude: -9.5569, longitude: -78.2359, matchRadiusM: 8000, wikidataId: 'Q108016068', isUnesco: true }, // WHS 1624, 2021
  { countryCode: 'PE', name: 'Chavín de Huántar', category: 'site', latitude: -9.59277, longitude: -77.17845, matchRadiusM: 1000, wikidataId: 'Q732554', isUnesco: true }, // WHS 330, 1985
  { countryCode: 'PE', name: 'Historic Centre of Arequipa', category: 'old town', latitude: -16.4, longitude: -71.53333, matchRadiusM: 1500, wikidataId: 'Q8343756', isUnesco: true }, // WHS 1016, 2000
  { countryCode: 'PE', name: 'Historic Centre of Cusco', category: 'old town', latitude: -13.51833, longitude: -71.97806, matchRadiusM: 1900, wikidataId: 'Q28502997', isUnesco: true }, // WHS 273, 1983
  { countryCode: 'PE', name: 'Historic Centre of Lima', category: 'old town', latitude: -12.05139, longitude: -77.04306, matchRadiusM: 4000, wikidataId: 'Q3320442', isUnesco: true }, // WHS 500, 1988
  { countryCode: 'PE', name: 'Huascarán National Park', category: 'park', latitude: -9.4, longitude: -77.4, matchRadiusM: 40000, wikidataId: 'Q917369', isUnesco: true }, // WHS 333, 1985
  { countryCode: 'PE', name: 'Manú National Park', category: 'park', latitude: -12.14, longitude: -71.66, matchRadiusM: 60000, wikidataId: 'Q390264', isUnesco: true }, // WHS 402, 1987
  { countryCode: 'PE', name: 'Nazca Lines', category: 'site', latitude: -14.6975, longitude: -75.135, matchRadiusM: 19000, wikidataId: 'Q2620036', isUnesco: true }, // WHS 700, 1994
  { countryCode: 'PE', name: 'Qhapaq Ñan (Pachacámac)', category: 'site', latitude: -12.25185, longitude: -76.90619, matchRadiusM: 1500, wikidataId: 'Q430563', isUnesco: true }, // WHS 1459, 2014; site Q948975
  { countryCode: 'PE', name: 'Río Abiseo National Park', category: 'park', latitude: -7.75, longitude: -77.25, matchRadiusM: 36000, wikidataId: 'Q941412', isUnesco: true }, // WHS 548, 1990
  { countryCode: 'PH', name: 'Mount Hamiguitan', category: 'park', latitude: 6.74, longitude: 126.182, matchRadiusM: 7000, wikidataId: 'Q17494587', isUnesco: true }, // WHS 1403, 2014
  { countryCode: 'PH', name: 'Philippine Baroque Churches (San Agustin)', category: 'building', latitude: 14.58886, longitude: 120.97535, matchRadiusM: 300, wikidataId: 'Q1306513', isUnesco: true }, // WHS 677, 1993; site Q808563
  { countryCode: 'PH', name: 'Puerto Princesa Underground River', category: 'park', latitude: 10.16667, longitude: 118.91667, matchRadiusM: 10000, wikidataId: 'Q824602', isUnesco: true }, // WHS 652, 1999
  { countryCode: 'PH', name: 'Tubbataha Reefs', category: 'park', latitude: 8.95333, longitude: 119.8675, matchRadiusM: 21000, wikidataId: 'Q927108', isUnesco: true }, // WHS 653, 1993
  { countryCode: 'PH', name: 'Vigan', category: 'old town', latitude: 17.57472, longitude: 120.38694, matchRadiusM: 1500, wikidataId: 'Q235004', isUnesco: true }, // WHS 502, 1999
  { countryCode: 'PL', name: 'Auschwitz-Birkenau', category: 'site', latitude: 50.03583, longitude: 19.17833, matchRadiusM: 2500, wikidataId: 'Q819729', isUnesco: true }, // WHS 31, 1979
  { countryCode: 'PL', name: 'Centennial Hall, Wrocław', category: 'building', latitude: 51.10694, longitude: 17.07722, matchRadiusM: 600, wikidataId: 'Q155743', isUnesco: true }, // WHS 1165, 2006
  { countryCode: 'PL', name: 'Churches of Peace in Jawor and Świdnica', category: 'site', latitude: 51.05391, longitude: 16.18904, matchRadiusM: 1000, wikidataId: 'Q589634', isUnesco: true }, // WHS 1054, 2001
  { countryCode: 'PL', name: 'Gdynia Modernist City Centre', category: 'old town', latitude: 54.51953, longitude: 18.53891, matchRadiusM: 1500, wikidataId: 'Q9395907', isUnesco: true }, // WHS 1715, 2026
  { countryCode: 'PL', name: 'Historic Centre of Kraków', category: 'old town', latitude: 50.06209, longitude: 19.93688, matchRadiusM: 1500, wikidataId: 'Q652634', isUnesco: true }, // WHS 29, 1978
  { countryCode: 'PL', name: 'Historic Centre of Warsaw', category: 'old town', latitude: 52.24972, longitude: 21.01222, matchRadiusM: 1500, wikidataId: 'Q1139084', isUnesco: true }, // WHS 30, 1980
  { countryCode: 'PL', name: 'Kalwaria Zebrzydowska', category: 'site', latitude: 49.86032, longitude: 19.67072, matchRadiusM: 1500, wikidataId: 'Q1280433', isUnesco: true }, // WHS 905, 1999
  { countryCode: 'PL', name: 'Krzemionki Flint Mines', category: 'site', latitude: 50.968, longitude: 21.5023, matchRadiusM: 10000, wikidataId: 'Q66056891', isUnesco: true }, // WHS 1599, 2019
  { countryCode: 'PL', name: 'Malbork Castle', category: 'building', latitude: 54.03972, longitude: 19.02778, matchRadiusM: 500, wikidataId: 'Q71279', isUnesco: true }, // WHS 847, 1997
  { countryCode: 'PL', name: 'Medieval Town of Toruń', category: 'old town', latitude: 53.01028, longitude: 18.60472, matchRadiusM: 1500, wikidataId: 'Q9390606', isUnesco: true }, // WHS 835, 1997
  { countryCode: 'PL', name: 'Muskau Park', category: 'site', latitude: 51.54756, longitude: 14.72323, matchRadiusM: 1500, wikidataId: 'Q156308', isUnesco: true }, // WHS 1127, 2004
  { countryCode: 'PL', name: 'Old City of Zamość', category: 'old town', latitude: 50.72056, longitude: 23.25861, matchRadiusM: 1500, wikidataId: 'Q3678597', isUnesco: true }, // WHS 564, 1992
  { countryCode: 'PL', name: 'Tarnowskie Góry Silver Mine', category: 'site', latitude: 50.4427, longitude: 18.85123, matchRadiusM: 3000, wikidataId: 'Q48841031', isUnesco: true }, // WHS 1539, 2017
  { countryCode: 'PL', name: 'Wooden Churches of Małopolska (Dębno)', category: 'building', latitude: 49.4665, longitude: 20.212, matchRadiusM: 300, wikidataId: 'Q11747195', isUnesco: true }, // WHS 1053, 2003; site Q854267
  { countryCode: 'PL', name: 'Wooden Tserkvas of the Carpathians (Brunary)', category: 'building', latitude: 49.53406, longitude: 21.03257, matchRadiusM: 300, wikidataId: 'Q9187742', isUnesco: true }, // WHS 1424, 2013; site Q8032604
  { countryCode: 'PT', name: 'Alcobaça Monastery', category: 'building', latitude: 39.54859, longitude: -8.97863, matchRadiusM: 300, wikidataId: 'Q593147', isUnesco: true }, // WHS 505, 1989
  { countryCode: 'PT', name: 'Alto Douro Wine Region', category: 'site', latitude: 41.16575, longitude: -7.51774, matchRadiusM: 11000, wikidataId: 'Q649738', isUnesco: true }, // WHS 1046, 2001
  { countryCode: 'PT', name: 'Angra do Heroísmo', category: 'old town', latitude: 38.655, longitude: -27.22, matchRadiusM: 1500, wikidataId: 'Q2945656', isUnesco: true }, // WHS 206, 1983
  { countryCode: 'PT', name: 'Batalha Monastery', category: 'building', latitude: 39.65917, longitude: -8.82611, matchRadiusM: 300, wikidataId: 'Q174779', isUnesco: true }, // WHS 264, 1983
  { countryCode: 'PT', name: 'Bom Jesus do Monte', category: 'park', latitude: 41.5546, longitude: -8.3775, matchRadiusM: 5000, wikidataId: 'Q2707216', isUnesco: true }, // WHS 1590, 2019
  { countryCode: 'PT', name: 'Côa Valley and Siega Verde Rock Art', category: 'site', latitude: 41.03333, longitude: -7.11667, matchRadiusM: 1500, wikidataId: 'Q552106', isUnesco: true }, // WHS 866, 1998; site Q39258498
  { countryCode: 'PT', name: 'Convent of Christ, Tomar', category: 'building', latitude: 39.60364, longitude: -8.41926, matchRadiusM: 500, wikidataId: 'Q736692', isUnesco: true }, // WHS 265, 1983
  { countryCode: 'PT', name: 'Elvas Fortifications', category: 'site', latitude: 38.88056, longitude: -7.16333, matchRadiusM: 2000, wikidataId: 'Q5524023', isUnesco: true }, // WHS 1367, 2012
  { countryCode: 'PT', name: 'Historic Centre of Évora', category: 'old town', latitude: 38.57306, longitude: -7.90778, matchRadiusM: 1500, wikidataId: 'Q8343770', isUnesco: true }, // WHS 361, 1986
  { countryCode: 'PT', name: 'Historic Centre of Guimarães', category: 'old town', latitude: 41.44516, longitude: -8.29084, matchRadiusM: 1500, wikidataId: 'Q2945649', isUnesco: true }, // WHS 1031, 2001
  { countryCode: 'PT', name: 'Historic Centre of Porto', category: 'old town', latitude: 41.14319, longitude: -8.61297, matchRadiusM: 1500, wikidataId: 'Q3848157', isUnesco: true }, // WHS 755, 1996
  { countryCode: 'PT', name: 'Laurisilva of Madeira', category: 'park', latitude: 32.76667, longitude: -17, matchRadiusM: 8500, wikidataId: 'Q11257230', isUnesco: true }, // WHS 934, 1999
  { countryCode: 'PT', name: 'Pico Island Vineyards', category: 'island', latitude: 38.51333, longitude: -28.54111, matchRadiusM: 13000, wikidataId: 'Q2448665', isUnesco: true }, // WHS 1117, 2004
  { countryCode: 'PT', name: 'Royal Building of Mafra', category: 'site', latitude: 38.93692, longitude: -9.32639, matchRadiusM: 2000, wikidataId: 'Q54948065', isUnesco: true }, // WHS 1573, 2019
  { countryCode: 'PT', name: 'Sintra', category: 'site', latitude: 38.78839, longitude: -9.43382, matchRadiusM: 2500, wikidataId: 'Q3848197', isUnesco: true }, // WHS 723, 1995
  { countryCode: 'PT', name: 'University of Coimbra', category: 'old town', latitude: 40.20781, longitude: -8.42577, matchRadiusM: 1500, wikidataId: 'Q15229957', isUnesco: true }, // WHS 1387, 2013
  { countryCode: 'PR', name: 'La Fortaleza and Old San Juan', category: 'site', latitude: 18.46389, longitude: -66.11917, matchRadiusM: 2500, wikidataId: 'Q15813904', isUnesco: true }, // WHS 266, 1983
  { countryCode: 'RE', name: 'Pitons, Cirques and Remparts of Réunion', category: 'park', latitude: -21.0994, longitude: 55.48, matchRadiusM: 5000, wikidataId: 'Q2710055', isUnesco: true }, // WHS 1317, 2010
  { countryCode: 'RO', name: 'Brâncuși Ensemble, Târgu Jiu', category: 'site', latitude: 45.03743, longitude: 23.28537, matchRadiusM: 1500, wikidataId: 'Q4680630', isUnesco: true }, // WHS 1473, 2024
  { countryCode: 'RO', name: 'Dacian Fortresses of Orăștie', category: 'site', latitude: 45.6231, longitude: 23.3119, matchRadiusM: 15000, wikidataId: 'Q729327', isUnesco: true }, // WHS 906, 1999
  { countryCode: 'RO', name: 'Dacian Limes', category: 'site', latitude: 47.18079, longitude: 23.15941, matchRadiusM: 1500, wikidataId: 'Q14752597', isUnesco: true }, // WHS 1718, 2024
  { countryCode: 'RO', name: 'Danube Delta', category: 'natural', latitude: 45.2, longitude: 29.5, matchRadiusM: 38000, wikidataId: 'Q184429', isUnesco: true }, // WHS 588, 1991
  { countryCode: 'RO', name: 'Fortified Churches of Transylvania (Biertan)', category: 'building', latitude: 46.1352, longitude: 24.5213, matchRadiusM: 800, wikidataId: 'Q16743875', isUnesco: true }, // WHS 596, 1993; site Q89675
  { countryCode: 'RO', name: 'Historic Centre of Sighișoara', category: 'old town', latitude: 46.21778, longitude: 24.79222, matchRadiusM: 1500, wikidataId: 'Q1075681', isUnesco: true }, // WHS 902, 1999
  { countryCode: 'RO', name: 'Horezu Monastery', category: 'building', latitude: 45.1686, longitude: 24.0069, matchRadiusM: 500, wikidataId: 'Q733069', isUnesco: true }, // WHS 597, 1993
  { countryCode: 'RO', name: 'Painted Churches of Moldavia (Voroneț)', category: 'building', latitude: 47.51704, longitude: 25.86416, matchRadiusM: 300, wikidataId: 'Q384463', isUnesco: true }, // WHS 598, 1993; site Q387687
  { countryCode: 'RO', name: 'Roșia Montană', category: 'site', latitude: 46.30611, longitude: 23.13056, matchRadiusM: 1500, wikidataId: 'Q47915816', isUnesco: true }, // WHS 1552, 2021
  { countryCode: 'RO', name: 'Wooden Churches of Maramureș', category: 'site', latitude: 47.8194, longitude: 24.0558, matchRadiusM: 15000, wikidataId: 'Q828412', isUnesco: true }, // WHS 904, 1999
  { countryCode: 'RU', name: 'Bolgar', category: 'site', latitude: 54.97889, longitude: 49.05639, matchRadiusM: 1500, wikidataId: 'Q47519282', isUnesco: true }, // WHS 981, 2014
  { countryCode: 'RU', name: 'Central Sikhote-Alin', category: 'park', latitude: 46.68333, longitude: 136.66111, matchRadiusM: 25000, wikidataId: 'Q64787152', isUnesco: true }, // WHS 766, 2001
  { countryCode: 'RU', name: 'Church of the Ascension, Kolomenskoye', category: 'building', latitude: 55.66722, longitude: 37.67083, matchRadiusM: 500, wikidataId: 'Q220951', isUnesco: true }, // WHS 634, 1994
  { countryCode: 'RU', name: 'Derbent Citadel and Old City', category: 'old town', latitude: 42.06917, longitude: 48.29583, matchRadiusM: 4500, wikidataId: 'Q64763166', isUnesco: true }, // WHS 1070, 2003
  { countryCode: 'RU', name: 'Ferapontov Monastery', category: 'building', latitude: 59.95639, longitude: 38.5675, matchRadiusM: 500, wikidataId: 'Q838256', isUnesco: true }, // WHS 982, 2000
  { countryCode: 'RU', name: 'Golden Mountains of Altai (Lake Teletskoye)', category: 'park', latitude: 51.49722, longitude: 87.71111, matchRadiusM: 60000, wikidataId: 'Q64787245', isUnesco: true }, // WHS 768, 1998; site Q155495
  { countryCode: 'RU', name: 'Historic Centre of Saint Petersburg', category: 'old town', latitude: 59.93889, longitude: 30.31556, matchRadiusM: 5000, wikidataId: 'Q616578', isUnesco: true }, // WHS 540, 1990
  { countryCode: 'RU', name: 'Historic Centre of Yaroslavl', category: 'old town', latitude: 57.62361, longitude: 39.8875, matchRadiusM: 1500, wikidataId: 'Q4204534', isUnesco: true }, // WHS 1170, 2005
  { countryCode: 'RU', name: 'Historic Monuments of Novgorod', category: 'old town', latitude: 58.51833, longitude: 31.28556, matchRadiusM: 5000, wikidataId: 'Q1218832', isUnesco: true }, // WHS 604, 1992
  { countryCode: 'RU', name: 'Kazan Kremlin', category: 'site', latitude: 55.79744, longitude: 49.10724, matchRadiusM: 1500, wikidataId: 'Q603622', isUnesco: true }, // WHS 980, 2000
  { countryCode: 'RU', name: 'Kazan University Observatories', category: 'site', latitude: 55.79091, longitude: 49.1191, matchRadiusM: 15000, wikidataId: 'Q122730525', isUnesco: true }, // WHS 1678, 2023
  { countryCode: 'RU', name: 'Kenozero Lake', category: 'site', latitude: 61.928, longitude: 38.17261, matchRadiusM: 1500, wikidataId: 'Q128597769', isUnesco: true }, // WHS 1688, 2024
  { countryCode: 'RU', name: 'Kizhi Pogost', category: 'site', latitude: 62.06767, longitude: 35.22345, matchRadiusM: 1000, wikidataId: 'Q477462', isUnesco: true }, // WHS 544, 1990
  { countryCode: 'RU', name: 'Lake Baikal', category: 'natural', latitude: 53.30278, longitude: 108.00472, matchRadiusM: 60000, wikidataId: 'Q5513', isUnesco: true }, // WHS 754, 1996
  { countryCode: 'RU', name: 'Landscapes of Dauria', category: 'park', latitude: 49.93022, longitude: 115.42544, matchRadiusM: 38000, wikidataId: 'Q64787456', isUnesco: true }, // WHS 1448, 2017
  { countryCode: 'RU', name: 'Lena Pillars', category: 'park', latitude: 61.10694, longitude: 127.36167, matchRadiusM: 47000, wikidataId: 'Q277683', isUnesco: true }, // WHS 1299, 2012
  { countryCode: 'RU', name: 'Novodevichy Convent', category: 'building', latitude: 55.72597, longitude: 37.55658, matchRadiusM: 400, wikidataId: 'Q270725', isUnesco: true }, // WHS 1097, 2004
  { countryCode: 'RU', name: 'Onega and White Sea Petroglyphs (Onega)', category: 'site', latitude: 61.673, longitude: 36.029, matchRadiusM: 1500, wikidataId: 'Q2585609', isUnesco: true }, // WHS 1654, 2021; site Q64808630
  { countryCode: 'RU', name: 'Pskov School Churches', category: 'site', latitude: 57.8072, longitude: 28.3286, matchRadiusM: 5500, wikidataId: 'Q66053233', isUnesco: true }, // WHS 1523, 2019
  { countryCode: 'RU', name: 'Putorana Plateau', category: 'range', latitude: 69, longitude: 93, matchRadiusM: 30000, wikidataId: 'Q277576', isUnesco: true }, // WHS 1234, 2010
  { countryCode: 'RU', name: 'Shulgan-Tash Cave', category: 'park', latitude: 53.04444, longitude: 57.06389, matchRadiusM: 20000, wikidataId: 'Q1643788', isUnesco: true }, // WHS 1743, 2025
  { countryCode: 'RU', name: 'Solovetsky Islands', category: 'archipelago', latitude: 65.08333, longitude: 35.66667, matchRadiusM: 30000, wikidataId: 'Q15980181', isUnesco: true }, // WHS 632, 1992
  { countryCode: 'RU', name: 'Sviyazhsk Assumption Monastery', category: 'island', latitude: 55.77012, longitude: 48.65245, matchRadiusM: 3000, wikidataId: 'Q4411008', isUnesco: true }, // WHS 1525, 2017
  { countryCode: 'RU', name: 'Trinity Lavra of St Sergius', category: 'site', latitude: 56.31035, longitude: 38.13065, matchRadiusM: 1000, wikidataId: 'Q211962', isUnesco: true }, // WHS 657, 1993
  { countryCode: 'RU', name: 'Virgin Komi Forests (Yugyd Va)', category: 'park', latitude: 64.4631, longitude: 59.0123, matchRadiusM: 60000, wikidataId: 'Q142874', isUnesco: true }, // WHS 719, 1995; site Q593870
  { countryCode: 'RU', name: 'Volcanoes of Kamchatka (Kronotsky)', category: 'park', latitude: 54.58, longitude: 160.72, matchRadiusM: 60000, wikidataId: 'Q1789960', isUnesco: true }, // WHS 765, 1996; site Q64746144
  { countryCode: 'RU', name: 'Western Caucasus', category: 'park', latitude: 44, longitude: 40, matchRadiusM: 37000, wikidataId: 'Q64798261', isUnesco: true }, // WHS 900, 1999
  { countryCode: 'RU', name: 'White Monuments of Vladimir and Suzdal', category: 'site', latitude: 56.15, longitude: 40.4167, matchRadiusM: 11000, wikidataId: 'Q838264', isUnesco: true }, // WHS 633, 1992
  { countryCode: 'RU', name: 'Wrangel Island', category: 'park', latitude: 71.23333, longitude: -179.4, matchRadiusM: 59000, wikidataId: 'Q106594', isUnesco: true }, // WHS 1023, 2004
  { countryCode: 'RW', name: 'Genocide Memorial Sites (Kigali)', category: 'building', latitude: -1.93089, longitude: 30.06071, matchRadiusM: 500, wikidataId: 'Q6405906', isUnesco: true }, // WHS 1586, 2023; site Q56293252
  { countryCode: 'RW', name: 'Nyungwe National Park', category: 'park', latitude: -2.52822, longitude: 29.27585, matchRadiusM: 22000, wikidataId: 'Q1356828', isUnesco: true }, // WHS 1697, 2023
  { countryCode: 'ST', name: 'Roças of São Tomé and Príncipe', category: 'site', latitude: 0.30061, longitude: 6.63972, matchRadiusM: 1500, wikidataId: 'Q140698922', isUnesco: true }, // WHS 1750, 2026
  { countryCode: 'SA', name: "'Uruq Bani Ma'arid", category: 'park', latitude: 19.33694, longitude: 45.90389, matchRadiusM: 20000, wikidataId: 'Q21994709', isUnesco: true }, // WHS 1699, 2023
  { countryCode: 'SA', name: 'Al-Ahsa Oasis', category: 'natural', latitude: 25.42944, longitude: 49.62194, matchRadiusM: 10000, wikidataId: 'Q311341', isUnesco: true }, // WHS 1563, 2018
  { countryCode: 'SA', name: 'Al-Faw Archaeological Area', category: 'site', latitude: 19.7833, longitude: 45.15, matchRadiusM: 1500, wikidataId: 'Q2829327', isUnesco: true }, // WHS 1712, 2024
  { countryCode: 'SA', name: 'At-Turaif, Diriyah', category: 'old town', latitude: 24.73333, longitude: 46.57556, matchRadiusM: 1500, wikidataId: 'Q22687629', isUnesco: true }, // WHS 1329, 2010
  { countryCode: 'SA', name: 'Hima Cultural Area', category: 'park', latitude: 18.24924, longitude: 44.45184, matchRadiusM: 14000, wikidataId: 'Q4915544', isUnesco: true }, // WHS 1619, 2021
  { countryCode: 'SA', name: 'Historic Jeddah', category: 'old town', latitude: 21.4833, longitude: 39.2, matchRadiusM: 1500, wikidataId: 'Q4702264', isUnesco: true }, // WHS 1361, 2014
  { countryCode: 'SA', name: "Rock Art of the Ha'il Region (Jubbah)", category: 'site', latitude: 28.0106, longitude: 40.9131, matchRadiusM: 3000, wikidataId: 'Q66145738', isUnesco: true }, // WHS 1472, 2015; site Q20643274
  { countryCode: 'SN', name: 'Bassari Country', category: 'site', latitude: 12.59333, longitude: -12.84583, matchRadiusM: 15000, wikidataId: 'Q2916296', isUnesco: true }, // WHS 1407, 2012
  { countryCode: 'SN', name: 'Djoudj Bird Sanctuary', category: 'park', latitude: 16.35849, longitude: -16.2741, matchRadiusM: 9000, wikidataId: 'Q733676', isUnesco: true }, // WHS 25, 1981
  { countryCode: 'SN', name: 'Island of Saint-Louis', category: 'island', latitude: 16.02778, longitude: -16.50444, matchRadiusM: 10000, wikidataId: 'Q1114640', isUnesco: true }, // WHS 956, 2000
  { countryCode: 'SN', name: 'Niokolo-Koba National Park', category: 'park', latitude: 13.07417, longitude: -12.72222, matchRadiusM: 60000, wikidataId: 'Q679891', isUnesco: true }, // WHS 153, 1981
  { countryCode: 'SN', name: 'Saloum Delta', category: 'park', latitude: 13.83528, longitude: -16.49861, matchRadiusM: 19000, wikidataId: 'Q559363', isUnesco: true }, // WHS 1359, 2011
  { countryCode: 'RS', name: 'Gamzigrad-Romuliana', category: 'old town', latitude: 43.89931, longitude: 22.18617, matchRadiusM: 1500, wikidataId: 'Q904128', isUnesco: true }, // WHS 1253, 2007
  { countryCode: 'RS', name: 'Stari Ras and Sopoćani', category: 'site', latitude: 43.11889, longitude: 20.42278, matchRadiusM: 10000, wikidataId: 'Q10913999', isUnesco: true }, // WHS 96, 1979
  { countryCode: 'SC', name: 'Aldabra Atoll', category: 'archipelago', latitude: -9.41639, longitude: 46.41639, matchRadiusM: 10000, wikidataId: 'Q272768', isUnesco: true }, // WHS 185, 1982
  { countryCode: 'SL', name: 'Gola-Tiwai', category: 'park', latitude: 7.8, longitude: -10.66667, matchRadiusM: 20000, wikidataId: 'Q127463879', isUnesco: true }, // WHS 1746, 2025
  { countryCode: 'SG', name: 'Singapore Botanic Gardens', category: 'site', latitude: 1.3151, longitude: 103.8162, matchRadiusM: 1000, wikidataId: 'Q3046409', isUnesco: true }, // WHS 1483, 2015
  { countryCode: 'SK', name: 'Banská Štiavnica', category: 'old town', latitude: 48.46111, longitude: 18.9, matchRadiusM: 1500, wikidataId: 'Q16912647', isUnesco: true }, // WHS 618, 1993
  { countryCode: 'SK', name: 'Bardejov', category: 'park', latitude: 49.29333, longitude: 21.27917, matchRadiusM: 5000, wikidataId: 'Q17634781', isUnesco: true }, // WHS 973, 2000
  { countryCode: 'SK', name: 'Slovak Carpathian Wooden Churches (Hronsek)', category: 'building', latitude: 48.64894, longitude: 19.1549, matchRadiusM: 500, wikidataId: 'Q595992', isUnesco: true }, // WHS 1273, 2008; site Q471717
  { countryCode: 'SK', name: 'Vlkolínec', category: 'old town', latitude: 49.0397, longitude: 19.2784, matchRadiusM: 1500, wikidataId: 'Q392365', isUnesco: true }, // WHS 622, 1993
  { countryCode: 'SI', name: 'Heritage of Mercury (Idrija)', category: 'old town', latitude: 46.00389, longitude: 14.02667, matchRadiusM: 1500, wikidataId: 'Q64485226', isUnesco: true }, // WHS 1313, 2012; site Q3370031
  { countryCode: 'SI', name: "Plečnik's Ljubljana", category: 'old town', latitude: 46.04333, longitude: 14.50222, matchRadiusM: 4500, wikidataId: 'Q64494878', isUnesco: true }, // WHS 1643, 2021
  { countryCode: 'SI', name: 'Škocjan Caves', category: 'natural', latitude: 45.665, longitude: 13.99472, matchRadiusM: 1600, wikidataId: 'Q500376', isUnesco: true }, // WHS 390, 1986
  { countryCode: 'ZA', name: 'Barberton Makhonjwa Mountains', category: 'range', latitude: -33.4, longitude: 22, matchRadiusM: 30000, wikidataId: 'Q19605615', isUnesco: true }, // WHS 1575, 2018
  { countryCode: 'ZA', name: 'Cradle of Humankind', category: 'site', latitude: -25.96723, longitude: 27.66244, matchRadiusM: 14000, wikidataId: 'Q1130112', isUnesco: true }, // WHS 915, 1999
  { countryCode: 'ZA', name: 'Emergence of Modern Humans', category: 'park', latitude: -29.52389, longitude: 31.08611, matchRadiusM: 20000, wikidataId: 'Q65936860', isUnesco: true }, // WHS 1723, 2024
  { countryCode: 'ZA', name: 'iSimangaliso Wetland Park', category: 'park', latitude: -28, longitude: 32.5, matchRadiusM: 33000, wikidataId: 'Q310719', isUnesco: true }, // WHS 914, 1999
  { countryCode: 'ZA', name: 'Khomani Cultural Landscape', category: 'site', latitude: -25.68761, longitude: 20.37458, matchRadiusM: 60000, wikidataId: 'Q33800328', isUnesco: true }, // WHS 1545, 2017
  { countryCode: 'ZA', name: 'Maloti-Drakensberg Park', category: 'park', latitude: -29.4665, longitude: 29.3939, matchRadiusM: 15000, wikidataId: 'Q6744547', isUnesco: true }, // WHS 985, 2000
  { countryCode: 'ZA', name: 'Mapungubwe', category: 'site', latitude: -22.21167, longitude: 29.38789, matchRadiusM: 12000, wikidataId: 'Q1136251', isUnesco: true }, // WHS 1099, 2003
  { countryCode: 'ZA', name: 'Nelson Mandela Legacy Sites', category: 'site', latitude: -25.76661, longitude: 28.18925, matchRadiusM: 1500, wikidataId: 'Q65936861', isUnesco: true }, // WHS 1676, 2024
  { countryCode: 'ZA', name: 'Richtersveld', category: 'site', latitude: -28.6, longitude: 17.20389, matchRadiusM: 27000, wikidataId: 'Q1353565', isUnesco: true }, // WHS 1265, 2007
  { countryCode: 'ZA', name: 'Robben Island', category: 'island', latitude: -33.805, longitude: 18.37, matchRadiusM: 3000, wikidataId: 'Q192493', isUnesco: true }, // WHS 916, 1999
  { countryCode: 'ZA', name: 'Vredefort Dome', category: 'natural', latitude: -26.81667, longitude: 27.41667, matchRadiusM: 15000, wikidataId: 'Q330095', isUnesco: true }, // WHS 1162, 2005
  { countryCode: 'KR', name: 'Baekje Historic Areas', category: 'old town', latitude: 36.46194, longitude: 127.12722, matchRadiusM: 1800, wikidataId: 'Q20650483', isUnesco: true }, // WHS 1477, 2015
  { countryCode: 'KR', name: 'Bangucheon Petroglyphs', category: 'site', latitude: 35.60845, longitude: 129.174, matchRadiusM: 1500, wikidataId: 'Q135335250', isUnesco: true }, // WHS 1740, 2025
  { countryCode: 'KR', name: 'Changdeokgung Palace', category: 'building', latitude: 37.57944, longitude: 126.99167, matchRadiusM: 700, wikidataId: 'Q477157', isUnesco: true }, // WHS 816, 1997
  { countryCode: 'KR', name: 'Gaya Tumuli', category: 'site', latitude: 35.23726, longitude: 128.87373, matchRadiusM: 1500, wikidataId: 'Q66201394', isUnesco: true }, // WHS 1666, 2023
  { countryCode: 'KR', name: 'Getbol Tidal Flats (Sinan)', category: 'park', latitude: 34.82882, longitude: 126.10444, matchRadiusM: 18000, wikidataId: 'Q66311161', isUnesco: true }, // WHS 1591, 2021; site Q107715736
  { countryCode: 'KR', name: 'Gyeongju Historic Areas', category: 'old town', latitude: 35.78889, longitude: 129.22667, matchRadiusM: 5000, wikidataId: 'Q495241', isUnesco: true }, // WHS 976, 2000
  { countryCode: 'KR', name: 'Haeinsa Temple', category: 'site', latitude: 35.80161, longitude: 128.09872, matchRadiusM: 1500, wikidataId: 'Q490798', isUnesco: true }, // WHS 737, 1995
  { countryCode: 'KR', name: 'Hahoe and Yangdong Villages (Hahoe)', category: 'old town', latitude: 36.53806, longitude: 128.52056, matchRadiusM: 1500, wikidataId: 'Q45865', isUnesco: true }, // WHS 1324, 2010; site Q3113345
  { countryCode: 'KR', name: 'Hwaseong Fortress', category: 'site', latitude: 37.28073, longitude: 127.0102, matchRadiusM: 1500, wikidataId: 'Q482423', isUnesco: true }, // WHS 817, 1997
  { countryCode: 'KR', name: 'Jeju Volcanic Island', category: 'island', latitude: 33.36139, longitude: 126.5325, matchRadiusM: 25000, wikidataId: 'Q495733', isUnesco: true }, // WHS 1264, 2007
  { countryCode: 'KR', name: 'Jongmyo Shrine', category: 'building', latitude: 37.57472, longitude: 126.99361, matchRadiusM: 500, wikidataId: 'Q490497', isUnesco: true }, // WHS 738, 1995
  { countryCode: 'KR', name: 'Korean Dolmen Sites (Gochang)', category: 'site', latitude: 35.4418, longitude: 126.6523, matchRadiusM: 1000, wikidataId: 'Q66197761', isUnesco: true }, // WHS 977, 2000; site Q495286
  { countryCode: 'KR', name: 'Namhansanseong', category: 'site', latitude: 37.47803, longitude: 127.18419, matchRadiusM: 1600, wikidataId: 'Q562529', isUnesco: true }, // WHS 1439, 2014
  { countryCode: 'KR', name: 'Royal Tombs of Joseon (Seonjeongneung)', category: 'site', latitude: 37.50889, longitude: 127.04917, matchRadiusM: 1000, wikidataId: 'Q625330', isUnesco: true }, // WHS 1319, 2009; site Q495276
  { countryCode: 'KR', name: 'Sansa Mountain Monasteries (Tongdosa)', category: 'building', latitude: 35.48806, longitude: 129.06472, matchRadiusM: 400, wikidataId: 'Q491454', isUnesco: true }, // WHS 1562, 2018; site Q55306582
  { countryCode: 'KR', name: 'Seokguram and Bulguksa', category: 'building', latitude: 35.76667, longitude: 129.33333, matchRadiusM: 500, wikidataId: 'Q16912957', isUnesco: true }, // WHS 736, 1995
  { countryCode: 'KR', name: 'Seowon Academies (Dosan Seowon)', category: 'site', latitude: 36.72722, longitude: 128.84333, matchRadiusM: 1000, wikidataId: 'Q625663', isUnesco: true }, // WHS 1498, 2019; site Q65099260
  { countryCode: 'ES', name: 'Alcalá de Henares', category: 'park', latitude: 40.48293, longitude: -3.36313, matchRadiusM: 20000, wikidataId: 'Q47531644', isUnesco: true }, // WHS 876, 1998
  { countryCode: 'ES', name: 'Antequera Dolmens', category: 'site', latitude: 37.02333, longitude: -4.54806, matchRadiusM: 7500, wikidataId: 'Q97633694', isUnesco: true }, // WHS 1501, 2016
  { countryCode: 'ES', name: 'Aranjuez', category: 'site', latitude: 40.0364, longitude: -3.60934, matchRadiusM: 1500, wikidataId: 'Q6057341', isUnesco: true }, // WHS 1044, 2001
  { countryCode: 'ES', name: 'Atapuerca', category: 'site', latitude: 42.35009, longitude: -3.51947, matchRadiusM: 1500, wikidataId: 'Q923894', isUnesco: true }, // WHS 989, 2000
  { countryCode: 'ES', name: 'Burgos Cathedral', category: 'building', latitude: 42.34081, longitude: -3.70447, matchRadiusM: 300, wikidataId: 'Q744420', isUnesco: true }, // WHS 316, 1984
  { countryCode: 'ES', name: 'Camino de Santiago, Spain (León Cathedral)', category: 'building', latitude: 42.59944, longitude: -5.56667, matchRadiusM: 500, wikidataId: 'Q175874', isUnesco: true }, // WHS 669, 1993; site Q39081159
  { countryCode: 'ES', name: 'Cave of Altamira', category: 'natural', latitude: 43.38333, longitude: -4.11667, matchRadiusM: 1000, wikidataId: 'Q133575', isUnesco: true }, // WHS 310, 1985; site Q899302
  { countryCode: 'ES', name: 'Doñana National Park', category: 'park', latitude: 37.02, longitude: -6.44, matchRadiusM: 16000, wikidataId: 'Q463141', isUnesco: true }, // WHS 685, 1994
  { countryCode: 'ES', name: 'El Escorial', category: 'site', latitude: 40.58917, longitude: -4.14778, matchRadiusM: 1500, wikidataId: 'Q5821857', isUnesco: true }, // WHS 318, 1984
  { countryCode: 'ES', name: 'Guadalupe Monastery', category: 'building', latitude: 39.45278, longitude: -5.3275, matchRadiusM: 500, wikidataId: 'Q750248', isUnesco: true }, // WHS 665, 1993
  { countryCode: 'ES', name: 'Historic Centre of Córdoba', category: 'old town', latitude: 37.87919, longitude: -4.77972, matchRadiusM: 1500, wikidataId: 'Q10749904', isUnesco: true }, // WHS 313, 1984
  { countryCode: 'ES', name: 'Historic City of Toledo', category: 'old town', latitude: 39.8569, longitude: -4.02461, matchRadiusM: 1500, wikidataId: 'Q17255635', isUnesco: true }, // WHS 379, 1986
  { countryCode: 'ES', name: 'Historic Walled Town of Cuenca', category: 'old town', latitude: 40.0766, longitude: -2.13175, matchRadiusM: 1500, wikidataId: 'Q15965460', isUnesco: true }, // WHS 781, 1996
  { countryCode: 'ES', name: 'Iberian Mediterranean Rock Art', category: 'site', latitude: 39.79, longitude: -1.03333, matchRadiusM: 12000, wikidataId: 'Q1975533', isUnesco: true }, // WHS 874, 1998
  { countryCode: 'ES', name: 'Ibiza, Biodiversity and Culture', category: 'park', latitude: 38.91114, longitude: 1.43519, matchRadiusM: 13000, wikidataId: 'Q11918155', isUnesco: true }, // WHS 417, 1999
  { countryCode: 'ES', name: 'Las Médulas', category: 'site', latitude: 42.4587, longitude: -6.759, matchRadiusM: 5000, wikidataId: 'Q696803', isUnesco: true }, // WHS 803, 1997
  { countryCode: 'ES', name: 'Lonja de la Seda, Valencia', category: 'site', latitude: 39.47444, longitude: -0.37833, matchRadiusM: 1500, wikidataId: 'Q588009', isUnesco: true }, // WHS 782, 1996
  { countryCode: 'ES', name: 'Medina Azahara', category: 'old town', latitude: 37.88608, longitude: -4.86779, matchRadiusM: 1500, wikidataId: 'Q211252', isUnesco: true }, // WHS 1560, 2018
  { countryCode: 'ES', name: 'Mérida Archaeological Ensemble', category: 'site', latitude: 38.91597, longitude: -6.33869, matchRadiusM: 5000, wikidataId: 'Q15233334', isUnesco: true }, // WHS 664, 1993
  { countryCode: 'ES', name: 'Monuments of Oviedo', category: 'site', latitude: 43.37889, longitude: -5.86583, matchRadiusM: 3000, wikidataId: 'Q10588848', isUnesco: true }, // WHS 312, 1985
  { countryCode: 'ES', name: 'Mudéjar Architecture of Aragon (Aljafería)', category: 'building', latitude: 41.65649, longitude: -0.89708, matchRadiusM: 500, wikidataId: 'Q1354033', isUnesco: true }, // WHS 378, 1986; site Q64861487
  { countryCode: 'ES', name: 'Old City of Salamanca', category: 'park', latitude: 40.96525, longitude: -5.6645, matchRadiusM: 20000, wikidataId: 'Q12156631', isUnesco: true }, // WHS 381, 1988
  { countryCode: 'ES', name: 'Old Town of Ávila', category: 'old town', latitude: 40.65639, longitude: -4.70011, matchRadiusM: 1700, wikidataId: 'Q15839120', isUnesco: true }, // WHS 348, 1985
  { countryCode: 'ES', name: 'Old Town of Cáceres', category: 'old town', latitude: 39.47417, longitude: -6.37, matchRadiusM: 1500, wikidataId: 'Q9757828', isUnesco: true }, // WHS 384, 1986
  { countryCode: 'ES', name: 'Old Town of Santiago de Compostela', category: 'old town', latitude: 42.88076, longitude: -8.54468, matchRadiusM: 1500, wikidataId: 'Q12386144', isUnesco: true }, // WHS 347, 1985
  { countryCode: 'ES', name: 'Palau de la Música and Sant Pau', category: 'site', latitude: 41.38778, longitude: 2.175, matchRadiusM: 3500, wikidataId: 'Q64955212', isUnesco: true }, // WHS 804, 1997
  { countryCode: 'ES', name: 'Palmeral of Elche', category: 'site', latitude: 38.26444, longitude: -0.69083, matchRadiusM: 1700, wikidataId: 'Q930784', isUnesco: true }, // WHS 930, 2000
  { countryCode: 'ES', name: 'Paseo del Prado and Buen Retiro', category: 'site', latitude: 40.41414, longitude: -3.68653, matchRadiusM: 1200, wikidataId: 'Q107675480', isUnesco: true }, // WHS 1618, 2021
  { countryCode: 'ES', name: 'Poblet Monastery', category: 'building', latitude: 41.38083, longitude: 1.0825, matchRadiusM: 500, wikidataId: 'Q645157', isUnesco: true }, // WHS 518, 1991
  { countryCode: 'ES', name: 'Roman Walls of Lugo', category: 'monument', latitude: 43.01419, longitude: -7.55989, matchRadiusM: 600, wikidataId: 'Q2733427', isUnesco: true }, // WHS 987, 2000
  { countryCode: 'ES', name: 'Romanesque Churches of Vall de Boí', category: 'site', latitude: 42.50472, longitude: 0.80361, matchRadiusM: 5000, wikidataId: 'Q1091515', isUnesco: true }, // WHS 988, 2000
  { countryCode: 'ES', name: 'San Millán Yuso and Suso', category: 'building', latitude: 42.32583, longitude: -2.86505, matchRadiusM: 1200, wikidataId: 'Q2284354', isUnesco: true }, // WHS 805, 1997
  { countryCode: 'ES', name: 'Segovia Old Town and Aqueduct', category: 'park', latitude: 40.94847, longitude: -4.11675, matchRadiusM: 5000, wikidataId: 'Q15728389', isUnesco: true }, // WHS 311, 1985
  { countryCode: 'ES', name: 'Serra de Tramuntana', category: 'site', latitude: 39.73083, longitude: 2.69472, matchRadiusM: 12000, wikidataId: 'Q64860434', isUnesco: true }, // WHS 1371, 2011
  { countryCode: 'ES', name: 'Seville Cathedral and Alcázar', category: 'site', latitude: 37.38384, longitude: -5.99155, matchRadiusM: 1000, wikidataId: 'Q9709444', isUnesco: true }, // WHS 383, 1987
  { countryCode: 'ES', name: 'Talayotic Menorca', category: 'site', latitude: 39.9975, longitude: 3.90889, matchRadiusM: 1500, wikidataId: 'Q64990632', isUnesco: true }, // WHS 1528, 2023
  { countryCode: 'ES', name: 'Tarraco', category: 'site', latitude: 41.11472, longitude: 1.25931, matchRadiusM: 15000, wikidataId: 'Q3119914', isUnesco: true }, // WHS 875, 2000
  { countryCode: 'ES', name: 'Tower of Hercules', category: 'building', latitude: 43.38583, longitude: -8.40639, matchRadiusM: 800, wikidataId: 'Q245151', isUnesco: true }, // WHS 1312, 2009
  { countryCode: 'ES', name: 'Úbeda and Baeza', category: 'site', latitude: 38.01131, longitude: -3.37122, matchRadiusM: 9000, wikidataId: 'Q15831671', isUnesco: true }, // WHS 522, 2003
  { countryCode: 'ES', name: 'Vizcaya Bridge', category: 'building', latitude: 43.32306, longitude: -3.01694, matchRadiusM: 500, wikidataId: 'Q331996', isUnesco: true }, // WHS 1217, 2006
  { countryCode: 'ES', name: 'Works of Gaudí (Sagrada Família)', category: 'site', latitude: 41.40356, longitude: 2.17435, matchRadiusM: 3000, wikidataId: 'Q14468710', isUnesco: true }, // WHS 320, 1984; site Q921745
  { countryCode: 'LK', name: 'Anuradhapura', category: 'old town', latitude: 8.335, longitude: 80.41083, matchRadiusM: 4000, wikidataId: 'Q5724', isUnesco: true }, // WHS 200, 1982
  { countryCode: 'LK', name: 'Central Highlands of Sri Lanka (Horton Plains)', category: 'park', latitude: 6.8, longitude: 80.8, matchRadiusM: 5000, wikidataId: 'Q1630245', isUnesco: true }, // WHS 1203, 2010; site Q422941
  { countryCode: 'LK', name: 'Dambulla Cave Temple', category: 'building', latitude: 7.85656, longitude: 80.64834, matchRadiusM: 500, wikidataId: 'Q45690', isUnesco: true }, // WHS 561, 1991
  { countryCode: 'LK', name: 'Galle Fort', category: 'old town', latitude: 6.02139, longitude: 80.21861, matchRadiusM: 1500, wikidataId: 'Q15830652', isUnesco: true }, // WHS 451, 1988
  { countryCode: 'LK', name: 'Polonnaruwa', category: 'old town', latitude: 7.93333, longitude: 81, matchRadiusM: 1500, wikidataId: 'Q394443', isUnesco: true }, // WHS 201, 1982
  { countryCode: 'LK', name: 'Sacred City of Kandy', category: 'old town', latitude: 7.29306, longitude: 80.635, matchRadiusM: 1500, wikidataId: 'Q203197', isUnesco: true }, // WHS 450, 1988
  { countryCode: 'LK', name: 'Sinharaja Forest Reserve', category: 'park', latitude: 6.24, longitude: 80.28, matchRadiusM: 6500, wikidataId: 'Q375634', isUnesco: true }, // WHS 405, 1988
  { countryCode: 'SD', name: 'Gebel Barkal', category: 'park', latitude: 18.53333, longitude: 31.81667, matchRadiusM: 15000, wikidataId: 'Q15278408', isUnesco: true }, // WHS 1073, 2003
  { countryCode: 'SD', name: 'Sanganeb and Dungonab Bay (Sanganeb)', category: 'park', latitude: 19.73333, longitude: 37.43333, matchRadiusM: 9000, wikidataId: 'Q12217059', isUnesco: true }, // WHS 262, 2016; site Q65937857
  { countryCode: 'SR', name: 'Historic Inner City of Paramaribo', category: 'old town', latitude: 5.826, longitude: -55.15387, matchRadiusM: 1500, wikidataId: 'Q2147036', isUnesco: true }, // WHS 940, 2002
  { countryCode: 'SR', name: 'Jodensavanne', category: 'old town', latitude: 5.4312, longitude: -54.9823, matchRadiusM: 1500, wikidataId: 'Q648787', isUnesco: true }, // WHS 1680, 2023
  { countryCode: 'SE', name: 'Birka and Hovgården', category: 'site', latitude: 59.335, longitude: 17.5425, matchRadiusM: 3500, wikidataId: 'Q2904503', isUnesco: true }, // WHS 555, 1993
  { countryCode: 'SE', name: 'Decorated Farmhouses of Hälsingland', category: 'site', latitude: 61.70722, longitude: 16.19583, matchRadiusM: 15000, wikidataId: 'Q1642003', isUnesco: true }, // WHS 1282, 2012
  { countryCode: 'SE', name: 'Engelsberg Ironworks', category: 'site', latitude: 59.96917, longitude: 16.01028, matchRadiusM: 1500, wikidataId: 'Q936884', isUnesco: true }, // WHS 556, 1993
  { countryCode: 'SE', name: 'Falun Copper Mine', category: 'site', latitude: 60.60472, longitude: 15.63083, matchRadiusM: 1500, wikidataId: 'Q636194', isUnesco: true }, // WHS 1027, 2001
  { countryCode: 'SE', name: 'Gammelstad Church Town', category: 'building', latitude: 65.64611, longitude: 22.02861, matchRadiusM: 500, wikidataId: 'Q1756286', isUnesco: true }, // WHS 762, 1996
  { countryCode: 'SE', name: 'Grimeton Radio Station', category: 'site', latitude: 57.11398, longitude: 12.40442, matchRadiusM: 1000, wikidataId: 'Q920206', isUnesco: true }, // WHS 1134, 2004
  { countryCode: 'SE', name: 'High Coast and Kvarken (High Coast)', category: 'park', latitude: 63, longitude: 18.41667, matchRadiusM: 26000, wikidataId: 'Q849273', isUnesco: true }, // WHS 898, 2000; site Q10532185
  { countryCode: 'SE', name: 'Laponian Area', category: 'site', latitude: 67.33333, longitude: 17.58333, matchRadiusM: 60000, wikidataId: 'Q1137314', isUnesco: true }, // WHS 774, 1996
  { countryCode: 'SE', name: 'Naval Port of Karlskrona', category: 'site', latitude: 56.16667, longitude: 15.58333, matchRadiusM: 1500, wikidataId: 'Q15255454', isUnesco: true }, // WHS 871, 1998
  { countryCode: 'SE', name: 'Rock Carvings in Tanum', category: 'site', latitude: 58.69995, longitude: 11.33641, matchRadiusM: 1500, wikidataId: 'Q1761052', isUnesco: true }, // WHS 557, 1994
  { countryCode: 'SE', name: 'Skogskyrkogården', category: 'site', latitude: 59.27556, longitude: 18.09944, matchRadiusM: 1000, wikidataId: 'Q213988', isUnesco: true }, // WHS 558, 1994
  { countryCode: 'SE', name: 'Southern Öland', category: 'site', latitude: 56.46667, longitude: 16.55, matchRadiusM: 5500, wikidataId: 'Q396132', isUnesco: true }, // WHS 968, 2000
  { countryCode: 'SE', name: 'Visby', category: 'old town', latitude: 57.64167, longitude: 18.29583, matchRadiusM: 1500, wikidataId: 'Q1779992', isUnesco: true }, // WHS 731, 1995
  { countryCode: 'CH', name: 'Abbey of St Gall', category: 'building', latitude: 47.42306, longitude: 9.37722, matchRadiusM: 500, wikidataId: 'Q155699', isUnesco: true }, // WHS 268, 1983
  { countryCode: 'CH', name: 'Castles of Bellinzona', category: 'site', latitude: 46.19278, longitude: 9.02222, matchRadiusM: 1300, wikidataId: 'Q510279', isUnesco: true }, // WHS 884, 2000
  { countryCode: 'CH', name: 'Convent of St John, Müstair', category: 'site', latitude: 46.62917, longitude: 10.44778, matchRadiusM: 3500, wikidataId: 'Q757067', isUnesco: true }, // WHS 269, 1983
  { countryCode: 'CH', name: 'Jungfrau-Aletsch', category: 'park', latitude: 46.5, longitude: 8.03333, matchRadiusM: 20000, wikidataId: 'Q616912', isUnesco: true }, // WHS 1037, 2001
  { countryCode: 'CH', name: 'La Chaux-de-Fonds / Le Locle', category: 'park', latitude: 47.08, longitude: 6.78, matchRadiusM: 5000, wikidataId: 'Q3207298', isUnesco: true }, // WHS 1302, 2009
  { countryCode: 'CH', name: 'Lavaux Vineyard Terraces', category: 'site', latitude: 46.49194, longitude: 6.74611, matchRadiusM: 2000, wikidataId: 'Q688060', isUnesco: true }, // WHS 1243, 2007
  { countryCode: 'CH', name: 'Monte San Giorgio', category: 'mountain', latitude: 45.91667, longitude: 8.95, matchRadiusM: 8000, wikidataId: 'Q16648', isUnesco: true }, // WHS 1090, 2003
  { countryCode: 'CH', name: 'Old City of Bern', category: 'old town', latitude: 46.94806, longitude: 7.45028, matchRadiusM: 1500, wikidataId: 'Q687973', isUnesco: true }, // WHS 267, 1983
  { countryCode: 'CH', name: 'Rhaetian Railway (Albula / Bernina)', category: 'site', latitude: 46.4089, longitude: 10.0197, matchRadiusM: 1000, wikidataId: 'Q2962401', isUnesco: true }, // WHS 1276, 2008
  { countryCode: 'CH', name: 'Tectonic Arena Sardona', category: 'park', latitude: 46.91667, longitude: 9.25, matchRadiusM: 12000, wikidataId: 'Q312118', isUnesco: true }, // WHS 1179, 2008
  { countryCode: 'SY', name: 'Ancient City of Aleppo', category: 'old town', latitude: 36.18333, longitude: 37.15, matchRadiusM: 1500, wikidataId: 'Q4115349', isUnesco: true }, // WHS 21, 1986
  { countryCode: 'SY', name: 'Ancient City of Bosra', category: 'old town', latitude: 32.51806, longitude: 36.48167, matchRadiusM: 1500, wikidataId: 'Q15727412', isUnesco: true }, // WHS 22, 1980
  { countryCode: 'SY', name: 'Ancient City of Damascus', category: 'old town', latitude: 33.51111, longitude: 36.30639, matchRadiusM: 1500, wikidataId: 'Q3678596', isUnesco: true }, // WHS 20, 1979
  { countryCode: 'SY', name: 'Crac des Chevaliers', category: 'building', latitude: 34.75694, longitude: 36.29472, matchRadiusM: 300, wikidataId: 'Q177549', isUnesco: true }, // WHS 1229, 2006; site Q15604681
  { countryCode: 'SY', name: 'Dead Cities (Saint Simeon)', category: 'site', latitude: 36.33417, longitude: 36.84417, matchRadiusM: 4500, wikidataId: 'Q1112125', isUnesco: true }, // WHS 1348, 2011; site Q393841
  { countryCode: 'TJ', name: 'Ancient Khuttal (Hulbuk)', category: 'site', latitude: 37.77889, longitude: 69.55556, matchRadiusM: 1500, wikidataId: 'Q18624092', isUnesco: true }, // WHS 1627, 2025; site Q135442987
  { countryCode: 'TJ', name: 'Sarazm', category: 'site', latitude: 39.51667, longitude: 67.56667, matchRadiusM: 1000, wikidataId: 'Q422929', isUnesco: true }, // WHS 1141, 2010
  { countryCode: 'TJ', name: 'Silk Roads: Zarafshan-Karakum Corridor', category: 'site', latitude: 39.44149, longitude: 69.68556, matchRadiusM: 2000, wikidataId: 'Q122666385', isUnesco: true }, // WHS 1675, 2023
  { countryCode: 'TJ', name: 'Tigrovaya Balka', category: 'park', latitude: 37.25, longitude: 68.5, matchRadiusM: 15000, wikidataId: 'Q1138108', isUnesco: true }, // WHS 1685, 2023
  { countryCode: 'TZ', name: 'Kilwa Kisiwani and Songo Mnara', category: 'site', latitude: -8.95778, longitude: 39.52278, matchRadiusM: 10000, wikidataId: 'Q15726282', isUnesco: true }, // WHS 144, 1981
  { countryCode: 'TZ', name: 'Kondoa Rock-Art Sites', category: 'natural', latitude: -4.72444, longitude: 35.83389, matchRadiusM: 33000, wikidataId: 'Q1404282', isUnesco: true }, // WHS 1183, 2006
  { countryCode: 'TZ', name: 'Ngorongoro Conservation Area', category: 'park', latitude: -3.21, longitude: 35.46, matchRadiusM: 60000, wikidataId: 'Q1217726', isUnesco: true }, // WHS 39, 1979
  { countryCode: 'TZ', name: 'Selous Game Reserve', category: 'park', latitude: -9, longitude: 37.4, matchRadiusM: 10000, wikidataId: 'Q2268839', isUnesco: true }, // WHS 199, 1982
  { countryCode: 'TZ', name: 'Serengeti National Park', category: 'park', latitude: -2.4, longitude: 34.6, matchRadiusM: 60000, wikidataId: 'Q11812902', isUnesco: true }, // WHS 156, 1981
  { countryCode: 'TZ', name: 'Stone Town of Zanzibar', category: 'old town', latitude: -6.16494, longitude: 39.19879, matchRadiusM: 1500, wikidataId: 'Q844417', isUnesco: true }, // WHS 173, 2000
  { countryCode: 'TH', name: 'Ban Chiang', category: 'site', latitude: 17.54861, longitude: 103.35833, matchRadiusM: 1000, wikidataId: 'Q584125', isUnesco: true }, // WHS 575, 1992
  { countryCode: 'TH', name: 'Kaeng Krachan Forest Complex', category: 'park', latitude: 12.86567, longitude: 99.40017, matchRadiusM: 43000, wikidataId: 'Q37636297', isUnesco: true }, // WHS 1461, 2021
  { countryCode: 'TH', name: 'Khao Yai Forest Complex', category: 'park', latitude: 14.35, longitude: 101.44, matchRadiusM: 32000, wikidataId: 'Q386420', isUnesco: true }, // WHS 590, 2005; site Q16963852
  { countryCode: 'TH', name: 'Phu Phrabat', category: 'park', latitude: 17.73106, longitude: 102.35628, matchRadiusM: 5000, wikidataId: 'Q127935365', isUnesco: true }, // WHS 1507, 2024
  { countryCode: 'TH', name: 'Si Thep', category: 'old town', latitude: 15.46659, longitude: 101.15009, matchRadiusM: 1500, wikidataId: 'Q1517758', isUnesco: true }, // WHS 1662, 2023
  { countryCode: 'TH', name: 'Sukhothai', category: 'site', latitude: 17.02111, longitude: 99.70361, matchRadiusM: 6000, wikidataId: 'Q423654', isUnesco: true }, // WHS 574, 1991; site Q865097
  { countryCode: 'TH', name: 'Thungyai-Huai Kha Khaeng', category: 'park', latitude: 15.33333, longitude: 98.91667, matchRadiusM: 54000, wikidataId: 'Q15725130', isUnesco: true }, // WHS 591, 1991
  { countryCode: 'TH', name: 'Wat Phra Mahathat, Nakhon Si Thammarat', category: 'site', latitude: 8.41139, longitude: 99.96667, matchRadiusM: 1500, wikidataId: 'Q2552354', isUnesco: true }, // WHS 1761, 2026
  { countryCode: 'TN', name: 'Carthage', category: 'site', latitude: 36.85788, longitude: 10.33084, matchRadiusM: 3000, wikidataId: 'Q52284968', isUnesco: true }, // WHS 37, 1979
  { countryCode: 'TN', name: 'Djerba', category: 'island', latitude: 33.7837, longitude: 10.8833, matchRadiusM: 16000, wikidataId: 'Q188938', isUnesco: true }, // WHS 1640, 2023
  { countryCode: 'TN', name: 'Dougga', category: 'site', latitude: 36.42333, longitude: 9.22028, matchRadiusM: 1000, wikidataId: 'Q32378', isUnesco: true }, // WHS 794, 1997
  { countryCode: 'TN', name: 'Ichkeul National Park', category: 'park', latitude: 37.12344, longitude: 9.65544, matchRadiusM: 8000, wikidataId: 'Q13220079', isUnesco: true }, // WHS 8, 1980
  { countryCode: 'TN', name: 'Kairouan', category: 'old town', latitude: 35.68333, longitude: 10.1, matchRadiusM: 1500, wikidataId: 'Q179570', isUnesco: true }, // WHS 499, 1988
  { countryCode: 'TN', name: 'Kerkuane', category: 'site', latitude: 36.9464, longitude: 11.0992, matchRadiusM: 2000, wikidataId: 'Q65944741', isUnesco: true }, // WHS 332, 1985
  { countryCode: 'TN', name: 'Medina of Sousse', category: 'old town', latitude: 35.8278, longitude: 10.6386, matchRadiusM: 1500, wikidataId: 'Q608100', isUnesco: true }, // WHS 498, 1988
  { countryCode: 'TN', name: 'Medina of Tunis', category: 'old town', latitude: 36.79903, longitude: 10.17006, matchRadiusM: 1500, wikidataId: 'Q3106527', isUnesco: true }, // WHS 36, 1979
  { countryCode: 'TN', name: 'Sidi Bou Saïd', category: 'old town', latitude: 36.86976, longitude: 10.34101, matchRadiusM: 1500, wikidataId: 'Q877391', isUnesco: true }, // WHS 1769, 2026
  { countryCode: 'TR', name: 'Ani', category: 'site', latitude: 40.5075, longitude: 43.57278, matchRadiusM: 1300, wikidataId: 'Q546010', isUnesco: true }, // WHS 1518, 2016
  { countryCode: 'TR', name: 'Aphrodisias', category: 'site', latitude: 37.70833, longitude: 28.72361, matchRadiusM: 3000, wikidataId: 'Q64699201', isUnesco: true }, // WHS 1519, 2017
  { countryCode: 'TR', name: 'Arslantepe', category: 'old town', latitude: 38.38194, longitude: 38.36111, matchRadiusM: 1500, wikidataId: 'Q705132', isUnesco: true }, // WHS 1622, 2021
  { countryCode: 'TR', name: 'Bursa and Cumalıkızık', category: 'site', latitude: 40.18473, longitude: 29.06234, matchRadiusM: 10000, wikidataId: 'Q60846866', isUnesco: true }, // WHS 1452, 2014
  { countryCode: 'TR', name: 'Çatalhöyük', category: 'site', latitude: 37.6675, longitude: 32.82833, matchRadiusM: 1000, wikidataId: 'Q192522', isUnesco: true }, // WHS 1405, 2012
  { countryCode: 'TR', name: 'Divriği Great Mosque', category: 'site', latitude: 39.37122, longitude: 38.12158, matchRadiusM: 1500, wikidataId: 'Q581641', isUnesco: true }, // WHS 358, 1985
  { countryCode: 'TR', name: 'Diyarbakır Fortress and Hevsel Gardens', category: 'site', latitude: 37.91086, longitude: 40.22728, matchRadiusM: 2500, wikidataId: 'Q20963673', isUnesco: true }, // WHS 1488, 2015
  { countryCode: 'TR', name: 'Ephesus', category: 'site', latitude: 37.92917, longitude: 27.35944, matchRadiusM: 3500, wikidataId: 'Q64699469', isUnesco: true }, // WHS 1018, 2015
  { countryCode: 'TR', name: 'Göbekli Tepe', category: 'site', latitude: 37.22306, longitude: 38.9225, matchRadiusM: 1000, wikidataId: 'Q214944', isUnesco: true }, // WHS 1572, 2018
  { countryCode: 'TR', name: 'Gordion', category: 'site', latitude: 39.65048, longitude: 31.97848, matchRadiusM: 2500, wikidataId: 'Q542854', isUnesco: true }, // WHS 1669, 2023
  { countryCode: 'TR', name: 'Göreme and Cappadocia', category: 'park', latitude: 38.66667, longitude: 34.85, matchRadiusM: 15000, wikidataId: 'Q64705367', isUnesco: true }, // WHS 357, 1985
  { countryCode: 'TR', name: 'Hattusha', category: 'site', latitude: 40.01389, longitude: 34.62056, matchRadiusM: 2500, wikidataId: 'Q64699502', isUnesco: true }, // WHS 377, 1986
  { countryCode: 'TR', name: 'Hierapolis-Pamukkale', category: 'park', latitude: 37.92389, longitude: 29.12333, matchRadiusM: 5000, wikidataId: 'Q15924669', isUnesco: true }, // WHS 485, 1988
  { countryCode: 'TR', name: 'Historic Areas of Istanbul', category: 'park', latitude: 41.00847, longitude: 28.97993, matchRadiusM: 5000, wikidataId: 'Q5773394', isUnesco: true }, // WHS 356, 1985
  { countryCode: 'TR', name: 'Mount Nemrut', category: 'park', latitude: 37.98074, longitude: 38.74083, matchRadiusM: 5000, wikidataId: 'Q207917', isUnesco: true }, // WHS 448, 1987
  { countryCode: 'TR', name: 'Pergamon', category: 'site', latitude: 39.12583, longitude: 27.18, matchRadiusM: 6000, wikidataId: 'Q64705007', isUnesco: true }, // WHS 1457, 2014
  { countryCode: 'TR', name: 'Safranbolu', category: 'old town', latitude: 41.26, longitude: 32.68972, matchRadiusM: 3000, wikidataId: 'Q64705254', isUnesco: true }, // WHS 614, 1994
  { countryCode: 'TR', name: 'Sardis', category: 'site', latitude: 38.48194, longitude: 28.04528, matchRadiusM: 12000, wikidataId: 'Q64735723', isUnesco: true }, // WHS 1731, 2025
  { countryCode: 'TR', name: 'Selimiye Mosque', category: 'building', latitude: 41.67806, longitude: 26.55944, matchRadiusM: 300, wikidataId: 'Q184534', isUnesco: true }, // WHS 1366, 2011
  { countryCode: 'TR', name: 'Troy', category: 'site', latitude: 39.9575, longitude: 26.23889, matchRadiusM: 1100, wikidataId: 'Q22647', isUnesco: true }, // WHS 849, 1998
  { countryCode: 'TR', name: 'Wooden Hypostyle Mosques of Anatolia', category: 'site', latitude: 38.75504, longitude: 30.52958, matchRadiusM: 1500, wikidataId: 'Q64735123', isUnesco: true }, // WHS 1694, 2023
  { countryCode: 'TR', name: 'Xanthos-Letoon', category: 'site', latitude: 36.335, longitude: 29.32028, matchRadiusM: 3500, wikidataId: 'Q16912661', isUnesco: true }, // WHS 484, 1988
  { countryCode: 'TM', name: 'Ancient Merv', category: 'site', latitude: 37.66278, longitude: 62.1925, matchRadiusM: 1500, wikidataId: 'Q193325', isUnesco: true }, // WHS 886, 1999
  { countryCode: 'TM', name: 'Kunya-Urgench', category: 'site', latitude: 42.32613, longitude: 59.15307, matchRadiusM: 1500, wikidataId: 'Q48472', isUnesco: true }, // WHS 1199, 2005
  { countryCode: 'TM', name: 'Nisa Parthian Fortresses', category: 'old town', latitude: 37.95115, longitude: 58.21241, matchRadiusM: 1500, wikidataId: 'Q854672', isUnesco: true }, // WHS 1242, 2007
  { countryCode: 'UG', name: 'Kasubi Tombs', category: 'building', latitude: 0.32917, longitude: 32.55333, matchRadiusM: 600, wikidataId: 'Q309426', isUnesco: true }, // WHS 1022, 2001
  { countryCode: 'UG', name: 'Rwenzori Mountains National Park', category: 'park', latitude: 0.4, longitude: 29.95, matchRadiusM: 22000, wikidataId: 'Q838928', isUnesco: true }, // WHS 684, 1994
  { countryCode: 'UA', name: 'Historic Centre of Odesa', category: 'old town', latitude: 46.485, longitude: 30.741, matchRadiusM: 1500, wikidataId: 'Q15041608', isUnesco: true }, // WHS 1703, 2023
  { countryCode: 'UA', name: 'Old Town of Lviv', category: 'old town', latitude: 49.84167, longitude: 24.03194, matchRadiusM: 1500, wikidataId: 'Q2592613', isUnesco: true }, // WHS 865, 1998
  { countryCode: 'UA', name: 'Residence of Bukovinian Metropolitans', category: 'site', latitude: 48.29664, longitude: 25.92491, matchRadiusM: 1500, wikidataId: 'Q156067', isUnesco: true }, // WHS 1330, 2011
  { countryCode: 'UA', name: 'Tauric Chersonese', category: 'old town', latitude: 44.61083, longitude: 33.49139, matchRadiusM: 5000, wikidataId: 'Q64532917', isUnesco: true }, // WHS 1411, 2013
  { countryCode: 'AE', name: 'Cultural Sites of Al Ain', category: 'park', latitude: 24.06778, longitude: 55.80639, matchRadiusM: 15000, wikidataId: 'Q3962347', isUnesco: true }, // WHS 1343, 2011
  { countryCode: 'AE', name: 'Faya Palaeolandscape', category: 'site', latitude: 25.1114, longitude: 55.83896, matchRadiusM: 1500, wikidataId: 'Q6172505', isUnesco: true }, // WHS 1735, 2025
  { countryCode: 'AE', name: 'Wadi Wurayah', category: 'park', latitude: 25.4226, longitude: 56.36346, matchRadiusM: 20000, wikidataId: 'Q2538723', isUnesco: true }, // WHS 1724, 2026
  { countryCode: 'GB', name: 'Blaenavon Industrial Landscape', category: 'site', latitude: 51.77028, longitude: -3.09222, matchRadiusM: 1500, wikidataId: 'Q23818211', isUnesco: true }, // WHS 984, 2000
  { countryCode: 'GB', name: 'Blenheim Palace', category: 'building', latitude: 51.84136, longitude: -1.36095, matchRadiusM: 500, wikidataId: 'Q208181', isUnesco: true }, // WHS 425, 1987
  { countryCode: 'GB', name: 'Canterbury Cathedral', category: 'site', latitude: 51.28, longitude: 1.08333, matchRadiusM: 1500, wikidataId: 'Q15924897', isUnesco: true }, // WHS 496, 1988
  { countryCode: 'GB', name: 'Castles of King Edward in Gwynedd', category: 'site', latitude: 53.13972, longitude: -4.27694, matchRadiusM: 15000, wikidataId: 'Q837627', isUnesco: true }, // WHS 374, 1986
  { countryCode: 'GB', name: 'City of Bath', category: 'old town', latitude: 51.38139, longitude: -2.35972, matchRadiusM: 3000, wikidataId: 'Q22889', isUnesco: true }, // WHS 428, 1987
  { countryCode: 'GB', name: 'Cornwall and West Devon Mining Landscape', category: 'site', latitude: 50.13611, longitude: -5.38361, matchRadiusM: 15000, wikidataId: 'Q464566', isUnesco: true }, // WHS 1215, 2006
  { countryCode: 'GB', name: 'Derwent Valley Mills', category: 'site', latitude: 53.108, longitude: -1.556, matchRadiusM: 1500, wikidataId: 'Q646076', isUnesco: true }, // WHS 1030, 2001
  { countryCode: 'GB', name: 'Durham Castle and Cathedral', category: 'site', latitude: 54.77472, longitude: -1.57611, matchRadiusM: 1500, wikidataId: 'Q15732525', isUnesco: true }, // WHS 370, 1986
  { countryCode: 'GB', name: 'Flow Country', category: 'park', latitude: 58.3715, longitude: -3.65845, matchRadiusM: 20000, wikidataId: 'Q1847928', isUnesco: true }, // WHS 1722, 2024
  { countryCode: 'GB', name: 'Forth Bridge', category: 'building', latitude: 55.9984, longitude: -3.3876, matchRadiusM: 500, wikidataId: 'Q275', isUnesco: true }, // WHS 1485, 2015
  { countryCode: 'GB', name: 'Fountains Abbey and Studley Royal', category: 'site', latitude: 54.11611, longitude: -1.57306, matchRadiusM: 1500, wikidataId: 'Q16363480', isUnesco: true }, // WHS 372, 1986
  { countryCode: 'GB', name: "Frontiers of the Roman Empire (Hadrian's Wall)", category: 'site', latitude: 55.02417, longitude: -2.2925, matchRadiusM: 1500, wikidataId: 'Q57357', isUnesco: true }, // WHS 430, 1987; site Q4147903
  { countryCode: 'GB', name: "Giant's Causeway", category: 'park', latitude: 55.24083, longitude: -6.51167, matchRadiusM: 20000, wikidataId: 'Q106187', isUnesco: true }, // WHS 369, 1986
  { countryCode: 'GB', name: 'Gough and Inaccessible Islands', category: 'archipelago', latitude: -37.3, longitude: -12.68, matchRadiusM: 30000, wikidataId: 'Q16891784', isUnesco: true }, // WHS 740, 1995
  { countryCode: 'GB', name: 'Heart of Neolithic Orkney', category: 'park', latitude: 58.9975, longitude: -3.215, matchRadiusM: 9500, wikidataId: 'Q1334966', isUnesco: true }, // WHS 514, 1999
  { countryCode: 'GB', name: 'Henderson Island', category: 'island', latitude: -24.375, longitude: -128.325, matchRadiusM: 4500, wikidataId: 'Q379759', isUnesco: true }, // WHS 487, 1988
  { countryCode: 'GB', name: 'Ironbridge Gorge', category: 'natural', latitude: 52.62639, longitude: -2.47278, matchRadiusM: 5000, wikidataId: 'Q647958', isUnesco: true }, // WHS 371, 1986
  { countryCode: 'GB', name: 'Jodrell Bank Observatory', category: 'building', latitude: 53.23625, longitude: -2.30714, matchRadiusM: 500, wikidataId: 'Q1569783', isUnesco: true }, // WHS 1594, 2019
  { countryCode: 'GB', name: 'Jurassic Coast', category: 'natural', latitude: 50.70556, longitude: -2.98989, matchRadiusM: 15000, wikidataId: 'Q575976', isUnesco: true }, // WHS 1029, 2001
  { countryCode: 'GB', name: 'Kew Gardens', category: 'site', latitude: 51.47869, longitude: -0.29561, matchRadiusM: 1500, wikidataId: 'Q18748726', isUnesco: true }, // WHS 1084, 2003
  { countryCode: 'GB', name: 'Lake District', category: 'range', latitude: 54.5, longitude: -3.16667, matchRadiusM: 33000, wikidataId: 'Q211778', isUnesco: true }, // WHS 422, 2017
  { countryCode: 'GB', name: 'Maritime Greenwich', category: 'site', latitude: 51.47778, longitude: 0, matchRadiusM: 1500, wikidataId: 'Q16921416', isUnesco: true }, // WHS 795, 1997
  { countryCode: 'GB', name: 'New Lanark', category: 'old town', latitude: 55.66361, longitude: -3.78139, matchRadiusM: 1000, wikidataId: 'Q743108', isUnesco: true }, // WHS 429, 2001
  { countryCode: 'GB', name: 'Old and New Towns of Edinburgh', category: 'old town', latitude: 55.95, longitude: -3.21667, matchRadiusM: 1500, wikidataId: 'Q15260680', isUnesco: true }, // WHS 728, 1995
  { countryCode: 'GB', name: 'Pontcysyllte Aqueduct and Canal', category: 'park', latitude: 52.97212, longitude: -3.08727, matchRadiusM: 5000, wikidataId: 'Q24677919', isUnesco: true }, // WHS 1303, 2009
  { countryCode: 'GB', name: 'Saltaire', category: 'old town', latitude: 53.83717, longitude: -1.79026, matchRadiusM: 1000, wikidataId: 'Q838920', isUnesco: true }, // WHS 1028, 2001
  { countryCode: 'GB', name: 'Slate Landscape of Northwest Wales', category: 'park', latitude: 53.12083, longitude: -4.115, matchRadiusM: 15000, wikidataId: 'Q107719670', isUnesco: true }, // WHS 1633, 2021
  { countryCode: 'GB', name: 'St Kilda', category: 'archipelago', latitude: 57.815, longitude: -8.5875, matchRadiusM: 10000, wikidataId: 'Q166479', isUnesco: true }, // WHS 387, 1986
  { countryCode: 'GB', name: 'Tower of London', category: 'building', latitude: 51.5082, longitude: -0.0762, matchRadiusM: 500, wikidataId: 'Q62378', isUnesco: true }, // WHS 488, 1988
  { countryCode: 'GB', name: 'Westminster Palace and Abbey', category: 'building', latitude: 51.50056, longitude: -0.12694, matchRadiusM: 600, wikidataId: 'Q10344038', isUnesco: true }, // WHS 426, 1987
  { countryCode: 'US', name: 'Cahokia Mounds', category: 'site', latitude: 38.65389, longitude: -90.06444, matchRadiusM: 1800, wikidataId: 'Q333661', isUnesco: true }, // WHS 198, 1982
  { countryCode: 'US', name: 'Carlsbad Caverns National Park', category: 'park', latitude: 32.17528, longitude: -104.44389, matchRadiusM: 9500, wikidataId: 'Q273195', isUnesco: true }, // WHS 721, 1995
  { countryCode: 'US', name: 'Chaco Culture', category: 'site', latitude: 36.06378, longitude: -107.97083, matchRadiusM: 15000, wikidataId: 'Q65648486', isUnesco: true }, // WHS 353, 1987
  { countryCode: 'US', name: 'Everglades National Park', category: 'park', latitude: 25.3125, longitude: -80.6875, matchRadiusM: 51000, wikidataId: 'Q274131', isUnesco: true }, // WHS 76, 1979
  { countryCode: 'US', name: 'Frank Lloyd Wright Buildings (Fallingwater)', category: 'building', latitude: 39.90639, longitude: -79.46806, matchRadiusM: 500, wikidataId: 'Q463179', isUnesco: true }, // WHS 1496, 2019; site Q10498496
  { countryCode: 'US', name: 'Grand Canyon National Park', category: 'park', latitude: 36.0553, longitude: -112.122, matchRadiusM: 47000, wikidataId: 'Q220289', isUnesco: true }, // WHS 75, 1979
  { countryCode: 'US', name: 'Great Smoky Mountains National Park', category: 'park', latitude: 35.61111, longitude: -83.425, matchRadiusM: 31000, wikidataId: 'Q464004', isUnesco: true }, // WHS 259, 1983
  { countryCode: 'US', name: 'Hawaii Volcanoes National Park', category: 'park', latitude: 19.40083, longitude: -155.12361, matchRadiusM: 20000, wikidataId: 'Q205952', isUnesco: true }, // WHS 409, 1987
  { countryCode: 'US', name: 'Hopewell Ceremonial Earthworks', category: 'site', latitude: 40.05366, longitude: -82.44606, matchRadiusM: 1500, wikidataId: 'Q10525989', isUnesco: true }, // WHS 1689, 2023
  { countryCode: 'US', name: 'Independence Hall', category: 'site', latitude: 39.94889, longitude: -75.15, matchRadiusM: 1000, wikidataId: 'Q390028', isUnesco: true }, // WHS 78, 1979
  { countryCode: 'US', name: 'Kluane and Glacier Bay (Glacier Bay)', category: 'park', latitude: 58.7, longitude: -137, matchRadiusM: 60000, wikidataId: 'Q261577', isUnesco: true }, // WHS 72, 1979; site Q604604
  { countryCode: 'US', name: 'Mammoth Cave National Park', category: 'park', latitude: 37.18694, longitude: -86.10111, matchRadiusM: 10000, wikidataId: 'Q242681', isUnesco: true }, // WHS 150, 1981
  { countryCode: 'US', name: 'Mesa Verde National Park', category: 'park', latitude: 37.26038, longitude: -108.49444, matchRadiusM: 10000, wikidataId: 'Q237128', isUnesco: true }, // WHS 27, 1978
  { countryCode: 'US', name: 'Monticello and University of Virginia', category: 'site', latitude: 38.03278, longitude: -78.50389, matchRadiusM: 5500, wikidataId: 'Q15830656', isUnesco: true }, // WHS 442, 1987
  { countryCode: 'US', name: 'Okefenokee National Wildlife Refuge', category: 'park', latitude: 30.73812, longitude: -82.13974, matchRadiusM: 28000, wikidataId: 'Q7081911', isUnesco: true }, // WHS 1751, 2026
  { countryCode: 'US', name: 'Olympic National Park', category: 'park', latitude: 47.7, longitude: -123.75, matchRadiusM: 42000, wikidataId: 'Q372093', isUnesco: true }, // WHS 151, 1981
  { countryCode: 'US', name: 'Papahānaumokuākea', category: 'park', latitude: 25.5, longitude: -170.5, matchRadiusM: 60000, wikidataId: 'Q787425', isUnesco: true }, // WHS 1326, 2010
  { countryCode: 'US', name: 'Poverty Point', category: 'park', latitude: 32.6425, longitude: -91.40833, matchRadiusM: 5000, wikidataId: 'Q964745', isUnesco: true }, // WHS 1435, 2014
  { countryCode: 'US', name: 'Redwood National and State Parks', category: 'park', latitude: 41.37389, longitude: -123.99806, matchRadiusM: 14000, wikidataId: 'Q63863168', isUnesco: true }, // WHS 134, 1980
  { countryCode: 'US', name: 'San Antonio Missions', category: 'site', latitude: 29.3281, longitude: -98.46, matchRadiusM: 12000, wikidataId: 'Q10498483', isUnesco: true }, // WHS 1466, 2015
  { countryCode: 'US', name: 'Taos Pueblo', category: 'site', latitude: 36.43889, longitude: -105.54167, matchRadiusM: 1000, wikidataId: 'Q252814', isUnesco: true }, // WHS 492, 1992
  { countryCode: 'US', name: 'Yellowstone National Park', category: 'park', latitude: 44.6, longitude: -110.5, matchRadiusM: 60000, wikidataId: 'Q351', isUnesco: true }, // WHS 28, 1978
  { countryCode: 'US', name: 'Yosemite National Park', category: 'park', latitude: 37.7425, longitude: -119.5375, matchRadiusM: 37000, wikidataId: 'Q180402', isUnesco: true }, // WHS 308, 1984
  { countryCode: 'UY', name: 'Eladio Dieste Church, Atlántida', category: 'building', latitude: -34.744, longitude: -55.766, matchRadiusM: 300, wikidataId: 'Q26721344', isUnesco: true }, // WHS 1612, 2021
  { countryCode: 'UY', name: 'Fray Bentos Industrial Landscape', category: 'site', latitude: -33.11778, longitude: -58.33167, matchRadiusM: 1500, wikidataId: 'Q29905581', isUnesco: true }, // WHS 1464, 2015
  { countryCode: 'UZ', name: 'Historic Centre of Bukhara', category: 'old town', latitude: 39.76667, longitude: 64.43333, matchRadiusM: 1500, wikidataId: 'Q29015225', isUnesco: true }, // WHS 602, 1993
  { countryCode: 'UZ', name: 'Historic Centre of Shakhrisyabz', category: 'old town', latitude: 39.05, longitude: 66.83333, matchRadiusM: 1500, wikidataId: 'Q569766', isUnesco: true }, // WHS 885, 2000
  { countryCode: 'UZ', name: 'Itchan Kala', category: 'old town', latitude: 41.37772, longitude: 60.35948, matchRadiusM: 1500, wikidataId: 'Q535577', isUnesco: true }, // WHS 543, 1990
  { countryCode: 'UZ', name: 'Tashkent Modernist Architecture', category: 'site', latitude: 41.3086, longitude: 69.2417, matchRadiusM: 1500, wikidataId: 'Q124800237', isUnesco: true }, // WHS 1766, 2026
  { countryCode: 'VE', name: 'Ciudad Universitaria de Caracas', category: 'site', latitude: 10.49083, longitude: -66.89056, matchRadiusM: 1000, wikidataId: 'Q1061531', isUnesco: true }, // WHS 986, 2000
  { countryCode: 'VE', name: 'Coro and its Port', category: 'site', latitude: 11.4, longitude: -69.6833, matchRadiusM: 15000, wikidataId: 'Q65621655', isUnesco: true }, // WHS 658, 1993
  { countryCode: 'VN', name: 'Citadel of the Ho Dynasty', category: 'park', latitude: 20.07806, longitude: 105.60472, matchRadiusM: 5000, wikidataId: 'Q190060', isUnesco: true }, // WHS 1358, 2011
  { countryCode: 'VN', name: 'Hoi An Ancient Town', category: 'old town', latitude: 15.87714, longitude: 108.32863, matchRadiusM: 1500, wikidataId: 'Q5965459', isUnesco: true }, // WHS 948, 1999
  { countryCode: 'VN', name: 'Hue Monuments (Imperial City)', category: 'building', latitude: 16.46944, longitude: 107.57778, matchRadiusM: 500, wikidataId: 'Q10769129', isUnesco: true }, // WHS 678, 1993; site Q10810560
  { countryCode: 'VN', name: 'Imperial Citadel of Thang Long', category: 'building', latitude: 21.0325, longitude: 105.83972, matchRadiusM: 500, wikidataId: 'Q206219', isUnesco: true }, // WHS 1328, 2010
  { countryCode: 'VN', name: 'My Son Sanctuary', category: 'site', latitude: 15.76324, longitude: 108.12445, matchRadiusM: 2000, wikidataId: 'Q391406', isUnesco: true }, // WHS 949, 1999
  { countryCode: 'VN', name: 'Phong Nha-Ke Bang and Hin Nam No', category: 'park', latitude: 17.53333, longitude: 106.15, matchRadiusM: 20000, wikidataId: 'Q23513', isUnesco: true }, // WHS 951, 2003
  { countryCode: 'VN', name: 'Trang An Landscape Complex', category: 'natural', latitude: 20.2557, longitude: 105.9156, matchRadiusM: 6000, wikidataId: 'Q10810559', isUnesco: true }, // WHS 1438, 2014
  { countryCode: 'VN', name: 'Yen Tu, Vinh Nghiem and Con Son–Kiep Bac', category: 'site', latitude: 21.0768, longitude: 106.719, matchRadiusM: 10000, wikidataId: 'Q16481408', isUnesco: true }, // WHS 1732, 2025
  { countryCode: 'YE', name: 'Historic Town of Zabid', category: 'old town', latitude: 14.2, longitude: 43.31667, matchRadiusM: 1500, wikidataId: 'Q138986', isUnesco: true }, // WHS 611, 1993
  { countryCode: 'YE', name: 'Kingdom of Saba Landmarks, Marib', category: 'site', latitude: 15.42677, longitude: 45.33523, matchRadiusM: 8500, wikidataId: 'Q116943542', isUnesco: true }, // WHS 1700, 2023
  { countryCode: 'YE', name: 'Old Walled City of Shibam', category: 'old town', latitude: 15.92694, longitude: 48.62667, matchRadiusM: 1500, wikidataId: 'Q192518', isUnesco: true }, // WHS 192, 1982
  { countryCode: 'YE', name: 'Socotra Archipelago', category: 'island', latitude: 12.51, longitude: 53.92, matchRadiusM: 42000, wikidataId: 'Q82859', isUnesco: true }, // WHS 1263, 2008; site Q2860218
  { countryCode: 'ZW', name: 'Khami Ruins', category: 'old town', latitude: -20.14329, longitude: 28.42344, matchRadiusM: 1500, wikidataId: 'Q938685', isUnesco: true }, // WHS 365, 1986
  { countryCode: 'ZW', name: 'Mana Pools National Park', category: 'park', latitude: -15.81944, longitude: 29.40806, matchRadiusM: 56000, wikidataId: 'Q15728398', isUnesco: true }, // WHS 302, 1984
  { countryCode: 'ZW', name: 'Matobo Hills', category: 'range', latitude: -20.5, longitude: 28.5, matchRadiusM: 22000, wikidataId: 'Q917429', isUnesco: true }, // WHS 306, 2003
];

// Wikidata ids of landmarks.js entries that are World Heritage Sites (see the header)
export const UNESCO_IN_EXISTING = [
  'Q131013', // Acropolis of Athens (WHS 404)
  'Q794643', // Aïr and Ténéré Natural Reserves (WHS 573)
  'Q2727469', // Al Zubarah (WHS 1402)
  'Q27356', // Al-Hijr (Madain Salih) (WHS 1293)
  'Q47476', // Alhambra (WHS 314)
  'Q2914326', // Amphitheatre of El Jem (WHS 38)
  'Q80299', // Angel Falls (WHS 701)
  'Q43473', // Angkor Wat (WHS 668)
  'Q3642', // Asmara (WHS 1550)
  'Q178835', // Baalbek (WHS 294)
  'Q29317', // Bagan (WHS 1588)
  'Q1408909', // Bahla Fort (WHS 433)
  'Q826551', // Banaue Rice Terraces (WHS 722)
  'Q539518', // Banc d'Arguin National Park (WHS 506)
  'Q207468', // Bay of Kotor (WHS 125)
  'Q63353195', // Bijagós Archipelago (WHS 1431)
  'Q152225', // Bikini Atoll (WHS 1339)
  'Q24082981', // Blue and John Crow Mountains (WHS 1356)
  'Q891743', // Boma National Park (WHS 1808)
  'Q42798', // Borobudur Temple (WHS 592)
  'Q200521', // Brimstone Hill Fortress (WHS 910)
  'Q153430', // Bryggen (WHS 59)
  'Q188694', // Butrint (WHS 570)
  'Q500397', // Bwindi Impenetrable National Park (WHS 682)
  'Q1254826', // Cape Coast Castle (WHS 34)
  'Q189934', // Central Suriname Nature Reserve (WHS 1017)
  'Q5859', // Chichen Itza (WHS 483)
  'Q1072369', // Chief Roi Mata's Domain (WHS 1280)
  'Q194504', // Church of the Nativity (WHS 1433)
  'Q464913', // Cidade Velha (WHS 1310)
  'Q206194', // Citadelle Laferrière (WHS 180)
  'Q2470834', // Colonial City of Santo Domingo (WHS 526)
  'Q214827', // Copán (WHS 129)
  'Q843147', // Dja Faunal Reserve (WHS 407)
  'Q208559', // Drottningholm Palace (WHS 559)
  'Q852433', // East Rennell (WHS 854)
  'Q14452', // Easter Island (WHS 715)
  'Q38095', // Galápagos Islands (WHS 1)
  'Q499285', // Geghard Monastery (WHS 960)
  'Q679979', // Gelati Monastery (WHS 710)
  'Q4313909', // Gobustan Rock Art (WHS 1076)
  'Q215429', // Grand Place (WHS 857)
  'Q798826', // Great Wall of China (Badaling) (WHS 438)
  'Q209217', // Great Zimbabwe National Monument (WHS 364)
  'Q2711604', // Guaita Tower (WHS 1245)
  'Q190128', // Ha Long Bay (WHS 672)
  'Q466614', // Hatra (WHS 277)
  'Q1026415', // Historic Centre of Riga (WHS 852)
  'Q1025100', // Historic City of Ayutthaya (WHS 576)
  'Q56064', // Historic Quarter of Colonia del Sacramento (WHS 747)
  'Q755514', // Hypogeum of Ħal-Saflieni (WHS 130)
  'Q244347', // Island of Gorée (WHS 26)
  'Q331099', // Island of Mozambique (WHS 599)
  'Q1366015', // Jesuit Missions of La Santísima Trinidad de Paraná (WHS 648)
  'Q27985', // Joya de Cerén (WHS 675)
  'Q109079', // Kaesong (WHS 1278)
  'Q3037', // Kathmandu Valley (WHS 121)
  'Q508040', // Koutammakou (WHS 1140)
  'Q213188', // Kunta Kinteh Island (WHS 761)
  'Q1077596', // Lake Malawi National Park (WHS 289)
  'Q1129992', // Le Morne Cultural Landscape (WHS 1259)
  'Q191504', // Leptis Magna (WHS 183)
  'Q676203', // Machu Picchu (WHS 274)
  'Q503835', // Manovo-Gounda St Floris National Park (WHS 475)
  'Q46069', // Mausoleum of Khoja Ahmed Yasawi (WHS 1103)
  'Q5780', // Meroë (WHS 1336)
  'Q187197', // Milford Sound (WHS 551)
  'Q192981', // Minaret of Jam (WHS 211)
  'Q5725', // Mohenjo-daro (WHS 138)
  'Q629436', // Morne Trois Pitons National Park (WHS 814)
  'Q39231', // Mount Fuji (WHS 1418)
  'Q7296', // Mount Kilimanjaro (WHS 403)
  'Q263883', // Odzala National Park (WHS 692)
  'Q1223508', // Ohrid Region (WHS 99)
  'Q12220316', // Old City of Sanaa (WHS 385)
  'Q1165566', // Old Havana (WHS 204)
  'Q1453235', // Orkhon Valley (WHS 1081)
  'Q5747', // Palmyra (WHS 23)
  'Q720015', // Pamir (Lake Karakul) (WHS 1252)
  'Q12065255', // Paphos Archaeological Park (WHS 79)
  'Q367943', // Perito Moreno Glacier (WHS 145)
  'Q129072', // Persepolis (WHS 114)
  'Q5788', // Petra (WHS 326)
  'Q639487', // Pitons (WHS 1161)
  'Q189849', // Plitvice Lakes National Park (WHS 98)
  'Q65114170', // Pre-Columbian Chiefdom Settlements with Stone Spheres (WHS 1453)
  'Q12508', // Pyramids of Giza (WHS 86)
  'Q41116', // Red Square (WHS 545)
  'Q207945', // Rila Monastery (WHS 216)
  'Q17215490', // Rock Islands Southern Lagoon (WHS 1386)
  'Q642979', // Rock-Hewn Churches of Lalibela (WHS 18)
  'Q1422898', // Ruins of León Viejo (WHS 613)
  'Q1269931', // Ruins of Loropéni (WHS 1225)
  'Q830054', // Saint Sophia Cathedral (WHS 527)
  'Q17255582', // Samarkand – Crossroad of Cultures (WHS 603)
  'Q131330', // Schönbrunn Palace (WHS 786)
  'Q272153', // Sigiriya (WHS 202)
  'Q205558', // Spiš Castle (WHS 620)
  'Q12512', // St. Peter's Basilica (WHS 286)
  'Q9202', // Statue of Liberty (WHS 307)
  'Q39671', // Stonehenge (WHS 373)
  'Q143042', // Studenica Monastery (WHS 389)
  'Q1123956', // Sukur Cultural Landscape (WHS 938)
  'Q42725548', // Sundarbans (WHS 798)
  'Q1292442', // Suomenlinna (WHS 583)
  'Q45178', // Sydney Opera House (WHS 166)
  'Q213360', // Table Mountain (WHS 1007)
  'Q9141', // Taj Mahal (WHS 252)
  'Q726803', // Tallinn Old Town (WHS 822)
  'Q181172', // Tikal (WHS 64)
  'Q9427', // Timbuktu (WHS 119)
  'Q215003', // Tower of Belém (WHS 263)
  'Q1405154', // Tsingy de Bemaraha (WHS 494)
  'Q573558', // Vallée de Mai Nature Reserve (WHS 261)
  'Q43278', // Victoria Falls (WHS 509)
  'Q579860', // Wat Phou (WHS 481)
  'Q454019', // Wieliczka Salt Mine (WHS 32)
  'Q107370', // Þingvellir National Park (WHS 1152)
];

# The landmark models still to draw

Written 23 Nov 2026 (the user's wish), after the first 139 (see CLAUDE.md, "little 3D landmark models"). Draw them five at a time as before: a folder `images/src/models/<id>/` with its Blender script on `../toon.py`, the render and `.blend`, and `model.json` (`name`, `latitude`, `longitude`, `maps`, `landmark`, the Wikidata item). Then run `node images/src/tools/landmark-models.mjs`, check each spot lands in its state (models off a coast or on an islet the map doesn't draw: within the state's bounds), and add an e2e row to `client/tests/e2e-app/countryMap.spec.js` (`MORE_MODELS`, or a list of their own).

The spots and Wikidata items come from the seed's landmark files (`server/prisma/seed/data/landmarks.js` and `landmarksUnesco.js`), so each model belongs to a landmark there (the passport's). "Not in the landmark data yet" means a landmark row has to be added first (`landmarks.js`, checked against Wikidata as its header says; then the mock's copy, `node client/scripts/generate-mock-landmarks.mjs`), or another of the country's landmarks chosen. A model can stand somewhere else in its landmark's area (a serial site's most visited part) when the drawing needs it.

## 1. A first model for the 90 country maps that had none

All drawn and on the country maps (23 Nov 2026), so every country map has a model; the 24 whose landmark wasn't in the data had one added to `landmarks.js` first, from Wikidata. The e2e test's `LAST_MODELS` lists them (`client/tests/e2e-app/countryMap.spec.js`).

| Map | Model id | Maps | Landmark (name in the data: latitude, longitude, Wikidata) | What to draw | Done |
| --- | --- | --- | --- | --- | --- |
| Andorra | `madriu-valley` | AD | Madriu-Perafita-Claror Valley: 42.49215, 1.59443, Q332800 | The high glacial valley, stone shepherds' huts and terraces, a stream | On the map |
| Antigua and Barbuda | `nelsons-dockyard` | AG | Antigua Naval Dockyard: 17.00455, -61.76007, Q124402010 | Nelson's Dockyard: the Georgian stone storehouses, the pillars of the old boathouse, yachts | On the map |
| Anguilla | `wallblake-house` | AI | Wallblake House: 18.2094, -63.0547, Q7963002 | Wallblake House, Anguilla's 18th-century plantation house, with its kitchen and the stone church beside it, palms | On the map |
| Angola | `kissama` | AO | Kissama National Park: -9.75, 13.58333, Q3179197 | Savanna by the Kwanza river's mouth, elephants and a baobab | On the map |
| American Samoa | `pola-island` | AS | National Park of American Samoa: -14.25833, -170.68333, Q843075 | Pola Island's sheer sea stack off Tutuila, in the National Park of American Samoa | On the map |
| Aruba | `california-lighthouse` | AW | California Lighthouse: 12.61337, -70.05241, Q2279321 | The California Lighthouse on its dunes, with divi-divi trees bent by the wind | On the map |
| Barbados | `bridgetown` | BB | Historic Bridgetown and its Garrison: 13.0975, -59.61667, Q36168 | The neo-Gothic Parliament Buildings and clock tower by the Careenage | On the map |
| Burkina Faso | `loropeni` | BF | Ruins of Loropéni: 10.31028, -3.56306, Q1269931 | The high laterite stone walls of the ruined enclosure, shea trees | On the map |
| Bahrain | `qalat-al-bahrain` | BH | Qal'at al-Bahrain: 26.23361, 50.52056, Q740104 | The Portuguese fort on its tell by the sea, palms | On the map |
| Burundi | `kibira` | BI | Kibira National Park: -2.91466, 29.43361, Q3084668 | Montane rainforest on the hills, tea fields, chimpanzees | On the map |
| Benin | `abomey` | BJ | Royal Palaces of Abomey: 7.18645, 1.994, Q2425839 | The earthen palace walls with bas-reliefs, the thatched royal tombs | On the map |
| Saint Barthélemy | `gustavia` | BL | Gustavia: 17.89861, -62.84917, Q34112 | Gustavia harbour: red-roofed Swedish-era houses, yachts, the old lighthouse | On the map |
| Bermuda | `st-george-bermuda` | BM | Historic Town of St George, Bermuda: 32.37944, -64.67778, Q7865260 | The white-roofed pastel cottages of St George and St Peter's Church | On the map |
| Brunei | `omar-ali-saifuddien-mosque` | BN | Omar Ali Saifuddien Mosque: 4.88958, 114.93914, Q842921 | The Omar Ali Saifuddien Mosque, its golden dome over the lagoon and its stone barge | On the map |
| Bolivia | `tiwanaku` | BO | Tiwanaku: -16.55472, -68.67333, Q61750 | The Gate of the Sun and the Kalasasaya temple's stone figures on the Altiplano | On the map |
| Caribbean Netherlands | `bonaire-salt-pans` | BQ | Salt Pans of Bonaire (Pekelmeer): 12.03333, -68.25, Q21806587 | Bonaire's pink salt pans, white salt pyramids, the slave huts and flamingos | On the map |
| Bahamas | `pig-beach` | BS | Pig Beach: 24.18361, -76.45639, Q7193206 | Pig Beach in the Exumas: swimming pigs, a boat, white sand | On the map |
| Bhutan | `tigers-nest` | BT | Paro Taktsang (Tiger's Nest): 27.49167, 89.36333, Q2209873 | Paro Taktsang, the Tiger's Nest monastery on its cliff, prayer flags | On the map |
| Botswana | `okavango-delta` | BW | Okavango Delta: -19.4, 22.9, Q650872 | Channels and islands, a mokoro canoe, elephants wading, papyrus | On the map |
| Belize | `great-blue-hole` | BZ | Belize Barrier Reef (Great Blue Hole): 17.31556, -87.53444, Q86486 | The dark round Great Blue Hole in the turquoise reef | On the map |
| Democratic Republic of the Congo | `virunga` | CD | Virunga National Park: -0.5, 29.5, Q223589 | Nyiragongo's lava lake smoking above the forest, a mountain gorilla | On the map |
| Central African Republic | `manovo-gounda` | CF | Manovo-Gounda St Floris National Park: 8.5, 21.5, Q503835 | Savanna and floodplain, giraffes, a black rhino | On the map |
| Republic of the Congo | `odzala` | CG | Odzala National Park: 0.8, 14.9, Q263883 | A forest clearing (bai) with lowland gorillas and forest elephants | On the map |
| Côte d'Ivoire | `grand-bassam` | CI | Grand-Bassam: 5.1965, -3.7368, Q17990623 | The colonial houses of old Grand-Bassam by the lagoon (or the Basilica of Yamoussoukro: not in the data) | On the map |
| Cameroon | `dja` | CM | Dja Faunal Reserve: 3.0167, 12.9833, Q843147 | The Dja river looping round rainforest, a gorilla | On the map |
| Cape Verde | `cidade-velha` | CV | Cidade Velha: 14.91667, -23.60417, Q464913 | The pillory and the old town under Fort São Filipe, by the sea | On the map |
| Curaçao | `willemstad` | CW | Historic Willemstad: 12.10614, -68.9342, Q17240216 | The Handelskade's colourful gabled houses and the floating Queen Emma Bridge | On the map |
| Dominica | `morne-trois-pitons` | DM | Morne Trois Pitons National Park: 15.26667, -61.28333, Q629436 | The Boiling Lake steaming in the rainforest, Trafalgar Falls | On the map |
| Algeria | `mzab-valley` | DZ | M'Zab Valley: 32.48722, 3.68139, Q724484 | Ghardaïa: pastel cube houses climbing to the mosque's minaret | On the map |
| Western Sahara | `dakhla` | EH | Dakhla Bay: 23.73355, -15.86173, Q25390655 | The Dakhla lagoon and its dunes, kitesurfers, a camel | On the map |
| Fiji | `sigatoka-dunes` | FJ | Sigatoka Sand Dunes: -18.17, 177.48889, Q7511961 | The dunes by the river mouth and the surf, a bure on the shore | On the map |
| Falkland Islands | `volunteer-point` | FK | Volunteer Point: -51.4711, -57.845, Q431031 | King penguins at Volunteer Point, its white beach and the South Atlantic | On the map |
| Micronesia | `nan-madol` | FM | Nan Madol: 6.84194, 158.33222, Q846967 | The basalt-log walls of the islets in the lagoon, mangroves | On the map |
| Faroe Islands | `mulafossur` | FO | Múlafossur: 62.10748, -7.43578, Q56322370 | Múlafossur, the waterfall falling from Gásadalur's cliff into the sea, turf-roofed houses | On the map |
| French Guiana | `kourou-space-centre` | GF | Guiana Space Centre: 5.23722, -52.76056, Q308987 | The Guiana Space Centre: an Ariane rocket on its pad by the rainforest | On the map |
| Gibraltar | `rock-of-gibraltar` | GI | Gorham's Cave Complex: 36.1225, -5.34194, Q60346199 | The Rock, with the caves at its foot and Barbary macaques | On the map |
| Gambia | `kunta-kinteh-island` | GM | Kunta Kinteh Island: 13.31753, -16.36144, Q213188 | The ruined fort on its island in the Gambia river, baobabs | On the map |
| Guinea | `fouta-djallon` | GN | Fouta Djallon Highlands: 11.315, -12.2975, Q850245 | The sandstone plateau's cliffs and waterfalls, a round thatched hut | On the map |
| Guadeloupe | `carbet-falls` | GP | Carbet Falls: 16.0456, -61.6522, Q2967747 | The Chutes du Carbet falling down La Soufrière's forested flank | On the map |
| Guam | `two-lovers-point` | GU | Two Lovers Point: 13.53499, 144.80245, Q96097880 | Two Lovers Point: the cliff over Tumon Bay, its lookout and the reef | On the map |
| Guinea-Bissau | `bijagos` | GW | Bijagós Archipelago: 11.25, -16.08333, Q63353195 | Islands of mangroves and palms, a pirogue, saltwater hippos | On the map |
| Canary Islands | `teide` | IC | Teide National Park: 28.27646, -16.64267, Q715124 | Mount Teide over the lava fields, the Roques de García | On the map |
| Israel | `bahai-gardens` | IL | Bahá'í Holy Places in Haifa: 32.81378, 34.98655, Q2149036 | The Shrine of the Báb's golden dome over its terraced gardens down Mount Carmel | On the map |
| Jamaica | `blue-mountains` | JM | Blue and John Crow Mountains: 18.0775, -76.57111, Q24082981 | Misty blue peaks, coffee bushes, a little plantation house | On the map |
| Kyrgyzstan | `ala-archa` | KG | Tien Shan (Ala-Archa): 42.54752, 74.48456, Q40544 | Snow peaks over the gorge, a yurt and horses | On the map |
| Kiribati | `phoenix-islands` | KI | Phoenix Islands Protected Area: -3.64972, -172.8575, Q863815 | A ring atoll with palms in the open Pacific, seabirds, a reef shark | On the map |
| Comoros | `karthala` | KM | Mount Karthala: -11.76028, 43.35306, Q527548 | The volcano's wide caldera over the forest, a dhow on the sea | On the map |
| North Korea | `kaesong` | KP | Kaesong: 37.97167, 126.55278, Q109079 | The Namdaemun gate and the Sungkyunkwan's old halls among ginkgos | On the map |
| Cayman Islands | `stingray-city` | KY | Stingray City: 19.3757, -81.3048, Q281265 | Stingray City: the sandbar in the turquoise sound, stingrays, a boat | On the map |
| Liberia | `providence-island` | LR | Providence Island: 6.31976, -10.80126, Q27459317 | The island in the Mesurado river's mouth at Monrovia, its monuments, mangroves | On the map |
| Saint Martin | `fort-louis` | MF | Fort Louis: 18.0708, -63.0854, Q3077924 | Fort Louis over Marigot's harbour and its boats | On the map |
| Northern Mariana Islands | `managaha` | MP | Managaha: 15.24, 145.71056, Q6799175 | Managaha, the islet off Saipan: white beach, palms, the lagoon and an old Japanese gun | On the map |
| Martinique | `mount-pelee` | MQ | Mount Pelée and the Pitons of Martinique: 14.7582, -61.0731, Q64842970 | Mount Pelée over the ruins of Saint-Pierre, the bay | On the map |
| Mauritania | `chinguetti` | MR | Ancient Ksour of Mauritania (Chinguetti): 20.4633, -12.3667, Q65921575 | Chinguetti's stone mosque and square minaret among the dunes | On the map |
| Montserrat | `soufriere-hills` | MS | Soufrière Hills: 16.71667, -62.18333, Q845239 | The Soufrière Hills volcano smoking over buried Plymouth | On the map |
| Malta | `valletta` | MT | City of Valletta: 35.89778, 14.5125, Q23800 | Valletta's domes and bastions over the Grand Harbour, a luzzu boat | On the map |
| Maldives | `muliaage-palace` | MV | Muliaage Palace: 4.17739, 73.51249, Q3327612 | The white palace in Malé, with overwater bungalows on the lagoon | On the map |
| Niger | `agadez` | NE | Historic Centre of Agadez: 16.9744, 7.9896, Q47800464 | The Great Mosque's mud-brick minaret bristling with wooden beams | On the map |
| Nigeria | `sukur` | NG | Sukur Cultural Landscape: 10.74056, 13.57167, Q1123956 | The chief's palace on its hilltop, stone-paved paths and terraces | On the map |
| Nicaragua | `leon-cathedral` | NI | León Cathedral: 12.435, -86.8781, Q48605 | León's white cathedral, its rooftop domes, volcanoes behind | On the map |
| Nauru | `command-ridge` | NR | Command Ridge: -0.53055, 166.91692, Q2667931 | Nauru's high point: the old Japanese guns and the coral pinnacles | On the map |
| French Polynesia | `taputapuatea` | PF | Taputapuātea: -16.83611, -151.35917, Q3287362 | The marae's stone platforms by the lagoon, a voyaging canoe (or Bora Bora: not in the data) | On the map |
| Papua New Guinea | `kokoda-track` | PG | Kokoda Track: -9.15567, 147.66, Q5347553 | The trail over the jungle ridges, a village and a memorial | On the map |
| Puerto Rico | `el-morro` | PR | La Fortaleza and Old San Juan: 18.46389, -66.11917, Q15813904 | El Morro's ramparts and sentry box over the sea, Old San Juan's colours | On the map |
| Palestine | `church-of-the-nativity` | PS | Church of the Nativity: 31.70431, 35.20758, Q194504 | The church's stone fortress walls and Manger Square in Bethlehem | On the map |
| Réunion | `piton-de-la-fournaise` | RE | Pitons, Cirques and Remparts of Réunion: -21.0994, 55.48, Q2710055 | Piton de la Fournaise's red crater and the cirques' green walls | On the map |
| Solomon Islands | `east-rennell` | SB | East Rennell: -11.68333, 160.33333, Q852433 | Lake Tegano's islets in the raised coral atoll, forest | On the map |
| Sierra Leone | `bunce-island` | SL | Bunce Island: 8.56987, -13.04027, Q1004939 | The ruined slave fort on its island in the Sierra Leone river | On the map |
| Somalia | `laas-geel` | SO | Laas Geel: 9.78028, 44.44333, Q1799347 | The granite outcrops with their painted cattle and herders | On the map |
| Suriname | `paramaribo` | SR | Historic Inner City of Paramaribo: 5.826, -55.15387, Q2147036 | The white wooden houses and the wooden cathedral of Paramaribo | On the map |
| South Sudan | `boma` | SS | Boma National Park: 6.489, 33.914, Q891743 | Grassland and the white-eared kob's migration | On the map |
| São Tomé and Príncipe | `pico-cao-grande` | ST | Obo National Park: 0.15, 6.56667, Q2943640 | Pico Cão Grande, the volcanic needle over the rainforest | On the map |
| El Salvador | `joya-de-ceren` | SV | Joya de Cerén: 13.82749, -89.35616, Q27985 | The Maya village's adobe houses under ash, a volcano behind | On the map |
| Sint Maarten | `maho-beach` | SX | Maho Beach: 18.03917, -63.12028, Q922921 | Maho Beach: a plane landing low over the beach and the bathers | On the map |
| Eswatini | `mlilwane` | SZ | Mlilwane Wildlife Sanctuary: -26.49783, 31.18572, Q1941204 | The Execution Rock and the valley, zebras and a beehive hut | On the map |
| Turks and Caicos Islands | `grace-bay` | TC | Grace Bay: 21.80031, -72.17212, Q59163583 | Grace Bay's long white beach and turquoise water, a conch shell | On the map |
| Chad | `ennedi` | TD | Ennedi Massif: 17.25, 22, Q1343339 | The Aloba Arch and the sandstone pillars of the Ennedi, camels | On the map |
| Timor-Leste | `cristo-rei-dili` | TL | Cristo Rei of Dili: -8.52053, 125.60832, Q680813 | The Cristo Rei of Dili on its cape over the bay | On the map |
| Trinidad and Tobago | `pitch-lake` | TT | Pitch Lake: 10.2325, -61.62806, Q717351 | The lake of asphalt with its pools of water, a worker digging | On the map |
| Tuvalu | `funafuti` | TV | Funafuti Conservation Area: -8.51667, 179.05, Q5508708 | Funafuti's islets in the lagoon, palms, a canoe | On the map |
| Uganda | `kasubi-tombs` | UG | Kasubi Tombs: 0.32917, 32.55333, Q309426 | The great thatched dome of the Buganda kings' tomb | On the map |
| Saint Vincent and the Grenadines | `la-soufriere-svg` | VC | La Soufrière Volcano: 13.33333, -61.18333, Q26544 | La Soufrière's crater over Saint Vincent's forest | On the map |
| British Virgin Islands | `the-baths` | VG | The Baths: 18.4294, -64.4454, Q7715805 | The Baths on Virgin Gorda: giant granite boulders on the beach | On the map |
| United States Virgin Islands | `trunk-bay` | VI | Trunk Bay: 18.3525, -64.76972, Q4573739 | Trunk Bay on St John: the beach, its cay and the reef trail | On the map |
| Vanuatu | `roi-mata` | VU | Chief Roi Mata's Domain: -17.69364, 168.23399, Q1072369 | Hat Island and the chief's burial place, the lagoon (or Mount Yasur: not in the data) | On the map |
| Scotland | `edinburgh-castle` | XC, GB | Old and New Towns of Edinburgh: 55.95, -3.21667, Q15260680 | Edinburgh Castle on its rock over Princes Street Gardens | On the map |
| Northern Ireland | `giants-causeway` | XI, GB | Giant's Causeway: 55.24083, -6.51167, Q106187 | The hexagonal basalt columns stepping into the sea | On the map |
| Kosovo | `gracanica` | XK | Medieval Monuments in Kosovo (Gračanica): 42.59833, 21.19333, Q1137661 | Gračanica Monastery's five domes and banded brick walls | On the map |
| Wales | `caernarfon-castle` | XW, GB | Castles of King Edward in Gwynedd: 53.13972, -4.27694, Q837627 | Caernarfon Castle's banded polygonal towers on the Menai Strait | On the map |
| Mayotte | `mont-choungui` | YT | Mont Choungui: -12.95694, 45.13389, Q3321752 | Mont Choungui over the lagoon, a turtle and an outrigger | On the map |

Scotland, Northern Ireland and Wales are the UK's nations: their landmarks are the UK's (GB) in the data, and their models go on the UK's map too, as Big Ben is on the UK's and England's.

## 2. More models for countries that have one (156)

So a country's map can show more than one: the country map draws every model whose `maps` has it (the e2e rows that expect one model on a map then need their count changing).

Where two models' pictures would overlap in the map's opening view (a 1440 × 900 screen), only the more famous shows (23 Nov 2026, the user's decision; ranked by judgement, as Wikidata's counts follow UNESCO's listing items more than the places): the other is still drawn, for other uses, with `"onMap": false` in its `model.json`. "No" in the last column marks those. Three models already on the map gave way to one in this list once it was drawn, so theirs have `"onMap": false` too: Ayutthaya to the Grand Palace, Buda Castle to the Hungarian Parliament, Wieliczka to Kraków's old town.

All 156 were drawn on 23 Nov 2026 ("(drawn)": folder, render and `model.json`), the 10 whose landmark wasn't in the data after it was added to `landmarks.js` from Wikidata, and are on the maps since 24 Nov 2026 (the country map e2e test's `EXTRA_MODELS`).

| Country | Model id | Maps | Landmark (name in the data: latitude, longitude, Wikidata) | What to draw | On the map |
| --- | --- | --- | --- | --- | --- |
| United Arab Emirates | `sheikh-zayed-mosque` | AE | Sheikh Zayed Grand Mosque: 24.412, 54.474, Q695604 | The Sheikh Zayed Grand Mosque's white domes and minarets | Yes (drawn) |
| Armenia | `haghpat` | AM | Haghpat and Sanahin Monasteries: 41.095, 44.71028, Q16910825 | Haghpat's stone churches and bell tower on the gorge | Yes (drawn) |
| Argentina | `iguazu-falls` | AR | Iguazú National Park (Argentina): -25.66667, -54.4, Q57072712 | The Devil's Throat's curtain of falls, rainbows, a walkway | Yes (drawn) |
| Argentina | `humahuaca` | AR | Quebrada de Humahuaca: -23.19986, -65.34886, Q28061 | The Hill of Seven Colours over Purmamarca's adobe village | Yes (drawn) |
| Austria | `hallstatt` | AT | Hallstatt-Dachstein Salzkammergut: 47.5594, 13.6464, Q1033019 | Hallstatt's church spire and houses on the lake under the mountains | Yes (drawn) |
| Austria | `salzburg` | AT | Historic Centre of Salzburg: 47.7997, 13.0486, Q1621046 | Hohensalzburg fortress over the cathedral's domes and the river | Yes (drawn) |
| Australia | `uluru` | AU | Uluru-Kata Tjuta National Park: -25.32208, 130.98573, Q251999 | Uluru's red rock on the desert, Kata Tjuta behind | Yes (drawn) |
| Australia | `great-barrier-reef` | AU | Great Barrier Reef: -16.4, 145.8, Q7343 | A coral cay in the reef, a turtle, a boat | Yes (drawn) |
| Azerbaijan | `maiden-tower` | AZ | Walled City of Baku: 40.36667, 49.83333, Q29901643 | The Maiden Tower and the old city walls, the Flame Towers behind | Yes (drawn) |
| Bosnia and Herzegovina | `visegrad-bridge` | BA | Mehmed Paša Sokolović Bridge: 43.78248, 19.28787, Q210055 | The Višegrad bridge's eleven arches over the Drina | Yes (drawn) |
| Belgium | `bruges` | BE | Historic Centre of Bruges: 51.20891, 3.22527, Q5762117 | The Belfry over the Markt's stepped gables and a canal | Yes (drawn) |
| Bulgaria | `nessebar` | BG | Ancient City of Nessebar: 42.65611, 27.73, Q64617320 | Nessebar's brick churches and wooden houses on its peninsula | Yes (drawn) |
| Bolivia | `salar-de-uyuni` | BO | Salar de Uyuni: -20.33333, -67.7, Q76122 | The Salar de Uyuni's white salt flat, a cactus island, a jeep | Yes (drawn) |
| Brazil | `teatro-amazonas` | BR | Amazonia Theatres (Teatro Amazonas): -3.13028, -60.0234, Q65561204 | Manaus's opera house and its tiled dome, the river | Yes (drawn) |
| Brazil | `lencois-maranhenses` | BR | Lençóis Maranhenses National Park: -2.48333, -43.13333, Q647777 | White dunes with blue lagoons between them | Yes (drawn) |
| Brazil | `brasilia` | BR | Brasília: -15.79389, -47.88278, Q3391360 | The cathedral's crown of concrete ribs and the Congress towers | Yes (drawn) |
| Belarus | `nesvizh-castle` | BY | Nesvizh Castle: 53.22278, 26.69139, Q15278712 | Nesvizh Castle's palace and towers in its moat | No: Mir Castle shows (drawn) |
| Canada | `moraine-lake` | CA | Canadian Rocky Mountain Parks: 51.42472, -116.47972, Q72895 | Moraine Lake's turquoise water under the Ten Peaks, canoes | Yes (drawn) |
| Canada | `chateau-frontenac` | CA | Old Québec: 46.80944, -71.21056, Q2114279 | The Château Frontenac over the St Lawrence | Yes (drawn) |
| Switzerland | `jungfrau` | CH | Jungfrau-Aletsch: 46.5, 8.03333, Q616912 | The Aletsch Glacier under the Jungfrau | Yes (drawn) |
| Switzerland | `landwasser-viaduct` | CH | Rhaetian Railway (Albula / Bernina): 46.4089, 10.0197, Q2962401 | The Landwasser Viaduct with a red train going into the tunnel | Yes (drawn) |
| Switzerland | `matterhorn` | CH | Matterhorn: 45.97639, 7.65861, Q1374 | The Matterhorn over Zermatt's chalets | Yes (drawn) |
| Chile | `chiloe-churches` | CL | Churches of Chiloé: -42.5, -73.76667, Q27964 | A wooden church with shingles, stilt houses (palafitos) on the water | Yes (drawn) |
| Chile | `torres-del-paine` | CL | Torres del Paine National Park: -50.98306, -72.96639, Q901646 | The Torres del Paine's granite towers over a lake, guanacos | Yes (drawn) |
| China | `forbidden-city` | CN | Forbidden City: 39.91583, 116.39083, Q80290 | The Hall of Supreme Harmony, red walls and golden roofs | No: the Great Wall shows (drawn) |
| China | `terracotta-army` | CN | Terracotta Army and Qin Mausoleum: 34.38167, 109.25389, Q910180 | Rows of terracotta warriors and horses in their pit | Yes (drawn) |
| China | `potala-palace` | CN | Potala Palace: 29.65778, 91.11694, Q71229 | The white and red palace climbing its hill in Lhasa | Yes (drawn) |
| China | `guilin` | CN | South China Karst (Guilin): 25.0022, 110.4211, Q65966782 | Karst peaks over the Li river, a bamboo raft | Yes (drawn) |
| China | `temple-of-heaven` | CN | Temple of Heaven: 39.8822, 116.4066, Q125445 | The round Hall of Prayer for Good Harvests on its marble terraces | No: the Great Wall shows (drawn) |
| Colombia | `cartagena` | CO | Cartagena Walled City and Fortresses: 10.41667, -75.53333, Q6091925 | Cartagena's walls, the clock tower gate and balconied houses | Yes (drawn) |
| Cuba | `trinidad-cuba` | CU | Trinidad and Valle de los Ingenios: 21.80306, -79.98444, Q15819677 | Trinidad's pastel streets and the Manaca Iznaga tower | Yes (drawn) |
| Cuba | `vinales` | CU | Viñales Valley: 22.61667, -83.71667, Q48108 | The mogotes over tobacco fields and a drying barn | Yes (drawn) |
| Czechia | `cesky-krumlov` | CZ | Český Krumlov: 48.81667, 14.31667, Q64636277 | The castle's painted tower over the Vltava's bend | Yes (drawn) |
| Germany | `brandenburg-gate` | DE | Brandenburg Gate: 52.51627, 13.37772, Q82425 | The Brandenburg Gate and its Quadriga | Yes (drawn) |
| Germany | `cologne-cathedral` | DE | Cologne Cathedral: 50.94139, 6.95833, Q4176 | Cologne Cathedral's twin spires over the Rhine bridge | Yes (drawn) |
| Denmark | `kronborg` | DK | Kronborg Castle: 56.03861, 12.62194, Q189358 | Kronborg Castle's copper spires on the Øresund | Yes (drawn) |
| Ecuador | `quito` | EC | Historic Centre of Quito: -0.22, -78.51208, Q8343766 | The Basilica del Voto Nacional's spires over old Quito, the volcano | Yes (drawn) |
| Egypt | `abu-simbel` | EG | Nubian Monuments (Abu Simbel): 22.33694, 31.62556, Q134140 | The four colossal Ramesses at Abu Simbel by Lake Nasser | Yes (drawn) |
| Egypt | `karnak` | EG | Ancient Thebes (Luxor): 25.72056, 32.61028, Q141298543 | Karnak's hypostyle hall columns and an obelisk, a felucca on the Nile | Yes (drawn) |
| Spain | `alhambra` | ES | Alhambra: 37.17634, -3.58821, Q47476 | The Alhambra's towers on its hill, the Sierra Nevada behind | Yes (drawn) |
| Spain | `segovia-aqueduct` | ES | Segovia Old Town and Aqueduct: 40.94847, -4.11675, Q15728389 | The Roman aqueduct's arches and the Alcázar | Yes (drawn) |
| Spain | `seville-giralda` | ES | Seville Cathedral and Alcázar: 37.38384, -5.99155, Q9709444 | The Giralda tower and the cathedral, orange trees | Yes (drawn) |
| Ethiopia | `gondar` | ET | Fasil Ghebbi: 12.60806, 37.46972, Q464695 | Fasilides' castle in Gondar | Yes (drawn) |
| Ethiopia | `simien-mountains` | ET | Simien Mountains National Park: 13.18333, 38.06667, Q504315 | The Simien escarpment's pinnacles, geladas and a walia ibex | Yes (drawn) |
| France | `mont-saint-michel` | FR | Mont-Saint-Michel: 48.63556, -1.51056, Q17117964 | The abbey on its island in the bay, the causeway | Yes (drawn) |
| France | `versailles` | FR | Palace of Versailles: 48.805, 2.11944, Q3034552 | The palace's garden front, the fountains and parterres | No: the Eiffel Tower shows (drawn) |
| France | `chambord` | FR | Loire Valley (Chambord): 47.61611, 1.51722, Q205367 | Chambord's roofscape of towers and chimneys | Yes (drawn) |
| France | `pont-du-gard` | FR | Pont du Gard: 43.9473, 4.5355, Q189764 | The Roman aqueduct's three tiers of arches over the Gardon | Yes (drawn) |
| France | `carcassonne` | FR | Cité de Carcassonne: 43.20644, 2.36379, Q389269 | Carcassonne's double walls and pointed towers | Yes (drawn) |
| United Kingdom | `stonehenge` | GB, XE | Stonehenge: 51.17889, -1.82611, Q39671 | The stone circle and its trilithons on the plain | Yes (drawn) |
| United Kingdom | `tower-of-london` | GB, XE | Tower of London: 51.5082, -0.0762, Q62378 | The Tower of London's White Tower in its walls, Tower Bridge beside it | No: Big Ben shows (drawn) |
| United Kingdom | `bath` | GB, XE | City of Bath: 51.38139, -2.35972, Q22889 | The Roman Baths and the abbey, the Royal Crescent | No: Stonehenge shows (drawn) |
| United Kingdom | `forth-bridge` | GB, XC | Forth Bridge: 55.9984, -3.3876, Q275 | The Forth Bridge's red cantilevers with a train | No: Edinburgh Castle shows (drawn) |
| Georgia | `svaneti-towers` | GE | Upper Svaneti: 42.91639, 43.01139, Q47496765 | Ushguli's stone defence towers under snowy Shkhara | Yes (drawn) |
| Greece | `meteora` | GR | Meteora: 39.7125, 21.62667, Q3125051 | Monasteries on top of the rock pillars | Yes (drawn) |
| Greece | `santorini` | GR | Santorini: 36.415, 25.4325, Q129296 | Oia's white houses and blue domes on the caldera | Yes (drawn) |
| Greece | `delphi` | GR | Delphi: 38.48201, 22.50022, Q17652439 | The Tholos and the temple of Apollo on Parnassus's slope | Yes (drawn) |
| Guatemala | `antigua-guatemala` | GT | Antigua Guatemala: 14.5565, -90.73381, Q65130425 | The Santa Catalina arch with the Volcán de Agua behind | Yes (drawn) |
| Croatia | `dubrovnik` | HR | Old City of Dubrovnik: 42.6409, 18.1091, Q910661 | Dubrovnik's walls and red roofs on the sea | Yes (drawn) |
| Croatia | `diocletians-palace` | HR | Diocletian's Palace, Split: 43.50833, 16.43889, Q17132416 | The palace's peristyle and the cathedral bell tower | Yes (drawn) |
| Hungary | `hungarian-parliament` | HU | Budapest, Banks of the Danube: 47.48242, 19.07067, Q851122 | The Parliament's dome and spires on the Danube, the Chain Bridge | Yes (drawn) |
| Indonesia | `prambanan` | ID | Prambanan: -7.75222, 110.49167, Q84403674 | Prambanan's tall carved Hindu temples | No: Borobudur shows (drawn) |
| Indonesia | `komodo` | ID | Komodo National Park: -8.65162, 119.57657, Q4520 | Komodo dragons on the island's dry hills, a pink beach | Yes (drawn) |
| Indonesia | `bali-subak` | ID | Bali Subak Landscape: -8.25917, 115.40278, Q17134727 | Jatiluwih's rice terraces and a temple with a meru tower | Yes (drawn) |
| Ireland | `skellig-michael` | IE | Skellig Michael: 51.77111, -10.54056, Q207193 | The monks' beehive huts on the rock in the sea, puffins | Yes (drawn) |
| Israel | `masada` | IL | Masada: 31.31556, 35.35389, Q186312 | The rock plateau over the Dead Sea, the snake path | Yes (drawn) |
| India | `hawa-mahal` | IN | Jaipur City: 26.915, 75.82, Q66485 | The Hawa Mahal's pink honeycomb facade | Yes (drawn) |
| India | `hampi` | IN | Hampi: 15.33455, 76.46216, Q26732 | The Vittala temple's stone chariot among the boulders | Yes (drawn) |
| India | `qutb-minar` | IN | Qutb Minar: 28.52438, 77.18543, Q1074330 | The Qutb Minar's fluted tower | No: the Red Fort shows (drawn) |
| India | `red-fort` | IN | Red Fort: 28.65583, 77.24028, Q45957 | The Red Fort's Lahori Gate and walls | Yes (drawn) |
| India | `golden-temple` | IN | Golden Temple: 31.62, 74.87667, Q180422 | The Golden Temple in its pool, Amritsar | Yes (drawn) |
| Iran | `naqsh-e-jahan` | IR | Naqsh-e Jahan Square: 32.65822, 51.67733, Q4519 | The Shah Mosque's blue dome and the square's arcades | Yes (drawn) |
| Iceland | `vatnajokull` | IS | Vatnajökull National Park: 64.5, -17, Q1353292 | The glacier's tongue and Jökulsárlón's icebergs | Yes (drawn) |
| Italy | `leaning-tower` | IT | Piazza del Duomo, Pisa: 43.72343, 10.39478, Q750245 | The Leaning Tower and the cathedral on the lawn | Yes (drawn) |
| Italy | `venice` | IT | Venice and its Lagoon: 45.43431, 12.33894, Q11352141 | St Mark's Campanile and Basilica, gondolas on the lagoon | Yes (drawn) |
| Italy | `florence-duomo` | IT | Historic Centre of Florence: 43.77306, 11.25611, Q2707802 | Brunelleschi's dome and Giotto's bell tower | No: the Leaning Tower of Pisa shows (drawn) |
| Italy | `pompeii` | IT | Pompeii and Herculaneum: 40.75, 14.48333, Q16920958 | Pompeii's forum and columns under Vesuvius | Yes (drawn) |
| Italy | `amalfi-coast` | IT | Amalfi Coast: 40.63333, 14.6, Q212214 | Positano's colourful houses tumbling to the sea | No: Pompeii shows (drawn) |
| Italy | `trulli` | IT | Trulli of Alberobello: 40.7825, 17.23694, Q16913064 | The white trulli with their conical stone roofs | Yes (drawn) |
| Italy | `cinque-terre` | IT | Portovenere and Cinque Terre: 44.10694, 9.72917, Q10351991 | Manarola's houses on the cliff over the harbour | No: the Leaning Tower of Pisa shows (drawn) |
| Italy | `dolomites` | IT | Dolomites: 46.61306, 12.16306, Q65028346 | The Tre Cime di Lavaredo's three peaks | Yes (drawn) |
| Jordan | `wadi-rum` | JO | Wadi Rum: 29.5765, 35.41993, Q40729 | The red desert's rock mountains, a Bedouin camp and camels | Yes (drawn) |
| Japan | `fushimi-inari` | JP | Historic Monuments of Ancient Kyoto: 35.06028, 135.75278, Q874027 | Kinkaku-ji's golden pavilion on its pond (or Fushimi Inari's torii) | No: Himeji Castle shows (drawn) |
| Japan | `himeji-castle` | JP | Himeji Castle: 34.83944, 134.69361, Q188754 | Himeji's white castle keep | Yes (drawn) |
| Japan | `itsukushima` | JP | Itsukushima Shrine: 34.29577, 132.32011, Q191763 | The great red torii standing in the sea | Yes (drawn) |
| Japan | `shirakawa-go` | JP | Shirakawa-go and Gokayama: 36.25694, 136.90639, Q877626 | Gassho-zukuri farmhouses' steep thatched roofs | Yes (drawn) |
| Kenya | `lamu` | KE | Lamu Old Town: -2.28444, 40.8525, Q51100199 | Lamu's stone houses and dhows on the waterfront | Yes (drawn) |
| South Korea | `bulguksa` | KR | Seokguram and Bulguksa: 35.76667, 129.33333, Q16912957 | Bulguksa's stone terraces, bridges and pagodas | Yes (drawn) |
| South Korea | `seongsan` | KR | Jeju Volcanic Island: 33.36139, 126.5325, Q495733 | Seongsan Ilchulbong's crater rising from the sea | Yes (drawn) |
| Laos | `luang-prabang` | LA | Luang Prabang: 19.89, 102.13472, Q190165 | Wat Xieng Thong's sweeping roofs, monks in saffron, the Mekong | Yes (drawn) |
| Lebanon | `cedars-of-god` | LB | Qadisha Valley and Cedars of God: 34.28294, 35.95161, Q16946966 | The Cedars of God over the Qadisha valley | Yes (drawn) |
| Sri Lanka | `temple-of-the-tooth` | LK | Sacred City of Kandy: 7.29306, 80.635, Q203197 | The Temple of the Tooth by Kandy's lake | Yes (drawn) |
| Sri Lanka | `galle-fort` | LK | Galle Fort: 6.02139, 80.21861, Q15830652 | Galle's lighthouse and ramparts on the sea | Yes (drawn) |
| Lithuania | `vilnius` | LT | Vilnius Old Town: 54.68333, 25.28333, Q445649 | Vilnius Cathedral and its bell tower, Gediminas Tower on the hill | Yes (drawn) |
| Libya | `ghadames` | LY | Old Town of Ghadamès: 30.132, 9.497, Q105973249 | Ghadamès's whitewashed mud-brick houses and palms | Yes (drawn) |
| Morocco | `ait-benhaddou` | MA | Aït Benhaddou: 31.05, -7.13333, Q309436 | The earthen ksar climbing its hill over the river | Yes (drawn) |
| Morocco | `fez-tanneries` | MA | Medina of Fez: 34.0625, -4.9725, Q2072102 | The Chouara tannery's dye pits in the medina | Yes (drawn) |
| Mali | `djenne` | ML | Old Towns of Djenné: 13.90639, -4.555, Q15278644 | The Great Mosque of Djenné's mud walls and wooden spikes | Yes (drawn) |
| Mexico | `teotihuacan` | MX | Teotihuacan: 19.6925, -98.84389, Q172613 | The Pyramid of the Sun and the Avenue of the Dead | Yes (drawn) |
| Mexico | `palenque` | MX | Palenque: 17.48417, -92.04639, Q181427 | The Temple of the Inscriptions in the jungle | Yes (drawn) |
| Mexico | `xochimilco` | MX | Mexico City Centre and Xochimilco: 19.41833, -99.13278, Q15924695 | Colourful trajineras on Xochimilco's canals | No: Teotihuacan shows (drawn) |
| Mexico | `guanajuato` | MX | Guanajuato: 21.01778, -101.25667, Q61306 | Guanajuato's colourful houses climbing the valley | Yes (drawn) |
| Malaysia | `kinabalu` | MY | Kinabalu Park: 6.15, 116.65, Q834893 | Mount Kinabalu's granite summit over the rainforest | Yes (drawn) |
| Malaysia | `melaka` | MY | Melaka and George Town (Melaka): 2.18889, 102.25111, Q61089 | Melaka's red Christ Church and Stadthuys | Yes (drawn) |
| Namibia | `deadvlei` | NA | Namib Sand Sea: -24.88528, 15.40778, Q65241628 | Deadvlei's dead camel-thorn trees under red dunes | Yes (drawn) |
| Netherlands | `amsterdam-canals` | NL | Amsterdam Canal Ring: 52.36639, 4.88583, Q478707 | Gabled canal houses, a bridge, bicycles and a boat | Yes (drawn) |
| Norway | `geirangerfjord` | NO | West Norwegian Fjords (Geirangerfjord): 62.09444, 7.08056, Q193989 | The fjord, the Seven Sisters falls and a ferry | Yes (drawn) |
| Norway | `urnes-stave-church` | NO | Urnes Stave Church: 61.29806, 7.3225, Q210678 | A dark wooden stave church with carved dragon heads | No: the Geirangerfjord shows (drawn) |
| Nepal | `everest` | NP | Sagarmatha National Park: 27.89107, 86.69303, Q2211959 | Everest and Ama Dablam over Tengboche monastery | Yes (drawn) |
| New Zealand | `tongariro` | NZ | Tongariro National Park: -39.2, 175.58333, Q202845 | Ngauruhoe's cone and the Emerald Lakes | Yes (drawn) |
| Panama | `casco-viejo` | PA | Colonial Transisthmian Route (Casco Viejo): 8.9525, -79.535, Q2945651 | Casco Viejo's old churches and balconies, the skyline across the bay | No: the Panama Canal shows (drawn) |
| Peru | `nazca-lines` | PE | Nazca Lines: -14.6975, -75.135, Q2620036 | The hummingbird geoglyph on the desert, the viewing tower | Yes (drawn) |
| Philippines | `underground-river` | PH | Puerto Princesa Underground River: 10.16667, 118.91667, Q824602 | The river cave's mouth in the limestone cliff, a boat | Yes (drawn) |
| Philippines | `vigan` | PH | Vigan: 17.57472, 120.38694, Q235004 | Vigan's Spanish colonial street and a calesa | Yes (drawn) |
| Pakistan | `lahore-fort` | PK | Lahore Fort and Shalamar Gardens: 31.59028, 74.30972, Q155727 | Lahore Fort's Alamgiri Gate | Yes (drawn) |
| Poland | `krakow` | PL | Historic Centre of Kraków: 50.06209, 19.93688, Q652634 | St Mary's Basilica and the Cloth Hall on the market square | Yes (drawn) |
| Poland | `malbork` | PL | Malbork Castle: 54.03972, 19.02778, Q71279 | The Teutonic brick castle on the river | Yes (drawn) |
| Portugal | `pena-palace` | PT | Sintra: 38.78839, -9.43382, Q3848197 | The Pena Palace's yellow and red towers on its hill | No: the Tower of Belém shows (drawn) |
| Portugal | `porto` | PT | Historic Centre of Porto: 41.14319, -8.61297, Q3848157 | The Ribeira's houses, the Dom Luís I bridge, a rabelo boat | Yes (drawn) |
| Romania | `voronet` | RO | Painted Churches of Moldavia (Voroneț): 47.51704, 25.86416, Q384463 | Voroneț's church painted all over in blue | Yes (drawn) |
| Romania | `sighisoara` | RO | Historic Centre of Sighișoara: 46.21778, 24.79222, Q1075681 | Sighișoara's clock tower and coloured houses | Yes (drawn) |
| Romania | `bran-castle` | RO | Bran Castle: 45.515, 25.3671, Q390275 | Bran Castle on its rock (Dracula's castle) | Yes (drawn) |
| Russia | `kizhi` | RU | Kizhi Pogost: 62.06767, 35.22345, Q477462 | The wooden Church of the Transfiguration's 22 domes | Yes (drawn) |
| Russia | `saint-petersburg` | RU | Historic Centre of Saint Petersburg: 59.93889, 30.31556, Q616578 | The Church of the Savior on Spilled Blood by the canal | Yes (drawn) |
| Russia | `lake-baikal` | RU | Lake Baikal: 53.30278, 108.00472, Q5513 | Baikal's clear ice and shore, the Shaman Rock | Yes (drawn) |
| Russia | `kamchatka` | RU | Volcanoes of Kamchatka (Kronotsky): 54.58, 160.72, Q1789960 | Snow volcanoes, geysers and a brown bear | Yes (drawn) |
| Saudi Arabia | `diriyah` | SA | At-Turaif, Diriyah: 24.73333, 46.57556, Q22687629 | At-Turaif's mud-brick palaces | Yes (drawn) |
| Sudan | `gebel-barkal` | SD | Gebel Barkal: 18.53333, 31.81667, Q15278408 | The sacred mountain and its pyramids | Yes (drawn) |
| Sweden | `visby` | SE | Visby: 57.64167, 18.29583, Q1779992 | Visby's town walls and church ruins | Yes (drawn) |
| Singapore | `botanic-gardens` | SG | Singapore Botanic Gardens: 1.3151, 103.8162, Q3046409 | The Botanic Gardens' bandstand and orchids (or the Merlion: not in the data) | Yes (drawn) |
| Senegal | `saint-louis` | SN | Island of Saint-Louis: 16.02778, -16.50444, Q1114640 | The Faidherbe Bridge and Saint-Louis's colonial houses | Yes (drawn) |
| Syria | `krak-des-chevaliers` | SY | Crac des Chevaliers: 34.75694, 36.29472, Q177549 | The Crusader castle on its ridge | Yes (drawn) |
| Thailand | `sukhothai` | TH | Sukhothai: 17.02111, 99.70361, Q423654 | Wat Mahathat's seated Buddha and lotus-bud stupas | Yes (drawn) |
| Thailand | `grand-palace-bangkok` | TH | Grand Palace: 13.75014, 100.49203, Q873769 | The Grand Palace and Wat Phra Kaew's spires | Yes (drawn) |
| Tunisia | `sidi-bou-said` | TN | Sidi Bou Saïd: 36.86976, 10.34101, Q877391 | White houses with blue doors over the sea | No: Carthage shows (drawn) |
| Tunisia | `carthage` | TN | Carthage: 36.85788, 10.33084, Q52284968 | The Antonine Baths' columns by the sea | Yes (drawn) |
| Turkey | `cappadocia` | TR | Göreme and Cappadocia: 38.66667, 34.85, Q64705367 | Fairy chimneys and hot-air balloons | Yes (drawn) |
| Turkey | `pamukkale` | TR | Hierapolis-Pamukkale: 37.92389, 29.12333, Q15924669 | The white travertine terraces and their pools | Yes (drawn) |
| Turkey | `ephesus` | TR | Ephesus: 37.92917, 27.35944, Q64699469 | The Library of Celsus | Yes (drawn) |
| Tanzania | `serengeti` | TZ | Serengeti National Park: -2.4, 34.6, Q11812902 | The migration's wildebeest and an acacia, a lion on a kopje | Yes (drawn) |
| Tanzania | `stone-town` | TZ | Stone Town of Zanzibar: -6.16494, 39.19879, Q844417 | Stone Town's carved doors, the House of Wonders and dhows | Yes (drawn) |
| Ukraine | `lviv` | UA | Old Town of Lviv: 49.84167, 24.03194, Q2592613 | Lviv's market square and town hall tower | Yes (drawn) |
| United States | `grand-canyon` | US | Grand Canyon National Park: 36.0553, -112.122, Q220289 | The canyon's red layers and the Colorado river | Yes (drawn) |
| United States | `old-faithful` | US | Yellowstone National Park: 44.6, -110.5, Q351 | Old Faithful erupting, a bison | Yes (drawn) |
| United States | `half-dome` | US | Yosemite National Park: 37.7425, -119.5375, Q180402 | Half Dome and El Capitan over the valley, a waterfall | Yes (drawn) |
| United States | `golden-gate-bridge` | US | Golden Gate Bridge: 37.81972, -122.47861, Q44440 | The Golden Gate Bridge in the fog | Yes (drawn) |
| United States | `mount-rushmore` | US | Mount Rushmore: 43.87889, -103.45917, Q83497 | Mount Rushmore's four presidents | Yes (drawn) |
| Uzbekistan | `khiva` | UZ | Itchan Kala: 41.37772, 60.35948, Q535577 | Khiva's walls and the stubby tiled Kalta Minor minaret | Yes (drawn) |
| Uzbekistan | `bukhara` | UZ | Historic Centre of Bukhara: 39.76667, 64.43333, Q29015225 | The Kalyan Minaret and mosque's blue dome | Yes (drawn) |
| Vietnam | `hoi-an` | VN | Hoi An Ancient Town: 15.87714, 108.32863, Q5965459 | The Japanese Covered Bridge and lanterns on the river | Yes (drawn) |
| Vietnam | `hue` | VN | Hue Monuments (Imperial City): 16.46944, 107.57778, Q10769129 | Hue's Meridian Gate and the flag tower | No: Hoi An shows (drawn) |
| Yemen | `shibam` | YE | Old Walled City of Shibam: 15.92694, 48.62667, Q192518 | Shibam's mud-brick tower houses | Yes (drawn) |
| Yemen | `socotra` | YE | Socotra Archipelago: 12.51, 53.92, Q82859 | Dragon's blood trees on Socotra's plateau | Yes (drawn) |
| South Africa | `robben-island` | ZA | Robben Island: -33.805, 18.37, Q192493 | The island's prison and lighthouse, Table Mountain across the bay | No: Table Mountain shows (drawn) |
| South Africa | `drakensberg` | ZA | Maloti-Drakensberg Park: -29.4665, 29.3939, Q6744547 | The Amphitheatre's cliffs and the Tugela falls | Yes (drawn) |
| Zimbabwe | `matobo-hills` | ZW | Matobo Hills: -20.5, 28.5, Q917429 | Balancing granite boulders and rock paintings | Yes (drawn) |

## 3. The next 100 most popular

The next 100 most popular landmarks with no model (24 Nov 2026, the user's wish), most popular first: each landmark's number of Wikipedia language editions (its Wikidata item's sitelinks) weighed by how much travellers visit it, as Wikimedia's page views refused this address that day. Every one is in the landmark data already. The same rule as part 2: where a model's picture would overlap one already on the map, or a more popular one in this list, in the map's opening view, it's drawn all the same with `"onMap": false` ("No"). Here the models already on the map keep their place: 69 of the 100 show, 31 are kept off. After the first 32 were drawn ("(drawn)"), the user asked for buildings, statues and structures rather than lakes and volcanoes: the 26 natural and landscape sites still to draw (coasts, forests, parks, caves, vineyards, a road and a canal) gave way to 26 built ones, from Córdoba's Mezquita and the Leshan Giant Buddha to Monticello and Ouro Preto. All 100 were drawn on 24 Nov 2026 and exported to the maps the same day (the country map e2e test's `NEWEST_MODELS`).

| Country | Model id | Maps | Landmark (name in the data: latitude, longitude, Wikidata) | What to draw | On the map |
| --- | --- | --- | --- | --- | --- |
| Tanzania | `ngorongoro` | TZ | Ngorongoro Conservation Area: -3.21, 35.46, Q1217726 | The crater's green floor inside its walls, a soda lake pink with flamingos, zebras and a Maasai herder | Yes (drawn) |
| China | `summer-palace` | CN | Summer Palace: 39.9975, 116.2689, Q4132 | Longevity Hill's Tower of Buddhist Incense over Kunming Lake, the Seventeen-Arch Bridge and the Marble Boat | No: the Great Wall shows (drawn) |
| China | `zhangjiajie` | CN | Wulingyuan (Zhangjiajie): 29.34556, 110.46667, Q4187 | Sandstone pillars rising out of the mist with pines on their tops | Yes (drawn) |
| India | `agra-fort` | IN | Agra Fort: 27.17958, 78.0213, Q171857 | The red sandstone walls and the Amar Singh Gate, white marble palaces inside | No: the Taj Mahal shows (drawn) |
| Japan | `nara` | JP | Historic Monuments of Ancient Nara: 34.67556, 135.83944, Q1055749 | Tōdai-ji's great hall with its golden ridge horns, deer on the lawn | No: Himeji Castle shows (drawn) |
| United States | `great-smoky-mountains` | US | Great Smoky Mountains National Park: 35.61111, -83.425, Q464004 | Blue ridges in a smoky haze, a log cabin and a black bear | Yes (drawn) |
| Palestine | `western-wall` | PS | Western Wall: 31.77695, 35.23425, Q134821 | The Western Wall's great stones, the Dome of the Rock's gold dome above it | Yes (drawn) |
| India | `fatehpur-sikri` | IN | Fatehpur Sikri: 27.09111, 77.66111, Q179046 | The Buland Darwaza gateway up its steps and the Panch Mahal's five storeys of columns | No: the Taj Mahal shows (drawn) |
| Japan | `hiroshima-peace-memorial` | JP | Hiroshima Peace Memorial: 34.39556, 132.45361, Q231140 | The A-Bomb Dome's ruined shell and bare dome frame by the river | No: Itsukushima Shrine shows (drawn) |
| United States | `everglades` | US | Everglades National Park: 25.3125, -80.6875, Q274131 | Sawgrass and mangroves in the water, an alligator and an airboat | Yes (drawn) |
| Netherlands | `rijksmuseum` | NL | Rijksmuseum: 52.36, 4.88528, Q190804 | The red-brick museum's towers and the arched passage through it, bicycles | No: Amsterdam's canals shows (drawn) |
| China | `huangshan` | CN | Mount Huangshan: 30.125, 118.16667, Q36034 | Granite peaks over a sea of clouds, the Welcoming Guest Pine | Yes (drawn) |
| India | `humayuns-tomb` | IN | Humayun's Tomb: 28.59326, 77.2506, Q189648 | The red and white tomb with its marble dome in its four-part garden | No: the Red Fort shows (drawn) |
| Germany | `museum-island` | DE | Museum Island: 52.52139, 13.39556, Q151963 | The Bode Museum's dome on the island's tip, the Altes Museum's columns, the Spree | No: the Brandenburg Gate shows (drawn) |
| United Kingdom | `lake-district` | GB, XE | Lake District: 54.5, -3.16667, Q211778 | A lake among the fells, dry-stone walls, Herdwick sheep and a stone cottage | Yes (drawn) |
| Turkey | `troy` | TR | Troy: 39.9575, 26.23889, Q22647 | The wooden horse beside Troy's ruined walls | Yes (drawn) |
| Greece | `olympia` | GR | Olympia: 37.63833, 21.63, Q38888 | The Temple of Hera's columns and the stadium's arched entrance, olive trees | Yes (drawn) |
| India | `ellora` | IN | Ellora Caves: 20.02639, 75.17917, Q189616 | The Kailasa Temple carved down into the rock | Yes (drawn) |
| China | `jiuzhaigou` | CN | Jiuzhaigou Valley: 33.2, 103.9, Q4111 | Turquoise lakes stepping down over travertine, waterfalls and autumn trees | Yes (drawn) |
| Egypt | `historic-cairo` | EG | Historic Cairo: 30.046, 31.2627, Q1100964 | The Citadel's Muhammad Ali Mosque, its domes and pencil minarets | No: the Pyramids of Giza shows (drawn) |
| United Kingdom | `hadrians-wall` | GB, XE | Frontiers of the Roman Empire (Hadrian's Wall): 55.02417, -2.2925, Q57357 | The wall rolling over the crags at Sycamore Gap, a milecastle | Yes (drawn) |
| Italy | `agrigento` | IT | Valley of the Temples, Agrigento: 37.28972, 13.59, Q636774 | The Temple of Concordia among almond trees | Yes (drawn) |
| United States | `mesa-verde` | US | Mesa Verde National Park: 37.26038, -108.49444, Q237128 | Cliff Palace's stone rooms and round towers in their alcove under the mesa | Yes (drawn) |
| Germany | `sanssouci` | DE | Palaces and Parks of Potsdam: 52.4, 13.03333, Q852427 | Sanssouci's yellow palace on top of its vineyard terraces | No: the Brandenburg Gate shows (drawn) |
| Greece | `knossos` | GR | Minoan Palaces (Knossos): 35.29796, 25.16316, Q173527 | The north entrance's red columns and charging-bull fresco | Yes (drawn) |
| India | `ajanta` | IN | Ajanta Caves: 20.55342, 75.70047, Q184427 | The horseshoe of carved cave fronts round the gorge above the river | No: the Ellora Caves shows (drawn) |
| Italy | `stromboli` | IT | Aeolian Islands: 38.49667, 14.93583, Q179883 | Stromboli's cone puffing smoke over the sea, a white village at its foot | Yes (drawn) |
| Vietnam | `trang-an` | VN | Trang An Landscape Complex: 20.2557, 105.9156, Q10810559 | Limestone karsts over the river, a rowing boat going into a cave | Yes (drawn) |
| France | `chartres` | FR | Chartres Cathedral: 48.44778, 1.48778, Q180274 | The cathedral's two different spires over the wheat fields | Yes (drawn) |
| United States | `hawaii-volcanoes` | US | Hawaii Volcanoes National Park: 19.40083, -155.12361, Q205952 | Kīlauea's crater glowing with lava, a flow steaming into the sea | Yes (drawn) |
| India | `konark` | IN | Konark Sun Temple: 19.88744, 86.0946, Q752091 | The temple as the sun god's chariot, its carved stone wheels and horses | Yes (drawn) |
| China | `mogao-caves` | CN | Mogao Caves: 40.03722, 94.80417, Q43286 | The nine-storey red pagoda front in the cliff of caves, sand dunes | Yes (drawn) |
| United Kingdom | `kew-gardens` | GB, XE | Kew Gardens: 51.47869, -0.29561, Q18748726 | The Palm House's white glass curves, the Pagoda behind | No: Big Ben shows (drawn) |
| Spain | `cordoba-mezquita` | ES | Historic Centre of Córdoba: 37.87919, -4.77972, Q10749904 | The Mezquita's forest of red and white striped arches under its roofs, the bell tower | Yes (drawn) |
| India | `amber-fort` | IN | Hill Forts of Rajasthan (Amber Fort): 26.9859, 75.8507, Q456817 | Amber Fort's honey-coloured walls over Maota Lake, an elephant | No: the Hawa Mahal shows (drawn) |
| China | `leshan-buddha` | CN | Mount Emei and Leshan Giant Buddha: 29.5449, 103.76925, Q16914686 | The Giant Buddha seated in the red cliff over the meeting rivers, a boat below | Yes (drawn) |
| United States | `independence-hall` | US | Independence Hall: 39.94889, -75.15, Q390028 | The red-brick hall and its white clock tower, the Liberty Bell in front | No: the Statue of Liberty shows (drawn) |
| France | `reims` | FR | Reims Cathedral: 49.25333, 4.03278, Q16912637 | The cathedral's west front, its twin towers, rose window and three deep portals | Yes (drawn) |
| Iran | `golestan` | IR | Golestan Palace: 35.67972, 51.42028, Q210610 | The tiled palace front and its long pool, the Shams-ol-Emareh's towers | Yes (drawn) |
| France | `avignon` | FR | Historic Centre of Avignon: 43.95278, 4.80611, Q15241016 | The Papal Palace's great towers, the broken Pont d'Avignon on the Rhône | No: the Pont du Gard shows (drawn) |
| Iraq | `samarra` | IQ | Samarra: 34.1959, 43.88568, Q170047 | The Malwiya's spiral minaret | Yes (drawn) |
| Italy | `verona-arena` | IT | City of Verona: 45.43861, 10.99389, Q3678423 | The Roman Arena's arches round its oval, a corner of its outer ring still standing | Yes (drawn) |
| Turkey | `gobekli-tepe` | TR | Göbekli Tepe: 37.22306, 38.9225, Q214944 | The circles of carved T-shaped pillars under their shelter | Yes (drawn) |
| Italy | `siena` | IT | Historic Centre of Siena: 43.31861, 11.33167, Q17163322 | The shell-shaped Piazza del Campo, the Palazzo Pubblico and its tall Torre del Mangia | No: the Leaning Tower of Pisa shows (drawn) |
| India | `mahabodhi` | IN | Mahabodhi Temple, Bodh Gaya: 24.696, 84.99136, Q4513 | The temple's pyramid tower and the Bodhi tree beside it | Yes (drawn) |
| Spain | `toledo` | ES | Historic City of Toledo: 39.8569, -4.02461, Q17255635 | The Alcázar's square towers and the cathedral's spire on the hill in the Tagus's bend | Yes (drawn) |
| Nepal | `lumbini` | NP | Lumbini: 27.4814, 83.27583, Q9213 | The white Maya Devi Temple by the sacred pool, the Ashoka pillar, prayer flags | Yes (drawn) |
| France | `strasbourg` | FR | Strasbourg Grande-Île and Neustadt: 48.58444, 7.74889, Q55523908 | The cathedral's pink sandstone front and single spire over half-timbered Petite France | Yes (drawn) |
| Italy | `last-supper` | IT | Santa Maria delle Grazie (The Last Supper): 45.46583, 9.17111, Q244952 | The church's brick dome and cloister, the Last Supper on a wall opened to show it | Yes (drawn) |
| Italy | `san-gimignano` | IT | San Gimignano: 43.46706, 11.0428, Q9724840 | The medieval stone towers rising over the hill town | No: the Leaning Tower of Pisa shows (drawn) |
| Germany | `bamberg` | DE | Bamberg Old Town: 49.89167, 10.89167, Q3936 | The Old Town Hall standing in the river on its bridge, half-timbered | Yes (drawn) |
| Italy | `assisi` | IT | Assisi: 43.06617, 12.62244, Q16913154 | The Basilica of St Francis on its arcaded terraces over the hillside | Yes (drawn) |
| United Kingdom | `blenheim` | GB, XE | Blenheim Palace: 51.84136, -1.36095, Q208181 | The baroque palace's columned front and towers round the great court | Yes (drawn) |
| Italy | `matera` | IT | Sassi of Matera: 40.66639, 16.61028, Q55739617 | The cave houses climbing the ravine, the cathedral's bell tower on top | No: the Trulli of Alberobello shows (drawn) |
| Russia | `kazan-kremlin` | RU | Kazan Kremlin: 55.79744, 49.10724, Q603622 | The Qolşärif Mosque's blue domes and minarets, the leaning Söyembikä Tower | Yes (drawn) |
| Spain | `santiago-cathedral` | ES | Old Town of Santiago de Compostela: 42.88076, -8.54468, Q12386144 | The cathedral's baroque Obradoiro front and its two towers over the square, pilgrims | Yes (drawn) |
| Japan | `nikko` | JP | Shrines and Temples of Nikkō: 36.7475, 139.61056, Q1063133 | The Yōmeimon gate's white and gold among cedars, the red Shinkyō bridge | Yes (drawn) |
| Turkey | `mount-nemrut` | TR | Mount Nemrut: 37.98074, 38.74083, Q207917 | The colossal stone heads of kings and gods at the foot of the summit's mound | Yes (drawn) |
| India | `cst-mumbai` | IN | Chhatrapati Shivaji Terminus: 18.9398, 72.8355, Q235884 | The Gothic station's domes, turrets and arches | Yes (drawn) |
| India | `khajuraho` | IN | Khajuraho: 24.85, 79.93333, Q167298 | The Kandariya Mahadeva temple's rising carved towers on their platform | Yes (drawn) |
| Sri Lanka | `polonnaruwa` | LK | Polonnaruwa: 7.93333, 81, Q394443 | The Gal Vihara's reclining Buddha carved in the granite | No: Sigiriya shows (drawn) |
| China | `longmen` | CN | Longmen Grottoes: 34.55556, 112.46972, Q273834 | The great seated Vairocana Buddha and his attendants carved in the cliff by the river | Yes (drawn) |
| Italy | `villa-deste` | IT | Villa d'Este: 41.9625, 12.79611, Q746063 | The terraced gardens' fountains, the Organ Fountain and the Hundred Fountains | No: the Colosseum shows (drawn) |
| Italy | `caserta` | IT | Royal Palace of Caserta: 41.07333, 14.32639, Q16962666 | The palace's long front and the Grand Cascade's fountains down the park | No: Pompeii shows (drawn) |
| France | `fontainebleau` | FR | Palace of Fontainebleau: 48.40222, 2.70056, Q201428 | The horseshoe staircase in the White Horse Courtyard | No: the Eiffel Tower shows (drawn) |
| Peru | `cusco` | PE | Historic Centre of Cusco: -13.51833, -71.97806, Q28502997 | The cathedral and the Compañía church round the Plaza de Armas, an Inca wall in front | No: Machu Picchu shows (drawn) |
| Ireland | `newgrange` | IE | Brú na Bóinne: 53.69284, -6.44932, Q339489 | Newgrange's white quartz-walled mound and carved entrance stone | Yes (drawn) |
| United Kingdom | `durham` | GB, XE | Durham Castle and Cathedral: 54.77472, -1.57611, Q15732525 | The cathedral's three towers and the castle on their wooded hill over the river's loop | No: Hadrian's Wall shows (drawn) |
| China | `suzhou-gardens` | CN | Classical Gardens of Suzhou: 31.32667, 120.62556, Q1144337 | A garden's pond with a zigzag bridge, a pavilion with upturned eaves and a Taihu rock | Yes (drawn) |
| Germany | `wurzburg` | DE | Würzburg Residence: 49.79278, 9.93889, Q64822967 | The Residence's long baroque front round its court, the formal garden | Yes (drawn) |
| Greece | `delos` | GR | Delos: 37.39111, 25.27111, Q173148 | The Terrace of the Lions on the bare island | Yes (drawn) |
| Germany | `porta-nigra` | DE | Roman Monuments of Trier: 49.75, 6.63306, Q279968 | The Porta Nigra, the black stone Roman gate with its rows of arches | Yes (drawn) |
| Israel | `acre` | IL | Old City of Acre: 32.92611, 35.08389, Q126084 | The sea walls, the Al-Jazzar Mosque's green dome and the harbour | Yes (drawn) |
| Spain | `avila` | ES | Old Town of Ávila: 40.65639, -4.70011, Q15839120 | The medieval walls with their round towers all round the town, the cathedral inside | No: the Aqueduct of Segovia shows (drawn) |
| Austria | `wachau` | AT | Wachau: 48.36444, 15.43417, Q192201 | Melk Abbey's yellow baroque towers over the Danube, vineyards | Yes (drawn) |
| Spain | `cuenca-hanging-houses` | ES | Historic Walled Town of Cuenca: 40.0766, -2.13175, Q15965460 | The hanging houses' wooden balconies over the gorge, the San Pablo bridge | Yes (drawn) |
| Iran | `jameh-isfahan` | IR | Jameh Mosque of Isfahan: 32.66972, 51.68528, Q1256501 | The courtyard's four iwans in blue tiles round the pool, the domes | No: Naqsh-e Jahan Square shows (drawn) |
| Germany | `bremen-roland` | DE | Bremen Town Hall and Roland: 53.07597, 8.80747, Q15238169 | The Roland statue with his sword and shield before the Town Hall's gabled front | Yes (drawn) |
| Lebanon | `byblos` | LB | Byblos: 34.11667, 35.65, Q173532 | The Crusader castle over the old harbour | Yes (drawn) |
| United States | `monticello` | US | Monticello and University of Virginia: 38.03278, -78.50389, Q15830656 | Jefferson's Monticello, its red brick front, white portico and octagonal dome | Yes (drawn) |
| United States | `fallingwater` | US | Frank Lloyd Wright Buildings (Fallingwater): 39.90639, -79.46806, Q463179 | Fallingwater's cream terraces over the waterfall in the woods | Yes (drawn) |
| India | `shore-temple` | IN | Mahabalipuram: 12.61667, 80.19167, Q3522747 | The Shore Temple's two granite towers by the sea, the Nandi bulls along its wall | Yes (drawn) |
| Morocco | `volubilis` | MA | Volubilis: 34.03996, -5.56269, Q391215 | The Roman basilica's columns and triumphal arch on the plain | No: the Chouara Tannery shows (drawn) |
| Brazil | `ouro-preto` | BR | Ouro Preto: -20.38577, -43.50364, Q3845692 | The church of São Francisco de Assis's round towers over the colonial town's hills | Yes (drawn) |
| China | `fujian-tulou` | CN | Fujian Tulou: 24.6587, 116.975, Q718001 | Round earth houses under tiled roofs, one cut open to show its rings of rooms | Yes (drawn) |
| Vietnam | `my-son` | VN | My Son Sanctuary: 15.76324, 108.12445, Q391406 | Red-brick Cham temple towers in the jungle | No: Hoi An shows (drawn) |
| Sri Lanka | `dambulla` | LK | Dambulla Cave Temple: 7.85656, 80.64834, Q45690 | The cave temple's white front under the great rock, a golden Buddha | No: Sigiriya shows (drawn) |
| Russia | `sergiev-posad` | RU | Trinity Lavra of St Sergius: 56.31035, 38.13065, Q211962 | The Assumption Cathedral's blue domes with gold stars, the tall bell tower | No: Saint Basil's Cathedral shows (drawn) |
| Turkey | `selimiye` | TR | Selimiye Mosque: 41.67806, 26.55944, Q184534 | Sinan's great dome and its four slender minarets | Yes (drawn) |
| United Kingdom | `skara-brae` | GB, XC | Heart of Neolithic Orkney: 58.9975, -3.215, Q1334966 | The Ring of Brodgar's standing stones, Skara Brae's stone houses | Yes (drawn) |
| Japan | `hashima` | JP | Meiji Industrial Sites (Hashima): 32.62778, 129.73833, Q285468 | Battleship Island: its sea wall and concrete blocks crowded on the rock | Yes (drawn) |
| China | `macao` | CN | Historic Centre of Macao: 22.191, 113.536, Q2601433 | The Ruins of St. Paul's façade at the top of its great stairway | Yes (drawn) |
| Poland | `warsaw` | PL | Historic Centre of Warsaw: 52.24972, 21.01222, Q1139084 | The Old Town Market Square's coloured houses, the Royal Castle's clock tower | Yes (drawn) |
| South Korea | `hwaseong` | KR | Hwaseong Fortress: 37.28073, 127.0102, Q482423 | The fortress walls and a gate under its tiled roof | No: Gyeongbokgung shows (drawn) |
| Peru | `chan-chan` | PE | Chan Chan: -8.11056, -79.075, Q277540 | The adobe city's walls with their fish and bird friezes | Yes (drawn) |
| Germany | `aachen-cathedral` | DE | Aachen Cathedral: 50.77475, 6.08392, Q5908 | Charlemagne's octagon and its dome, the tall glass choir | Yes (drawn) |
| Spain | `burgos-cathedral` | ES | Burgos Cathedral: 42.34081, -3.70447, Q744420 | The cathedral's lacy Gothic spires | Yes (drawn) |
| Germany | `wartburg` | DE | Wartburg Castle: 50.96611, 10.30639, Q151545 | The castle on its wooded hill, the half-timbered courtyard and the keep | Yes (drawn) |
| Tunisia | `kairouan` | TN | Kairouan: 35.68333, 10.1, Q179570 | The Great Mosque's square minaret over its courtyard | Yes (drawn) |
| Canada | `rideau-canal` | CA | Rideau Canal: 45.42639, -75.69805, Q651323 | The canal's flight of locks below Parliament Hill | Yes (drawn) |

## 4. The next 100: buildings, statues and structures

The next 100 (24 Nov 2026, the user's wish), buildings, statues and structures only, most famous first: chosen by judgement from the landmarks with no model, as Wikidata's language-edition counts failed for many of the best known (Canterbury Cathedral, El Escorial, Pergamon) and rank UNESCO's listing items above the places. Where a city already has a model, this one draws another of its landmarks (Notre-Dame for Paris's Seine banks, the Pantheon for Rome's centre, St. Stephen's for Vienna's). The same overlap rule as parts 2 and 3: the models already on the map keep their place, and 69 of the 100 show, 31 are kept off. All 100 were drawn on 24 Nov 2026 and exported to the maps the same day (`NEWEST_MODELS` too).

| Country | Model id | Maps | Landmark (name in the data: latitude, longitude, Wikidata) | What to draw | On the map |
| --- | --- | --- | --- | --- | --- |
| France | `notre-dame` | FR | Paris, Banks of the Seine: 48.85, 2.35889, Q2233532 | Notre-Dame's west front with its two square towers and rose window, the spire and flying buttresses, on its island in the Seine | No: the Eiffel Tower shows (drawn) |
| Italy | `pantheon` | IT | Historic Centre of Rome: 41.8928, 12.4866, Q18448486 | The Pantheon's portico of granite columns under its pediment, the great dome behind, the obelisk fountain in the piazza | No: the Colosseum shows (drawn) |
| Czechia | `charles-bridge` | CZ | Historic Centre of Prague: 50, 14.56, Q64637410 | The Charles Bridge's stone arches over the Vltava lined with statues, the Gothic bridge tower at its end | No: Prague Castle shows (drawn) |
| Austria | `st-stephens` | AT | Historic Centre of Vienna: 48.2084, 16.3722, Q11288310 | St. Stephen's Cathedral's tall Gothic spire and its steep roof patterned in coloured tiles | No: Schönbrunn Palace shows (drawn) |
| United Kingdom | `canterbury-cathedral` | GB, XE | Canterbury Cathedral: 51.28, 1.08333, Q15924897 | The cathedral's Bell Harry Tower over the long Gothic nave, the west towers, the precinct's lawn | Yes (drawn) |
| United Kingdom | `greenwich` | GB, XE | Maritime Greenwich: 51.47778, 0, Q16921416 | The Royal Observatory's domes on the hill above the Queen's House, the Cutty Sark's masts | No: Big Ben shows (drawn) |
| United States | `alamo` | US | San Antonio Missions: 29.3281, -98.46, Q10498483 | The Alamo's stone chapel with its curved parapet front, live oaks | Yes (drawn) |
| Spain | `el-escorial` | ES | El Escorial: 40.58917, -4.14778, Q5821857 | The vast grey granite monastery-palace, its corner towers and the basilica's dome | No: the Aqueduct of Segovia shows (drawn) |
| Spain | `cibeles` | ES | Paseo del Prado and Buen Retiro: 40.41414, -3.68653, Q107675480 | The Cibeles Fountain, the goddess in her chariot drawn by lions, the Palacio de Cibeles behind | No: the Aqueduct of Segovia shows (drawn) |
| Spain | `palau-de-la-musica` | ES | Palau de la Música and Sant Pau: 41.38778, 2.175, Q64955212 | The Palau de la Música Catalana's modernista front with its mosaic columns and corner sculpture | No: the Sagrada Família shows (drawn) |
| Turkey | `pergamon` | TR | Pergamon: 39.12583, 27.18, Q64705007 | The steep theatre cut into the acropolis hill, the Temple of Trajan's white columns above it | Yes (drawn) |
| Iraq | `babylon` | IQ | Babylon: 32.54178, 44.43164, Q100329356 | The blue glazed Ishtar Gate with its yellow bulls and dragons, mud-brick walls | Yes (drawn) |
| China | `wild-goose-pagoda` | CN | Silk Roads (Giant Wild Goose Pagoda): 34.21977, 108.95933, Q1047061 | The Giant Wild Goose Pagoda's seven square brick storeys | No: the Terracotta Army shows (drawn) |
| China | `west-lake` | CN | West Lake, Hangzhou: 30.2375, 120.14083, Q15660376 | The Leifeng Pagoda on its hill over West Lake, the Broken Bridge and a boat | No: the Classical Gardens of Suzhou shows (drawn) |
| China | `shaolin` | CN | Historic Monuments of Dengfeng: 34.45875, 113.06772, Q5934942 | Shaolin Temple's gate and halls, the Pagoda Forest's stone pagodas | No: the Longmen Grottoes shows (drawn) |
| China | `pingyao` | CN | Ancient City of Pingyao: 37.2014, 112.1544, Q65965285 | The city wall with its gate tower and the Market Building over the main street | Yes (drawn) |
| China | `lijiang` | CN | Old Town of Lijiang: 26.8667, 100.2333, Q65964838 | The old town's dark-tiled roofs and canals, the Wangu Pavilion, the snowy Jade Dragon mountain behind | Yes (drawn) |
| Egypt | `st-catherines` | EG | Saint Catherine Area: 28.55623, 33.97543, Q2468771 | St Catherine's Monastery's fortress walls and basilica at the foot of Mount Sinai | Yes (drawn) |
| Greece | `rhodes` | GR | Medieval City of Rhodes: 36.44306, 28.22694, Q876685 | The Palace of the Grand Master behind the knights' walls | Yes (drawn) |
| Germany | `holstentor` | DE | Lübeck: 53.86667, 10.69167, Q15813909 | The Holstentor's two round brick towers under their conical roofs | Yes (drawn) |
| Germany | `speicherstadt` | DE | Speicherstadt and Chilehaus: 53.54333, 9.99194, Q20644172 | The red-brick warehouses along the canals with their turrets and gables | Yes (drawn) |
| Italy | `hadrians-villa` | IT | Hadrian's Villa: 41.94194, 12.77528, Q272777 | The Canopus: the long pool lined with columns and statues | No: the Colosseum shows (drawn) |
| Italy | `castel-nuovo` | IT | Historic Centre of Naples: 40.85139, 14.26278, Q832957 | Castel Nuovo's round grey towers and white triumphal arch, Vesuvius behind | No: Pompeii shows (drawn) |
| Syria | `aleppo-citadel` | SY | Ancient City of Aleppo: 36.18333, 37.15, Q4115349 | The Citadel of Aleppo on its mound, the glacis and the bridge up to the gate | Yes (drawn) |
| Iraq | `ziggurat-of-ur` | IQ | Ahwar of Southern Iraq (Ur): 30.96222, 46.10444, Q5699 | The Ziggurat of Ur's stepped brick terraces and its three stairways | Yes (drawn) |
| Ethiopia | `aksum` | ET | Aksum: 14.13019, 38.71861, Q107183452 | The tall carved granite stelae of Aksum's stelae field | Yes (drawn) |
| Greece | `mount-athos` | GR | Mount Athos: 40.15833, 24.32722, Q136100444 | A monastery on its cliff above the sea, the Holy Mountain's peak behind | Yes (drawn) |
| Morocco | `hassan-tower` | MA | Rabat, Modern Capital and Historic City: 34.0242, -6.8228, Q65926560 | The unfinished Hassan Tower and its rows of column stumps, the Mausoleum of Mohammed V | Yes (drawn) |
| Morocco | `bab-mansour` | MA | Historic City of Meknes: 33.89486, -5.56448, Q12352436 | Bab Mansour's great gate in green and white zellij tiles | No: the Chouara Tannery shows (drawn) |
| Morocco | `essaouira` | MA | Medina of Essaouira: 31.51441, -9.7689, Q11858823 | The Skala's sea ramparts with their bronze cannons, the blue fishing boats | Yes (drawn) |
| India | `jantar-mantar` | IN | Jantar Mantar, Jaipur: 26.92472, 75.825, Q508634 | The observatory's giant sundial and stone instruments | No: the Hawa Mahal shows (drawn) |
| India | `sanchi` | IN | Sanchi: 23.47944, 77.73972, Q181123 | The Great Stupa's dome with its carved stone gateways | Yes (drawn) |
| India | `darjeeling-railway` | IN | Mountain Railways of India (Darjeeling): 27.045, 88.26722, Q463874 | The little blue steam train of the Darjeeling Himalayan Railway looping through the tea gardens | Yes (drawn) |
| Australia | `royal-exhibition-building` | AU | Royal Exhibition Building: -37.80611, 144.97028, Q15278460 | The Royal Exhibition Building's dome and great hall, the fountain in the Carlton Gardens | Yes (drawn) |
| Czechia | `kutna-hora` | CZ | Kutná Hora: 49.95, 15.26667, Q17117941 | St Barbara's Church's tent-roofed spires and flying buttresses | Yes (drawn) |
| Germany | `schwerin-castle` | DE | Schwerin Residence Ensemble: 53.62417, 11.41889, Q47037432 | Schwerin Castle's golden domes and turrets on its island in the lake | No: Lübeck's Holstentor shows (drawn) |
| Germany | `hercules-kassel` | DE | Bergpark Wilhelmshöhe: 51.3167, 9.4, Q447441 | The Hercules statue on its octagon above the cascades | Yes (drawn) |
| Germany | `regensburg` | DE | Old Town of Regensburg: 49.01722, 12.09694, Q1246833 | The Stone Bridge over the Danube, the cathedral's twin spires | Yes (drawn) |
| Germany | `quedlinburg` | DE | Quedlinburg: 51.78333, 11.15, Q10300241 | The half-timbered houses below the castle hill and its church | Yes (drawn) |
| Germany | `speyer-cathedral` | DE | Speyer Cathedral: 49.31722, 8.4425, Q22720 | Speyer Cathedral's Romanesque towers and domes | Yes (drawn) |
| France | `amiens-cathedral` | FR | Amiens Cathedral: 49.89457, 2.3021, Q106934 | Amiens Cathedral's Gothic west front and slender spire | Yes (drawn) |
| France | `fourviere` | FR | Historic Site of Lyon: 45.76306, 4.82806, Q8399 | The Basilica of Notre-Dame de Fourvière's white towers on its hill over the old town | Yes (drawn) |
| France | `arles-arena` | FR | Arles Roman and Romanesque Monuments: 43.67764, 4.63069, Q1279597 | The Roman arena's two storeys of arches and its medieval towers | No: the Pont du Gard shows (drawn) |
| France | `orange-theatre` | FR | Roman Theatre of Orange: 44.13572, 4.80842, Q15726321 | The Roman theatre's great stage wall with Augustus' statue | No: the Pont du Gard shows (drawn) |
| France | `carnac` | FR | Megaliths of Carnac: 47.61611, -3.08722, Q135287050 | The long rows of standing stones | Yes (drawn) |
| France | `place-stanislas` | FR | Place Stanislas, Nancy: 48.69361, 6.18333, Q15728409 | Place Stanislas' gilded wrought-iron gates and fountains before the town hall | Yes (drawn) |
| France | `albi` | FR | Episcopal City of Albi: 43.9283, 2.1425, Q1778266 | Albi Cathedral's fortress of red brick and its tall tower, the Pont Vieux | Yes (drawn) |
| France | `saint-emilion` | FR | Saint-Émilion: 44.89472, 0.15528, Q2987951 | The monolithic church's bell tower over the village's roofs and vineyards | Yes (drawn) |
| France | `villa-savoye` | FR | Le Corbusier's Architecture (Villa Savoye): 48.92444, 2.02833, Q940746 | Villa Savoye's white box on its thin pilotis, the ribbon windows | No: the Eiffel Tower shows (drawn) |
| Italy | `castel-del-monte` | IT | Castel del Monte: 41.08475, 16.27093, Q215897 | Castel del Monte's octagon with its eight octagonal towers on its hill | Yes (drawn) |
| Italy | `ferrara` | IT | Ferrara and the Po Delta: 44.83778, 11.61944, Q16735627 | Castello Estense's moated brick castle with its four towers | No: Venice shows (drawn) |
| Italy | `urbino` | IT | Historic Centre of Urbino: 43.725, 12.63333, Q17163308 | The Ducal Palace's twin turreted towers over the hillside | No: the Basilica of St Francis shows (drawn) |
| Italy | `noto` | IT | Baroque Towns of Val di Noto (Noto): 36.88333, 15.08333, Q487174 | Noto Cathedral's honey-coloured baroque front at the top of its steps | Yes (drawn) |
| Spain | `tower-of-hercules` | ES | Tower of Hercules: 43.38583, -8.40639, Q245151 | The Roman lighthouse's square tower on its headland over the Atlantic | No: Santiago de Compostela Cathedral shows (drawn) |
| Spain | `vizcaya-bridge` | ES | Vizcaya Bridge: 43.32306, -3.01694, Q331996 | The transporter bridge's iron towers and its hanging gondola over the river | Yes (drawn) |
| Spain | `merida-theatre` | ES | Mérida Archaeological Ensemble: 38.91597, -6.33869, Q15233334 | The Roman theatre's two storeys of columns behind the stage | Yes (drawn) |
| Spain | `tarraco` | ES | Tarraco: 41.11472, 1.25931, Q3119914 | The Roman amphitheatre by the sea | Yes (drawn) |
| Portugal | `coimbra` | PT | University of Coimbra: 40.20781, -8.42577, Q15229957 | The university's clock tower over the Paço das Escolas | Yes (drawn) |
| Portugal | `evora` | PT | Historic Centre of Évora: 38.57306, -7.90778, Q8343770 | The Roman Temple of Évora's Corinthian columns | Yes (drawn) |
| Portugal | `batalha` | PT | Batalha Monastery: 39.65917, -8.82611, Q174779 | Batalha Monastery's lacy Gothic church and the Unfinished Chapels | Yes (drawn) |
| Portugal | `tomar` | PT | Convent of Christ, Tomar: 39.60364, -8.41926, Q736692 | The Convent of Christ's round Templar church inside the castle walls | No: Batalha Monastery shows (drawn) |
| Austria | `graz-clock-tower` | AT | Graz Old Town and Schloss Eggenberg: 47.07417, 15.39167, Q2326418 | The Clock Tower on the Schlossberg over the red roofs | Yes (drawn) |
| Russia | `novodevichy` | RU | Novodevichy Convent: 55.72597, 37.55658, Q270725 | The convent's red and white walls, the gold-domed cathedral and the bell tower by the pond | No: Saint Basil's Cathedral shows (drawn) |
| Russia | `kolomenskoye` | RU | Church of the Ascension, Kolomenskoye: 55.66722, 37.67083, Q220951 | The white tent-roofed Church of the Ascension over the Moskva | No: Saint Basil's Cathedral shows (drawn) |
| Georgia | `mtskheta` | GE | Historical Monuments of Mtskheta: 41.84389, 44.71639, Q16946829 | Jvari Monastery on its hill over the meeting of the rivers, Svetitskhoveli below | Yes (drawn) |
| Armenia | `echmiatsin` | AM | Echmiatsin and Zvartnots: 40.15931, 44.29514, Q22026170 | Etchmiadzin Cathedral's conical domes and its bell tower | Yes (drawn) |
| Azerbaijan | `sheki` | AZ | Historic Centre of Sheki: 41.19194, 47.17056, Q106762537 | The Palace of the Shaki Khans' painted front and coloured glass windows | Yes (drawn) |
| Syria | `bosra` | SY | Ancient City of Bosra: 32.51806, 36.48167, Q15727412 | The Roman theatre inside its Arab citadel | Yes (drawn) |
| Greece | `patmos` | GR | Patmos Chorá and Monastery of St John: 37.3, 26.55, Q17132271 | The Monastery of St John's fortress walls over the white houses of the Chora | Yes (drawn) |
| Turkey | `hattusa` | TR | Hattusha: 40.01389, 34.62056, Q64699502 | The Lion Gate in the Hittite city walls | Yes (drawn) |
| Turkey | `aphrodisias` | TR | Aphrodisias: 37.70833, 28.72361, Q64699201 | The Tetrapylon's carved columns and pediments | No: Pamukkale shows (drawn) |
| Turkey | `safranbolu` | TR | Safranbolu: 41.26, 32.68972, Q64705254 | The Ottoman timber-framed houses on the hillside | Yes (drawn) |
| Poland | `torun` | PL | Medieval Town of Toruń: 53.01028, 18.60472, Q9390606 | The Gothic Old Town Hall and Copernicus' statue | Yes (drawn) |
| Poland | `centennial-hall` | PL | Centennial Hall, Wrocław: 51.10694, 17.07722, Q155743 | Centennial Hall's ribbed concrete dome and the pergola | Yes (drawn) |
| Romania | `endless-column` | RO | Brâncuși Ensemble, Târgu Jiu: 45.03743, 23.28537, Q4680630 | Brâncuși's Endless Column | Yes (drawn) |
| Romania | `biertan` | RO | Fortified Churches of Transylvania (Biertan): 46.1352, 24.5213, Q16743875 | The fortified church on its hill inside its rings of walls and towers | No: Sighișoara shows (drawn) |
| Denmark | `roskilde` | DK | Roskilde Cathedral: 55.64267, 12.08031, Q209705 | Roskilde Cathedral's red-brick body and twin spires | Yes (drawn) |
| Finland | `finlandia-hall` | FI | Aalto Works (Finlandia Hall): 60.17606, 24.93346, Q1142522 | Finlandia Hall's white marble wings and tower by the bay | No: Suomenlinna shows (drawn) |
| Belgium | `menin-gate` | BE | First World War Western Front (Menin Gate): 50.85205, 2.89107, Q1822397 | The Menin Gate's great arch with its lions | Yes (drawn) |
| United Kingdom | `jodrell-bank` | GB, XE | Jodrell Bank Observatory: 53.23625, -2.30714, Q1569783 | The Lovell radio telescope's great white dish | Yes (drawn) |
| United Kingdom | `fountains-abbey` | GB, XE | Fountains Abbey and Studley Royal: 54.11611, -1.57306, Q16363480 | The ruined abbey's tower and nave by the river, the water garden | Yes (drawn) |
| Sri Lanka | `anuradhapura` | LK | Anuradhapura: 8.335, 80.41083, Q5724 | The Ruwanwelisaya stupa's white dome ringed by elephants | Yes (drawn) |
| Afghanistan | `bamiyan` | AF | Bamiyan Valley: 34.83204, 67.8268, Q50810144 | The cliff with the Buddhas' great empty niches | Yes (drawn) |
| Uzbekistan | `shakhrisyabz` | UZ | Historic Centre of Shakhrisyabz: 39.05, 66.83333, Q569766 | The Ak-Saray's ruined portal and Timur's statue | No: the Registan shows (drawn) |
| Iran | `bam-citadel` | IR | Bam Citadel: 29.11686, 58.36847, Q43277 | Arg-e Bam's mud-brick citadel and walls | Yes (drawn) |
| Iran | `pasargadae` | IR | Pasargadae: 30.2, 53.17944, Q230025 | The Tomb of Cyrus on its stepped plinth | No: Persepolis shows (drawn) |
| Iran | `yazd` | IR | Historic City of Yazd: 31.90056, 54.36958, Q32979655 | The windcatchers over the mud-brick houses, the Jameh Mosque's twin minarets | Yes (drawn) |
| Iran | `gonbad-e-qabus` | IR | Gonbad-e Qabus: 37.25812, 55.16899, Q606763 | The tall brick tomb tower with its conical roof | Yes (drawn) |
| Saudi Arabia | `historic-jeddah` | SA | Historic Jeddah: 21.4833, 39.2, Q4702264 | The coral-stone tower houses with their wooden rawasheen | Yes (drawn) |
| United States | `taos-pueblo` | US | Taos Pueblo: 36.43889, -105.54167, Q252814 | The many-storeyed adobe houses with their ladders | Yes (drawn) |
| United States | `chaco` | US | Chaco Culture: 36.06378, -107.97083, Q65648486 | Pueblo Bonito's great D-shaped ruin with its round kivas | No: Cliff Palace, Mesa Verde shows (drawn) |
| Canada | `lanse-aux-meadows` | CA | L'Anse aux Meadows: 51.59527, -55.53122, Q189113 | The Viking sod houses by the sea | Yes (drawn) |
| Mexico | `el-tajin` | MX | El Tajín: 20.44806, -97.37824, Q753895 | The Pyramid of the Niches | Yes (drawn) |
| Mexico | `monte-alban` | MX | Oaxaca and Monte Albán: 17.06194, -96.72167, Q16743243 | Monte Albán's platforms and pyramids on the levelled mountaintop | Yes (drawn) |
| Chile | `valparaiso` | CL | Historic Quarter of Valparaíso: -33.04064, -71.628, Q16333721 | The coloured houses up the hills with an ascensor | Yes (drawn) |
| Peru | `lima` | PE | Historic Centre of Lima: -12.05139, -77.04306, Q3320442 | The Plaza Mayor's cathedral and the Archbishop's Palace with its wooden balconies | Yes (drawn) |
| Brazil | `salvador` | BR | Historic Centre of Salvador: -12.9667, -38.5, Q5572706 | The Lacerda Elevator and the Pelourinho's coloured houses | Yes (drawn) |
| Kenya | `fort-jesus` | KE | Fort Jesus, Mombasa: -4.07117, 39.68206, Q379080 | Fort Jesus' ochre walls and bastions over the harbour | Yes (drawn) |
| Bangladesh | `bagerhat` | BD | Mosque City of Bagerhat: 22.66097, 89.75855, Q799893 | The Sixty Dome Mosque's rows of domes | Yes (drawn) |
| Algeria | `timgad` | DZ | Timgad: 35.48424, 6.46867, Q459629 | Trajan's Arch over the Roman town's grid of streets | Yes (drawn) |

## 5. Another 200: buildings, statues and structures

Another 200 (24 Nov 2026, the user's wish), buildings, statues and structures only, the best known first, chosen by judgement as part 4 was: the famous buildings of cities that already have a model (the Arc de Triomphe, the Sacré-Cœur and the Louvre for Paris's Seine banks, Tower Bridge for the Tower of London's, the Trevi Fountain for Rome's centre), then the built World Heritage Sites still without one. The same overlap rule as parts 2 to 4: the models already on the map keep their place, and 101 of the 200 show, 99 are kept off: drawn with `"onMap": false` ("No"). All 200 were drawn on 24 Nov 2026 and exported to the maps the same day (the country map e2e test's `LATEST_MODELS`; Cordouan's lighthouse, which stands at sea off the Gironde, is checked to be in view when France's map opens instead).

| Country | Model id | Maps | Landmark (name in the data: latitude, longitude, Wikidata) | What to draw | On the map |
| --- | --- | --- | --- | --- | --- |
| France | `arc-de-triomphe` | FR | Paris, Banks of the Seine: 48.85, 2.35889, Q2233532 | The Arc de Triomphe's great arch with its carved groups on the piers, the star of avenues round it | No: Eiffel Tower shows |
| France | `sacre-coeur` | FR | Paris, Banks of the Seine: 48.85, 2.35889, Q2233532 | The Sacré-Cœur's white domes on top of Montmartre, the steps and the funicular up the hill | No: Eiffel Tower shows |
| France | `louvre` | FR | Paris, Banks of the Seine: 48.85, 2.35889, Q2233532 | The Louvre's glass pyramid in the Cour Napoléon, the palace wings round it | No: Eiffel Tower shows |
| United Kingdom | `tower-bridge` | GB, XE | Tower of London: 51.5082, -0.0762, Q62378 | Tower Bridge's two Gothic towers and blue walkways, the bascules raised over the Thames | No: Big Ben shows |
| United Kingdom | `westminster-abbey` | GB, XE | Westminster Palace and Abbey: 51.50056, -0.12694, Q10344038 | Westminster Abbey's west towers and long Gothic nave, the lawn before it | No: Big Ben shows |
| United Kingdom | `london-eye` | GB, XE | Westminster Palace and Abbey: 51.50056, -0.12694, Q10344038 | The London Eye's giant wheel and its glass capsules on the bank of the Thames | No: Big Ben shows |
| United Kingdom | `buckingham-palace` | GB, XE | Westminster Palace and Abbey: 51.50056, -0.12694, Q10344038 | Buckingham Palace's front with its balcony and flag, the Victoria Memorial's gilded statue before the gates | No: Big Ben shows |
| Italy | `trevi-fountain` | IT | Historic Centre of Rome: 41.8928, 12.4866, Q18448486 | The Trevi Fountain's palace front with Oceanus in his shell chariot, the rocks and the pool | No: Colosseum shows |
| Italy | `rialto-bridge` | IT | Venice and its Lagoon: 45.43431, 12.33894, Q11352141 | The Rialto Bridge's white stone arch with its rows of shops, gondolas on the Grand Canal | No: Venice shows |
| Italy | `ponte-vecchio` | IT | Historic Centre of Florence: 43.77306, 11.25611, Q2707802 | The Ponte Vecchio's three arches with the goldsmiths' shops hanging over the Arno | No: Leaning Tower of Pisa shows |
| Italy | `milan-cathedral` | IT | Santa Maria delle Grazie (The Last Supper): 45.46583, 9.17111, Q244952 | Milan Cathedral's white marble front and its forest of spires, the golden Madonnina on top | No: Santa Maria delle Grazie shows |
| Spain | `park-guell` | ES | Works of Gaudí (Sagrada Família): 41.40356, 2.17435, Q14468710 | Park Güell's mosaic dragon on the stairs, the gingerbread gatehouses and the serpentine bench | No: Sagrada Família shows |
| Spain | `casa-batllo` | ES | Works of Gaudí (Sagrada Família): 41.40356, 2.17435, Q14468710 | Casa Batlló's bone-like balconies, its shimmering tiled front and dragon-back roof | No: Sagrada Família shows |
| Spain | `plaza-de-espana` | ES | Seville Cathedral and Alcázar: 37.38384, -5.99155, Q9709444 | Seville's Plaza de España: the curved brick palace with its two towers, the canal and bridges | No: Giralda shows |
| Turkey | `blue-mosque` | TR | Historic Areas of Istanbul: 41.00847, 28.97993, Q5773394 | The Blue Mosque's cascade of domes and its six slender minarets | No: Hagia Sophia shows |
| Turkey | `galata-tower` | TR | Historic Areas of Istanbul: 41.00847, 28.97993, Q5773394 | The Galata Tower's round stone shaft and conical cap over the roofs of Beyoğlu | No: Hagia Sophia shows |
| Palestine | `dome-of-the-rock` | PS | Old City of Jerusalem: 31.77821, 35.23191, Q15726304 | The Dome of the Rock's golden dome on its octagon tiled in blue, on the Temple Mount | No: Western Wall shows |
| Palestine | `holy-sepulchre` | PS | Old City of Jerusalem: 31.77821, 35.23191, Q15726304 | The Church of the Holy Sepulchre's twin-arched front, its bell tower and grey domes | No: Western Wall shows |
| Russia | `spasskaya-tower` | RU | Red Square: 55.75417, 37.62, Q41116 | The Kremlin's Spasskaya Tower with its clock, red star and tented spire over the red wall | No: Saint Basil's Cathedral shows |
| China | `tiananmen` | CN | Beijing Central Axis: 39.89964, 116.39161, Q6112171 | Tiananmen, the Gate of Heavenly Peace: the red gate with its golden roofs and the marble bridges before it | No: Great Wall of China shows |
| Japan | `kinkakuji` | JP | Historic Monuments of Ancient Kyoto: 35.06028, 135.75278, Q874027 | Kinkaku-ji, the Golden Pavilion, its gold-leafed storeys reflected in the pond, pines on the islets | No: Himeji Castle + Shirakawa-go shows |
| Japan | `kiyomizu-dera` | JP | Historic Monuments of Ancient Kyoto: 35.06028, 135.75278, Q874027 | Kiyomizu-dera's great wooden stage on its tall pillars over the hillside, the red pagoda | No: Himeji Castle + Shirakawa-go shows |
| India | `gateway-of-india` | IN | Victorian Gothic and Art Deco Mumbai: 18.92981, 72.83008, Q16942531 | The Gateway of India's arch of yellow basalt with its four turrets, on the harbour front | No: Chhatrapati Shivaji Terminus shows |
| Denmark | `little-mermaid` | DK | Tivoli Gardens: 55.67361, 12.56833, Q110289 | The Little Mermaid statue on her rock by the water, Copenhagen's harbour behind | No: Tivoli Gardens shows |
| Australia | `sydney-harbour-bridge` | AU | Sydney Opera House: -33.85706, 151.2149, Q45178 | The Sydney Harbour Bridge's steel arch and its granite pylons over the harbour | No: Sydney Opera House shows |
| Hungary | `chain-bridge` | HU | Budapest, Banks of the Danube: 47.48242, 19.07067, Q851122 | The Chain Bridge's stone towers and hanging chains over the Danube, the lions at its ends | No: Hungarian Parliament Building shows |
| Hungary | `fishermans-bastion` | HU | Buda Castle: 47.49611, 19.03972, Q46313 | The Fisherman's Bastion's white turrets and arcades, Matthias Church's patterned roof behind | No: Hungarian Parliament Building shows |
| Czechia | `astronomical-clock` | CZ | Historic Centre of Prague: 50, 14.56, Q64637410 | The Old Town Hall tower with the astronomical clock's dials, the Týn Church's spires | No: Prague Castle shows |
| Czechia | `dancing-house` | CZ | Historic Centre of Prague: 50, 14.56, Q64637410 | The Dancing House: its glass tower pinched at the waist leaning on the solid one, by the river | No: Prague Castle shows |
| Austria | `riesenrad` | AT | Historic Centre of Vienna: 48.2084, 16.3722, Q11288310 | The Prater's Riesenrad, the old giant Ferris wheel with its red cabins | No: Schönbrunn Palace shows |
| Mexico | `angel-of-independence` | MX | Mexico City Centre and Xochimilco: 19.41833, -99.13278, Q15924695 | The Angel of Independence: the golden winged Victory on her tall column above the roundabout | No: Teotihuacan shows |
| Mexico | `bellas-artes` | MX | Mexico City Centre and Xochimilco: 19.41833, -99.13278, Q15924695 | The Palacio de Bellas Artes' white marble front and its orange and gold tiled domes | No: Teotihuacan shows |
| Egypt | `colossi-of-memnon` | EG | Ancient Thebes (Luxor): 25.72056, 32.61028, Q141298543 | The Colossi of Memnon: the two great seated stone pharaohs on the plain | No: Karnak shows |
| Egypt | `philae` | EG | Nubian Monuments (Abu Simbel): 22.33694, 31.62556, Q134140 | The Temple of Isis at Philae: its great pylon and colonnades on the island in the Nile, Trajan's Kiosk | No: Abu Simbel shows |
| Egypt | `muhammad-ali-mosque` | EG | Historic Cairo: 30.046, 31.2627, Q1100964 | The Mosque of Muhammad Ali's domes and pencil minarets on the Citadel | No: Pyramids of Giza shows |
| Portugal | `jeronimos` | PT | Tower of Belém: 38.69139, -9.21583, Q215003 | The Jerónimos Monastery's long white limestone front and its carved south door | No: Tower of Belém shows |
| Greece | `white-tower` | GR | Byzantine Monuments of Thessaloniki: 40.6386, 22.9478, Q732708 | The White Tower's round tower on the seafront, its little turret on top | Yes |
| Greece | `epidaurus` | GR | Epidaurus: 37.5986, 23.0744, Q7698713 | The theatre of Epidaurus: its great fan of stone seats round the round stage, the hills behind | Yes |
| Greece | `mycenae` | GR | Mycenae and Tiryns: 37.73333, 22.75, Q16945635 | Mycenae's Lion Gate with its two carved lions, the Cyclopean walls | No: Epidaurus shows |
| Thailand | `wat-arun` | TH | Grand Palace: 13.75014, 100.49203, Q873769 | Wat Arun's tall prang encrusted with porcelain, its four smaller prangs, on the river | No: Grand Palace shows |
| South Korea | `cheomseongdae` | KR | Gyeongju Historic Areas: 35.78889, 129.22667, Q495241 | Cheomseongdae, the bottle-shaped stone observatory, and the royal tomb mounds behind | No: Bulguksa shows |
| South Korea | `changdeokgung` | KR | Changdeokgung Palace: 37.57944, 126.99167, Q477157 | Changdeokgung's gate and throne hall, and the Buyongji pond's pavilion in the Secret Garden | No: Gyeongbokgung Palace shows |
| Brazil | `congonhas` | BR | Bom Jesus do Congonhas: -20.50778, -43.86069, Q1595417 | The sanctuary's white church and the soapstone prophets of Aleijadinho on the stairs | No: Church of São Francisco de Assis shows |
| Italy | `castel-sant-angelo` | IT | Historic Centre of Rome: 41.8928, 12.4866, Q18448486 | Castel Sant'Angelo's round drum and the angel on top, the Ponte Sant'Angelo with its statues | No: Colosseum shows |
| Italy | `vittoriano` | IT | Historic Centre of Rome: 41.8928, 12.4866, Q18448486 | The Vittoriano's white marble colonnade, its bronze chariots and the equestrian statue | No: Colosseum shows |
| Italy | `bologna-towers` | IT | Porticoes of Bologna: 44.49139, 11.33278, Q3909051 | Bologna's Two Towers, the tall Asinelli and the leaning Garisenda, over the porticoed streets | Yes |
| Spain | `crystal-palace-retiro` | ES | Paseo del Prado and Buen Retiro: 40.41414, -3.68653, Q107675480 | The Palacio de Cristal's glass and iron hall by its lake in the Retiro, the Prado's front | No: Aqueduct of Segovia shows |
| Spain | `salamanca` | ES | Old City of Salamanca: 40.96525, -5.6645, Q12156631 | Salamanca's old and new cathedrals with their domes and towers in golden sandstone | Yes |
| Germany | `pfalzgrafenstein` | DE | Upper Middle Rhine Valley: 50.17361, 7.69417, Q6668852 | Pfalzgrafenstein Castle like a stone ship in the middle of the Rhine, the vineyards above | Yes |
| Germany | `weimar` | DE | Classical Weimar: 50.98333, 11.31667, Q467763 | The Goethe and Schiller statue before the German National Theatre | Yes |
| Germany | `bauhaus` | DE | Bauhaus Sites (Dessau): 51.8392, 12.2267, Q516770 | The Bauhaus building's glass curtain wall and the white blocks with the BAUHAUS lettering | Yes |
| Germany | `wieskirche` | DE | Wieskirche: 47.6806, 10.90044, Q156675 | The Pilgrimage Church of the Wies: its white walls and bell tower in the green meadow, the Alps | No: Neuschwanstein Castle shows |
| Germany | `maulbronn` | DE | Maulbronn Monastery: 49.0011, 8.8129, Q157886 | Maulbronn's Cistercian church and cloister, the half-timbered buildings of its walled court | No: Speyer Cathedral shows |
| Germany | `zollverein` | DE | Zollverein Coal Mine: 51.4865, 7.04408, Q122026 | Zollverein's Shaft XII headframe, the red steel tower over the cubic brick buildings | Yes |
| Japan | `horyu-ji` | JP | Hōryū-ji: 34.61427, 135.73424, Q1333799 | Hōryū-ji's five-storey wooden pagoda and Golden Hall in their cloistered court | No: Himeji Castle shows |
| Japan | `shuri-castle` | JP | Gusuku Sites of Ryukyu: 26.2086, 127.683, Q1333330 | Shuri Castle's red main hall with its dragon pillars, the curving stone walls | Yes |
| Japan | `oura-church` | JP | Hidden Christian Sites (Ōura Church): 32.73417, 129.87028, Q430626 | Ōura Church's white Gothic front and spire above its steps, the harbour of Nagasaki | No: Hashima Island shows |
| India | `brihadeeswarar` | IN | Great Living Chola Temples: 10.78306, 79.1325, Q695229 | The Brihadeeswarar Temple's tall pyramid tower and the great Nandi bull in his pavilion | No: Shore Temple shows |
| India | `rani-ki-vav` | IN | Rani ki Vav: 23.85892, 72.10162, Q7293002 | The Queen's Stepwell: its terraces of carved stone pavilions stepping down to the water | Yes |
| India | `bom-jesus-goa` | IN | Churches and Convents of Goa: 15.5024, 73.9117, Q15726428 | The Basilica of Bom Jesus' red laterite baroque front, the white Se Cathedral beside | Yes |
| India | `elephanta` | IN | Elephanta Caves: 18.96333, 72.93139, Q649384 | The great three-headed Trimurti carved in the cave on Elephanta island | No: Chhatrapati Shivaji Terminus shows |
| China | `temple-of-confucius` | CN | Temple of Confucius, Qufu: 35.59651, 116.98445, Q1038473 | The Dacheng Hall with its yellow roof and carved dragon columns, the stele pavilions | Yes |
| China | `yungang` | CN | Yungang Grottoes: 40.10972, 113.12222, Q308805 | The seated great Buddha of the Yungang Grottoes in his open cave, the cliff of niches | No: Great Wall of China shows |
| China | `chengde` | CN | Chengde Mountain Resort: 40.9875, 117.9375, Q1046818 | The Putuo Zongcheng temple, the little Potala, its red and white walls on the hill above the lake | No: Great Wall of China shows |
| China | `kaiping-diaolou` | CN | Kaiping Diaolou and Villages: 22.26181, 112.52078, Q16303641 | The Kaiping diaolou: tall fortified tower houses with Western domes and balconies among rice fields | No: Ruins of St. Paul's shows |
| China | `ming-tombs` | CN | Ming and Qing Imperial Tombs (Ming Tombs): 40.25333, 116.2175, Q41135 | The Ming Tombs' Sacred Way of stone animals and officials, the Changling's red hall | No: Great Wall of China shows |
| Russia | `nerl-church` | RU | White Monuments of Vladimir and Suzdal: 56.15, 40.4167, Q838264 | The Church of the Intercession on the Nerl, white and alone above its meadow by the river | No: Saint Basil's Cathedral shows |
| Russia | `novgorod` | RU | Historic Monuments of Novgorod: 58.51833, 31.28556, Q1218832 | Novgorod's kremlin walls and St Sophia Cathedral's golden dome | No: Church of the Savior on Spilled Blood shows |
| Russia | `derbent` | RU | Derbent Citadel and Old City: 42.06917, 48.29583, Q64763166 | Derbent's Naryn-Kala citadel walls climbing the hill above the Caspian | Yes |
| Turkey | `bursa` | TR | Bursa and Cumalıkızık: 40.18473, 29.06234, Q60846866 | Bursa's Green Mosque and Green Tomb in their turquoise tiles, cypresses | Yes |
| Turkey | `xanthos` | TR | Xanthos-Letoon: 36.335, 29.32028, Q16912661 | Xanthos' Harpy Tomb and Lycian pillar tombs on the hill, the theatre | Yes |
| Turkey | `divrigi` | TR | Divriği Great Mosque: 39.37122, 38.12158, Q581641 | The Divriği Great Mosque's carved stone portal and its brick minaret | Yes |
| Turkey | `ani` | TR | Ani: 40.5075, 43.57278, Q546010 | Ani's ruined red-stone cathedral and church of St Gregory on the gorge's edge | Yes |
| Greece | `mystras` | GR | Mystras: 37.074, 22.3673, Q19053 | Mystras' Byzantine churches and the Despots' palace on the hillside below the castle | Yes |
| Greece | `corfu` | GR | Old Town of Corfu: 39.62466, 19.92193, Q38283757 | Corfu's Old Fortress on its rocky headland, the clock tower and the bridge over the moat | Yes |
| Greece | `hosios-loukas` | GR | Hosios Loukas, Daphni and Nea Moni: 38.39514, 22.74632, Q844841 | The monastery of Hosios Loukas' banded stone churches and domes on the mountainside | No: Delphi shows |
| Greece | `bassae` | GR | Temple of Apollo at Bassae: 37.42965, 21.90039, Q38278862 | The Temple of Apollo at Bassae's Doric columns, high in the Arcadian mountains | No: Olympia shows |
| Portugal | `alcobaca` | PT | Alcobaça Monastery: 39.54859, -8.97863, Q593147 | Alcobaça Monastery's baroque front with its two towers and the long Gothic church | No: Batalha Monastery shows |
| Portugal | `bom-jesus-braga` | PT | Bom Jesus do Monte: 41.5546, -8.3775, Q2707216 | Bom Jesus do Monte's zigzag baroque stairway climbing to the church, its fountains and chapels | Yes |
| Portugal | `mafra` | PT | Royal Building of Mafra: 38.93692, -9.32639, Q54948065 | The palace-convent of Mafra's long front with the basilica's dome and two bell towers | Yes |
| Portugal | `elvas` | PT | Elvas Fortifications: 38.88056, -7.16333, Q5524023 | Elvas' star-shaped walls and the Amoreira Aqueduct's tall arches | Yes |
| Spain | `lonja-valencia` | ES | Lonja de la Seda, Valencia: 39.47444, -0.37833, Q588009 | The Silk Exchange's Gothic front and tower, the twisted columns of its hall | Yes |
| Spain | `aljaferia` | ES | Mudéjar Architecture of Aragon (Aljafería): 41.65649, -0.89708, Q1354033 | The Aljafería palace's walls and towers in brick, Teruel's Mudéjar tower | Yes |
| Spain | `poblet` | ES | Poblet Monastery: 41.38083, 1.0825, Q645157 | Poblet Monastery's royal gate between two towers and the church's octagonal belfry | Yes |
| Spain | `guadalupe` | ES | Guadalupe Monastery: 39.45278, -5.3275, Q750248 | The Royal Monastery of Guadalupe's battlemented towers and its Gothic-Mudéjar front | Yes |
| Spain | `medina-azahara` | ES | Medina Azahara: 37.88608, -4.86779, Q211252 | Medina Azahara's horseshoe arches of the Hall of Abd al-Rahman III, the ruins on the slope | No: Mezquita of Córdoba shows |
| Spain | `antequera-dolmens` | ES | Antequera Dolmens: 37.02333, -4.54806, Q97633694 | The Dolmen of Menga's great stone slabs under their mound, La Peña de los Enamorados behind | Yes |
| Spain | `talayotic-menorca` | ES | Talayotic Menorca: 39.9975, 3.90889, Q64990632 | Menorca's Naveta d'Es Tudons and a taula, the T-shaped stone table, among olive trees | Yes |
| Spain | `vall-de-boi` | ES | Romanesque Churches of Vall de Boí: 42.50472, 0.80361, Q1091515 | Sant Climent de Taüll's slender Romanesque bell tower and apses in the Pyrenees | Yes |
| France | `saint-jacques-tower` | FR | Camino de Santiago, France (Saint-Jacques Tower): 48.85776, 2.34878, Q1431547 | The Saint-Jacques Tower's Flamboyant Gothic bell tower in its little square | No: Eiffel Tower shows |
| France | `bourges-cathedral` | FR | Bourges Cathedral: 47.08222, 2.39917, Q207985 | Bourges Cathedral's five portals, its flying buttresses and its towers | No: Château de Chambord shows |
| France | `maison-carree` | FR | Maison Carrée: 43.83819, 4.35611, Q677659 | The Maison Carrée's Roman temple on its podium with its Corinthian columns | No: Pont du Gard shows |
| France | `cordouan` | FR | Cordouan Lighthouse: 45.58632, -1.17333, Q199234 | The Cordouan Lighthouse, a royal palace of a lighthouse on its reef in the ocean | Yes |
| France | `bordeaux` | FR | Bordeaux, Port of the Moon: 44.83889, -0.57222, Q2249113 | Place de la Bourse's classical palaces reflected in the water mirror, the trams | No: Saint-Émilion shows |
| France | `vezelay` | FR | Vézelay: 47.46639, 3.74833, Q64401449 | The Basilica of Sainte-Marie-Madeleine on top of Vézelay's hill, the village climbing to it | Yes |
| France | `besancon` | FR | Fortifications of Vauban (Besançon): 47.23139, 6.0325, Q1329976 | Vauban's citadel of Besançon on its rock in the loop of the Doubs | Yes |
| France | `le-havre` | FR | Le Havre: 49.4891, 0.11522, Q2944797 | Le Havre's St Joseph's Church: its tall concrete lantern tower over Perret's rebuilt city | Yes |
| France | `nice` | FR | Nice, Winter Resort of the Riviera: 43.70169, 7.27231, Q108094935 | The Hôtel Negresco's pink dome on the Promenade des Anglais, the blue chairs and the bay | Yes |
| United Kingdom | `ironbridge` | GB, XE | Ironbridge Gorge: 52.62639, -2.47278, Q647958 | The Iron Bridge's single cast-iron arch over the Severn in its wooded gorge | No: Jodrell Bank Observatory shows |
| United Kingdom | `pontcysyllte` | GB, XW | Pontcysyllte Aqueduct and Canal: 52.97212, -3.08727, Q24677919 | The Pontcysyllte Aqueduct's tall stone piers and its iron trough carrying the canal over the valley, a narrowboat | No: Caernarfon Castle + Jodrell Bank Observatory shows |
| United Kingdom | `scott-monument` | GB, XC | Old and New Towns of Edinburgh: 55.95, -3.21667, Q15260680 | The Scott Monument's Gothic spire with Sir Walter Scott's statue beneath it, Princes Street Gardens | No: Edinburgh Castle shows |
| United Kingdom | `new-lanark` | GB, XC | New Lanark: 55.66361, -3.78139, Q743108 | New Lanark's long mill buildings by the River Clyde in its wooded gorge | No: Edinburgh Castle shows |
| United Kingdom | `cornwall-mines` | GB, XE | Cornwall and West Devon Mining Landscape: 50.13611, -5.38361, Q464566 | Botallack's engine houses and chimneys on the cliffs above the sea | Yes |
| United Kingdom | `ring-of-brodgar` | GB, XC | Heart of Neolithic Orkney: 58.9975, -3.215, Q1334966 | The Ring of Brodgar's circle of standing stones on the heath between the lochs | No: Heart of Neolithic Orkney shows |
| Italy | `ravenna` | IT | Early Christian Monuments of Ravenna: 44.42042, 12.19625, Q16886821 | The Basilica of San Vitale's brick octagon and the round bell tower of Sant'Apollinare | No: Porticoes of Bologna shows |
| Italy | `palermo` | IT | Arab-Norman Palermo: 38.11083, 13.35306, Q20963672 | Palermo Cathedral's long golden front and towers, San Giovanni degli Eremiti's red domes | Yes |
| Italy | `modena` | IT | Modena Cathedral and Piazza Grande: 44.64624, 10.92568, Q15221022 | Modena Cathedral's Romanesque front and the Ghirlandina bell tower | No: Verona Arena + Porticoes of Bologna shows |
| Italy | `villa-rotonda` | IT | Vicenza and the Palladian Villas: 45.55, 11.55, Q370956 | Palladio's Villa La Rotonda: its dome and four temple porticoes on its little hill | No: Venice + Verona Arena shows |
| Italy | `barumini` | IT | Su Nuraxi di Barumini: 39.70286, 8.99988, Q253241 | Su Nuraxi's nuraghe: the stone tower fortress and the round huts of its village | Yes |
| Italy | `syracuse` | IT | Syracuse and Pantalica: 37.05944, 15.29306, Q15604441 | Syracuse's Greek theatre cut into the hill and the Ear of Dionysius cave | No: Noto Cathedral shows |
| Italy | `appian-way` | IT | Appian Way: 41.84139, 12.5325, Q189417 | The Appian Way's Roman paving lined with umbrella pines and the round Tomb of Caecilia Metella | No: Colosseum shows |
| Germany | `stralsund` | DE | Stralsund and Wismar (Stralsund): 54.3025, 13.08528, Q64822259 | Stralsund Town Hall's brick front with its pinnacles and round windows, St Nicholas' towers | Yes |
| Germany | `bruhl` | DE | Augustusburg and Falkenlust, Brühl: 50.8275, 6.90806, Q156292 | Augustusburg Palace's yellow rococo front and its parterre gardens | No: Aachen Cathedral + Cologne Cathedral shows |
| Germany | `fagus-factory` | DE | Fagus Factory: 51.9837, 9.81256, Q685476 | The Fagus Factory's glass walls round the corners and its tall chimney | Yes |
| Germany | `volklingen` | DE | Völklingen Ironworks: 49.25056, 6.84528, Q127754 | The Völklingen Ironworks' blast furnaces, pipes and gas tanks | No: Porta Nigra shows |
| Germany | `naumburg` | DE | Naumburg Cathedral: 51.15472, 11.80389, Q5938 | Naumburg Cathedral's four towers and the statue of Uta in her niche | No: Classical Weimar shows |
| Germany | `wittenberg` | DE | Luther Memorials (Wittenberg Castle Church): 51.86639, 12.63778, Q661752 | Wittenberg Castle Church's round tower and the Theses Door | No: Bauhaus Sites (Dessau) shows |
| Germany | `darmstadt` | DE | Mathildenhöhe Darmstadt: 49.87543, 8.6665, Q314730 | The Wedding Tower's five rounded fingers over the Russian Chapel's golden domes | Yes |
| Netherlands | `wouda` | NL | D.F. Wouda Steam Pumping Station: 52.84583, 5.67889, Q1121835 | The Wouda pumping station's brick hall and tall chimney by the polder water | Yes |
| Netherlands | `rietveld-schroder` | NL | Rietveld Schröder House: 52.08533, 5.1476, Q914231 | The Rietveld Schröder House's white and grey planes and its red, blue and yellow lines | Yes |
| Netherlands | `van-nelle` | NL | Van Nelle Factory: 51.92278, 4.43361, Q2328849 | The Van Nelle Factory's glass curtain walls and the round tea room on the roof | No: Kinderdijk windmills shows |
| Belgium | `boat-lifts` | BE | Boat Lifts of the Canal du Centre: 50.4714, 4.0945, Q99372 | A boat lift of the Canal du Centre: its two iron caissons and the barge going up | Yes |
| Belgium | `tournai` | BE | Tournai Cathedral: 50.6065, 3.3889, Q391229 | Tournai Cathedral's five towers over its Romanesque nave | Yes |
| Austria | `semmering` | AT | Semmering Railway: 47.643, 15.831, Q259313 | The Semmering Railway's two-storey viaduct curving through the mountains, a train on it | Yes |
| Austria | `eggenberg` | AT | Graz Old Town and Schloss Eggenberg: 47.07417, 15.39167, Q2326418 | Schloss Eggenberg's square palace with its four corner towers and the park | No: Graz Clock Tower shows |
| Czechia | `telc` | CZ | Telč: 49.18333, 15.45, Q64640311 | Telč's square of colourful Renaissance gables over the arcades | Yes |
| Czechia | `holy-trinity-column` | CZ | Holy Trinity Column, Olomouc: 49.59402, 17.25049, Q742362 | The Holy Trinity Column's tall baroque column of statues and its gilded copper group on top | Yes |
| Czechia | `zelena-hora` | CZ | Zelená Hora Pilgrimage Church: 49.58, 15.94194, Q752318 | The Pilgrimage Church of St John of Nepomuk's star-shaped walls on the hill | Yes |
| Czechia | `villa-tugendhat` | CZ | Villa Tugendhat: 49.20722, 16.61583, Q457453 | Villa Tugendhat's long white modernist front and its glass living room over the garden | Yes |
| Czechia | `lednice` | CZ | Lednice-Valtice: 48.7758, 16.775, Q735278 | Lednice Castle's neo-Gothic towers and the tall minaret in the park | Yes |
| Hungary | `pannonhalma` | HU | Pannonhalma Archabbey: 47.55278, 17.76111, Q936285 | Pannonhalma Archabbey's church tower and long buildings on top of their hill | Yes |
| Poland | `zamosc` | PL | Old City of Zamość: 50.72056, 23.25861, Q3678597 | Zamość Town Hall's tall tower and the fan-shaped stairs, the arcaded houses | Yes |
| Romania | `maramures` | RO | Wooden Churches of Maramureș: 47.8194, 24.0558, Q828412 | A Maramureș wooden church with its tall needle spire and shingled roofs | Yes |
| Romania | `horezu` | RO | Horezu Monastery: 45.1686, 24.0069, Q733069 | Horezu Monastery's painted church with its Brâncovenesc porch in the walled court | Yes |
| Bulgaria | `boyana` | BG | Boyana Church: 42.64467, 23.26617, Q276553 | The little Boyana Church with its red and white walls and its small dome, Vitosha behind | Yes |
| Bulgaria | `madara-rider` | BG | Madara Rider: 43.27737, 27.11889, Q319296 | The Madara Rider: a horseman, his dog and a lion carved high on the cliff | Yes |
| Ukraine | `odesa` | UA | Historic Centre of Odesa: 46.485, 30.741, Q15041608 | The Odesa Opera House's baroque front and the Potemkin Stairs to the harbour | Yes |
| Finland | `petajavesi` | FI | Petäjävesi Old Church: 62.25014, 25.18394, Q435829 | Petäjävesi Old Church: the wooden cross-shaped church with its shingled roofs and bell tower | Yes |
| Slovenia | `triple-bridge` | SI | Plečnik's Ljubljana: 46.04333, 14.50222, Q64494878 | Ljubljana's Triple Bridge with its balustrades, the pink Franciscan Church behind | Yes |
| Croatia | `euphrasian` | HR | Euphrasian Basilica, Poreč: 45.22861, 13.59361, Q645105 | The Euphrasian Basilica's golden mosaic apse and bell tower by the sea | Yes |
| Croatia | `sibenik` | HR | Šibenik Cathedral: 43.73556, 15.88917, Q391973 | Šibenik Cathedral's white stone dome and trefoil front | Yes |
| Denmark | `jelling` | DK | Jelling Mounds and Runic Stones: 55.75651, 9.41974, Q4993586 | Jelling's two grassy royal mounds, the white church between them and the rune stones | Yes |
| Sweden | `falun` | SE | Falun Copper Mine: 60.60472, 15.63083, Q636194 | The Falun mine's red wooden headframe and buildings by the Great Pit | Yes |
| Sweden | `grimeton` | SE | Grimeton Radio Station: 57.11398, 12.40442, Q920206 | The Grimeton radio station's six tall steel masts in a line, the transmitter hall | Yes |
| Sweden | `skogskyrkogarden` | SE | Skogskyrkogården: 59.27556, 18.09944, Q213988 | The Woodland Cemetery's great granite cross on the grassy hill, the chapel's portico | No: Drottningholm Palace shows |
| Norway | `roros` | NO | Røros Mining Town: 62.57389, 11.38556, Q19387263 | Røros' white stone church with its tower, the slag heaps and the wooden houses | Yes |
| Norway | `rjukan` | NO | Rjukan-Notodden Industrial Heritage: 59.87861, 8.59361, Q20643889 | The Vemork hydroelectric plant on its ledge above the gorge, the pipes down the mountain | Yes |
| Switzerland | `zytglogge` | CH | Old City of Bern: 46.94806, 7.45028, Q687973 | Bern's Zytglogge clock tower with its astronomical clock over the arcaded street | Yes |
| Switzerland | `st-gall` | CH | Abbey of St Gall: 47.42306, 9.37722, Q155699 | The Abbey of St Gall's baroque cathedral with its twin towers | Yes |
| Switzerland | `bellinzona` | CH | Castles of Bellinzona: 46.19278, 9.02222, Q510279 | Castelgrande's towers and walls on their rock above Bellinzona | Yes |
| Mexico | `uxmal` | MX | Uxmal: 20.3617, -89.7703, Q65455940 | Uxmal's Pyramid of the Magician with its rounded sides, the Governor's Palace | No: Chichén Itzá shows |
| Mexico | `puebla` | MX | Historic Centre of Puebla: 19.04722, -98.20833, Q3848455 | Puebla Cathedral's tall twin towers and Talavera-tiled domes | No: Pyramid of the Niches, El Tajín + Teotihuacan shows |
| Mexico | `san-miguel-de-allende` | MX | San Miguel de Allende and Atotonilco: 20.91444, -100.74639, Q15613314 | The Parroquia's pink neo-Gothic spires over the square | No: Guanajuato shows |
| Mexico | `morelia` | MX | Historic Centre of Morelia: 19.7, -101.18333, Q3848089 | Morelia Cathedral's pink stone towers and the long aqueduct | No: Guanajuato shows |
| Mexico | `hospicio-cabanas` | MX | Hospicio Cabañas: 20.6769, -103.33733, Q28416 | The Hospicio Cabañas' dome and long neoclassical front | Yes |
| Mexico | `padre-tembleque` | MX | Aqueduct of Padre Tembleque: 19.83639, -98.66222, Q2840764 | The Aqueduct of Padre Tembleque's tall arches over the valley | No: Pyramid of the Niches, El Tajín + Teotihuacan shows |
| Mexico | `unam` | MX | UNAM Ciudad Universitaria: 19.33222, -99.18806, Q130025 | UNAM's Central Library covered in its stone mosaic mural | No: Teotihuacan shows |
| Brazil | `pampulha` | BR | Pampulha Modern Ensemble: -19.85194, -43.97361, Q9850285 | Niemeyer's Church of St Francis of Assisi: its wavy concrete vaults and blue tiles by the lake | No: Church of São Francisco de Assis shows |
| Argentina | `san-ignacio-mini` | AR | Guarani Jesuit Missions (San Ignacio Miní): -27.25531, -55.5315, Q868799 | San Ignacio Miní's red sandstone church ruins carved by the Guarani | No: Iguazú Falls shows |
| South Korea | `jongmyo` | KR | Jongmyo Shrine: 37.57472, 126.99361, Q490497 | Jongmyo's long hall of red pillars and its great grey roof over the stone court | No: Gyeongbokgung Palace shows |
| South Korea | `haeinsa` | KR | Haeinsa Temple: 35.80161, 128.09872, Q490798 | Haeinsa's halls of the Tripitaka Koreana on the mountainside | Yes |
| Thailand | `nakhon-si-thammarat` | TH | Wat Phra Mahathat, Nakhon Si Thammarat: 8.41139, 99.96667, Q2552354 | Wat Phra Mahathat's white bell-shaped chedi with its golden spire | Yes |
| Vietnam | `thang-long` | VN | Imperial Citadel of Thang Long: 21.0325, 105.83972, Q206219 | The Imperial Citadel's Doan Mon gate and the Hanoi Flag Tower | Yes |
| Morocco | `mazagan` | MA | Mazagan (El Jadida): 33.25656, -8.50248, Q555360 | El Jadida's Portuguese bastions and its cistern with its pillars reflected in the water | Yes |
| Iran | `soltaniyeh` | IR | Soltaniyeh: 36.43472, 48.7975, Q4531 | The Dome of Soltaniyeh: its great turquoise dome on its octagon with its eight minarets | Yes |
| Iran | `chogha-zanbil` | IR | Chogha Zanbil: 32.00833, 48.52083, Q4523 | Chogha Zanbil's stepped brick ziggurat in the plain | Yes |
| Iran | `st-thaddeus` | IR | Armenian Monasteries of Iran (St Thaddeus): 39.09222, 44.54444, Q842826 | The Monastery of St Thaddeus: its black and white stone church in its walls | Yes |
| Iran | `eram-garden` | IR | Persian Gardens (Eram Garden): 29.63583, 52.52556, Q127963 | The Eram Garden's palace with its tiled front behind the long pool and cypresses | No: Persepolis shows |
| Iran | `shushtar` | IR | Shushtar Hydraulic System: 32.05372, 48.84869, Q2274974 | Shushtar's watermills and the waterfalls pouring from the cliff | No: Chogha Zanbil shows |
| Iran | `deyr-e-gachin` | IR | Persian Caravanserai (Deyr-e Gachin): 35.05828, 51.42011, Q6394061 | A caravanserai's square walls with round towers in the desert, camels at its gate | No: Golestan Palace shows |
| Iran | `susa` | IR | Susa: 32.18944, 48.25611, Q180773 | The Tomb of Daniel's ribbed white cone and the castle of Susa | No: Chogha Zanbil shows |
| Iran | `veresk-bridge` | IR | Trans-Iranian Railway: 35.65831, 51.39833, Q162835 | The Veresk Bridge's tall stone arch over the gorge, a train crossing it | No: Golestan Palace shows |
| Canada | `lunenburg` | CA | Old Town Lunenburg: 44.37611, -64.30917, Q28833066 | Lunenburg's red and colourful waterfront buildings and the schooner Bluenose II | Yes |
| Canada | `sgang-gwaay` | CA | SGang Gwaay: 52.09889, -131.2175, Q240832 | SGang Gwaay's weathered Haida totem poles in a row by the shore | Yes |
| Australia | `port-arthur` | AU | Australian Convict Sites (Port Arthur): -43.15639, 147.84722, Q999109 | Port Arthur's penitentiary ruins by the bay, the church | Yes |
| United States | `cahokia` | US | Cahokia Mounds: 38.65389, -90.06444, Q333661 | Monks Mound's great earthen terraces and the woodhenge of posts | Yes |
| United States | `liberty-bell` | US | Independence Hall: 39.94889, -75.15, Q390028 | The Liberty Bell with its crack, in its glass pavilion | No: Statue of Liberty shows |
| Syria | `umayyad-mosque` | SY | Ancient City of Damascus: 33.51111, 36.30639, Q3678596 | The Umayyad Mosque's courtyard, its golden mosaic front and three minarets | Yes |
| Syria | `saint-simeon` | SY | Dead Cities (Saint Simeon): 36.33417, 36.84417, Q1112125 | The Church of Saint Simeon Stylites' arches round the stump of his pillar | Yes |
| Lebanon | `tyre` | LB | Tyre: 33.26917, 35.19583, Q3991738 | Tyre's Roman triumphal arch and colonnaded road, the hippodrome | Yes |
| Lebanon | `anjar` | LB | Anjar: 33.72583, 35.92972, Q60977 | Anjar's Umayyad palace arches and columns at the crossing of its streets | Yes |
| Jordan | `quseir-amra` | JO | Quseir Amra: 31.80175, 36.58731, Q499517 | Quseir Amra, the little desert castle with its three vaults and dome | Yes |
| Peru | `arequipa` | PE | Historic Centre of Arequipa: -16.4, -71.53333, Q8343756 | Arequipa Cathedral's white sillar front and the El Misti volcano behind | Yes |
| Colombia | `san-agustin` | CO | San Agustín Archaeological Park: 1.88444, -76.29611, Q2887224 | San Agustín's carved stone statues and their dolmen tombs | Yes |
| Cuba | `san-pedro-de-la-roca` | CU | San Pedro de la Roca Castle: 19.96871, -75.8703, Q910189 | San Pedro de la Roca's terraced fortress on the cliffs at Santiago de Cuba's harbour | Yes |
| Philippines | `paoay-church` | PH | Philippine Baroque Churches (San Agustin): 14.58886, 120.97535, Q1306513 | Paoay Church's massive buttresses and its coral-stone bell tower | Yes |
| Indonesia | `yogyakarta` | ID | Cosmological Axis of Yogyakarta: -7.80139, 110.36478, Q96012243 | The Tugu monument and the Kraton's pavilions on Yogyakarta's axis | No: Borobudur shows |
| Nepal | `kathmandu-durbar` | NP | Kathmandu Valley: 27.71, 85.32, Q3037 | Kathmandu's Durbar Square: tiered pagoda temples on their stepped plinths | No: Boudhanath Stupa shows |
| Pakistan | `rohtas` | PK | Rohtas Fort: 32.96528, 73.57642, Q155188 | Rohtas Fort's great Sohail Gate and its walls | Yes |
| Pakistan | `takht-i-bahi` | PK | Takht-i-Bahi: 34.32083, 71.94583, Q15240737 | Takht-i-Bahi's Buddhist monastery ruins on the hilltop, the stupa court | Yes |
| Bangladesh | `paharpur` | BD | Paharpur Buddhist Vihara: 25.03111, 88.97694, Q305044 | Paharpur's great brick temple of terraces in the middle of its monastery square | Yes |
| Cambodia | `preah-vihear` | KH | Preah Vihear Temple: 14.39056, 104.68028, Q45949 | Preah Vihear's temple gopuras on the cliff edge of the Dângrêk Mountains | Yes |
| Cambodia | `koh-ker` | KH | Koh Ker: 13.74992, 104.54727, Q1778458 | Koh Ker's Prasat Thom: its seven-tiered stepped pyramid in the forest | Yes |
| Tunisia | `dougga` | TN | Dougga: 36.42333, 9.22028, Q32378 | Dougga's Capitol, its temple front of columns on the hill among olive trees | Yes |
| Tunisia | `sousse` | TN | Medina of Sousse: 35.8278, 10.6386, Q608100 | The Ribat of Sousse with its round watchtower and the medina walls | Yes |
| Algeria | `djemila` | DZ | Djémila: 36.32056, 5.73667, Q457362 | Djémila's Arch of Caracalla and the Roman ruins on their ridge | Yes |
| Algeria | `beni-hammad` | DZ | Al Qal'a of Beni Hammad: 35.81389, 4.79333, Q500367 | The Beni Hammad minaret, tall and alone in the ruins | No: Djémila shows |
| Libya | `cyrene` | LY | Cyrene: 32.81667, 21.85, Q44112 | Cyrene's Temple of Apollo's columns above the sanctuary | Yes |
| Libya | `sabratha` | LY | Sabratha: 32.80528, 12.485, Q15052130 | Sabratha's Roman theatre stage of three storeys of columns by the sea | Yes |
| Mali | `tomb-of-askia` | ML | Tomb of Askia: 16.28972, -0.04444, Q503823 | The Tomb of Askia's mud-brick pyramid with its wooden spikes, the mosque | Yes |

## 6. Another 100: built World Heritage Sites

Another 100 (24 Nov 2026, the user's wish), buildings, statues and structures only: the best-known built World Heritage Sites with no model yet (by their number of Wikipedia editions, leaving out rock art, fossil sites, canals, vineyards and landscapes), one model each, so every one is the model of a landmark of its own (the celebration finds a landmark's model by its Wikidata item, and several models on one landmark show only one). The same overlap rule as parts 2 to 5: the models already on the map keep their place, and 73 of the 100 show, 27 are kept off: drawn with `"onMap": false` ("No"). All 100 were drawn on 24 Nov 2026 and exported to the maps the same day (the country map e2e test's `HERITAGE_MODELS`), with three new helpers in `toon.py` that most buildings need: `gable` (a pitched roof or a pediment), `hip` (a hipped roof) and `arch` (a round-headed door, window or niche). Mireuksa's pagoda stands at Iksan (36.01227, 127.03077, in North Jeolla), part of its serial site, rather than on the landmark's point at Gongju; Port Royal's spot is on the Palisadoes spit, which Jamaica's map draws coarsely, so its test checks it's within Saint Andrew's bounds.

| Country | Model id | Maps | Landmark (name in the data: latitude, longitude, Wikidata) | What to draw | On the map |
| --- | --- | --- | --- | --- | --- |
| Canary Islands | `san-cristobal-de-la-laguna` | IC | San Cristóbal de La Laguna: 28.48528, -16.31667, Q54898 | La Laguna's colonial grid: the cathedral's twin-towered front, the Concepción church's tall Mudéjar tower and the low painted houses | Yes |
| Bolivia | `potosi` | BO | Potosí: -19.58917, -65.75333, Q35045 | Potosí's Casa de la Moneda and the cathedral's white towers, the red cone of Cerro Rico behind | Yes |
| Iraq | `ashur` | IQ | Ashur: 35.45667, 43.2625, Q200200 | Ashur's ziggurat mound and city walls on the cliff over the Tigris | No: Hatra shows |
| Pakistan | `taxila` | PK | Taxila: 33.74583, 72.7875, Q156093 | Taxila's Dharmarajika stupa and the monastery cells round it | No: Takht-i-Bahi shows |
| India | `nalanda` | IN | Nalanda Mahavihara: 25.1368, 85.44383, Q216243 | Nalanda's great brick temple of Sariputta with its corner towers and stairs, the monastery's rows of cells | No: Mahabodhi Temple shows |
| Turkey | `catalhoyuk` | TR | Çatalhöyük: 37.6675, 32.82833, Q192522 | Çatalhöyük's mud-brick houses packed together, entered by ladders through the roofs | Yes |
| Turkmenistan | `merv` | TM | Ancient Merv: 37.66278, 62.1925, Q193325 | Merv's Mausoleum of Sultan Sanjar: the great brick cube and its dome, the fluted walls of the Kyz Kala | Yes |
| India | `sarnath` | IN | Sarnath: 25.38111, 83.02139, Q324394 | Sarnath's Dhamek Stupa, its great round drum with carved bands, in its park of ruins | Yes |
| Turkmenistan | `kunya-urgench` | TM | Kunya-Urgench: 42.32613, 59.15307, Q48472 | Kunya-Urgench's tall tapering Kutlug Timur minaret and Turabek Khanum's mausoleum with its pointed dome | Yes |
| Angola | `mbanza-kongo` | AO | Mbanza Kongo: -6.26667, 14.25, Q500189 | The ruined walls of Kulumbimbi, the old cathedral of Mbanza Kongo, and the sacred tree | Yes |
| Yemen | `zabid` | YE | Historic Town of Zabid: 14.2, 43.31667, Q138986 | Zabid's whitewashed houses and the Great Mosque's minaret, the Asha'ir mosque's courtyard | Yes |
| Israel | `megiddo` | IL | Biblical Tels (Megiddo): 32.58528, 35.18444, Q208379 | Tel Megiddo's mound with its city gate, the round Canaanite altar and the stables | No: Bahá'í Gardens shows |
| Germany | `pile-dwellings` | DE | Alpine Pile Dwellings (Lake Constance): 47.6746, 9.12099, Q4580 | Unteruhldingen's thatched houses on stilts over Lake Constance, the walkways between them | Yes |
| Hungary | `holloko` | HU | Hollókő: 47.99611, 19.59167, Q622865 | Hollókő's white village houses with wooden balconies, the little church tower, the castle on its hill | Yes |
| Jordan | `as-salt` | JO | As-Salt: 32.03917, 35.72722, Q867586 | As-Salt's yellow stone houses stacked up its hills, the Abu Jaber house's arched windows | Yes |
| Greece | `philippi` | GR | Philippi: 41.01207, 24.28458, Q379652 | Philippi's Basilica B with its great piers, the forum's columns and the theatre | Yes |
| Guatemala | `quirigua` | GT | Quiriguá: 15.26944, -89.04028, Q318422 | Quiriguá's tall carved Maya stelae and the zoomorph boulders on their lawn, the forest round them | Yes |
| Iran | `alamut` | IR | Alamut Castle: 36.44472, 50.58611, Q4706020 | Alamut Castle's ruined walls on top of its rock, the valley below | Yes |
| Iran | `takht-e-soleyman` | IR | Takht-e Soleyman: 36.60472, 47.23417, Q115253 | Takht-e Soleyman's oval walls round the crater lake, the fire temple's arches | Yes |
| Slovakia | `vlkolinec` | SK | Vlkolínec: 49.0397, 19.2784, Q392365 | Vlkolínec's log houses in bright colours along the brook, the wooden bell tower | Yes |
| Cyprus | `choirokoitia` | CY | Choirokoitia: 34.79673, 33.34372, Q385086 | Choirokoitia's round stone houses with flat roofs, rebuilt on the hillside | Yes |
| India | `pattadakal` | IN | Pattadakal: 15.95133, 75.81464, Q817250 | Pattadakal's temples: the Virupaksha temple's stepped tower and its pillared hall, the smaller shrines | Yes |
| Malta | `ggantija` | MT | Megalithic Temples of Malta (Ġgantija): 36.04727, 14.2691, Q216862 | Ġgantija's megalithic temple: the great curved wall of huge stones and the trilithon doorway | Yes |
| Italy | `villa-romana-del-casale` | IT | Villa Romana del Casale: 37.36472, 14.33455, Q505617 | The Villa Romana del Casale's rooms under their protective roofs, the mosaic floors seen from the walkways | No: Valley of the Temples shows |
| India | `dholavira` | IN | Dholavira: 23.88611, 70.21667, Q9468 | Dholavira's stone citadel and the great stepped reservoir of the Harappan city | No: Rani ki Vav shows |
| Peru | `caral` | PE | Caral: -10.89361, -77.52028, Q219279 | Caral's stepped pyramids and the sunken circular plaza in the desert valley | Yes |
| Czechia | `holasovice` | CZ | Holašovice: 48.96667, 14.26667, Q826452 | Holašovice's baroque farmhouse gables round the village green, the chapel in the middle | Yes |
| Belgium | `stoclet-house` | BE | Stoclet House: 50.83514, 4.41625, Q239028 | The Stoclet Palace's white marble walls edged in bronze, its stepped tower crowned by figures | No: Grand Place shows |
| China | `dazu` | CN | Dazu Rock Carvings: 29.71333, 105.70694, Q651278 | Dazu's Baodingshan cliff with the great reclining Buddha and the painted figures carved in the rock | No: Leshan Giant Buddha shows |
| Iran | `tabriz-bazaar` | IR | Tabriz Bazaar: 38.08077, 46.29229, Q4399 | Tabriz Bazaar's brick domes in rows over its halls, the great vaulted timcheh | Yes |
| Jamaica | `port-royal` | JM | Port Royal: 17.9375, -76.84139, Q685357 | Port Royal's Fort Charles with its cannons, the tilted Giddy House and St Peter's church | Yes |
| Madagascar | `ambohimanga` | MG | Royal Hill of Ambohimanga: -18.75917, 47.56278, Q458167 | The Royal Hill of Ambohimanga: the wooden palace of the kings and the gate with its stone disc | Yes |
| Poland | `muskau` | PL | Muskau Park: 51.54756, 14.72323, Q156308 | Muskau's castle in its landscape park, the bridges over the Neisse | Yes |
| Algeria | `kasbah-of-algiers` | DZ | Kasbah of Algiers: 36.78333, 3.06028, Q662102 | The Kasbah of Algiers' white houses tumbling down to the sea, the Ketchaoua mosque's towers | Yes |
| Bulgaria | `ivanovo` | BG | Rock-Hewn Churches of Ivanovo: 43.69556, 25.98806, Q503387 | Ivanovo's churches cut into the cliffs of the Rusenski Lom, the river below | Yes |
| Germany | `lorsch` | DE | Lorsch Abbey: 49.65369, 8.56858, Q157550 | Lorsch Abbey's Carolingian gatehouse with its patterned red and white stone and three arches | No: Wedding Tower, Darmstadt shows |
| Italy | `crespi-dadda` | IT | Crespi d'Adda: 45.59667, 9.53611, Q726842 | Crespi d'Adda's cotton mill and its chimney, the workers' houses in rows | No: Santa Maria delle Grazie shows |
| Netherlands | `schokland` | NL | Schokland: 52.63861, 5.77167, Q140869527 | Schokland's little church on its mound in the drained polder, the old harbour's posts | No: Wouda Steam Pumping Station shows |
| Peru | `chavin` | PE | Chavín de Huántar: -9.59277, -77.17845, Q732554 | Chavín de Huántar's stone temple, the Castillo, with its carved heads and sunken plaza | Yes |
| Bulgaria | `kazanlak` | BG | Thracian Tomb of Kazanlak: 42.62556, 25.39917, Q301815 | The Thracian Tomb of Kazanlak's grassy mound and the shelter over its painted beehive tomb | Yes |
| India | `santiniketan` | IN | Santiniketan: 23.6776, 87.6852, Q1026431 | Santiniketan's glass prayer hall, the Upasana Griha, and Kala Bhavana's sculptures under the trees | Yes |
| Sweden | `engelsberg` | SE | Engelsberg Ironworks: 59.96917, 16.01028, Q936884 | Engelsberg's blast furnace and the manor house by the lake | No: Falun Copper Mine shows |
| Belgium | `spa` | BE | Great Spa Towns of Europe (Spa): 50.49222, 5.86694, Q16064866 | Spa's grand baths and the Pouhon Pierre-le-Grand's pavilion, the casino | Yes |
| Brazil | `paraty` | BR | Paraty and Ilha Grande: -23.21944, -44.71472, Q926729 | Paraty's whitewashed colonial houses and the Santa Rita church by the water, boats at the quay | No: Christ the Redeemer + Church of São Francisco de Assis shows |
| India | `champaner` | IN | Champaner-Pavagadh: 22.48333, 73.53333, Q844427 | Champaner's Jama Masjid with its two tall minarets and carved front | No: Rani ki Vav shows |
| Iran | `sheikh-safi` | IR | Sheikh Safi al-Din Shrine, Ardabil: 38.24861, 48.29139, Q4243 | Sheikh Safi's shrine with its tiled Allah-Allah tower and the courtyard | Yes |
| Mexico | `xochicalco` | MX | Xochicalco: 18.80431, -99.29664, Q797120 | Xochicalco's Pyramid of the Feathered Serpent with its carved slopes, on the hilltop | No: Teotihuacan shows |
| France | `fontenay` | FR | Fontenay Abbey: 47.63966, 4.38933, Q464918 | Fontenay Abbey's plain Cistercian church and cloister, the forge by the stream | No: Vézelay Abbey shows |
| Jordan | `umm-er-rasas` | JO | Umm er-Rasas: 31.49972, 35.91972, Q822842 | Umm er-Rasas' stylite tower standing alone, the walled ruins of the town | Yes |
| Poland | `churches-of-peace` | PL | Churches of Peace in Jawor and Świdnica: 51.05391, 16.18904, Q589634 | Świdnica's Church of Peace: the great half-timbered church and its bell tower | Yes |
| Serbia | `gamzigrad` | RS | Gamzigrad-Romuliana: 43.89931, 22.18617, Q904128 | Gamzigrad's Roman palace walls and round towers, the temple on its platform | Yes |
| Turkey | `gordion` | TR | Gordion: 39.65048, 31.97848, Q542854 | Gordion's great Midas Mound and the citadel's gate | Yes |
| Belgium | `plantin-moretus` | BE | Plantin-Moretus Museum: 51.21829, 4.39816, Q595802 | The Plantin-Moretus house's courtyard, the printers' workshop with its presses | Yes |
| Germany | `corvey` | DE | Corvey Abbey: 51.77778, 9.41, Q56004 | Corvey's Carolingian westwork with its two towers, the baroque abbey beside it | No: Fagus Factory shows |
| Russia | `ferapontov` | RU | Ferapontov Monastery: 59.95639, 38.5675, Q838256 | The Ferapontov Monastery's white churches with their domes and the gate church, by the lake | No: Kizhi Pogost shows |
| Zimbabwe | `khami` | ZW | Khami Ruins: -20.14329, 28.42344, Q938685 | Khami's stone terraces with their chequered walls, on the hill by the river | Yes |
| Bolivia | `samaipata` | BO | Fuerte de Samaipata: -18.17836, -63.81899, Q876451 | The great carved rock of Samaipata with its channels and niches, on its green ridge | Yes |
| Finland | `verla` | FI | Verla Mill: 61.06199, 26.64002, Q217447 | Verla's red brick board mill with its arched windows, the rapids beside it | Yes |
| Mexico | `tlacotalpan` | MX | Tlacotalpan: 18.61303, -95.65627, Q903792 | Tlacotalpan's colourful arcaded houses and the church by the river | Yes |
| Ukraine | `chernivtsi` | UA | Residence of Bukovinian Metropolitans: 48.29664, 25.92491, Q156067 | The Residence of the Bukovinian Metropolitans: red brick wings with patterned tile roofs and the seminary church | Yes |
| Finland | `old-rauma` | FI | Old Rauma: 61.12827, 21.51321, Q828417 | Old Rauma's painted wooden houses and the Church of the Holy Cross | Yes |
| Germany | `worlitz` | DE | Dessau-Wörlitz Garden Realm: 51.8636, 12.2814, Q157543 | Wörlitz palace in its English park, the Gothic house and the bridges on the lake | No: Bauhaus Dessau shows |
| Italy | `stupinigi` | IT | Residences of the House of Savoy: 45.0725, 7.68583, Q461272 | Stupinigi's hunting lodge with its dome topped by the bronze stag, the wings round the court | Yes |
| South Korea | `namhansanseong` | KR | Namhansanseong: 37.47803, 127.18419, Q562529 | Namhansanseong's fortress gate and walls winding over the hills | No: Gyeongbokgung Palace shows |
| United Kingdom | `saltaire` | GB, XE | Saltaire: 53.83717, -1.79026, Q838920 | Salts Mill with its Italianate chimney, the workers' terraces and the church | No: Fountains Abbey shows |
| Israel | `white-city` | IL | White City of Tel Aviv: 32.07778, 34.77389, Q159070 | Tel Aviv's White City: white Bauhaus blocks with rounded balconies | Yes |
| Mauritius | `aapravasi-ghat` | MU | Aapravasi Ghat: -20.15861, 57.50306, Q9276 | The Aapravasi Ghat's stone steps and buildings by Port Louis' harbour | Yes |
| South Korea | `hahoe` | KR | Hahoe and Yangdong Villages (Hahoe): 36.53806, 128.52056, Q45865 | Hahoe's tiled and thatched houses in the river's bend, the cliff opposite | Yes |
| Switzerland | `mustair` | CH | Convent of St John, Müstair: 46.62917, 10.44778, Q757067 | The Convent of St John at Müstair: the church's three apses and the tower | Yes |
| Cyprus | `troodos` | CY | Painted Churches of Troodos: 34.92028, 33.09583, Q462702 | A Troodos painted church with its steep wooden roof down to the ground, in the mountains | Yes |
| France | `saint-savin` | FR | Saint-Savin Abbey Church: 46.56477, 0.86597, Q1774129 | Saint-Savin's abbey church with its tall spire over the river | Yes |
| Iraq | `erbil-citadel` | IQ | Erbil Citadel: 36.191, 44.009, Q206236 | Erbil Citadel's walls on top of its tell, the gate | Yes |
| Chile | `sewell` | CL | Sewell Mining Town: -34.085, -70.3825, Q588417 | Sewell's colourful mining houses climbing the mountainside by stairs | No: Valparaíso shows |
| Germany | `bayreuth-opera` | DE | Margravial Opera House, Bayreuth: 49.94434, 11.57866, Q278908 | The Margravial Opera House's front with its balcony and statues | No: Old Town Hall, Bamberg shows |
| Ghana | `asante-shrine` | GH | Asante Traditional Buildings: 6.40111, -1.62583, Q1141003 | An Asante shrine house with its red and white relief walls and thatched roofs | Yes |
| India | `ramappa` | IN | Ramappa Temple: 18.25944, 79.9425, Q3380656 | The Ramappa Temple's carved tower and its pillared hall, the bracket figures | Yes |
| Chile | `humberstone` | CL | Humberstone Saltpeter Works: -20.20833, -69.79444, Q572895 | Humberstone's saltpeter works: the rusted machinery and the chimney in the desert | Yes |
| Italy | `boboli` | IT | Medici Villas and Gardens (Boboli): 43.7618, 11.24661, Q888825 | The Boboli Gardens behind the Pitti Palace, the amphitheatre and the fountain | No: Two Towers of Bologna + Leaning Tower of Pisa shows |
| Japan | `nachi` | JP | Kii Mountains Sacred Sites (Kumano): 33.83694, 135.77639, Q611345 | Nachi's red three-storey pagoda in front of the tall Nachi Falls | No: Himeji Castle shows |
| Sweden | `halsingland` | SE | Decorated Farmhouses of Hälsingland: 61.70722, 16.19583, Q1642003 | A Hälsingland farmhouse painted red with white corners, its decorated porch | Yes |
| United Kingdom | `cromford` | GB, XE | Derwent Valley Mills: 53.108, -1.556, Q646076 | Cromford Mill's stone mill buildings by the river, the mill pond | No: Jodrell Bank Observatory shows |
| Cambodia | `sambor-prei-kuk` | KH | Sambor Prei Kuk: 12.86728, 105.04002, Q1818746 | Sambor Prei Kuk's octagonal brick temple towers in the forest | Yes |
| China | `jiangjun-tomb` | CN | Koguryo Capital Cities and Tombs: 41.15694, 126.18722, Q134873 | The Jiangjun Tomb's stepped granite pyramid | Yes |
| Oman | `qalhat` | OM | Ancient City of Qalhat: 22.7, 59.3699, Q680322 | Qalhat's Bibi Maryam mausoleum, its ruined dome on the shore | Yes |
| Romania | `sarmizegetusa` | RO | Dacian Fortresses of Orăștie: 45.6231, 23.3119, Q729327 | Sarmizegetusa Regia's sanctuaries: the rows of andesite pillars and the circle in the forest | Yes |
| Oman | `bat-tombs` | OM | Bat, Al-Khutm and Al-Ayn: 23.27, 56.745, Q25496 | Al-Ayn's beehive tombs along the ridge, Jebel Misht behind | Yes |
| Venezuela | `caracas-university` | VE | Ciudad Universitaria de Caracas: 10.49083, -66.89056, Q1061531 | The Ciudad Universitaria's clock tower and modernist halls | Yes |
| Greenland | `hvalsey` | GL | Kujataa: 61.16444, -45.59806, Q32904732 | Hvalsey's Norse stone church ruin by the fjord, sheep grazing | Yes |
| Mexico | `paquime` | MX | Paquimé: 30.37583, -107.95556, Q853265 | Paquimé's maze of adobe walls and T-shaped doors | Yes |
| Sweden | `gammelstad` | SE | Gammelstad Church Town: 65.64611, 22.02861, Q1756286 | Gammelstad's stone church with the red church cottages round it | Yes |
| Israel | `avdat` | IL | Incense Route Desert Cities: 31.0975, 34.65778, Q477578 | Avdat's Nabataean acropolis on its hill: the churches and the Roman tower | Yes |
| Netherlands | `eisinga` | NL | Eisinga Planetarium: 53.18738, 5.54375, Q601223 | Eisinga's house in Franeker with the planetarium in its ceiling | Yes |
| Spain | `lugo-walls` | ES | Roman Walls of Lugo: 43.01419, -7.55989, Q2733427 | Lugo's Roman walls with their round towers ringing the old town | Yes |
| Czechia | `litomysl` | CZ | Litomyšl Castle: 49.87344, 16.31265, Q2164885 | Litomyšl Castle's Renaissance arcades and sgraffito walls | Yes |
| Denmark | `eremitage` | DK | Par Force Hunting Landscape: 55.9136, 12.3578, Q10620357 | The Eremitage hunting lodge on its open hill, deer on the grass | No: Kronborg Castle shows |
| Kenya | `thimlich-ohinga` | KE | Thimlich Ohinga: -0.89134, 34.32611, Q3524629 | Thimlich Ohinga's dry-stone enclosures among the trees | Yes |
| China | `xixia-tombs` | CN | Xixia Imperial Tombs: 38.43503, 105.98717, Q1069411 | The Xixia tombs' great earthen beehive mounds before the Helan Mountains | Yes |
| Japan | `chusonji` | JP | Hiraizumi: 38.98861, 141.11028, Q2896261 | Chūson-ji's golden Konjikidō hall in its shelter among the cedars | Yes |
| Lebanon | `beaufort-castle` | LB | Mount Amel Castles (Beaufort): 33.32471, 35.53215, Q476801 | Beaufort Castle's ruined walls on the cliff above the Litani | Yes |
| South Korea | `mireuksa` | KR | Baekje Historic Areas: 36.46194, 127.12722, Q20650483 | The Mireuksa stone pagoda of the Baekje kingdom | Yes |

0 of the first models and 0 of the extra ones need a landmark row added first.

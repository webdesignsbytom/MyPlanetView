# Waiting on you

Decisions and checks only you can make. Nothing here blocks the build: each item says what the code does until you decide. When you've answered one, tell Claude and it moves the answer into the right doc and deletes it from here.

Started 16 Nov 2026.

## 1. Proofread the next 20 country guides

**What this is:** the second batch of public country guides, written as drafts on 16 Nov in the same format as the first 20 (which you passed and are now published): United Kingdom, Belgium, Austria, Czechia, Poland, Hungary, Denmark, Norway, Sweden, Finland, Malta, Cyprus, India, Indonesia, South Korea, China, South Africa, Kenya, Brazil and Argentina (the popular countries that already have a poster). They're hidden from the live site until you pass them.

**What you do:** run `npm run dev` in `client/`, open `/countries/<name>` (e.g. `/countries/united-kingdom`) and read each as a traveller would.

**What to tell Claude:** which ones you pass (it sets `"status": "checked"` and the date), and any fact you know is wrong.

**Facts worth your eye, least sure first in each country:**
- **United Kingdom:** the languages line calls Gaelic, Scots, Irish, Ulster Scots and Cornish "recognised" (the Scottish Languages Act 2025 may have made Gaelic and Scots official in Scotland); NHS 111 in England, Scotland and Wales but not Northern Ireland; tipping 10–12.5%; midges worst June to August on the west coast; the Welsh and Gaelic pronunciations.
- **Belgium:** Ommegang "usually two evenings in early July"; the Flower Carpet in even-numbered years; mussels about July to April; Brussels hotels cheaper at weekends; Sunday opening.
- **Austria:** Slovene, Croatian and Hungarian official in parts of Carinthia and Burgenland (not from Wikidata); the Alps "around two-thirds" of the country; the ski season; November rated "avoid" in the Alps (lifts and huts shut between seasons).
- **Czechia:** July and August rated "good", not "best", because of Prague's crowds (a judgement call); paper tickets to stamp in Prague; big shops shut by law on some holidays; the most beer per person; the ř and ň pronunciations.
- **Poland:** Silesian not official (the 2024 bill was vetoed: check for later changes); "a handful of trading Sundays"; Auschwitz free on your own, guided tours paid, booking online; jaywalking fines; Chopin recitals in Łazienki Park on summer Sundays; saying "dziękuję" as you pay means "keep the change".
- **Hungary:** Budapest Wine Festival "usually in September"; the light show on St Stephen's Basilica at the Christmas market; telling the waiter the total instead of leaving a tip on the table. Sziget and the Gellért baths are left out on purpose (2026 plans unclear).
- **Denmark:** Aarhus Festuge late August to early September; "several hundred islands"; stegt flæsk "often called the national dish"; plugs C, E, F and K.
- **Norway:** supermarket beer until 8 pm on weekdays and 6 pm on Saturdays (the national limit; some towns stop earlier); the right to roam (150 m from houses, two nights) and the fire ban 15 April to 15 September; Pepperkakebyen in Bergen; Svalbard keeping the same time.
- **Sweden:** Medieval Week in Visby "usually early August"; lobster season from late September; the Jokkmokk market in early February; May rated "avoid" in Lapland (the thaw); the pronunciations.
- **Finland:** "nearly 188,000 lakes"; alcohol sold 9 am to 9 pm; two candles in each window on Independence Day; May "avoid" in Lapland; the midnight sun and polar night dates.
- **Malta:** Notte Bianca "usually one night in early October"; no stiletto heels in St John's Co-Cathedral; small shops closing after lunch; the Maltese pronunciations.
- **Cyprus:** about the Republic only; the island's division since 1974, the UN buffer zone and the crossing points are described neutrally. 230–240 V (Wikidata says 240 V, noted); hire cars' red plates and their limits on crossing north; snow on Mount Olympus January to March; Limassol Carnival timing.
- **India:** the older emergency numbers (100, 101, 102/108) still working beside 112; the monsoon dates; Ladakh's roads open about June to October; the regional month ratings, especially Tamil Nadu (November "avoid") and Ladakh (five "avoid" months).
- **Indonesia:** the emergency numbers 110, 113 and 119 (not in Wikidata, noted); Rinjani closed to climbers early in the year; Sumatra driest June to August; Raja Ampat calmest October to April; Lebaran "usually in February or March in the late 2020s"; 230 V (Wikidata also lists 127 V, noted).
- **South Korea:** the 1330 Korea Travel Hotline (not in Wikidata, noted); the festival timings (Jinhae cherry blossom, Boryeong Mud Festival, Busan film festival); cherry blossom late March in the south, early April in Seoul; restaurants that won't seat one diner.
- **China:** the pinyin tone letters (ǎ, ǐ, ǒ, ǔ) and the characters show in a fallback font (the site's Poppins doesn't have them; Japan's page is the same); the Tibet permit rules; Alipay and WeChat Pay taking foreign cards; roaming data from a home SIM not blocked; international driving permits not recognised; Harbin's festival late December into February at around −20°C.
- **South Africa:** the emergency numbers 10111 and 10177 added (Wikidata has only 112); the plug wording (Type M, Type N in newer buildings); festival timings (Minstrel Carnival around 2 January, Hermanus whales late September or early October, the Durban July); the stamp says "Mzansi" (the popular name): you may prefer "South Africa".
- **Kenya:** the Lamu Cultural Festival "usually in November" (least sure); the plastic bag ban and bags taken from luggage on arrival; about 15 kg in a soft bag on small safari planes; no off-road driving in the Mara; M-Pesa with a local SIM.
- **Brazil:** 127 V or 220 V "depending on the city"; Pix usually needing a Brazilian bank account; Parintins "usually the last weekend of June"; the Pantanal strip's January and February "avoid"; summer time ended in 2019 (Wikidata still lists it).
- **Argentina:** 107 for an ambulance added and 117 left out (Wikidata doesn't say what it is); payment advice kept general (the exchange rules keep changing); Guaraní official in Corrientes since 2004; Tango BA "usually in August"; Patagonia's June to August "avoid".
- **Everywhere:** the month ratings are judgement calls; the pronunciation guides.

**Until then:** none of these 20 is built or listed on the live site.

**Also to read: the twelve "Where to go in <month>" pages** (built 16 Nov). Each has a short introduction of its own (`client/src/content/months/<month>.json`); the countries under it come from the guides you've passed, so they need no extra reading. Open `/where-to-go/january` and the rest in `npm run dev` (the month buttons at the foot of each page go through the year). Tell Claude which months to pass. A passed month goes live with the next build, since the 20 published guides already give every month enough countries. Until then no month page is built.

## 1b. Proofread the other 186 country guides

**What this is:** every other country on the map now has a guide, written as drafts on 18 Nov in the same format as the first 40, so all 226 have one. Each passes the build's checks (format, title, description). The practical facts come from one Wikidata query that day; where Wikidata had no statement (mostly a territory's plugs or emergency number), the fact carries a note saying where it comes from.

**What you do:** as in section 1: `/countries` in `npm run dev` lists them all by continent, each marked Draft.

**What to tell Claude:** which ones you pass (it sets `"status": "checked"` and the date). A passed guide goes into the sitemap, the pre-rendered pages and the installed app's pages by itself at the next build.

**Until then:** none of these is built, listed on the live site or in the sitemap.

**Facts worth your eye**, by batch, as the writers reported them ("noted" means the file's facts say why the page departs from Wikidata):

**Europe 1 (AL AD BY BA BG EE FO GI XK LV LI LT LU)**
- AL, AD, LT: 230 V where Wikidata says 220 V (noted). AD: 118 left out (Wikidata gives no use; noted).
- Albania: "Great Bajram" for Eid al-Fitr; Mount Tomorr pilgrimage "usually late August".
- Andorra: parish festes majors "usually July and August"; Sant Joan bonfires named for Andorra la Vella and Sant Julià de Lòria.
- Bosnia: Baščaršija Nights "usually through July"; Mostar diving "usually late July".
- Bulgaria: Kazanlak Rose Festival parade "a weekend in early June".
- Estonia: Song Festival every five years, last 2025. Latvia: Song and Dance Festival last 2023, next expected 2028.
- Faroes: G! Festival "usually mid-July"; Summarfestivalurin "usually August"; respellings approximate.
- Gibraltar: Trafalgar Day ceremony "usually on or near 21 October" (held every year?).
- Kosovo: passport for the guarded Serbian monasteries; Dokufest "usually early August"; "extra care in the north, around Mitrovica".
- Liechtenstein: Hafaläb description; Alpabfahrt at Malbun and Steg "usually September"; National Day reception open to all.
- Luxembourg: the Octave "two weeks from the third Sunday after Easter".

**Southern Africa and the Indian Ocean (KM MG MU RE YT SC MW MZ ZM ZW NA BW LS SZ)**
- Emergency numbers taken from Wikidata but unconfirmed: Comoros (17 police, 18 medical, 772 03 73 fire; 18 may be fire), Mozambique (119/117/198; other lists swap 117 and 198), Lesotho (112/114/115). Zambia drops Wikidata's 911 and 991; Botswana drops 911 (noted).
- Réunion 230 V vs Wikidata 220 V; Madagascar drops 127 V; Mayotte plugs C and E (no statement; noted).
- Malawi: English the language of government, Chichewa national (Wikidata also lists Tumbuka; noted). Zimbabwe: US dollar and ZiG (since 2024), rand mentioned.
- Festival dates: Donia on Nosy Be at Pentecost; Sakifo late May/early June; La Digue 15 August; Festival Kreol last week of October; Mayotte Abolition Day 27 April; Kulamba late August; Windhoek Oktoberfest; Herero Day weekend nearest 26 August.
- Words: Bemba "Ni shinga?", "Shaleenipo", "Mwaiseni" (stamp); Malagasy respellings; Comorian "Mkatra foutra"; siSwati "Sidvudvu", "Umncweba"; Lesotho's flag colours outside a house selling joala.
- Seychelles "topless sunbathing frowned on outside resorts"; Mayotte and Mozambique (Cabo Delgado) end with travel-advice lines.

**West and Central Africa (GW GN SL LR CI GH TG BJ NG CM CF GQ GA)**
- Travel advice: CAR full paragraph; Nigeria (north-east, north-west, some Delta states) and Cameroon (Far North, North-West, South-West, CAR border) a paragraph; Guinea-Bissau, Guinea, Côte d'Ivoire, Ghana, Togo, Benin one sentence.
- Emergency numbers unconfirmed: Guinea-Bissau (112; 121/119/180), Sierra Leone (999/019; maybe a newer number), Gabon (1300, 1722, 18; police may be 1730). Guinea leaves out ambulance 442-020 (noted); Ghana not given 112 (not in Wikidata); Cameroon adds 117 and 118 to 112 (noted).
- Equatorial Guinea: Malabo deliberately not called the capital (the move to Ciudad de la Paz).
- Dates: Liberia's Decoration Day (2nd Wednesday of March) and Thanksgiving (1st Thursday of November); Ghana's Aboakyer (1st weekend of May), Fetu Afahye (1st Saturday of September), Hogbetsotso (1st Saturday of November), Emancipation Day ~1 August; Togo's Epe Ekpe (September), Evala (July); Benin's Vodun festival over several days around 10 January; Felabration ~15 October; Ngondo late November/early December; CAR national day 1 December; Côte d'Ivoire's Abissa, Paquinou, FEMUA (April or May); Gabon 16 August also a holiday.
- Words and details: Guinea-Bissau Kriol phrases, Cabral's tomb in Amura fortress; Pular "A jaraama"; Liberian English phrases; Ewe "Efɔa?", "Nenie?"; Sango phrases; GQ "pepesup", "malamba"; Sierra Leone's masquerade "devils", Lumley Beach kites, "Pray Day"; Monrovia ~4,500 mm rain; Abidjan's orange taxis; Cotonou zémidjan yellow shirts; Ghana greeting right to left; Dalaba nights ~10°C.

**Middle East (AE BH IQ IL JO KW LB OM PS QA SA SY YE IR)**
- **Israel and Palestine: read the wording on Jerusalem, the West Bank's areas and who runs what, for neutrality.** Israel: Arabic's "special status" since 2018 (noted). Both: Type D plug left out (noted). Palestine: 100/101/102 (no Wikidata statement), clocks not always changing with Israel's, Egyptian pound left out.
- Emergency: Oman 9999 (Wikidata's 112 and "968" left out; does 112 work?); Iraq 911 plus 104/115/122 (still working?); Saudi "911 for all; 999 police; 112 too" (911 nationwide?); Yemen only 199.
- Oman National Day 20 November (moved from 18 November). Jordan UTC+3 all year since 2022 (Wikidata still UTC+2; noted). Lebanon: French "used by law", not official (noted); travel advice names the south and the Syrian border.
- Syria: holidays and any redenomination left out; "foreign cards often don't work" may be dated. Iran: rial and toman only (zeros removed from the rial in 2025: new notes yet?).
- "Usually": Jerash (July, into August), Baalbek/Beiteddine/Byblos (July–August), Bahrain GP (March or April), Abu Dhabi GP (late November/early December), Riyadh Season (October into the new year), Hala February, Khareef (July–August). Bahrain's Ashura a public holiday; Qatar's Ramadan cannon at Souq Waqif; National Sport Day 2nd Tuesday of February; Petra's Monastery ~800 steps; Rijal Almaa "on the slopes below" Abha.
- Dialect spellings: Kuwaiti "Bcham?", "Shakhbarak?"; Omani "Ish al-akhbar?"; Saudi "Wish lonak?", "Taal umrak"; Yemeni "bish / ma bish"; Syrian "Tikram".


**North and West Africa (DZ LY TN EH MR ML NE TD BF SN GM CV IC)**
- Western Sahara: plugs and emergency numbers are Morocco's (no statement; noted); Throne Day and Green March Day described as Moroccan holidays in the towns Morocco runs. Canary Islands: 112 and +34 are Spain's (no statement; noted).
- Algeria plugs C, E, F (Wikidata; IEC lists C and F); Sebiba in June 2027 (from Ashura), "two old quarters compete"; Yennayer "often couscous with chicken". Libya 230 V only (127 V left out; noted).
- Languages: Mali's 13 national languages official (2023 constitution); Burkina "national languages official" (December 2023); Niger Hausa "the national language" (2025, loosely); Mauritania French "widely used, not official"; Cape Verde only Portuguese official.
- Dates: Festival of the Ancient Cities (November or December); Djenné replastering (spring); Diafarabé crossing (December); FESPACO odd years (2027); Saint-Louis Jazz (May or early June); Grand Magal 2027 late July (estimated); La Orotava carpets around Corpus Christi; Niger's 3 August also tree-planting day.
- Emergency: Niger only 17 and 18; Gambia police 112 (some say 117).
- Words: Libyan "Shlonak?", "Bkam?"; Hassaniya "Ishtari?", "Kettar kheirak", "tichtar"; Zarma "Fofo"; Chadian "Lâfe?", daraba, kissar; Mooré "Barka wusgo", "Ne y zabre", "saghbo"; Mandinka "Fo tuma doo", "I ning somo", "salibo". Zakouma camps December to June; crocodiles at Guelta d'Archei; Santo Antão's model ships at São João.

**East and South-East Asia (BN KH LA MY MM KP PH SG TW TL VN)**
- Travel advice: Myanmar, North Korea (organised tours only), the Philippines (parts of Mindanao and Sulu). Taiwan: a neutral paragraph on who governs it.
- Facts: Brunei Malay the only official language (Wikidata also English; noted); Malaysia "112 also works from a mobile" (noted) and 240 V kept (maybe 230 V now); Myanmar plug read as Type D (noted); North Korea "Type A and 110 V also found", no emergency number (noted), euros or yuan; Timor-Leste "112 for emergencies".
- Details: Brunei's Hari Raya open house at Istana Nurul Iman; robes lent at Brunei's and Singapore's mosques; kelupis; Angkor 1/3/7-day passes and sunrise at both equinoxes; Pchum Ben's three days; Pi Mai 14–16 April; Malaysia's Sabah and Sarawak ratings and the east-coast islands closing November to February; Inle and Kalaw ~5°C nights; Ngapali closing in the rains; Phaung Daw U's leg-rowers; Taedonggang beer from Ushers of Trowbridge; Kimjongilia begonia, Kimilsungia orchid; Siargao surf August–November; Panagbenga (February and March); San Agustin the oldest stone church; Chingay after Chinese New Year; Singapore jaywalking (within 50 m); Taiwan temple doors right in, left out; Luye balloon festival; Dajia Mazu ~300 km; Timor-Leste south-coast second wet spell May–July, Maubisse ~10°C, Atauro's reef-fish counts, no overnight stays on Jaco, "Obrigadu/Obrigada"; Vietnam's blue 20,000 and 500,000 notes, Type G in some hotels, Hoi An lantern night on the 14th of each lunar month, National Day with a second holiday.

**Caucasus, Central and South Asia (AF AM AZ GE KZ KG TJ TM UZ MN PK BD BT NP LK MV)**
- Emergency: Afghanistan 100/101/102 (police may be 119); Tajikistan, Uzbekistan, Turkmenistan add 101/102/103 (TM 01/02/03) to 112 (still working?); Georgia's 112 replacing 111/113/122 "since about 2012"; Kyrgyzstan's 161 and Mongolia's 105 left out (unknown service); Nepal adds tourist police 1144; Sri Lanka adds 1990 (Suwa Seriya).
- Plugs: Afghanistan C and F at 220 V (Wikidata 240 V and British types; noted); Turkmenistan type B kept; Pakistan type G "in some newer buildings"; Bangladesh C, D, G (Wikidata also A and K); Maldives "mostly type G".
- Scripts: Dzongkha for "Gadem chi mo?" and "Log jay ge"; all the Thaana phrases.
- Dates: Areni Wine Festival early October; Baku GP "in recent years in September"; Goychay Pomegranate late October/early November; Tbilisoba October; Sharq Taronalari every two years in late August; Khövsgöl Ice Festival early March; Chilam Joshi mid-May; Shandur Polo early July; Orozo Ait "in 2027, in March"; Kazakhstan's Kurban Ait first day a holiday.
- Other: Afghanistan's Nowruz "much reduced"; Darvaza "weakened in recent years"; Naadam races 15–30 km; Nepal's 2023 licensed-guide rule; Maldives resorts' "island time"; Georgia's Easter-week grave visits; "black tea more usual in Tashkent".

**Caribbean 1 (AI AG AW BS BB BM VG BQ KY CU CW DM DO GP GD)**
- Phrase lists on the English-speaking islands are local Creole words and greetings: worth a native speaker's eye.
- Emergency: Bahamas adds 911 to 919 (noted); Barbados 211/311/511 only (911 left out; noted); BVI adds 911 to 999 (noted); Caribbean Netherlands 911 (no statement); Grenada ambulance 434/724/774 "depending on the area".
- Plugs and power: Anguilla Type A only, 110 V (B common too?); Antigua 230 V (some hotels 110 V?); Aruba includes Type F at 127 V (Wikidata); Caribbean Netherlands A and B, ~127 V Bonaire, 110 V Saba and Statia (no statement); Curaçao 120 V kept (others say 127 V); Guadeloupe's British plugs and UTC−3 left out (noted). Antigua: Spanish left out (noted).
- Money: Curaçao's Caribbean guilder from 2025; Cuba: cards unreliable, power cuts and shortages "in recent years", summer time March to early November (missing from Wikidata).
- Dates: Anguilla's Festival del Mar at Easter; Fox Hill Day 2nd Tuesday of August; Oistins Fish Festival at Easter; Dia di Rincon 27 April; Saba Carnival late July, Saba Day early December, Bonaire Day 6 September; Jazz Plaza January (some years December); Santiago carnival 2nd half of July; Seú on Easter Monday; Jounen Kwéyòl last Friday of October, World Creole Music Festival last weekend of October; Carriacou Maroon late April, Regatta early August; Fête des Cuisinières since 1916.
- Details: Little Bay by boat or rope; Barbuda frigatebirds nesting autumn and winter; Aruba's Dera Gai, King Momo burned on the last night, oxybenzone sunscreen ban; Bermuda's ~17% service charge, no hire cars for visitors, "ace boy"; Callwood distillery, "Rise and Shine Tramp", "down island"; "nor'wester", "Brachanal", Cayman's ~15%; Dominican Republic's stamp "Quisqueya", 10% "propina legal", Holy Thursday and Good Friday closures; Guadeloupe "Bonsoir" from mid-afternoon, manchineel red bands; phrases "Mudda sick!", "Wuh gine on?", "Kuantu e ta kosta?", "Pasa bon", "Mwen la", "Pa ni pwoblèm", "Sa ou fè?", "Ah eh able".

**Central and East Africa (CG CD ST AO SD SS ER DJ ET SO UG RW BI TZ)**
- Plugs: South Sudan "type C and British-style, 230 V, bring a universal adapter" (no statement; least sure); DR Congo, Sudan, Tanzania type D (Wikidata "British and related"; noted); Ethiopia C, E, F, L (British and J left out; noted).
- Time: Wikidata swaps Eritrea's and Ethiopia's tz zones; pages cite only UTC+3, with a correcting note.
- Emergency: Ethiopia 991/907/939 (Wikidata's 911 unexplained; noted); DR Congo, Congo, Burundi, Angola, Somalia taken as Wikidata gives them, unconfirmed.
- Ethiopian dates: Timkat 19 January (20 in 2028); Meskel 27 September and Enkutatash 11 September (28 and 12 in 2027).
- "Usually": Auto de Floripes mid-August; FESPAM July about every two years; Amani in February "in the years it goes ahead"; Nyege Nyege "in November in recent years"; Kwita Izina September or October; Mwaka Kogwa July. Burundi's Unity Day charter of 1991; Eritrea's Fenkil Day 10 February a holiday; Eritrea's travel permits worded loosely; Somaliland "most countries don't recognise it".
- Cards: "foreign cards work almost nowhere" (Sudan, Eritrea), "mainly large hotels" (Angola), "few places" (São Tomé).
- Words: Juba Arabic "Ita kweis?", "Bi kam?", "Mafi mushkila"; Kirundi "Bwakeye"; Luganda "Ssente mmeka?". Dishes: izaquente, cacharamba, helo-mur, jabana spices, merissa, akabenz's nickname, urwarwa, fah-fah, "poisson yéménite".

**Caribbean 2 and Greenland (HT JM MQ MS PR BL KN LC MF VC SX TT TC VI GL)**
- Time: Haiti keeps US summer time (Wikidata only UTC−5; noted); Turks and Caicos back on Eastern with summer time since 2018 (noted); Greenland mostly UTC−2/−1 since 2023, Ittoqqortoormiit from 2024, Pituffik UTC−4/−3, Danmarkshavn UTC+0 (noted).
- Power: Jamaica 110 V (Wikidata 116 V; noted); Martinique's British plugs left out (noted); Montserrat American plugs at 230 V; Saint Barthélemy C and E at 230 V (no statement; maybe 220 V); Saint Martin C and E at 220 V, Wikidata's 120 V moved to the Dutch side (noted); Sint Maarten A/B at 110 V (no statement); Saint Kitts G plus A/B at 230 V; Saint Vincent type G first of six.
- Emergency: Haiti police 122 (unconfirmed); Jamaica 119 and 110 only (112 and 911 left out; noted); Montserrat "911 or 999" and Sint Maarten 911 (no statement); Greenland 112.
- Rules: camouflage clothing banned (Jamaica, Saint Lucia, Saint Vincent, Trinidad); Jamaica's 2015 ganja law; USVI oxybenzone ban.
- Dates: Saut-d'Eau around 16 July ("Ezili" only); Montserrat's Festival ending at New Year, August Monday; Vaval burned on Ash Wednesday; Grand Case Tuesday nights; Sint Maarten's King Momo; Sugar Mas (loose); St Kitts Music Festival late June; Saint Lucia's Carnival in July since 1999; Tobago Heritage mid-July to early August; Conch Festival November; Maskanoo around Christmas, often Boxing Day; Transfer Day 31 March a holiday; Ilulissat's sun back ~13 January; Arctic Circle Race ~160 km over three days.
- Other: St Barths tipping "an extra 5–10%"; Bequia's double-ended boats; "Good night" as a USVI evening greeting; Creole "Sa ou fè ?", "Sa ka fèt?", "Mwen la".

**Central and South America (BZ CR SV GT HN NI PA BO CL CO EC FK GF GY PY PE SR UY VE)**
- No Wikidata statement (sources empty, noted): Chile's time zones (all ended: mainland UTC−4 with summer time, Magallanes UTC−3 all year, Easter Island UTC−6/−5); Falklands 999; French Guiana 112/15/17/18; Uruguay's language (Spanish).
- Emergency: Costa Rica 911 only (112 left out); Honduras 911 (national since 2015) for Wikidata's 199; Ecuador 911 only (ECU 911 replaced 101/102/131); Peru 105/116/106 (911, 111, 117 left out); Guyana 999 left out; unverified lists for Guatemala (110/120, 123, 128), Nicaragua fire (115 or 120), Bolivia (911, 110, 119, 160), Suriname (112, 115/111, 110, 113); Venezuela "171 in some areas".
- Power: Belize 110 V or 220 V, mostly 110 (Wikidata's 550 V wrong); Guyana "many buildings also 110–120 V" (Wikidata 240 V only); French Guiana's British sockets dropped; Bolivia "some 115 V sockets in La Paz"; Suriname 127 V.
- Money: El Salvador bitcoin voluntary since 2025; Venezuela's 2021 change (six zeros removed); Uruguay's "cubierto".
- Dates: La Ruta Maya ~280 km early March; Belize whale sharks March to June; El Salvador's August holidays 3–6; Santo Tomás the week before 21 December; La Ceiba carnival second half of May; Mejorana late September; Boquete fair January; Camp Sports February or March; Falklands Christmas races 26–27 December; Transchaco Rally September; Tañarandy's Good Friday procession.
- Rules and details: Pacaya only with a guide; Easter Island sites need a licensed guide; Tayrona's closures (loose); tap water unsafe in Bocas del Toro and Guna Yala; Cuyabeno's river levels; French Guiana's village permits and yellow fever/malaria (loose); Falklands' Battle Day ceremony, 6 m wildlife distance; Suriname's pangi custom; Noche de la Nostalgia's radio origin; Caracas roller-skating to Christmas masses; Bolas de Fuego's origin.
- Words: Kichwa "Alli puncha" (stamp too); Falklands "Kelper", "Johnny rook", "365"; Guyanese "Bai", "Gyaff", "Tek time", Mashramani's Arawak origin; Guaraní "Aguyje", "Hẽe", "Nahániri", "Jajotopata"; Sranan phrases.

**Oceania (AS FJ PF GU KI MH FM NR MP PW PG WS SB TO TV VU)**
- No Wikidata statement: French Polynesia plugs (C/E at 220 V, some US sockets); Marshall Islands plugs (A/B at 120 V); Northern Marianas plugs (US, 120 V) and 911.
- Emergency (departures noted): Fiji 917 police, 911 ambulance, 910 fire (fire 910 or 911?; 000 and 919 left out); French Polynesia adds 15/17/18 (does 112 work?); Kiribati 192/193/194, 195 for Betio (999 left out); Micronesia: 911 doesn't reach police in Chuuk (111 left out); Tonga 922/933/999 (911/927/928 left out); Vanuatu 111 police, 112 ambulance; Solomons 999/988/911 unconfirmed; Papua New Guinea 112 police (recent; Canada lists 000).
- Time: Fiji's summer time "not kept recently" (last 2020–21); Samoa dropped it in 2021.
- Money: Marshall Islands US dollar only (the SOV left out).
- Travel advice: Papua New Guinea "a high degree of caution, and against travel to some Highland areas".
- Dates: French Polynesia's 5 March Arrival of the Gospel, 14 July parade; Micronesia's Constitution Day 10 May a holiday?; Flame Tree Arts Festival "spring"; Tuvalu's Gospel Day (2nd Monday of May) and Children's Day (1st Monday of August); naghol "on set days, April to June"; Fest'Napuan October; Olechotel Belau Fair; Samoa's Independence Day maybe 1–2 June; Umatac re-enactment on Chamorro Heritage Day.
- Details: Kiribati's best months (August to November); Nauru noddy birds and best months May to October; Tonga's shirtless law, Heilala torch night, "last Polynesian kingdom"; Tuvalu runway siren, night flying-fish; American Samoa types I and F, Pola Island seabirds, ~3,000 mm rain; Palau's fruit bat soup; Lae's mid-year rain peak; Liberation Day names no camp (Susupe or Chalan Kanoa).
- Words: Kiribati "Eng / Tiaki"; Kosraean "Kulo", Yapese and Chuukese respellings; Marshallese bwiro, jekaro, "Jen etal"; Carolinian "Tirow", "Ghilisou", Chamorro "Saina ma'åse'"; Nauruan "Omo yoran", "Omo yemero", "Wo areit ed?"; Palauan "Ke ua ngerang?", "Ochoi / Diak"; Pijin "Solomon Aelan" (stamp), "motu".

**Europe 2 (MD MC ME MK RO RU SM RS SK SI CH UA VA)**
- Travel advice: Russia and Ukraine; Moldova a neutral paragraph on Transnistria ("no UN member recognises" its authorities).
- Power: Moldova and Russia 220 V per Wikidata (maybe 230 V now); Monaco's British plug left out (noted); Vatican plugs Italy's C/F/L at 230 V (no statement; noted).
- Vatican calling code given as "+39 06 698…", Wikidata's +379 cited as reserved but unused.
- Emergency: Serbia 112 left out (no statement; does it work?), 92/93/94 as short forms of 192/193/194; Slovakia adds mountain rescue 18 300 (noted); Russia's 01/02/03 the old landline numbers; Slovenia's 112 covers mountain rescue.
- Ukraine: summer time kept (the 2024 vote to drop it not in force?); Christmas on 25 December since 2023, some keep 7 January.
- Dates: Paștele Blajinilor eight days after Orthodox Easter; Monaco's National Day fireworks the evening before, Sainte-Dévote boat burned 26 January; Boka Night August; Mimosa Festival February; Galičnik Wedding around 12 July; Skopje Jazz October; Ohrid Summer mid-July to late August; Sighișoara Medieval late July; Sabantuy June; San Marino crossbow contest 3 September; Vatican's Epiphany parade, audiences paused in July.
- Details: Mileștii Mici ~200 km and over a million bottles; Cricova's electric train; Monaco swimwear in the streets not allowed; Montenegro's coastal swimwear fines, Tara canyon ~1,300 m; Romania's bears, "mulțumesc" as "keep the change"; Biancale wine, Guard of the Rock in green and red, San Marino passport stamp, summit ~740 m; Serbia's smoking in cafés; Tatra high trails closed 1 November to 15 June, Pohoda on the airfield, Kofola ~1960; Planica the last World Cup event, Vršič ~50 hairpins.

**Everywhere:** the month ratings are judgement calls, the pronunciations are approximate, and the festivals have no photos yet (`images/src/tools/festival-photos.mjs` hasn't been run for these guides).

## 2. Draw about 575 more small islands?

These islands already work: a photo taken on Zanzibar is placed in Tanzania. But the map doesn't draw them, so you see sea where the island is. Examples: Euboea (Greece), Funen (Denmark), Lombok (Indonesia), Zanzibar.

- **Yes:** they appear on the map. The map file grows by about 69 KB, about 20 KB once compressed.
- **No:** they stay invisible but still work.

**Until then:** not drawn.

## 3. Business decisions still open

These were open in `docs/FEATURE-PLAN.md` ("Open decisions"). Each is set in code to a safe default, so nothing waits on them.

| Decision | Example | Until you decide |
| --- | --- | --- |
| **First Class's extra map styles:** which ones (the passport covers are decided: one per plan, built 16 Nov) | A "Vintage atlas" and a "Night sky" style only First Class maps can pick | First Class has the four styles everyone has; the Pricing page marks "Extra map styles" soon |
| **Affiliate and print partners** | Booking.com for hotels, GetYourGuide for tours, a photobook printer | The cards and the Travel Desk are built and show **example offers** in development (fictional "Example Stays", "Example Tours"… with example.com links, `server/prisma/seed/data/offers.example.json`). Once you join partners, put their links in a file of the same shape and import it on the admin offers page (or `npm run db:offers -- <file>`). Production has no offers until then, so no cards show. The print partner goes in the same file, with `"kind": "PRINTS"` and `"placements": ["PRINT"]` (see `example-prints`): it then shows under "Print or download". Until then that dialog says any photo printer takes the files. |
| **Who writes the monthly photo themes** | "Worst weather" in January, "Street food" in February… | Built on 16 Nov. Development shows an example year (`server/prisma/seed/themes.js`: Doors, Worst weather, Street food, Lost…; use any of them). Production has none until they're written on the admin page (`/admin/themes`, which lists the months still empty); until then the map's badges panel says there's no theme this month. |
| **Friends challenges: invite by email too?** | Tom types Jo's address and Jo gets an email with the join link (as sharing a map does) | Link only (built 16 Nov): people copy the challenge's link and send it however they like. Email invites would add a template and the same daily caps as sharing. |
| **VAT:** handle it yourself, or pay a merchant of record such as Paddle | Paddle takes about 5% but files EU VAT for you | Stripe, prices include VAT; ask an accountant before launch |

## 4. Sample videos for the First Class demo account

The seed has one account per plan (`user@gmail.com` Economy, `business@gmail.com` Business, `firstclass@gmail.com` First Class; all `12345678`). The First Class one is meant to have real videos, but Claude can't download files from here. Four NASA space station time-lapses are chosen (public domain in the US; check the page's Terms of Use): download a small MP4 of each from <https://eol.jsc.nasa.gov/BeyondThePhotography/CrewEarthObservationsVideos/> into `seed-videos/<folder>/video.mp4` (`seed-videos/README.md` lists the titles and folders), then run `npx prisma db seed`.

**Until then:** the seed skips them with a message; everything else works.

## 5. What a travel offer link tells the partner

When someone clicks an offer card or a Travel Desk offer **on a planned trip**, the link carries the trip's first stop and its dates, so the partner's page opens on the right search. Example: "Hotels in Japan" on the trip "Japan in spring" opens the partner's site at Tokyo, 1–14 April. That's what makes the offer useful, and the privacy policy says so. Nothing else is sent: no name, no map, no photos, and not the page the click came from.

- **Keep it:** as built.
- **Don't send the place and dates:** the links go to the partner's general page for that country.

**Until then:** the place and dates are sent.

## 6. Before launch (already in LAUNCH-CHECKLIST.md)

Listed here so nothing is missed. The details are in `docs/LAUNCH-CHECKLIST.md`.

- The terms need payment wording (renewal, cancelling, refunds, extra maps, unpaid maps, complimentary memberships, and a promo code's free month: a card is taken and it renews as a paid plan after 30 days unless cancelled). Today they still say the site is free.
- Stripe: an account, products and prices, and the `STRIPE_*` keys.
- The Pricing page's `soon` claims are each built, or removed. One is left: First Class's extra map styles (your choice, section 3).
- On your own computer, after this week's changes: `npm install` in `server/` and `client/`, then `npx prisma migrate dev` and `npm run db:reference` in `server/` (this also moves the Old City of Jerusalem and the Western Wall to Palestine). On a database loaded before 16 Nov, first run `UPDATE "landmark" SET "wikidataId"='Q42725548' WHERE "wikidataId"='Q4526'` (the Sundarbans moved to Bangladesh's own site).

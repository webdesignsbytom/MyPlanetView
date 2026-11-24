// Life's One Shots (24 Nov 2026, the user's wish and name; docs/API.md "Life's One Shots"):
// three lists of things seen or done once in a lifetime, ticked on a map. A fixed catalogue
// we curate: wildlife seen, nature's wonders (volcanoes too; no disasters, the user's
// decision) and great journeys and feats. Each item: `key` (stored on a tick; never rename
// one), `list`, `group` (a heading inside its list), `name`, `wiki` (its English Wikipedia
// article, where its photo comes from: images/src/tools/one-shot-photos.mjs), `photo` (a
// Commons search used instead, where the article's picture is a map or a diagram),
// `countries` (where it's usually seen or done: a country's ticket lists what's left to see
// there) and `auto` (a line on the globe the flight log can find: utils/oneShots.js).
// The client keeps a copy (client/src/utils/oneShots/oneShotItems.js; a test compares them).

export const ONE_SHOT_LISTS = Object.freeze(['WILDLIFE', 'WONDERS', 'JOURNEYS']);

// Each list's groups, in the order shown
export const ONE_SHOT_GROUPS = Object.freeze({
  WILDLIFE: Object.freeze(['safari', 'asia', 'americas', 'oceania', 'cold', 'ocean', 'birds']),
  WONDERS: Object.freeze(['sky', 'volcanoes', 'water', 'land']),
  JOURNEYS: Object.freeze(['rail', 'foot', 'road', 'water', 'lines', 'thrills']),
});

// The lines on the globe a flight can cross (utils/oneShots.js crossingsOf)
export const ONE_SHOT_AUTO = Object.freeze(['EQUATOR', 'DATE_LINE', 'ARCTIC_CIRCLE', 'ANTARCTIC_CIRCLE']);

// The Big Five (a badge of its own)
export const BIG_FIVE = Object.freeze(['lion', 'leopard', 'african-elephant', 'african-buffalo', 'rhino']);

const item = (list, group, key, name, wiki, countries, extra = {}) => Object.freeze({ key, list, group, name, wiki, countries: Object.freeze(countries), ...extra });
const W = (...args) => item('WILDLIFE', ...args);
const N = (...args) => item('WONDERS', ...args);
const J = (...args) => item('JOURNEYS', ...args);

export const ONE_SHOTS = Object.freeze([
  // Wildlife: on safari
  W('safari', 'lion', 'Lion', 'Lion', ['KE', 'TZ', 'ZA', 'BW', 'ZM', 'ZW', 'NA', 'UG']),
  W('safari', 'leopard', 'Leopard', 'Leopard', ['KE', 'TZ', 'ZA', 'BW', 'ZM', 'LK', 'IN']),
  W('safari', 'african-elephant', 'African elephant', 'African bush elephant', ['KE', 'TZ', 'BW', 'ZA', 'ZM', 'ZW', 'NA', 'UG']),
  W('safari', 'african-buffalo', 'Cape buffalo', 'African buffalo', ['KE', 'TZ', 'ZA', 'BW', 'ZM', 'ZW', 'UG']),
  W('safari', 'rhino', 'Rhino', 'Rhinoceros', ['ZA', 'KE', 'NA', 'BW', 'ZW', 'IN', 'NP']),
  W('safari', 'cheetah', 'Cheetah', 'Cheetah', ['KE', 'TZ', 'NA', 'BW', 'ZA']),
  W('safari', 'giraffe', 'Giraffe', 'Giraffe', ['KE', 'TZ', 'ZA', 'BW', 'NA', 'UG', 'ZM']),
  W('safari', 'hippo', 'Hippo', 'Hippopotamus', ['KE', 'TZ', 'ZA', 'BW', 'ZM', 'UG']),
  W('safari', 'zebra', 'Zebra', 'Plains zebra', ['KE', 'TZ', 'ZA', 'BW', 'NA']),
  W('safari', 'wildebeest', 'Wildebeest', 'Blue wildebeest', ['TZ', 'KE', 'ZA', 'BW']),
  W('safari', 'mountain-gorilla', 'Mountain gorilla', 'Mountain gorilla', ['RW', 'UG', 'CD']),
  W('safari', 'chimpanzee', 'Chimpanzee', 'Chimpanzee', ['UG', 'TZ', 'RW']),
  W('safari', 'african-wild-dog', 'African wild dog', 'African wild dog', ['BW', 'ZA', 'TZ', 'ZW', 'ZM']),
  W('safari', 'meerkat', 'Meerkat', 'Meerkat', ['BW', 'ZA', 'NA']),
  W('safari', 'lemur', 'Ring-tailed lemur', 'Ring-tailed lemur', ['MG']),
  W('safari', 'nile-crocodile', 'Nile crocodile', 'Nile crocodile', ['KE', 'TZ', 'ZA', 'UG', 'EG', 'ZM']),
  W('safari', 'flamingo', 'Flamingos', 'Flamingo', ['KE', 'TZ', 'BO', 'CL', 'MX', 'ES', 'FR']),
  W('safari', 'shoebill', 'Shoebill', 'Shoebill', ['UG', 'ZM']),
  // Asia
  W('asia', 'giant-panda', 'Giant panda', 'Giant panda', ['CN']),
  W('asia', 'tiger', 'Tiger', 'Tiger', ['IN', 'NP', 'BD', 'RU', 'ID', 'BT']),
  W('asia', 'asian-elephant', 'Asian elephant', 'Asian elephant', ['IN', 'LK', 'TH', 'NP', 'MY', 'KH', 'LA']),
  W('asia', 'orangutan', 'Orangutan', 'Orangutan', ['ID', 'MY']),
  W('asia', 'komodo-dragon', 'Komodo dragon', 'Komodo dragon', ['ID']),
  W('asia', 'snow-leopard', 'Snow leopard', 'Snow leopard', ['IN', 'NP', 'MN', 'CN', 'KG']),
  W('asia', 'red-panda', 'Red panda', 'Red panda', ['NP', 'IN', 'BT', 'CN']),
  W('asia', 'snow-monkey', 'Snow monkeys', 'Japanese macaque', ['JP']),
  W('asia', 'proboscis-monkey', 'Proboscis monkey', 'Proboscis monkey', ['MY', 'ID']),
  // The Americas
  W('americas', 'jaguar', 'Jaguar', 'Jaguar', ['BR', 'BO', 'PE', 'CO', 'BZ', 'MX']),
  W('americas', 'sloth', 'Sloth', 'Sloth', ['CR', 'PA', 'BR', 'EC', 'PE', 'CO']),
  W('americas', 'grizzly-bear', 'Grizzly bear', 'Grizzly bear', ['US', 'CA']),
  W('americas', 'bison', 'American bison', 'American bison', ['US', 'CA']),
  W('americas', 'moose', 'Moose', 'Moose', ['CA', 'US', 'SE', 'NO', 'FI']),
  W('americas', 'galapagos-tortoise', 'Galápagos giant tortoise', 'Galápagos tortoise', ['EC']),
  W('americas', 'marine-iguana', 'Marine iguana', 'Marine iguana', ['EC']),
  W('americas', 'llama', 'Llama', 'Llama', ['PE', 'BO', 'CL', 'AR', 'EC']),
  W('americas', 'capybara', 'Capybara', 'Capybara', ['BR', 'AR', 'CO', 'VE', 'PE']),
  W('americas', 'pink-river-dolphin', 'Pink river dolphin', 'Amazon river dolphin', ['BR', 'PE', 'CO', 'BO']),
  W('americas', 'alligator', 'Alligator', 'American alligator', ['US']),
  W('americas', 'manatee', 'Manatee', 'Manatee', ['US', 'BZ', 'MX']),
  // Australia and New Zealand
  W('oceania', 'kangaroo', 'Kangaroo', 'Kangaroo', ['AU']),
  W('oceania', 'koala', 'Koala', 'Koala', ['AU']),
  W('oceania', 'platypus', 'Platypus', 'Platypus', ['AU']),
  W('oceania', 'tasmanian-devil', 'Tasmanian devil', 'Tasmanian devil', ['AU']),
  W('oceania', 'wombat', 'Wombat', 'Wombat', ['AU']),
  W('oceania', 'quokka', 'Quokka', 'Quokka', ['AU']),
  W('oceania', 'kiwi', 'Kiwi', 'Kiwi (bird)', ['NZ']),
  W('oceania', 'cassowary', 'Cassowary', 'Southern cassowary', ['AU', 'PG']),
  // The cold north and south
  W('cold', 'polar-bear', 'Polar bear', 'Polar bear', ['CA', 'NO', 'GL', 'RU', 'US']),
  W('cold', 'reindeer', 'Reindeer', 'Reindeer', ['NO', 'SE', 'FI', 'RU', 'GL', 'CA']),
  W('cold', 'walrus', 'Walrus', 'Walrus', ['NO', 'GL', 'CA', 'RU', 'US']),
  W('cold', 'musk-ox', 'Musk ox', 'Muskox', ['GL', 'NO', 'CA']),
  W('cold', 'arctic-fox', 'Arctic fox', 'Arctic fox', ['IS', 'NO', 'GL', 'CA']),
  W('cold', 'brown-bear', 'Brown bear', 'Brown bear', ['FI', 'RO', 'SK', 'SI', 'CA', 'US', 'RU']),
  W('cold', 'wolf', 'Wolf', 'Wolf', ['US', 'CA', 'ES', 'IT', 'RO', 'FI']),
  W('cold', 'ibex', 'Alpine ibex', 'Alpine ibex', ['CH', 'IT', 'FR', 'AT']),
  W('cold', 'emperor-penguin', 'Emperor penguin', 'Emperor penguin', ['AQ']),
  W('cold', 'king-penguin', 'King penguin', 'King penguin', ['GS', 'FK']),
  // In the ocean
  W('ocean', 'blue-whale', 'Blue whale', 'Blue whale', ['LK', 'US', 'MX', 'IS', 'AU', 'CL']),
  W('ocean', 'humpback-whale', 'Humpback whale', 'Humpback whale', ['IS', 'NO', 'US', 'AU', 'TO', 'DO', 'MX', 'ZA']),
  W('ocean', 'orca', 'Orca', 'Orca', ['NO', 'CA', 'US', 'AR', 'IS']),
  W('ocean', 'whale-shark', 'Whale shark', 'Whale shark', ['PH', 'MX', 'AU', 'MV', 'TZ', 'BZ']),
  W('ocean', 'great-white-shark', 'Great white shark', 'Great white shark', ['ZA', 'AU', 'MX', 'US']),
  W('ocean', 'manta-ray', 'Manta ray', 'Manta ray', ['MV', 'ID', 'AU', 'MX']),
  W('ocean', 'sea-turtle', 'Sea turtle', 'Green sea turtle', ['AU', 'MX', 'CR', 'MY', 'EC']),
  W('ocean', 'dolphin', 'Wild dolphins', 'Common bottlenose dolphin', ['NZ', 'AU', 'US', 'PT', 'GB', 'ZA']),
  W('ocean', 'seal', 'Seals', 'Grey seal', ['GB', 'IE', 'IS', 'NO', 'NL']),
  W('ocean', 'sea-otter', 'Sea otter', 'Sea otter', ['US', 'CA']),
  W('ocean', 'sea-lion', 'Sea lions', 'Sea lion', ['EC', 'US', 'AU', 'AR', 'PE']),
  // Birds
  W('birds', 'puffin', 'Atlantic puffin', 'Atlantic puffin', ['IS', 'NO', 'GB', 'FO', 'IE']),
  W('birds', 'bald-eagle', 'Bald eagle', 'Bald eagle', ['US', 'CA']),
  W('birds', 'andean-condor', 'Andean condor', 'Andean condor', ['PE', 'CL', 'AR', 'BO', 'EC', 'CO']),
  W('birds', 'blue-footed-booby', 'Blue-footed booby', 'Blue-footed booby', ['EC', 'PE', 'MX']),
  W('birds', 'scarlet-macaw', 'Scarlet macaw', 'Scarlet macaw', ['CR', 'BR', 'PE', 'BZ']),
  W('birds', 'toucan', 'Toucan', 'Toco toucan', ['BR', 'CR', 'PA', 'AR']),
  W('birds', 'hummingbird', 'Hummingbird', 'Hummingbird', ['CR', 'EC', 'CO', 'US']),
  W('birds', 'quetzal', 'Resplendent quetzal', 'Resplendent quetzal', ['CR', 'GT', 'PA']),
  W('birds', 'albatross', 'Albatross', 'Wandering albatross', ['NZ', 'GS', 'FK', 'AU']),
  W('birds', 'snowy-owl', 'Snowy owl', 'Snowy owl', ['CA', 'NO', 'US', 'RU']),
  W('birds', 'peacock', 'Wild peacock', 'Indian peafowl', ['IN', 'LK']),
  W('birds', 'bird-of-paradise', 'Bird-of-paradise', 'Bird-of-paradise', ['PG', 'ID']),

  // Nature's wonders: in the sky
  N('sky', 'northern-lights', 'Northern lights', 'Aurora', ['NO', 'IS', 'FI', 'SE', 'CA', 'US', 'GL'], { photo: 'aurora borealis' }),
  N('sky', 'southern-lights', 'Southern lights', 'Aurora', ['NZ', 'AU', 'AQ', 'AR'], { photo: 'aurora australis' }),
  N('sky', 'total-eclipse', 'Total solar eclipse', 'Solar eclipse', []),
  N('sky', 'midnight-sun', 'Midnight sun', 'Midnight sun', ['NO', 'SE', 'FI', 'IS', 'GL', 'CA', 'US']),
  N('sky', 'polar-night', 'Polar night', 'Polar night', ['NO', 'SE', 'FI', 'GL', 'RU']),
  N('sky', 'milky-way', 'The Milky Way, far from any light', 'Milky Way', ['CL', 'NA', 'US', 'AU', 'NZ'], { photo: 'Milky Way night sky photograph' }),
  N('sky', 'meteor-shower', 'A meteor shower', 'Meteor shower', [], { photo: 'Perseids meteor shower' }),
  N('sky', 'moonbow', 'A moonbow', 'Moonbow', ['ZM', 'ZW', 'US']),
  // Volcanoes (the user's wish, 24 Nov 2026)
  N('volcanoes', 'erupting-volcano', 'A volcano erupting', 'Strombolian eruption', ['IT', 'IS', 'US', 'ID', 'GT', 'JP', 'VU'], { photo: 'Stromboli eruption night' }),
  N('volcanoes', 'flowing-lava', 'Flowing lava', 'Lava', ['US', 'IS']),
  N('volcanoes', 'lava-lake', 'A lava lake', 'Lava lake', ['ET', 'CD', 'VU']),
  N('volcanoes', 'crater-rim', 'A volcano’s crater rim', 'Volcanic crater', ['ID', 'IT', 'JP', 'NZ', 'EC', 'TZ'], { photo: 'volcano crater rim hikers' }),
  N('volcanoes', 'fumaroles', 'Fumaroles and sulphur fields', 'Fumarole', ['IS', 'ID', 'IT', 'NZ', 'JP', 'CL']),
  N('volcanoes', 'blue-fire', 'Blue fire', 'Ijen', ['ID'], { photo: 'Kawah Ijen blue fire' }),
  N('volcanoes', 'black-sand-beach', 'A black sand beach', 'Black sand', ['IS', 'ES', 'NZ', 'US', 'IC']),
  // Water and ice
  N('water', 'geyser', 'A geyser erupting', 'Geyser', ['IS', 'US', 'NZ', 'CL']),
  N('water', 'hot-springs', 'Natural hot springs', 'Hot spring', ['IS', 'JP', 'NZ', 'TR', 'US']),
  N('water', 'calving-glacier', 'A glacier calving', 'Ice calving', ['GL', 'AR', 'NO', 'IS', 'US', 'CL']),
  N('water', 'icebergs', 'Icebergs', 'Iceberg', ['GL', 'AQ', 'CA', 'IS', 'AR']),
  N('water', 'ice-cave', 'An ice cave', 'Ice cave', ['IS', 'AT', 'US']),
  N('water', 'fjord', 'A fjord', 'Fjord', ['NO', 'NZ', 'CL', 'IS', 'GL']),
  N('water', 'great-waterfall', 'One of the great waterfalls', 'Iguazu Falls', ['AR', 'BR', 'ZM', 'ZW', 'US', 'CA', 'VE']),
  N('water', 'bioluminescence', 'Glowing water', 'Bioluminescence', ['PR', 'MV', 'JM', 'US', 'AU'], { photo: 'bioluminescent waves beach night' }),
  N('water', 'glowworms', 'Glowworm caves', 'Glowworm', ['NZ', 'AU'], { photo: 'Waitomo glowworm cave' }),
  N('water', 'coral-reef', 'A coral reef', 'Coral reef', ['AU', 'EG', 'MV', 'ID', 'PH', 'BZ']),
  // Land and life
  N('land', 'great-migration', 'The Great Migration', 'Blue wildebeest', ['TZ', 'KE'], { photo: 'wildebeest migration Mara River crossing' }),
  N('land', 'salmon-run', 'A salmon run', 'Salmon run', ['US', 'CA']),
  N('land', 'cherry-blossom', 'Cherry blossom', 'Cherry blossom', ['JP', 'KR']),
  N('land', 'autumn-colours', 'Autumn colours', 'Autumn leaf color', ['US', 'CA', 'JP']),
  N('land', 'tulip-fields', 'Tulip fields', 'Bollenstreek', ['NL']),
  N('land', 'sand-dunes', 'Desert dunes', 'Erg (landform)', ['MA', 'DZ', 'NA', 'EG', 'AE', 'OM'], { photo: 'Erg Chebbi dunes' }),
  N('land', 'salt-flat-mirror', 'The salt flat mirror', 'Salar de Uyuni', ['BO']),

  // Journeys and feats: by rail
  J('rail', 'trans-siberian', 'The Trans-Siberian Railway', 'Trans-Siberian Railway', ['RU', 'MN', 'CN']),
  J('rail', 'glacier-express', 'The Glacier Express', 'Glacier Express', ['CH']),
  J('rail', 'rocky-mountaineer', 'The Rocky Mountaineer', 'Rocky Mountaineer', ['CA']),
  J('rail', 'the-ghan', 'The Ghan', 'The Ghan', ['AU']),
  J('rail', 'orient-express', 'The Orient Express', 'Venice Simplon-Orient-Express', ['IT', 'FR', 'GB', 'AT']),
  J('rail', 'shinkansen', 'A bullet train', 'Shinkansen', ['JP'], { photo: 'Shinkansen N700 bullet train' }),
  J('rail', 'flam-railway', 'The Flåm Railway', 'Flåm Line', ['NO']),
  J('rail', 'darjeeling-railway', 'The Darjeeling toy train', 'Darjeeling Himalayan Railway', ['IN']),
  // On foot
  J('foot', 'camino', 'The Camino de Santiago', 'Camino de Santiago', ['ES', 'PT', 'FR'], { photo: 'Camino de Santiago pilgrims walking' }),
  J('foot', 'inca-trail', 'The Inca Trail', 'Inca Trail to Machu Picchu', ['PE']),
  J('foot', 'everest-base-camp', 'Everest Base Camp', 'Everest base camps', ['NP', 'CN']),
  J('foot', 'kilimanjaro', 'The top of Kilimanjaro', 'Mount Kilimanjaro', ['TZ']),
  J('foot', 'mont-blanc', 'The Tour du Mont Blanc', 'Tour du Mont Blanc', ['FR', 'IT', 'CH']),
  J('foot', 'milford-track', 'The Milford Track', 'Milford Track', ['NZ']),
  J('foot', 'mount-fuji', 'The top of Mount Fuji', 'Mount Fuji', ['JP']),
  J('foot', 'great-wall-hike', 'A hike on the Great Wall', 'Great Wall of China', ['CN']),
  J('foot', 'torres-del-paine', 'The W Trek in Torres del Paine', 'Torres del Paine National Park', ['CL']),
  J('foot', 'appalachian-trail', 'The Appalachian Trail', 'Appalachian Trail', ['US']),
  // On the road
  J('road', 'route-66', 'Route 66', 'U.S. Route 66', ['US']),
  J('road', 'pacific-coast-highway', 'The Pacific Coast Highway', 'California State Route 1', ['US'], { photo: 'Bixby Creek Bridge Big Sur' }),
  J('road', 'great-ocean-road', 'The Great Ocean Road', 'Great Ocean Road', ['AU']),
  J('road', 'iceland-ring-road', 'Iceland’s Ring Road', 'Route 1 (Iceland)', ['IS']),
  J('road', 'garden-route', 'The Garden Route', 'Garden Route', ['ZA']),
  J('road', 'karakoram-highway', 'The Karakoram Highway', 'Karakoram Highway', ['PK', 'CN'], { photo: 'Karakoram Highway Hunza valley road' }),
  // On the water
  J('water', 'panama-canal', 'Through the Panama Canal', 'Panama Canal', ['PA']),
  J('water', 'drake-passage', 'Across the Drake Passage', 'Cape Horn', ['AQ', 'AR', 'CL']),
  J('water', 'hurtigruten', 'The Norwegian coastal voyage', 'Hurtigruten', ['NO']),
  J('water', 'nile-cruise', 'A Nile cruise', 'Nile', ['EG'], { photo: 'Nile cruise boat Aswan' }),
  J('water', 'amazon-river', 'Up the Amazon', 'Amazon River', ['BR', 'PE', 'CO'], { photo: 'Amazon river boat Manaus' }),
  J('water', 'atlantic-crossing', 'An ocean crossing by ship', 'Transatlantic crossing', [], { photo: 'Queen Mary 2 at sea' }),
  // Lines on the globe (the flight log finds these: utils/oneShots.js)
  J('lines', 'equator', 'Across the equator', 'Equator', ['EC', 'KE', 'UG', 'ID', 'BR', 'GA'], { auto: 'EQUATOR', photo: 'Mitad del Mundo monument' }),
  J('lines', 'date-line', 'Across the International Date Line', 'International Date Line', ['FJ', 'KI', 'TO', 'WS', 'US', 'RU'], { auto: 'DATE_LINE', photo: 'International Date Line sign Taveuni' }),
  J('lines', 'arctic-circle', 'Across the Arctic Circle', 'Arctic Circle', ['NO', 'SE', 'FI', 'IS', 'RU', 'CA', 'US', 'GL'], { auto: 'ARCTIC_CIRCLE', photo: 'Arctic Circle sign' }),
  J('lines', 'antarctic-circle', 'Across the Antarctic Circle', 'Antarctic Circle', ['AQ'], { auto: 'ANTARCTIC_CIRCLE', photo: 'Antarctic Peninsula cruise ship icebergs' }),
  J('lines', 'prime-meridian', 'Astride the Prime Meridian', 'Prime meridian (Greenwich)', ['GB'], { photo: 'Prime meridian Greenwich line' }),
  J('lines', 'silfra', 'Between two continents, in Silfra', 'Silfra', ['IS']),
  // Thrills
  J('thrills', 'hot-air-balloon', 'A hot-air balloon ride', 'Hot air balloon', ['TR', 'MM', 'EG', 'KE', 'US'], { photo: 'Cappadocia hot air balloons' }),
  J('thrills', 'skydive', 'A skydive', 'Parachuting', ['NZ', 'AU', 'US', 'CH']),
  J('thrills', 'bungee-jump', 'A bungee jump', 'Bungee jumping', ['NZ', 'ZA', 'ZW', 'ZM', 'CH']),
  J('thrills', 'dog-sledding', 'Dog sledding', 'Dog sled', ['NO', 'FI', 'SE', 'CA', 'US', 'GL']),
  J('thrills', 'ice-hotel', 'A night in an ice hotel', 'Icehotel', ['SE', 'CA', 'NO', 'FI']),
  J('thrills', 'dead-sea-float', 'Floating in the Dead Sea', 'Dead Sea', ['IL', 'JO', 'PS']),
  J('thrills', 'desert-camp', 'A night in a desert camp', 'Erg Chebbi', ['MA', 'JO', 'OM', 'EG', 'AE'], { photo: 'Wadi Rum desert camp' }),
]);

export const ONE_SHOT_BY_KEY = new Map(ONE_SHOTS.map((shot) => [shot.key, shot]));
export const isOneShotKey = (key) => typeof key === 'string' && ONE_SHOT_BY_KEY.has(key);

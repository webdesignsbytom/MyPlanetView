// A photo for each festival in the country guides (client/src/content/countries/*.json,
// whenToGo.festivals), from Wikimedia Commons, credited as its licence asks:
//   node images/src/tools/festival-photos.mjs [--cache <folder>] [--only key,key] [--refresh]
//   (from the repo root; the cache keeps the downloads and the APIs' answers)
//
// Festivals have no Wikidata item, so each is searched for: English Wikipedia's search for
// "<name> <country>", the lead images of its top results whose title shares a word with the
// festival's name (free licences only), then Commons' own search for the same words. The first usable file wins: a JPEG, PNG, TIFF or WebP at least
// 480 px wide, under a licence that asks only for credit (the rules of landmark-photos.mjs),
// not a map, logo or poster, and not in REJECT. OVERRIDES picks one by hand.
//
// It writes media/festivalPhotos/<key>-<width>.avif and .webp (640 px wide at most, 480
// tall: the copy of the public bucket's festivalPhotos/ folder; `npm run media:upload` in
// server/ sends them), client/src/content/countries/festivalPhotos.generated.js (the
// credits: key -> width, height, author, licence, Commons file) and contact sheets in the
// cache folder (contact-<n>.png) to check every pick by eye. A re-run keeps existing picks
// and only fills gaps; --only redoes some. <key> is "<country code>-<festival name slug>".
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import os from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const contentDir = resolve(root, 'client/src/content/countries');
const outDir = resolve(root, 'media/festivalPhotos');
const manifestPath = resolve(contentDir, 'festivalPhotos.generated.js');

const args = process.argv.slice(2);
const argValue = (name) => {
  const at = args.indexOf(name);
  return at >= 0 ? args[at + 1] : null;
};
const cacheDir = resolve(argValue('--cache') || join(os.tmpdir(), 'mpv-festival-photos'));
const only = new Set((argValue('--only') || '').split(',').filter(Boolean));
const refresh = args.includes('--refresh');

// key -> a Commons file chosen by hand
const OVERRIDES = {
  // The published guides' festivals with none, found by hand on Commons and checked by eye (26 Nov 2026)
  "ca-canada-day": "Canada Day at Parliament Hill, Ottawa - 2016 (27435232193).jpg",
  "ca-toronto-international-film-festival": "Cameron Bailey and Franklin Leonard at the 2024 Toronto International Film Festival 3.jpg",
  "es-los-reyes-three-kings": "Cabalgata de Reyes Magos 2022-JErez-IMG 20220105 173809.jpg",
  "gr-apokries-carnival-and-clean-monday": "Kites on clean monday at the south coast of Piraeus (Greece) (cropped).jpg",
  "hr-advent-in-zagreb": "Christmas Market in Zagreb1.JPG",
  "is-national-day": "The day of the nation's celebration), 17 June (5844983173).jpg",
  "ma-eid-al-adha": "Eid in Morocco.JPG",
  "mx-carnaval": "Carnaval de Huayacocotla Veracruz 2009 01.jpg",
  "mx-semana-santa-holy-week": "Procesión de Semana Santa Ozumba.jpg",
  "nl-pride-amsterdam": "Amsterdam Gay Pride 2013 boat no9 pic2.JPG",
  "pt-santo-antonio": "Altar de Sto António - Alfama.jpg",
  "pt-sao-joao": "Festa de Sao Joao (Porto).jpg",
  "tr-kurban-bayram-eid-al-adha": "Muslims perform the Eid Al-Adha prayer at Eyup Sultan Mosque 2019-08-11 08.jpg",
  "us-halloween": "Halloween Jack-o'-lantern.jpg",
};
// Files found that aren't a photo of the festival (checked on the contact sheets)
const REJECT = new Set([]);
// key -> files that are wrong for that festival only (a photo of Nuremberg's market is
// right for Germany's Christmas markets, not Austria's); the first review, 16 Nov 2026:
// another place, a portrait, a document, an old faded print, or someone else's photo
const REJECT_FOR = {
  "ar-carnaval": ["Baile de Carnaval en River Plate (Buenos Aires), 1959.jpg"],
  "au-australia-day": ["Australia Cairns 01.jpg"],
  "br-carnaval": ["La Ursa carnaval Limoeiro.jpg"],
  "ca-quebec-winter-carnival-carnaval-de-quebec": ["Quebec City in September 2026.jpg"],
  "ca-toronto-international-film-festival": ["Paul Schrader at the 2024 Toronto International Film Festival (cropped) 2.jpg", "Paul Schrader at the 2024 Toronto International Film Festival.jpg"],
  "cn-dragon-boat-festival": ["Qing Dynasty Dragon Boat Festival.jpg"],
  "ca-calgary-stampede": ["Stampede-Corral-Szmurlo.jpg"],
  "ca-canada-day": ["Vancouver (BC, Canada), Canada Place -- 2022 -- 1906 (bw).jpg", "Gazania krebsiana, Quebec city, Quebec, Canada 131.jpg"],
  "cy-green-monday-kathara-deftera": ["Philopappos Hill Clean Monday Kite Flying 2023.jpg", "Andrej Rublëv 001.jpg"],
  "cz-karlovy-vary-international-film-festival": ["Karlovy Vary International Film Festival 2025.jpg", "Marika Šoposká 58th Karlovy Vary International Film Festival, Waves 42 (cropped).jpg"],
  "cz-masopust-carnival": ["Masopust držíme 24.jpg", "Masopust držíme 25.jpg"],
  "at-christmas-markets": ["Christkindlesmarkt nuernberg.jpg"],
  "de-walpurgisnacht": ["Antikapitalistischen Walpurgisnacht demo.jpg"],
  "dk-aarhus-festuge": ["Drone photo of Dokk1 in Aarhus, Denmark.jpg", "Byparken (Aarhus Festuge 2025).jpg"],
  "dk-christmas-jul": ["Royal Copenhagen 1.jpg"],
  "eg-abu-simbel-sun-festival": ["Phoenician Graffiti in Abu Simbel from Corpus inscriptionum Semiticarum CIS I Table XX.png"],
  "eg-sham-el-nessim": ["Bg-easter-eggs.jpg"],
  "es-los-reyes-three-kings": ["Kamar de los Reyes 2014.jpg", "Plaza Virgen de los Reyes, Seville, Spain - Sep 2009.jpg"],
  "es-san-fermin": ["Mission San Carlos Borromeo de Carmelo (Carmel, CA) - Mora Chapel, cenotaph - Fray Fermín Lasuén.jpg"],
  "fi-helsinki-festival": ["Suomenlinna (cropped).jpg", "Czech beer hall at Helsinki Beer Festival 2023.jpg"],
  "fi-juhannus-midsummer": ["Boletus in Finnish forest.jpg", "Töölönlahti1.jpg"],
  "fi-vappu-may-day": ["Vapputaipale.jpg", "Vappu Jurkka 1961.jpg"],
  "fr-bastille-day-14-juillet": ["Bastille Exterior 1790 or 1791.jpg"],
  "fr-christmas-markets": ["Christkindlesmarkt nuernberg.jpg"],
  "fr-fete-des-lumieres": ["Lyon fete des Lumieres 2013.jpg"],
  "gb-chelsea-flower-show": ["Queen's head display, Chelsea Flower Show - geograph.org.uk - 4969711.jpg"],
  "gr-apokries-carnival-and-clean-monday": ["Lingelbach Karneval in Rom 001.jpg"],
  "gr-easter-pascha": ["Bg-easter-eggs.jpg"],
  "hr-advent-in-zagreb": ["Zagreb (29255640143).jpg", "Novi putnički terminal .jpg"],
  "hr-dubrovnik-summer-festival": ["Novela od Stanca DLjI 1008.jpg"],
  "hu-christmas-markets": ["Christkindlesmarkt nuernberg.jpg", "Classic vintage hungarian chrismast-tree.jpg"],
  "ie-cork-jazz-festival": ["University College Cork - Quad during Eclipse 2015 (16684104050).jpg", "Dublin Maritime Festival 2010 (4670528634).jpg"],
  "in-republic-day": ["Constitution of India.jpg"],
  "is-culture-night-menningarnott": ["Legend Nocturnal Culture Night 10 2015 05.jpg", "Legend Nocturnal Culture Night 10 2015 02.jpg"],
  "is-national-day": ["039 Northern lights over Mývatn (Iceland) Photo by Giles Laurent.jpg", "Icelandic girl in Icelandic colours on Icelandic National Day.jpg"],
  "ke-mashujaa-day-heroes-day": ["Heroes Day a.JPG", "Heroes Day b.JPG"],
  "ke-the-great-migration": ["Census 1900 Percent Black.png", "\"Great migration\" Masai Mara river Kenya-Africa.jpg"],
  "kr-busan-international-film-festival": ["BIFF BUSAN South Korea.jpg", "Rintaro at the 2026 Busan International Film Festival. 03.jpg"],
  "kr-jinhae-cherry-blossom-festival-gunhangje": ["Jinhae City 20090405.JPG"],
  "ma-eid-al-adha": ["Eid al adha compilation.jpg", "Sacrificio durante Eid al-Adha en Casablanca.jpg"],
  "ma-ramadan-and-eid-al-fitr": ["Eid al fitr photo.jpg"],
  "ma-rose-festival": ["Ритуалът Розобер в село Розово.JPG"],
  "mt-l-imnarja": ["L-imnarja.jpg", "L-IMNARJA.jpg"],
  "mt-village-festas": ["Youth putting up a street decoration for the village festa.jpg", "Evening atmosphere at St Julians Bay during the village festa.jpg"],
  "mx-carnaval": ["Banda Carnival en Acceso Total.jpg", "Carnaval en Merida Yucatan Mexico 1904 04.png"],
  "mx-independence-day": ["Acta de Independencia 3024x4032 (cropped).jpg"],
  "mx-semana-santa-holy-week": ["Semana Santa La Laguna 52 (cropped).jpg", "Policías en la Semana Santa de Iztapalapa.jpg"],
  "nl-pride-amsterdam": ["Amsterdam Pride Canal Parade 2019 05.jpg", "Imagen de los canales concéntricos en Ámsterdam.png"],
  "no-bergen-international-festival": ["Grieghallen.JPG"],
  "no-holmenkollen-ski-festival": ["Skiforeningen.jpg"],
  "nz-anzac-day": ["Dawn service gnangarra 03.jpg"],
  "nz-matariki-maori-new-year": ["Celebrating Matariki at Archives New Zealand (14505572203).jpg"],
  "pl-all-saints-day-wszystkich-swietych": ["Fra' Angelico - Incoronazione della Vergine - Google Art Project.jpg", "Kaplica Kościoła Jezusa Chrystusa Świętych w Dniach Ostatnich w Warszawie 2023.jpg"],
  "pl-warsaw-uprising-anniversary": ["Muzeum Powstania Warszawskiego 2023.jpg"],
  "pt-santo-antonio": ["Palacio do Governo Regional (20911940070).jpg", "Vila Real Main Square 01.jpg"],
  "pt-sao-joao": ["Prise de Tunis.jpg", "Vista aérea parcial do centro.jpg"],
  "se-jokkmokk-winter-market": ["Jokkmokks kyrka.JPG", "Municipal building of Jokkmokk.jpg"],
  "se-lucia": ["Lucia 1929.png", "Swedish Lucia pin.jpg"],
  "se-midsummer-midsommar": ["Mittsommerfest in Norwegen, Insel Tysnes IMG 4425WI.jpg"],
  "th-chinese-new-year": ["Kung Hei Fat Choi! (6834861529).jpg"],
  "th-vegetarian-festival": ["Night streets at Phuket Vegetarian Festival. October, 2016. Phuket, Thailand (30177427206).jpg"],
  "tr-istanbul-tulip-festival": ["2013 Tulip Festival @ Agassiz, BC, Canada (8671444216).jpg"],
  "tr-kurban-bayram-eid-al-adha": ["Eid al adha compilation.jpg", "Kurban Bayramı göletten kurban kesim anları..jpg"],
  "us-halloween": ["Halloween Bangladesh.jpg", "Halloween Candy Donation to Churchill with the United States Consulate of Canada (Winnipeg), 2023.jpg"],
  "us-new-year-s-eve": ["New Year's Eve in Miami 2009.jpg"],
  "za-cape-town-minstrel-carnival": ["The National Archives UK - CO 1069-214-85.jpg", "Camps bay (53460319478) (cropped).jpg"],
  "za-durban-july": ["Durban from the Balcony (Dennis Sylvester Hurd) 1.jpg", "Durban Botanic Gardens new entrance 04 09 2010.JPG"],
  "za-national-arts-festival": ["Boutique Naf Naf à Toulouse.png", "Bilbao - NAF NAF (Calle Marqués del Puerto).jpg"],
};
// Festivals left without a photo: two rounds found nothing right on Commons (17 Nov 2026).
// Their cards show text only. To try again, take one out and give it a SEARCH_AS.
const LEAVE_OUT = new Set([
  "cy-green-monday-kathara-deftera",
  "cz-karlovy-vary-international-film-festival",
  "cz-masopust-carnival",
  "dk-aarhus-festuge",
  "fi-helsinki-festival",
  "fi-juhannus-midsummer",
  "fi-vappu-may-day",
  "hu-christmas-markets",
  "ie-cork-jazz-festival",
  "is-culture-night-menningarnott",
  "ke-mashujaa-day-heroes-day",
  "ke-the-great-migration",
  "kr-busan-international-film-festival",
  "mt-l-imnarja",
  "mt-village-festas",
  "pl-all-saints-day-wszystkich-swietych",
  "se-jokkmokk-winter-market",
  "se-lucia",
  "za-cape-town-minstrel-carnival",
  "za-durban-july",
  "za-national-arts-festival",
]);

// key -> a better search than the festival's name and place
const SEARCH_AS = {};

const MAX_WIDTH = 640;
const MAX_HEIGHT = 480;
const FETCH_WIDTH = 960; // one of Commons' standard thumbnail widths
const UA = 'MyPlanetViewFestivalPhotos/1.0 (one-off build script)';
const OK_TYPES = new Set(['image/jpeg', 'image/png', 'image/tiff', 'image/webp']);
const NOT_A_PHOTO = /\b(map|karte|carte|mapa|mappa|location|locator|plan|logo|flag|coat[ _]of[ _]arms|wappen|diagram|scheme|sketch|poster|affiche|cartel|stamp|banknote|coin)\b/i;
const FREE_LICENCE = /^(cc[ -]|cc0|public domain|pd\b|pd-|fal\b|free art|gfdl|attribution|kogl|ogl\b|open government|copyrighted free use)/i;

const wait = (ms) => new Promise((done) => setTimeout(done, ms));

// Wikimedia's API hosts sometimes drop the connection (landmark-photos.mjs), so retry
async function request(url, { accept = 'application/json', tries = 20 } = {}) {
  for (let attempt = 1; ; attempt += 1) {
    let res;
    try {
      res = await fetch(url, { headers: { 'User-Agent': UA, Accept: accept }, signal: AbortSignal.timeout(45000) });
    } catch (err) {
      if (attempt >= tries) throw err;
      await wait(1000 + 500 * attempt);
      continue;
    }
    if (res.ok) return res;
    if ((res.status === 429 || res.status >= 500) && attempt < tries) {
      const after = Number(res.headers.get('retry-after'));
      await wait(after > 0 ? after * 1000 : Math.min(60000, 1500 * 2 ** attempt));
      continue;
    }
    throw new Error(`${res.status} for ${url.slice(0, 160)}`);
  }
}

const chunks = (list, size) => Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, i * size + size));
async function eachLimited(items, limit, work) {
  let next = 0;
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (next < items.length) {
        const item = items[next];
        next += 1;
        await work(item);
      }
    }),
  );
}
const slugify = (text) =>
  String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const plainText = (html) =>
  String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, ' ')
    .trim();
// As landmark-photos.mjs: a Commons "Artist" made readable as a credit
function cleanAuthor(raw) {
  let author = String(raw);
  const named =
    author.match(/^No machine-readable author provided\.\s*(.+?)\s+assumed/i) ||
    author.match(/original uploader was\s+(.+?)\s+at\s+/i) ||
    author.match(/Picture by\s+(.+)$/i);
  if (named) author = named[1];
  author = author
    .replace(/~commonswiki/g, '')
    .replace(/\(\s*(talk|Archived)[^)]*\)/gi, '')
    .replace(/\s*\d{1,2}:\d{2},\s*\d{1,2}\.?\s+\w+\.?\s+\d{4}\s*\((UTC|CEST|CET)\)/g, '')
    .replace(/https?:\/\/(?:www\.)?flickr\.com\/photos\/([^/\s]+)\/?/gi, '$1 (Flickr)')
    .replace(/\s*\+?\s*https?:\/\/\S+/g, '')
    .replace(/\s+You are free to use[\s\S]*$/i, '')
    .replace(/,\s*assent by email[\s\S]*$/i, '')
    .replace(/\s+-\s*(?=\S+ \(Flickr\)$)/, ', ')
    .replace(/\s+[-–.]\s*$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return author || 'Unknown author';
}
const shorten = (text, max = 100) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

async function loadStore(name) {
  const path = join(cacheDir, `${name}.json`);
  const data = existsSync(path) ? JSON.parse(await readFile(path, 'utf8')) : {};
  return { data, save: () => writeFile(path, JSON.stringify(data)) };
}

// A name's own words, for matching a search result's title: at least four letters, not
// the country's name or a common word ("festival", "national", "day"…)
const COMMON_WORDS = new Set(['festival', 'festa', 'fiesta', 'fete', 'national', 'nacional', 'international', 'week', 'season', 'celebration', 'celebrations', 'holiday', 'holidays', 'with', 'from', 'that', 'this', 'their', 'over', 'into']);
function nameWords(name, country) {
  const own = (text) => slugify(text).split('-');
  const countryWords = new Set(own(country));
  return own(name).filter((word) => word.length >= 4 && !COMMON_WORDS.has(word) && !countryWords.has(word));
}
const sharesWord = (title, words) => {
  const titleWords = new Set(slugify(title).split('-'));
  return words.some((word) => titleWords.has(word));
};

// The festivals, from every guide
async function loadFestivals() {
  const { COUNTRY_BY_CODE } = await import(pathToFileURL(resolve(root, 'client/src/utils/map/countries.js')).href);
  const festivals = [];
  for (const file of (await readdir(contentDir)).filter((f) => f.endsWith('.json')).sort()) {
    const content = JSON.parse(await readFile(join(contentDir, file), 'utf8'));
    const country = COUNTRY_BY_CODE[content.code]?.name || content.code;
    for (const festival of content.whenToGo?.festivals || []) {
      const key = `${content.code.toLowerCase()}-${slugify(festival.name)}`;
      // The festival's own name, before any "(…)" note ("Réveillon (New Year's Eve)"). The
      // place is left out: it's prose ("above all Tucumán") and skews the search.
      const plainName = festival.name.replace(/\s*\(.*\)\s*$/, '');
      festivals.push({ key, name: festival.name, words: nameWords(festival.name, country), country, query: SEARCH_AS[key] || `${plainName} ${country}` });
    }
  }
  return festivals;
}

// English Wikipedia's search: the top few article titles
async function searchWikipedia(queries, store) {
  for (const query of queries.filter((q) => !(q in store.data))) {
    const url = `https://en.wikipedia.org/w/api.php?${new URLSearchParams({ action: 'query', list: 'search', srsearch: query, srlimit: '3', format: 'json', formatversion: '2' })}`;
    const json = await (await request(url)).json();
    store.data[query] = (json.query?.search || []).map((hit) => hit.title);
    await store.save();
    await wait(250);
  }
  return new Map(queries.map((q) => [q, store.data[q] || []]));
}

// English Wikipedia's lead image per article (free licences only)
async function leadImages(titles, store) {
  for (const batch of chunks(titles.filter((t) => !(t in store.data)), 50)) {
    const url = `https://en.wikipedia.org/w/api.php?${new URLSearchParams({ action: 'query', prop: 'pageimages', piprop: 'name', pilicense: 'free', redirects: '1', format: 'json', formatversion: '2', titles: batch.join('|') })}`;
    const json = await (await request(url)).json();
    const renamed = new Map();
    for (const step of [...(json.query?.normalized || []), ...(json.query?.redirects || [])]) renamed.set(step.from, step.to);
    const byTitle = new Map((json.query?.pages || []).map((page) => [page.title, page.pageimage]));
    for (const title of batch) {
      let at = title;
      for (let hops = 0; renamed.has(at) && hops < 3; hops += 1) at = renamed.get(at);
      const image = byTitle.get(at);
      store.data[title] = image ? image.replace(/_/g, ' ') : null;
    }
    await store.save();
    await wait(250);
  }
  return new Map(titles.filter((t) => store.data[t]).map((t) => [t, store.data[t]]));
}

// Commons' search: the first few bitmap files
async function searchCommons(queries, store) {
  for (const query of queries.filter((q) => !(q in store.data))) {
    const url = `https://commons.wikimedia.org/w/api.php?${new URLSearchParams({ action: 'query', list: 'search', srnamespace: '6', srlimit: '6', srsearch: `${query.replace(/[()]/g, ' ')} filetype:bitmap`, format: 'json', formatversion: '2' })}`;
    const json = await (await request(url)).json();
    store.data[query] = (json.query?.search || []).map((hit) => hit.title.replace(/^File:/, ''));
    await store.save();
    await wait(250);
  }
  return new Map(queries.map((q) => [q, store.data[q] || []]));
}

// Commons: type, size, licence, author and a thumbnail URL per file
async function fileInfo(files, store) {
  for (const batch of chunks(files.filter((f) => !(f in store.data)), 50)) {
    const url = `https://commons.wikimedia.org/w/api.php?${new URLSearchParams({
      action: 'query',
      prop: 'imageinfo',
      iiprop: 'url|mime|size|extmetadata',
      iiurlwidth: String(FETCH_WIDTH),
      iiextmetadatafilter: 'Artist|Credit|LicenseShortName|LicenseUrl',
      format: 'json',
      formatversion: '2',
      titles: batch.map((file) => `File:${file}`).join('|'),
    })}`;
    const json = await (await request(url)).json();
    const renamed = new Map((json.query?.normalized || []).map((step) => [step.from, step.to]));
    const byTitle = new Map((json.query?.pages || []).map((page) => [page.title, page]));
    for (const file of batch) {
      const title = renamed.get(`File:${file}`) || `File:${file}`;
      const page = byTitle.get(title);
      const ii = page && !page.missing && page.imageinfo?.[0];
      if (!ii) {
        store.data[file] = null;
        continue;
      }
      const meta = ii.extmetadata || {};
      store.data[file] = {
        file: title.replace(/^File:/, ''),
        mime: ii.mime,
        width: ii.width,
        height: ii.height,
        thumb: ii.thumburl || ii.url,
        licence: plainText(meta.LicenseShortName?.value),
        licenceUrl: (meta.LicenseUrl?.value || '').replace(/^http:/, 'https:'),
        author: plainText(meta.Artist?.value) || plainText(meta.Credit?.value) || 'Unknown author',
      };
    }
    await store.save();
    await wait(250);
  }
  return new Map(files.filter((f) => store.data[f]).map((f) => [f, store.data[f]]));
}

const usable = (info) =>
  info &&
  !REJECT.has(info.file) &&
  OK_TYPES.has(info.mime) &&
  info.width >= 480 &&
  FREE_LICENCE.test(info.licence) &&
  !NOT_A_PHOTO.test(info.file.replace(/[_-]/g, ' '));

// Contact sheets: every pick, 40 a sheet, labelled with its key, to check by eye
async function contactSheets(rows) {
  const cell = { w: 300, h: 225, label: 34 };
  const cols = 5;
  const perSheet = 40;
  const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  for (const [n, part] of chunks(rows, perSheet).entries()) {
    const height = Math.ceil(part.length / cols) * (cell.h + cell.label);
    const tiles = await Promise.all(
      part.map(async ({ key, file }, i) => {
        const x = (i % cols) * cell.w;
        const y = Math.floor(i / cols) * (cell.h + cell.label);
        const photo = await sharp(file).resize(cell.w - 6, cell.h - 6, { fit: 'cover' }).png().toBuffer();
        const label = Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="${cell.w}" height="${cell.label}"><rect width="100%" height="100%" fill="#fff"/><text x="4" y="22" font-size="15" font-family="sans-serif">${escape(key)}</text></svg>`,
        );
        return [
          { input: photo, left: x + 3, top: y + 3 },
          { input: label, left: x, top: y + cell.h },
        ];
      }),
    );
    const sheet = join(cacheDir, `contact-${n + 1}.png`);
    await sharp({ create: { width: cols * cell.w, height, channels: 3, background: '#888' } }).composite(tiles.flat()).png().toFile(sheet);
    console.log(`contact sheet: ${sheet}`);
  }
}

async function main() {
  const festivals = await loadFestivals();
  const manifest = existsSync(manifestPath) ? await import(`${pathToFileURL(manifestPath).href}?t=${Date.now()}`) : { LICENCES: [], FESTIVAL_PHOTOS: {} };
  const kept = new Map();
  for (const festival of festivals) {
    const entry = manifest.FESTIVAL_PHOTOS[festival.key];
    // A hand pick is redone only when it isn't the file already made
    if (!entry || refresh || only.has(festival.key) || (OVERRIDES[festival.key] && OVERRIDES[festival.key] !== entry[4])) continue;
    const name = `${festival.key}-${entry[0]}`;
    if (existsSync(join(outDir, `${name}.avif`)) && existsSync(join(outDir, `${name}.webp`))) {
      kept.set(festival.key, { entry, licence: manifest.LICENCES[entry[3]] });
    }
  }
  // With --only, just those: the draft guides have hundreds of festivals with no photo yet,
  // and searching them all took more than 15 minutes (26 Nov 2026)
  const todo = festivals.filter((f) => !kept.has(f.key) && (!only.size || only.has(f.key)));
  console.log(`${festivals.length} festivals: ${kept.size} kept, ${todo.length} to find`);
  await mkdir(cacheDir, { recursive: true });

  // Candidates, in order: an override, Wikipedia's top results' lead images, Commons' search
  const hits = await searchWikipedia(todo.map((f) => f.query), await loadStore('wikipedia-search'));
  const titles = [...new Set(todo.flatMap((f) => (hits.get(f.query) || []).filter((t) => sharesWord(t, f.words))))];
  const lead = await leadImages(titles, await loadStore('lead'));
  const found = await searchCommons(todo.map((f) => f.query), await loadStore('commons-search'));
  const candidates = new Map(
    todo.map((f) => [
      f.key,
      LEAVE_OUT.has(f.key)
        ? []
        : [
        ...new Set(
          [
            OVERRIDES[f.key],
            // A Wikipedia result counts only when its title shares a word with the name
            ...(hits.get(f.query) || []).filter((t) => sharesWord(t, f.words)).map((t) => lead.get(t)),
            ...(found.get(f.query) || []),
          ].filter(Boolean),
        ),
      ],
    ]),
  );
  const info = await fileInfo([...new Set([...candidates.values()].flat())], await loadStore('commons'));
  const picks = new Map();
  // Never one photo for two festivals (the kept picks count): the first in A–Z order has it
  const used = new Set([...kept.values()].map(({ entry }) => entry[4]));
  for (const [key, list] of candidates) {
    const pick = list
      .map((file) => info.get(file))
      .find((i) => usable(i) && !used.has(i.file) && !(REJECT_FOR[key] || []).includes(i.file));
    if (!pick) continue;
    picks.set(key, pick);
    used.add(pick.file);
  }
  const missing = todo.filter((f) => !picks.has(f.key)).map((f) => `${f.key} ("${f.query}")`);
  console.log(`found ${picks.size} of ${todo.length}`);

  // Download and convert
  await mkdir(outDir, { recursive: true });
  const made = new Map();
  const failed = [];
  await eachLimited([...picks], 3, async ([key, pick]) => {
    try {
      const cached = join(cacheDir, `${createHash('sha1').update(pick.file).digest('hex').slice(0, 16)}.orig`);
      let buffer;
      if (existsSync(cached)) buffer = await readFile(cached);
      else {
        buffer = Buffer.from(await (await request(pick.thumb, { accept: 'image/*' })).arrayBuffer());
        await writeFile(cached, buffer);
        await wait(250);
      }
      const image = sharp(buffer, { failOn: 'none' }).rotate().resize({ width: MAX_WIDTH, height: MAX_HEIGHT, fit: 'inside', withoutEnlargement: true });
      const { data: avif, info: size } = await image.clone().avif({ quality: 50, effort: 5, chromaSubsampling: '4:2:0' }).toBuffer({ resolveWithObject: true });
      const webp = await image.clone().webp({ quality: 74, effort: 5 }).toBuffer();
      const name = `${key}-${size.width}`;
      await writeFile(join(outDir, `${name}.avif`), avif);
      await writeFile(join(outDir, `${name}.webp`), webp);
      made.set(key, { ...pick, w: size.width, h: size.height, path: join(outDir, `${name}.webp`) });
    } catch (err) {
      failed.push(`${key}: ${err.message}`);
    }
  });

  // The credits file, A–Z by key
  const licences = [];
  const licenceIndex = (name, url) => {
    let at = licences.findIndex(([n, u]) => n === name && u === url);
    if (at < 0) at = licences.push([name, url]) - 1;
    return at;
  };
  const rows = [];
  const sheetRows = [];
  for (const festival of [...festivals].sort((a, b) => a.key.localeCompare(b.key))) {
    const old = kept.get(festival.key);
    const fresh = made.get(festival.key);
    if (old) {
      const [w, h, author, , file] = old.entry;
      rows.push([festival.key, [w, h, author, licenceIndex(...old.licence), file]]);
      sheetRows.push({ key: festival.key, file: join(outDir, `${festival.key}-${w}.webp`) });
    } else if (fresh) {
      rows.push([festival.key, [fresh.w, fresh.h, shorten(cleanAuthor(fresh.author)), licenceIndex(fresh.licence, fresh.licenceUrl), fresh.file]]);
      sheetRows.push({ key: festival.key, file: fresh.path });
    }
  }
  const output = `// GENERATED by images/src/tools/festival-photos.mjs: don't edit by hand. Re-run it from the repo
// root (node images/src/tools/festival-photos.mjs) when the guides' festivals change; it keeps
// these picks and fills the gaps (OVERRIDES and REJECT in the script change one).
//
// A photo per festival in the country guides, from Wikimedia Commons, credited as its
// licence asks. The files are in the public bucket (copied in the repo's media/ folder) as
// festivalPhotos/<key>-<width>.avif and .webp, <key> being "<country code>-<festival slug>".
// ${rows.length} of ${festivals.length} festivals have one.

// [licence name, licence URL ('' when it has none, as for public domain)]
export const LICENCES = ${JSON.stringify(licences)};

// key: [width, height, author, licence (its place in LICENCES), Commons file name]
export const FESTIVAL_PHOTOS = {
${rows.map(([key, entry]) => `  ${JSON.stringify(key)}: ${JSON.stringify(entry)},`).join('\n')}
};
`;
  await writeFile(manifestPath, output);
  await contactSheets(sheetRows);
  console.log(`made ${made.size}, kept ${kept.size}`);
  console.log(`no photo: ${missing.length}${missing.length ? `\n  ${missing.join('\n  ')}` : ''}`);
  console.log(`failed: ${failed.length}${failed.length ? `\n  ${failed.join('\n  ')}` : ''}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

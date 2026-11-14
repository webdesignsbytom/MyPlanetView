# My Planet View: site design

How the site is built and why. Update this file whenever a decision changes. The database is [`server/prisma/schema.prisma`](../server/prisma/schema.prisma).

Last updated: 14 November 2026.

Planned features, and the decisions below they will change, are in [FEATURE-PLAN.md](FEATURE-PLAN.md).

## What the site does

People keep a travel map of the world: the countries they've been to, photos from their trips, the landmarks in those photos, and the trips they're planning. Everything is private unless the owner shares it.

## Stack and hosting

| Part | What | Where |
| --- | --- | --- |
| Client | React 19 + Vite, from the DummyFullstack template. Public pages are pre-rendered at build time. | InMotion Hosting (cPanel). Build locally, upload `dist/` including `.htaccess`. |
| API | Express 5, Prisma 7 (Postgres), better-auth | Vercel, on `api.<domain>` so the login cookie is same-site |
| Files | Cloudflare R2: one private bucket (photos), one public bucket (site images) | Public bucket on a custom domain; `r2.dev` addresses are rate-limited and meant for development |

**Why not Next.js.** Almost the whole product sits behind a login or a private share link, so nothing user-made is ever indexed. The public pages are a handful of fixed pages that pre-rendering covers. The SVG map runs in the browser either way. A separate API can also serve a phone app later.

## Pages

| Indexed, pre-rendered, in the sitemap | App only: `noindex`, not in the sitemap, disallowed in robots.txt |
| --- | --- |
| Home, About, FAQ, Contact, Privacy, Terms | Login, sign-up, password reset, email verification, the maps, trips, shared views, account, admin |

The SEO playbook (`documents/SEO-PLAYBOOK.md`) applies to the indexed pages:
- titles of 60 characters or fewer;
- descriptions of 120–156 characters, in whole sentences;
- every page's content in the pre-rendered HTML;
- the sitemap lists only the pages above.

Analytics never runs on a share page, because the share code is in the address.

**Planned:** public country pages (`/countries/<slug>`) and a Pricing page, indexed and in the sitemap. See [FEATURE-PLAN.md](FEATURE-PLAN.md#country-pages-culture-and-seasons).

## Look

The look comes from my_planet, the newer version of the old site: a 1950s travel poster.

**Travel paperwork** (agreed 14 Nov 2026, starting from the boarding-pass login page). Every surface is a piece of vintage travel paperwork. No heavy black borders anywhere; edges are thin saddle brown.

| Surface | Paperwork |
| --- | --- |
| Forms (login, sign-up, contact) | Boarding pass (`TravelTicket` + `TicketStub`) |
| Panels over the map (settings, country, stats, trips, sharing) | Paper panel: aged parchment header, cream body, perforated divider, stamp close button |
| Small floating labels (map title, stats, key) | Luggage tags |
| The hover pop-up | Postcard, with the star badge as its stamp |
| Map toolbar and zoom buttons | Round rubber stamps, like the home page's "Start your map" |
| Info pages | Postcard and ticket cards inside the red poster frame |

Shared CSS pieces in `client/src/styles/index.css`:
- `ticket-edge`: a 2px brown border, a dashed "printed" line just inside it, and a warm shadow;
- `paper-aged`: parchment with a browned vignette;
- tokens `paper-cream` (follows light and dark mode) and `shadow-paper`;
- `btn-poster` (primary: poster red, brown edge, travel font, paper shadow, like the nav buttons) and `btn-paper` (secondary, on parchment), for every form submit and call to action;
- **square corners everywhere**: Tailwind's `--radius-*` tokens are set to 0 in `@theme`, so every `rounded-*` class, the buttons and the dropdowns are square. Only true circles (`rounded-full`) stay round: stamps, badges, rivets, notches.

The red poster frame's corners are brass corner protectors, like an old steamer trunk's (`components/common/BrassCorner.jsx`, placed by `BrassCorners.jsx`; `--brass-*` tokens). They replaced the flat gold triangles. The navbar sits above them.

- **Colour tokens** follow NextDummy's `globals.css` approach:
  - `colour1`–`colour5` are fixed neutrals (white, black, greys) and never change between projects.
  - `colour6`–`colour9` are the theme, from my_planet:
    - `colour6` poster red: `#b91c1c` light / `#f87171` dark (6.5:1 and 6.8:1 as text);
    - `colour7` ocean blue;
    - `colour8` parchment;
    - `colour9` saddle brown.
  - `poster-*` are fixed artwork colours, the same in light and dark mode like a printed poster: the frame red, gold corners, nav paper, brown edge, ink and cream.
  - There are also fixed status colours.
  - Components use tokens only: no hex values or Tailwind palette colours in components.
- **Layout and classes:** layout is grid and gap. Classes are written inline on the element.
- **Fonts:**
  - **TravelFont** (SF Comic Script Bold, from my_planet) for page titles, section headings, the nav and the posters, with a black outline on the home headline;
  - Poppins for body text.

  The travel font's licence must be checked before launch.
- **Home page** (my_planet's):
  - a red frame round the page with gold triangles in the corners;
  - the fifties adventure artwork behind "PICTURE YOUR TRAVEL";
  - the welcome strip;
  - a big round, rustic "Start your map" stamp button.

  On desktop the nav is a parchment column inside the frame; the content sections follow on paper.
- **Navigation:** parchment with a brown edge, the camera logo, and red poster buttons in the travel face, with the current page inverted. A bar on every page; on the home page a column from `lg` up.
- **Footer:** the same parchment, brown edge and travel-face headings.
- **Components:** every piece is its own component, one per file. Pages follow the template's `PageHeader` + `MainContainer` pattern.
- **The map** is the existing SVG world map, and only that. There is no Google Maps, MapLibre or other real-world map.
  - The four map styles stay: Animated sea, Old Map, Jupiter Clouds and Galaxy. Each style switches the theme tokens through a `data-map-style` attribute instead of hardcoded classes. Galaxy has my_planet's black panels with white text.
  - **my_planet's extra options:**
    - show / hide the countries you have and haven't been to (a hidden group fades back);
    - a red map banner with the travellers' names;
    - a **Detailed** map type (names, grid lines and landmark pins at every zoom);
    - the sun and moon placed by the time of day;
    - wavy lines drifting over the animated sea (paused when the tab is hidden, off for reduced motion).

    my_planet's "detailed" map image is a different projection, so it's only the picker's preview, never a background.
  - **The map is a Robinson projection** (measured 14 Nov 2026 against known coastlines; within about 2 units on a map 2000 wide):
    - x = 987.1 + 5.681 × X(lat) × longitude;
    - y = 502 − 518.6 × Y(lat), negative south of the equator;
    - X and Y are Robinson's standard 5° tables.

    So any real position (a landmark, a photo's GPS) can be placed on the map exactly. The equator is at y = 502, and the shapes end at about y = 857, with no Antarctica.
  - **Country pins** are the centre of each country's largest shape. Micro-states with no shape are pinned from their real position.
  - **Where the shapes come from.** The old map was hand-copied from simplemaps.com's free world SVG (MIT licence), with mistakes:
    - Belarus didn't draw (a stray quote mark);
    - Chile had only its southern island, twice;
    - Eswatini was listed twice;
    - many paths ended in stray letters.

    The shapes are now generated straight from that SVG, keyed by ISO code, with the licence notice kept in the generated file. 219 countries have shapes. Liechtenstein, Monaco, San Marino, Singapore and the Vatican have none and are drawn as a dot at their pin.
  - **Grid lines.** The old latitude/longitude lines were drawn as a straight even grid. On a Robinson map they're redrawn from the projection.
- **Country posters:**
  - my_planet's 170 posters cover 167 countries (`client/src/utils/map/posterData.js`). They show in the hover box (when you have no photos from there) and in the country panel.
  - Each is AVIF at 400 and 800 px, plus a 400 px WebP fallback.
  - The 57 countries without a poster get a placeholder card with their name in the travel face, never another country's poster.
- **Backgrounds:** the home artwork, the map styles' backgrounds and the "detailed" preview are image sets too.

## Accounts

- **Sign-in:** better-auth with email and password. Roles are `USER`, `ADMIN` and `DEVELOPER`; admin pages check the role on the server.
- **Group types.** At sign-up the user picks who the map is for: **solo**, **couple** or **family**. That creates their default map.
- **Travellers.** The people a map is for are its **travellers**: the solo traveller, both halves of a couple, every member of a family.
  - Each traveller has a name, a birth country and a favourite country, as in the old setup form.
  - A traveller doesn't need a login, so children can be on the family map.
  - A traveller is linked to an account when that person has one.
- **Sharing a login.** A couple or family can share one login. Recommended instead: each adult has their own login and is added to the map as an editor, so everyone uploads from their own phone and nobody's photos are stuck behind someone else's password.
- **Per-person stats.** Trips record which travellers went. Stats like "Sarah: 18 countries" come from those trips; the map's own visited countries are the group's combined total.
- **Profile.** Each login's profile holds an optional username, a home country, and map viewing preferences (style, grid lines, animations).

## Sharing

It works like Google Docs.

- **Ownership:** a map and a trip each have one owner.
- **Adding people:** the owner adds people by email as **viewer** or **editor**.
  - If the person already has an account, they get access straight away plus an email.
  - If they don't, they get an invite email. Access is granted when they sign up and verify that address.
- **General access** is either **Restricted** (only people added) or **Anyone with the link**.
  - A link only ever lets people view. Editors must be added by email.
  - Anyone with a link can view without signing in.
- **Share codes** are random and unambiguous, e.g. `K7QX-M2PA-9RTW`. "Reset link" makes a new code, so old links stop working.
- **Rate limits** are counted in the database (shared across Vercel instances), per IP:
  - opening a share link: 30 per 15 minutes (where codes would be guessed);
  - browsing an open link (its photo pages and photos): 300 per 15 minutes, on a separate counter;
  - accepting an invite: 30 per 15 minutes;
  - photo presigns: 120 per 15 minutes;
  - adding people: 20 an hour.

  The whole API's in-memory limit was raised from the template's 300 to 1000 per 15 minutes, because an app session makes far more calls than a marketing site.
- **Trips:** a trip can be shared on its own without sharing the whole map. Access to a trip comes from owning its map, being a member of its map, or being a member of the trip. The highest role wins.
- **Link previews** (WhatsApp, iMessage) come from a small Vercel route, e.g. `share.<domain>/<code>`, because the cPanel host only serves fixed files.
  - The preview shows the owner's coloured world map, never their photos.
  - The route then sends the visitor on to the app.

## Photos

### Uploading

1. **In the browser:**
   - read the date and GPS position from the photo's EXIF;
   - make a thumbnail (~400 px) and a display size (~1600 px).

   Re-encoding removes the EXIF from those two files, location included. Resizing in the browser also keeps Vercel's work, and its cost, low.
2. **Upload:** each file goes straight to the **private** bucket through a presigned URL, never through Vercel.
3. **Confirm:** the API checks each file's real size in R2 (the template's confirm-upload step). It then records a `MediaItem` per file, plus the `Photo` and its `PhotoVariant`s.
4. **Country:** the photo's country comes from its GPS position, using an offline lookup against country borders, not a paid API. That marks the country as visited.
5. **Landmarks:** landmarks within their match radius are suggested, and the user confirms them.

### Why three files per photo

| File | Typical size | Used for | Location data |
| --- | --- | --- | --- |
| Original | 3–8 MB | Owner and editors download it; landmark matching | Kept |
| Display (~1600 px) | ~300–500 KB | Opening a photo | Removed |
| Thumbnail (~400 px) | ~30–60 KB | Map hover slideshow, grids, trip covers | Removed |

- **Speed.** A grid of 50 photos is about 2 MB of thumbnails, against about 250 MB of originals.
- **Privacy.** An original carries GPS precise to a few metres. A viewer who downloads a photo taken at someone's home would have their address.
- **Compatibility.** iPhone originals can be HEIC, which most browsers can't display. The copies are in formats every browser shows.
- **Cost.** The copies add roughly 10% to storage. Resizing on request instead (Cloudflare or Vercel image services) bills per transformation and gets complicated with private files.

### Viewing

- **Signed URLs:** files are served through short-lived signed URLs, so removing someone's access really cuts it off.
- **Viewers** get the thumbnail and display sizes only. They never get hidden photos or GPS coordinates.
- **The original** is always kept. Only the owner and editors can download it, because it still contains its location. (Planned: kept only on Business and First Class. Economy keeps a 2,400 px JPEG print copy instead, so it's still three files per photo. See [FEATURE-PLAN.md](FEATURE-PLAN.md#which-copies-each-tier-keeps).)

## Storage use and future paid tiers

**There are no storage caps for now.** (Planned for launch: three tiers, Economy (free), Business and First Class, each with a cap per country. See [FEATURE-PLAN.md](FEATURE-PLAN.md#tiers-economy-business-and-first-class).) The design keeps tiers easy to add later:

- **Usage is already measured.** Every file's real size is stored in `MediaItem.bytes` when its upload is confirmed. An account's usage is the sum of `bytes` for files it uploaded, so caps can be added later without backfilling anything.
- **Usage counts against the uploader**, not the map owner. On a shared map, each person's uploads count against their own account.
- **Adding tiers later:**
  - Add a `plan` to the account (e.g. `FREE`, `PLUS`).
  - Put each plan's limits in one constants file.
  - Check the limit when an upload is presigned (estimated size) and again at confirm-upload (real size; delete the file and refuse if it's over).
  - Payments can come from NextDummy's Stripe code, with its webhook setting the plan.
- **Levers a tier can pull:**
  - total storage;
  - whether the full-size file is kept (usually most of the storage);
  - largest single upload;
  - number of maps;
  - number of editors per map.
- **Downgrades never delete anything.** An account over its new cap keeps everything but can't upload until it's under again.
- **Cost:** R2 charges for storage and operations, not for downloads. Storage is the line to watch.

## Privacy rules

- Everything is private by default.
- GPS coordinates are shown only to the owner and editors. They are never inside a file a viewer can open.
- Share pages are `noindex`, and analytics doesn't run on them.
- Planned: Economy maps show travel affiliate cards to everyone viewing them, and Business maps show fewer to non-paying viewers. They're plain links with no ad scripts or tracking. Paying members never see them, and a Travel Desk button opens offers on request. See [FEATURE-PLAN.md](FEATURE-PLAN.md#ads-by-tier).
- Deleting an account deletes that person's uploads. A map with other editors is handed to one of them first, or the deletion is refused, so nobody loses photos with someone else's account.

## Database

- **The schema:** see [`schema.prisma`](../server/prisma/schema.prisma), checked with Prisma 7.4.2, with one fresh `init` migration. The old database only held fake seed data, so the site starts on a fresh database with a new seed. No old data or passwords are carried over.
- **Kept from the template:** the better-auth tables, `Profile`, `MediaItem`, `AvatarMediaItem`, a trimmed `ContactForm`, `AppEvent`, and `RateLimit` (from NextDummy).
- **New:**
  - `Country` and `Landmark` (seeded);
  - `TravelMap` (with its group type), `Traveller`, `MapMember`, `Trip`, `TripTraveller`, `TripMember`, `TripStop` and `ShareInvite`;
  - `CountryVisit`;
  - `Photo`, `PhotoVariant` and `PhotoLandmark`.
- **Stats** (countries, continents, photos, landmarks) are counted from these tables, never stored.

## Removed from the template

- **Features:** blog, newsletter, booking, reviews, guest book, callback form, gallery and links pages, plus the front-end rebuild hook (nothing public changes with user data).
- **Folders:** `templates/`, the Memento SEO data, and the build outputs.
- **Settings:** the placeholder Spotify, Printful, Stripe and PayPal settings.

## Port order

1. Strip the template down to what this site uses.
2. Bring in the colour tokens and the current site's look.
3. Move the schema into the server, then build its routes.
4. Port the client page by page, one component per file.
5. Move the old `client/` and `server/` into `archive/`, where they still run for comparison.
6. Audit the result.

## Open items

- **Nothing has run for real yet.** The API, the database, R2 and the browser app have only been checked statically (lint, builds, syntax and import checks, pure-logic tests). Run the migration, the seed and the server tests, and try every flow in a browser.
- **The domain name.** The API, share and media subdomains hang off it. `myplanetview.com` is the intended domain (not registered yet), already in the client and server constants.
- **Landmark coordinates.** 161 of the 177 landmarks were checked against Wikidata on 14 Nov 2026, and each entry names its Wikidata item. The 16 marked `// unverified` (ranges, trails, and names Wikidata couldn't match) still need checking by hand: a photo is matched by distance.
- **GA4 setting.** In the GA4 property, turn off "page changes based on browser history events". Otherwise a tag loaded earlier can record a share or invite address after an in-app navigation.
- **Who has access.** Editors and viewers can't yet see who else has access: `GET …/sharing` is owner-only, so they see only their own role and a "leave" button.
- **Coarse borders.** A photo taken near a border can be placed in the neighbouring country, because the map's shapes are coarse (Victoria Falls, Kaesong and the Western Wall do). Users can correct the country.
- **Missing shapes.** Bioko island (Equatorial Guinea) has no shape, and nor do Liechtenstein, Monaco, San Marino, Singapore and the Vatican. The micro-states are drawn as dots; the server places photos in all of these with circles around known positions.
- **Brand assets.** The logo, favicons and share image (`client/public/brand/`, `client/public/favicon/`) are still ByteToast's.
- **Client env examples.** `client/.env.development.example` and `client/.env.production.example` still list keys nothing reads. Keep only `VITE_API_URL`, `VITE_MEDIA_CDN` and `VITE_ANALYTICS_ID`.
- **HEIC.** Check that iPhone photos upload correctly in browsers other than Safari (they're converted in the browser for the copies; the original is kept as uploaded).

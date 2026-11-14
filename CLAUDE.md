# CLAUDE.md

Guidance for Claude Code working in this repository.

## Env files: hard rule

**Never read `.env`, `.env.local`, `.env.development`, `.env.production`, `.env.test` or any other `.env*` file, in `client/` or `server/`, through any tool.** The only exception is `server/.env.example`. The client's `.env.*.example` files are off limits too (the user's global rule allows only `.env.example`).

- Running code that loads env values counts as reading them. A user-level hook blocks shell commands containing the text `.env`, which includes `process.env` and `import.meta.env`. Search for env usage with the Grep tool instead (e.g. pattern `env\.[A-Z_]+` or `VITE_[A-Z_]+`).
- If a value is needed, tell the user which variable to set.
- `npm run env:check` in `server/` lists missing keys by name only.

### What Claude may run (reads no env file)

**Client** (`client/`):
- `npx eslint .`
- `node scripts/check-meta.mjs`
- `node scripts/check-house-rules.mjs`
- `npx vite build --mode verify --outDir <scratch dir> --emptyOutDir`
  - Vite always loads `.env` and `.env.local`; `client/` has neither, and no `.env.verify` exists, so no env file is read.
  - Delete the output afterwards.
- `npm run dev:mock` (`vite --mode mock`; no `.env.mock` exists, so it reads no env file either): the site with no server, for looking at pages and flows (e.g. headless Playwright screenshots). Use a free port (`npx vite --mode mock --port 5174 --strictPort --open false`; without `--open false` the config's `open: true` opens a tab in the user's browser) and stop it afterwards.

**Server** (`server/`):
- `node --check <file>` on any source file.
- Vitest for pure tests only. Write a config in a scratch folder with `root` set to `server/` and `envDir` set to an empty folder, exclude `tests/integration/**`, then run `node <server>/node_modules/vitest/vitest.mjs run --config <that file>` **from that scratch folder**, so `dotenv/config` (which reads the env file in the working folder) loads nothing. `email.test.js` and `errorHandler.test.js` run this way too; `errorHandler.test.js` imports the app, so pass placeholder `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `FRONTEND_ORIGIN` and `DATABASE_URL` on the command line.
- **Integration tests** (`tests/integration/`, `vitest.integration.config.js`: supertest against the real app and a real Postgres; only the private-bucket S3 client and email sending are mocked in `tests/integration/setup.js`):
  - they refuse to run unless `DATABASE_URL` names a database ending in `_test` (checked in `globalSetup.js` and again in `helpers.js`), and clean up only the users they created;
  - Claude runs them from a folder with no env file (so `dotenv/config` loads nothing), passing local values on the command line: `DATABASE_URL` (a migrated `*_test` database), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL=http://localhost:4000`, `FRONTEND_ORIGIN=http://localhost:5173` and placeholder `STORAGE_*` values, then `node <server>/node_modules/vitest/vitest.mjs run --root <server> --config <server>/vitest.integration.config.js`. The config's `envDir` is an empty folder;
  - migrate the test database with Prisma from a scratch folder (above), with that database's URL.
- **Prisma, only from a scratch folder:**
  - copy `prisma/schema.prisma` there;
  - add a plain `prisma.config.mjs` exporting `{ schema: 'schema.prisma', datasource: { url: 'postgresql://placeholder:placeholder@localhost:5432/placeholder' } }`;
  - run the CLI from `server/node_modules/prisma/build/index.js` (`validate`, `format`, `migrate diff --from-empty|--from-schema … --to-schema … --script`).

  Never run Prisma inside `server/`: its `prisma.config.ts` imports `dotenv/config`.

### What only the user runs

- **Client:** `npm run dev`, `npm run build` (the post-build scripts load `.env.production` for `VITE_API_URL`), `npm run preview`, `npm run test:e2e`, `npm run lighthouse`, `npm run knip`.
- **Server:** `npm run dev`, `npm start`, `npm test`, `npm run test:integration` (with `DATABASE_URL` set to a migrated `*_test` database), `npx prisma migrate dev|deploy`, `npx prisma db seed`, `npm run media:cleanup`, `npm run db:reference`, and every script in `src/services/s3/` (they print bucket details).

## What this is

My Planet View: people keep a private travel map of the world. They mark the countries they've visited, upload trip photos (matched to landmarks), plan trips, and share maps or trips Google Docs style. The design decisions and their reasons are in `docs/SITE-DESIGN.md`; the client–server contract for the travel features is `docs/API.md`. Keep both in step with the code.

| Folder | What |
| --- | --- |
| `client/` | Vite 7 + React 19 SPA, Tailwind 4, React Router 7. Public pages are pre-rendered at build. Hosted on InMotion (cPanel): build locally, upload `dist/`. |
| `server/` | Express 5 API, Prisma 7 (Postgres), better-auth 1.4.13, S3-compatible storage (Cloudflare R2), email through Resend. Hosted on Vercel. |
| `docs/` (repo root) | `SITE-DESIGN.md`, `API.md`. |
| `documents/` | `SEO-PLAYBOOK.md` (read sections 1, 3 and 6.22 before SEO work), `SECURITY-BASELINE.md` (from NextDummy; a checklist, not this code), `site/SiteInfo.md`. |
| `images/` | Standalone image toolchain (`npm run img:gen`): makes `<name>-<width>.{avif,webp,jpg}` sets. |

No CI runs. `.github/ci.example.yml` is an example kept outside `workflows/` on purpose.

## The travel model (`server/prisma/schema.prisma`)

- **`TravelMap`**: one owner. It has a `groupType` (`SOLO`, `COUPLE`, `FAMILY`), a `linkAccess` (`RESTRICTED` or `ANYONE_WITH_LINK`) and a unique `shareCode`.
  - Every user gets a default map ("My map", `isDefault`) from a better-auth hook at sign-up. There's one default per user, enforced in code, not by an index.
  - The default map can't be deleted.
- **`Traveller`**: the people a map is for (no login needed; `userId` when linked), with birth and favourite countries. A couple or family can share one login, or each adult has their own and is added as `EDITOR`.
- **Who has access:**
  - **`MapMember`** and **`TripMember`**: people added as `VIEWER` or `EDITOR`. The owner is never a member row.
  - **`ShareInvite`**: an emailed invite for an address with no account yet. The token is stored hashed, and a CHECK constraint in the init migration makes it target exactly one of a map or a trip. It turns into a member when that address signs up and is verified.
- **`CountryVisit`** (map × country): `VISITED`, `LIVED` or `WANT_TO_GO`, with a `source`: `MANUAL`, `PHOTO` or `TRIP`.
- **Trips:**
  - **`Trip`**: status `PLANNED`, `ACTIVE` or `COMPLETED`. Completing a trip adds `TRIP` visits for its stops' countries.
  - **`TripStop`**: country, landmark or place name, dates and position.
  - **`TripTraveller`**: who went. Per-person stats come from trips.
- **Photos:**
  - **`Photo`**: `latitude`/`longitude` are visible to editors only; `hidden` hides it from viewers.
  - **`PhotoVariant`**: one per size, `THUMB`, `DISPLAY` or `ORIGINAL`, each a `MediaItem`.
  - **`PhotoLandmark`**: `GPS` suggestions with `confirmed: false`, or `MANUAL` matches.
- **Reference data:**
  - **`Country`** (PK = ISO alpha-2, plus `IC` Canary Islands and `XK` Kosovo) and **`Landmark`** (lat/lng, `matchRadiusM`, map pin) are seeded and never edited by users.
- **Stats** (countries, continents, photos, landmarks, per traveller) are computed, never stored (`server/src/utils/mapStats.js`).

The template's `User`/`Session`/`Account`/`Verification` (owned by better-auth), `Profile` (username, home country and `mapSettings` JSON), `MediaItem`, `AvatarMediaItem`, `ContactForm` (name, email, message, optional image), `RateLimit` and `AppEvent` remain.

**Migrations.** There is one `init` migration. Make new ones without a database: run `migrate diff --from-schema <copy of the old schema> --to-schema prisma/schema.prisma --script` from a scratch folder (see above) into `prisma/migrations/<timestamp>_<name>/migration.sql`. Prisma can't express partial indexes, and drops unknown ones on the next diff: enforce such rules in code. CHECK constraints are safe.

## Access and sharing

The full rules are in `docs/API.md`, under "Access":
- **Map role:** owner, else the `MapMember` role.
- **Trip role:** the higher of the map role and the `TripMember` role.
- **Link visitors:** a share code with link access on gives `VIEWER`, signed in or not, through `/api/shared/:code` only.
- **What viewers never get:** hidden photos, GPS coordinates or originals.
- **No role at all → 404** (so ids and codes can't be probed). A role that isn't enough → 403.

- **The rules** are pure functions in `server/src/utils/access.js` (tested). Controllers load a row together with the caller's membership (`controllers/helpers/travel.js`: `loadMap`, `loadTrip`, `loadPhoto`, `loadUploadTarget`) and decide with them.
- **The Prisma trap these queries avoid:** `where: { userId: undefined }` means *no filter*. So the access selects in `domain/maps.js`, `domain/trips.js` and `domain/photos.js` only add `members: { where: { userId } }` when there is a user. Keep that pattern in any new access query, or an anonymous request inherits the first member's role.
- **Share codes:** 12 characters from `23456789ABCDEFGHJKMNPQRSTVWXYZ`, shown `XXXX-XXXX-XXXX`, normalised on lookup (`utils/shareCodes.js`). Reset = new code.
- **Invite tokens** are hashed with SHA-256.
- **Owner-only:** the sharing routes (`controllers/sharing.js`, one module for maps and trips). Editors can't list members yet.
- **Leaving an account** (`services/travel/accounts.js`, from better-auth's `beforeDelete`):
  - each owned map with an editor passes to the longest-standing active editor (a deactivated one only if no other editor exists; `heirOf`);
  - the person's uploads are deleted with their files;
  - their other owned maps are deleted with their files.

## The photo pipeline

1. **In the browser** (`client/src/utils/photos/`):
   - `readPhotoMeta.js` reads the date and GPS with `exifr` (lazy-loaded);
   - `makePhotoCopies.js` draws `THUMB` (400 px) and `DISPLAY` (1600 px) on a canvas, which drops all EXIF. HEIC that the browser can't decode goes through a lazy-loaded `heic2any`. The original is kept untouched.
2. **Upload** (`uploadPhoto.js` → `POST /api/maps/:mapId/photos/presign`): the browser `PUT`s each file straight to the **private** bucket (`putFile.js`, XHR for progress). Keys are `myplanetview/photos/<mapId>/<photoId>/<size>-<random>.<ext>`.
3. **Confirm** (`POST /api/maps/:mapId/photos`):
   - the server HEADs each object (real size and type, within `PHOTO_MAX_BYTES`), then creates the `MediaItem`s, the `Photo` and its `PhotoVariant`s in one transaction;
   - with GPS, it sets the country (`utils/countryLookup.js`), adds a `PHOTO` visit and suggests landmarks within `matchRadiusM` (`utils/landmarkMatch.js`);
   - without GPS, the client sends a `countryCode`.
4. **Viewing:** signed GETs (`signPhotoUrl`), signed at the start of the hour and valid for two (`PHOTO_URL_TTL_SECONDS`), so the browser cache works.
   - The `photo` entry in `MEDIA_CFG` is private, and the generic `/api/media-services` routes refuse its keys.
   - The daily cron never deletes media a `PhotoVariant` uses.

## The map: projection, shapes and country data

- **Projection.** The SVG world map is a **Robinson projection**, viewBox `0 0 2000 857`, measured against known coastlines (about ±2 units):
  - x = 987.1 + 5.681 × X(lat) × lng;
  - y = 502 − 518.6 × sign(lat) × Y(lat).

  It's implemented twice, in `client/src/utils/map/projection.js` and `server/src/utils/projection.js`, and the two must stay identical.
- **Shapes:**
  - `client/src/utils/map/countryShapes.js` is generated from simplemaps.com's world SVG (MIT; keep the notice in the file header), keyed by ISO code;
  - `server/src/data/countryShapes.json` holds the same shapes as polygons, for point-in-polygon;
  - `client/src/utils/map/countryStyle.js` is generated by `node scripts/generate-country-style.mjs` (in `client/`; re-run it if the shapes change). It gives every country one of the old map's seven pastels (`--map-visit-1`…`7`), chosen so touching countries never match, plus the width of its main shape so a name is only drawn once it fits.
  - Visited and lived-in countries carry a 1950s star-sticker badge at their pin: `components/map/StarBadge.jsx` (SVG `<symbol>`s plus an HTML icon for the key), placed by `VisitBadges.jsx`, with sizes and ids in `utils/map/badges.js`. "Want to go" is a dashed outline.
  - Liechtenstein, Monaco, San Marino, Singapore, the Vatican and Bioko island have no shape. The client draws the micro-states as dots (`MicroStateDot`); the server uses circles.
- **Country lists.** `server/prisma/seed/data/countries.js` (seeded into `Country`) and `client/src/utils/map/countries.js` are copies of each other: 224 countries with code, name, slug, continent and pin. Keep them in step.
- **Landmarks** are in `server/prisma/seed/data/landmarks.js`, 177 of them. 161 have coordinates checked against Wikidata (14 Nov 2026), each with a `// Wikidata Q…` comment. The 16 marked `// unverified` still need checking by hand before launch. Pins are computed from lat/lng by the seed.

## Seed

`npx prisma db seed` (the user runs it) **wipes every table**, and refuses to run when `IS_PRODUCTION_DATABASE=true`. In order, it seeds:
1. countries;
2. landmarks;
3. users, through better-auth sign-up (`user@gmail.com`, `tom@gmail.com` (ADMIN), `dev@gmail.com`, password `12345678`); the sign-up hook makes their default maps;
4. demo travel data (`seed/travel.js`): the USER's map becomes a couple's map, with the ADMIN as editor, 9 countries, one completed and one planned trip, and no photos;
5. one contact form.

Production never gets the seed. Its countries and landmarks come from `npm run db:reference` (`scripts/load-reference-data.mjs` → `prisma/seed/reference.js`), which upserts countries by `code` and landmarks by `slug` and never deletes. Renaming a landmark therefore makes a new row; remove the old one by hand.

## Client architecture

- **Routing.**
  - `client/src/App.jsx` is the route table; path constants live in `utils/constants/routes.js`. Never hardcode paths.
  - Home and FAQ are eager. Every other page is a `lazyPage()` in `utils/navigation/lazyPages.js`, with its static path in `PAGES_BY_PATH`, used for the first-render preload and Navbar prefetch.
- **Adding a page touches:**
  - `App.jsx` and `routes.js`;
  - if it's public, `PUBLIC_STATIC_ROUTES` plus `utils/data/helmetData.js` and `metaData.js`;
  - if it's browser-only (signed in, share or invite links), `CLIENT_ONLY_ROUTE_PREFIXES`, or the hosts will 404 it;
  - and `lazyPages.js`.
- **Guards** (`utils/user/AuthenticateUser.jsx`):
  - `AuthenticateUser`: `/map`, `/maps/:mapId`, `/trips/:tripId`, `/welcome`, `/account`;
  - `AuthenticateAdmin` (ADMIN or DEVELOPER): `/admin`, `/admin/contact-forms`, `/admin/users`;
  - `AuthenticateDeveloper`: `/admin/events`;
  - no guard: `/shared/:code` and `/invite/:token`.

  The guards pass `state.from`. Client checks are UX only; the server enforces everything.
- **Analytics** (GA4) starts only after cookie consent, on idle. Never on `ANALYTICS_EXCLUDED_PREFIXES` (`/shared`, `/invite`): their addresses carry secrets.
- **Providers:** `main.jsx` mounts `HeadProvider` → `BrowserRouter` → `AuthProvider` → `App`.
- **Auth:** a cookie session (`withCredentials`); `useAuth()` exposes better-auth's account actions. Sign-up goes to `/welcome`, the onboarding that edits the default map. The login, sign-up, forgot and reset pages share `components/auth/AuthPageLayout` (red poster frame, one `<main>`) and `TravelTicket` (a boarding-pass card: parchment header with the page's h1, the form on theme tokens, a decorative `TicketStub`).
- **Mock mode** (development only; the default for `npm run dev`, as the user asked to be always signed in as a test user):
  - `main.jsx` imports `src/dev/mock/installMock.js` when `import.meta.env.DEV` and `devUsesMock()`. That is true when MODE is `mock`, or unless the browser chose the real API: `?api=real` / `?api=mock` are stored as `localStorage['mpv:apiSource']`, and the badge has "Use real API".
  - Production builds compile `DEV` to false, so none of it ships (checked: no mock strings in `dist/`, including `mpv:apiSource`).
  - It puts an Axios adapter (`mockAdapter.js`) on the exported `httpClient` and on the global axios, and patches XHR for the presigned-upload host (`mockXhr.js`), so no request leaves the browser.
  - The handlers in `src/dev/mock/handlers/` follow `docs/API.md` and the access rules. The store (`store.js`, seeded by `seed.js`) lives in localStorage; uploaded files are session blob URLs.
  - `data/landmarks.js` copies the server's landmark data; re-copy it when that changes. **When an endpoint or response shape changes, update its mock handler too.**
- **API layer:**
  - `api/client.js` is one Axios instance: errors become `error.friendlyMessage`, payloads are at `res.data.data`;
  - `api/travelApi.js` wraps every travel endpoint;
  - endpoint paths are constants in `utils/constants/apiRoutes.js`.
- **Travel state:**
  - `hooks/useTravelMap.js`: map, visits, stats and trips, plus mutations; visit changes are optimistic with rollback;
  - `useMapSettings.js`: saved to the profile when signed in, localStorage otherwise;
  - `useMapViewport.js`: pan and zoom through the viewBox, mouse/touch/pinch, double-tap or double-click to zoom ×2 on the spot, and the grabbing-hand cursor while a mouse button is held (`data-grabbing` on the SVG). Map click handlers go through its `afterTap(action)`, which ignores the click ending a drag or a double-tap and waits 300 ms so a double-tap doesn't also open a country;
  - `usePhotoPage.js`, `useLandmarks.js`.

  Panel state lives in the page (`useReducer`). Use functional state updates.
- **Components:** one per file, under `components/map|photos|trips|sharing|onboarding/` and the template's folders. Pages follow the PageHeader + MainContainer pattern. Every page renders exactly one `<main id="main-content" tabIndex={-1}>`. Modals use `hooks/useModalA11y.js`. Form inputs go in `components/ui/FormField`. Dropdowns are the `components/ui/*OptionSelect` components, never a bare `<select>`.
- **Identity** comes from `utils/constants/constants.js` (name, URL, operator, address, theme colour), never a literal in a component. The domain `myplanetview.com` is the intended one, not registered yet. `server/src/utils/constants/siteConstants.js` must use the same host (`server/tests/siteUrl.test.js`).
- **Images:**
  - `ResponsiveImage` and `AppImage` use the `<name>-<width>.<ext>` sets under `src/assets/images/<folder>/` (`lib/media/imageManifest.js`, avif/webp/jpg only);
  - the home artwork (`pages/home/`), the map-style backgrounds and the detailed preview (`map-styles/`) and the logo (`brand/`) come from my_planet, converted with `images/`;
  - the navbar logo and the home artwork import their files directly, keeping the image manifest out of eager pages.
- **Country posters** are not in the build. They're in the public bucket as `visitCountryPosters/<name>-800.avif` plus an 800 px WebP fallback, and the repo's `media/` folder (outside `client/`) holds the same files to upload.
  - `utils/map/posterData.js` lists them (167 countries, a placeholder card for the rest) and builds their URLs with `posterUrl()` from `VITE_MEDIA_CDN` (`utils/media/mediaUrl.js`); `components/map/PosterImage.jsx` draws one.
  - In development without `VITE_MEDIA_CDN`, `mediaUrl.js` falls back to `/local-media`, which a dev-only plugin in `vite.config.js` serves from `media/`. Mock-mode demo photos are posters too.
  - One size (800) on purpose; a replaced poster gets a new name, as browsers cache them.

### Colour and layout (house rules)

- **The tokens** live in `client/src/styles/index.css`. Every one is `light-dark(light, dark)` and follows the device's colour scheme:
  - `colour1`–`colour5` are fixed neutrals, never changed;
  - `colour6`–`colour9` are the theme, from my_planet's travel-poster look: poster red, ocean blue, parchment, saddle brown;
  - `poster-*` are fixed artwork colours (frame red, gold corners, nav paper, brown edge, ink, cream), the same in both themes;
  - fonts: `font-travel` / `font-titleFont` (TravelFont, SF Comic Script; licence to check before launch) for headings and the nav, Poppins (`font-main`) for text;
  - also `field`, `status-critical|warning|minor|good`, `scrim`, the `lift` shadows, and the `tone-*`/`solid-*` utilities.
- **Map styles.** The map page sets `data-map-style='animated'|'old-map'|'jupiter'|'galaxy'` (`utils/map/mapStyles.js`), which switches the `--map-*` tokens the drawing uses (`map-sea`, `map-land`, `map-visit-*`, `map-ink`, `map-edge` and so on). The containers over the map don't change with the style: they're travel paperwork in every style (`ticket-edge`, `paper-aged`, `bg-paper-cream`; `MapPanel`, `common/CloseStamp`, `common/PaperStripHeader`, `map/LuggageTag` for the floating labels; inputs inside a `paper-fields` scope). The map type (`regular` or `detailed`, `utils/map/mapTypes.js`) and my_planet's filters, banner, sun and moon and sea waves are viewer settings (`utils/map/mapSettings.js`).
- **`scripts/check-house-rules.mjs`** (in `prebuild`):
  - **fails** on any hex, `rgb()`/`hsl()`, or white/black/Tailwind palette class in components;
  - **warns** on flex and vertical margins (41 in older template code).
  - New code uses grid and gap, inline classes and Tailwind sizes, and adds no warnings.
- **Base resets** stay inside `@layer base`: unlayered CSS beats every utility.

## Pre-rendering and SEO

- **Which pages:** home, about, FAQ, contact and `/user-agreements` (legal) are the only indexed pages (`PUBLIC_STATIC_ROUTES`). Everything else is client-only, noindex, disallowed in robots.txt and absent from the sitemap.
- **The build:**
  - `prebuild` runs `check-meta` (titles ≤ 60 characters; unique descriptions of 120–156 characters, in whole sentences) and the house rules;
  - `postbuild` runs `inline-critical` → `prerender` (headless Chromium saves each public page as `dist/<route>.html`, plus `404.html` and `app-shell.html`, and writes `_redirects` and the `.htaccess` client-only rewrites) → `generate-sitemap` → `generate-robots` → `check-seo` (fails on a missing or duplicate head tag, thin `<main>`, broken internal links, structured data not on the page).
- **Live check:** `npm run check:seo -- --live https://<domain>` checks a deployed site.
- **Head tags:** `HelmetItem` (react-head) per page, from `helmetData`/`metaData`. JSON-LD is built in `utils/seo/schema.js` from `constants.js`. Only mark up what's visible.
- **`client/public/.htaccess`** (cPanel) holds the CSP. It still has placeholder hosts (`api.client.com`, `nbg1.your-objectstorage.com`) that must become the real API, R2 endpoint and photo hosts before launch, or uploads and photos are blocked.

## Server architecture

- **`src/server.js`** wires the global middleware in this order:
  1. helmet (CSP off);
  2. `X-Robots-Tag: noindex` on everything;
  3. request context (`X-Request-Id`);
  4. morgan;
  5. CORS from `FRONTEND_ORIGIN` (comma-separated; also better-auth's trusted origins);
  6. JSON parsing (2000 kb);
  7. `globalRateLimiter` (in memory, 1000 per 15 min per IP);
  8. better-auth at `/api/auth/*`.

  Then the routers: `/api/events`, `/api/users` (including `/map-settings`), `/api/contact`, `/api/media-services`, `/api` (`/countries`, `/landmarks`), `/api/maps`, `/api/trips`, `/api/photos`, `/api/shared`, `/api/invites`. `trust proxy` is 1 (Vercel).
- **Per feature:**
  - `routes/` attaches middleware;
  - `controllers/` sanitises input (`utils/sanitize.js`, `utils/travelValidation.js`), calls domain functions, logs events and replies;
  - `domain/` holds thin Prisma queries;
  - `event/<x>Utils.js` builds events (`travelUtils.js` for the travel features);
  - pure rules go in `utils/<x>.js` with a test.
- **Responses:**
  - `sendDataResponse(res, code, payload)` → `{ status, data }`; `sendMessageResponse(res, code, message)` → `{ status, message }`, which is what the client shows;
  - use `DOMAINS`/`EVENT_MESSAGES` (`utils/responses/responses.js`);
  - failures are error event classes (`event/errorUtils.js`);
  - travel controllers wrap handlers in `handler()` from `controllers/helpers/travel.js`.
- **Logging:** `logEvent(...)` writes `AppEvent` without awaiting, for writes only (never reads). `runAfterResponse(promise)` (`utils/background.js`, Vercel `waitUntil`) for anything after the response, emails especially.
- **Rate limits:**
  - in memory (`middleware/rateLimit.js`): global, presign, and a strict 5 per 15 min per public form;
  - database-backed (`middleware/dbRateLimit.js`, the `RateLimit` table, shared across instances): opening a share link 30, browsing one 300, invite accepts 30 (all per 15 min), photo presigns 120 per 15 min, adding people 20 an hour;
  - all values in `utils/constants/rateLimitConstants.js`.
- **Auth** (`src/auth.js`, better-auth with the Prisma adapter):
  - role and `isActive` live on the DB user, and `validateAuthentication` re-reads them;
  - a deactivated user can't create sessions;
  - user `create.after` makes the default map, and accepts pending invites if the address is already verified;
  - user `update.after` accepts invites once the email is verified;
  - `deleteUser.beforeDelete` releases the travel data (see above), then avatars.
  - Cookies are `sameSite: 'none'`, `secure` and `__Secure-` in production; keep `useSecureCookies` tied to `isProd`.
- **Storage** (`services/s3/`):
  - `s3public.js` (`STORAGE_*`): avatars and contact images;
  - `s3private.js` (`STORAGE_PRIVATE_*`, each falling back to its `STORAGE_*` twin): photos;
  - keys are prefixed with `BucketNamespace` (`myplanetview`);
  - both clients set `requestChecksumCalculation`/`responseChecksumValidation: 'WHEN_REQUIRED'`. Without it, AWS SDK 3.729+ signs an empty-body CRC32 into every presigned PUT URL, so browser uploads fail. The buckets are in R2's EU jurisdiction, so the endpoint is `https://<account-id>.eu.r2.cloudflarestorage.com`;
  - `MEDIA_CFG` in `mediaService.js` sets each resource's visibility and types. No SVG anywhere: it can carry scripts.
  - The daily Vercel cron (`/api/media-services/cron/cleanup-orphans`, `CRON_SECRET`) deletes unattached uploads and expired rate-limit rows.
- **Email** (Resend, `services/email/emailHandler.js`): renders the handlebars templates in `users/` and `contact/` and sends them with the `resend` SDK from `EMAIL_FROM`, using `RESEND_API_KEY`.
  - Profiles: `userAdmin` (share invites, `users/shareEmail.handlebars`), `userVerify`, `userReset` and `contact` (reply-to is the person who sent the form).
  - Network, rate-limit and 5xx failures retry twice under one idempotency key; quota and validation errors don't.
  - In production it throws at import without both keys; locally it logs each email and its link instead of sending.
  - Until a domain is verified in Resend, `EMAIL_FROM=onboarding@resend.dev` only delivers to the Resend account's own address.

## Known gaps

- **Untested for real:** the API is tested end to end against Postgres (`npm run test:integration`), but nothing has run against real R2 (the bucket client is mocked there) or in a browser. Uploads, signed URLs and the client flows need trying for real.
- **Placeholders:**
  - the domain;
  - the brand assets (`client/public/brand/`, `client/public/favicon/`), still ByteToast's;
  - the CSP hosts in `.htaccess`.
- **Data:** 16 landmarks are marked `// unverified`; border photos can land in the neighbouring country.
- **Sharing:** editors can't see who else has access.
- **Unused code:** a few client files are kept on purpose although nothing imports them: `Breadcrumbs`, spare UI inputs, `ErrorBoundary` (not mounted, so a failed lazy chunk renders blank) and `deleteMediaObject`.
- **Tests:** no Playwright tests cover the travel pages.
- **Analytics:** turn GA4's "page changes based on browser history events" off.

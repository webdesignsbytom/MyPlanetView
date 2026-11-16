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
- `npm run dev:mock` (`vite --mode mock`; no `.env.mock` exists, so it reads no env file either): the site with no server, for looking at pages and flows (e.g. headless Playwright screenshots). Use a free port (`BROWSER=none npx vite --mode mock --port 5174 --strictPort`) and stop it afterwards. `BROWSER=none` is what stops the config's `open: true` opening a tab in the user's browser; `--open false` doesn't work (Vite reads `false` as a path and opens `/false`). Start it from `C:/Users/…/client` with a capital drive letter: from `c:\…` (how the shell starts) the `import.meta.glob` imports resolve to broken paths and the signed-in pages show the error screen. The same goes for a Playwright `webServer`: give it `cwd: 'C:/…/client'`. The mock-mode e2e suite (`playwright.app.config.js`, `tests/e2e-app/`) reads no env file either.
- `node scripts/generate-country-landmarks.mjs` (reads only the server's landmark data file).
- `npm run test:e2e:app` (`playwright test --config playwright.app.config.js`): the travel pages' Playwright tests (`tests/e2e-app/`, desktop Chrome plus a Pixel 7 for the `@phone` tests) against mock mode. The config starts its own Vite and stops it afterwards: `vite.e2e-app.config.js` (the site's config with its own dependency cache `node_modules/.vite-e2e-app`, every file transformed at start-up, no tab), `--mode mock`, port 5195, `BROWSER=none`, never reusing a running server. `tests/e2e-app/warm-up.js` waits out the cold start, and the tests' pages ignore Vite's hot reload. It reads no env file. One run at a time (port 5195). The tests' browsers use reduced motion (`contextOptions: { reducedMotion: 'reduce' }`): the animated sea otherwise keeps headless Chromium compositing every frame on the CPU, and four traced browsers stalled for seconds per step (6–9 minute runs, random timeouts). Tests run untraced; a failing one is retried once with a trace (`client/test-results/`), and passing on that retry still fails the run (`failOnFlakyTests`). A full run: 56 tests in about 1.5 minutes (16 Nov 2026).

**Server** (`server/`):
- `node --check <file>` on any source file.
- Vitest for pure tests only. Write a config in a scratch folder with `root` set to `server/` and `envDir` set to an empty folder, exclude `tests/integration/**`, then run `node <server>/node_modules/vitest/vitest.mjs run --config <that file>` **from that scratch folder**, so `dotenv/config` (which reads the env file in the working folder) loads nothing. `email.test.js` and `errorHandler.test.js` run this way too; `errorHandler.test.js`, `originCheck.test.js` and `authHooks.test.js` import the app (and `authConfig.test.js` imports `auth.js`, as production), so pass placeholder `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `FRONTEND_ORIGIN=http://localhost:5173` (`originCheck.test.js` expects that origin) and `DATABASE_URL` on the command line. `authHooks.test.js` runs the real better-auth against its in-memory adapter (the Prisma adapter is mocked), so the account hooks are checked without Postgres.
- **Integration tests** (`tests/integration/`, `vitest.integration.config.js`: supertest against the real app and a real Postgres; only the private-bucket S3 client and email sending are mocked in `tests/integration/setup.js`):
  - they refuse to run unless `DATABASE_URL` names a database ending in `_test` (checked in `globalSetup.js` and again in `helpers.js`), and clean up only the users they created;
  - Claude runs them from a folder with no env file (so `dotenv/config` loads nothing), passing local values on the command line: `DATABASE_URL` (a migrated `*_test` database), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL=http://localhost:4000`, `FRONTEND_ORIGIN=http://localhost:5173` and placeholder `STORAGE_*` values, then `node <server>/node_modules/vitest/vitest.mjs run --root <server> --config <server>/vitest.integration.config.js`. The config's `envDir` is an empty folder;
  - migrate the test database with Prisma from a scratch folder (above), with that database's URL;
  - **with no `_test` database** (the user keeps none locally): run them against a throwaway in-memory PGlite. In a scratch folder, install `@electric-sql/pglite` and `@electric-sql/pglite-socket`; a small script runs every `prisma/migrations/*/migration.sql` with `db.exec`, then serves it with `PGLiteSocketServer` on a free port (`maxConnections: 8`). Point `DATABASE_URL` at `postgresql://postgres:postgres@127.0.0.1:<port>/myplanetview_test?sslmode=disable` (PGlite ignores the name; the guard wants `_test`) and set `DB_POOL_MAX=1`. All 203 tests pass this way (16 Nov 2026). Nothing touches the user's Postgres. `helpers.js` has `givePlan(userId, { plan, extraMaps, status })` (a `Subscription` row, no Stripe); `uploadPhoto` sends THUMB, DISPLAY and PRINT (an Economy map) unless given `sizes: ORIGINAL_SIZES`; `billing.test.js` mocks `stripe` but signs its webhooks for real.
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
| `server/` | Express 5 API, Prisma 7 (Postgres), better-auth 1.7.20 (pinned; its CLI is the `auth` package), S3-compatible storage (Cloudflare R2), email through Resend. Hosted on Vercel. |
| `docs/` (repo root) | `SITE-DESIGN.md`, `API.md`. |
| `documents/` | `SEO-PLAYBOOK.md` (read sections 1, 3 and 6.22 before SEO work), `SECURITY-BASELINE.md` (from NextDummy; a checklist, not this code), `site/SiteInfo.md`. |
| `images/` | Standalone image toolchain (`npm run img:gen`): makes `<name>-<width>.{avif,webp,jpg}` sets. |
| `seed-photos/` | 16 real test photos from Wikimedia Commons (credits and licences in its `README.md`), each as `thumb.webp`, `display.webp` and `original.jpg`, listed in `photos.json`. The server seed puts them in the private bucket; mock mode shows them. Development only. |

No CI runs. `.github/ci.example.yml` is an example kept outside `workflows/` on purpose.

## The travel model (`server/prisma/schema.prisma`)

- **`TravelMap`**: one owner. It has a `groupType` (`SOLO`, `COUPLE`, `FAMILY`), a `linkAccess` (`RESTRICTED` or `ANYONE_WITH_LINK`) and a unique `shareCode`.
  - Every user gets a default map ("My map", `isDefault`) from a better-auth hook at sign-up. There's one default per user, enforced by the database: `defaultForOwnerId` (the owner's id on the default map, null elsewhere) is unique, and a CHECK (`travel_map_default_owner`) keeps it in step with `isDefault`. Set or clear both together; `ensureDefaultMap` uses the winner when two requests race (P2002).
  - The default map can't be deleted.
- **`Traveller`**: the people a map is for (no login needed; `userId` when linked), with birth and favourite countries (a country or Antarctica, never a pole). One traveller per account per map (`@@unique([mapId, userId])`). A couple or family can share one login, or each adult has their own and is added as `EDITOR`.
- **Who has access:**
  - **`MapMember`** and **`TripMember`**: people added as `VIEWER` or `EDITOR`. The owner is never a member row.
  - **`ShareInvite`**: an emailed invite for an address with no verified, active account. The token is stored hashed, and a CHECK constraint in the init migration makes it target exactly one of a map or a trip. It turns into a member when that address signs up and is verified.
- **`CountryVisit`** (map × country): `VISITED`, `LIVED` or `WANT_TO_GO`, with a `source`: `MANUAL`, `PHOTO` or `TRIP`. `notes` is the country's one note ("I want to visit here"): text or null, cleaned, cut to `NOTES_MAX`.
- **`TripMap`** (trip × map, `addedById`, `addedAt`): a group trip shown on someone else's map ("Add to my map", docs/API.md "Group trips"). Nothing is copied: it counts in that map's `trips` (stats and `GET /maps`), never its photos. Completing the trip, or adding or changing a stop on a completed trip, marks `TRIP` visits on every linked map in the same transaction. Removing someone's `TripMember` row also removes the links they added; visits are never taken back. Map trip lists mark `linked`, `canOpen` and `organiserMapName`; someone who can't open a linked trip gets only its title, dates, status and countries.
- **`Moment`** (docs/API.md "Moments"): a life event or note on a map. `kind` is text checked against `utils/constants/momentKinds.js`; a title and optional text; `happenedOn` with `datePrecision` `DAY`/`MONTH`/`YEAR` (both null when undated, CHECK `moment_date_and_precision`); a country (required), a landmark in it or a place name; optionally one of the map's own trips; `hidden`. `MomentTraveller` and `MomentPhoto` (with position, at most 20) link the people and photos. Access follows the photo rules (`momentRoleFor`, `canSeeMoment`, `canSeeMomentPhoto`, `momentPhotoScope` in `access.js`); dates and the opaque cursor are in `utils/moments.js`. `GET /maps/:mapId` gives `momentCountsByCountry`.
- **Trips:**
  - **`Trip`**: status `PLANNED`, `ACTIVE` or `COMPLETED`. Completing a trip adds `TRIP` visits for its stops' countries.
  - **`TripStop`**: country, landmark or place name, dates and position.
  - **`TripTraveller`**: who went. Per-person stats come from trips.
- **Photos:**
  - **`Photo`**: `latitude`/`longitude` are visible to editors only; `hidden` hides it from viewers.
  - **`PhotoVariant`**: one per size, `THUMB`, `DISPLAY` or `ORIGINAL`, each a `MediaItem`.
  - **`PhotoLandmark`**: `GPS` suggestions with `confirmed: false`, or `MANUAL` matches.
- **Reference data:**
  - **`Country`** (PK = ISO alpha-2, plus `IC` Canary Islands and `XK` Kosovo) and **`Landmark`** (lat/lng, `matchRadiusM`, map pin, `wikidataId`, unique) are seeded and never edited by users.
  - **Special places** are `Country` rows with `kind: SPECIAL`: Antarctica (`AQ`, a drawn shape, continent `ANTARCTICA`) and four poles, which are points with codes from ISO's user-assigned range: `XN` North Pole, `QN` Magnetic North Pole, `XS` South Pole, `QS` Magnetic South Pole (`continent` null except `XS`). The rules are in `server/src/utils/specialPlaces.js` (the client's copy is `client/src/utils/map/specialPlaces.js`):
    - stats count them apart (`countries` leaves them out, `specialPlaces` counts them; Antarctica and the South Pole give the seventh continent), and so do `GET /maps` counts;
    - a visit to `XS` that counts adds `AQ` (`withParentPlaces`, in `createMissingVisits` and the manual `PUT …/visits`, which answers `{ visit, implied }`);
    - GPS: latitude ≥ 89.9 is `XN`, ≤ −89.9 is `XS` (`poleAt`, before the shapes); a magnetic pole is never found from GPS;
    - the magnetic poles' pins are NOAA's WMM2025 positions for 2025: move them once a year (both country lists).
- **Plans** (16 Nov 2026; docs/API.md "Plans and billing", "Map limits"): `FREE`/`REGULAR`/`PREMIUM` (Economy, Business, First Class), with names, prices and limits in `server/src/utils/constants/plans.js` (the client copies it). **A map's plan is always its owner's**, for every rule.
  - The plan in force is computed, never stored (`utils/plans.js` `effectivePlan`): the best of a `Subscription` whose status counts (`active`, `trialing`, `past_due`) and any running `PlanGrant`, else FREE.
  - `Subscription` (one per account, written only by the Stripe webhook: the plan line, the extra-map quantity, status), `PlanGrant` (complimentary memberships, given by admins), `StripeEvent` (webhook ids, purged by the cron after 90 days).
  - **Map slots** (`utils/mapSlots.js`): every account has its default map plus the paid extra maps. The default and any map in its grace period (`TravelMap.graceUntil`, 60 days after a transfer that found no free slot) are always active, then the oldest other maps up to the paid count, with transferred maps queuing last. Other maps are **locked**: no new photos (403), never deleted. `POST /maps` without a free slot → 402 with the extra-map price; `POST /maps/:mapId/main` picks the included map.
  - **Photo limits per map** (`utils/planLimits.js`): photos per country 30/200/1,000 (hidden ones count, every uploader together), checked at presign (the `countryCode` hint), inside the save's transaction with the map row locked, and on `PATCH` (409); a storage limit on paid maps (50/200 GB, 409). Economy maps keep a `PRINT` copy (a 2,400 px JPEG made in the browser) instead of the `ORIGINAL`; presign and confirm refuse the wrong one. `GET /maps/:mapId` (owner and editors) and every trip route answering `{ trip }` (trip editors) carry `uploadRules`; share links never do.
  - **People:** 10 editors per map (members plus pending `EDITOR` invites), 20 people per trip (members plus pending invites), 409 beyond; accepting an invite never fails on a cap.
- **Stats** (countries, continents, photos, landmarks, per traveller) are computed, never stored (`server/src/utils/mapStats.js`).

The template's `User`/`Session`/`Account`/`Verification` (owned by better-auth), `Profile` (username, home country and `mapSettings` JSON), `MediaItem`, `AvatarMediaItem`, `ContactForm` (name, email, message, optional image), `RateLimit` and `AppEvent` remain. `AuthRateLimit` (`auth_rate_limit`) is better-auth's own limiter table (shape set by better-auth: `key`, `count`, `lastRequest` in epoch ms).

**Indexes** (`20261114210000_audit_indexes`, audit B3):
- every foreign key that a cascade or `SET NULL` follows has one (`Trip.coverPhotoId`/`createdById`, `ShareInvite.mapId`/`tripId`/`invitedById`, `AppEvent.actorId`/`targetId`): without them, deleting a 20k-photo map scanned every trip per photo;
- `Photo` has `[mapId, createdAt desc, id desc]` (the whole map's list, newest upload first), `[tripId, tripPosition, id]` and `[mapId, countryCode, countryPosition, id]` (a trip's and a country's gallery order, from `20261115210000_photo_order`), matching the photo lists' order (keyset on id); they also serve the photo counts;
- `AppEvent` has `[createdAt]` (newest first, retention) and `[level, createdAt]`;
- `MediaItem` has `[ownerId, createdAt]` (the cap on unfinished uploads) and `ContactForm` has `[imageKey]` (the orphan clean-up and the contact image rules), from `20261115190000_upload_indexes`.

A new query that filters or sorts a big table should match one of these, or add its own.

**Migrations.** There are eight: `init`, `audit_indexes`, `auth_rate_limit_default_map` (better-auth's limiter table, and `defaultForOwnerId` with its backfill and CHECK), `upload_indexes`, `photo_order` (the gallery positions, backfilled newest-first, and their indexes) and `special_places_checks` (`Country.kind`, nullable `continent`, `Landmark.wikidataId` backfilled by slug, the traveller rule, and CHECKs for trip and stop date order, a photo's latitude and longitude both or neither and in range, a `MANUAL` landmark match being confirmed, and the known `User.role` values; docs/DATABASE-REVIEW.md) and `plans_billing` (`Plan`, `BillingInterval`, `Subscription`, `PlanGrant`, `StripeEvent`, `TravelMap.graceUntil`, `PhotoSize.PRINT`, `Profile.leavingPlan`/`leavingPlanAt`, and the CHECK `subscription_extra_maps_not_negative`) and `group_trips_moments` (`TripMap`, `Moment`, `MomentTraveller`, `MomentPhoto`, `DatePrecision`, the CHECK `moment_date_and_precision`). After a schema change, regenerate the client from a scratch folder too: a `prisma.config.mjs` there whose `schema` is the absolute path of `server/prisma/schema.prisma`, then `generate` (it writes into `server/node_modules/@prisma/client`; no env file is read). Make new ones without a database: run `migrate diff --from-schema <copy of the old schema> --to-schema prisma/schema.prisma --script` from a scratch folder (see above) into `prisma/migrations/<timestamp>_<name>/migration.sql`. Prisma can't express partial indexes, and drops unknown ones on the next diff: enforce such rules in code. CHECK constraints are safe.

## Access and sharing

The full rules are in `docs/API.md`, under "Access":
- **Map role:** owner, else the `MapMember` role.
- **Trip role:** the higher of the map role and the `TripMember` role.
- **Link visitors:** a share code with link access on gives `VIEWER`, signed in or not, through `/api/shared/:code` only.
- **What viewers never get:** hidden photos, GPS coordinates or originals.
- **No role at all → 404** (so ids and codes can't be probed). A role that isn't enough → 403.
- **Adding or changing content needs a verified email** (`requireVerifiedEmail` in `middleware/auth.js`, put on each write route): countries, trips and stops, photos and landmark matches, new or deleted maps, every sharing change, avatars. Not needed: reads, setting up a map (`PATCH /maps/:mapId` and its travellers, which `/welcome` does straight after sign-up), map settings, the account, the contact form. It runs before any lookup, so it answers the same 403 for every id. A new write route needs it too. Integration tests' `signUp()` makes verified users unless given `{ verified: false }`.

- **The rules** are pure functions in `server/src/utils/access.js` (tested). Controllers load a row together with the caller's membership (`controllers/helpers/travel.js`: `loadMap`, `loadTrip`, `loadPhoto`, `loadUploadTarget`) and decide with them.
- **The Prisma trap these queries avoid:** `where: { userId: undefined }` means *no filter*. So the access loads in `domain/maps.js`, `domain/trips.js` and `domain/photos.js` only read the caller's `MapMember`/`TripMember` when there is a user. Keep that pattern in any new access query, or an anonymous request inherits the first member's role.
  - They read the row and the memberships as flat queries side by side (relation filters such as `map: { trips: { some: { id } } }`), not as nested selects, which Prisma runs one level after another; the result keeps the old shape (`members: []` or `[{ role }]`).
- **Trip-only editors** (a `TripMember` `EDITOR` with no editor role on the map) edit the trip, complete it and add photos to it; the TRIP and PHOTO visits that follow still go on the map. **Deleting a trip needs an editor role on the map, or owning it** (`canDeleteTrip`; the trip detail's `canDelete`).
- **Share codes:** 12 characters from `23456789ABCDEFGHJKMNPQRSTVWXYZ`, shown `XXXX-XXXX-XXXX`, normalised on lookup (`utils/shareCodes.js`). Reset = new code.
- **Invite tokens** are hashed with SHA-256.
- **Owner-only:** the sharing routes (`controllers/sharing.js`, one module for maps and trips). Editors can't list members yet.
- **Adding people** (`addMember`) emails someone from our domain, so:
  - the owner's own address must be verified (403 otherwise, after the role checks), with a per-user daily cap on top of the per-IP one;
  - only an **active, verified** account becomes a member directly; anyone else (no account, unverified, deactivated) gets a `ShareInvite`, so an account squatting an address it never verified gets nothing;
  - the share email's subject is fixed; the sharer's name is only in the escaped body.
- **Transferring a map:** `POST /maps/:mapId/transfer` (owner, verified; the new owner must be on the map, active and verified) and `POST /users/admin/transfer-map` (an admin, by email) share `transferMap` in `services/travel/maps.js`: one transaction, the grace rule above, and the old owner's default map recreated at once.
- **Leaving an account** (`services/travel/accounts.js`, from better-auth's `beforeDelete`):
  - the person chooses first (`GET /users/leaving-options`, `PUT /users/leaving-plan`, kept on `Profile.leavingPlan`): for each owned map, hand it to a member or delete it, and whether to leave their photos on other people's maps. A plan saved in the last 60 minutes is used; otherwise the defaults: each owned map with an editor passes to the longest-standing active editor (a deactivated one only if no other editor exists; `heirOf`), the others are deleted, and photos are left;
  - a handed-over map keeps every photo on it; photos on other people's maps are reassigned to that map's owner, or deleted with `leavePhotos: false`;
  - then the files of what was deleted, in batches (see Storage). Rows always go before files, so a failure leaves unused files for the cron, never a photo pointing at a missing file.
- **Accepting an invite** (`acceptInviteInDB` in `domain/sharing.js`, from `POST /invites/accept` and the sign-up/verify hooks) is one transaction that claims the invite first, so the same invite accepted twice counts once.

## The photo pipeline

1. **In the browser** (`client/src/utils/photos/`):
   - `readPhotoMeta.js` reads the date and GPS with `exifr`'s lite build (lazy-loaded; JPEG, not PNG);
   - `makePhotoCopies.js` draws `THUMB` (400 px) and `DISPLAY` (1600 px) on a canvas, which drops all EXIF. The original is kept untouched;
   - **no HEIC** (`docs/SITE-DESIGN.md`): an iPhone sends a JPEG when a photo is picked in a browser, so every size is JPEG, PNG or WebP, on the client, the server (`PHOTO_CONTENT_TYPES`) and the mock. A `.heic` file gets a message to save it as a JPEG.
2. **Upload** (`uploadPhoto.js` → `POST /api/maps/:mapId/photos/presign`): the browser `PUT`s each file straight to the **private** bucket (`putFile.js`, XHR for progress). Keys are `myplanetview/photos/<mapId>/<photoId>/<size>-<random>.<ext>`.
   - The presign takes each file's `contentType` and exact `bytes` (within `PHOTO_MAX_BYTES`), and the URL signs both (see Storage), so the `PUT` must send that type and a body of exactly that size. `putFile` refuses a blob whose size isn't the declared one.
   - A user may have at most 60 photo files presigned and not saved over the last 24 hours (`UNCONFIRMED_UPLOAD_LIMIT`); a presign above that answers 429.
3. **Confirm** (`POST /api/maps/:mapId/photos`):
   - only within 50 minutes of the presign (`PHOTO_SAVE_WINDOW_MINUTES`, below the cron's one-hour cutoff, so the cron never deletes a photo being saved);
   - the server HEADs each object (real size and type, within `PHOTO_MAX_BYTES`), then creates the `MediaItem`s, the `Photo` and its `PhotoVariant`s in one transaction;
   - with GPS, it sets the country (`utils/countryLookup.js`), adds a `PHOTO` visit and suggests landmarks within `matchRadiusM` (`utils/landmarkMatch.js`);
   - the client always sends the uploader's chosen `countryCode`: it's used without GPS, or when the GPS position is in no country (at sea);
   - a photo left with no country is listed by `GET …/photos?unplaced=1`, the map page's "Unplaced photos" (`components/map/UnplacedPhotosPanel.jsx`, opened from the stats and the country list), where an editor gives it a country.
4. **Viewing:** signed GETs (`signPhotoUrl`), signed at the start of the hour and valid for two (`PHOTO_URL_TTL_SECONDS`), so the browser cache works.
   - **Gallery order:** each photo has a `countryPosition` (its country's gallery on the map; the unplaced photos are one gallery) and a `tripPosition`, smallest first. A new photo, or one moved to another country or trip, goes first there. `POST /api/photos/:photoId/move` (`{ gallery: 'country' | 'trip', afterId }`) gives the photo the halfway point between its new neighbours (`utils/photoOrder.js`), renumbering the gallery only when there's no room. A country's order needs editor on the map, a trip's editor of the trip. In the client, `PhotoGrid`'s "Rearrange photos" (with `onMove`) swaps in `SortablePhotoGrid` (dnd-kit, lazy-loaded; mouse, long press on touch, keyboard, spoken steps); `usePhotoPage().movePhoto` moves the list at once, then saves, and reloads it if the save fails. The mock keeps the same order (`dev/mock/photoOrder.js`).
   - The `photo` entry in `MEDIA_CFG` is private, and the generic `/api/media-services` routes refuse its keys.
   - The daily cron never deletes media a `PhotoVariant` uses.

## The map: projection, shapes and country data

- **Projection.** The SVG world map is a **Robinson projection**, 2000 wide; the extent is the pole lines, y -16.6 to 1020.6 with Antarctica, -16.6 to 857 without (`mapExtent` in `projection.js`), measured against known coastlines (about ±2 units):
  - x = 987.1 + 5.681 × X(lat) × lng;
  - y = 502 − 518.6 × sign(lat) × Y(lat).

  It's implemented twice, in `client/src/utils/map/projection.js` and `server/src/utils/projection.js`, and the two must stay identical.
- **Shapes:**
  - `client/src/utils/map/countryShapes.js` is generated from simplemaps.com's world SVG (MIT; keep the notice in the file header), keyed by ISO code;
  - `server/src/data/countryShapes.json` holds the same shapes as polygons, for point-in-polygon;
  - `client/src/utils/map/countryStyle.js` is generated by `node scripts/generate-country-style.mjs` (in `client/`; re-run it if the shapes change). It gives every country one of the old map's seven pastels (`--map-visit-1`…`7`), chosen so touching countries never match, plus the width of its main shape so a name is only drawn once it fits.
  - Visited and lived-in countries carry a 1950s star-sticker badge at their pin: `components/map/StarBadge.jsx` (SVG `<symbol>`s plus an HTML icon for the key), placed by `VisitBadges.jsx`, with sizes and ids in `utils/map/badges.js`. "Want to go" is a dashed outline.
  - Andorra, Gibraltar, Liechtenstein, Monaco, San Marino, Singapore and the Vatican have no shape: the client draws them as dots (`MicroStateDot`), the lookups use circles. Bioko and six small Greek islands off Turkey (Kastellorizo, Tilos, Lipsi, Arki/Marathi, Agathonisi, Farmakonisi) are circles in the lookups (`UNDRAWN_ISLANDS`).
  - **Natural Earth 1:50m** (public domain) also supplies Kiribati and every path after a `// Natural Earth 1:50m` comment (16 Nov 2026): islands simplemaps leaves out (the eastern Aegean, the Balearics, Shetland, the Azores, Okinawa, the Andamans and ~300 more) and coasts it draws out of place (Copenhagen, Luxembourg, Sharm el-Sheikh…), grown 0.15 units and cut out of the neighbours' shapes. An audit found 271 wrong or empty answers among Natural Earth's land polygons; 11 are left on purpose (contested places keep their old answer: Crimea UA, Kunashir JP, Kinmen CN, Northern Cyprus CY…). About 575 islands still aren't drawn although they look up correctly (Euboea, Funen, Lombok, Zanzibar…). `server/src/data/countryShapes.json` is rebuilt from the client's paths, parsed as the mock parses them.
  - **Colours:** a plain re-run of `generate-country-style.mjs` reshuffles every country's colour. The current file kept the old ones and only coloured AD, GI and KI; Bahrain was moved to 4 by hand (Saudi Arabia's new Al Khobar piece touches it).
- **Special places on the map:** Antarctica is drawn from Natural Earth (public domain; land and ice shelves) in `--map-ice`/`--map-ice-edge` (per map style), the poles as compass roses (`components/map/PoleMarker.jsx`) kept inside the pole lines (`insidePoleLines`), names from `PoleNameLabels.jsx`. A visited special place wears a gold expedition stamp (`StarBadge.jsx`, `PlaceBadgeIcon`) instead of the star. Birth and favourite pickers offer countries plus Antarctica (`HOME_COUNTRY_OPTIONS`), trip stops and photos every place (`COUNTRY_OPTION_GROUPS`). The map setting `showAntarctica` (on by default) hides Antarctica, `XS` and `QS` and ends the extent at 857; only the view changes. `generate-country-style.mjs` colours countries only; special places get a label width but no pastel.
- **Country lists.** `server/prisma/seed/data/countries.js` (seeded into `Country`) and `client/src/utils/map/countries.js` are copies of each other: 227 countries (Andorra, Gibraltar and Kiribati added 16 Nov) plus the five special places (`kind: 'SPECIAL'`, at the end), with code, name, slug, continent and pin. Keep them in step.
- **Landmarks** are in `server/prisma/seed/data/landmarks.js`, 177 of them, every coordinate checked against Wikidata (14–15 Nov 2026), each with a `// Wikidata Q…` comment naming the item it uses. Where one point can't describe the place, the file's header names a stand-in travellers photograph (Tien Shan → Ala-Archa and Pamir → Lake Karakul, both named so; Kokoda Track → Efogi, half-way along); Papaseʻea's item has no coordinate, so its point is OpenStreetMap's. Sundarbans points at Bangladesh's own World Heritage site (WHS 798, `Q42725548`, Sundarbans Reserved Forest), not India's park. Pins are computed from lat/lng by the seed.
- **The passport's landmark expansion** is ready but **not loaded**: `server/prisma/seed/data/landmarksUnesco.js` (16 Nov 2026, from Wikidata, CC0) has the 1,154 UNESCO World Heritage Sites the 177 don't already cover, each checked against the map's own countries, plus `UNESCO_IN_EXISTING` (the 118 existing landmarks that are World Heritage Sites, to mark `isUnesco`). Serial sites use their most visited part ("Loire Valley (Chambord)"). Its test expects 1,272 sites in all; update it after each year's UNESCO session. Loading it comes with the passport (the schema's `isUnesco`, and map pins that cope with ~1,300 landmarks). The build scripts were in a session scratch folder, so a rebuild means re-running its Wikidata queries.

## Seed

`npx prisma db seed` (the user runs it) **wipes every table**, and refuses to run when `IS_PRODUCTION_DATABASE=true`. In order, it seeds:
1. countries;
2. landmarks;
3. users, through better-auth sign-up (`user@gmail.com`, `tom@gmail.com` (ADMIN), `dev@gmail.com`, password `12345678`); the sign-up hook makes their default maps;
4. demo travel data (`seed/travel.js`): the USER's map becomes a couple's map, with the ADMIN as editor, 9 countries, one completed and one planned trip;
5. demo photos (`seed/photos.js`): the 16 in `seed-photos/`, made into real photos on that map as an upload makes them. Their files go to the **private** bucket (`putPrivateObject` in `mediaService.js`, the server's only direct upload) under fixed keys, `myplanetview/photos/seed/<slug>/<file>`, so seeding again overwrites them rather than leaving files no row points at; then a MediaItem per file, and `createPhotoInDB` (gallery positions, the PHOTO visit, GPS landmark suggestions). The ADMIN uploaded some, and the trip's are on the trip. Skipped, with a message, without `STORAGE_PRIVATE_BUCKET`. Tested against the fake bucket in `tests/integration/seedPhotos.test.js`;
6. one contact form.

Production never gets the seed. Its countries and landmarks come from `npm run db:reference` (`scripts/load-reference-data.mjs` → `prisma/seed/reference.js`), which upserts countries by `code` and landmarks by `wikidataId` (each entry's Wikidata item) and never deletes. Renaming a landmark updates its row (but a landmark whose `wikidataId` changes needs its row's id changed first, by hand: the Sundarbans moved from `Q4526` to `Q42725548` on 16 Nov, so on a database loaded before then run `UPDATE "landmark" SET "wikidataId"='Q42725548' WHERE "wikidataId"='Q4526'` before `db:reference`, or it fails on the duplicate slug); a landmark taken out of the data stays in the table until removed by hand.

## Client architecture

- **Routing.**
  - `client/src/App.jsx` is the route table; path constants live in `utils/constants/routes.js`. Never hardcode paths.
  - Home and FAQ are eager. Every other page is a `lazyPage()` in `utils/navigation/lazyPages.js`, with its static path in `PAGES_BY_PATH`, used for the first-render preload and Navbar prefetch.
  - `hooks/FocusMainOnRouteChange.js` (used by `App`) focuses `#main-content` after a route change and scrolls to the top, or, when the address has a `#hash`, to that element once the (lazy) page has drawn it. It's the one place hash links are handled: pages don't scroll to their own hash.
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
- **Analytics** (GA4, `utils/analytics/`) starts only after cookie consent, on idle; `index.html` has no Google preconnects, so nothing contacts Google before that.
  - **Secret addresses:** `ANALYTICS_EXCLUDED_PREFIXES` (`/shared`, `/invite`, `/reset-password`, `/verify-email-address`). GA is never first loaded on one; once loaded, `window['ga-disable-<ID>']` is set while one shows and cleared after (`trackAddress` in `initGA.js`, run on every route change and from a `history` hook installed before gtag.js, so it is set before gtag.js could report the change). Web vitals (`utils/seo/vitals.js`) aren't reported there.
  - **Redaction** (`privacy.js`): every `page_location` and `page_referrer` GA gets is the route pattern (`/shared/:code`, `/maps/:mapId`; `ANALYTICS_REDACTED_ROUTES`) with only `utm_*` parameters and no hash; another site's referrer is cut to its origin. App sends the page views itself (`send_page_view: false`).
  - A new route with a secret or an id in its path goes in those two lists in `routes.js`.
  - Don't replace `window.gtag` with a wrapper that calls `ReactGA.gtag`: that calls `window.gtag` back, and the loop swallowed every event.
  - **Withdrawing consent:** the footer's "Cookie settings" (Legal column, `openCookieSettings()` in `consent.js`) makes App show the banner at once, saying what was chosen, with focus on "No thanks"; Escape or its close stamp shuts it unchanged. A no (now or from an earlier visit) calls `stopGA` (`initGA.js`): `ga-disable-<ID>` stays set whatever the page, GA's consent becomes denied, queued page views are dropped, and the `_ga`, `_ga_*`, `_gid` and `_gat` cookies are deleted on this host and its parent domains. A yes again in the same visit resumes the GA already loaded.
  - **Web vitals** (`utils/seo/vitals.js`, with `web-vitals`) load only once GA runs (`initGA.js`), and report only while `analyticsActive()`.
- **Providers:** `main.jsx` mounts `ErrorBoundary` (`utils/error/`) → `HeadProvider` → `BrowserRouter` → `AuthProvider` → `App`. A render error, or a lazy page whose code didn't download, shows `components/utils/AppErrorScreen.jsx` (a paper card on the poster frame with a reload button); it sits outside the router and auth, so it uses plain links.
  - **Hydration:** a pre-rendered page (`data-prerendered` on `<html>`, a filled `#root`) is hydrated with `hydrateRoot`; the app shell is drawn with `createRoot`. 404.html is drawn from scratch when the address is a real page in another case (`/About`). The first render must be the same in the browser as at build: nothing in a render may read storage, the window size, the date or `Math.random`; such things go in effects (or `useSyncExternalStore` with a server snapshot, as the footer's year does with `__BUILD_YEAR__` from `vite.config.js`). Auth starts signed out and the cookie banner closed for the same reason.
- **Auth:** a cookie session (`withCredentials`); `useAuth()` exposes better-auth's account actions. The session request (`auth/bootSession.js`) goes out from `main.jsx` at boot, alongside the first page's code, when this browser has the `isLoggedIn` flag; `AuthProvider` takes it in its first effect. Logging out clears the state only once the server has answered (or a 401 says the session had already ended); otherwise the nav or account page says they're still logged in. While the user is unverified, the session is read again when the tab is focused or shown (at most every 10 s; a failed background read other than a 401 changes nothing), so verifying in another tab lifts this tab's locks; the verify page reads it straight after verifying. Session reads are numbered, and an older answer never replaces a newer one. The account page's avatar upload is locked for an unverified user ("Verify your email to add a photo."); removing stays allowed. Sign-up goes to `/welcome`, the onboarding that edits the default map. The login, sign-up, forgot and reset pages share `components/auth/AuthPageLayout` (red poster frame, one `<main>`) and `TravelTicket` (a boarding-pass card: parchment header with the page's h1, the form on theme tokens, a decorative `TicketStub`).
- **Mock mode** (development only; the default for `npm run dev`, as the user asked to be always signed in as a test user):
  - `main.jsx` imports `src/dev/mock/installMock.js` when `import.meta.env.DEV` and `devUsesMock()`. That is true when MODE is `mock`, or unless the browser chose the real API: `?api=real` / `?api=mock` are stored as `localStorage['mpv:apiSource']`, and the badge has "Use real API".
  - Production builds compile `DEV` to false, so none of it ships (checked: no mock strings in `dist/`, including `mpv:apiSource`).
  - It puts an Axios adapter (`mockAdapter.js`) on the exported `httpClient` and on the global axios, and patches XHR for the presigned-upload host (`mockXhr.js`), so no request leaves the browser. Like R2, the mock bucket refuses (403) a `PUT` whose `Content-Type` or size isn't the presigned one (`dev/mock/uploads.js`).
  - The handlers in `src/dev/mock/handlers/` follow `docs/API.md` and the access rules. The store (`store.js`, seeded by `seed.js`) lives in localStorage; uploaded files are session blob URLs. A browser keeps its saved store, so a `seed.js` change that an old store would hide (the real test photos, 16 Nov 2026) bumps `STORE_KEY` (now `mpvMockStore.v2`; `map.spec.js` reads it too).
  - `data/landmarks.js` copies the server's landmark data; re-copy it when that changes. **When an endpoint or response shape changes, update its mock handler too.** When a flow, a control's name or `seed.js` changes, update `tests/e2e-app/` too.
  - As on the server:
    - a GPS position at a geographic pole (latitude) is that pole, before the shapes; the South Pole → Antarctica rule is in `markVisited` (`views.js`);
    - a GPS position finds its country by point-in-polygon on the map's own shapes (`countryLookup.js`, loaded on first use; it parses the client's paths exactly as `countryShapes.json` was made, and gave the server's answer for 3,012 test points);
    - share codes are shown and linked as `XXXX-XXXX-XXXX` and normalised on lookup, and anything that can't be a code finds nothing;
    - a hidden trip cover isn't shown below editor;
    - trip visits come only when a trip becomes completed, or a completed trip gains a stop or a stop's country;
    - new passwords follow the client's `PASSWORD_REGEX` (8 to 128 characters); forgot-password wants a valid address; change-email gives the same answer for a taken address; 20 new maps a day, then 429.
  - **Moments and group trips:** `handlers/moments.js` and `moments.js` (the server's moment rules), `db.tripMaps` (links; completing a trip or changing a stop on a completed one marks every linked map). Store key `mpvMockStore.v3`. The seed adds Tom's map with a planned stag do that Alex added to the test user's map, ten moments (two hidden) and a note on Sam's Thailand.
  - **Plans:** `dev/mock/plans.js` mirrors the server's `plans.js`, `mapSlots.js` and `planLimits.js`; `handlers/billing.js` covers billing, leaving, admin grants and transfer. Checkout applies at once and answers `{ url: '/account?billing=success' }`; the portal answers `/account`. The seed's test user pays monthly for Business with one extra map (everyone else is on Economy); the badge's Plan and "Extra maps paid" dropdowns change it. The leaving plan is logged (`[mock] leaving plan saved …`), since deleting the account resets the demo.
  - Sign in as the test user, `test@myplanetview.local`, with `12345678` (`MOCK_PASSWORD` in `seed.js`, the server seed's password); any other address or password gets better-auth's 401. The badge says so.
  - The writes that need a verified email are listed in `mockAdapter.js` (`NEEDS_VERIFIED_EMAIL`, the server's `requireVerifiedEmail` routes) and answer the server's 403 before any lookup. The badge's "Email verified" switch makes the test user unverified and back; the seeded users are verified.
- **API layer:**
  - `api/client.js` is one Axios instance: errors become `error.friendlyMessage`, payloads are at `res.data.data`;
  - **bundles** (`vite.config.js` `manualChunks`): only React, React DOM and the router are grouped (`react-*.js`, cached across deploys); every other package goes with the code that imports it, so exifr, react-ga4 and web-vitals load only when used, and React DOM's server renderer only at build;
  - form rules the server also checks live in `utils/regex/regex.js`: `isValidEmail` (the server's `normalizeEmail`), `serverText` (what `sanitizeText` keeps), and `PASSWORD_REGEX` with `PASSWORD_RULE`, the one wording of the password rule for hints and errors;
  - `api/travelApi.js` wraps every travel endpoint;
  - endpoint paths are constants in `utils/constants/apiRoutes.js`.
- **Country guides** (`/countries`, `/countries/<slug>`; FEATURE-PLAN.md "Country pages"): one JSON file per country in `src/content/countries/` (format at the top of `utils/countries/countryContent.js`), `status: 'draft' | 'checked'` and `lastChecked`. `scripts/country-pages.mjs`'s Vite plugin serves them as `virtual:country-pages`: drafts only on the dev server (with a "Draft, not published" banner, noindex), checked ones only in builds. Prerender, sitemap and `check-seo` use the same list, so with none checked there's no index, no route and no country text in `dist/`; `check-seo` fails on draft text there. Routes come from the content files, not by hand. Practical facts record their Wikidata property and item; landmarks come from `src/content/countries/landmarks.generated.js` (`node scripts/generate-country-landmarks.mjs`, `--check` says when it's stale). Titles and descriptions are generated (`countryMeta.js`); a checked page's meta problem fails `check-meta`, a draft's only warns. The month strip is a list ("January: Best"), never colour alone. Publishing a guide = the user reads it, then `status: 'checked'` with the date.
- **Moments and notes** (client): the country ticket opens with its Notes (`components/map/CountryNotes.jsx`; editors, once the country has a status; cleaned and cut as the server does, `utils/map/visitNotes.js`; saving only a note keeps the visit's source), then its Moments (`components/moments/`, `hooks/useMomentPage.js`; kinds copied from the server's `momentKinds.js` into `utils/moments/momentKinds.js`, dates and cursors in `utils/moments/momentDates.js`, shared with the mock). A new moment in a country with no status offers to mark it (Lived for a birth or a move); a birth offers to add the baby as a traveller. `MomentMarks.jsx` puts a pinned note beside places with moments (`showMoments`), drawn by zoom like the badges. The timeline (`TimelinePanel.jsx`, a toolbar stamp) merges paged moments with the map's trips in date order.
- **Group trips** (client): a trip's page has "On your maps" (`TripMyMaps.jsx`, "Add to my map"). The map's trips list marks linked trips ("From <map>"); one the viewer isn't on isn't a link, and the map's owner can take it off there (`useTravelMap().unlinkTrip`). A photo's or a moment's trip is always one of the map's own (`ownTrips`). The switcher's section is "Group trips".
- **Plans (client):** `utils/constants/plans.js` copies the server's (change both together); `api/plansApi.js` wraps billing, leaving and the admin plan routes; `utils/plans/billing.js` holds the price wording, `hasSubscription` and the new map waiting on its extra map (sessionStorage `mpv:pendingNewMap`, an hour); `utils/plans/leaving.js` builds the leaving plan.
  - `/pricing`: `pages/pricing/`, `components/pricing/`, the words in `utils/data/pricingData.js` with every number from the constants; `soon: true` marks a claim about a feature not built yet.
  - The account's "Your plan" card (`AccountPlanSection`): the plan and where it comes from, renewal, upgrades (Checkout with no subscription, change-plan with one), monthly or yearly, maps against slots with "Add an extra map", "Manage billing" (the Stripe portal). Back from Checkout (`?billing=success|cancelled`) it says how it went, reads billing again after 3 s and 8 s, and makes the waiting new map.
  - The map page reads `uploadRules`, `locked`, `graceUntil` and `photoCounts`: `MapPlanBanner` on a locked map ("Pay for this map", `components/plans/ExtraMapDialog`, lazy) or during a transfer's grace; the uploader shows "12 of 30 photos of France on this map", stops at the cap with an upgrade link, and on Economy sends a PRINT copy (`makePhotoCopies`, 2,400 px JPEG) instead of the ORIGINAL; a photo with no GPS sends its chosen country as the presign hint. The switcher turns a 402 into `ExtraMapDialog`. Settings, "This map": "Make this my main map".
  - The share dialog's "Make owner" (`MakeOwnerDialog`, "Stay on the map as an editor" ticked) transfers, then forgets the map lists; `MapPage` re-checks the default map on every visit to `/map`. `useModalA11y` keeps a stack: only the newest dialog answers Escape and Tab.
  - Deleting the account (`LeavingChoices`): each owned map to a member (default: the longest-standing editor) or deleted, and "Leave my photos on maps shared with me" ticked; then `PUT …/leaving-plan`, then the delete. Admin users page: "Membership" (`UserPlanDialog`) and "Transfer a map".
- **Travel state:**
  - `hooks/useTravelMap.js`: map, visits, stats and trips, plus mutations; visit changes are optimistic with rollback; `refresh()` reloads the map and trips without the loading state (after photos change: an upload or a photo's country can add a `PHOTO` visit);
  - `useMapSettings.js`: saved to the profile when signed in, localStorage otherwise. The local copy draws the first paint; the profile's copy is stored locally when it arrives, so the next visit starts with it;
  - `useMapViewport.js`: pan and zoom through the viewBox, mouse/touch/pinch, double-tap or double-click to zoom ×2 on the spot, and the grabbing-hand cursor while a mouse button is held (`data-grabbing` on the SVG). Map click handlers go through its `afterTap(action)`, which ignores the click ending a drag or a double-tap and waits 300 ms so a double-tap doesn't also open a country; It takes `extent`, and the view always has the screen's shape and never goes past the map's sides or pole lines, so the map always fills the screen and no sea shows beyond it (`widestFor`). It opens with the North Pole at the top: on a wide screen across the whole width at the old scale, Antarctica a pan away; on a less wide one (a laptop) pole to pole, the sides a pan away; a portrait screen as before.
    - the view is not React state: it lives in a ref and goes straight onto the SVG's `viewBox` (through `viewport.svgRef`), so panning re-renders nothing. Keep it that way;
    - what's drawn by zoom (badges, names, dots, pins, grid labels) reads it with `useViewportZoom(viewport)`, which re-renders only that component, when the zoom changes, once for a burst of pointer or wheel events (in the task after them, with the viewBox, outside the browser's frame work); with a `select` (`(zoom) => zoom >= 3`) only when the answer changes. The returned viewport object never changes;
  - `usePhotoPage.js`: `preloadPhotoPage(filters)` starts a list's first page before the list mounts; the list with the same filters takes it;
  - `useLandmarks.js`: every landmark in one request per session, filtered per country (reference data, never invalidated);
  - `utils/map/mapListCache.js`: the map list and the trips shared with you, per user, for the session. The switcher shows them at once and asks again behind them; creating, renaming, deleting or leaving a map calls `forgetMapLists()`.

  **Loading the map page:** once the map's id is known, everything starts together: the map and its trips, its photo lists (`utils/map/mapPhotoLists.js`), and the landmarks when pins show at once (the Detailed type, or a portrait screen, which opens zoomed in). On `/map` the id is the one remembered from last time (`localStorage['mpv:defaultMap']`, per user) while the map list confirms it. The trip page starts its photos with the trip. The hover photos are never fetched on screens that can't hover (`hooks/useCanHover.js`).

  **Map panels** (stats, the country list, a country, settings, the switcher, unplaced photos, trips, uploads, the photo viewer, the share dialog, the hover postcard) are lazy (`components/map/lazyMapPanels.js`). Once the map has drawn, the toolbar's panels are fetched while the browser is idle, one at a time, the country list and a country first (`preloadWhenIdle`, from `MapExperience`), so they open without the fallback; intent fetches one sooner: a toolbar stamp, the title or the stats tag hovered, focused or pressed (`preloadTool`); the country panel on the first press on the map; the photo viewer when a panel listing photos opens. A slow one shows `MapPanelFallback`. The hover postcard (`MapHoverLayer`) follows a value store, so hovering re-renders only it. A country's panel is `CountryTicket`, a boarding pass like the sign-in pages' `TravelTicket`, centred on wide screens (a sheet above the toolbar on phones): `CountryTicketStub` on the left (the country's poster, always, a placeholder card without one, and a stamp with its status and first visit), the name on a parchment header, then status, photos and landmarks. `hooks/useMapPanel.js` gives it and `MapPanel` the same focus, Escape and focus-return behaviour. The country list is a ticket like a country's (`CountryTicket` with no stub), centred on wide screens like it, with A–Z index letters that stay at the top while scrolling; its rows are memoised, and each status is a rubber-stamp button (`utils/map/visitStamp.js`) that swaps in the real dropdown for that row only (`CountryStatusControl`).

  **An unverified email address** (`hooks/useMustVerifyEmail.js`): the server refuses every change to content (Access and sharing, above). The map and trip pages show `components/map/VerifyEmailBanner.jsx` (a luggage tag that can send the link again; on wide screens the map's panels open below it, through `--map-panel-top`), and the controls that would fail are locked where they're used, each with a `VerifyFirstNote` saying why: statuses in the country panel and list, uploads, new trips and maps, trip and stop editing, photo editing and landmark actions, and every sharing change (the link can still be copied). Visit changes wait for the server instead of showing at once (`useTravelMap(mapId, { optimistic })`). Setting a map up, map settings and `/welcome` stay open.

  Panel state lives in the page (`useReducer`). Use functional state updates.
- **Components:** one per file, under `components/map|photos|trips|sharing|onboarding/` and the template's folders. Pages follow the PageHeader + MainContainer pattern. Every page renders exactly one `<main id="main-content" tabIndex={-1}>`. Modals use `hooks/useModalA11y.js`. Form inputs go in `components/ui/FormField`. Dropdowns are the `components/ui/*OptionSelect` components, never a bare `<select>`. Signed-in pages that aren't the map or a trip (`/welcome`, `/invite/:token`, `/account`, the admin pages) use `components/common/AppPageShell` (poster frame, column nav, one `<main>` taking `mainProps`, footer) with a `TravelTicket`, or a `PageTitleCard` and `PaperCard`s; `PaperCard`'s `action` puts a button on its title strip.
- **Identity** comes from `utils/constants/constants.js` (name, URL, operator, address, theme colour), never a literal in a component. The domain `myplanetview.com` is the intended one, not registered yet. `server/src/utils/constants/siteConstants.js` must use the same host (`server/tests/siteUrl.test.js`).
- **Images:**
  - `ResponsiveImage` and `AppImage` use the `<name>-<width>.<ext>` sets under `src/assets/images/<folder>/` (`lib/media/imageManifest.js`, avif/webp/jpg only);
  - the home artwork (`pages/home/`), the map-style backgrounds and the detailed preview (`map-styles/`) and the logo (`brand/`) come from my_planet, converted with `images/`; the Regular preview (`map-styles/regular-949`) is a screenshot of the mock map (Regular type, default style, whole world), made with `images/`'s `gen-images.mjs` at width 949;
  - the navbar logo and the home artwork import their files directly, keeping the image manifest out of eager pages;
  - one set per real width: an image narrower than the requested widths gets a single set at its own width (the 404 cat is `-366`), never copies under bigger names. AVIF is encoded 4:2:0 (`images/`); 4:4:4 made textured artwork bigger than its WebP. An AVIF should be smaller than its WebP, or the browser downloads the bigger file.
- **Country posters** are not in the build. They're in the public bucket as `visitCountryPosters/<name>-800.avif` plus an 800 px WebP fallback, and the repo's `media/` folder (outside `client/`) holds the same files to upload.
  - `utils/map/posterData.js` lists them (167 countries, a placeholder card for the rest) and builds their URLs with `posterUrl()` from `VITE_MEDIA_CDN` (`utils/media/mediaUrl.js`); `components/map/PosterImage.jsx` draws one.
  - In development without `VITE_MEDIA_CDN`, `mediaUrl.js` falls back to `/local-media`, which a dev-only plugin in `vite.config.js` serves from `media/`. The same plugin serves `seed-photos/` at `/seed-photos` (images only, nothing outside the folder): mock mode's test user's photos are those real test photos (`image.kind: 'seed'`, listed in `dev/mock/data/seedPhotos.js`, a copy of `seed-photos/photos.json`), and the other mock maps' photos are posters.
  - One size (800) on purpose; a replaced poster gets a new name, as browsers cache them.

### Colour and layout (house rules)

- **The tokens** live in `client/src/styles/index.css`. Every one is `light-dark(light, dark)` and follows the device's colour scheme:
  - `colour1`–`colour5` are fixed neutrals, never changed;
  - `colour6`–`colour9` are the theme, from my_planet's travel-poster look: poster red, ocean blue, parchment, saddle brown;
  - `poster-*` are fixed artwork colours (frame red, gold corners, nav paper, brown edge, ink, cream), the same in both themes;
  - fonts (`styles/fonts.css`): `font-travel` / `font-titleFont` (TravelFont, SF Comic Script; licence to check before launch, so the 46 KB TTF stays unconverted) for headings and the nav, Poppins (`font-main`) for text. Poppins ships only the weights in use, 400, 500, 600 and 700 (no italics, no 800: add a face back before using one, or the browser fakes it), each subset to Latin (Latin-1, Latin Extended-A, Ș/Ț, General Punctuation, € ™ −) at about 10 KB, with a matching `unicode-range`. `index.html` preloads Poppins 400 and the TravelFont TTF, which every first view draws;
  - also `field`, `status-critical|warning|minor|good`, `scrim`, the `lift` shadows, the `tone-*`/`solid-*` utilities, and `paper-danger` (deep-red edges and rules instead of brown, for what can't be undone: the account deletion card).
- **Map styles.** The map page sets `data-map-style='animated'|'old-map'|'jupiter'|'galaxy'` (`utils/map/mapStyles.js`), which switches the `--map-*` tokens the drawing uses (`map-sea`, `map-land`, `map-visit-*`, `map-ink`, `map-edge` and so on). The containers over the map don't change with the style: they're travel paperwork in every style (`ticket-edge`, `paper-aged`, `bg-paper-cream`; `MapPanel`, `common/CloseStamp`, `common/PaperStripHeader`, `map/LuggageTag` for the floating labels; inputs inside a `paper-fields` scope). The map type (`regular` or `detailed`, `utils/map/mapTypes.js`) and my_planet's filters, banner, sun and moon and sea waves are viewer settings (`utils/map/mapSettings.js`). The map colours are in `@theme inline`, so the `[data-map-style]` overrides of `--map-*` reach the utilities.
  - **The animated sea is on by default, so keep it cheap.** `animate-ocean` (an `@utility` in `index.css`) fades two full-size layers of the darker sea shades in and out by opacity, which the compositor runs; never animate `background-color` on a full-screen element. `SeaWaves.jsx` draws its canvas at most 1.5× the screen density, about 30 times a second, and pauses while a finger, mouse button or the wheel is moving the map.
- **`scripts/check-house-rules.mjs`** (in `prebuild`):
  - **fails** on any hex, `rgb()`/`hsl()`, or white/black/Tailwind palette class in components;
  - **warns** on flex and vertical margins (21 left in older template code, 15 Nov 2026).
  - New code uses grid and gap, inline classes and Tailwind sizes, and adds no warnings.
- **Base resets** stay inside `@layer base`: unlayered CSS beats every utility.

## Pre-rendering and SEO

- **Which pages:** home, about, FAQ, pricing, contact, `/user-agreements` (legal), plus the **checked** country guides and `/countries` (none yet) are the only indexed pages (`PUBLIC_STATIC_ROUTES`). Everything else is client-only, noindex, disallowed in robots.txt and absent from the sitemap.
- **The build:**
  - `prebuild` runs `check-meta` (titles ≤ 60 characters; unique descriptions of 120–156 characters, in whole sentences) and the house rules;
  - `postbuild` runs `prerender` (headless Chromium saves each public page as `dist/<route>.html`, plus `404.html` and `app-shell.html`, and writes `_redirects` and the `.htaccess` client-only rewrites) → `inline-critical` → `generate-sitemap` → `generate-robots` → `check-seo` (fails on a missing or duplicate head tag, thin `<main>`, broken internal links, structured data not on the page).
  - **What prerender saves:** the head of the settled page (react-head's tags, the page's preloads), and in `#root` the app's *first* render as React's server renderer writes it (`window.__renderRootHtml` in `main.jsx`, `renderToString` from a chunk only the build loads), which is what hydration needs. It warns when the settled page has much more text than the first render (content shown only after an effect isn't pre-rendered), and drops the modulepreload the renderer's import adds.
  - **`inline-critical`** runs beasties on each pre-rendered page (not the app shell): the rules the page uses, plus every `@font-face`, go in a `<style>`; the stylesheet moves to the end of `<body>`, so the page paints before it arrives, with no script. Measured on a phone: LCP on about, FAQ and legal about 0.95 → 0.5 s.
- **Live check:** `npm run check:seo -- --live https://<domain>` checks a deployed site.
- **Head tags:** `HelmetItem` (react-head) per page, from `helmetData`/`metaData`. JSON-LD is built in `utils/seo/schema.js` from `constants.js`. Only mark up what's visible.
- **`client/public/.htaccess`** (cPanel) holds the CSP. It still has placeholder hosts (`api.client.com`, `nbg1.your-objectstorage.com`) that must become the real API, R2 endpoint and photo hosts before launch, or uploads and photos are blocked.
  - **CSP:** `script-src` has no `'unsafe-inline'`: no page has an inline script (JSON-LD is data) or an inline event handler, so keep it that way. `style-src` keeps it (React style attributes, the critical CSS). `form-action 'self'`; no Google Fonts hosts.
  - **Other headers:** HSTS for a year with `includeSubDomains` (no `preload`), `X-XSS-Protection: 0`, `Cross-Origin-Opener-Policy: same-origin`, plus nosniff, `DENY` framing, the referrer and permissions policies.
  - **`client/netlify.toml`** (the temporary Netlify site) sends the same headers: change both together.
  - **Compression** goes by MIME type, so its `AddOutputFilterByType` lines must name what section 7 serves: `.js` goes out as `text/javascript`, the TravelFont as `font/ttf`. After a deploy, check `Content-Encoding` on a `.js` file.
  - **Caching:** a year and `immutable` only for `/assets/` (Vite's hashed files); other static files from `public/` (`favicon/`, `brand/`, `pages/`) get a day, as they keep their names when they change; HTML revalidates.

## Server architecture

- **`src/server.js`** wires the global middleware in this order:
  1. helmet (CSP off);
  2. `X-Robots-Tag: noindex` on everything;
  3. request context (`X-Request-Id`);
  4. morgan (`utils/requestLog.js`: its `url` token is redacted, see Logging);
  5. CORS from `FRONTEND_ORIGIN` (comma-separated; also better-auth's trusted origins);
  6. `originCheck` (`middleware/originCheck.js`, CSRF): a `POST`/`PUT`/`PATCH`/`DELETE` whose `Origin` isn't in `FRONTEND_ORIGIN`, or with no `Origin` and `Sec-Fetch-Site: cross-site`, gets 403. CORS alone only drops the headers; the request would still run. No `Origin` and no `Sec-Fetch-Site` passes (curl, supertest);
  7. JSON parsing (2000 kb). **No `express.urlencoded`**: a cross-site HTML form can only send urlencoded, multipart or text/plain;
  8. `globalRateLimiter` (in memory, 1000 per 15 min per IP or IPv6 /64; only a backstop);
  9. better-auth at `/api/auth/*`.

  Then the routers: `/api/events`, `/api/users` (including `/map-settings`), `/api/contact`, `/api/media-services`, `/api` (`/countries`, `/landmarks`), `/api/maps`, `/api/trips`, `/api/photos`, `/api/shared`, `/api/invites`, `/api/moments`, `/api/billing`. `trust proxy` is 1 (Vercel).
- **Per feature:**
  - `routes/` attaches middleware;
  - `controllers/` sanitises input (`utils/sanitize.js`, `utils/travelValidation.js`), calls domain functions, logs events and replies;
  - `domain/` holds thin Prisma queries. **Never a `_count` in a select:** Prisma joins a `GROUP BY` over the whole child table, so every list counted every user's rows. List counts (`counts` on `GET /maps`, `stopCount`/`photoCount` on trip lists) come from `domain/counts.js`: a `groupBy` over the ids already loaded (`WHERE "mapId" IN (…) GROUP BY`), run in parallel and merged in. Hidden photos count only where the caller is the owner or an editor: `findOwnedMaps` always, `findMemberMaps`/`findTripsSharedWithUser` per membership role, `findTripsForMap(mapId, { includeHidden })` from the caller (default false);
  - `event/<x>Utils.js` builds events (`travelUtils.js` for the travel features);
  - pure rules go in `utils/<x>.js` with a test.
- **Responses:**
  - `sendDataResponse(res, code, payload)` → `{ status, data }`; `sendMessageResponse(res, code, message)` → `{ status, message }`, which is what the client shows;
  - use `DOMAINS`/`EVENT_MESSAGES` (`utils/responses/responses.js`);
  - failures are error event classes (`event/errorUtils.js`);
  - travel controllers wrap handlers in `handler()` from `controllers/helpers/travel.js`.
- **Logging:** `logEvent(...)` writes `AppEvent` without awaiting, for writes only (never reads), through `runAfterResponse(promise)` (`utils/background.js`, Vercel `waitUntil`, failures logged and swallowed). Use `runAfterResponse` for anything else after the response, emails especially.
  - **No secrets or addresses in logs:** `AppEvent.path` and the morgan line go through `utils/redactUrl.js` (share codes → `:code`, invite and better-auth tokens → `:token`, query values other than plain filters → `:redacted`). Events never hold an email address: people are `actorId`/`targetId`, and an address with no account is `emailRef(email)` (`utils/emailRef.js`, a short HMAC). Keep it that way in new events.
  - Only 5xx events keep a stack (`createGenericErrorEvent`, and `createAppEvent` drops it for any 4xx).
  - `get-all-events` returns the newest 500 (`ALL_EVENTS_LIMIT`); the admin page uses the paged route.
  - `deleteOldEvents({ olderThanDays })` in `domain/events.js` is the 90-day retention, called by the daily cron.
- **Database connections** (`src/prisma.js`): one `pg` Pool per function instance behind the Prisma adapter, `max` from `DB_POOL_MAX` (default 5), `connectionTimeoutMillis` and `idleTimeoutMillis` of 5000, and `attachDatabasePool(pool)` from `@vercel/functions`, which keeps a Vercel instance alive until idle connections close (it does nothing elsewhere).
  - In production `DATABASE_URL` must be the provider's **pooled**, transaction-mode URL. The adapter sends unnamed statements, which such poolers accept.
  - `DIRECT_DATABASE_URL` is the direct URL; only the Prisma CLI uses it (`prisma.config.ts`).
- **Rate limits** (all values in `utils/constants/rateLimitConstants.js`; every limiter is off under test unless `RATE_LIMITS_IN_TESTS=true`, which only `tests/integration/rateLimits.test.js` sets):
  - in memory (`middleware/rateLimit.js`): only the global backstop;
  - database-backed (`middleware/dbRateLimit.js`, the `RateLimit` table, shared across instances): share-code lookups 30 (opening a link, plus any `/shared/:code/photos…` request whose code matches nothing, `middleware/shareLookup.js`), browsing a link 300, invite accepts 30, contact form 5, generic uploads 20 (presign and confirm together), photo presigns 120 (all per 15 min), adding people 20 an hour per IP and 25 a day per user, new maps 20 a day per user (`keyFor: keyByUserId`);
  - the count is one atomic `INSERT … ON CONFLICT DO UPDATE` (a passed window restarts at 1 in the same statement); IPs are keyed by `clientIpKey` (IPv4, or an IPv6 /64, via express-rate-limit's `ipKeyGenerator`);
  - better-auth's own limiter is on the database too (`rateLimit.storage: 'database'`, model `AuthRateLimit`), keyed on `x-forwarded-for` (Vercel overwrites it with the visitor's address; a header with several values isn't trusted) and the path, IPv6 per /64.
- **Auth** (`src/auth.js`, better-auth 1.7.20 with the Prisma adapter):
  - role and `isActive` live on the DB user and are declared as `user.additionalFields` (`input: false`: a sign-up gets the defaults, `update-user` refuses them). The cookie cache is off, so `getSession` reads the session and its user from the database on every request, and `validateAuthentication`/`attachUserIfPresent` use that user without a second query: a role change or a deactivation applies to the next request;
  - a deactivated user can't create sessions;
  - user `create.after` makes the default map, and accepts pending invites if the address is already verified (since better-auth 1.5, after hooks run once the user's transaction has committed);
  - user `update.after` accepts invites once the email is verified;
  - `deleteUser.beforeDelete` releases the travel data (see above), then avatars.
  - `hooks.before`: `/delete-user` needs `password` (better-auth then checks it; without one it accepts any session younger than `freshAge`, a day. 1.4.13 multiplied `freshAge` by 1000 twice; fixed in 1.6, but the hook stays); `/sign-up/email` and `/update-user` clean `name` (`utils/displayName.js`: one line, no control characters, 80 at most), since names go into share emails; and a new password (`/sign-up/email`, `/reset-password`, `/change-password`) must follow the client's rules (`utils/passwordRules.js`, the same pattern as `client/src/utils/regex/regex.js`; keep the two in step), 400 otherwise. The password check only applies over HTTP, so the seed's `auth.api` sign-ups keep `12345678`.
  - `changeEmail.sendChangeEmailConfirmation` (still the 1.7 name; the old alias `sendChangeEmailVerification` was removed in 1.5): a verified account confirms from its current address first (`users/userChangeEmailConfirmation.handlebars`, client link with `?change=confirm`), then better-auth's `/verify-email` sends the usual verification to the new address. An unverified account goes straight to the new address. An address that already has an account gets the same 200 and no email.
  - Cookies are `sameSite: 'none'`, `secure` and `__Secure-` in production (`defaultCookieAttributes`, so every cookie better-auth sets); keep `useSecureCookies` tied to `isProd` (`tests/authConfig.test.js` checks the production settings). **Switch to `sameSite: 'lax'` once the API is on `api.<domain>`** (same site as the client); `originCheck` guards writes meanwhile.
- **Storage** (`services/s3/`):
  - `s3public.js` (`STORAGE_*`): avatars and contact images;
  - `s3private.js` (`STORAGE_PRIVATE_*`, each falling back to its `STORAGE_*` twin): photos;
  - keys are prefixed with `BucketNamespace` (`myplanetview`);
  - `mediaService.js` loads the AWS SDK and both bucket modules on its first bucket call (`storage()`), and `emailHandler.js` loads `resend` and `handlebars` on the first email: a cold start that touches neither skips them (about 90 ms locally). Keep other code from importing `s3public.js`, `s3private.js` or the SDK directly;
  - both clients set `requestChecksumCalculation`/`responseChecksumValidation: 'WHEN_REQUIRED'`. Without it, AWS SDK 3.729+ signs an empty-body CRC32 into every presigned PUT URL, so browser uploads fail. DeleteObjects still sends `x-amz-checksum-crc32` (the operation requires a checksum; `tests/mediaBatches.test.js`), which R2 has accepted since February 2025; that needs one real test. The buckets are in R2's EU jurisdiction, so the endpoint is `https://<account-id>.eu.r2.cloudflarestorage.com`;
  - **Deleting files** (`deleteStoredObjects`): one `DeleteObjectsCommand` per 1,000 keys of a bucket, then the MediaItem rows of the files that went (never a row a photo or an avatar still uses); if a whole request fails, single deletes, eight at a time. A file that can't be deleted keeps its row for the cron. Delete the rows that point at files (PhotoVariant, via the photo or map) first, then the files;
  - **Every presigned PUT signs `Content-Type` and `Content-Length`** (`services/s3/signedUpload.js`; `X-Amz-SignedHeaders=content-length;content-type;host`, checked offline in `tests/signedUpload.test.js`). The presigner leaves `content-type` unsigned unless it's in `signableHeaders`; `content-length` is signed once `ContentLength` is set; `CacheControl` on a presigned PUT does nothing (never signed or hoisted). That R2 enforces the signed length still needs one real test (a PUT of another size should get 403).
  - `MEDIA_CFG` in `mediaService.js` sets each resource's visibility, exact `allowedTypes` and `maxBytes`. The generic uploads (avatars, contact images) take PNG, JPEG, WebP or GIF up to 5 MB; the key's extension comes from a MIME map (`utils/media/uploadRules.js`), never from the file name. No SVG anywhere: it can carry scripts.
  - Generic uploads: presign needs `bytes`; `/confirm-upload` HEADs the object and deletes it on a type or size mismatch (the row stays unconfirmed for the cron). Only confirmed uploads can be used: an avatar must be the user's own, of an allowed type; a contact form's `imageKey` must also be under an hour old and on no other form. Contact uploads need no account (the public contact form). A signed-in user may have at most 20 unconfirmed generic uploads over the last 24 hours (429 above).
  - **The daily Vercel cron** (`/api/media-services/cron/cleanup-orphans`, `CRON_SECRET`; `cleanupOrphanUploadsHandler` in `controllers/mediaGeneric.js`):
    1. purges, together and each on its own (a failure is logged and reported as `null`): finished rate-limit windows, `AppEvent` rows older than 90 days, expired sessions and verifications, and invites accepted or expired over 30 days ago;
    2. then deletes unused uploads (`deleteOrphanUploads`): `findOrphanUploads` (`domain/mediaGeneric.js`, one raw query) leaves out files a PhotoVariant or an avatar uses and contact images a form names, and takes photo files after an hour and the rest after a day, oldest first, 500 a batch. Each batch is one DeleteObjects per bucket and one row delete; it moves past files it couldn't delete, and starts no batch after 40 s (`CRON_BUDGET_MS`; `vercel.json` gives the function 60 s).
- **Billing** (Stripe; `routes/billing.js`, `controllers/billing.js`, `services/billing/`): `GET /api/billing`; checkout, change-plan, extra-maps and portal need a verified email and are rate limited per user, and answer 503 without `STRIPE_SECRET_KEY`. The Stripe SDK loads lazily (`services/billing/stripe.js`), price ids come from the `STRIPE_PRICE_*` keys. The webhook `POST /api/billing/webhook` is mounted in `server.js` with `express.raw` **before** `express.json`: it checks the signature, records the event id first (a repeat answers 200 and does nothing; a failure removes the record and answers 500, so Stripe retries), and handles `checkout.session.completed` and `customer.subscription.*`, making no Stripe calls. Admin grants: `/api/users/admin/plan-grants/:userId` and `/api/users/admin/end-plan-grant/:grantId`.
- **Email** (Resend, `services/email/emailHandler.js`): renders the handlebars templates in `users/` and `contact/` and sends them with the `resend` SDK from `EMAIL_FROM`, using `RESEND_API_KEY`.
  - Profiles: `userAdmin` (share invites, `users/shareEmail.handlebars`), `userVerify`, `userReset`, `userChangeEmail` (`users/userChangeEmailConfirmation.handlebars`, to the current address) and `contact` (reply-to is the person who sent the form).
  - Network, rate-limit and 5xx failures retry twice under one idempotency key; quota and validation errors don't.
  - In production it throws at import without both keys; locally it logs each email and its link instead of sending.
  - Until a domain is verified in Resend, `EMAIL_FROM=onboarding@resend.dev` only delivers to the Resend account's own address.

## Known gaps

- **Untested for real:** the API is tested end to end against Postgres (`npm run test:integration`), but nothing has run against real R2 (the bucket client is mocked there) or in a browser. Uploads, signed URLs and the client flows need trying for real.
- **Placeholders:**
  - the domain;
  - the brand assets (`client/public/brand/`, `client/public/favicon/`), still ByteToast's;
  - the CSP hosts in `.htaccess`.
- **Data:** border photos can land in the neighbouring country.
- **Sharing:** editors can't see who else has access.
- **Account enumeration:** sign-up still answers 422 for an address that has an account. better-auth only hides it with `requireEmailVerification: true` (no session until the address is verified), which would change the sign-up → `/welcome` flow; not decided (`docs/AUDIT.md`, E).
- **Unused code:** a few client files are kept on purpose although nothing imports them: spare UI inputs and `deleteMediaObject`.
- **Tests:** the travel pages' Playwright tests (`tests/e2e-app/`) run with reduced motion (the animated sea and waves aren't exercised) and in mock mode only, not against the real API, R2 or a production build. They find controls by role and name and count the seeded demo data, so a renamed control or a changed `seed.js` means updating them.
- **Plans:** the Pricing page's claims marked `soon` (ads, the Travel Desk, videos, extra styles and covers, passport, slideshows, challenges, country guides, "download all my data") must be built or removed before it's published, and `client/src/utils/data/termsData.js` still says the site is free: it needs payment, renewal, cancelling and refund terms before payments go live.
- **Analytics:** turn GA4's "page changes based on browser history events" off. The app sends its own redacted page views; GA's history ones would double them and could carry a secret address as the referrer.

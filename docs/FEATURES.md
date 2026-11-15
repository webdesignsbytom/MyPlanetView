# Feature map

What each My Planet View feature is made of: the client files, the server files, the tables and the env keys. Client paths are under `client/src/`, server paths under `server/`. The travel endpoints are specified in `docs/API.md`.

## Public pages (home, about, FAQ, contact, legal)

- **Client:**
  - `pages/home|about|faq|contact|policies/` and `components/home|about|faq|contact/`;
  - the copy in `utils/data/homeData.js`, `aboutData.js`, `faqData.js` (which also drives the FAQ structured data) and `termsData.js`;
  - page titles and descriptions in `utils/data/helmetData.js` and `metaData.js`;
  - nav and footer in `utils/data/navData.js`, `footerData.js`, `components/nav/` and `components/footer/`.
- **Build:** the routes in `PUBLIC_STATIC_ROUTES` (`utils/constants/routes.js`) are pre-rendered and listed in the sitemap.
- **Contact form:**
  - client: `components/forms/ContactForm.jsx`, admin view `pages/contact/admin/` and `components/contact/admin/`;
  - server: `src/routes|controllers|domain/contact.js`, `src/event/contactUtils.js`, `src/services/email/contact/`;
  - table: `ContactForm`;
  - env: `RESEND_API_KEY`, `EMAIL_FROM`, `CONTACT_ADMIN_RECIEVER_EMAIL`.

## Accounts and onboarding

- **Client:**
  - `auth/` (`AuthProvider`, `useAuth()`) and `users/` (login, register, verify, password pages);
  - `pages/account/` and `components/account/`;
  - the account forms in `components/forms/`;
  - guards in `utils/user/AuthenticateUser.jsx`;
  - onboarding: `pages/onboarding/WelcomePage.jsx` and `components/onboarding/` (solo/couple/family picker, travellers), where sign-up lands.
- **Server:**
  - `src/auth.js` (better-auth and its hooks: default map at sign-up, invite conversion, account deletion hand-over);
  - `src/routes|controllers|domain/users.js`, `src/middleware/auth.js`;
  - `src/services/email/users/` (verification and reset).
- **Tables:** `User`, `Session`, `Account`, `Verification`, `Profile`.
- **Env:** `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `FRONTEND_ORIGIN`, `RESEND_API_KEY`, `EMAIL_FROM`.

## Travel maps, travellers and countries visited

- **Client:**
  - `pages/map/MapPage.jsx`;
  - `components/map/` (the SVG map, country layer, overlays, toolbar, stats, country list and panel, settings, map switcher);
  - `hooks/useTravelMap.js` and `useMapViewport.js`;
  - `utils/map/`: `countries.js`, `countryShapes.js`, `projection.js`, `mapStyles.js`, `visitStatus.js`, `saveMapSetup.js`;
  - the posters and map-style images in `assets/images/posters|map-styles/`.
- **Server:**
  - `src/routes|controllers|domain/maps.js`, `src/services/travel/maps.js`;
  - `src/utils/mapStats.js`, `src/utils/access.js`;
  - countries and landmarks: `src/routes|controllers|domain/places.js`;
  - seed data: `prisma/seed/data/countries.js` and `landmarks.js`.
- **Tables:** `TravelMap`, `Traveller`, `MapMember`, `CountryVisit`, `Country`, `Landmark`.
- **Env:** none.

## Map settings

- **Client:** `hooks/useMapSettings.js`, `utils/map/mapSettings.js`, `components/map/SettingsPanel.jsx`.
- **Server:** `GET|PUT /api/users/map-settings` (`src/controllers/mapSettings.js`, `src/domain/profiles.js`, `src/utils/mapSettings.js`).
- **Tables:** `Profile.mapSettings`.

## Trips

- **Client:** `pages/trips/TripPage.jsx`, `components/trips/`, `utils/trips/`.
- **Server:** `src/routes|controllers|domain/trips.js`.
- **Tables:** `Trip`, `TripStop`, `TripTraveller`, `TripMember`.

## Photos and landmark matching

- **Client:**
  - `components/photos/` (uploader, grid, viewer, edit form, landmark list);
  - `utils/photos/`: EXIF, copies made in the browser, upload;
  - `hooks/usePhotoPage.js`, `useLandmarks.js`;
  - dependency `exifr` (its lite build), lazy-loaded.
- **Server:**
  - `src/routes/photos.js` plus the photo routes in `src/routes/maps.js`;
  - `src/controllers|domain/photos.js`;
  - `src/services/s3/` (`s3private.js`, `mediaService.js`);
  - `src/utils/countryLookup.js`, `landmarkMatch.js`, `projection.js`, `src/data/countryShapes.json`.
- **Tables:** `Photo`, `PhotoVariant`, `PhotoLandmark`, `MediaItem`.
- **Env:** `STORAGE_PRIVATE_*` (each falls back to `STORAGE_*`), `CRON_SECRET` (daily clean-up).

## Sharing and invites

- **Client:**
  - `components/sharing/` (the Google Docs-style dialog);
  - `pages/shared/SharedPage.jsx` (`/shared/:code`, no sign-in) and `pages/invite/InviteAcceptPage.jsx` (`/invite/:token`);
  - `utils/sharing/`;
  - analytics is excluded from both pages (`ANALYTICS_EXCLUDED_PREFIXES`).
- **Server:**
  - `src/controllers/sharing.js` (one module for maps and trips), `shared.js` and `invites.js`;
  - `src/routes/shared.js` and `invites.js`, `src/domain/sharing.js`;
  - `src/utils/access.js` and `shareCodes.js`, `src/services/travel/accounts.js`;
  - `src/services/email/users/shareEmail.handlebars`;
  - `src/middleware/dbRateLimit.js`.
- **Tables:** `MapMember`, `TripMember`, `ShareInvite`, `RateLimit`.
- **Env:** `RESEND_API_KEY` and `EMAIL_FROM` (share emails come from that address).

## Admin and audit log

- **Client:** `pages/admin/` and `components/admin/` (dashboard, users, events), behind `AuthenticateAdmin`; the audit log is behind `AuthenticateDeveloper`.
- **Server:** the admin routes in `src/routes/users.js`, `src/utils/userPermissions.js`, `src/routes|controllers|domain/events.js`.
- **Tables:** `User.role`, `User.isActive`, `AppEvent` (every feature writes to it).

## Other uploads (avatars, contact images)

- **Client:** `utils/media/`.
- **Server:** `src/routes|controllers/mediaGeneric.js` and `src/services/s3/` (`s3public.js`, `mediaService.js`, where `MEDIA_CFG` lists `avatar`, `contact` and the private `photo` resource, which the generic routes refuse). The daily cron in `vercel.json` and `scripts/cleanup-orphan-uploads.mjs` do the clean-up.
- **Tables:** `MediaItem`, `AvatarMediaItem`.
- **Env:** `STORAGE_ENDPOINT`, `STORAGE_REGION`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, `STORAGE_PUBLIC_HOST`; on the client, `VITE_MEDIA_CDN`.

## Analytics and cookie consent

- **Client:**
  - `utils/analytics/` (`consent.js`, `initGA.js`);
  - `components/modals/CookieConsentBanner.jsx` and `CookieConsentModal.jsx`;
  - the consent and analytics effects in `App.jsx`;
  - `COOKIE_CONSENT_STYLE` in `utils/constants/constants.js`.
- **Env:** `VITE_ANALYTICS_ID`.
- **GA4 setting:** turn off "page changes based on browser history events" in the property.

## Rate limiting

- **Server:** `src/middleware/rateLimit.js` (in memory: only the global backstop), `src/middleware/dbRateLimit.js` (database-backed: share-code lookups and browsing, invites, the contact form, generic and photo uploads, adding people, new maps), and better-auth's own limiter on the database (`src/auth.js`). Values in `src/utils/constants/rateLimitConstants.js`.
- **Tables:** `RateLimit` (expired rows are cleared by the daily cron) and `AuthRateLimit` (better-auth's; it prunes its own).

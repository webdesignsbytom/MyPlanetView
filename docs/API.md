# My Planet View API

The contract between the client and the server for the travel features. The template's own endpoints (auth, users, events, contact, media) keep their existing shapes, with the checks listed under "Accounts" and "Generic uploads and the contact form". Keep this file in step with the code.

All paths are under `/api`. Responses use the template's envelope: `{ status, data }` on success, `{ status, message }` on error. The client reads errors through `error.friendlyMessage`. Dates are ISO strings; date-only fields are `YYYY-MM-DD`.

- **Bodies are JSON only.** There is no urlencoded parser, so a plain HTML form can't post anything the API reads.
- **Cross-site writes are refused** (`middleware/originCheck.js`, before every route, better-auth's included). A `POST`, `PUT`, `PATCH` or `DELETE` gets 403 `{ status: 'fail', message }` when its `Origin` isn't one of `FRONTEND_ORIGIN`, or, with no `Origin`, when `Sec-Fetch-Site` is `cross-site`. Requests with neither header (curl, server-to-server tools, tests) pass, as do all reads.

## Access

| Role | How you get it | What it allows |
| --- | --- | --- |
| `OWNER` | You own the map (`TravelMap.ownerId`) | Everything, plus sharing settings, members, renaming, group type, deleting the map |
| `EDITOR` | Added to the map, or to a trip, as editor | Add and change content: visits, trips, stops, travellers, photos, landmark matches |
| `VIEWER` | Added as viewer, or opening a share code with "Anyone with the link" on | Read only. Never sees hidden photos, GPS coordinates or originals |

- **Map role:** owner, else the `MapMember` row, else none.
- **Trip role:** the higher of the map role and the trip's own `TripMember` row. A trip-only member can see and edit that trip and its photos, and nothing else on the map.
- **Trip-only editors** (a `TripMember` `EDITOR` with no editor role on the map):
  - they edit the trip's own content: its details, stops and travellers, completing it, and its photos (uploading into it included);
  - the visits that follow still go on the map, with their source: `TRIP` for a completed trip's stops, `PHOTO` for a photo's country. The owner gave edit rights, and the source shows where each came from. They can't mark a country by hand (they have no role on the map);
  - **deleting the trip** needs an `EDITOR` role on the map, or owning it: anyone else gets 403. The trip's `canDelete` says which (`canDeleteTrip` in `access.js`);
  - moving a photo to another trip, or off this one, also needs the map (403).
- **A verified email address** is needed to add or change content, whatever the role (`requireVerifiedEmail` in `middleware/auth.js`, on the routes):
  - **needs it:** creating and deleting maps; visits; trips, their stops and travellers; uploading, changing and deleting photos and their landmark matches; every sharing change (link access, reset link, members, invites); avatars (`POST /users/user/upload-or-change-avatar`, and the generic presign for any resource but `contact`). Accepting an invite already needed it;
  - **doesn't:** reading anything; setting up a map (`PATCH /maps/:mapId`, its travellers), which the welcome page does straight after sign-up; map settings; account changes; the contact form;
  - **answer:** 403 `{ status: 'fail', message }` with "Verify your email address to add to your map or share it…", checked before any lookup, so it's the same for every id, real or not, and reveals nothing about other people's maps.
- **Link viewers:** anyone holding a share code whose resource has `ANYONE_WITH_LINK` gets `VIEWER`, signed in or not, through `/api/shared/:code` only.
- **No access:** a resource the user has no role on answers **404**, not 403, so ids and codes can't be probed.
- **Not enough access:** a user who can see a resource but lacks the role for an action (a viewer trying to edit, an editor trying to share) gets **403**.
- **Pure rules:** all role rules live in `server/src/utils/access.js`, which is unit-tested.
- **Deletes:** every delete answers 200 with `{ message }`, except removing a photo's landmark match and the trip-stop delete, which answer with the changed photo or trip.

### Client pages the API links to

Emails and share URLs point at these client routes, built from `server/src/utils/constants/siteConstants.js`:

| Route | What it is |
| --- | --- |
| `/shared/<code>` | A share link, opened by anyone |
| `/invite/<token>` | Accepting an emailed invite; calls `POST /invites/accept` once the user is signed in |
| `/maps/<mapId>` | A map, for the people it's shared with |
| `/trips/<tripId>` | A trip, for the people it's shared with |

## Reference data (public, cacheable)

**Special places** are rows of the country list with `kind: 'SPECIAL'`: Antarctica (`AQ`, a shape on the map) and four poles, which are points: the North Pole (`XN`), the Magnetic North Pole (`QN`), the South Pole (`XS`) and the Magnetic South Pole (`QS`). They take visits, trip stops and photos like countries, with these differences (`server/src/utils/specialPlaces.js`):
- **Stats** count them apart: `countries` leaves them out and `specialPlaces` counts them. Antarctica and the South Pole count towards the continents (the seventh).
- **The South Pole is in Antarctica:** any visit to `XS` that counts (by hand, a completed trip, a photo) also adds `AQ` if it's missing, or turns a "want to go" one into `VISITED`. Removing `XS` leaves `AQ`.
- **From a photo's GPS:** latitude 89.9° or more is `XN`, −89.9° or less is `XS`, and Antarctica is found from its shape. A magnetic pole is never found from GPS, as it moves tens of kilometres a year; people mark it by hand or choose it for a photo.
- **Travellers** can be born in, or favour, Antarctica, but not a pole (400 `Choose a country or Antarctica, not a pole.`).

| Method and path | Returns |
| --- | --- |
| `GET /countries` | `{ countries: [{ code, name, slug, kind, continent, pinX, pinY }] }`. `kind` is `COUNTRY`, or `SPECIAL` for the five special places (below); `continent` is null for the North Pole and the magnetic poles. |
| `GET /landmarks?country=JP` | `{ landmarks: [{ id, name, slug, countryCode, latitude, longitude, pinX, pinY, matchRadiusM }] }`. `country` is optional. |

- **Caching:** both send `Cache-Control: public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400` and `Vary: Origin`. Browsers keep them an hour; Vercel's CDN keeps one copy per origin (each carries that origin's CORS header) and strips `s-maxage` before the browser sees it. A 400 isn't cached.

## Maps

| Method and path | Role | Body / returns |
| --- | --- | --- |
| `GET /maps` | signed in | `{ maps: [{ id, name, groupType, isDefault, role, ownerName, counts: { countries, photos, trips } }] }`: maps you own, then maps shared with you |
| `POST /maps` | signed in | `{ name, groupType, travellers: [{ name, birthCountryCode?, favouriteCountryCode? }] }` → `{ map }`. 20 new maps a day per user (429 after). |
| `GET /maps/:mapId` | viewer | `{ map: { id, name, groupType, isDefault, role, ownerName, travellers: [{ id, name, position, birthCountryCode, favouriteCountryCode, userId (editors only) }], visits: [{ countryCode, status, source, firstVisitedOn, notes }], stats } }` |
| `PATCH /maps/:mapId` | owner | `{ name?, groupType? }` → `{ map }` |
| `DELETE /maps/:mapId` | owner | Refused (409) for the default map. Deletes the map's rows, then its photos' files, up to 1,000 per DeleteObjects request; a file that can't be deleted is left for the daily clean-up. |
| `GET /maps/:mapId/stats` | viewer | `{ stats: { countries, specialPlaces, continents, photos, landmarks, trips, byTraveller: [{ travellerId, name, countries }] } }`. `countries` (and each traveller's) counts countries only; `specialPlaces` counts Antarctica and the poles. |

- **The default map** is created by a better-auth `user.create.after` hook: "My map", `SOLO`, with one traveller named after the user. Onboarding then edits it with `PATCH` and the traveller routes. `GET /maps` also creates it if it's somehow missing. There's never more than one: the database refuses a second (`TravelMap.defaultForOwnerId` is unique), and a request that loses that race uses the one that won.
- **Visited countries** in stats count `VISITED` and `LIVED`, not `WANT_TO_GO`.

### Travellers

| Method and path | Role | Body |
| --- | --- | --- |
| `POST /maps/:mapId/travellers` | editor | `{ name, birthCountryCode?, favouriteCountryCode?, position? }` → `{ traveller }` |
| `PATCH /maps/:mapId/travellers/:travellerId` | editor | same fields, all optional |
| `DELETE /maps/:mapId/travellers/:travellerId` | editor | 409 if it's the map's last traveller |

### Countries visited

| Method and path | Role | Body |
| --- | --- | --- |
| `PUT /maps/:mapId/visits/:countryCode` | editor | `{ status, firstVisitedOn?, notes? }`: creates or updates, `source: MANUAL` → `{ visit, implied }`. `implied` lists the other visits this one added or changed, in the same shape: `[]`, or Antarctica's for a South Pole visit (see "Special places") |
| `DELETE /maps/:mapId/visits/:countryCode` | editor | |

## Map settings

Each signed-in user's own viewing preferences, stored in `Profile.mapSettings` (JSON). They belong to the person, not the map: everyone sees any map in their own style.

| Method and path | Role | Body / returns |
| --- | --- | --- |
| `GET /users/map-settings` | signed in | `{ mapSettings }`, or `{ mapSettings: null }` if none are saved |
| `PUT /users/map-settings` | signed in | `{ mapSettings }` → `{ mapSettings }` as saved. Creates the `Profile` row if it's missing. |

- **Accepted keys:**
  - `style`: `animated`, `old-map`, `jupiter` or `galaxy`;
  - `mapType`: `regular`, or `detailed` (country names, grid lines and landmarks at every zoom);
  - the booleans `showGrid`, `showGridLabels`, `animatedSea`, `sunAndMoon`, `showCountryNames` and `hoverPreview`;
  - from my_planet, the booleans `showVisited` and `showUnvisited` (when off, those countries fade back on the map) and `showUserBanner` (the map's banner at the top);
  - `showAntarctica` (on unless set to `false`): draws Antarctica and the two South Poles, and extends the map down to them. It changes only the view, never visits or stats.
- **Unknown keys** are dropped. A known key with the wrong kind of value is refused (400).
- **The whole object is replaced** on each `PUT`. Send every setting, not just the one that changed.

## Trips

| Method and path | Role | Body / returns |
| --- | --- | --- |
| `GET /maps/:mapId/trips` | viewer | `{ trips: [{ id, mapId, title, status, startDate, endDate, coverThumbUrl, stopCount, photoCount, travellerIds }] }` |
| `POST /maps/:mapId/trips` | editor | `{ title, description?, status?, startDate?, endDate?, travellerIds? }` → `{ trip }` |
| `GET /trips/shared-with-me` | signed in | `{ trips: [{ ...summary, role, mapName }] }`: trips you were added to directly (a trip-only member can't list the map) |
| `GET /trips/:tripId` | viewer of the trip | `{ trip: { id, mapId, mapName, canOpenMap, canDelete, title, description, status, startDate, endDate, coverPhotoId, coverThumbUrl, role, travellerIds, travellers: [{ id, name }], stops: [{ id, position, countryCode, landmarkId, landmarkName, placeName, arriveOn, leaveOn, notes }] } }`. `travellers` are the map's, for showing names. `canOpenMap` is whether the caller has a role on the trip's map (false for a trip-only member, so the page doesn't link to a map they can't open). `canDelete` is whether they may delete the trip (the map's owner or an editor of the map; false through a share link). |
| `GET /trips/:tripId/photos?country=&unplaced=&cursor=&limit=` | viewer of the trip | The trip's photos, same shape as the map photo list (how a trip-only member sees them) |
| `PATCH /trips/:tripId` | editor | `{ title?, description?, status?, startDate?, endDate?, coverPhotoId? }` |
| `DELETE /trips/:tripId` | editor **of the map**, or its owner | Photos stay on the map (their `tripId` is cleared). A trip-only editor gets 403 `{ message }`. |
| `PUT /trips/:tripId/travellers` | editor | `{ travellerIds }`: the full list, all from the trip's map |
| `POST /trips/:tripId/stops` | editor | `{ countryCode, landmarkId?, placeName?, arriveOn?, leaveOn?, notes? }`, added last |
| `PATCH /trips/:tripId/stops/:stopId` | editor | the same fields |
| `DELETE /trips/:tripId/stops/:stopId` | editor | |
| `PUT /trips/:tripId/stops/order` | editor | `{ stopIds }`: every stop of the trip, once each, in the new order |

- Every change to a trip, its travellers or its stops answers with the whole trip (`{ trip }`, as `GET /trips/:tripId`).
- **`coverPhotoId`** must be a photo on that trip, or `null`.
- **Completed trips:** when a trip is set to `COMPLETED`, each stop's country gets a `CountryVisit` (`VISITED`, `source: TRIP`). A `WANT_TO_GO` country becomes `VISITED`; an existing `VISITED` or `LIVED` one is left as it is. The same applies to stops added to, or changed on, a trip that's already completed. The change and its visits are saved in one transaction.

## Photos

### Uploading

1. **In the browser** (see `docs/SITE-DESIGN.md`):
   - read `takenAt`, `latitude` and `longitude` from EXIF;
   - make `THUMB` (~400 px) and `DISPLAY` (~1600 px) JPEG or WebP copies;
   - keep the original file.
2. **`POST /maps/:mapId/photos/presign`** (editor, or trip editor with `tripId`)
   - Body: `{ tripId?, files: [{ size: 'THUMB'|'DISPLAY'|'ORIGINAL', contentType, bytes }] }`. `THUMB` and `DISPLAY` are required. `bytes` is the file's exact size: a missing or non-whole value → 400, over the cap → 413.
   - Returns `{ photoId, uploads: [{ size, key, url, method: 'PUT', headers: { 'Content-Type' }, bytes, expiresIn }] }`.
   - Each upload URL lasts 10 minutes and signs the `Content-Type` and the `Content-Length` (`X-Amz-SignedHeaders=content-length;content-type;host`). The `PUT` must send exactly that type and a body of exactly `bytes` bytes, or R2 refuses it (403).
   - Files go to the **private** bucket at `<BucketNamespace>/photos/<mapId>/<photoId>/<size>-<random>.<ext>`.
   - Types: `image/jpeg`, `image/webp` or `image/png` for every size. No HEIC (SITE-DESIGN.md, "Why three files per photo").
   - Size caps (in `mediaConstants.js`): `THUMB` 1 MB, `DISPLAY` 5 MB, `ORIGINAL` 50 MB.
   - **Unfinished uploads:** a user may have at most 60 files presigned and not yet saved, counted over the last 24 hours (`UNCONFIRMED_UPLOAD_LIMIT.photo`). A presign that would go over → 429 `{ message: 'Too many unfinished uploads. Please try again later.' }`. Saving a photo frees its files from the count.
   - Rate limited.
3. **The browser `PUT`s each file** to its URL.
4. **`POST /maps/:mapId/photos`**
   - Body: `{ photoId, tripId?, caption?, takenAt?, latitude?, longitude?, countryCode?, width, height, variants: [{ size, key, width, height }] }`.
     - `width` and `height` are the original's.
     - `countryCode` is the uploader's chosen country. It's used when there's no GPS, or when the GPS position isn't in any country (a photo taken at sea); a country found from GPS always wins. A photo left with no country is listed by `?unplaced=1`.
   - The server checks each key belongs to this map and photo and was presigned for this user within the last 50 minutes, and checks its real size and type in R2 (HEAD). If any check fails, every file of that upload is deleted and nothing is saved (400, or 413 when too large; too late → 400 `This upload took too long to finish. Please try again.`).
   - It then creates the `MediaItem`s, the `Photo` and its `PhotoVariant`s in one transaction.
   - With GPS, it sets `countryCode` (Robinson projection + point-in-polygon against the map's own shapes, `server/src/data/countryShapes.json`). It also adds `CountryVisit (VISITED, source PHOTO)` if missing (or turns a `WANT_TO_GO` one into `VISITED`; the same applies to the `countryCode` chosen for a photo without GPS), and suggests landmarks within their `matchRadiusM` (`PhotoLandmark`, `source GPS`, `confirmed false`).
   - Returns `{ photo }` (the same shape as `GET /photos/:photoId`). 409 if that `photoId` was already saved.
   - **Unfinished uploads:** photo files presigned but never saved are deleted by the daily clean-up once they're an hour old (a photo can't be saved after 50 minutes, so none is deleted while it's being saved).

### Reading and changing

| Method and path | Role | Body / returns |
| --- | --- | --- |
| `GET /maps/:mapId/photos?country=&unplaced=&tripId=&cursor=&limit=` | viewer | `{ photos: [{ id, caption, takenAt, countryCode, tripId, width, height, thumbUrl, landmarks: [{ id, name, confirmed }], hidden (editors only) }], nextCursor }`. In the gallery's order (see `POST /photos/:photoId/move`): with `tripId`, or on a trip's list, the trip's order; with `country` or `unplaced`, that gallery's order; with neither, the whole map newest upload first (the hover postcards). A new photo goes first everywhere. `limit` 1–60 (default 30). `unplaced=1` lists only the photos with no country (no location and none chosen, or a location at sea), so they can be found and placed; it can't be combined with `country` (400). Viewers never get `hidden` photos, and see confirmed landmarks only. |
| `GET /photos/:photoId` | viewer | `{ photo: { ..., displayUrl } }`. Editors also get `originalUrl`, `latitude`, `longitude`, and every landmark match with its `source` and `distanceM`. |
| `PATCH /photos/:photoId` | editor | `{ caption?, countryCode?, tripId?, takenAt?, hidden? }`. Moving a photo between trips (`tripId`) needs editor on the map, not just the trip. A new `countryCode` marks that country visited (`source: PHOTO`), in the same transaction. A photo that lands in another gallery (a new country, no country, or a new trip) goes first there; sending its current country again changes nothing. → `{ photo }` |
| `POST /photos/:photoId/move` | editor of that gallery | Rearranging. `{ gallery, afterId }`: `gallery` is `'country'` (the photo's country on its map; the unplaced photos are one gallery) or `'trip'` (its trip; 400 if it has none). The photo goes straight after `afterId` in that gallery, or first when `afterId` is null. A country's gallery needs editor on the map; a trip's needs editor of the trip (a trip-only editor too). Only the photo's own position changes, unless its new neighbours have no room left between them (then the gallery is renumbered, in the same transaction). 400 for a bad gallery or `afterId` (not an id, or the photo itself); 409 if `afterId` isn't in that gallery any more. → `{ message }` |
| `DELETE /photos/:photoId` | editor | Deletes the rows, then the files from R2 (one DeleteObjects request). A file that can't be deleted is left for the daily clean-up. |
| `POST /photos/:photoId/landmarks` | editor | `{ landmarkId }`: a manual match, confirmed → 201 `{ photo }` |
| `PATCH /photos/:photoId/landmarks/:landmarkId` | editor | `{ confirmed: true }` → `{ photo }`. 404 if the photo has no such match. |
| `DELETE /photos/:photoId/landmarks/:landmarkId` | editor | → `{ photo }` (the photo without that match). 404 if the photo has no such match. |

- **Signed URLs:** file URLs are signed `GET`s on the private bucket. The signing time is rounded down to the hour and they're valid for two hours, so the same file keeps the same URL for an hour and the browser cache works.

## Sharing

The same routes exist for maps and trips: `:resource` is `maps` or `trips`. A trip's "owner" is the owner of its map.

| Method and path | Role | Body / returns |
| --- | --- | --- |
| `GET /:resource/:id/sharing` | owner (a trip's map owner) | `{ linkAccess, shareCode, shareUrl, members: [{ userId, name, email, role }], invites: [{ id, email, role, expiresAt }] }` |
| `PATCH /:resource/:id/sharing` | owner | `{ linkAccess }` → the same as `GET` |
| `POST /:resource/:id/sharing/reset-link` | owner | → `{ shareCode, shareUrl }`. Old links stop working. |
| `POST /:resource/:id/members` | owner, with a **verified** email | `{ email, role }`. An active account whose address is **verified** is added and emailed → 201 `{ member }`. Anyone else (no account, or an unverified or deactivated one) gets a `ShareInvite` (token emailed, 14 days; replaces an earlier pending one for that address) → 201 `{ invite }`. Your own address → 400. An owner whose own address isn't verified → 403 `{ message }` (after the 404/403 role checks), and nothing is sent. Rate limited per IP and per user (below). |
| `PATCH /:resource/:id/members/:userId` | owner | `{ role }` → `{ member }` |
| `DELETE /:resource/:id/members/:userId` | owner, or the member themselves (leaving) | |
| `DELETE /:resource/:id/invites/:inviteId` | owner | |
| `POST /invites/accept` | signed in | `{ token }` → `{ resource: 'map'|'trip', id }`. A bad, used or expired token → 400. The invite's address must be the user's **verified** email, else 403. Never lowers a role the user already has. Marking the invite used and adding the member is one transaction, so the same invite accepted twice at once counts once (the other gets 400). Rate limited like share codes. |
| `GET /shared/:code` | anyone | Normalises the code (upper case, no dashes or spaces). A map → `{ resource: 'map', id, role, map, trips }` (`map` as `GET /maps/:id`, `trips` as `GET /maps/:id/trips`). A trip → `{ resource: 'trip', id, role, trip }` (as `GET /trips/:id`, with `canOpenMap` always false: the share page doesn't link to the map). `role` is the caller's: `VIEWER` for link visitors, while a signed-in member keeps their own. 404 when the code is unknown, or the link is off and the caller isn't a member. Rate limited per IP (the lookup count). |
| `GET /shared/:code/photos?country=&unplaced=&tripId=&cursor=&limit=` | anyone with the code | Like the map or trip photo list, with the same `role` rules. Rate limited (the browsing count; a code that matches nothing also uses the lookup count). |
| `GET /shared/:code/photos/:photoId` | anyone with the code | One photo of that map or trip, as `GET /photos/:photoId` (how a link visitor opens a photo). Rate limited like the photo list. |

- **Pending invites are accepted automatically** too: as soon as an account verifies the invited address, or signs up already verified.
- **Share emails** have a fixed subject, `<BusinessName>: a map was shared with you` (or `a trip`). The sharer's name appears only in the body, escaped; names are cleaned when they're set (see "Accounts").

- **Share codes:** 12 characters from `23456789ABCDEFGHJKMNPQRSTVWXYZ`, shown as `XXXX-XXXX-XXXX`, stored without dashes.
- **Share URL:** `https://<site>/shared/<code>`.
- **Invite tokens:** 32 random bytes, base64url. Only their SHA-256 hash is stored.

## Accounts

better-auth's own routes (`/api/auth/*`, better-auth 1.7.20) keep its reply shapes (`{ message, code }` on error). `server/src/auth.js` adds these checks:

| Route | What changes |
| --- | --- |
| `POST /auth/sign-up/email`, `POST /auth/update-user` | `name` is cleaned before it's stored (`utils/displayName.js`): control characters (CR and LF included), line separators and bidi overrides become spaces, runs of spaces become one, it's trimmed and cut to 80 characters. Nothing left → 400 `Enter your name.` |
| `POST /auth/sign-up/email` (`password`), `POST /auth/reset-password` and `POST /auth/change-password` (`newPassword`) | The new password must follow the client's rules (`utils/passwordRules.js`): 8 to 128 characters, an uppercase letter, a number and a special character, and none of `/ \ " '`. Otherwise 400 `Use 8 to 128 characters, with an uppercase letter, a number and a special character, and none of / \ " '.` (a refused reset doesn't use up its token). Signing in with an older, simpler password still works. |
| `POST /auth/sign-up/email`, `POST /auth/update-user` (`role`, `isActive`) | Never set here: a sign-up always gets `USER` and active, and `update-user` with `role` → 400. Only the admin routes change them. The session's user (`GET /auth/get-session`) now includes both. |
| `POST /auth/delete-user` | `password` is required (400 without it), and better-auth checks it. A session alone can't delete the account. |
| `POST /auth/change-email` | For a verified account, the link goes to the **current** address first (`users/userChangeEmailConfirmation.handlebars`, client link `/verify-email-address/<userId>/<token>?change=confirm`). Opening it sends the usual verification to the new address, and the email changes once that one is opened. An unverified account skips the first step. An address that already has an account gets the same 200 `{ status: true }`, but nothing is sent and nothing changes (better-auth, so the answer doesn't say whether the address is taken). |
| `POST /auth/sign-up/email` with a taken address | Still 422 `User already exists. Use another email.` (see the note in `docs/AUDIT.md`, E). |

- **Rate limits** on `/api/auth/*` are better-auth's, counted in the database (the `AuthRateLimit` model, `auth_rate_limit` table) per client IP (an IPv6 address by its /64) and path: 100 a minute in general; sign-in, sign-up, change-password and change-email 3 per 10 seconds (better-auth's own rule); `request-password-reset` and `send-verification-email` 5 per 15 minutes. Over the limit → 429 `{ message: 'Too many requests. Please try again later.' }` with `X-Retry-After` (seconds).

## Generic uploads and the contact form

Avatars and contact-form images go to the **public** bucket through `/api/media-services`. These routes answer with raw JSON (no `{ status, data }` envelope); errors are `{ error, message }`. A 4xx carries a fixed message; anything else is a generic 500 (the detail is only logged).

| Method and path | Who | Body / returns |
| --- | --- | --- |
| `POST /media-services/presign-url` | `avatar`: signed in (401 otherwise). `contact`: anyone (the public contact form) | `{ resource: 'avatar'\|'contact', contentType, bytes, filename? }` → `{ url, key, expiresIn, contentType, bytes, visibility, maxBytes, publicUrl, method: 'PUT', headers: { 'Content-Type' } }`. Rate limited. |
| `PUT <url>` (the bucket) | the uploader | Exactly `contentType`, and a body of exactly `bytes` bytes: both are signed, so anything else gets 403. 10 minutes. |
| `POST /media-services/confirm-upload` | anyone for an anonymous upload; the owner for their own (someone else's → 404) | `{ key }` → `{ key, bytes }`. HEADs the object: its real type must be the declared one and allowed, and its size within the cap. Otherwise the file is deleted and the answer is 400; the upload stays unconfirmed (and unusable) until the daily clean-up removes its row. Nothing in the bucket → 400. |

- **Types:** `image/png`, `image/jpeg`, `image/webp` or `image/gif` only, matched exactly (`server/src/utils/media/uploadRules.js`). Anything else → 400. No SVG or HTML.
- **Size:** `bytes` must be a whole number above 0 (400) and at most 5 MB (413).
- **Unfinished uploads:** a signed-in user may have at most 20 avatar and contact uploads presigned and not confirmed, counted over the last 24 hours; above that → 429 `Too many unfinished uploads. Please try again later.` (A visitor's contact upload has no user; the rate limit covers it.) The daily clean-up deletes uploads nothing uses once they're a day old, but never a contact image a form shows.
- **Keys:** `<BucketNamespace>/<avatars|contact>/<userId|anon>/<yyyy>/<mm>/<name>_<random>.<ext>`. The extension comes from the type, never from `filename`.
- **Avatar** (`POST /users/user/upload-or-change-avatar`, `{ key, alt?, focalX?, focalY? }`): the key must be the user's own confirmed avatar upload of an allowed type, else 400.
- **Contact form** (`POST /contact/create-new-contact-form`, anyone, `{ name, email, message, imageKey? }` → 201 `{ contactForm }`):
  - `email` must be one plain address (trimmed, lower-cased, at most 254 characters, no spaces, angle brackets, commas or quotes), else 400 `Enter a valid email address.`; it becomes the notification's reply-to;
  - `imageKey`, when sent, must be a confirmed `contact` upload of an allowed type, uploaded within the last hour and not attached to another form, else 400.

## Rate limits

Shared, database-backed counters (`RateLimit` table, from NextDummy), keyed per IP unless noted. An IPv6 address counts by its /64.

| What | Limit |
| --- | --- |
| Share-code lookups: opening a link (`GET /shared/:code`), and any `/shared/:code/photos…` request whose code matches no map or trip | 30 per 15 min (one counter) |
| Browsing an open link (`/shared/:code/photos…`) | 300 per 15 min (separate counter) |
| Invite accepts | 30 per 15 min (separate counter) |
| Photo presigns | 120 per 15 min |
| Generic uploads (`presign-url` and `confirm-upload` together) | 20 per 15 min |
| Contact form | 5 per 15 min |
| Member invites (`POST …/members`) | 20 per hour |
| Member invites, per signed-in user (maps and trips together) | 25 per 24 hours |
| New maps (`POST /maps`), per signed-in user | 20 per 24 hours |

- Over the limit → 429 `{ status, message }` with `Retry-After`.
- The whole API also has an in-memory backstop of 1,000 requests per 15 minutes per IP and instance.
- better-auth's routes have their own limits, also in the database (see "Accounts").
- Finished windows are removed by the daily clean-up cron.

## Daily clean-up (cron)

`GET /media-services/cron/cleanup-orphans`, run by Vercel once a day with `Authorization: Bearer <CRON_SECRET>` (401 otherwise). It answers `{ status, data: { checked, deleted, failed, batches, complete, expiredRateLimits, oldEvents, expiredSessions, expiredVerifications, oldInvites } }`.

1. **Purges**, together and each on its own (a failed one is logged and reported as `null`): finished rate-limit windows, events older than 90 days, sessions and verifications past their expiry, and invites accepted or expired over 30 days ago.
2. **Unused uploads**, oldest first, 500 at a time: photo files nothing uses after an hour, other uploads after a day. Never a file a photo or an avatar uses, nor a contact image a form shows. Each batch is one DeleteObjects request per bucket and one row delete. Files that can't be deleted are skipped until the next day. No batch starts 40 s after the request began (the function's limit is 60 s); `complete: false` means some were left for the next run.

# My Planet View API

The contract between the client and the server for the travel features. The template's own endpoints (auth, users, events, contact, media) keep their existing shapes. Keep this file in step with the code.

All paths are under `/api`. Responses use the template's envelope: `{ status, data }` on success, `{ status, message }` on error. The client reads errors through `error.friendlyMessage`. Dates are ISO strings; date-only fields are `YYYY-MM-DD`.

## Access

| Role | How you get it | What it allows |
| --- | --- | --- |
| `OWNER` | You own the map (`TravelMap.ownerId`) | Everything, plus sharing settings, members, renaming, group type, deleting the map |
| `EDITOR` | Added to the map, or to a trip, as editor | Add and change content: visits, trips, stops, travellers, photos, landmark matches |
| `VIEWER` | Added as viewer, or opening a share code with "Anyone with the link" on | Read only. Never sees hidden photos, GPS coordinates or originals |

- **Map role:** owner, else the `MapMember` row, else none.
- **Trip role:** the higher of the map role and the trip's own `TripMember` row. A trip-only member can see and edit that trip and its photos, and nothing else on the map.
- **Link viewers:** anyone holding a share code whose resource has `ANYONE_WITH_LINK` gets `VIEWER`, signed in or not, through `/api/shared/:code` only.
- **No access:** a resource the user has no role on answers **404**, not 403, so ids and codes can't be probed.
- **Not enough access:** a user who can see a resource but lacks the role for an action (a viewer trying to edit, an editor trying to share) gets **403**.
- **Pure rules:** all role rules live in `server/src/utils/access.js`, which is unit-tested.
- **Deletes:** every delete answers 200 with `{ message }`.

### Client pages the API links to

Emails and share URLs point at these client routes, built from `server/src/utils/constants/siteConstants.js`:

| Route | What it is |
| --- | --- |
| `/shared/<code>` | A share link, opened by anyone |
| `/invite/<token>` | Accepting an emailed invite; calls `POST /invites/accept` once the user is signed in |
| `/maps/<mapId>` | A map, for the people it's shared with |
| `/trips/<tripId>` | A trip, for the people it's shared with |

## Reference data (public, cacheable)

| Method and path | Returns |
| --- | --- |
| `GET /countries` | `{ countries: [{ code, name, slug, continent, pinX, pinY }] }` |
| `GET /landmarks?country=JP` | `{ landmarks: [{ id, name, slug, countryCode, latitude, longitude, pinX, pinY, matchRadiusM }] }`. `country` is optional. |

## Maps

| Method and path | Role | Body / returns |
| --- | --- | --- |
| `GET /maps` | signed in | `{ maps: [{ id, name, groupType, isDefault, role, ownerName, counts: { countries, photos, trips } }] }`: maps you own, then maps shared with you |
| `POST /maps` | signed in | `{ name, groupType, travellers: [{ name, birthCountryCode?, favouriteCountryCode? }] }` → `{ map }` |
| `GET /maps/:mapId` | viewer | `{ map: { id, name, groupType, isDefault, role, ownerName, travellers: [{ id, name, position, birthCountryCode, favouriteCountryCode, userId (editors only) }], visits: [{ countryCode, status, source, firstVisitedOn, notes }], stats } }` |
| `PATCH /maps/:mapId` | owner | `{ name?, groupType? }` → `{ map }` |
| `DELETE /maps/:mapId` | owner | Refused (409) for the default map. Deletes its photos' files too. |
| `GET /maps/:mapId/stats` | viewer | `{ stats: { countries, continents, photos, landmarks, trips, byTraveller: [{ travellerId, name, countries }] } }` |

- **The default map** is created by a better-auth `user.create.after` hook: "My map", `SOLO`, with one traveller named after the user. Onboarding then edits it with `PATCH` and the traveller routes. `GET /maps` also creates it if it's somehow missing.
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
| `PUT /maps/:mapId/visits/:countryCode` | editor | `{ status, firstVisitedOn?, notes? }`: creates or updates, `source: MANUAL` |
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
  - from my_planet, the booleans `showVisited` and `showUnvisited` (when off, those countries fade back on the map) and `showUserBanner` (the map's banner at the top).
- **Unknown keys** are dropped. A known key with the wrong kind of value is refused (400).
- **The whole object is replaced** on each `PUT`. Send every setting, not just the one that changed.

## Trips

| Method and path | Role | Body / returns |
| --- | --- | --- |
| `GET /maps/:mapId/trips` | viewer | `{ trips: [{ id, mapId, title, status, startDate, endDate, coverThumbUrl, stopCount, photoCount, travellerIds }] }` |
| `POST /maps/:mapId/trips` | editor | `{ title, description?, status?, startDate?, endDate?, travellerIds? }` → `{ trip }` |
| `GET /trips/shared-with-me` | signed in | `{ trips: [{ ...summary, role, mapName }] }`: trips you were added to directly (a trip-only member can't list the map) |
| `GET /trips/:tripId` | viewer of the trip | `{ trip: { id, mapId, mapName, title, description, status, startDate, endDate, coverPhotoId, coverThumbUrl, role, travellerIds, travellers: [{ id, name }], stops: [{ id, position, countryCode, landmarkId, landmarkName, placeName, arriveOn, leaveOn, notes }] } }`. `travellers` are the map's, for showing names. |
| `GET /trips/:tripId/photos?country=&cursor=&limit=` | viewer of the trip | The trip's photos, same shape as the map photo list (how a trip-only member sees them) |
| `PATCH /trips/:tripId` | editor | `{ title?, description?, status?, startDate?, endDate?, coverPhotoId? }` |
| `DELETE /trips/:tripId` | editor | Photos stay on the map (their `tripId` is cleared) |
| `PUT /trips/:tripId/travellers` | editor | `{ travellerIds }`: the full list, all from the trip's map |
| `POST /trips/:tripId/stops` | editor | `{ countryCode, landmarkId?, placeName?, arriveOn?, leaveOn?, notes? }`, added last |
| `PATCH /trips/:tripId/stops/:stopId` | editor | the same fields |
| `DELETE /trips/:tripId/stops/:stopId` | editor | |
| `PUT /trips/:tripId/stops/order` | editor | `{ stopIds }`: every stop of the trip, once each, in the new order |

- Every change to a trip, its travellers or its stops answers with the whole trip (`{ trip }`, as `GET /trips/:tripId`).
- **`coverPhotoId`** must be a photo on that trip, or `null`.
- **Completed trips:** when a trip is set to `COMPLETED`, each stop's country gets a `CountryVisit` (`VISITED`, `source: TRIP`). A `WANT_TO_GO` country becomes `VISITED`; an existing `VISITED` or `LIVED` one is left as it is. The same applies to stops added to, or changed on, a trip that's already completed.

## Photos

### Uploading

1. **In the browser** (see `docs/SITE-DESIGN.md`):
   - read `takenAt`, `latitude` and `longitude` from EXIF;
   - make `THUMB` (~400 px) and `DISPLAY` (~1600 px) JPEG or WebP copies;
   - keep the original file.
2. **`POST /maps/:mapId/photos/presign`** (editor, or trip editor with `tripId`)
   - Body: `{ tripId?, files: [{ size: 'THUMB'|'DISPLAY'|'ORIGINAL', contentType, bytes }] }`. `THUMB` and `DISPLAY` are required.
   - Returns `{ photoId, uploads: [{ size, key, url, method: 'PUT', headers: { 'Content-Type' }, expiresIn }] }`.
   - Each upload URL lasts 10 minutes. The `PUT` must send exactly the `Content-Type` given, or R2 refuses it.
   - Files go to the **private** bucket at `<BucketNamespace>/photos/<mapId>/<photoId>/<size>-<random>.<ext>`.
   - Types:
     - `THUMB` and `DISPLAY`: `image/jpeg`, `image/webp` or `image/png`;
     - `ORIGINAL`: those, or `image/heic`/`image/heif`.
   - Size caps (in `mediaConstants.js`): `THUMB` 1 MB, `DISPLAY` 5 MB, `ORIGINAL` 50 MB.
   - Rate limited.
3. **The browser `PUT`s each file** to its URL.
4. **`POST /maps/:mapId/photos`**
   - Body: `{ photoId, tripId?, caption?, takenAt?, latitude?, longitude?, countryCode?, width, height, variants: [{ size, key, width, height }] }`.
     - `width` and `height` are the original's.
     - `countryCode` is used only when there's no GPS (the uploader picks the country).
   - The server checks each key belongs to this map and photo and was presigned for this user, and checks its real size and type in R2 (HEAD). If any check fails, every file of that upload is deleted and nothing is saved (400, or 413 when too large).
   - It then creates the `MediaItem`s, the `Photo` and its `PhotoVariant`s in one transaction.
   - With GPS, it sets `countryCode` (Robinson projection + point-in-polygon against the map's own shapes, `server/src/data/countryShapes.json`). It also adds `CountryVisit (VISITED, source PHOTO)` if missing (or turns a `WANT_TO_GO` one into `VISITED`; the same applies to the `countryCode` chosen for a photo without GPS), and suggests landmarks within their `matchRadiusM` (`PhotoLandmark`, `source GPS`, `confirmed false`).
   - Returns `{ photo }` (the same shape as `GET /photos/:photoId`). 409 if that `photoId` was already saved.
   - **Unfinished uploads:** files presigned but never saved are deleted by the daily clean-up after 24 hours.

### Reading and changing

| Method and path | Role | Body / returns |
| --- | --- | --- |
| `GET /maps/:mapId/photos?country=&tripId=&cursor=&limit=` | viewer | `{ photos: [{ id, caption, takenAt, countryCode, tripId, width, height, thumbUrl, landmarks: [{ id, name, confirmed }], hidden (editors only) }], nextCursor }`. Newest first (by upload), `limit` 1–60 (default 30). Viewers never get `hidden` photos, and see confirmed landmarks only. |
| `GET /photos/:photoId` | viewer | `{ photo: { ..., displayUrl } }`. Editors also get `originalUrl`, `latitude`, `longitude`, and every landmark match with its `source` and `distanceM`. |
| `PATCH /photos/:photoId` | editor | `{ caption?, countryCode?, tripId?, takenAt?, hidden? }`. Moving a photo between trips (`tripId`) needs editor on the map, not just the trip. → `{ photo }` |
| `DELETE /photos/:photoId` | editor | Deletes the files from R2 and the rows |
| `POST /photos/:photoId/landmarks` | editor | `{ landmarkId }`: a manual match, confirmed |
| `PATCH /photos/:photoId/landmarks/:landmarkId` | editor | `{ confirmed: true }` |
| `DELETE /photos/:photoId/landmarks/:landmarkId` | editor | |

- **Signed URLs:** file URLs are signed `GET`s on the private bucket. The signing time is rounded down to the hour and they're valid for two hours, so the same file keeps the same URL for an hour and the browser cache works.

## Sharing

The same routes exist for maps and trips: `:resource` is `maps` or `trips`. A trip's "owner" is the owner of its map.

| Method and path | Role | Body / returns |
| --- | --- | --- |
| `GET /:resource/:id/sharing` | owner (a trip's map owner) | `{ linkAccess, shareCode, shareUrl, members: [{ userId, name, email, role }], invites: [{ id, email, role, expiresAt }] }` |
| `PATCH /:resource/:id/sharing` | owner | `{ linkAccess }` → the same as `GET` |
| `POST /:resource/:id/sharing/reset-link` | owner | → `{ shareCode, shareUrl }`. Old links stop working. |
| `POST /:resource/:id/members` | owner | `{ email, role }`. An existing user is added and emailed → 201 `{ member }`. Anyone else gets a `ShareInvite` (token emailed, 14 days; replaces an earlier pending one for that address) → 201 `{ invite }`. Your own address → 400. |
| `PATCH /:resource/:id/members/:userId` | owner | `{ role }` → `{ member }` |
| `DELETE /:resource/:id/members/:userId` | owner, or the member themselves (leaving) | |
| `DELETE /:resource/:id/invites/:inviteId` | owner | |
| `POST /invites/accept` | signed in | `{ token }` → `{ resource: 'map'|'trip', id }`. A bad, used or expired token → 400. The invite's address must be the user's **verified** email, else 403. Never lowers a role the user already has. Rate limited like share codes. |
| `GET /shared/:code` | anyone | Normalises the code (upper case, no dashes or spaces). A map → `{ resource: 'map', id, role, map, trips }` (`map` as `GET /maps/:id`, `trips` as `GET /maps/:id/trips`). A trip → `{ resource: 'trip', id, role, trip }` (as `GET /trips/:id`). `role` is the caller's: `VIEWER` for link visitors, while a signed-in member keeps their own. 404 when the code is unknown, or the link is off and the caller isn't a member. Rate limited per IP. |
| `GET /shared/:code/photos?country=&tripId=&cursor=&limit=` | anyone with the code | Like the map or trip photo list, with the same `role` rules |
| `GET /shared/:code/photos/:photoId` | anyone with the code | One photo of that map or trip, as `GET /photos/:photoId` (how a link visitor opens a photo) |

- **Pending invites are accepted automatically** too: as soon as an account verifies the invited address, or signs up already verified.

- **Share codes:** 12 characters from `23456789ABCDEFGHJKMNPQRSTVWXYZ`, shown as `XXXX-XXXX-XXXX`, stored without dashes.
- **Share URL:** `https://<site>/shared/<code>`.
- **Invite tokens:** 32 random bytes, base64url. Only their SHA-256 hash is stored.

## Rate limits

Shared, database-backed counters (`RateLimit` table, from NextDummy), keyed per IP:

| What | Limit |
| --- | --- |
| Opening a share link (`GET /shared/:code`) | 30 per 15 min |
| Browsing an open link (`/shared/:code/photos…`) | 300 per 15 min (separate counter) |
| Invite accepts | 30 per 15 min (separate counter) |
| Photo presigns | 120 per 15 min |
| Member invites (`POST …/members`) | 20 per hour |

- Over the limit → 429 `{ status, message }` with `Retry-After`.
- Everything else keeps the template's limiters.
- Finished windows are removed by the daily clean-up cron.

# My Planet View API

The contract between the client and the server for the travel features. The template's own endpoints (auth, users, events, contact, media) keep their existing shapes, with the checks listed under "Accounts" and "Generic uploads and the contact form". Keep this file in step with the code.

All paths are under `/api`. Responses use the template's envelope: `{ status, data }` on success, `{ status, message }` on error. The client reads errors through `error.friendlyMessage`. Dates are ISO strings; date-only fields are `YYYY-MM-DD`.

- **Bodies are JSON only.** There is no urlencoded parser, so a plain HTML form can't post anything the API reads.
- **Cross-site writes are refused** (`middleware/originCheck.js`, before every route, better-auth's included). A `POST`, `PUT`, `PATCH` or `DELETE` gets 403 `{ status: 'fail', message }` when its `Origin` isn't one of `FRONTEND_ORIGIN`, or, with no `Origin`, when `Sec-Fetch-Site` is `cross-site`. Requests with neither header (curl, server-to-server tools, tests) pass, as do all reads.

## Access

| Role | How you get it | What it allows |
| --- | --- | --- |
| `OWNER` | You own the map (`TravelMap.ownerId`) | Everything, plus sharing settings, members, renaming, group type, making it the main map, transferring it, deleting the map. The map has the owner's plan (see "Map limits"). |
| `CO_OWNER` | Added to a map as co-owner, as one of its travellers (see "Co-owners") | Everything the owner can do on that map except deleting it, transferring it, making it the main map, paying for it and removing or demoting a co-owner. Maps only |
| `EDITOR` | Added to the map, or to a trip, as editor | Add and change content: visits, trips, stops, travellers, photos, landmark matches |
| `VIEWER` | Added as viewer, or opening a share code with "Anyone with the link" on | Read only. Never sees hidden photos, GPS coordinates or originals |

- **Map role:** owner, else the `MapMember` row, else none.
- **Trip role:** the higher of the map role and the trip's own `TripMember` row. A trip-only member can see and edit that trip and its photos, and nothing else on the map.
- **Trip-only editors** (a `TripMember` `EDITOR` with no editor role on the map):
  - they edit the trip's own content: its details, stops and travellers, completing it, and its photos (uploading into it included);
  - the visits that follow still go on the map, with their source: `TRIP` for a completed trip's stops, `PHOTO` for a photo's country. The owner gave edit rights, and the source shows where each came from. They can't mark a country by hand (they have no role on the map);
  - **deleting the trip** needs an `EDITOR` role on the map, or owning it: anyone else gets 403. The trip's `canDelete` says which (`canDeleteTrip` in `access.js`);
  - moving a photo to another trip, or off this one, also needs the map (403);
  - they add, change and delete the moments on their trip (see "Moments"), and moving one off it also needs the map (403).
- **A verified email address** is needed to add or change content, whatever the role (`requireVerifiedEmail` in `middleware/auth.js`, on the routes):
  - **needs it:** creating and deleting maps; choosing the main map and transferring a map; visits; trips, their stops and travellers; adding a trip to your map and taking it off; uploading, changing and deleting photos and their landmark matches; adding, changing and deleting moments; every sharing change (link access, reset link, members, invites); avatars (`POST /users/user/upload-or-change-avatar`, and the generic presign for any resource but `contact`); the billing writes (`POST /billing/*`, not the webhook). Accepting an invite already needed it;
  - **doesn't:** reading anything; setting up a map (`PATCH /maps/:mapId`, its travellers), which the welcome page does straight after sign-up; map settings; account changes, the leaving plan included; the contact form;
  - **answer:** 403 `{ status: 'fail', message }` with "Verify your email address to add to your map or share it…", checked before any lookup, so it's the same for every id, real or not, and reveals nothing about other people's maps.
- **Link viewers:** anyone holding a share code whose resource has `ANYONE_WITH_LINK` gets `VIEWER`, signed in or not, through `/api/shared/:code` only.
- **No access:** a resource the user has no role on answers **404**, not 403, so ids and codes can't be probed.
- **Not enough access:** a user who can see a resource but lacks the role for an action (a viewer trying to edit, an editor trying to share, a co-owner trying to delete the map) gets **403**.
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

**The UK's nations** are rows with `kind: 'NATION'`: England (`XE`), Scotland (`XC`), Wales (`XW`) and Northern Ireland (`XI`, HMRC's code), from ISO's user-assigned range. They're places only on a map that splits the UK (see "The UK's nations" under Maps).

### Regions

**Regions** (18 Nov 2026) are rows with `kind: 'REGION'`: places that are part of a country but that travellers name on their own. the Azores (`XZ`, Portugal), Bali (`XB`, Indonesia), the Galápagos Islands (`XA`, Ecuador), Goa (`XG`, India), Hawaii (`XH`, the US), New Caledonia (`NC`, France; a country until then), South Georgia and the South Sandwich Islands (`GS`, the UK; drawn as part of the UK until then) and Tasmania (`XT`, Australia). Each one's country is in `server/src/utils/regionPlaces.js` (`REGION_PARENT`; the client copies it):
- **Visits:** a region has its own visit (`PUT …/visits/XB`, with its note and first visit). One marked `VISITED` or `LIVED` also visits its country, as the South Pole does Antarctica (`implied`). Removing it leaves the country.
- **Stats:** a region is never a country, nor a special place, and opens no continent (its country does): `countries`, `GET /maps` counts, badges and goals leave them out; `stats.regions` and the passport's `totals.regions` count them. A region visited or lived in gets its own visa page in the passport.
- **Everything else is the country's:** a photo, video, trip stop, moment or traveller's place sent with a region's code is kept as its country's, and GPS finds the country (a photo in Bali is in Indonesia). Landmarks are the country's too (the Lagoons of New Caledonia are France's).

| Method and path | Returns |
| --- | --- |
| `GET /countries` | `{ countries: [{ code, name, slug, kind, continent, pinX, pinY }] }`. `kind` is `COUNTRY`, `SPECIAL` for the five special places (below), `NATION` for the UK's four nations, or `REGION` for the six regions (above); `continent` is null for the North Pole and the magnetic poles. |
| `GET /landmarks?country=JP` | `{ landmarks: [{ id, name, slug, countryCode, latitude, longitude, pinX, pinY, matchRadiusM, isUnesco }] }`. `country` is optional. 1,332 in all (16 Nov 2026): the 177 of `landmarks.js` and the 1,155 UNESCO World Heritage Sites of `landmarksUnesco.js`; `isUnesco` marks all 1,273 World Heritage Sites. A UK landmark (`countryCode: 'GB'`) also has `nation` (`XE`, `XC`, `XW` or `XI`, from its position), for maps that split the UK. |

- **Caching:** both send `Cache-Control: public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400` and `Vary: Origin`. Browsers keep them an hour; Vercel's CDN keeps one copy per origin (each carries that origin's CORS header) and strips `s-maxage` before the browser sees it. A 400 isn't cached.

## Maps

| Method and path | Role | Body / returns |
| --- | --- | --- |
| `GET /maps` | signed in | `{ maps: [{ id, name, groupType, isDefault, role, ownerName, counts: { countries, photos, trips }, locked, graceUntil }] }`: maps you own, then maps shared with you. `locked` and `graceUntil` are on the maps you own only (see "Map limits"). `trips` counts the group trips added to the map too, as the stats do (see "Group trips"). |
| `POST /maps` | signed in | `{ name, groupType, travellers: [{ name, birthCountryCode?, favouriteCountryCode? }] }` → `{ map }`. Needs a free map slot, else **402** `{ status: 'fail', message }`, e.g. `Your plan includes 1 map, and every extra map you've paid for is in use. An extra map costs £3.99 a month or £39 a year.` (the owner's plan's price; £5.99 and £59 on First Class). The body is checked first (400), then the slot. 20 new maps a day per user (429 after). |
| `GET /maps/:mapId` | viewer | `{ map: { id, name, groupType, isDefault, splitUk, role, ownerName, travellers: [{ id, name, position, birthCountryCode, favouriteCountryCode, userId (editors only) }], visits: [{ countryCode, status, source, firstVisitedOn, notes }], stats, momentCountsByCountry, stampedLandmarkIds, plan, locked, graceUntil, photoCounts, uploadRules } }`. The last five are for the owner and editors only (below); viewers, and everyone through a share link, never get them. `momentCountsByCountry: { [countryCode]: n }` is everyone's: the map's moments per country (see "Moments"), hidden ones counted for the owner and editors only; countries with none are left out. `stampedLandmarkIds` is everyone's too: the landmarks stamped in the map's passport (a confirmed photo of each; see "Passport"), from the same read as `stats.landmarks`, so hidden photos' stamps only for the owner and editors. The map draws their pins in gold. |
| `PATCH /maps/:mapId` | owner | `{ name?, groupType?, splitUk? }` → `{ map }`. `splitUk` (true or false, else 400 `splitUk must be true or false.`) shows the UK as its four nations, and changing it moves the map's UK data (see "The UK's nations"). |
| `DELETE /maps/:mapId` | owner | Refused (409) for the default map. Deletes the map's rows, then its photos' files, up to 1,000 per DeleteObjects request; a file that can't be deleted is left for the daily clean-up. |
| `GET /maps/:mapId/stats` | viewer | `{ stats: { countries, specialPlaces, regions, continents, photos, landmarks, trips, byTraveller: [{ travellerId, name, countries }] } }`. `countries` (and each traveller's) counts countries only; `specialPlaces` counts Antarctica and the poles; `regions` the regions (see "Regions"). `trips` counts the map's own trips and the group trips added to it; `byTraveller` comes from the map's own completed trips only. |
| `POST /maps/:mapId/main` | owner | Makes this map the default (included) one; the old default becomes an ordinary map (see "Map limits"). One transaction. Already the default → nothing changes. → `{ map }` |
| `POST /maps/:mapId/transfer` | owner | See "Transferring a map". |

- **The default map** is created by a better-auth `user.create.after` hook: "My map", `SOLO`, with one traveller named after the user. Onboarding then edits it with `PATCH` and the traveller routes. `GET /maps` also creates it if it's somehow missing (or was handed to someone else). There's never more than one: the database refuses a second (`TravelMap.defaultForOwnerId` is unique), and a request that loses that race uses the one that won. The default map needs no free slot.
- **Plan fields on `GET /maps/:mapId`** (owner and editors; also on the other map routes that answer `{ map }`):
  - `plan: { id, name, photosPerCountry, keepsOriginals, videos, storageCapBytes }`: the **owner's** plan, whoever is looking (`name` is `Economy`, `Business` or `First Class`; `storageCapBytes` is null on Economy);
  - `locked` (boolean) and `graceUntil` (a date or null): see "Map limits";
  - `photoCounts: { [countryCode]: n }`: the map's photos per country, hidden ones included (they count towards the cap); countries with none are left out;
  - `uploadRules: { keepsOriginals, photosPerCountry, locked }`: what an uploader needs, the same shape as on `GET /trips/:tripId`.
- **Visited countries** in stats count `VISITED` and `LIVED`, not `WANT_TO_GO`.

### The UK's nations

A map can show and keep the UK as England, Scotland, Wales and Northern Ireland (`splitUk`, the owner's choice: on `PATCH /maps/:mapId`, and the welcome page's set-up; on for every new map since 18 Nov 2026, while maps made before keep theirs). Everyone on the map sees it the same way; it's on `GET /maps/:mapId`, the share link's map, the trip replies (`splitUk` of the trip's map) and "Your data". The rules are `server/src/utils/ukNations.js` (the client copies them in `utils/map/ukNations.js`).

- **Places:** on a split map, visits, photos, videos, trip stops and moments take the nations; on a map that doesn't split the UK, a nation sent for any of them is kept as the UK (`GB`), and `PUT …/visits/XE` there is 404. Travellers' birth and favourite places are always countries: a nation is kept as the UK. On a split map `GB` itself means "in the UK, nation not chosen yet".
- **GPS:** a photo whose position is in the UK goes to the nation it's in (Natural Earth's real outlines, `src/data/ukNations.json`; the nearest one for a position just offshore). The UK's crown dependencies, which the map folds into the UK, go to the nearest nation if it's within half a degree (the Isle of Man); further than that from every nation (the Channel Islands, South Georgia: a region the lookup folds into the UK), a position stays `GB`, "nation not chosen" (19 Nov 2026, the audit: South Georgia went to England).
- **Counting:** each nation is a country (stats, `GET /maps` counts, badges, goals, each traveller's countries). The UK counts only while none of its nations is marked. The British Isles region (badge and goal) is the four nations and Ireland (5 places, not 2). A goal listing `GB` is met by any nation, and on a map that doesn't split the UK, one listing a nation is met by the UK.
- **Landmarks:** a UK landmark is in its nation on a split map (its `nation`): the country's landmark list, a moment's landmark check, the passport's pages.
- **Turning it on** (one transaction): each UK photo, stop (on the map's own trips) and moment goes to the nation it had when the split was last turned off, else its GPS nation (photos) or its pin's nation (a moment with a spot; 19 Nov 2026), else its landmark's (a confirmed match, a stop's or moment's landmark); anything else stays `GB`. The nations get the `PHOTO` and `TRIP` visits their photos and completed trips bring, and each UK state marked visited or lived brings its nation (`MANUAL`, as marking it on a split map does; 19 Nov 2026), and their own visits from before come back if the UK's visit is unchanged since. The UK's own visit goes when the nations say all it said (it came from located photos or stops, has no note, and nothing is left in the UK); one marked by hand stays, and the map asks which nations it means. Photos left in `GB` are listed with `?unplaced=1`.
- **Turning it off:** the nations' visits become one UK visit (the highest status, the earliest first visit, the UK's note or else theirs, each named), kept so turning it on again restores them; photos, stops and moments go back to `GB`, each remembering its nation (`ukNation`). Nothing is deleted. A nation's photos join the UK's gallery, and may then be over the UK's photo cap (no new UK photos until it's under).
- **Group trips** keep the trip's own map's places; on a linked map, its stops' visits are marked as that map keeps places.

### Travellers

| Method and path | Role | Body |
| --- | --- | --- |
| `POST /maps/:mapId/travellers` | editor | `{ name, birthCountryCode?, favouriteCountryCode?, position? }` → `{ traveller }`. Only while the map's kind has room (17 Nov 2026): `SOLO` one traveller, `COUPLE` two, `FAMILY` up to 20; else **409** `A couple's map has two travellers. Choose "A family" to add more.` (or the `SOLO` wording). `POST /maps` refuses more travellers than its kind has (400), and `PATCH /maps/:mapId` refuses a `groupType` with room for fewer than the map has (409 `"A couple" is for two travellers: remove the others first.`). |
| `PATCH /maps/:mapId/travellers/:travellerId` | editor | same fields, all optional |
| `DELETE /maps/:mapId/travellers/:travellerId` | editor | 409 if it's the map's last traveller |

**Born there is been there** (17 Nov 2026): a traveller's new or changed `birthCountryCode` (on `POST /maps`, `POST …/travellers` and `PATCH …/travellers/:travellerId`) marks that country `VISITED` on the map, source `MANUAL`, as a photo marks one: a visit already there stays as it is, `WANT_TO_GO` becomes `VISITED`, and it's in the map's own places (the UK's mark on a split map). Saving the same birthplace again changes nothing, and a changed one never takes the old country back. So a new account's map starts with the birthplace chosen on the welcome page.

### Countries visited

| Method and path | Role | Body |
| --- | --- | --- |
| `PUT /maps/:mapId/visits/:countryCode` | editor | `{ status, firstVisitedOn?, notes? }`: creates or updates → `{ visit, implied }`. A new visit, or a changed status, gets `source: MANUAL`; saving only `notes` or `firstVisitedOn` keeps the source it had (`TRIP`, `PHOTO`). `implied` lists the other visits this one added or changed, in the same shape: `[]`, or Antarctica's for a South Pole visit (see "Special places") |
| `DELETE /maps/:mapId/visits/:countryCode` | editor | |

- **Notes** (`notes`) are the country's one free-text box: a plan or a reminder ("I want to visit here", "Cherry blossom is in early April"). Something that happened is a moment (see "Moments").
  - **Writing:** text or `null`; anything else → 400 `A country's notes must be text.`. It's cleaned like other text (tags and control characters removed, trimmed) and cut to 1,000 characters (`NOTES_MAX`). Left out of the body, the note stays as it is; `null`, `""` or nothing left after cleaning clears it.
  - **Any status**, "want to go" included. A completed trip or a photo turning the status into `VISITED` keeps the note; removing the country (`DELETE`) removes it with the row.
  - **Reading:** in `visits` on `GET /maps/:mapId`, for everyone who can see the map, viewers and share links included (and in `PUT`'s `visit` and `implied`).

## Map settings

Each signed-in user's own viewing preferences, stored in `Profile.mapSettings` (JSON). They belong to the person, not the map: everyone sees any map in their own style.

| Method and path | Role | Body / returns |
| --- | --- | --- |
| `GET /users/map-settings` | signed in | `{ mapSettings }`, or `{ mapSettings: null }` if none are saved |
| `PUT /users/map-settings` | signed in | `{ mapSettings }` → `{ mapSettings }` as saved. Creates the `Profile` row if it's missing. |

- **Accepted keys:**
  - `style`: `animated` (the world map), `mono` (that map in black and white: until 19 Nov 2026 the switch `blackAndWhite`, now dropped like any unknown key), `old-map` or `starry` (the night sky, 19 Nov 2026; `jupiter` and `galaxy` were taken out on 16 Nov 2026 and are now refused; a profile that saved one keeps it until the next save, and the client opens it as `animated`);
  - `mapType`: `regular`, or `detailed` (country names and grid lines at every zoom);
  - `landmarkPins`: `zoomed` (from zoom 3), `always`, `stamped` (the default since 18 Nov 2026: only the landmarks stamped in the map's passport) or `off` (17 Nov 2026); any other value is refused;
  - the booleans `showGrid`, `showGridLabels`, `animatedSea`, `sunAndMoon`, `showCountryNames` and `hoverPreview`;
  - from my_planet, the booleans `showVisited` and `showUnvisited` (when off, those countries fade back on the map) and `showUserBanner` (the map's banner at the top);
  - `showAntarctica` (on unless set to `false`): draws Antarctica and the two South Poles, and extends the map down to them. It changes only the view, never visits or stats;
  - `showMoments` (on unless set to `false`): the pinned-note mark beside places with moments. Only the view changes;
  - `showGoalTag` (on unless set to `false`): the luggage tag under the map's title with the nearest unmet goal (see "Badges and goals");
  - `showTips` (on unless set to `false`): the tips the map page opens with, once a visit (17 Nov 2026).
- **Unknown keys** are dropped. A known key with the wrong kind of value is refused (400).
- **The whole object is replaced** on each `PUT`. Send every setting, not just the one that changed.

## Trips

| Method and path | Role | Body / returns |
| --- | --- | --- |
| `GET /maps/:mapId/trips` | viewer | `{ trips: [{ id, mapId, title, status, startDate, endDate, coverThumbUrl, stopCount, photoCount, travellerIds, linked: false, canOpen: true }] }`: the map's own trips and the group trips added to it (see "Group trips", where the linked ones' shape is), latest start first (undated first), then newest. |
| `POST /maps/:mapId/trips` | editor | `{ title, description?, status?, startDate?, endDate?, travellerIds? }` → `{ trip }` |
| `GET /trips/shared-with-me` | signed in | `{ trips: [{ ...summary, role, mapName }] }`: trips you were added to directly (a trip-only member can't list the map). `role` is your trip role, the higher of that membership and your role on the trip's map, and hidden photos count where it's editor |
| `GET /trips/:tripId` | viewer of the trip | `{ trip: { id, mapId, mapName, splitUk, canOpenMap, canDelete, onMyMaps, canAddToMyMap, title, description, status, startDate, endDate, coverPhotoId, coverThumbUrl, role, travellerIds, travellers: [{ id, name }], stops: [{ id, position, countryCode, landmarkId, landmarkName, placeName, arriveOn, leaveOn, notes }], uploadRules } }`. `onMyMaps` and `canAddToMyMap`: see "Group trips". `travellers` are the map's, for showing names. `splitUk`: the trip's map shows the UK as its nations (its stops' places, the trip page's mini map; see "The UK's nations"). `canOpenMap` is whether the caller has a role on the trip's map (false for a trip-only member, so the page doesn't link to a map they can't open). `canDelete` is whether they may delete the trip (the map's owner or an editor of the map; false through a share link). `uploadRules: { keepsOriginals, photosPerCountry, locked }` (the map owner's plan, and whether the map is locked; see "Map limits") is there for anyone who can upload to the trip (trip role `EDITOR` or above, trip-only editors included), on every trip route that answers `{ trip }`; viewers and share links never get it. |
| `GET /trips/:tripId/photos?country=&unplaced=&cursor=&limit=` | viewer of the trip | The trip's photos, same shape as the map photo list (how a trip-only member sees them) |
| `GET /trips/:tripId/moments?country=&cursor=&limit=` | viewer of the trip | The moments on the trip, as the map's list (see "Moments") |
| `POST /trips/:tripId/maps` | anyone on the trip | Add it to one of your maps: see "Group trips" |
| `DELETE /trips/:tripId/maps/:mapId` | who added it, or that map's owner | Take it off that map: see "Group trips" |
| `PATCH /trips/:tripId` | editor | `{ title?, description?, status?, startDate?, endDate?, coverPhotoId? }` |
| `DELETE /trips/:tripId` | editor **of the map**, or its owner | Photos stay on the map (their `tripId` is cleared). A trip-only editor gets 403 `{ message }`. |
| `PUT /trips/:tripId/travellers` | editor | `{ travellerIds }`: the full list, all from the trip's map |
| `POST /trips/:tripId/stops` | editor | `{ countryCode, landmarkId?, placeName?, arriveOn?, leaveOn?, notes? }`, added last |
| `PATCH /trips/:tripId/stops/:stopId` | editor | the same fields |
| `DELETE /trips/:tripId/stops/:stopId` | editor | |
| `PUT /trips/:tripId/stops/order` | editor | `{ stopIds }`: every stop of the trip, once each, in the new order |

- Every change to a trip, its travellers or its stops answers with the whole trip (`{ trip }`, as `GET /trips/:tripId`).
- **`coverPhotoId`** must be a photo on that trip, or `null`.
- **Completed trips:** when a trip is set to `COMPLETED`, each stop's country gets a `CountryVisit` (`VISITED`, `source: TRIP`), on the trip's map and on every map it was added to (see "Group trips"). A `WANT_TO_GO` country becomes `VISITED`; an existing `VISITED` or `LIVED` one is left as it is. The same applies to stops added to, or changed on, a trip that's already completed. The change and its visits are saved in one transaction.

## Group trips

A trip shared between people's accounts: the organiser's trip, on the organiser's map, with people added through the trip's members and invites (up to 20, see "Sharing"). Anyone on it can **add it to a map of their own** ("Add to my map"). Nothing is copied: the trip, its stops and its photos stay on the organiser's map, and its photos use that map's allowance. Stored as `TripMap` (trip, map, who added it, when).

| Method and path | Role | Body / returns |
| --- | --- | --- |
| `POST /trips/:tripId/maps` | any role on the trip (a trip member of either role, or any role on the trip's map), **verified** | `{ mapId }`: a map you own or edit. → **201** `{ trip }` (as `GET /trips/:tripId`), or **200** with the same when it's already there (nothing changes). The trip's own map → 400 `This trip is already on its own map.`; no `mapId`, or not an id → 400 `Choose one of your maps to add the trip to.`; a map you can't see → 404; one you only view → 403; not on the trip → 404. A **completed** trip's stops' countries are marked on that map at once (`TRIP` visits; the South Pole brings Antarctica), in the same transaction. |
| `DELETE /trips/:tripId/maps/:mapId` | whoever added it, or that map's owner, **verified** | → `{ message }`. The visits it marked stay. No such link, or a caller who can see neither the trip nor that map → 404; anyone else (another editor of the map, someone else on the trip) → 403 `Only the person who added the trip, or the map's owner, can take it off the map.`. The map's owner can take it off without being on the trip. |

- **On the trip** (`GET /trips/:tripId` and every trip route answering `{ trip }`):
  - `onMyMaps: [{ mapId, name, canRemove }]`: the caller's maps (owned or edited) showing the trip, first added first; `canRemove` is whether they may take it off (they added it, or own that map);
  - `canAddToMyMap`: whether the caller owns or edits a map other than the trip's own (a map already showing it counts; `onMyMaps` says which);
  - through a share link, `onMyMaps` is `[]` and `canAddToMyMap` false.
- **On the map** (`GET /maps/:mapId/trips`, and a map's share link): the map's own trips have `linked: false, canOpen: true`. A trip added from another map is in the same list:
  - for someone with a role on the trip itself: the usual summary (counts as that trip role sees them) plus `linked: true`, `organiserMapName`, `canOpen: true` and `countryCodes` (its stops' countries, in stop order, each once);
  - for anyone else (the map's owner, editors and viewers who aren't on the trip), only `{ id, title, status, startDate, endDate, countryCodes, linked: true, organiserMapName, canOpen: false }`: no cover, no photo or stop counts, no travellers, no map id. `GET /trips/:tripId` stays 404 for them;
  - **through a share link**, linked trips always have these limited fields, with `canOpen: false`, whoever opens it.
- **Photos** of a linked trip never appear in this map's galleries, photo lists or photo counts; they're the organiser's map's.
- **Stats:** a linked trip counts towards the map's `trips` (and `counts.trips` on `GET /maps`). Per-traveller stats don't change: they come from the map's own trips and travellers.
- **Visits:** completing the trip, or adding or changing a stop on a completed trip, marks the countries on the trip's own map and on every map it was added to, in the same transaction (see "Trips"). Taking the trip off a map, leaving it or deleting it never takes a visit back.
- **Leaving the trip** (`DELETE /trips/:tripId/members/:userId`, by the member or the owner) also takes the trip off every map that person added it to, in the same transaction. **Leaving the trip's map** (`DELETE /maps/:mapId/members/:userId`) takes off the links that person added for that map's trips too, unless they're on the trip itself as a member (17 Nov 2026); the visits already marked stay.
- **Deleting the trip, or the map** it was added to, removes the link. A deleted account's links stay, with no one as their adder (the map's owner can take them off).
- **Events:** `trips`, `Map Link Success` and `Map Unlink Success`, with the trip id and `map=<id>`.

## Photos

### Uploading

1. **In the browser** (see `docs/SITE-DESIGN.md`):
   - read `takenAt`, `latitude` and `longitude` from EXIF;
   - make `THUMB` (~400 px) and `DISPLAY` (~1600 px) JPEG or WebP copies;
   - on a map whose owner's plan keeps originals (`uploadRules.keepsOriginals`), keep the original file; on an Economy map, make a `PRINT` copy instead (~2,400 px JPEG, location removed) and never upload the original.
2. **`POST /maps/:mapId/photos/presign`** (editor, or trip editor with `tripId`)
   - Body: `{ tripId?, countryCode?, files: [{ size: 'THUMB'|'DISPLAY'|'ORIGINAL'|'PRINT', contentType, bytes }] }`. `THUMB` and `DISPLAY` are required. `bytes` is the file's exact size: a missing or non-whole value → 400, over the cap → 413.
   - **Locked map** (see "Map limits") → 403 `This map isn't paid for, so it can't take new photos. Its owner can pay for it as an extra map, or make it their main map.`, before anything else is checked.
   - **The best copy follows the map owner's plan:** Business and First Class take an `ORIGINAL` (optional) and refuse `PRINT` (400 `This map keeps the original, so it needs no print copy.`); Economy needs a `PRINT` (400 without it) and refuses `ORIGINAL` (400 `Economy keeps a print-quality copy, not the original.`).
   - **`countryCode`** (optional) is the country the uploader expects. When that country is already full on the map → 409 `30 of 30 photos of France on this map. Upgrade to add more.` (the real numbers and name; no "Upgrade" sentence on First Class), so nothing is uploaded. An unknown code → 400. Confirm checks again with the final country.
   - Returns `{ photoId, uploads: [{ size, key, url, method: 'PUT', headers: { 'Content-Type' }, bytes, expiresIn }] }`.
   - Each upload URL lasts 10 minutes and signs the `Content-Type` and the `Content-Length` (`X-Amz-SignedHeaders=content-length;content-type;host`). The `PUT` must send exactly that type and a body of exactly `bytes` bytes, or R2 refuses it (403).
   - Files go to the **private** bucket at `<BucketNamespace>/photos/<mapId>/<photoId>/<size>-<random>.<ext>` (`<size>` is `thumb`, `display`, `original` or `print`).
   - Types: `image/jpeg`, `image/webp` or `image/png` for `THUMB`, `DISPLAY` and `ORIGINAL`; `PRINT` is `image/jpeg` only (print shops). No HEIC (SITE-DESIGN.md, "Why three files per photo").
   - Size caps (in `mediaConstants.js`): `THUMB` 1 MB, `DISPLAY` 5 MB, `ORIGINAL` 50 MB, `PRINT` 5 MB.
   - **Unfinished uploads:** a user may have at most 60 files presigned and not yet saved, counted over the last 24 hours (`UNCONFIRMED_UPLOAD_LIMIT.photo`). A presign that would go over → 429 `{ message: 'Too many unfinished uploads. Please try again later.' }`. Saving a photo frees its files from the count.
   - Rate limited.
3. **The browser `PUT`s each file** to its URL.
4. **`POST /maps/:mapId/photos`**
   - Body: `{ photoId, tripId?, caption?, takenAt?, latitude?, longitude?, countryCode?, width, height, variants: [{ size, key, width, height }] }`.
     - `width` and `height` are the original's.
     - `countryCode` is the uploader's chosen country. It's used when there's no GPS, or when the GPS position isn't in any country (a photo taken at sea); a country found from GPS always wins. A photo left with no country is listed by `?unplaced=1`.
   - The plan rules are checked again (the owner's plan may have changed since the presign): a locked map → 403 (the upload's files are deleted), and the sizes for the plan → 400 as at presign.
   - The server checks each key belongs to this map and photo and was presigned for this user within the last 50 minutes, and checks its real size and type in R2 (HEAD). If any check fails, every file of that upload is deleted and nothing is saved (400, or 413 when too large; too late → 400 `This upload took too long to finish. Please try again.`).
   - It then creates the `MediaItem`s, the `Photo` and its `PhotoVariant`s in one transaction. That transaction first locks the map's row and checks the caps, so two uploads at once can't both take the last place:
     - **photos per country** with the final country (after the GPS lookup): full → 409 `30 of 30 photos of France on this map. Upgrade to add more.`;
     - **storage safety net** (Business and First Class): the map's stored photo files plus this upload over the plan's `storageCapBytes` → 409 `This map has used its 50 GB of photo storage. Delete some photos to add more.`.

     Either way the upload's files are deleted and nothing is saved.
   - With GPS, it sets `countryCode` (Robinson projection + point-in-polygon against the map's own shapes, `server/src/data/countryShapes.json`). It also adds `CountryVisit (VISITED, source PHOTO)` if missing (or turns a `WANT_TO_GO` one into `VISITED`; the same applies to the `countryCode` chosen for a photo without GPS), and suggests landmarks within their `matchRadiusM` (`PhotoLandmark`, `source GPS`, `confirmed false`).
   - Returns `{ photo }` (the same shape as `GET /photos/:photoId`). 409 if that `photoId` was already saved.
   - **Unfinished uploads:** photo files presigned but never saved are deleted by the daily clean-up once they're an hour old (a photo can't be saved after 50 minutes, so none is deleted while it's being saved).

### Reading and changing

| Method and path | Role | Body / returns |
| --- | --- | --- |
| `GET /maps/:mapId/photos?country=&unplaced=&tripId=&landmark=&cursor=&limit=&order=&seed=&display=` | viewer | `{ photos: [{ id, caption, takenAt, countryCode, tripId, width, height, thumbUrl, displayUrl (with `display=1`), landmarks: [{ id, name, confirmed }], hidden (editors only) }], nextCursor }`. `order` and `display` are the slideshows' (see "Slideshows"); `best=1` (editors only) is "Print or download"'s (see "Downloads"). In the gallery's order (see `POST /photos/:photoId/move`): with `tripId`, or on a trip's list, the trip's order; with `country` or `unplaced`, that gallery's order; with neither, the whole map newest upload first (the hover postcards). A new photo goes first everywhere. `limit` 1–60 (default 30). `unplaced=1` lists only the photos with no country (no location and none chosen, or a location at sea), so they can be found and placed; it can't be combined with `country` (400). `landmark=<id>` lists only the photos confirmed as that landmark, whichever country they're in (a photo taken across a border), oldest taken first (the passport's stamp photo picker); an id that isn't a uuid → 400, a landmark with no photos gives an empty list. Viewers never get `hidden` photos, and see confirmed landmarks only. |
| `GET /photos/:photoId` | viewer | `{ photo: { ..., displayUrl } }`. Editors also get `originalUrl`, `bestCopy`, `latitude`, `longitude`, and every landmark match with its `source` and `distanceM`. `originalUrl` is the best copy kept: the `ORIGINAL` (Business and First Class), else the `PRINT` copy (Economy); `bestCopy` says which (`'ORIGINAL'`, `'PRINT'`, or null with `originalUrl` null for an old photo saved with neither). |
| `PATCH /photos/:photoId` | editor | `{ caption?, countryCode?, tripId?, takenAt?, hidden? }`. Moving a photo between trips (`tripId`) needs editor on the map, not just the trip. A new `countryCode` marks that country visited (`source: PHOTO`), in the same transaction. Moving it to a country that's full on the map (the owner's plan) → 409 `30 of 30 photos of France on this map. Upgrade to add more.` and nothing changes. A photo that lands in another gallery (a new country, no country, or a new trip) goes first there; sending its current country again changes nothing. → `{ photo }` |
| `POST /photos/:photoId/move` | editor of that gallery | Rearranging. `{ gallery, afterId }`: `gallery` is `'country'` (the photo's country on its map; the unplaced photos are one gallery) or `'trip'` (its trip; 400 if it has none). The photo goes straight after `afterId` in that gallery, or first when `afterId` is null. A country's gallery needs editor on the map; a trip's needs editor of the trip (a trip-only editor too). Only the photo's own position changes, unless its new neighbours have no room left between them (then the gallery is renumbered, in the same transaction). 400 for a bad gallery or `afterId` (not an id, or the photo itself); 409 if `afterId` isn't in that gallery any more. → `{ message }` |
| `DELETE /photos/:photoId` | editor | Deletes the rows, then the files from R2 (one DeleteObjects request). A file that can't be deleted is left for the daily clean-up. |
| `POST /photos/:photoId/landmarks` | editor | `{ landmarkId }`: a manual match, confirmed → 201 `{ photo }` |
| `PATCH /photos/:photoId/landmarks/:landmarkId` | editor | `{ confirmed: true }` → `{ photo }`. 404 if the photo has no such match. |
| `DELETE /photos/:photoId/landmarks/:landmarkId` | editor | → `{ photo }` (the photo without that match). 404 if the photo has no such match. |

- **Signed URLs:** file URLs are signed `GET`s on the private bucket. The signing time is rounded down to the hour and they're valid for two hours, so the same file keeps the same URL for an hour and the browser cache works.

## Videos

First Class videos (docs/FEATURE-PLAN.md, "Videos (First Class)"), kept in **Cloudflare Stream**, which converts each one so every browser plays it (decided 16 Nov 2026). A video is a `Photo` row with `kind: 'VIDEO'`, `durationS`, its Stream id (`streamUid`), its conversion state (`videoState`: `PROCESSING`, `READY` or `FAILED`) and its size (`videoBytes`); it has no files in R2 (no PhotoVariants). Galleries, order, hidden, country, trip, moments and slideshows treat it as a photo.

| Method and path | Role | Body / returns |
| --- | --- | --- |
| `POST /maps/:mapId/videos/upload` | editor (of the map, or of the trip in `tripId`), **verified** | `{ bytes, contentType, durationS, tripId?, countryCode? }` → `{ photoId, uploadUrl, ticket, expiresAt }`. `uploadUrl` is a Stream **tus** upload (resumable, no credentials) the browser sends the file to; it lasts 6 hours. Stream itself refuses a video over 181 seconds. Rate limited with the photo presigns. |
| `POST /maps/:mapId/videos` | the same person, **verified** | `{ ticket, countryCode?, caption?, takenAt? }` → 201 `{ photo }`: the finished upload, checked with Stream, saved as a video (usually `PROCESSING`). The country cap and the storage safety net are checked in the save's transaction (refused → 409, and the Stream video is deleted). |
| `POST /api/videos/stream-webhook` | Stream only | Stream's notice that a video is ready or failed (raw body; `Webhook-Signature: time=…,sig1=…`, the HMAC-SHA256 of `<time>.<body>` with `CLOUDFLARE_STREAM_WEBHOOK_SECRET`; older than 5 minutes or wrong → 400; no secret set → 503). The row takes the state, the length and the size. |

- **Rules:** only on a map whose owner is on **First Class** (403 `Videos are part of First Class. Upgrade this map’s owner to add them.`); `contentType` `video/mp4` or `video/quicktime`, `bytes` up to 500 MB (413 above), `durationS` 1–180 (400 `A video can be up to 3 minutes long.`); **20 videos per country** on each map, apart from the photo cap (409 `20 of 20 videos of Iceland on this map.`); videos count towards the storage safety net by their size, not towards the photo cap. A locked map → 403. Without Stream's settings (the `CLOUDFLARE_*` keys) both routes answer **503** `Videos aren’t set up yet.`
- **The ticket** is signed by the server (HMAC with `BETTER_AUTH_SECRET`) and names the video, the map, the trip, the person and the photo id: saving with someone else's ticket, another map's, a changed one or an expired one → 400 `That upload has expired or wasn’t started here. Start it again.`; an upload Stream hasn't received yet → 400 `The video hasn’t finished uploading yet.`; one Stream couldn't read → 400 (deleted); saving twice → 409.
- **No position:** a video keeps no latitude or longitude (CHECK `photo_video_no_location`); the uploader chooses its country, and no landmark is suggested. The browser also overwrites the file's location metadata before upload (the `©xyz` atom and QuickTime's location key), and Stream's converted copies keep no metadata, GPS tracks included.
- **Converting:** a video is `PROCESSING` until Stream's notice says `READY` (or `FAILED`). When an editor opens one still processing, the server asks Stream too, so it catches up without the webhook. The app asks again by itself while one is on screen (a gallery after 5, 10, 20 and then every 30 seconds, for up to 20 minutes; the viewer every 6 seconds) and shows "Preparing…" or "Couldn't prepare" on its tile.
- **The browser's side:** it sends the file to `uploadUrl` with tus-js-client (`client/src/utils/photos/streamUpload.js`), in 50 MB pieces (Stream wants multiples of 256 KiB, at least 5 MB), retrying after a dropped connection from where Stream says it got to. It plays `videoUrl` with the browser's own HLS where it has it (Safari, recent Chrome), else hls.js's light build, loaded only then (`client/src/hooks/useVideoSource.js`).
- **Who sees it:** the owner and editors see every video, with `videoState`; viewers and share links only `READY` ones (a processing one answers 404 and isn't listed).
- **Reading:** list items and `GET /photos/:photoId` carry `kind` and `durationS`. A ready video's `thumbUrl` (400 px) is Stream's thumbnail; its detail, and list items with `display=1`, also carry `displayUrl` (1,080 px) and `videoUrl`, an **HLS** link (`…/manifest/video.m3u8`; Safari plays it natively, other browsers through hls.js). Each link holds a token signed on the server with Stream's signing key (`CLOUDFLARE_STREAM_SIGNING_KEY_*`, an RS256 JWT for that video), valid from the start of the hour for two hours, like the photo links. Never coordinates, files or the Stream id.
- **Deleting** a video deletes its row, then the Stream video (a failure is left for the daily clean-up). The daily clean-up deletes any Stream video older than 6 hours that no row points at (an upload never saved, a video deleted with its map or account).
- **Not in the passport:** a video can't be matched to a landmark (400 `Landmark stamps come from photos, not videos.`), and stamps count photos only. The photo upload refuses `kind: 'VIDEO'` (400).
- **Map fields:** `uploadRules.videos` is `{ perCountry, maxSeconds, maxBytes, contentTypes }` on a First Class map and null on the others; owners and editors also get `videoCounts` beside `photoCounts` (photos only).
- **The database** holds the shape too: CHECK `photo_video_duration` (a video has a length of 1–600 s, a photo none) and `photo_video_stream` (a video has its Stream id, state and size, a photo none).
- **Setting up** (the user): an API token with Stream: Edit, the account id and customer code, then `node src/services/stream/createSigningKey.js` and `node src/services/stream/setWebhook.js <https address>` (each prints the env values to set).

## Downloads

"Print or download" (docs/FEATURE-PLAN.md, "Printing", version 1): a map's or a trip's editors download its photos' best copies as a zip **made in the browser**, then follow a print partner's link. The server only lists the files; each one comes straight from R2 by its signed link, so Vercel moves no bytes.

| Method and path | Role | Returns |
| --- | --- | --- |
| `GET /maps/:mapId/photos?best=1&country=&unplaced=&tripId=&cursor=&limit=` | editor | The usual list (any filter and `order`), where each item also has `best: { copy, url, contentType, bytes, width, height }`: the best copy kept (`copy` is `ORIGINAL`, else an Economy map's `PRINT`), signed like every photo link. `best` is null for a video (Stream keeps no original to hand back) and for an old photo saved with neither. `bytes` is the stored size, or null when it wasn't recorded. No `displayUrl` (`display=1` is ignored). `limit` 1–200 (default 30). Hidden photos are included (editors see them). |
| `GET /trips/:tripId/photos?best=1&cursor=&limit=` | trip editor | The same for a trip's photos: a trip-only editor too. |

- **Who:** editors only, since the best copy is the original (with its location) or the print copy. A viewer gets 403, someone with no role 404 (as every map route). **Never through a share link:** `GET /shared/:code/photos?best=1` is 403 whoever opens it, the map's own editors included. `best` other than `1`, `true`, `0` or `false` is 400.
- **The zip** (`client/src/utils/photos/photoDownload.js`, `zipDownload.js`, with `client-zip`): files are stored, not compressed. Each is named `<day taken> <caption>.<ext>` (`2019-04-12 Evening by the Seine.jpg`, or `Photo.jpg` with neither; `(2)` when two would share a name), in a folder per country for the whole map (`France/…`, `No country/…`). In Chrome and Edge on a computer (`showSaveFilePicker`) the zip streams to the file chosen, at any size; elsewhere the browser holds it in memory until it's saved, so a download over 500 MB comes as parts (`… (part 2 of 3).zip`), each its own button. A page of the list older than 45 minutes is listed again before its files are fetched (the links last at least an hour), and a file that fails is tried once more with a fresh link, then left out and named.
- **R2 CORS** must allow `GET` from the site's origin, as `setPrivateBucketCors.js` sets it: the browser reads each file with `fetch()`, not an `<img>`. CSP `connect-src` needs the photo host too (it has it for the uploads' `PUT`).
- **Print partners** are travel offers (see "Travel offers") of kind `PRINTS` in placement `PRINT`: the dialog shows up to two under the download, heaviest first, each a link through `/go/` with `p=PRINT`. Without one it says any photo printer takes the files.

## Moments

Life events and notes on a map: "We had our baby in Paris", "Got engaged at the Eiffel Tower", "We saw a volcano". A moment is in a country (or a special place), optionally at a seeded landmark or a named place, usually dated, about some of the map's travellers, with some of the map's photos (nothing is uploaded, so moments cost no storage), and optionally on one of the map's trips. Called a moment, not an event, because events are the app's log. A country's note is something else (see "Countries visited").

| Method and path | Role | Body / returns |
| --- | --- | --- |
| `GET /maps/:mapId/moments?country=&tripId=&cursor=&limit=` | viewer | `{ moments: [moment], nextCursor }`, in date order, oldest first, undated last (then by id). `country` and `tripId` filter (an unknown country, or a `tripId` that isn't an id → 400). `limit` 1–60 (default 30). `nextCursor` is null on the last page; pass it back as `cursor` (opaque: `<YYYY-MM-DD or undated>_<id>`, so it still works if that moment was deleted meanwhile; anything else → 400). |
| `POST /maps/:mapId/moments` | editor of the map, or editor of the trip given in `tripId`; **verified** | `{ kind, title, text?, happenedOn?, datePrecision?, countryCode, landmarkId?, placeName?, spot?, tripId?, hidden?, travellerIds?, photoIds? }` → 201 `{ moment }` |
| `PATCH /moments/:momentId` | editor of the moment, **verified** | The same fields, all optional (`travellerIds` and `photoIds` replace the lists) → `{ moment }` |
| `DELETE /moments/:momentId` | editor of the moment, **verified** | → `{ message }` |
| `GET /trips/:tripId/moments?country=&cursor=&limit=` | viewer of the trip | The moments on that trip, as the map's list (how a trip-only member sees them) |
| `GET /shared/:code/moments?country=&tripId=&cursor=&limit=` | anyone with the code | A map's moments, or a trip's (with only that trip's photos), with the share link's `role` (see "Sharing"). Rate limited like the share-link photo list. |

**A moment** (`moment`): `{ id, kind, title, text, happenedOn, datePrecision, countryCode, landmark: { id, name } | null, placeName, spot, tripId, travellerIds, photos: [{ id, thumbUrl }], hidden (editors only), createdAt }`. No coordinates but the moment's own pin (`spot`, below): a landmark is its id and name, and a photo its thumbnail.

- **Kinds** (`server/src/utils/constants/momentKinds.js`; stored as text, so a new kind needs no migration): `BORN`, `MOVED_HERE`, `WEDDING`, `ENGAGEMENT`, `GRADUATED`, `NEW_JOB`, `MET_SOMEONE`, `CELEBRATION`, `SAW_OR_DID` ("something we saw or did"). Anything else → 400 `Choose what kind of moment it is from the list.`.
- **Text:** `title` is required, 1–120 characters after cleaning (as captions: tags and control characters removed, trimmed; longer is cut), else 400 `Give the moment a title of 1 to 120 characters.`; `text` (the story) up to 2,000 and `placeName` up to 120, both optional (`null` or `""` clears). A field that isn't text → 400 `A moment's title, story and place name must be text.`.
- **Dates** (`utils/moments.js` `parseMomentDate`): `happenedOn` is a year (`"2019"`), a month (`"2019-06"`) or a day (`"2019-06-14"`), from 1800 to 2200, and must exist as written. `datePrecision` (`DAY`, `MONTH` or `YEAR`) follows the form when left out; it may be coarser than what's written (`"2019-06-14"` with `YEAR`), never finer (`"2019"` with `DAY`). A month or a year is stored, and returned, as its first day (`happenedOn: "2019-01-01", datePrecision: "YEAR"`). Left out on `POST`, or `null`/`""`: an undated note (both null). A precision sent without a date, or anything else → 400 `A moment's date is a year (2019), a month (2019-06) or a day (2019-06-14), …`. The database holds the rule too (a CHECK: both null or both set).
- **Where:** `countryCode` is required (a country or special place; unknown → 400 `That country isn't on the map.`). `landmarkId` must be a landmark in that country (400 `That landmark isn't in the moment's country.`; unknown → 400). Changing the country keeps the landmark only if it's in the new country: send a new `landmarkId`, or `null`, with it.
- **A pin on the map** (`spot`, 16 Nov 2026; `utils/momentSpots.js`): optional, the moment's exact spot, `{ latitude, longitude, shared = false }`, or `null` to take it off (left out: unchanged). Stored to six decimals (`Moment.latitude`/`longitude`/`spotShared`, CHECK `moment_spot`: both or neither, in range, shared only with a spot). It must be in the moment's place: the country (or special place) by the map's outlines, with the coastline tolerance as leeway (a border café the lookup gives the neighbour, a pier), the South Pole counting as Antarctica, and on a map that splits the UK the nation by its real outlines; else 400 `That spot isn't in the moment's country. Move the pin, or take it off.` (out of range or a `shared` that isn't a boolean: 400). Changing the country of a pinned moment needs the pin to fit the new one, or a new `spot` or `null` with it. **Who sees it** (the user's decision, 16 Nov 2026: chosen per pin, off by default): the owner and editors always get `spot: { latitude, longitude, shared }`; viewers and share links get `spot: { latitude, longitude }` only when `shared`, else `spot: null`. No rounding: a pin is shown exactly or not at all. The client sets it from a moment photo's position, the device's location (asked on a press), or a tap on the map, and links it to Google Maps.
- **Travellers:** `travellerIds` must all be the map's (400 `Every traveller must be one of this map's travellers.`).
- **Photos:** `photoIds`, up to 20 distinct photos already on the map, kept in the order sent (400 `Choose up to 20 photos, each from this map.`). A trip-only editor may only choose photos on the moment's trip (400 `You can only choose photos from this trip.`); when they change the list, the moment's photos from elsewhere on the map (which they can't see) stay, after theirs. A deleted photo leaves its moments.
- **Trip:** `tripId` must be one of the map's own trips (not a group trip added from another map). On `POST` it sets whose rules apply (below; a trip not on the map → 404). On `PATCH`, moving a moment to another trip or off its trip needs editor on the map (403 `Only the map's owner and its editors can move a moment to another trip.`); a trip not on the map → 400. A deleted trip leaves its moments, with `tripId` null.
- **Who can do what** (the photo rules; `momentRoleFor`, `canSeeMoment`, `canSeeMomentPhoto` in `access.js`):
  - **the owner and the map's editors** add, change and delete any moment on the map;
  - **a trip-only editor** (or a map viewer who edits the trip) does the same for moments whose `tripId` is their trip: creating one needs that `tripId` (without it → 404, as for a map they can't see), and other moments answer 404;
  - **viewers and share links** read them, never `hidden` ones (as hidden photos: a hidden moment answers 404 to a viewer, and isn't counted for them). Hidden photos inside a moment show only to editors (of the map, or of the trip for the trip's photos). Someone who reaches moments through a trip (its list or its share link) sees only that trip's photos in them.
- **On the map:** `GET /maps/:mapId` has `momentCountsByCountry` (see "Maps") and `momentSpots: [{ id, kind, title, countryCode, latitude, longitude }]` (date order): every pin for the owner and editors, hidden moments' too; for viewers and share links (`GET /shared/:code`) only the shared pins of moments they can see. "Download my data" carries each moment's `spot` with `shared`.
- **Events:** `moments`, `Create Success`, `Update Success` (the names of the fields changed) and `Delete Success`, with the moment's id and `map=<id>`; never a title, story or place.

## Country maps

A country opened on its own (18 Nov 2026; "Open country" on its ticket): its states or provinces, which the map has been to, and its pins, places someone keeps going back to, each with a visit for every time. The states are Natural Earth's 1:10m (public domain), made by `images/src/tools/country-maps.mjs` into the client's maps (`client/src/utils/map/countryMaps/`) and the server's list (`server/src/data/subdivisions.json`; `utils/subdivisions.js`): each code is ISO 3166-2's ("US-CA") where Natural Earth has a clean one, else Natural Earth's own ("NC-X02"). A country's map is its own (a region's is its country's: Bali is on Indonesia's); on a map that splits the UK, each nation has one too (the UK's states in it), and the UK's has them all.

| Method and path | Role | Body / returns |
| --- | --- | --- |
| `GET /maps/:mapId/subdivisions?country=US` | viewer | `{ subdivisions: [{ code, status }] }`: the states marked on that country's map. `country` a country (or a nation on a map that splits the UK; a region's is its country's), else 400 `Only a country has a map of its own.` |
| `PUT /maps/:mapId/subdivisions/:code` | editor | `{ status }` (`VISITED`, `LIVED`, `WANT_TO_GO`) → `{ subdivision: { code, status }, implied }`. An unknown code is 404. |
| `DELETE /maps/:mapId/subdivisions/:code` | editor | Clears it; the country stays. |
| `GET /maps/:mapId/pins?country=US` | viewer | `{ pins: [{ id, name, countryCode, latitude, longitude, visitCount, latestVisit: { visitedOn, datePrecision } | null, hidden? }] }`, by name. |
| `POST /maps/:mapId/pins` | editor | `{ name, notes?, countryCode, latitude, longitude, hidden?, visit?: { visitedOn?, datePrecision?, notes?, photoIds? } }` → 201 `{ pin }`. `hidden` is true unless sent as false: a new pin is the map's editors' own until shared |
| `GET /pins/:pinId` | viewer | `{ pin: { id, name, notes, countryCode, latitude, longitude, hidden?, createdAt, visits: [{ id, visitedOn, datePrecision, notes, photos: [{ id, countryCode, thumbUrl }] }] } }`, visits newest first, undated last |
| `PATCH /pins/:pinId` | editor | `{ name?, notes?, latitude?, longitude?, hidden? }` → `{ pin }` |
| `DELETE /pins/:pinId` | editor | The pin and its visits (never the photos). |
| `POST /pins/:pinId/visits` | editor | `{ visitedOn?, datePrecision?, notes?, photoIds? }` → 201 `{ pin }` |
| `PATCH /pins/:pinId/visits/:visitId` | editor | the same, each field optional; `photoIds` replaces the list → `{ pin }` |
| `DELETE /pins/:pinId/visits/:visitId` | editor | → `{ pin }` |

Through a map's share link: `GET /shared/:code/subdivisions?country=`, `/shared/:code/pins?country=` and `/shared/:code/pins/:pinId`, as a viewer sees them.

- **States** are never countries (no count includes them). One marked visited or lived brings its country as VISITED (missing, or only wanted), and the region it's in (New Caledonia's provinces: NC), in the same transaction: `implied` is those visits as they now are. A state that is a region on its own (Hawaii is US-HI and the region XH; Tasmania, Goa, Bali, the Galápagos, South Georgia) has no visit of its own: its status is the region's `CountryVisit`, so marking either marks both.
- **Pins:** a name (80 characters), notes (2,000), and a position in the pin's country (as a moment's spot, with the coastline tolerance; 400 `That spot isn't in this country. Put the pin inside it.`). A pin is kept under its country for good: a UK pin under GB (a nation's map lists the UK's pins inside it), a region's under its country. 1,000 pins a map, 100 visits a pin (409). `hidden`: editors only, as a hidden photo; viewers get a 404. A pin is an exact spot, so it's hidden until an editor shares it ("Show this pin to everyone the map is shared with", off to start with), as a moment's spot is (19 Nov 2026, the user's decision: a pin on someone's home was public on any shared map). Pins made before then keep the setting they had.
- **Visits:** a date as a moment's (`visitedOn` "2019", "2019-06" or "2019-06-14", with `datePrecision`; empty for none), notes, and up to 50 of the map's own photos, in order (400 `Choose up to 50 photos, each from this map.`). A visit's photo hidden from viewers isn't listed for them. Deleting a photo takes it out of its visits.
- **Events:** `countryMaps`, `State Save Success` and `State Delete Success` (the state's code and status), `Pin …` and `Pin Visit …` with ids only; never a pin's name, notes or position.
- "Download my data" carries each map's `statesVisited` and `pins` (with their visits and photo ids).

## Country lists

Every country ticket's first page of photos and of moments in one reply (19 Nov 2026, the audit): the map page loads them all behind its loading screen, which took a request per list.

| Route | Who | What |
| --- | --- | --- |
| `GET /maps/:mapId/country-lists?photos=FR,IT&moments=FR&limit=12&display=1&momentLimit=30` | viewer | `{ photos: { [code]: { photos, nextCursor } }, moments: { [code]: { moments, nextCursor } } }`: for each code in `photos`, the first page `GET /maps/:mapId/photos?country=<code>&limit=&display=` would give, and for each in `moments`, the first page of `GET /maps/:mapId/moments?country=<code>&limit=<momentLimit>`, built by the same code, so every rule of theirs holds (hidden ones, videos still converting, never GPS or best copies). Either list may be left out; up to 300 codes each. Not a list of two-letter codes, or an unknown country → 400. |
| `GET /shared/:code/country-lists` (same query) | anyone with a map's link | The same, as the link's viewer sees them; one request against the link's browse limit. A trip's link → 404 (its page has no country tickets). |

## Slideshows

The slideshows play a map's photos (worldwide), one country's, or one trip's, through the photo lists above: `GET /maps/:mapId/photos`, `GET /trips/:tripId/photos` and `GET /shared/:code/photos`, with the usual filters, paging and access (viewers never get hidden photos).

| Query | Meaning |
| --- | --- |
| `order=gallery` (the default) | The gallery's order, as above |
| `order=taken` | Oldest taken first, then by id: each photo's `shotAt`, which is its `takenAt`, or when it was uploaded if the file had no date. Changing `takenAt` moves it; clearing it puts it back at its upload time. The whole map's order has its own index (`[mapId, shotAt, id]`). |
| `order=shuffle&seed=N` | A shuffled order fixed by `seed` (1 to 2,147,483,647): the same seed always gives the same order, so a show pages through it with `cursor` like any list. The client picks a new seed for each show. A `cursor` no longer in the list (the photo was deleted or hidden meanwhile) → 400: start the show again. A missing or bad seed → 400. |
| `display=1` | Each photo also carries `displayUrl` (the 1,600 px copy the show plays), signed like the rest. |

Anything else for `order` or `display` → 400.

**Moments in a show** (16 Nov 2026): a show in date order (not a shuffled one) also reads the same source's moments (`GET /maps/:mapId/moments`, `/trips/:tripId/moments` or `/shared/:code/moments`, with `country` for a country's show; up to five pages of 60) and puts each dated one in as a card before the first photo taken on or after its day; the rest come before the end card. Undated moments aren't shown. In the worldwide show a moment in the next country goes after that country's title card, any other before it. The access is the moment routes' own, so viewers never get hidden ones.

## Passport

The landmark book (docs/FEATURE-PLAN.md, "The passport"). A landmark is **stamped** when a photo of it is confirmed on the map (`PhotoLandmark.confirmed`; a manual match is confirmed at once). No photo, no stamp: ticking a country by hand stamps nothing. Each match records its map (`mapId`, a copy of the photo's) and when it was confirmed (`confirmedAt`, null exactly while unconfirmed: CHECK `photo_landmark_confirmed_at`).

| Method and path | Role | Body / returns |
| --- | --- | --- |
| `GET /maps/:mapId/passport` | viewer | `{ passport }` (below) |
| `PUT /maps/:mapId/passport/stamps/:landmarkId/photo` | editor, **verified** | `{ photoId }`: the photo the stamp shows, which must be one of that landmark's confirmed photos on this map (else 400 `Pick a photo of this landmark that's confirmed on this map.`) → `{ cover: { landmarkId, photoId } }` |
| `DELETE /maps/:mapId/passport/stamps/:landmarkId/photo` | editor, **verified** | Back to the earliest photo → `{ message }` |
| `GET /shared/:code/passport` | anyone with a map's code | The same, with the link's role. A trip's code → 404. |

**A passport:** `{ map: { id, name, groupType, ownerName, plan: { id, name } }, travellers: [{ id, name, birthCountryCode, favouriteCountryCode }], pages: [page], totals: { countries, specialPlaces, regions, continents, landmarks, unesco } }`.
- **Pages:** one per country (or special place) marked `VISITED` or `LIVED`, plus any country with a stamp. Each is `{ countryCode, status, enteredOn, stamps: [stamp], toStamp: [{ id, name, isUnesco }] }`, in the order they were first visited: `enteredOn` is the date of the country's earliest photo (when it was taken), else the visit's `firstVisitedOn`, else null (those go last, by when they were marked). `status` is null for a page that has only stamps. `toStamp` lists the country's landmarks not stamped yet, by name (the book's dotted outlines).
- **A stamp:** `{ landmarkId, name, isUnesco, stampedOn, photoCount, photo: { id, thumbUrl }, photoChosen (editors only), moments: [{ id, title, kind, happenedOn, datePrecision }] }`, in the order they were stamped. `moments` are the map's moments at that landmark (see "Moments"), oldest first, undated last; hidden ones only for editors, never through a share link. `stampedOn` is when its earliest confirmed photo was taken. `photo` is the one an editor picked (`LandmarkCover`), else the earliest. A picked photo goes when its match or the photo does (the cover points at the match itself, `ON DELETE CASCADE`).
- **Below editor** (viewers, share links), hidden photos neither stamp nor count: a stamp whose only photos are hidden isn't there, and one whose picked photo is hidden shows its earliest visible photo. `totals` follow the same rule.
- **Totals:** `countries`, `specialPlaces` and `regions` as the map's stats; `continents` counts Antarctica; `landmarks` and `unesco` are the stamps.

## Badges and goals

Counted from the map's own data (visits, photos, stamps); only awards and goals are stored. Badges and goals belong to a map, so a couple or family earns them together. **The owner and editors award** them by loading them: a badge earned since is stored with the date (`BadgeAward`, one per map and key) and listed in `newlyEarned`, and a goal met for the first time gets `achievedAt` and is listed in `newlyAchieved`, so the client can say so once. **Neither is ever taken back** (unmarking a country keeps the badge). Viewers and share links see the stored awards, with progress counted from what they can see, and never award.

| Method and path | Role | Body / returns |
| --- | --- | --- |
| `GET /maps/:mapId/badges` | viewer | `{ badges: [{ key, group, have, need, earnedAt }], newlyEarned: [key], travellers: [{ id, name, badges: [{ key, group, have, need, earned, earnedOn }] }] }`: `travellers` are the map's people with their own travel badges (groups `countries`, `continents`, `special`, `regions`), counted from the completed trips each was on, `earnedOn` the day of the trip that earned it (its `endDate`, else `startDate`; null for an undated trip); worked out on each read, never stored or announced (`utils/badges.js` `travellerBadges`). every badge, earned or not. An earned badge shows `have` = `need`. |
| `GET /maps/:mapId/goals` | viewer | `{ goals: [goal], newlyAchieved: [id] }`, oldest first |
| `POST /maps/:mapId/goals` | editor, **verified** | `{ kind, title?, target?, countryCodes?, region?, deadline? }` → 201 `{ goal }`. A map has at most 50 (409 `A map can have up to 50 goals. Delete one to add another.`). |
| `PATCH /goals/:goalId` | editor of its map, **verified** | The same fields but `kind` (which never changes; sending another → 400) → `{ goal }`. Changing `target`, `countryCodes`, `region` or `deadline` clears `achievedAt`: the goal has to be met again. |
| `DELETE /goals/:goalId` | editor of its map, **verified** | → `{ message }` |
| `GET /shared/:code/badges`, `GET /shared/:code/goals` | anyone with a map's code | As above (a trip's code → 404) |

- **Badges** (`server/src/utils/badges.js`; the client words each `key`): groups `countries` (`countries-1`, `-5`, `-10`, `-25`, `-50`, `-100`, and `countries-all`: every country the map shows, its `need` counted from the country table, 227, or 230 on a map that splits the UK, whose nations count instead of the UK; special places don't count), `continents` (`continent-africa`, `-asia`, `-europe`, `-north-america`, `-oceania`, `-south-america`: a first country there; `continents-all`: all six), `special` (`antarctica`, `north-pole`, `south-pole`), `regions` (`region-<key>`: every country in one of the regions of `utils/constants/regions.js`, e.g. `region-scandinavia`), `landmarks` (`landmarks-1`, `-10`, `-50` stamps; `unesco-5`, `unesco-25`), `photos` (`photos-100`, `photos-1000`) and `themes` (`themes-3`, `-6`, `-12`: monthly photo themes with a photo of the map in; see "Photo themes"). Awarding counts everything on the map, hidden photos included.
- **A goal:** `{ id, kind, title, target, countryCodes, region, deadline, achievedAt, createdAt, progress: { have, need, met, missed, done? } }`. Kinds (CHECK `goal_shape` holds each to its own field):
  - `COUNTRY_COUNT`: `target` countries (1–250), special places not counted;
  - `COUNTRY_LIST`: every place in `countryCodes` (1–100 distinct codes, special places allowed: a bucket list); `progress.done` lists those done;
  - `REGION`: every country in `region`, a key of `utils/constants/regions.js` or an inhabited continent (`EUROPE`…); `progress.done` too;
  - `LANDMARK_COUNT`: `target` stamps (1–2,000).

  `title` is optional (up to 80 characters, cleaned). Without a `deadline`, a country counts when it's marked visited or lived. With one (`"YYYY-MM-DD"`), a country counts when it was reached by the end of that day: its first photo was taken by then, or its visit (visited or lived) is dated by then, by its `firstVisitedOn`, else the day it was marked (19 Nov 2026, the user's decision: a hand-ticked country used never to count, and the goal looked stuck); stamps by their photos. `missed` is true once the day has passed unmet. Anything that doesn't fit the kind → 400 `That goal isn't complete: check what it asks for.`

## Photo themes

One theme a calendar month (UTC), set ahead by an admin (docs/FEATURE-PLAN.md, "Monthly photo themes"). While it runs, a map's editors enter any of the map's photos, from any date; the entries are the theme's **album on that map**, seen by whoever can see the map. There's no public gallery. `PhotoTheme` (one per `month`, stored as its first day: CHECK `photo_theme_first_of_month`; title 1–60 characters: CHECK `photo_theme_title_length`) and `PhotoThemeEntry` (theme × photo, with the photo's `mapId`, who entered it and when; cascades with the theme, the photo and the map). Rules in `server/src/utils/themes.js`.

A theme: `{ id, month: 'YYYY-MM', title, blurb, startsAt, endsAt, running }` (`endsAt` is the first moment of the next month).

| Method and path | Role | Body / returns |
| --- | --- | --- |
| `GET /themes` | anyone | `{ current, recent }`: the theme running now (or null) and up to 12 past ones, newest first. Never a future one (a month's theme is a surprise until it starts). Cached 5 minutes. |
| `GET /maps/:mapId/themes` | viewer | `{ current: { ...theme, count, entriesLeft }, albums: [{ ...theme, count }], entriesPerMap }`: this month's theme with the map's count, and every theme the map has photos in, newest month first. `entriesLeft` (how many more the map may enter) for editors only. Hidden photos count for editors only. |
| `GET /maps/:mapId/themes/:themeId/photos?cursor=&limit=` | viewer | `{ theme, photos, nextCursor }`: the map's album, newest entry first, photo list items (`limit` 1–60, default 30). No hidden photos below editor. |
| `PUT /photos/:photoId/themes/:themeId` | editor of the photo, **verified** | Enters the photo in the theme → 201 `{ themes }` (every theme the photo is in); already in → 200, nothing changes. Only while the theme runs (409 `That theme isn't running: photos can only be entered during its month.`), never a video (400 `Themes are for photos, not videos.`), at most 20 a map in one theme (409 `This map has 20 photos in “Doors” already: take one out to enter another.`, counted with the map row locked). |
| `DELETE /photos/:photoId/themes/:themeId` | editor of the photo, **verified** | Takes it out, at any time → `{ themes }`; 404 if it wasn't in. |
| `GET /shared/:code/themes`, `GET /shared/:code/themes/:themeId/photos` | anyone with a map's code | As above, as the link's role sees them, never with `entriesLeft` (a trip's code → 404) |
| `GET /users/admin/themes` | ADMIN or DEVELOPER | `{ themes: [{ ...theme, entryCount, mapCount, ended }], entriesPerMap }`, newest month first, future ones too |
| `POST /users/admin/themes` | ADMIN or DEVELOPER | `{ month: 'YYYY-MM', title, blurb? }` → 201 `{ theme }`. This month or later (400 `A theme can't be set for a month that's over.`); one a month (409 `There's already a theme for that month.`); title 1–60, blurb up to 300 (cleaned; 400 otherwise). |
| `PATCH /users/admin/themes/:themeId` | ADMIN or DEVELOPER | `{ month?, title?, blurb? }` → `{ theme }` (with `entryCount` and `mapCount`, as the list has them). The words can always change; the month only while no photo is entered (409 `Photos have been entered in this theme, so its month can't change and it can't be deleted.`). |
| `DELETE /users/admin/themes/:themeId` | ADMIN or DEVELOPER | Only a theme with no photo entered (409 as above) → `{ message }` |

- **A photo's detail** (`GET /photos/:photoId` and the share-link one) carries `themes: [theme]`, the themes it's in, newest month first, for everyone who can see it.
- **Badges:** `themes-3`, `themes-6`, `themes-12` count the themes a map has a photo in (see "Badges and goals").
- **Events** (`themes`): `Create Success`, `Update Success`, `Delete Success` (admin, with the month), `Entry Create Success`, `Entry Delete Success` (with the photo id). Never a title.
- **The seed** (development only) writes the example year in `prisma/seed/themes.js`, from last month on, with three of the demo map's photos entered; production's themes are written on the admin page (`/admin/themes`).

## Friends challenges

A measure counted between two dates among friends (docs/FEATURE-PLAN.md, "Friends challenges"). Someone starts one, sends its **join link**, and each person who joins picks which of their maps counts: one they **own or edit**. The leaderboard shows **names and counts only**: never a map, a photo, a place or an id. Anyone not in a challenge gets a 404 for it. `FriendChallenge` (title, `measure`, `startsOn`/`endsOn` as UTC days, both included, an optional `target`, a unique `joinCode`, `createdById`; CHECKs `friend_challenge_dates_in_order` (at most 730 days), `friend_challenge_target_range` (1–500), `friend_challenge_title_length` (1–80)) and `FriendChallengeEntry` (challenge × user, the `mapId` that counts, `joinedAt`; the map set to null when it's deleted). Rules in `server/src/utils/challenges.js`, counting in `domain/challenges.js`.

**Measures**, counted from the map's own data, hidden photos included, by when each photo was taken (`shotAt`: the file's date, else the upload time):
- `NEW_COUNTRIES`: countries whose **first** photo on the map was taken in the dates;
- `COUNTRIES`: countries with a photo taken in the dates;
- `LANDMARKS`: landmarks confirmed on a photo taken in the dates;
- `THEME_PHOTOS`: photos entered in the monthly themes in the dates (see "Photo themes").

Special places don't count as countries. **The leaderboard:** with a target ("first to 5"), whoever reached it first leads (the date their target-th item counted), then the rest by count; without one, by count. Equal places share a rank. Someone whose map is gone, or who no longer edits it, counts 0 (`counting: false`) until they pick another. No cheating checks: dates can be edited, it's a game between friends.

A challenge's fields: `{ id, title, measure, startsOn, endsOn, target, status }`, `status` being `UPCOMING`, `RUNNING` or `ENDED` (UTC).

| Method and path | Who | Body / returns |
| --- | --- | --- |
| `GET /challenges` | signed in | `{ challenges: [{ ...fields, memberCount, myCount, reachedTarget, counting, youStartedIt }], perUserLimit }`, newest joined first. Your own count only: the ranks are on each challenge (ranking every challenge here would count everyone in all of them). |
| `POST /challenges` | signed in, **verified** | `{ title, measure, startsOn, endsOn, target?, mapId }` → 201 `{ challenge }`: you're in it, counting `mapId`. 400 for anything wrong (`The last day must be on or after the first, and a challenge can last up to two years.`; `Choose one of your maps to count: one you own or edit.`). 10 a day per user. Starting one counts towards the 30 challenges a person can be in, as joining does (409 past it; counted with the person's row locked, so starting and joining at once can't pass it). |
| `GET /challenges/:challengeId` | in it | `{ challenge: { ...fields, joinCode, youStartedIt, myMap: { id, name }, members: [{ name, count, rank, reachedTarget, counting, isYou, startedIt }], memberLimit } }`. `joinCode` is `XXXX-XXXX-XXXX`; any member may pass the link on. |
| `PATCH /challenges/:challengeId` | the starter, **verified** | `{ title?, startsOn?, endsOn?, target? }` → `{ challenge }`. The measure never changes (400 `What a challenge counts can't change once it's made.`). Others → 403. |
| `DELETE /challenges/:challengeId` | the starter, **verified** | Deletes it for everyone → `{ message }` |
| `POST /challenges/:challengeId/reset-link` | the starter, **verified** | A new join code; the old link stops working → `{ challenge }` |
| `PATCH /challenges/:challengeId/me` | in it, **verified** | `{ mapId }`: which of your maps counts → `{ challenge }` |
| `DELETE /challenges/:challengeId/me` | in it | Leave → `{ message }`. The starter can't (409 `You started this challenge, so delete it instead of leaving.`). |
| `GET /challenges/join/:code` | anyone | `{ challenge: { ...fields, startedBy, memberCount, full, youAreIn } }`: enough to decide, the starter's name but nobody else's. A code that matches nothing → 404 `That challenge link doesn't work. Ask for a new one.` 30 per 15 minutes per IP (codes would be guessed here). |
| `POST /challenges/join/:code` | signed in, **verified** | `{ mapId }` → 201 `{ challenge }` (already in → 200). An ended challenge → 409 `This challenge has ended.`; 50 people a challenge (409), 30 challenges a person (409). The count is made with the challenge row locked. |

- **Privacy:** the join code is a secret: `/api/challenges/join/<code>` is logged as `:code` (`redactUrl.js`), and the client's `/challenges/join/:code` pauses analytics and is reported as its pattern. Events (`challenges`) carry ids only: `Create Success`, `Update Success`, `Delete Success`, `Link Reset Success`, `Join Success`, `Leave Success`.
- **Not built yet:** inviting by email (the link is sent however people like), and the starter removing someone (a reset link stops newcomers).
- **The seed** (development only) adds "Most new countries this year", started by the demo couple's account with the admin in (`prisma/seed/challenges.js`).

## Promo codes

Influencer codes (docs/FEATURE-PLAN.md, "Getting the word out"): a code per creator, so sign-ups can be counted per code. **Every code gives the same offer** (the user's decision, 16 Nov 2026; `PROMO_TRIAL_DAYS` in `utils/promoCodes.js`): the follower's **first month free on the paid plan they choose**, as a 30-day Stripe trial on their first paid Checkout. Checkout takes a card (`payment_method_collection: 'always'`), and Stripe charges when the trial ends unless they cancel first. Checkout already needs a verified address, so throwaway sign-ups get nothing. The creator's own reward is a complimentary membership given by an admin (24 months; "Complimentary memberships" below).

**Codes for life** (the user's own codes, 17 Nov 2026): a code made with `freePlan` (`REGULAR` or `PREMIUM`, chosen when it's made and never changed; CHECK `promo_code_free_plan`) gives whoever signs up with it that plan **for life**, once the address is verified (17 Nov 2026: it was given at sign-up, to unverified accounts): a complimentary membership (`PlanGrant`) ending `9999-12-31T00:00:00.000Z` (`FOR_LIFE_ENDS_AT`; the client shows "for life", `isForLife`), granted by whoever made the code, reason `Promo code <CODE>, for life`, given once (`giveLifetimePlan`, from the user update hook when `emailVerified`, or at sign-up for an account made verified). It works at sign-up only and gives no free month on top (`promoTrialDays` is 0). An admin can still end the membership like any other.

**A code's limit holds** (17 Nov 2026): the sign-up's after hook claims the code with its row locked (`claimPromoCodeInDB`), counting the uses under the lock, so sign-ups at the same moment can't take it past `maxUses`; one that loses the race is made without the code. **A use** is an account that signed up with the code and verified its address, or one made in the last 24 hours that still may (19 Nov 2026, the audit: never-verified throwaway sign-ups used a code up); a code for life's plans are also counted under the code's lock when each is given, so no more accounts than `maxUses` ever get one. Sign-up, like change-email, password reset and resending verification, is limited to 5 per 15 minutes per IP (`AUTH_EMAIL_RATE_LIMIT`), so codes can't be tried faster than the check route allows.

- **Codes** are 3–24 letters and digits, stored upper case; what people type is cleaned (`sam-travels` is `SAMTRAVELS`). A code can be used while it's `active`, before `endsAt`, and while it has fewer than `maxUses` uses (above; no limit when null). A code that fills up between the check and the account being made is simply not recorded.
- **Signing up with one:** `POST /api/auth/sign-up/email` takes an optional `promoCode` beside the usual fields. A code that can't be used → 400 `That code isn't valid. Check it, or sign up without one.`, and no account is made. A good one goes on the new account's profile (`Profile.promoCodeId`), and stays there if the code is turned off later.
- **The free month** (`promoTrialDays`): `POST /billing/checkout` for `REGULAR` or `PREMIUM` from an account with a code whose free month hasn't started (`Profile.promoTrialUsedAt` null) adds `subscription_data.trial_period_days: 30` and `metadata.promoCode`, and asks for a card. Extra maps alone (`plan: 'FREE'`, or `POST /billing/extra-maps` without a subscription) get no trial, and the month stays for later. The webhook records the month as started when a subscription with `trial_end` and `metadata.promoCode` arrives (any event; once), so cancelling during the trial and buying again pays from the first day. `GET /billing` carries `promoTrial: { code, days }` while the account has the month and no live subscription.

| Method and path | Who | Body / returns |
| --- | --- | --- |
| `GET /promo-codes/:code` | anyone (rate limited: 30 per 15 min per IP) | `{ promoCode: { code, freePlan, trialDays } }` for a usable code (`freePlan` null and `trialDays: 30` for the usual offer; a plan and `trialDays: 0` for a code for life), else 404. No label. |
| `GET /users/admin/promo-codes` | ADMIN or DEVELOPER | `{ promoCodes: [{ id, code, label, freePlan, trialDays, active, maxUses, endsAt, createdAt, signUps, verified, trials, paying }] }`, newest first. `signUps` counts accounts with the code, `verified` those whose address is verified, `trials` those whose free month has started, `paying` those with a subscription that counts now (a trial included). |
| `POST /users/admin/promo-codes` | ADMIN or DEVELOPER | `{ code, label, freePlan?, maxUses?, endsAt? }` → 201 `{ promoCode }`. `freePlan`: `REGULAR` or `PREMIUM` makes a code for life (anything else → 400); null or left out, the usual free month. Other fields (an old `offerPlan` or `offerDays`) are ignored. A taken code → 409; a bad one → 400. |
| `PATCH /users/admin/promo-codes/:promoCodeId` | ADMIN or DEVELOPER | `{ label?, active?, maxUses?, endsAt? }` → `{ promoCode }`. The code itself and what it gives (`freePlan`, 400) never change (it's in people's posts); turn it off with `active: false`. Accounts that already signed up keep their free month. |
- **Events:** `billing`, `Promo Code Create Success` (with the code), `Promo Code Update Success`, and `Checkout Started` with `trialDays=30` when the free month applies; never the label.

## The invite offer

A welcome offer for people invited to a paid map (19 Nov 2026, the user's wish; docs/FEATURE-PLAN.md "Couples and families"). The rules are pure, in `server/src/utils/inviteOffer.js` (tested; the client copies the numbers in `utils/plans/inviteOffer.js`); `services/billing/inviteOffer.js` reads and writes them.

- **Who:** an account made after the invite was sent (signing up from its link, or later with that address) whose invite is accepted, when the invited map (a trip's map for a trip invite) runs on **Business or First Class**: the map's plan, whoever sent the invite. Kept on the profile (`inviteOfferPlan`, `inviteOfferEndsAt`, `inviteOfferUsedAt`; CHECK `profile_invite_offer`, migration `20261119160000_invite_offer`). Someone who already had an account gets none.
- **What:** that plan, or a lower paid one, at **half price for the first 3 months**: a Checkout started before `inviteOfferEndsAt` (7 days after signing up) gets Stripe's coupon `invite-offer-half-3-months` (50% off, repeating 3 months) on a monthly plan, or `invite-offer-year-<plan>` on a yearly one: the same saving taken once off the first year (£14.99 on First Class, £7.49 on Business), since a 3-month coupon would halve a yearly plan's one bill. The server makes the coupons in Stripe the first time (fixed ids). Not with extra maps in the same Checkout, and never with a free month.
- **One offer per account:** a promo code recorded at sign-up drops it, and an account with a promo code never gets it.
- **Used** when the webhook sees the subscription it started (`subscription_data.metadata.inviteOffer`), once.
- **Where it shows:** `GET /billing` `inviteOffer: { plan, endsAt }` (null when there's none, it's used or ended, or a subscription exists); `GET /invites/:token` `invite.offer: { plan, planName }` for a paid map; the share email to an address with no account (`offerPlanName`, `offerYearly`).

## Travel offers

Partner offers shown as our own cards (docs/FEATURE-PLAN.md, "Ads" and "Travel Desk"): in photo galleries, at the end of a slideshow and on the public country pages, as the viewer's plan allows, and on the Travel Desk when someone asks. Nothing about the viewer is sent to choose them: the client gets every live offer once and picks one per slot.

| Method and path | Who | Body / returns |
| --- | --- | --- |
| `GET /offers` | anyone | `{ offers: [{ id, partner, kind, title, blurb, countryCode, placements, imageKey, weight }] }`: every offer live now (active, after `startsAt`, before `endsAt`). Never the link or the key. Cached 5 minutes (`public, max-age=300, s-maxage=300, stale-while-revalidate=3600`, `Vary: Origin`). |
| `GET /go/:offerId?p=&dest=&country=&from=&to=` (mounted at `/go`, not `/api`) | anyone | A card's link. Adds one to today's (UTC) tally for that offer and placement `p` (one of the placements; anything else isn't counted), then **302** to the offer's `url` with its placeholders filled: `{destination}` from `dest` (a place name, cleaned, 80 characters at most; the client sends a landmark's or a country's name, never a stop's own place name), `{country}` from `country` (a code), `{checkin}` and `{checkout}` from `from` and `to` (`YYYY-MM-DD`). Each is URL-encoded, and left empty when unknown or malformed: a click is never refused for its query. At most 60 clicks per 15 minutes per IP are counted; past that it still redirects. `Cache-Control: no-store`, `Referrer-Policy: no-referrer`. An unknown offer → 404 `That offer doesn't exist.`; one that's off or outside its dates → 404 `That offer has ended.` |
| `GET /users/admin/offers` | ADMIN or DEVELOPER | `{ offers: [{ ...every field, key, url, active, startsAt, endsAt, createdAt, updatedAt, clicks: { total, byPlacement: { GALLERY: n, … }, byDay: [{ day, count }] } }], clicksSince }`: the clicks of the last 30 days (`clicksSince` is the first day counted). |
| `POST /users/admin/offers` | ADMIN or DEVELOPER | One offer (below) → 201 `{ offer }`. A taken key → 409; anything wrong → 400 `Check the offer's details: … (<field>)`. |
| `PATCH /users/admin/offers/:offerId` | ADMIN or DEVELOPER | Any fields but `key` (sending another key → 400) → `{ offer }`. `active: false` takes it off every card and the Travel Desk, and keeps its tallies. |
| `DELETE /users/admin/offers/:offerId` | ADMIN or DEVELOPER | Deletes it and its tallies → `{ message }` |
| `POST /users/admin/offers/import` | ADMIN or DEVELOPER | An import file's contents, `{ offers: [...] }` (or a bare list), at most 500 → `{ created, updated, keys }`. Each offer is created or updated by its `key`; a field left out goes back to its default (the file is the whole truth about each offer it names); offers not in the file are left alone. Every offer is checked first: if any is wrong, nothing is written and the answer is 400 `Nothing was imported: fix the offers listed and try again.` with `data: { problems: [{ index, key, field }] }` (`index` from 0; `field` the first wrong field). |

**An offer** (the import file's shape; `server/prisma/seed/data/offers.example.json` is a complete example, imported by the dev seed):

| Field | Rule |
| --- | --- |
| `key` | Required, unique, never changes: 2–64 of `a-z`, `0-9` and `-`, starting with a letter or digit (`booking-hotels-jp`) |
| `partner` | Required, up to 60 characters (cleaned like captions) |
| `kind` | Required: `HOTEL`, `TOUR`, `FLIGHT`, `ESIM`, `INSURANCE`, `LUGGAGE`, `CAR_HIRE`, `OTHER` or `PRINTS` (a photo printer) |
| `title` | Required, up to 80: the card's line ("Hotels in Kyoto") |
| `blurb` | Optional, up to 200 |
| `countryCode` | A country or special place, or null for a general offer (insurance, eSIMs, luggage) |
| `placements` | Required, at least one of `GALLERY`, `SLIDESHOW`, `COUNTRY_PAGE`, `TRAVEL_DESK`, `PRINT` (under "Print or download": see "Downloads") |
| `url` | Required, `https://`, up to 2,000 characters, no user or password, and no placeholders but `{destination}`, `{country}`, `{checkin}`, `{checkout}`, never in the host (a click's `dest` would choose where `/go` sends people) |
| `imageKey` | Optional: a picture in the public bucket (`visitCountryPosters/jp-800.avif`), letters, digits, `/_.-` only, no `..`, ending `.avif`, `.webp`, `.jpg`, `.jpeg` or `.png` (never SVG). Without one the card draws its kind. |
| `weight` | 1–100 (default 1): how often it's picked among the offers that fit a slot |
| `active` | Default true |
| `startsAt`, `endsAt` | Optional ISO times; `endsAt` not before `startsAt` |

- **How often cards show** comes with the map or trip: `GET /maps/:mapId`, `GET /trips/:tripId` and `GET /shared/:code` add `ads: { every }`, a card every `every` photo tiles, or null for none. It follows docs/FEATURE-PLAN.md "Ads by tier" (`utils/offers.js` `adEveryFor`): a viewer on Business or First Class sees none; anyone else (Economy, or signed out on a share link) sees the map owner's plan's rate: one every 12 photos on an Economy map, every 24 on a Business map, none on a First Class map (`adEvery` in `utils/constants/plans.js`). The Travel Desk and the country pages' slots aren't affected: the Travel Desk opens only when asked for, on every plan, and the country pages are public travel pages.
- **Choosing a card** (the client; `GET /offers` gives it everything live): among the offers for that placement, the first group that has any wins: a planned trip on this map with future dates (its destination country, with the trip's place and dates passed to `/go`); the country being viewed; the country of the photos around the slot; then general offers (no `countryCode`). Within the group, one is picked by `weight`, the same way for the same slot each time.
- **Privacy:** no third-party scripts, pixels or cookies; a card is our own markup with a plain link to `/go/…` (`rel="sponsored noopener"`), labelled **Ad**. The tally keeps only offer, day, placement and a count (`OfferClickDaily`): no person, map, share code or time of day. Clicks are never `AppEvent`s; admin changes are (`offers`: `Create Success`, `Update Success`, `Delete Success`, `Import Success`, with ids and keys).
- **Importing outside the admin page:** `npm run db:offers -- <file>` (in `server/`) runs the same import; the user runs it. It's safe on production.

## Sharing

The same routes exist for maps and trips: `:resource` is `maps` or `trips`. A trip's "owner" is the owner of its map. "Managers" are the owner and, on a map (and its trips), its co-owners.

| Method and path | Role | Body / returns |
| --- | --- | --- |
| `GET /:resource/:id/sharing` | managers | `{ owner: { userId, name, email }, linkAccess, shareCode, shareUrl, members: [{ userId, name, email, role, travellerId?, travellerName? }], invites: [{ id, email, role, expiresAt, travellerId?, travellerName? }] }` (a co-owner's traveller comes with them) |
| `PATCH /:resource/:id/sharing` | managers | `{ linkAccess }` → the same as `GET` |
| `POST /:resource/:id/sharing/reset-link` | managers | → `{ shareCode, shareUrl }`. Old links stop working. |
| `POST /:resource/:id/members` | managers, with a **verified** email | `{ email, role, travellerId? }` (`role` `VIEWER`, `EDITOR`, or on a map `CO_OWNER` with the `travellerId` they'll be; see "Co-owners"). An active account whose address is **verified** is added and emailed → 201 `{ member }` (re-adding someone changes their role: how an editor becomes a co-owner). Anyone else (no account, or an unverified or deactivated one) gets a `ShareInvite` (token emailed, 14 days; replaces an earlier pending one for that address) → 201 `{ invite }`. Your own address, or the owner's → 400. A co-owner lowering a co-owner's role → 403. A manager whose own address isn't verified → 403 `{ message }` (after the 404/403 role checks), and nothing is sent. Rate limited per IP and per user (below). |
| `PATCH /:resource/:id/members/:userId` | managers (only the owner changes a co-owner's role) | `{ role, travellerId? }` → `{ member }`. Promoting a map viewer to `EDITOR` when the map has 5 editors → 409 (below). |
| `DELETE /:resource/:id/members/:userId` | the owner; a co-owner, anyone but a co-owner; or the member themselves (leaving) | Leaving a trip also takes it off the maps that person added it to (see "Group trips"). A co-owner leaving or removed lets go of their traveller (it stays, with no login). |
| `DELETE /:resource/:id/invites/:inviteId` | managers | |
| `GET /invites/:token` | anyone | What an invite is for, before signing in: `{ invite: { email, role, kind: 'map'|'trip', id, name, invitedBy, travellerName, expiresAt } }`. Holding the token is what proves the inbox, so it tells its holder nothing new. A bad, used or expired token → 404. Rate limited like accepting. |
| `POST /invites/accept` | signed in | `{ token }` → `{ resource: 'map'|'trip', id }`. A bad, used or expired token → 400. The invite's address must be the user's **verified** email, else 403. Never lowers a role the user already has. Marking the invite used and adding the member is one transaction, so the same invite accepted twice at once counts once (the other gets 400). Rate limited like share codes. |
| `GET /shared/:code` | anyone | Normalises the code (upper case, no dashes or spaces). A map → `{ resource: 'map', id, role, map, trips }` (`map` as `GET /maps/:id`, `trips` as `GET /maps/:id/trips`, with group trips added from other maps always in their limited form, `canOpen: false`). A trip → `{ resource: 'trip', id, role, trip }` (as `GET /trips/:id`, with `canOpenMap` always false: the share page doesn't link to the map). `role` is the caller's: `VIEWER` for link visitors, while a signed-in member keeps their own. 404 when the code is unknown, or the link is off and the caller isn't a member. Rate limited per IP (the lookup count). |
| `GET /shared/:code/photos?country=&unplaced=&tripId=&cursor=&limit=` | anyone with the code | Like the map or trip photo list, with the same `role` rules. Rate limited (the browsing count; a code that matches nothing also uses the lookup count). |
| `GET /shared/:code/photos/:photoId` | anyone with the code | One photo of that map or trip, as `GET /photos/:photoId` (how a link visitor opens a photo). Rate limited like the photo list. |
| `GET /shared/:code/moments?country=&tripId=&cursor=&limit=` | anyone with the code | The map's moments, or the trip's, as `GET /maps/:mapId/moments` (see "Moments"), with the same `role` rules; a trip's link shows only that trip's photos in them. Rate limited like the photo list. |

- **Pending invites are accepted automatically** too: as soon as an account verifies the invited address, or signs up already verified.
- **Signing up from an invite's link** (19 Nov 2026): `POST /auth/sign-up/email` with the link's `inviteToken` and the invite's own address makes the account **verified** at once (the link only went to that inbox, which is what a verification email proves), sends no verification email, and accepts its invites. Any other address, or a used or expired token, signs up as usual.
- **Caps on people** (every plan; `EDITORS_PER_MAP`, `PEOPLE_PER_TRIP` in `server/src/utils/constants/plans.js`):
  - **a map** has up to 5 editors (10 until 19 Nov 2026): its `EDITOR` members plus pending `EDITOR` invites. Adding the 6th (`POST …/members` with `role: 'EDITOR'`, as a member or an invite) or promoting a viewer → 409 `A map can have up to 5 editors.`. Co-owners never count (see "Co-owners"). Viewers are unlimited;
  - **a trip** has up to 20 people: its members of any role plus pending trip invites, apart from the map's editors. The 21st → 409 `A trip can have up to 20 people.`. Changing a trip member's role adds nobody;
  - the person being added is left out of the count, so adding someone again (or replacing their pending invite) never trips it;
  - **accepting an invite never fails on a cap** (its place was held from when it was sent).
- **Share emails** have a fixed subject, `<BusinessName>: a map was shared with you` (or `a trip`). The sharer's name appears only in the body, escaped; names are cleaned when they're set (see "Accounts").

- **Share codes:** 12 characters from `23456789ABCDEFGHJKMNPQRSTVWXYZ`, shown as `XXXX-XXXX-XXXX`, stored without dashes.

### Co-owners

For couples and families (19 Nov 2026, the user's wish; docs/FEATURE-PLAN.md "Couples and families"): each adult has their own login, and the people a map is about share it as co-owners. Rules in `server/src/utils/access.js` (`canManage`, `isOwner`, `canSetMemberRole`, `canRemoveMember`) and `utils/planLimits.js` (`checkCoOwnerCap`).

- **What a co-owner can do:** everything on that map (its content, its name, kind and UK split, its travellers, its sharing and its trips' sharing) except delete it, transfer it, make it the main map, pay for it, or take a co-owner's role away (only the owner does that). The map runs on the owner's plan, whoever looks. Each person's map settings (style, pins) stay their own.
- **Every co-owner is one of the map's travellers:** `POST …/members` with `role: 'CO_OWNER'` needs a `travellerId` (400 without), one of the map's travellers with no login and no other pending co-owner invite (409 otherwise). Becoming a co-owner links that traveller to their account (`Traveller.userId`); a pending co-owner invite carries the traveller (`ShareInvite.travellerId`, CHECK `share_invite_co_owner`).
- **How many:** one fewer than the map's travellers (the owner keeps one): none on a solo map, one on a couple's map. Counted as `CO_OWNER` members plus pending `CO_OWNER` invites, with the map row locked → 409 past it. Co-owners never count as editors.
- **Travellers they need:** deleting a co-owner's traveller, or one invited as a co-owner, → 409; so does deleting a traveller that would leave fewer than the co-owners plus one.
- **Maps only:** a trip's people are `VIEWER` or `EDITOR` (400 otherwise). A map's co-owner is a co-owner of its trips too (the higher of the two roles).
- **Leaving and handing over:** a co-owner leaving, or removed, lets go of their traveller. When the owner deletes their account, a co-owner comes before an editor as the default heir (`heirFor`). Transferring a map to a co-owner keeps the old owner on as a co-owner when they're one of its travellers (they swap places).
- **Share URL:** `https://<site>/shared/<code>`.
- **Invite tokens:** 32 random bytes, base64url. Only their SHA-256 hash is stored.

## Map limits

A map's plan comes from its **owner**, for everything: photos per country, originals or print copies, storage, videos, ads, the passport cover: the owner's plan when the map is on it, else Economy's (one of the free maps; 19 Nov 2026). An editor's or co-owner's own plan adds nothing. The rules are pure functions: `server/src/utils/plans.js` (the plan in force), `utils/mapSlots.js` (which maps are active) and `utils/planLimits.js` (the caps and their messages), all unit-tested. Names, prices and limits are in `utils/constants/plans.js`.

| | Economy (`FREE`) | Business (`REGULAR`) | First Class (`PREMIUM`) |
| --- | --- | --- | --- |
| Photos per country, on each map | 30 | 200 | 1,000 |
| Best copy kept | `PRINT` | `ORIGINAL` | `ORIGINAL` |
| Videos | no | no | yes |
| Storage safety net, on each map | none | 50 GB | 200 GB |

- **Three free maps, then extra maps** (19 Nov 2026, the user's wish; `FREE_MAPS`, `INCLUDED_MAPS`, `FREE_ECONOMY_MAPS`). Every account owns 3 maps without paying, and each extra map paid for (the subscription's extra-map quantity, while its status is `active`, `trialing` or `past_due`) is one more on the plan. Each owned map has a `tier` (`utils/mapSlots.js`, on `GET /maps` and the owner's map reply):
  - **`PLAN`**, the owner's plan: the default map, always; a map in a transfer's grace period (`graceUntil` after now), whatever the slots; then the first *n* others, *n* the extra maps paid for. The maps the owner chose to upgrade (`TravelMap.upgradedAt`) come first, in the order chosen; then the rest oldest first, a map that came by transfer (a past `graceUntil`) behind the owner's own;
  - **`ECONOMY`**: the next 2 (the free maps), oldest first: Economy's limits whatever the owner pays;
  - **`LOCKED`**: any more (a payment that stopped, or a map handed to someone who already has theirs).
- **Upgrading a map:** `POST /maps/:mapId/upgrade` (the owner, verified) records the choice and answers `{ map }`: its `tier` is `PLAN` when an extra map already paid for was free to move (it was upgrading an unchosen map), else still `ECONOMY` until another extra map is paid for (the app then offers it). `DELETE /maps/:mapId/upgrade` takes the choice back. The main map is always on the plan. The owner's map reply carries `plan` (the map's own), `accountPlan` (the owner's), `tier` and `upgraded`; `GET /billing` carries `freeEconomyMaps` and `economyMapIds`. A new map past the 3 free ones and those paid for → 402 `You have your 3 free maps, and every extra map you've paid for is in use. An extra map costs …`.
- **A locked map:** it stays viewable and shareable, and its countries, trips and travellers can still be changed, but it takes **no new photos** (presign and confirm → 403). Nothing is ever deleted for lack of payment; paying for another extra map, or making the map the main one (`POST /maps/:mapId/main`), unlocks it.
- **A new map** (`POST /maps`) needs the active maps (grace ones included) to be fewer than the slots, else 402. The default map made at sign-up, or again by `GET /maps`, needs none.
- **Photos per country** count every photo on the map in that country, hidden ones included, whoever uploaded them. Photos with no country are one more gallery under the same cap (17 Nov 2026: they had none, so Economy's storage had no limit): full → 409 `30 of 30 photos with no country on this map. Upgrade to add more.`, at confirm and when `PATCH /photos/:photoId` takes a photo out of its country; videos likewise under their own cap. Checked at presign (with the `countryCode` hint), at confirm (with the final country) and when `PATCH /photos/:photoId` changes the country; full → 409. A map over the cap after a downgrade keeps its photos; the country just takes no more.
- **Downgrades** delete nothing: originals already kept stay, and new uploads keep a print copy.

## Transferring a map

| Method and path | Role | Body / returns |
| --- | --- | --- |
| `POST /maps/:mapId/transfer` | owner, with a **verified** email | `{ userId, stayAsEditor = true }`. The new owner must already be on the map (a member of any role), with an active account and a verified address, else 400. Your own id → 400. → `{ map }`: the map as an editor sees it when you stay, else `{ id, name, role: null }`. |
| `POST /users/admin/transfer-map` | ADMIN or DEVELOPER | `{ mapId, toEmail, keepOldOwnerAsEditor = false }`: for an owner who can't do it (a death, a lost address), after checking off the site. The target needs an active account (not necessarily on the map); none, or a deactivated one → 400 `That address has no active account to move the map to.`; the current owner → 400; an unverified one → 400 `The new owner needs an active account with a verified email address.`; the admin's own account → 403 `You can't move a map to your own account from the admin panel.`; a developer's map moved by an admin who isn't one → 403 `Only a developer can manage developer accounts.` (19 Nov 2026, the audit); an unknown map → 404. → `{ map: { id, name, ownerId, previousOwnerId, graceUntil } }` |

Both do the same, in one transaction:
- `ownerId` becomes the new owner, and their `MapMember` row goes;
- the old owner becomes an `EDITOR` member when they stay (an editor cap doesn't stop a transfer);
- `isDefault` and `defaultForOwnerId` are cleared (the new owner has their own default). If it was the old owner's default map, a new "My map" is made for them straight away;
- `graceUntil` is set to 60 days from now (`TRANSFER_GRACE_DAYS`) when the new owner has no free map slot, else cleared. The map then has the new owner's plan. **Once per map** (17 Nov 2026): a map that has had a grace period keeps the date it had on a later transfer, so passing it back and forth can't keep it unlocked. `POST /maps/:mapId/transfer` counts towards the 20 new maps a day (handing over your main map makes you a new one).

An event is logged (`maps`, `Transfer Success` or `Admin Transfer Success`) with the new owner as `targetId`; no email addresses.

## Leaving

What happens to your maps, and to the photos you added to other people's maps, when you delete your account (`POST /auth/delete-user`, or an admin's delete). An account change: signed in, no verified email needed.

**A subscription ends first** (16 Nov 2026): before anything is deleted, a live subscription is cancelled with Stripe at once (`subscriptions.cancel`), as its `Subscription` row goes with the user and Stripe would otherwise go on charging. If Stripe can't be told, the delete answers 503 `{ message }` ("We couldn't cancel your subscription just now, so your account hasn't been deleted…") and nothing is deleted; an admin's delete answers 500 with that message. A subscription Stripe no longer has counts as ended. With payments off (no `STRIPE_SECRET_KEY`: development, tests) nothing is sent. Stripe's `customer.subscription.deleted` that follows finds no account and is ignored. Refunds (in full within 14 days of a first payment, the terms say) are made by hand in Stripe's dashboard.

| Method and path | Role | Body / returns |
| --- | --- | --- |
| `GET /users/leaving-options` | signed in | `{ maps: [{ id, name, members: [{ userId, name, role, isActive }] }], photosOnOtherMaps }`: the maps you own (default first) with everyone on them, longest-standing first, and how many photos you added to maps you don't own |
| `PUT /users/leaving-plan` | signed in | `{ maps: [{ mapId, action: 'TRANSFER' \| 'DELETE', toUserId? }], leavePhotos = true }`. Every map you own, listed once; `TRANSFER` names someone on that map (`toUserId`), `DELETE` has none. Anything else → 400. Stored on your profile → `{ leavingPlan, savedAt, expiresAt }` |

When the account is deleted (better-auth's `beforeDelete`, `services/travel/accounts.js`):
- **a plan saved within the last 60 minutes** (`LEAVING_PLAN_TTL_MINUTES`) is used; an older one, or none, means the defaults;
- **each owned map** goes to the plan's choice (if that person is still on it) or is deleted as the plan says. A map the plan doesn't mention (or with no plan) passes to its longest-standing active editor, else a deactivated one, and is deleted when it has no editors. A handover follows the transfer's grace rule, and **keeps every photo on it**, the leaver's included (they become the new owner's);
- **photos on other people's maps** are left there by default (`leavePhotos: true`): they become that map's owner's before the account row goes (it would cascade to them otherwise). With `leavePhotos: false` they're deleted, rows then files;
- the remaining owned maps are deleted, rows then files, as before.

## Your data

"Download my data" on the account page: a copy of everything an account holds, free on every plan (the UK GDPR's rights of access and portability). Signed in, no verified email needed; read only; your own data only. One answer would be too big for Vercel (4.5 MB) on a big map, so the browser asks for the parts and joins them into one JSON file (`my-planet-view-data-YYYY-MM-DD.json`; `client/src/utils/account/dataExport.js`). Every answer is `Cache-Control: no-store`. The shapes are in `server/src/utils/dataExport.js`.

| Method and path | Role | Returns |
| --- | --- | --- |
| `GET /users/export` | signed in | `{ format: 'my-planet-view-data', version: 1, site, exportedAt, linksWorkUntil, account, plan, mapsYouOwn, mapsSharedWithYou, tripsSharedWithYou, photosOnOtherMaps }`: the account (name, email, home country, map settings, the promo code signed up with), the plan in force (`{ id, name, from }`), the subscription and complimentary memberships, and the maps and trips you're on (`photosOnOtherMaps` is a count) |
| `GET /users/export/maps/:mapId` | the map's **owner** | `{ map }`: its fields, travellers, `countries` (status, source, first visit, notes), `sharedWith` (names and roles) and `invites` (addresses you typed), trips with their stops, travellers, people and invites, `groupTripsAdded`, moments, `statesVisited`, `pins` (with their visits), goals, badges, `passportStampPhotos`, `photoCount` |
| `GET /users/export/maps/:mapId/photos?cursor=` | the map's **owner** | `{ photos, nextCursor }`: 500 a page, newest upload first, hidden ones too. Each: caption, dates, country, trip, position, landmarks (with confirmation), who uploaded it, and `file: { copy, contentType, bytes, width, height, url }`, a signed link to its best copy (`ORIGINAL`, else `PRINT`) that saves as `photo-<date>-<id>.<ext>` and works for 7 days. A video has `file: null` and a `fileNote`: Stream keeps no original to hand back |
| `GET /users/export/uploads?cursor=` | signed in | `{ photos, nextCursor }`: the photos you added to maps you don't own and can still open (you're on the map, or on the photo's trip), the same shape plus `mapId`, `map` and `mapOwner`. Taken off a map, or having left it, you no longer get the photos you added there (19 Nov 2026, the user's decision); `photosOnOtherMaps` counts the same |

- Someone else's map, an editor's included, is a 404 (as if it didn't exist); a cursor that can't be one is a 400.
- Other people appear by name only, never by address, apart from the invites you sent yourself.
- In the file, each map in `maps` carries its `photos`, and `photosOnOtherMaps` becomes the list of those photos.

## Plans and billing

The plan in force is computed, never stored: the highest of the subscription's plan (while its status is `active`, `trialing` or `past_due`) and every complimentary grant running now (`startsAt <= now < endsAt`), else `FREE`. Payments are Stripe Checkout plus the customer portal: one subscription per account, with a **plan line** (none on Economy) and an **extra-map line** whose quantity is the number of extra maps (both on the same interval). Prices are in pence, GBP.

| Plan | Monthly | Yearly | Extra map, monthly | Extra map, yearly |
| --- | --- | --- | --- | --- |
| Economy (`FREE`) | 0 | 0 | 399 | 3900 |
| Business (`REGULAR`) | 499 | 4900 | 399 | 3900 |
| First Class (`PREMIUM`) | 999 | 9900 | 599 | 5900 |

All under `/api/billing`, signed in. Every write needs a **verified** email and is rate limited per user. Without `STRIPE_SECRET_KEY` the writes answer **503** `Payments aren't set up yet.` (also when a price id they need isn't configured).

| Method and path | Body / returns |
| --- | --- |
| `GET /billing` | `{ plan, planName, source: 'STRIPE' \| 'COMPLIMENTARY' \| 'FREE', interval, status, renewsAt, cancelAtPeriodEnd, grant: { plan, endsAt } \| null, promoTrial: { code, days } \| null, includedMaps, extraMapsPaid, ownedMaps, lockedMapIds, prices, paymentsEnabled }`. `interval`, `status` and `renewsAt` (the period end) are the subscription's, or null. `grant` is the best grant running now, even when the subscription wins. `promoTrial`: a promo code's free month not yet used, with no live subscription ("Promo codes"); a subscription in it has `status: 'trialing'` and `renewsAt` at the trial's end. `prices` is `{ currency: 'GBP', plans: { FREE, REGULAR, PREMIUM }, extraMap: { FREE, REGULAR, PREMIUM } }`, each `{ MONTH, YEAR }` in pence. |
| `POST /billing/checkout` | `{ plan: 'REGULAR' \| 'PREMIUM' \| 'FREE', interval: 'MONTH' \| 'YEAR', extraMaps = 0 }` → `{ url }` (Stripe Checkout, mode subscription). One Stripe customer per account, made at its first Checkout and kept on its `Subscription` row; any other open Checkout of that customer is expired first, so only one can be paid (17 Nov 2026). A promo code's free month isn't given with extra maps in the same Checkout (a trial covers every line); it stays for later. `FREE` means extra maps only (then `extraMaps` ≥ 1, else 400). Bad values → 400. An account with a subscription that hasn't ended → 409 `You already have a subscription. Change its plan or extra maps instead.` Checkout returns to `<first FRONTEND_ORIGIN>/account?billing=success` or `?billing=cancelled`; the plan applies when the webhook arrives. |
| `POST /billing/change-plan` | `{ plan, interval }` → `{ billing }` (as `GET /billing`). Changes the plan line, prorated; the extra-map line keeps its quantity on the new interval and the new plan's extra-map price. `FREE` drops the plan line, which needs extra maps on it (else 409 `To stop paying altogether, cancel from the billing portal.`). No subscription → 409. A new plan during a promo code's free month (`status: trialing`) ends it (`trial_end: 'now'`): the new plan is paid from then (17 Nov 2026). |
| `POST /billing/extra-maps` | `{ quantity, interval? }` (0–1000). Always one of two answers: **`{ billing }`** (as `GET /billing`) when the account has a subscription: the extra-map line's quantity is set, prorated (0 removes it; 0 on a subscription of extra maps only → 409, cancel in the portal); or **`{ url }`** (a Checkout for that many extra maps on Economy's line, `interval` defaulting to `MONTH`) when it has none (0 → 400). Fewer extra maps than maps in use locks the newest ones; nothing is deleted. More extra maps during a free month → 409 `Extra maps can be added once your free month ends.` |
| `POST /billing/portal` | → `{ url }`: Stripe's customer portal (payment method, invoices, cancelling), returning to `/account`. No Stripe customer yet → 409. |
| `POST /billing/webhook` | Stripe only (see below). |

- **The webhook** (`POST /api/billing/webhook`) takes the raw body (mounted before the JSON parser) and checks the `Stripe-Signature` header with `STRIPE_WEBHOOK_SECRET` (none → 503; a bad signature → 400). Stripe sends no `Origin` or `Sec-Fetch-Site`, so the cross-site check lets it through. Each event id is recorded first (`StripeEvent`): a repeat answers 200 `{ received: true, duplicate: true }` and changes nothing; if handling fails the record is removed and the answer is 500, so Stripe's retry runs it again. It handles:
  - `checkout.session.completed`: links the Stripe customer and subscription to the user (`client_reference_id`, also `metadata.userId`);
  - `customer.subscription.created`, `updated` and `deleted`: the subscription is fetched from Stripe as it is now (events can arrive late or out of order), then the handler writes the plan line's plan and interval (by price id), the extra-map quantity, status, period end and cancel flag (`cancel_at_period_end`, or a `cancel_at` date). `deleted` → plan `FREE`, no extra maps, status `canceled`. The account is found by customer id, else by the subscription's `metadata.userId`. A late event about an older, ended subscription, or one that would revive a canceled subscription, is ignored.

  A second live subscription for an account whose row tracks another live one (two Checkouts completed at once) is cancelled at once and logged (`Duplicate Subscription Cancelled`, with its id, so its first payment can be refunded); its `checkout.session.completed` never replaces the tracked one.

  Anything else → 200 `{ received: true }`. Event ids are kept 90 days (the daily clean-up).
- **Complimentary memberships** (ADMIN or DEVELOPER; `PlanGrant`):

  | Method and path | Body / returns |
  | --- | --- |
  | `GET /users/admin/plan-grants/:userId` | `{ grants: [{ id, plan, startsAt, endsAt, reason, grantedById, createdAt, active }], plan, source }`, newest first, with the plan the user has now. Unknown user → 404. |
  | `POST /users/admin/plan-grants/:userId` | `{ plan: 'REGULAR' \| 'PREMIUM', months: 1–36, reason? }` → 201 `{ grant }`, from now for whole calendar months. A creator with a promo code gets 24 months (the admin dialog's default; the user's decision, 16 Nov 2026). Bad values → 400; yourself → 403 `You can't give yourself a membership.` |
  | `PATCH /users/admin/end-plan-grant/:grantId` | Ends it now → `{ grant }`. Already ended → 409; unknown → 404. The account drops to its other plan, or Economy; nothing is deleted. |

## Accounts

better-auth's own routes (`/api/auth/*`, better-auth 1.7.20) keep its reply shapes (`{ message, code }` on error). `server/src/auth.js` adds these checks:

| Route | What changes |
| --- | --- |
| `POST /auth/sign-up/email`, `POST /auth/update-user` | `name` is cleaned before it's stored (`utils/displayName.js`): control characters (CR and LF included), line separators and bidi overrides become spaces, runs of spaces become one, it's trimmed and cut to 80 characters. Nothing left → 400 `Enter your name.` |
| `POST /auth/sign-up/email` (`password`), `POST /auth/reset-password` and `POST /auth/change-password` (`newPassword`) | The new password must follow the client's rules (`utils/passwordRules.js`): 8 to 128 characters, an uppercase letter, a number and a special character, and none of `/ \ " '`. Otherwise 400 `Use 8 to 128 characters, with an uppercase letter, a number and a special character, and none of / \ " '.` (a refused reset doesn't use up its token). Signing in with an older, simpler password still works. |
| `POST /auth/sign-up/email`, `POST /auth/update-user` (`role`, `isActive`) | Never set here: a sign-up always gets `USER` and active, and `update-user` with `role` → 400. Only the admin routes change them. The session's user (`GET /auth/get-session`) now includes both. |
| `POST /auth/delete-user` | `password` is required (400 without it), and better-auth checks it. A session alone can't delete the account. What happens to the account's maps and photos: see "Leaving". |
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
| Share-code lookups: opening a link (`GET /shared/:code`), and any `/shared/:code/photos…`, `moments`, `passport`, `badges` or `goals` request whose code matches no map or trip | 30 per 15 min (one counter) |
| Browsing an open link (`/shared/:code/photos…`, `moments`, `passport`, `badges`, `goals`) | 300 per 15 min (separate counter) |
| Promo code checks (`GET /promo-codes/:code`) | 30 per 15 min |
| Offer clicks counted (`GET /go/:offerId`; past it the click still redirects, uncounted) | 60 per 15 min |
| Invite accepts | 30 per 15 min (separate counter) |
| Photo presigns | 120 per 15 min |
| Generic uploads (`presign-url` and `confirm-upload` together) | 20 per 15 min |
| Contact form | 5 per 15 min |
| Member invites (`POST …/members`) | 20 per hour |
| Member invites, per signed-in user (maps and trips together) | 25 per 24 hours |
| New maps (`POST /maps`), per signed-in user | 20 per 24 hours |
| Billing writes (`POST /billing/checkout`, `change-plan`, `extra-maps`, `portal`), per signed-in user | 20 per 15 min |
| "Download my data" (every `GET /users/export…` together), per signed-in user | 600 per hour |

- Over the limit → 429 `{ status, message }` with `Retry-After`.
- The whole API also has an in-memory backstop of 1,000 requests per 15 minutes per IP and instance.
- better-auth's routes have their own limits, also in the database (see "Accounts").
- Finished windows are removed by the daily clean-up cron.

## Daily clean-up (cron)

`GET /media-services/cron/cleanup-orphans`, run by Vercel once a day with `Authorization: Bearer <CRON_SECRET>` (401 otherwise). It answers `{ status, data: { checked, deleted, failed, batches, complete, expiredRateLimits, oldEvents, expiredSessions, expiredVerifications, oldInvites, oldStripeEvents } }`.

1. **Purges**, together and each on its own (a failed one is logged and reported as `null`): finished rate-limit windows, events older than 90 days, sessions and verifications past their expiry, invites accepted or expired over 30 days ago, and Stripe webhook event ids recorded over 90 days ago.
2. **Unused uploads**, oldest first, 500 at a time: photo files nothing uses after an hour, other uploads after a day. Never a file a photo or an avatar uses, nor a contact image a form shows. Each batch is one DeleteObjects request per bucket and one row delete. Files that can't be deleted are skipped until the next day. No batch starts 40 s after the request began (the function's limit is 60 s); `complete: false` means some were left for the next run.

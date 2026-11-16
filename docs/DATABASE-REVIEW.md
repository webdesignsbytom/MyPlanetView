# Database design review

A review of [`server/prisma/schema.prisma`](../server/prisma/schema.prisma) (five migrations then, the last being `photo_order`; nine now) against what's built and what [FEATURE-PLAN.md](FEATURE-PLAN.md) plans, before building on it further.

Reviewed 15 November 2026.

## Summary

The schema is sound for what's built. Access, sharing, the default map, invites and deletions are all enforced in the right places, and the indexes match the queries.

Nothing is in production yet, so **every change is free until launch**: no data to move, no downtime. Changes that would be painful later should be made now. In short:

1. **Fix six small things now** (below), the main one being a stable Wikidata key on landmarks before the landmark list grows from 177 to over a thousand.
2. **Change four parts of the planned additions:**
   - keep paid plans in their own tables, not as columns on better-auth's `User`;
   - give `PhotoLandmark` a `mapId` before building the passport;
   - give photos a non-null sort date for slideshows;
   - count ad clicks in their own small table, not the audit log.
3. **Decide six things** that change the tables (at the end).

## What's good

- **Rules the database enforces itself:**
  - one default map per user (`defaultForOwnerId` unique, plus a CHECK);
  - an invite targets exactly one map or trip (CHECK);
  - share codes and invite token hashes are unique;
  - files can't be deleted from under a photo or avatar (`RESTRICT`).
- **Deletes are safe.** Rows go before files, so a failure leaves orphan files for the cron, never a photo pointing at nothing. Every foreign key that a cascade or `SET NULL` follows has an index.
- **Stats are computed, never stored,** so they can't drift.
- **Queries match their indexes.** No `_count`, and the photo lists use keyset paging.
- **Photo order** (the new `countryPosition`/`tripPosition`) renumbers a gallery when a gap runs out, so the positions can't collide.
- **Usage is measured per file** (`MediaItem.bytes`), so storage caps need no backfill.

## Fix now (before launch)

**All six done on 16 Nov 2026** (migration `20261116000000_special_places_checks`, plus the cover fix in `domain/photos.js`). Fix 5 grew into "special places": Antarctica and the four poles (docs/API.md, "Special places").

| # | What | Why | Cost |
| --- | --- | --- | --- |
| 1 | **`Landmark.wikidataId`**, unique, filled from the Q-id comments; `db:reference` upserts by it instead of by `slug` | Every landmark already has its Q-id in a comment. Upserting by slug means a renamed landmark becomes a new row, and the old one (with its photo matches) stays behind (CLAUDE.md warns about this). The planned expansion to over a thousand landmarks also makes slugs from names clash ("Old Town", "Cathedral"), so slugs should include the country (`old-town-tallinn-ee`) | Small migration and loader change |
| 2 | **Trip cover follows its photo:** moving a photo off a trip clears that trip's `coverPhotoId` | Today `updatePhotoInDB` leaves the cover pointing at a photo that's on another trip, or on none. Only deleting the photo clears it (`SET NULL`) | A few lines in `domain/photos.js`, once the photo-order work there is finished |
| 3 | **One traveller per user per map:** `@@unique([mapId, userId])` on `Traveller` | A person is one traveller. Nothing stops linking one account to two travellers on the same map, which would double-count them in per-person stats. Postgres allows any number of rows where `userId` is null, so travellers without logins are unaffected | One index |
| 4 | **CHECK constraints for rules the code already enforces:** a trip's and a stop's end date not before its start; a photo's latitude and longitude both present or both absent, and in range; a `MANUAL` landmark match is confirmed; `User.role` is one of `USER`, `ADMIN`, `DEVELOPER` | They cost nothing, and they catch a bug in a future route or a hand edit in the database. Prisma leaves CHECKs alone on later diffs, as the existing two show | One migration |
| 5 | **Antarctica:** add `AQ` to the country list, drawn as a dot like the micro-states | The continent enum has `ANTARCTICA`, and the planned badges include "Antarctica", but there's no country to mark, so the badge could never be earned | Seed data, both country lists, one map dot |
| 6 | **The `Country.pinX`/`pinY` comment** says the viewBox is 2000 × 1000; it's 2000 × 857 | Misleads whoever reads it next | One line |

## The planned additions, reviewed

FEATURE-PLAN.md's "Database additions (draft)" table, item by item. Where this review changes it, the change is in bold.

### Plans and payments

**Built on 16 Nov 2026** as reviewed below (migration `plans_billing`): `Subscription`, `PlanGrant`, `StripeEvent`, the plan in force computed (`utils/plans.js`), map slots computed (`utils/mapSlots.js`, no stored lock flag), `TravelMap.graceUntil`, `PhotoSize.PRINT`. `PromoCode` and `Profile.promoCodeId` followed the same day (migration `passport_badges_goals_promo`), with `Profile.promoOfferGrantedAt` so a code's offer is given once; the offer was a `PlanGrant`. Migration `promo_first_month` (16 Nov 2026) made the offer the same for every code, a Stripe trial on the first paid Checkout: it dropped `PromoCode.offerPlan`, `offerDays` and the CHECK `promo_code_offer`, and renamed the profile's column `promoTrialUsedAt`.

The draft puts `plan`, `planSource`, `planEndsAt` and `referralCode` on `User`.

- **Keep them off `User`.** better-auth owns that table and reads it on every request (the cookie cache is off). Billing fields don't belong in the session, and one `plan` column can't hold two sources at once: an influencer on a complimentary First Class year who then subscribes has both.
- **Instead, three tables:**
  - **`Subscription`**: user, Stripe customer id, subscription id (unique), price, plan, status, period end, cancel at period end. The webhook writes it.
  - **`PlanGrant`**: user, plan, starts, ends, granted by, reason. The admin page writes it. It's how complimentary memberships are given.
  - **`StripeEvent`**: the Stripe event id as primary key. Stripe retries webhooks, so each event is applied once.
- **The plan in force is computed:** the best of an active subscription and an active grant, else `FREE`. That's one pure function with a test, like the access rules. It's two indexed lookups, and a cached column can come later if it's ever slow.
- **Influencer codes:** a **`PromoCode`** table (code, label, active, limits; the followers' offer is the same for every code, in code), and **`Profile.promoCodeId`** for the code an account signed up with. App fields go on `Profile`, not `User`.

### Whose plan applies

This needs deciding before the upload code changes, because a shared map has two plans: the owner's and the uploader's.

| Rule | Proposed |
| --- | --- |
| Photos per country | **The map owner's**, counted per map (FEATURE-PLAN.md, 16 Nov: the allowance belongs to the map, and its editors share it) |
| Original or print copy | **The map owner's** (decided 16 Nov): every photo on a map keeps the original or the print copy by the owner's plan, whoever uploaded it |
| Editors | Up to 10 per map on every plan (`MapMember` with `EDITOR`); a group trip has its own 20, separate (decided 16 Nov) |
| Ads on a map | The owner's and the viewer's (as planned) |
| Maps per account | The owner's: one included, extra maps paid for (FEATURE-PLAN.md, "Maps") |

So the presign needs only the map owner's plan, one lookup.

### Photos: print copy and videos

- **`PRINT` size:** agreed. Economy photos have no `ORIGINAL`, so code that assumes one ("download the original", the print dialog) must ask for the best copy, `ORIGINAL` or else `PRINT`. One helper.
- **Videos as `Photo.kind` (`PHOTO`/`VIDEO`) with `durationS`:** agreed. Galleries, order, hidden, country, trip and landmarks all work for videos unchanged. `MediaItem.kind` already has `VIDEO`, and `bytes` (an `Int`, up to 2 GB) covers 500 MB files.
- **The caps count by map and country** (decided 16 Nov), which the existing `Photo` index `[mapId, countryCode, countryPosition, id]` serves, so no new index is needed. (The `[uploaderId, countryCode]` index proposed here first is no longer needed.)

### Passport and landmarks

**Built on 16 Nov 2026** as reviewed below (migration `passport_badges_goals_promo`): `isUnesco` (the 1,273 sites loaded), `PhotoLandmark.mapId` with `[mapId, landmarkId]` and `confirmedAt` (CHECK `photo_landmark_confirmed_at`), and `LandmarkCover`, whose foreign key is the match itself (`[photoId, landmarkId]`), so removing the match also removes the choice. `category` is still not stored: stamp shapes come from the landmark's id.

- **`isUnesco`, `wikidataId`:** agreed. `wikidataId` comes now (fix 1).
- **`category`** is in the seed data but isn't stored. Store it if the stamps' shapes or icons should follow it (a mountain, a church, a ruin).
- **Give `PhotoLandmark` a `mapId`,** with an index `[mapId, landmarkId]`.
  - The passport (every stamp on a map, with its earliest photo) and the landmark stat would read one table instead of joining through every photo on the map: a 20,000-photo map joins 20,000 rows today.
  - A photo never changes map, so the copy can't drift.
  - Also add **`confirmedAt`** (when the stamp was earned).
- **`LandmarkCover`** (map, landmark, photo): agreed, with the primary key `[mapId, landmarkId]` and a cascade on the photo, so deleting the chosen photo falls back to the earliest.

### Moments

The draft is good: precision-aware dates, kinds as text, `MomentTraveller`, `MomentPhoto`, and the two indexes.

- Add a CHECK that a dated moment has a precision, and an undated one doesn't.
- `MomentPhoto` cascades on the photo, so deleting a photo removes it from its moments.
- **`CountryVisit.notes` stays** (decided 16 Nov): the country's one note ("I want to visit here"), shown in the country panel; moments are separate events.

### Badges, goals, challenges and themes

**Built on 16 Nov 2026:** `BadgeAward` and `Goal` as below, with awards made when the map's badges or goals are loaded by the owner or an editor. `Goal` keeps explicit columns (`target`, `countryCodes`, `region`) instead of a settings JSON, held to its kind by a CHECK (`goal_shape`). Friends challenges and themes are phase 2.

- **`BadgeAward`** (map, badge key, earned at): agreed, with the primary key `[mapId, badgeKey]`. Award with "insert, or do nothing if it's there", so two requests can't award a badge twice.
- **When badges are checked:**
  - The plan checks after every upload, visit change and landmark confirmation. A batch of 100 photos would recount the whole map 100 times.
  - Instead, compare the earned badges with the stored ones **when the map loads**, and once after each batch. Awards are never taken back, as with real badges.
- **`Goal`:** agreed. The settings JSON gets validated like `mapSettings`.
- **Friends challenges** (phase 2):
  - invites reuse `ShareInvite`, with a `challengeId` and its CHECK widened to "exactly one of map, trip or challenge" (`num_nonnulls(...) = 1`);
  - counting by date needs an index on the photos' dates (next section).
- **`PhotoTheme` and `PhotoThemeEntry`:** agreed.

### Slideshows and photo dates

**Built on 16 Nov 2026:** `Photo.shotAt` with `[mapId, shotAt, id]`, backfilled, and kept equal to `takenAt ?? createdAt` by `domain/photos.js` (not by a CHECK: the two timestamps are written in one statement but a CHECK on equality would be fragile).

- The worldwide slideshow plays every photo on a map by date taken. That's the one photo order with no index: the old `[mapId, takenAt]` was dropped as unused in the audit.
- `takenAt` is empty for photos with no EXIF date, which makes paging by date awkward.
- **Add `Photo.shotAt`:** not null, `takenAt` when known, else the upload time, kept in step when `takenAt` is edited. Index it as `[mapId, shotAt, id]`.
- Friends challenges and dated goals ("the first photo in each country") use the same column.

### Ads and the Travel Desk

**Built on 16 Nov 2026** (migration `travel_offers`): `AffiliateOffer`, imported by a unique `key`, and `OfferClickDaily` (offer, UTC day, placement, count), added to with one `INSERT … ON CONFLICT DO UPDATE` per click. The client reads every live offer once (`GET /api/offers`, cached 5 minutes) and picks cards itself, so choosing one sends nothing about the viewer.

- **`AffiliateOffer`:** agreed. It's a small table, so it can be read once and cached.
- **Ad clicks:**
  - The plan records each click as an `AppEvent`. That table is the audit and error log: clicks would bury the admin page and be deleted after 90 days.
  - **Count them in an `OfferClickDaily` table** (offer, day, placement, count), adding one per click. It stores no person and no time of day, which keeps the no-tracking promise easy to show.

## Hosting the database yourself

Self-hosting Postgres (with the API on Vercel) brings two needs a provider would cover:

- **A connection pooler.** Each Vercel function instance opens its own connections (`DB_POOL_MAX`, 5 by default), so a busy hour can exhaust Postgres's `max_connections`. Run PgBouncer in transaction mode in front of Postgres; `DATABASE_URL` points at PgBouncer, `DIRECT_DATABASE_URL` at Postgres for migrations (CLAUDE.md, "Database connections"). The adapter's unnamed statements work through it.
- **Backups:** scheduled dumps kept off the server, and one restore tried before launch.

## Optional before launch

**Squash the migrations into one `init`.** There are five, and nothing in production has run them.
- **For:** one clean starting point.
- **Against:** your local database would need resetting (`npx prisma migrate reset`, which you'd run).

Worth doing once, just before the first production deploy, not now.

## Decisions needed

1. ~~**Whose plan applies**~~ **Decided (16 Nov):** the map owner's, for originals, photo caps and ads alike.
2. ~~**People who can add photos**~~ **Decided (16 Nov):** 10 editors per map on every plan; group trips have their own 20 people, separate, and their photos use the organiser's allowance.
3. ~~**Moments replace the country note**~~ **Decided (16 Nov):** both stay: a note per country, and moments for events.
4. ~~**Antarctica as a country**~~ **Decided (15 Nov):** Antarctica (drawn as a real shape, with a setting to hide it) and the four poles are "special places", counted apart from countries.
5. ~~**Leaving and transfers**~~ **Decided (16 Nov):** transfer ownership (owner and admin); deleting an account asks about each owned map (hand it over or delete it) and whether to leave photos on other people's maps (default: leave them); a map that becomes a paid extra map through a transfer gets 60 days' grace (FEATURE-PLAN.md, "Transferring a map, and leaving").
6. ~~**Ad clicks**~~ **Decided (16 Nov):** a daily tally per offer and placement (`OfferClickDaily`), not the audit log.

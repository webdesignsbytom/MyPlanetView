# My Planet View: feature plan

What comes after the port, and how it pays for itself. [SITE-DESIGN.md](SITE-DESIGN.md) records what is built; this file is what's planned. When a feature here is built, move its decisions into SITE-DESIGN.md.

Last updated: 19 November 2026.

## Build status

- **Built (16 Nov 2026):**
  - the three plans with Stripe (Checkout, plan changes, the billing portal, the webhook);
  - complimentary memberships, given from the admin users page;
  - one included map plus paid extra maps, with unpaid maps locked;
  - the per-map limits: photos per country, the Economy print copy, the storage safety net;
  - 10 editors per map and 20 people per trip;
  - transferring a map (owner and admin, with 60 days' grace);
  - the leaving choices;
  - the Pricing page and the account's "Your plan" card;
  - group trips' "Add to my map", moments with the timeline and map marks, and the country notes box (server, app, mock and tests);
  - the map data audit: ~300 missing islands and misplaced coasts from Natural Earth, and Andorra, Gibraltar and Kiribati (227 countries);
  - the country-page framework, and the first 20 guides, passed by the user and marked checked on 16 Nov (published with the next build);
  - the passport, with the 1,273 UNESCO World Heritage Sites loaded (1,332 landmarks); slideshows (worldwide, country, trip; by date taken or shuffled); site badges and personal goals; influencer codes (every follower's first month free on the paid plan they choose, as a Stripe trial with a card) and an admin page.

  The rules as built are in SITE-DESIGN.md ("Plans and limits") and API.md. Decisions waiting on the user are in [WAITING-ON-YOU.md](WAITING-ON-YOU.md).
- **Phase 1, the rest built (16 Nov 2026, evening):**
  - ads and the Travel Desk, with example offers (fictional partners) until real partners' offers are imported in the same file format;
  - First Class videos in Cloudflare Stream, end to end: the server, the app (a resumable upload straight to Stream, "Preparing…" until it's converted, HLS playback with hls.js where the browser has no HLS of its own), the mock and the tests;
  - the installable app, version 1 (online only);
  - "Download my data" on the account page (docs/API.md "Your data"), which the Pricing page promised;
  - a Wikimedia Commons photo for 1,331 of the 1,332 landmarks.
- **Phase 2, started (16 Nov 2026, evening):** "Print or download", version 1 (see "Printing"; docs/API.md "Downloads"): a country's, a trip's or the whole map's best copies as a zip made in the browser, for editors, then the print partner's link, imported like any travel offer (an example printer until one is chosen). Monthly photo themes (see "Monthly photo themes"; docs/API.md "Photo themes"): the admin page, the albums in the badges panel, entering from the photo viewer and the theme badges, with an example year in development until the real one is written. Friends challenges (see "Friends challenges"; docs/API.md "Friends challenges"): start one, send its link, each friend picks the map that counts, a leaderboard of names and counts. Each plan's passport cover (16 Nov): the map owner's plan picks it. The next 20 country guides, drafted (16 Nov): the popular countries that have a poster (United Kingdom, Belgium, Austria, Czechia, Poland, Hungary, Denmark, Norway, Sweden, Finland, Malta, Cyprus, India, Indonesia, South Korea, China, South Africa, Kenya, Brazil, Argentina), waiting for the user's proofreading (WAITING-ON-YOU.md).
- **Phase 3, started (16 Nov 2026, night):** the twelve "Where to go in <month>" pages, as drafts until the user passes their introductions (see "Country pages"); per-traveller badges (see "Badges and goals"); moments on landmark cards and passport stamps, and as cards in the slideshows (see "Moments"); stamped landmarks gold on the map, and the stamp photo picker finding a landmark's photos placed in another country (see "The passport"); moments pinned to their exact spot, each pin shown to the people the map is shared with only when its owner says so (see "Moments").
- **Phase 1, what's left is the user's** (WAITING-ON-YOU.md, LAUNCH-CHECKLIST.md): joining the travel partners; the influencer outreach; the brand's icons; and trying everything for real (R2, Stream, Stripe, phones).
- **Couples and families (19 Nov 2026; see "Couples and families" below):** built the same day: the co-owner role, invites that sign people up and verify them in one step, editors down to 5 (server, app, mock and tests; docs/API.md "Co-owners"). Three free maps per account, each extra map paid for upgrading one (the owner chooses which), built the same evening (docs/API.md "Map limits"). The invite offer (half price for 3 months, the same saving off a year) too (docs/API.md "The invite offer"). The terms and Pricing page say so; someone qualified should read them before payments go live.

- **A map's own design (21 Nov 2026, the user's wish; docs/API.md "Map designs"):** other sites charge for map looks; here it's free on every plan, and it took the place of First Class's "extra map styles" (never built, so taken off the Pricing page). The owner (and co-owners) put a picture of theirs on the sea, one per map (a new one deletes the old), give any country its own colour, and pick the colours of the country names and grid lines in case their colours make them hard to read. One design per map, shown to everyone who opens it, share links too, in place of their own style. The user's view on offensive pictures: nobody looks at people's maps, and the people they show them to take that risk; the site's only duty is the one it has for photos on share links already (act when told about something illegal). Built the same day: server (`MapDesign`, migration `20261121120000_map_designs`), Settings' "How it looks", the mock and tests.

- **Share cards, your year in travel, and gifts (21 Nov 2026, the user's wish: the business review's sales ideas 3, 4 and 6, built before the Christmas season):** a share card of the map from the statistics panel (a picture made in the browser, for Instagram and WhatsApp); "Your year in travel", a year's slides ending on its share card, offered by a tag on the map in December and January (docs/API.md "Year in travel"); and gifts of a year of Business or First Class, paid once with Stripe, redeemed with a code for a complimentary year (docs/API.md "Gifts"). The terms gained a "Gifts" section (1.2.0, drafted: a refund within 14 days if not redeemed, no expiry, not for cash), to be reviewed with the rest of the payment terms.

- **Importing from Polarsteps (21 Nov 2026, the user's wish: the business review's "Build an importer"):** `/import` reads the person's own Polarsteps download in the browser (the zip, a file at a time, or the unzipped folder) and brings the chosen trips (with stops), their photos and each step's story (a moment) to a map, every item keyed so nothing comes twice (docs/API.md "Importing from Polarsteps"). The download's layout comes from open-source readers of it, as Polarsteps doesn't document it: try it with a real download before launch.

- **Collecting and "On this day" (21 Nov 2026, the user's wish: the business review's ideas 6 and 7):** a "been here" tick on every landmark (photo or not) makes each country's ticket a checklist and the statistics count "World Heritage Sites: 23 of 1,273" (docs/API.md "Collecting"); "On this day" emails send a photo taken on this day in an earlier year, at most once a week, with an unsubscribe link and one-click header, and the account page's "Emails we send" switches them off (docs/API.md "Emails").

- **Selling points, richer stats, family extras and give a month, get a month (21 Nov 2026, the user's wish, from "what else can we do to compete"):** the About, FAQ and Pricing pages say "no followers, no public profiles", "the map is the album", and how this differs from Polarsteps (named only in the FAQ and the Pricing page's import line; the home page is the poster alone, so its search description carries the first). The statistics add the share of the world's countries, days away and the distance on completed trips (home and back), and the place furthest from home, from a "Home" each map can set in Settings, else a traveller's birth country (docs/API.md "Stats"). Each traveller on a family's map has their own passport (their trips, photos and moments; "Whose passport"), moments gain "First trip" and "Anniversary", and a moment dated to the day comes round: a tag on the map that day, and the "On this day" email sends it before any photo (docs/API.md "Moments", "Emails"). Each member has an invite link: the friend's first month free, and the member's when the friend first pays, as Stripe credit or a month of Business, up to 12 a year (docs/API.md "Give a month, get a month"; the terms' "Invite a friend", 1.3.0).

## Agreed so far

| Idea | Decision (14 Nov 2026) |
| --- | --- |
| Tiers | Three: **Economy** (free), **Business** (£4.99 a month) and **First Class** (£9.99 a month), with yearly prices. |
| What sells it | The features and the style: the map, the passport, private sharing. Never gigabytes. |
| Ads | Travel affiliate cards in photo galleries, on Economy maps and (fewer) for non-paying viewers of Business maps. Paying members never see them; First Class maps show none to anyone. |
| Travel Desk | A button that opens travel offers when someone asks: on every tier, so paying members can earn the site commission too. |
| Photos on Economy | No originals, but a print-quality copy, so printing works on every tier. |
| Videos | First Class only. |
| Always free | Sharing, unlimited viewers, the passport, challenges, slideshows and country pages: they're what make people share. |
| Playlists | Slideshows of the map's own photos: worldwide and per country. Private, like the rest of the map. |
| Landmark book | A passport: a stamp per landmark visited, with its photo. |
| Challenges | All four kinds: site badges, personal goals, friends challenges, monthly photo themes. |
| Cultural and seasonal info | Public country pages that search engines index, with a summary in the app. |
| Printing | An affiliate link to a print company first; ordering through the site later. |
| Promotion | Influencers who promote the site get two years free; their followers get their first month free with the creator's code (16 Nov). |
| Installable app | A PWA (15 Nov): installable from the browser, online only at first. No app store, no Next.js. |
| Moments | Life events and notes on a country or landmark, e.g. "Had a baby in Canada" (15 Nov). Free on every tier. |
| Maps you own | (16 Nov) Every plan includes 1 map, and any account can pay for more, with no limit: £3.99 a month (£39 a year) on Economy and Business, £5.99 (£59 a year) on First Class. An extra map gets the owner's plan limits. Maps shared with you are free and never count. **Changing (19 Nov, to build):** every account owns up to 3 maps free, the main one on its plan and the others on Economy's limits; each extra map paid for is one more map on the plan (see "Couples and families"). |
| Photo allowance | (16 Nov) Belongs to the map, not to each uploader. Every map you own gets your plan's full allowance; nothing is split between maps. |
| Editors | (16 Nov) Up to 10 editors on any map, on every tier: the family adds photos to the owner's map with their own logins. Viewers and share-link visitors are unlimited. **Changing (19 Nov, to build):** up to 5 editors, with co-owners counted apart. |
| Co-owners | (19 Nov, to build) A partner or the other parent gets their own login and every power the owner has on that one map except deleting it, handing it over, paying for it and removing a co-owner. One login per person, never shared. |
| Invite offer | (19 Nov, to build) Someone who signs up from an invite to a Business or First Class map gets that plan at half price for their first 3 months, if they subscribe within 7 days. Never on top of a promo code. |
| Children | (16 Nov) Under 13: no account, but they can be travellers on a map. 13 to 17: an account with a parent's or guardian's permission, so teenagers can be editors. The terms say so. |
| Group trips | (16 Nov) A trip can be shared between people's accounts: everyone on it adds photos, and each can add the trip to their own map. Up to 20 people per trip, separate from the map's 10 editors. Their photos use the organiser's map allowance. |
| Transferring a map | (16 Nov) An owner can make someone else the owner (e.g. Mum, when Dad's email is no longer used), and an admin can do it when the owner can't (a death, a lost email). |
| Country notes and moments | (16 Nov) Both: each country keeps one note ("I want to visit here"), and moments are events ("We saw a volcano", "We had our baby in Paris"). |

## The pitch

What makes the site different. It should be said everywhere a visitor is deciding: the home page, About, FAQ, Pricing, sign-up and the country pages' "Start your map" box.

- **Private by default.** Photos are seen only by the people you add or give the link to: Google Docs sharing for a travel album.
- **Not a social network.** No followers, likes or algorithm, so nothing has to be perfect. The blurry, rainy, wrong-turn photos are the memories.
- **Your world, filling in.** Every photo colours your map and stamps your passport.
- **Free, without tracking.** Economy is paid for by travel offers chosen from the country you're looking at. Nothing about you or your photos is sent to advertisers.

Headline ideas: "Real trips, not perfect photos." "Your travels. Your people. Nobody else."

**The Pricing page sells the features and the look, not storage.** People will compare a paid plan with plain photo storage, which costs a couple of pounds a month for far more space. Lead with the map, the passport, private sharing and the style; the photo limits are a line in the table.

## How the site earns

| Source | When | Notes |
| --- | --- | --- |
| Business and First Class | Launch | The steadiest income. |
| Ad cards in galleries | Launch | Affiliate links: paid per booking, not per view. |
| Travel Desk | Launch | The same affiliate links, opened on request. Paying members use it too, so the site can earn twice from them: the membership and the booking. |
| Print affiliate link | After launch | Small commission per order. |
| Ordering prints through the site | Later | You set the price and keep the margin; needs checkout and order handling. |

Affiliate income stays small until the country pages bring visitors, so the memberships carry the site at first.

## Tiers: Economy, Business and First Class

| | Economy | Business | First Class |
| --- | --- | --- | --- |
| Price | Free | £4.99 a month or £49 a year | £9.99 a month or £99 a year |
| Maps you own | 1 included; each extra map £3.99 a month or £39 a year (to build: 3 free) | 1 included; each extra map £3.99 a month or £39 a year (to build: 3 free, 2 of them on Economy's limits) | 1 included; each extra map £5.99 a month or £59 a year (to build: 3 free, 2 of them on Economy's limits) |
| Photos per country, on each map | 30 | 200 | 1,000 |
| Best copy kept of each photo | A 2,400 px print copy | The untouched original | The untouched original |
| Videos | No | No | Yes |
| Ad cards in galleries | Shown to everyone viewing your maps | You never see them; non-paying people viewing your maps see fewer | None, for anyone viewing your maps |
| Editors on each map (people besides the owner who can add photos) | Up to 10 (to build: 5, plus co-owners) | Up to 10 (to build: 5, plus co-owners) | Up to 10 (to build: 5, plus co-owners) |
| Extras | The red and gold Economy passport cover; the map's own design (free on every plan, below) | A navy and silver Business Class passport cover | A black and gold First Class passport cover; a print discount once printing goes through the site |
| Storage safety net, on each map | Not needed | 50 GB | 200 GB |

**Every tier gets:**
- sharing, with unlimited viewers and share links;
- every map other people share with you, free: they never count as maps you own;
- the passport, challenges, slideshows and country pages;
- the Travel Desk;
- "Download all my photos". UK data protection law (GDPR) lets people get a copy of their own data free of charge, so it can't be a paid perk.

**In the code** the plans are `FREE`, `REGULAR` and `PREMIUM`. Their display names, prices and limits live in one constants file, so renaming a tier never touches the database.

### Photos per country

- **What counts:** the photos on that map in that country, whoever added them. The owner and the map's editors share the map's allowance, which follows the owner's plan; an editor's own plan adds nothing to it. So ten editors on a free account's map still share 30 photos of France, and the owner's plan pays for the storage. (This replaces the current rule that usage counts against the uploader.)
- **Each map has the full allowance.** Nothing is split: a Business owner with a family map and a personal map can keep 200 photos of France on each.
- **Hidden photos count;** deleting one frees the space.
- **At the cap,** uploading for that country says "30 of 30 photos of France", with an upgrade button. It bites first in the countries people visit most, often their home country, which is where the upgrade prompt will appear.
- **Where it's checked:** when an upload is presigned and again at confirm-upload, the tier hooks already in SITE-DESIGN.md.
- **A cheap lever.** Raising Economy's cap costs very little: 50 per country is a few pence a month even for a heavy user.

### Which copies each tier keeps

Every tier still keeps three files per photo; Economy's third file is a print copy instead of the original.

| File | Economy | Business and First Class |
| --- | --- | --- |
| Thumbnail, ~400 px (WebP) | Kept | Kept |
| Display copy, ~1,600 px (WebP) | Kept | Kept |
| Print copy, ~2,400 px (JPEG, location removed, ~1 MB) | Kept | Not needed: the original serves |
| Original, untouched (with its location) | Not kept | Kept |

- **The print copy prints well up to about A4.** At 2,400 px that's 6 × 4 in at 400 dpi, 8 × 6 in at 300 dpi and A4 at about 205 dpi: enough for normal prints and photobook pages. The 1,600 px display copy alone would go soft beyond about 7 × 5 in.
- **It's JPEG** because many print shops don't accept WebP.
- **It's made in the browser** with the other two copies, so it has no location data. The original is never uploaded.
- **Originals are for posters, canvases, cropping, re-editing and a true backup.** That's the honest reason to upgrade.
- **Upgrading doesn't bring back originals** of photos uploaded on Economy; their print copies stay. The upload screen says so: "Economy keeps a print-quality copy (good up to A4). Business keeps your full-size originals."
- **Coordinates** are still saved in the database for the owner and editors, as now.

### Ads by tier

What decides it is the plan of the map's owner and of the person looking:

| Who's looking | On an Economy map | On a Business map | On a First Class map |
| --- | --- | --- | --- |
| A Business or First Class member | None | None | None |
| Anyone else (Economy members, people with the link) | A card every 12 photos | A card every 24 photos | None |

Friends viewing a Business member's map aren't paying, so they see some ads, but fewer, so their experience isn't spoiled. The card details are under Ads below.

### Maps

**Changing (19 Nov 2026, to build):** three free maps per account, editors down to 5, and co-owners. The rules below are what's built; "Couples and families" below is what replaces them.

An **account** is one person's login. A **map** is one world map with its countries, trips and photos. One login can own maps and be added to other people's, and the map switcher (the map's name at the top of the map page) flips between them: "Your maps", then "Shared with you" and "Trips shared with you".

**The rules:**
- **The plan belongs to the person who owns the map,** and pays for it: its photo allowance, its storage, its ads.
- **Every plan includes 1 map,** and any account can pay for more. An extra map gets the owner's plan, and costs:

  | Owner's plan | Extra map, monthly | Extra map, yearly |
  | --- | --- | --- |
  | Economy | £3.99 | £39 |
  | Business | £3.99 | £39 |
  | First Class | £5.99 (it keeps videos, so it uses more storage) | £59 |

  The yearly prices are ten months for the price of twelve, like the plans. An extra map is billed on the same schedule as the plan (monthly or yearly); an Economy account chooses either.
- **An Economy account buying a map** keeps Economy's limits on both (30 photos per country each, print copies, ads). It's the cheapest first payment: £3.99 from someone who would otherwise pay nothing, and they meet Business once a country fills up.
- **No limit on how many maps** someone pays for. The existing 20-new-maps-a-day limit stays, against abuse.
- **Every map gets the plan's full limits:** photos per country, storage safety net, 10 editors. Nothing is split between maps.
- **Maps shared with you are free** and unlimited, whatever your plan.
- **Editors:** up to 10 on any map, on every tier. Each has their own login and adds photos to the owner's map, using the map's allowance. Viewers, and visitors with the share link (no login needed), are unlimited.

**Examples:**

| Who | Maps they own | Maps shared with them | Pays a month |
| --- | --- | --- | --- |
| Sam, travels alone | "Sam's travels" (Economy) | None | £0 |
| Sam wants a family map as well, and stays on Economy | Economy: "Sam's travels" plus "The Smiths" as an extra map, both with Economy's limits | None | £3.99 |
| Sam later fills up France and upgrades | Business: both maps get Business limits | None | £4.99 + £3.99 = £8.98 |
| Jo, First Class, with a solo map and a couple's map | First Class: one included, one extra | None | £9.99 + £5.99 = £15.98 |
| Dad, family of five | "The Smiths" (Business); Mum and three teenagers are editors (4 of 10) | None | £4.99 |
| Mum, an editor on Dad's map | Optionally her own "Girls' trips" (Economy) | "The Smiths" | £0 |
| Grandma | None, and no account | Opens the family map's share link | £0 |

### Group trips

A trip can be shared between people's accounts (decided 16 Nov). Example: Tom has had his map for years and goes on a stag do with eleven friends; they all add their photos to the one trip.

- **Who's on it:** the organiser's trip, on the organiser's map. People are added to the trip by email, as editors or viewers, as trips already allow (`TripMember`). Up to **20 people per trip**, on every plan, separate from the map's 10 editors, so family editors and the stag do never compete for places.
- **Where it shows:** "Group trips" in everyone's map switcher (today's "Trips shared with you").
- **On your own map:** each person on the trip can press **Add to my map**. The trip then shows in their own map's trips, and when it's completed its countries are marked visited on their map too (`TRIP` visits). Nothing is copied: the photos stay in the one trip.
- **Photos use the organiser's map allowance** (30 photos of Czechia on a free map), so a busy group trip nudges the organiser to upgrade.
- **Leaving:** taking the trip off your map, or leaving the trip, keeps the countries already marked on your map (visits are never taken back).

### Transferring a map, and leaving

- **Transfer ownership** (decided 16 Nov): the owner makes someone else the owner, usually an editor already on the map ("Make Mum the owner"). The old owner stays on as an editor unless they leave. The map's plan becomes the new owner's.
- **Admin transfer:** when the owner can't do it themselves (a death, a lost email address), an admin moves the map from the admin page after checking off the site, as other services handle bereavement.
- **Changing an account's email** already exists for someone who can sign in.
- **Leaving** (decided 16 Nov; today's code does otherwise until it's built):
  - deleting an account asks about each map it owns: hand it to someone, or delete it (today: maps with editors pass to the longest-standing editor, the rest are deleted);
  - an editor deleting their account is asked whether to leave their photos on the maps they added them to, with "leave them" as the default, since they use the map's allowance (today: they're deleted);
  - a map that becomes someone's extra map through a transfer stays fully usable for 60 days before it needs paying for.

### Children and editors

- **Under 13: no account.** A parent lists them as travellers on the family map (a first name is enough) and adds photos for them.
- **13 to 17: an account with a parent's or guardian's permission,** so teenagers can be editors on the family map. The owner who adds an under-18 as an editor confirms they're the parent or guardian, or have that person's permission.
- **Editors see everything on the map,** including where each photo was taken (the exact location is editor-only), so owners should only add children to maps they're happy for them to see in full.
- **Sign-up** asks people to confirm they're 13 or over, together with the terms (an unticked box, done 16 Nov 2026).
- **The terms and privacy policy** say all of this (`client/src/utils/data/termsData.js`, "Children on a map" and "Children", 16 Nov 2026).
- **The UK Children's Code** (the ICO's Age Appropriate Design Code) applies to a service teenagers use: high privacy by default, no nudging, location off by default, no profiling. The site is already private by default and shows locations only to editors; do the code's self-assessment before launch (LAUNCH-CHECKLIST.md).
- **Later, if asked for:** child logins a parent creates and manages, without an email address.

### Taking your travels with you (built 19 Nov 2026; docs/API.md "Travel copies")

A child who grows up and starts their own solo map can bring their share of the family map with them. Decided by the user on 19 Nov 2026:

- **Copied, not linked:** the photos, trips and moments become theirs for good, so changes to the family map, or its deletion, never take them away. The family map keeps everything too.
- **The owner approves:** the child (signed in, on the family map in any role) asks, saying which of its travellers they are, and the family map's owner (or a co-owner) approves, since the photos are the owner's uploads. A traveller linked to someone else's account can't be chosen.
- **Choosing what comes across:** by trip (the trips they went on, `TripTraveller`), by country, or photo by photo. The moments about them (`MomentTraveller`) and their photos are offered too, as are the countries those trips visited, with their first-visit dates, and the passport stamps from the copied photos.
- **Edited afterwards:** the copies are ordinary photos on their own map, so they remove any they aren't in.
- **Plan limits apply** on their map, as for any upload: an Economy account takes up to 30 photos a country and is offered an upgrade for the rest.
- **It can be done again,** for family trips after they've left home.
- **Real copies of the files:** R2's server-side copy, under new keys on their map, so each photo has its own files and deleting one never touches the other (decided 19 Nov 2026). Storage for the copies costs a few cents a month.
- **Only the child starts it:** a parent can't hand the travels over unasked (decided 19 Nov 2026).
- **As built:** hidden photos and moments stay behind, and so do videos (their files are in Cloudflare Stream, not R2); a copied moment's exact spot is private on the new map until they share it; a country's first visit on the new map comes from the copied photos and completed stops, never the family's own first visit (which may be before the child was born). Where to find it: Settings, "This map", "Bring your travels" (the person asking), and a luggage tag on the family map plus the same section (the owner).

### Upgrades and downgrades

- **Upgrading** takes effect as soon as Stripe confirms payment. Switching between Business and First Class is prorated by Stripe.
- **Downgrades never delete anything** (the existing rule):
  - countries over the new cap can't take new photos;
  - originals already kept stay; new uploads keep a print copy;
  - videos stay viewable, but no new ones can be added;
  - ads follow the new plan.
- **Changing plan keeps extra maps:** they take the new plan's limits and price (an extra map on a Business account that drops to Economy stays, at £3.99 with Economy's limits; one that moves to First Class becomes £5.99).
- **Extra maps that aren't paid for** (cancelled, or a payment fails) are never deleted either. They stay viewable and shareable, but take no new photos until they're paid for again. The owner picks which map stays fully active (their first map until they choose).
- **Adding or removing an extra map** changes the Stripe subscription's quantity, prorated.

### Free rules from launch

The tier rules, including the Economy print copy, start the day the site launches. If Economy launched keeping originals with no cap, adding limits later would mean deleting people's originals or keeping two sets of rules forever.

### Complimentary memberships

- **Granting one:** an admin page gives an account a plan for a set time without payment (1 to 36 months), e.g. First Class for 24 months.
- **When it ends,** the account drops to Economy unless they subscribe. Nothing is deleted (the downgrade rules apply).
- **The first use is influencers:** a few travel creators who promote the site (see Getting the word out). It can also go to testers or as an apology.
- **Cost:** a complimentary First Class account costs at most a few dollars a month in storage, and usually pennies.

### Payments

- **Stripe Checkout plus the Stripe customer portal,** monthly and yearly. A webhook sets the account's plan. NextDummy had Stripe checkout and webhook code to reuse.
- **Extra maps are one line on the same subscription,** with a quantity (the number of extra maps), so the account pays once a month or once a year. An Economy account with an extra map has a subscription that holds only that line. Making or deleting an extra map changes the quantity; Stripe prorates it.
- **Promote the yearly prices.** Stripe takes roughly 20p plus a small percentage per payment (check its current UK rates). That's about 5.5% of a £4.99 monthly payment, but under 2% of a £49 yearly one.
- **VAT:**
  - if you're VAT-registered, the prices include VAT;
  - selling to people in the EU means EU VAT from the first sale.
- **Refunds** (decided 16 Nov 2026, the user's choice): in full within 14 days of the first payment for a plan or extra maps (after a promo code's free month, from the first charge), none after that; cancelling ends the plan at the end of the paid period. Made by hand in Stripe's dashboard. Deleting an account cancels its subscription at once (built the same day). The terms say all of this (`termsData.js`, "14 days to change your mind").

  Check both with an accountant. A merchant-of-record payment provider such as Paddle handles VAT for you, but takes a bigger cut.

### Cost check

Cloudflare R2 charges **$0.015 per GB a month**. The first 10 GB a month are free, and downloads cost nothing (checked 14 Nov 2026; see [R2 pricing](https://developers.cloudflare.com/r2/pricing/)). Per-request charges are tiny at this scale: $4.50 per million writes and $0.36 per million reads, with 1 million and 10 million free each month.

| Case | Storage | Cost a month |
| --- | --- | --- |
| Economy user, 30 photos in each of 20 countries (~1.4 MB a photo including the print copy) | ~840 MB | about 1p |
| Business user at the 50 GB safety net (about 10,000 photos with originals) | 50 GB | ~$0.75 |
| First Class user at the 200 GB safety net | 200 GB | ~$3.00 |
| An extra Economy map, 30 photos in each of 20 countries (it earns £3.99) | ~840 MB | about 1p |
| An extra map at the Business safety net (it earns £3.99) | 50 GB | ~$0.75 |
| An extra map at the First Class safety net (it earns £5.99) | 200 GB | ~$3.00 |

Most people will use far less, so the prices are about value, not cost.

A later saving: R2's Infrequent Access class costs $0.01 per GB a month and suits originals, which are rarely opened. It adds a fee each time a file is read and bills each file for at least 30 days.

## Couples and families: co-owners, free maps and the invite offer

Decided with the user on 19 Nov 2026; not built yet. When it's built, move the rules into SITE-DESIGN.md and docs/API.md, and rewrite "Maps" and the tiers table above.

**One login per person.** An account is one email address and one password, and two people never share one. A shared login would give a partner the other's solo maps, account, billing and password, and every photo would look like one person's. Each adult has their own account. Children under 13 are travellers with no login (see "Children and editors").

### Roles on a map

| | Viewer | Editor | Co-owner | Owner |
| --- | --- | --- | --- | --- |
| Sees the map | ✓ | ✓ | ✓ | ✓ |
| Countries, notes, trips, photos, videos, moments, pins, goals, travellers | – | ✓ | ✓ | ✓ |
| The map's name, kind (solo, couple, family) and UK split | – | – | ✓ | ✓ |
| Sharing: adding and removing editors and viewers, the share link | – | – | ✓ | ✓ |
| Removing a co-owner | – | – | – | ✓ |
| Deleting the map, handing it to someone, paying for it | – | – | – | ✓ |

- **Co-owner is for the people the map is about:** a partner, the other parent. Editor stays for helpers, such as a friend adding photos.
- **Every co-owner is one of the map's travellers,** with their own login. Adding one asks which traveller they are, and links that traveller to their account (today only the owner's own traveller is linked, at sign-up). So a solo map has no co-owners, a couple's map one, and a family map up to one fewer than its travellers (at most 19).
- **Limits:**
  - co-owners don't count towards the editors;
  - editors go down from 10 to **5** per map (members plus pending invites). A map that already has more keeps them, but can't add another until it's under 5;
  - viewers stay unlimited;
  - a trip keeps 20 people of any role.
- **The look stays each person's own.** Map style, landmark pins, the sea and the banner are already chosen per account, so a co-owner never changes the owner's.
- **The map runs on the owner's plan,** whoever is looking. A co-owner's own plan doesn't change it.
- **Leaving:** a co-owner can leave at any time; only the owner removes one. If the owner deletes their account, the map passes to a co-owner first (today: the longest-standing editor), and from then on runs on the new owner's plan.

### Inviting someone

1. The owner or a co-owner adds them by email in the share dialog, or from that traveller's row in Settings. They choose the role, and for a co-owner, which traveller this is.
2. An address with an active, verified account becomes a member at once, and gets a "you've been added" email. Any other address gets an invite email, as now (`ShareInvite`, which now also carries the co-owner role and the traveller).
3. The invite's link opens sign-up with the address filled in and fixed, and the traveller's name as the name.
4. **Signing up from the invite link verifies the address.** Only that inbox received the link, which is what a verification email proves. The same step accepts the invite and links the traveller, so there's no second email.
5. They land on the shared map, with a note that their own map is under "Your maps". Their own map's set-up (`/welcome`) waits until they open it.
6. Signing up later with the same address, without the link, still works as it does now: the invite is accepted once the address is verified.

Being on someone else's map never uses one of your own 3 maps.

**Example:** Jo is on First Class, with a couple's map for Jo and Alex. Jo invites Alex as co-owner and as the traveller "Alex". Alex opens the email, signs up from the link and lands on the First Class couple's map as co-owner. Alex also has their own map, on Economy, which they can upgrade by paying for a plan.

### Maps you own: 3 free, then pay per map

- **Every account can own 3 maps without paying.** The main map runs on the account's plan; the other two run on Economy's limits (30 photos per country, print copies, ads).
- **Each extra map paid for is one more map on the account's plan,** at today's prices: £3.99 a month or £39 a year on Economy and Business, £5.99 or £59 on First Class. Paying for one upgrades an Economy map to the plan, or starts a 4th map.
- **An upgrade takes a map to the account's plan,** never higher. Someone on Economy who wants a First Class couple's map makes it their main map and takes First Class.
- **More maps than the account allows** stay viewable and shareable but take no new photos, as unpaid maps do now. This happens when payment stops, or when a map passes to someone who already has 3. Nothing is deleted. A map handed over still gets 60 days' grace.
- The 20-new-maps-a-day limit stays, against abuse.

### The invite offer

- **Who gets it:** a new account made from an invite to a **Business or First Class map**. It goes by the map's plan (the owner's), whoever sent the invite. An Economy map gives no offer.
- **What it is:** **half price for the first 3 months** on that plan, or a lower paid one, for a subscription started within **7 days** of signing up.
- **Once per account,** and only for accounts made from an invite. Someone who already had an account and is added to a map gets none.
- **Never on top of another offer:** an account gets one introductory offer. A promo code typed at sign-up wins (its free month, or its plan for life), and then there's no invite offer.
- **Yearly plans get it too** (confirmed by the user, 19 Nov 2026): the same saving as 3 half-price months, taken off the first year. That's about £15 off First Class (£84.01 instead of £99) and £7.50 off Business (£41.50 instead of £49). Stripe's "half price for 3 months" coupon halves every bill in those 3 months. A yearly plan has one bill, the whole year, so the plain coupon would take £49.50 off a First Class year: hence a fixed amount off for yearly.
- **Where it shows:**
  - the invite email ("Jo's map is First Class: join within 7 days and get First Class at half price for 3 months");
  - sign-up from the invite;
  - the note on arriving;
  - the account's "Your plan" card, with the date the offer ends.
- **In Stripe:** a 50% coupon lasting 3 months for monthly plans, and a fixed amount off once for yearly ones. It's kept on the profile like the promo free month: the plan offered, when the offer ends, and when it was used.
- **The terms and the Pricing page** need to say so, and someone qualified should read them before payments go live.

## Ads: travel affiliate cards

**Where they go:**
- every 12th or 24th tile in a photo grid (world, country and trip galleries), as set out in Ads by tier, with the rates in the tiers constants file;
- one card at the end of a slideshow, where cards show at all, never mid-show;
- two slots on each public country page. These show to every visitor, because the country pages are public travel pages, not anyone's album.

Not in the passport, account pages, login or sign-up.

**What a card shows.** Our own component in the travel-paperwork look, like a travel-agent's brochure: an image, a line such as "Hotels in Kyoto", the partner's name and an **Ad** label.

**How a card is chosen**, first match wins:
1. a planned trip on this map with future dates: its destination;
2. the country being viewed;
3. the country of the photos around the slot;
4. a general card (travel insurance, eSIMs, luggage).

**How it's built:**
- `AffiliateOffer` rows, managed on an admin page. Card images sit in the public bucket.
- A click goes through `GET /go/:offerId` on the API. That adds one to a daily tally (`OfferClickDaily`: offer, day, where the click came from (gallery, slideshow, country page, Travel Desk), count), then redirects to the partner. It records no person, map, share code or time of day (decided 16 Nov 2026: not in `AppEvent`, which is the admin log).
- Earnings are tracked in each partner's own dashboard.

**Privacy:**
- No third-party scripts, pixels or cookies on our pages. The ads need no consent banner, and share pages keep the "no analytics" rule.
- Set `Referrer-Policy: strict-origin-when-cross-origin` explicitly in `.htaccess`, so a partner sees at most our domain, never a share address.
- Links carry `rel="sponsored noopener"`. UK advertising rules (the ASA's CAP Code) require ads to be obviously ads, hence the label. Add an affiliate disclosure to the Privacy and Terms pages and the FAQ.

**Partners to apply to** (check each one's current terms; some only accept sites that already have content and traffic, so apply once the first country pages are live):
- hotels: Booking.com, Expedia Group;
- tours: GetYourGuide, Viator;
- flights: Skyscanner;
- travel eSIMs and insurance;
- or an aggregator such as Travelpayouts, which bundles many travel brands under one account.

## Travel Desk (offers on request)

A **Travel Desk** button on trip pages, the map's country panel and the country pages. Pressing it opens a panel styled as a travel agent's brochure rack:
- when to go, from the country page's month strip;
- partner offers for that place: hotels, tours, flights, eSIMs, insurance.

**On a planned trip,** the links carry the destination and dates where the partner allows it ("Hotels in Lisbon, 12–18 May"). That's the moment people actually book, so it's useful, not an advert.

**Every tier gets it.** It's the way paying members earn the site commission without seeing ads.

**Keeping it welcome:**
- It opens only when pressed. No pop-ups, and no deal emails unless someone opts in separately (UK rules require consent for marketing emails anyway).
- It's labelled: "Partner offers. We may earn a commission if you book, at no cost to you."
- First Class's promise is worded precisely: "No adverts in your albums or on your shared maps. Travel offers only when you ask for them." "No ads anywhere" would be broken by the Travel Desk.
- It's built like the ad cards: `AffiliateOffer` rows and plain links through `/go/`, with no tracking.

## Videos (First Class)

**Decided 16 Nov 2026: Cloudflare Stream.** Every video must play in every browser, so each one is converted by Cloudflare Stream ($5 per 1,000 minutes stored a month, $1 per 1,000 minutes watched; only First Class uploads videos). The browser uploads straight to Stream (resumable), Stream converts it and makes thumbnails, and playback is a signed HLS link. Built as docs/API.md "Videos" describes, server and app (16 Nov); the plan below was the first version (straight to R2, no conversion) and its compatibility risk is gone.

- **Upload:** straight to Cloudflare Stream through a one-off resumable upload link the API signs, like photos go to R2. The server never handles the file.
- **Limits** (proposed):
  - up to 3 minutes and 500 MB each;
  - MP4 or MOV;
  - 20 videos per country.

  The browser reads the length before uploading. The server can only check the size, so the size cap is the real guard.
- **Size guide:** an iPhone records roughly 60 MB a minute at 1080p, and several times that at 4K.
- **Thumbnail:** the browser grabs a frame onto a canvas, as the poster image.
- **Country:** reading the location out of a video file is harder than from a photo. Version 1 asks the uploader, defaulting to the country of the photos around it.
- **Storage:** videos count towards the storage safety net but not towards the photo cap.
- **Playback:** a signed URL in a `<video>` element; R2 supports the range requests seeking needs.
- **Where they show:**
  - in galleries, as a tile with a play button;
  - in slideshows, playing through, then moving on;
  - never in the passport.
- **Compatibility:** iPhones record HEVC by default, which only some browsers play, so every video is converted by Cloudflare Stream (above) and plays everywhere.
- **Videos are First Class's main draw,** so they ship at launch with the tiers.

## Slideshows (the "playlists")

| Slideshow | Plays | Opened from |
| --- | --- | --- |
| Worldwide | Every photo on the map | A "Play my world" stamp in the map toolbar |
| Country | One country's photos | The country panel |
| Trip | One trip's photos | The trip page (same component, so it comes free) |

- **Order:** by date taken, so it plays as a journey, with a shuffle option.
- **Country changes:** in the worldwide show, a title card (the country's poster) appears when the country changes. A stretch goal is the map zooming to the next country.
- **Controls:**
  - play and pause, next and previous;
  - speed: 3, 5 or 8 seconds a photo;
  - keyboard arrows and space, and swiping on phones;
  - full screen.
- **Captions:** place, landmark, date and the photo's caption.
- **Behind the scenes:** the screen stays awake while playing (the Screen Wake Lock API), and the next two display copies are preloaded.
- **Reduced motion:** no pan or zoom effects, just simple cuts.
- **Moments** (16 Nov 2026): in date order, the map's, country's or trip's dated moments come as cards between the photos (see "Moments").
- **Viewers** can play the slideshows. As everywhere else, they never see hidden photos.
- **Ads:** where cards show, one comes at the end, never mid-show.
- **Music:** none in version 1 because of licensing. People can play their own alongside.

## The passport (landmark book)

**First, more landmarks.** The seed has 177 landmarks, exactly one per country, so most passport pages would hold one stamp. Before launch, grow the list to roughly 5–20 per popular country:
- **Source:** Wikidata. Its data is CC0, so commercial use is fine. It has the UNESCO World Heritage Sites (about 1,200, with coordinates) plus well-known sights that aren't on the UNESCO list.
- **New fields:** `isUnesco` (for badges) and `wikidataId`. Each landmark keeps its own `matchRadiusM`; big national parks need a large one.
- **Matching:** more landmarks means more nearby suggestions, but users already confirm every match.

**When a landmark is stamped:**
- A landmark is stamped when a photo of it is confirmed (`PhotoLandmark.confirmed`). No photo, no stamp: ticking a country by hand stamps nothing.
- The stamp holds the earliest confirmed photo. The owner or an editor can pick another.

**The book:**
- **Cover:** the map's name on a passport cover in the poster style, with the camera logo as the crest. First Class gets extra cover designs.
- **Photo page:** the travellers, with their name, birth country and favourite country (already stored on `Traveller`), laid out like a passport's photo page.
- **Visa pages:** one spread per visited country, in order of first visit:
  - an entry stamp with the country's name and the date of its first photo;
  - a stamp for every landmark visited, holding its photo and date;
  - dotted outlines for that country's landmarks not visited yet, so the book doubles as a checklist.
- **Back page:** totals for countries, continents and landmarks.

**How it looks and works:**
- **Stamps** are drawn in SVG: a few shapes (circle, oval, rectangle, triangle), picked from the landmark's id so the same landmark always looks the same. Each is tilted slightly, inked in theme-token colours, with its text set on a curve.
- **Page turning** is a 3D page turn on desktop and a swipe page by page on phones. With reduced motion, pages fade instead.
- **Access:** the owner, editors and viewers (read only). The route is `/maps/:mapId/passport`, `noindex`.
- **No ads** inside the passport.
- **On the map** (built 16 Nov 2026): stamped landmarks' pins are gold, and show whenever pins do; a stamp's photo can be any photo confirmed as that landmark, wherever it was placed.
- **Later:** print the passport as a real photobook (see Printing).

## Moments (life events and notes on the map)

The map shows more than where you've been: it shows where life happened. "Had a baby in Canada." "Got engaged at the Eiffel Tower." "Lived in Lisbon, 2015–2018." "Best pizza of my life, Naples." A moment is a note pinned to a country, a landmark or a place, usually dated, with the people and photos it's about.

In the code it's called a **moment**, not an event, because "event" already means the app's log (`AppEvent`, `server/src/event/`).

**What a moment has:**
- **Where:**
  - a country;
  - optionally a seeded landmark or a place name, as trip stops have now.
- **When:**
  - a date to the day, the month or only the year ("2019"), as people often don't remember the day;
  - a plain note can have no date.
- **Kind:**
  - it sets the moment's stamp icon and wording;
  - the starter list: born, moved here, wedding, engagement, graduated, new job, met someone, celebration, and **something we saw or did** ("We saw a volcano");
  - it's stored as text checked against a list in the code, not a Prisma enum, so adding a kind needs no migration.
- **Title and text:** a short title and an optional longer story, both plain text, cleaned like captions.
- **Who:** which of the map's travellers it's about (optional).
- **Photos:** optional, chosen from the map's existing photos. Nothing new is uploaded, so moments cost no storage.
- **Trip:** optional, when it happened during a trip.
- **Hidden:** shown to editors only, like hidden photos.

**"Had a baby in Canada":**
- a "born" moment offers to add the baby as a new traveller on the map, with Canada as their birth country (`Traveller.birthCountryCode` exists already);
- a moment in a country that isn't on the map yet offers to mark it Visited or Lived. A birth or a move suggests Lived.

**Where moments show:**
- **The country panel:** the country's moments in date order, with "Add a moment" for editors.
- **Landmarks (built 16 Nov 2026):** the landmark's card in the country panel and its passport stamp show the moments that happened there (title and date; the card lists two, then "and N more", and puts landmarks with moments first).
- **The map:** a small marker beside the country's badge or at the landmark, which a viewer setting turns on and off, like the country names.
- **A timeline panel:**
  - the whole map's moments and trips in date order, filtered by traveller: the family's story;
  - it opens from the toolbar, like the other panels.
- **Share links:** viewers see moments unless they're hidden.
- **Slideshows (built 16 Nov 2026):** a show in date order puts each dated moment in as a card (its stamp, kind, date, title, place and story) before the first photo taken on or after it, on screen at least 6 seconds; undated moments and shuffled shows have none.

**Who can do what:**
- **The rules are the same as for photos:**
  - map editors add, edit and delete moments;
  - a trip-only editor can do the same for moments linked to their trip;
  - viewers only read them.
- **Country notes stay, beside moments** (decided 16 Nov). A note is the country's one free-text box: a plan or a reminder ("I want to visit here", "Cherry blossom is in early April"). A moment is something that happened ("We saw a volcano", "We had our baby in Paris").
  - `CountryVisit.notes` is already in the API but no screen shows it: the country panel gets a "Notes" box at the top, editable by editors, read by viewers.
  - A note belongs to the country's visit row, so it can be written for any status, "want to go" included; clearing the status keeps no note (the row goes).
- **No replies from other people** (dropped 16 Nov 2026, the user's decision): a map isn't a social network, so nobody else writes on it.

**Privacy.** Moments can be very personal: a birth, a home.
- In version 1 a place is a landmark or a name, never coordinates, so a shared map can't show where someone lives.
- **A pin on the exact spot** (built 16 Nov 2026, Phase 3): optional, set from one of the moment's photos that knows where it was taken, from the device's location, or by tapping the map. Whether the people the map is shared with see the exact spot is chosen on each pin, off by default (the user's decision, replacing an earlier idea of rounding it to 1 km for viewers: a photo with the moment would give the spot away anyway). The owner and editors always see it; viewers see the pin only when it's shared, never a rounded one. Anyone who can see it gets a link to it on Google Maps, as our map shows countries, not streets.
- Hidden moments, like hidden photos, never reach viewers or share links.

**Tiers:** free on every tier. A moment is a row of text, and its photos already count toward the photo limits.

## Travel challenges

**Shared rules:**
- Progress is counted from the tables that already exist: visits, photos and landmark matches. Only awards and user-made challenges are stored.
- Badges and goals belong to a map, so a couple or family earns them together. **Per traveller (built 16 Nov 2026, Phase 3):** the travel badges (countries, continents, special places, regions) for each person, counted from the completed trips they were on, each dated by the trip that earned it (its last day, else its first; none for an undated trip). Worked out on each load, never stored or announced; the badges panel shows them behind a "whose badges" switch on maps with two or more travellers.
- Badges with no time limit count every visited country, as the map's stats do. Anything with dates (friends challenges, dated goals) counts only countries backed by a photo, because a hand-ticked country has no date.
- **Every tier gets every challenge.** They give people reasons to add photos and to share, which is free promotion.

### Site badges

A fixed list kept in one file of code:

| Group | Badges |
| --- | --- |
| Countries | 1, 5, 10, 25, 50, 100, all of them (227, or 230 with the UK as its nations) |
| Continents | First country on each; all six inhabited continents; Antarctica |
| Regions | Every country in Scandinavia, Central America, the Balkans… (region lists in code) |
| Landmarks | 1, 10, 50 stamps; 5 and 25 UNESCO sites |
| Photos | 100, 1,000 |
| Themes | 3, 6, 12 monthly themes entered |

- **Antarctica** needs a special case: the map has no shape for it, so the country lookup can't place a photo there.
- **When they're checked:** after each photo upload, visit change and landmark confirmation. A new badge is saved with its date and announced with a short pop-up.
- **The badges page** shows them as luggage stickers on a suitcase, in the travel-paperwork look.

### Personal goals

- **Kinds:**
  - a number of countries, optionally by a date;
  - a list of countries: a bucket list, which can start from the map's "want to go" countries;
  - every country in a region or continent;
  - a number of landmark stamps.
- **Progress** shows as a luggage tag on the map. Finishing a goal earns an award.
- **Access:** the owner and editors create goals; viewers can see them.

### Friends challenges

**Built on 16 Nov 2026** (docs/API.md "Friends challenges"), as below, with these decisions:
- **invites are by link only** for now: the join link (a share-code-style secret) is copied and sent however people like; inviting by email, and the starter removing someone, can come later (a new link stops newcomers);
- the map that counts can be one you **own or edit** (a couple sharing one map can both count it); someone who loses it counts 0 until they pick another;
- the measures are new countries (first photo there in the dates), countries with a photo in the dates, landmarks stamped from photos in the dates, and photos entered in the monthly themes in the dates; "photos in this month's theme" became the last;
- a target makes it a race: whoever's target-th item came first leads;
- up to two years long, 50 people a challenge, 30 challenges a person; only the starter changes it or deletes it, and the starter can't leave;
- pages: `/challenges` (yours, and "Start a challenge"), `/challenges/<id>` (the leaderboard, the link, your map), `/challenges/join/<code>` (anyone; sign in to join). "Challenges" is in the nav for signed-in people.

- **Setting one up:** someone picks:
  - a measure: new countries, countries visited, landmarks stamped, or photos in this month's theme;
  - start and end dates;
  - an optional target ("first to 5").

  They invite people by link or email, using the same invite system as sharing. Inviting people who aren't members yet brings in sign-ups.
- **Joining:** each person who joins picks which of their maps counts. Joining is opt-in, and leaving removes them.
- **The leaderboard** shows display names and counts only: never photos, places or maps.
- **Counting:** photos taken inside the dates count (the EXIF date, or the upload date when there isn't one). A "new country" is one whose first-ever photo falls inside the dates.
- **No cheating checks.** Dates can be edited, but it's a game between friends.
- **Sign-in needed:** a share-link viewer can't join.

### Monthly photo themes

**Built on 16 Nov 2026** (docs/API.md "Photo themes"), as below, with these decisions:
- a theme runs for its calendar month in UTC, and members see it only once it starts (a surprise each month); past ones stay as albums;
- **photos only**, never videos, and **at most 20 photos per map** in one theme: an album, not the whole map;
- photos go in only while the theme runs, and come out at any time; a theme with photos in keeps its month and can't be deleted;
- on the map: the badges and goals panel's "Monthly theme" card (choose photos, open the album, past albums) and a line in the photo viewer ("Enter it in this month's theme");
- the theme badges are 3, 6 and 12 themes entered (not a streak: months don't have to run in a row);
- development has an example year (`prisma/seed/themes.js`: "Doors", "Worst weather", "Street food"…); production's are written on the admin page (`/admin/themes`), which lists the coming year's months with no theme.

- **Setting them:** one theme a month, set in advance on an admin page. Seed a year's worth at launch.
- **Themes that fit the pitch:** "worst weather", "street food", "doors", "lost", "the view from the window", "the bad selfie".
- **Entering:** while a theme runs, users add any of their photos, from any date. The entries form a theme album on the map, visible to whoever can see the map.
- **Rewards:** entries count towards streak badges and can be a friends-challenge measure (counts only; the photos stay private).
- **No public gallery** of entries, in keeping with the privacy pitch.

## Country pages: culture and seasons

**Routes:** `/countries`, an index with the map and a list, and `/countries/<slug>`, e.g. `/countries/japan`. They are pre-rendered at build like the other public pages, indexed, and listed in the sitemap.

**Each page holds:**
- **the country's poster** and a stamp-style headline;
- **an overview:** a short one;
- **when to go:**
  - a 12-month strip marking each month best, good or avoid, with a line per season;
  - the weather in words, e.g. "hot and humid; monsoon June–September";
  - the main festivals and holidays, with their months;
  - how regions differ, for big countries;
- **culture:** greetings, etiquette, tipping, dress, what to eat, and a few phrases;
- **practical facts:** currency, languages, plug types, driving side, time zones, emergency number;
- **landmarks:** from the Landmark table, each with "stamp it in your passport";
- **the Travel Desk button and two ad cards:** hotels and tours there;
- **a "Start your map" box.**

**In the app:**
- the country panel shows "Best time: Mar–May, Sep–Nov" and links to the page;
- a planned trip shows how its month rates, e.g. "June: monsoon season".

**Where the content lives:** as files in the client, one per country (e.g. `client/src/content/countries/jp.json` plus `jp.md`), not in the database. It's fixed content that gets pre-rendered, so files keep it in version control and cost no API calls.

**Sources and licences.** The ads make the site commercial, so the licences must allow commercial use.
- **Practical facts:** from Wikidata (CC0).
- **The words:** written for the site, drafted with AI, then checked and edited by hand. Don't copy Wikipedia or Wikivoyage text: it's CC BY-SA, so copied text would have to carry attribution and be shared under the same licence.
- **No climate tables** (dropped 16 Nov 2026, the user's decision): the guides describe the weather in words, in "When to go".
- **A "last checked" date** goes on each page. Festival dates move from year to year (lunar calendars), so write "usually in March".

**SEO** (the playbook applies):
- **Playbook basics:** titles of 60 characters or fewer, descriptions of 120–156 characters, and all content in the pre-rendered HTML.
- **Publish in batches of about 20,** starting with the most-visited countries. A page that isn't written isn't built: no thin placeholder pages in the sitemap.
- **Every page must be checked by hand.** Google penalises mass-produced pages that add little ("scaled content abuse"). Each page also needs something only this site has: the poster, the month strip, the landmark stamps.
- **Build time:** pre-rendering ~200 more pages with Playwright adds build time, so measure it after the first batch.

**"Where to go in <month>" (built 16 Nov 2026, Phase 3; drafts until the user passes them):** twelve pages, `/where-to-go/<month>`, each with its own hand-written introduction (`client/src/content/months/<month>.json`, checked like a guide) and, from the checked guides, the countries at their best that month (poster, the season's line, its festivals), those also good, and the regions at their best where the rest of their country isn't, each linking to its guide. A month is built only once its file is checked **and** the checked guides give it at least three countries (playbook C1, C10: no thin list pages). No index page: the months link each other, the country index has a "Month by month" row, and each guide links its best months' pages, all only to published months. The sitemap's date is the newest of the month's check and its guides'.

## Printing

**Version 1: affiliate link.** Built on 16 Nov 2026 (docs/API.md "Downloads"), but for picking single photos:
1. A **Print or download** button on a country's panel, a trip's Photos card and Settings, "This map" (the whole map, a folder per country) opens a dialog. Editors only (verified or not: it's a read); never through a share link. Not on a single photo: the photo viewer already downloads its best copy.
2. The dialog downloads the photos as a zip made in the browser from signed URLs, so Vercel does no work:
   - Economy photos come from their print copy (good up to about A4);
   - Business and First Class photos come from the original (always JPEG, PNG or WebP: uploads take no HEIC). The dialog warns that originals still hold the location.
   - Videos aren't included (Stream keeps no original; Stream can make an MP4 download per video, at a cost, if people ask).
   - Chrome and Edge on a computer write the zip to disk as it's made, at any size; other browsers hold it in memory, so it comes in parts of up to 500 MB.
3. It then links to the print partner with the affiliate code. The user uploads and orders there. The partner is a travel offer of kind `PRINTS` in placement `PRINT`, imported like the others: choosing one needs no code. Until then development shows a fictional "Example Prints", and production shows a line saying any photo printer takes the files.

**Later:** picking photos for a print order from a gallery (a selection), rather than a whole country or trip.

**Candidate partners** (check their current affiliate terms): UK photo printers such as Photobox, CEWE and Snapfish.

**Later: ordering through the site.**
- The site sends photos straight to a print company's API, such as Prodigi or Gelato.
- Products: prints, canvases, and the passport as a printed photobook.
- It needs Stripe checkout, an order table, the printer's status webhooks, and a reprint and refund policy.
- First Class gets a printing discount then.

## Installable app (PWA)

**Version 1 built on 16 Nov 2026**, with a hand-written service worker instead of `vite-plugin-pwa` (no new dependency, and it does exactly what's below; CLAUDE.md "Installable app" has the details). Waiting: the real icons (192, 512 and a maskable one) with the brand, and a try on real phones.

The site becomes installable: "Install app" in Chrome and Edge on Android and desktop, Add to Home Screen on iPhone. It opens from its own icon in a window with no browser bar. There's no app store, and it doesn't need Next.js. A PWA is a web manifest, a service worker and HTTPS, which the Vite site can have as it is.

**Already there:**
- `manifest.json`, built from `constants.js` in `vite.config.js`, with `display: standalone`, 192 and 512 px icons and a maskable 512 (the brand's, from `images/src/tools/brand-assets.mjs`);
- the `apple-touch-icon`;
- `worker-src 'self'` in the CSP.

**Version 1: installable, online only.**
- **The service worker:** made at build by `vite-plugin-pwa` (Workbox). It caches the app's own files (`/assets/`, fonts, the app shell), so repeat visits start from the device.
- **Opening a page offline:**
  - signed-in pages (`CLIENT_ONLY_ROUTE_PREFIXES`) fall back to `app-shell.html`, not the plugin's default `index.html`;
  - public pages load their own pre-rendered HTML from the network first.

  Either way, a "You're offline" message shows instead of an empty map.
- **Never cached:**
  - API responses: they're private and tied to the login cookie;
  - signed photo URLs: private photos would stay on the device, and the URLs change every hour anyway;
  - the secret addresses (`/shared`, `/invite`, `/reset-password`, `/verify-email-address`).

  Country posters are public, so they can be cached.
- **Updates:** `sw.js` must be served with `no-cache`. Today `.htaccess` gives every `.js` outside `/assets/` a day, so a broken service worker could stay on devices for a day. Change `.htaccess` and `netlify.toml` together.
- **Registered only on the live site:** in production builds, after the page has loaded. Never in development or mock mode, and never in the pre-render's headless Chromium.
- **Icons:**
  - real 192 and 512 px icons, plus a maskable one that Android crops to its own shape;
  - an `id` in the manifest.

  They wait on the brand assets (phase 0).
- **Logging in on iPhone:** while the API is on another site (Vercel), Safari treats its login cookie as third-party, whether the site is installed or not. Moving the API to `api.<domain>`, already planned, fixes both.

**Offline: the site's own pages, never its data** (decided 16 Nov 2026, the user's decision; built the same day).
- The app needs the internet for everything that's people's own: maps, photos, trips, moments, the account. Offline, those pages say "You're offline". No map is kept on the device, so the old idea of reading the last map offline is dropped.
- What's written into the site is kept: the installed app (opened from its icon) keeps every public page (home, about, FAQ, pricing, contact, legal, the published country guides and month pages) and all the site's code, styles and fonts (about 1 MB a deploy), so those pages open offline even if they were never visited. Images are kept once they've been shown; posters and photos come from other hosts and need a connection.
- In a browser tab nothing more is kept than before (the app shell, the files it loads, and the pages visited), so ordinary visitors don't download the whole site.

## Getting the word out

- **Shared maps.** Every shared map shows friends and family what the site does. A small "Make your own map" link on share pages turns viewers into sign-ups.
- **Challenges.** Friends challenges and monthly themes give people reasons to invite others and come back.
- **Country pages.** Search traffic, which grows slowly from launch.
- **Influencers.** **Decided (16 Nov):** a creator who promotes the site gets **two years free** (a 24-month complimentary membership, First Class unless decided otherwise per creator). Smaller creators with engaged travel audiences fit the budget best.
  - **Their own link or code.** Each creator gets a sign-up link or code, so you can see who brings sign-ups; the code is stored on the account. **Decided (16 Nov):** anyone who signs up with it gets **their first month free on whichever paid plan they choose**: a 30-day Stripe trial on their first paid Checkout, **with a card**, charged from then on unless they cancel first. The same for every code (docs/API.md, "Promo codes").
  - **Labelling.** Under UK rules (ASA and CMA influencer guidance), a free membership given in return for promotion makes the post an advert, so it must be clearly labelled, e.g. "Ad" at the start. Put that in the agreement.
  - **Ask for honesty.** A real post or video showing their map and passport, not a script.
  - **The agreement:** [documents/CREATOR-AGREEMENT.md](../documents/CREATOR-AGREEMENT.md) (agreed 16 Nov 2026; a lawyer should read it before the first one goes out): one post or video within 60 days showing their own map, with their code, kept up 12 months, labelled "Ad", with the followers' offer described accurately (card needed, renews after 30 days).

## Database additions (draft)

Reviewed on 15 Nov 2026 in [DATABASE-REVIEW.md](DATABASE-REVIEW.md), which changes parts of this table (plans in their own tables, `PhotoLandmark.mapId`, `Photo.shotAt`, ad clicks counted per day) and lists the decisions it needs.

| Model or field | For |
| --- | --- |
| `User.plan` (`FREE` / `REGULAR` / `PREMIUM`), `planSource` (`STRIPE` / `COMPLIMENTARY`), `planEndsAt` | Tiers, complimentary memberships |
| `Subscription` (Stripe ids, status, renewal date, `extraMaps`: how many extra maps are paid for) | Payments, extra maps |
| `TravelMap.uploadsLocked` (an extra map that isn't paid for: viewable and shareable, no new photos) | Extra maps |
| `User.referralCode` (the influencer code they signed up with) | Promotion tracking |
| `PhotoVariant` size `PRINT` (the Economy print copy) | Tiers, printing |
| `Photo.kind` (`PHOTO` / `VIDEO`) and `durationS`. A video's file is its `ORIGINAL` variant; its poster frames fill `THUMB` and `DISPLAY` | Videos |
| `Landmark.isUnesco`, `Landmark.wikidataId` | Passport, badges |
| `LandmarkCover` (map, landmark, photo) | The photo a passport stamp shows |
| `BadgeAward` (map, badge key, date earned) | Site badges |
| `Goal` (map, kind, target, settings, deadline, date achieved) | Personal goals |
| `FriendChallenge`, `FriendChallengeEntry` (challenge, user, map) | Friends challenges |
| `PhotoTheme` (month, title, blurb), `PhotoThemeEntry` (theme, photo) | Monthly themes |
| `AffiliateOffer` (partner, kind, country, title, image key, URL, weight, active) | Ad cards and the Travel Desk |
| `OfferClickDaily` (offer, day, placement, count) | Counting ad and Travel Desk clicks, with nothing about who clicked |
| A map ownership transfer: no new table (`TravelMap.ownerId` changes, the old owner becomes an editor); logged as an `AppEvent` | Transferring a map |
| `Moment` (map, kind, title, text, `happenedOn` with `datePrecision` `DAY` / `MONTH` / `YEAR`, country, landmark?, place name?, trip?, hidden, created by), indexed `[mapId, happenedOn]` and `[mapId, countryCode, happenedOn]`; `MomentTraveller` (moment, traveller); `MomentPhoto` (moment, photo, position). `CountryVisit.notes` stays (the country note) | Moments |

| `TripMap` (trip, map, added by, added at): a group trip added to someone's own map. The trip shows in that map's trips, and completing it adds `TRIP` visits there too | Group trips |
| (19 Nov, to build) A `CO_OWNER` member role; `ShareInvite` carries the traveller a co-owner will be; `Traveller.userId` set when a co-owner joins; the invite offer on `Profile` (plan, ends at, used at) | Couples and families |

The per-country cap counts the map's existing `Photo` rows in that country (the `[mapId, countryCode, …]` index serves it). The 10-editor cap counts `MapMember` rows with the `EDITOR` role.

## Decisions in SITE-DESIGN.md this changes

When each part is built, update these sections there:
- **Pages:** country pages and a Pricing page join the indexed, pre-rendered pages and the sitemap.
- **Photos:**
  - Economy keeps a 2,400 px JPEG print copy instead of the original;
  - "the original is always kept" becomes Business and First Class only.

  It's still three files per photo.
- **Storage use and future paid tiers:** becomes the three tiers, from launch, and "usage counts against the uploader" becomes "usage counts against the map", on the owner's plan. Owning a second map needs an extra-map payment, on any plan.
- **Sharing:** up to 10 editors on a map; adding an under-18 editor needs the parent's or guardian's say-so (see Children and editors).
- **Privacy rules:**
  - ad cards on Economy maps, and fewer for non-paying viewers of Business maps, as plain links with no ad scripts;
  - the Travel Desk;
  - the referrer policy.
- **Removed from the template:** Stripe comes back.
- **Stack and hosting:** the service worker, and `sw.js` served with `no-cache` (`.htaccess`, `netlify.toml`). What it never caches goes under the privacy rules.
- **Moments:**
  - `docs/API.md`: the moment routes (per map, per country, and through share links);
  - the access rules: as for photos, hidden ones for editors only;
  - the mock handlers;
- **Home, About and FAQ copy:** the pitch above.

## Phases

| Phase | What | Why this order |
| --- | --- | --- |
| 0. Finish the port | SITE-DESIGN.md's open items: run everything for real, the domain, the brand assets | Nothing above works until the base does |
| 1. Launch | <ul><li>the pitch copy and a Pricing page</li><li>the three tiers with Stripe, the print copy and complimentary memberships, extra maps, and the 10-editor cap</li><li>First Class videos</li><li>ad cards and the Travel Desk</li><li>slideshows</li><li>the passport, with the landmark expansion</li><li>site badges and personal goals</li><li>the first ~20 country pages</li><li>influencer outreach</li><li>the installable app (PWA), online only</li><li>moments, with the timeline panel</li></ul> | <ul><li>The tier rules must exist from day one.</li><li>Videos are First Class's main draw.</li><li>Memberships, cards and the Travel Desk are the income.</li><li>The passport and slideshows are the headline features.</li><li>Country pages start the slow SEO clock and help affiliate applications.</li><li>The PWA is a small job once the brand icons exist, and makes the map feel like an app on a phone.</li><li>Moments cost no storage and make the map a family's story, not only a list of countries.</li></ul> |
| 2. After launch | <ul><li>print link and download</li><li>monthly themes</li><li>friends challenges</li><li>more country pages</li></ul> | Each builds on the launch features; friends challenges need people already using the site |
| 3. Later | <ul><li>"Where to go in <month>" pages</li><li>ordering prints and photobooks through the site, with the First Class discount (print companies to be approached once the site is finished)</li><li>per-traveller badges</li><li>video transcoding if needed</li><li>Infrequent Access storage for originals</li><li>moments pinned to a spot on the map</li></ul> | More work, more risk, or waiting on demand |

## Ideas not built yet

- **A visited-country animation** (21 Nov 2026, the user's wish): marking a country visited or lived in (the ticket, the country list, a "been here" tick) should feel like a moment: the country fills in with its colour and its star sticker is pressed on like a stamp. A plain change with reduced motion.

## Open decisions

**Decided (16 Nov):** the proposed values stay, as built (all in the tiers constants file):
- **Photos per country:** 30, 200 and 1,000.
- **Ad rates:** a card every 12 photos on Economy maps, and every 24 for non-paying viewers of Business maps.
- **Video limits:** 3 minutes, 500 MB, 20 per country.
- **Storage safety nets:** 50 GB and 200 GB.

Still to decide (each is also in [WAITING-ON-YOU.md](WAITING-ON-YOU.md), with what the code does until then):
- ~~**First Class extras:**~~ **Passport covers decided (16 Nov):** a cover per plan, the map owner's: Economy burgundy and gold, Business navy and silver, First Class black leather and gold with a double frame (built; restyled the same day as a real passport: leather grain, foil stamping, a raised crest, the e-passport mark). **Still to choose:** First Class's extra map styles (the Pricing page marks them "soon").
- ~~**Influencer terms:**~~ **Decided (16 Nov):** creators get two years free; their followers get their first month free on the paid plan they choose, with a card up front. What's asked of a creator in return is agreed (16 Nov): [documents/CREATOR-AGREEMENT.md](../documents/CREATOR-AGREEMENT.md).
- **Partners:** which affiliate partners and which print partner.
- ~~**First country pages:**~~ **Decided (16 Nov):** Spain, France, Italy, Portugal, Greece, Turkey, Ireland, the Netherlands, Germany, Croatia, Iceland, the USA, Canada, Mexico, Morocco, Egypt, Japan, Thailand, Australia and New Zealand.
- **Themes:** who writes the year of monthly themes.
- **VAT:** whether to handle VAT yourself or use a merchant of record; ask an accountant.
- **Moments:**
  - the starter list of kinds and their stamp icons;

## Risks

- **Small affiliate income at first.** Traffic has to come from the country pages, and SEO takes months.
- **Affiliate programmes may turn down a new site.** Apply once the first country pages are live.
- **The no-tracking promise is part of the pitch.** Adding an ad network script later would need a consent banner and would break that promise, so revisit the pitch before ever doing it.
- **Writing culture and seasons for ~200 countries is a lot of work,** and errors are public. Publish in checked batches, each page with a "last checked" date.
- **Video costs** grow with First Class use (Cloudflare Stream bills per minute stored and watched); each minute belongs to a paying member, but watch the bill.
- **Unlabelled influencer posts** are the site's problem as well as theirs. Make labelling part of every agreement.
- **VAT on EU sales** applies from the first sale. Sort it out before taking EU payments.
- **Friends challenges show counts to other people.** Keep them opt-in, counts only.

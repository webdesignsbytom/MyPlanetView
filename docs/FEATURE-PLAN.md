# My Planet View: feature plan

What comes after the port, and how it pays for itself. [SITE-DESIGN.md](SITE-DESIGN.md) records what is built; this file is what's planned. When a feature here is built, move its decisions into SITE-DESIGN.md.

Last updated: 14 November 2026.

## Agreed so far

| Idea | Decision (14 Nov 2026) |
| --- | --- |
| Tiers | Three: **Economy** (free), **Business** (£4.99 a month) and **First Class** (£8.99 a month), with yearly prices. |
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
| Promotion | Give a few complimentary memberships to influencers who promote the site. |

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
| Price | Free | £4.99 a month or £49 a year | £8.99 a month or £89 a year |
| Photos per country | 30 | 200 | 1,000 |
| Best copy kept of each photo | A 2,400 px print copy | The untouched original | The untouched original |
| Videos | No | No | Yes |
| Ad cards in galleries | Shown to everyone viewing your maps | You never see them; non-paying people viewing your maps see fewer | None, for anyone viewing your maps |
| People who can add photos to a map, including you | 2 | 6 | Unlimited |
| Extras | None | None | Extra map styles and passport covers; a print discount once printing goes through the site |
| Storage safety net | Not needed | 50 GB | 200 GB |

**Every tier gets:**
- sharing, with unlimited viewers and share links;
- up to 3 maps;
- the passport, challenges, slideshows and country pages;
- the Travel Desk;
- "Download all my photos". UK data protection law (GDPR) lets people get a copy of their own data free of charge, so it can't be a paid perk.

**In the code** the plans are `FREE`, `REGULAR` and `PREMIUM`. Their display names, prices and limits live in one constants file, so renaming a tier never touches the database.

### Photos per country

- **What counts:** the photos an account uploaded in that country, across all its maps. A couple's map with two Economy accounts can hold 60 photos of France. This matches the existing rule that usage counts against the uploader.
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

A login is one person; a map is a world map with its photos. They're separate, so one person can be on several maps. For example:
- Sam makes "Sam & Alex". Alex signs up with their own login and is added as an editor: one map, two logins.
- Sam can also own a second map of solo work trips, under the same login, with a switcher to flip between them.

Every tier can own up to 3 maps; maps other people share with you don't count. This isn't a selling point, just a sensible limit.

### Upgrades and downgrades

- **Upgrading** takes effect as soon as Stripe confirms payment. Switching between Business and First Class is prorated by Stripe.
- **Downgrades never delete anything** (the existing rule):
  - countries over the new cap can't take new photos;
  - originals already kept stay; new uploads keep a print copy;
  - videos stay viewable, but no new ones can be added;
  - ads follow the new plan.

### Free rules from launch

The tier rules, including the Economy print copy, start the day the site launches. If Economy launched keeping originals with no cap, adding limits later would mean deleting people's originals or keeping two sets of rules forever.

### Complimentary memberships

- **Granting one:** an admin page gives an account a plan for a set time without payment, e.g. First Class for 12 months.
- **When it ends,** the account drops to Economy unless they subscribe. Nothing is deleted (the downgrade rules apply).
- **The first use is influencers:** a few travel creators who promote the site (see Getting the word out). It can also go to testers or as an apology.
- **Cost:** a complimentary First Class account costs at most a few dollars a month in storage, and usually pennies.

### Payments

- **Stripe Checkout plus the Stripe customer portal,** monthly and yearly. A webhook sets the account's plan. NextDummy had Stripe checkout and webhook code to reuse.
- **Promote the yearly prices.** Stripe takes roughly 20p plus a small percentage per payment (check its current UK rates). That's about 5.5% of a £4.99 monthly payment, but under 2% of a £49 yearly one.
- **VAT:**
  - if you're VAT-registered, the prices include VAT;
  - selling to people in the EU means EU VAT from the first sale.

  Check both with an accountant. A merchant-of-record payment provider such as Paddle handles VAT for you, but takes a bigger cut.

### Cost check

Cloudflare R2 charges **$0.015 per GB a month**. The first 10 GB a month are free, and downloads cost nothing (checked 14 Nov 2026; see [R2 pricing](https://developers.cloudflare.com/r2/pricing/)). Per-request charges are tiny at this scale: $4.50 per million writes and $0.36 per million reads, with 1 million and 10 million free each month.

| Case | Storage | Cost a month |
| --- | --- | --- |
| Economy user, 30 photos in each of 20 countries (~1.4 MB a photo including the print copy) | ~840 MB | about 1p |
| Business user at the 50 GB safety net (about 10,000 photos with originals) | 50 GB | ~$0.75 |
| First Class user at the 200 GB safety net | 200 GB | ~$3.00 |

Most people will use far less, so the prices are about value, not cost.

A later saving: R2's Infrequent Access class costs $0.01 per GB a month and suits originals, which are rarely opened. It adds a fee each time a file is read and bills each file for at least 30 days.

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
- A click goes through `GET /go/:offerId` on the API. That records an `AppEvent` with the offer, country and where the click came from (gallery, slideshow, country page, Travel Desk), but no user, map or share code. It then redirects to the partner.
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

- **Upload:** straight to the private bucket through a presigned URL, like photos. No server processing.
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
- **Compatibility risk.** iPhones record HEVC by default.
  - Safari plays it. Chrome and Edge play it only where the device decodes it in hardware, and Firefox support is patchy.
  - Version 1 checks `canPlayType` and offers "Download to watch" where it can't play.
  - If that becomes a common complaint, transcode with a paid service such as Cloudflare Stream, which bills per minute stored and watched.
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
- **Later:** print the passport as a real photobook (see Printing).

## Travel challenges

**Shared rules:**
- Progress is counted from the tables that already exist: visits, photos and landmark matches. Only awards and user-made challenges are stored.
- Badges and goals belong to a map, so a couple or family earns them together. Badges per traveller can come later, from trip data.
- Badges with no time limit count every visited country, as the map's stats do. Anything with dates (friends challenges, dated goals) counts only countries backed by a photo, because a hand-ticked country has no date.
- **Every tier gets every challenge.** They give people reasons to add photos and to share, which is free promotion.

### Site badges

A fixed list kept in one file of code:

| Group | Badges |
| --- | --- |
| Countries | 1, 5, 10, 25, 50, 100 |
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
- **Climate numbers**, if a table is wanted later, need a source that allows commercial use. NOAA's station data is US-government public domain; Meteostat's data and Open-Meteo's free API are for non-commercial use only. Version 1 describes the weather in words.
- **A "last checked" date** goes on each page. Festival dates move from year to year (lunar calendars), so write "usually in March".

**SEO** (the playbook applies):
- **Playbook basics:** titles of 60 characters or fewer, descriptions of 120–156 characters, and all content in the pre-rendered HTML.
- **Publish in batches of about 20,** starting with the most-visited countries. A page that isn't written isn't built: no thin placeholder pages in the sitemap.
- **Every page must be checked by hand.** Google penalises mass-produced pages that add little ("scaled content abuse"). Each page also needs something only this site has: the poster, the month strip, the landmark stamps.
- **Build time:** pre-rendering ~200 more pages with Playwright adds build time, so measure it after the first batch.

**Later:** twelve "Where to go in <month>" pages, built from the month strips.

## Printing

**Version 1: affiliate link.**
1. A **Print** button on a photo, a selection, an album or a trip opens a dialog.
2. The dialog downloads the chosen photos as JPEGs in a zip made in the browser from signed URLs, so Vercel does no work:
   - Economy photos come from their print copy (good up to about A4);
   - Business and First Class photos come from the original. HEIC originals are converted to JPEG first, with the converter the upload already uses.
3. It then links to the print partner with the affiliate code. The user uploads and orders there.

**Candidate partners** (check their current affiliate terms): UK photo printers such as Photobox, CEWE and Snapfish.

**Later: ordering through the site.**
- The site sends photos straight to a print company's API, such as Prodigi or Gelato.
- Products: prints, canvases, and the passport as a printed photobook.
- It needs Stripe checkout, an order table, the printer's status webhooks, and a reprint and refund policy.
- First Class gets a printing discount then.

## Getting the word out

- **Shared maps.** Every shared map shows friends and family what the site does. A small "Make your own map" link on share pages turns viewers into sign-ups.
- **Challenges.** Friends challenges and monthly themes give people reasons to invite others and come back.
- **Country pages.** Search traffic, which grows slowly from launch.
- **Influencers.** Give a few complimentary memberships (e.g. First Class for 12 months) to travel creators who promote the site. Smaller creators with engaged travel audiences fit the budget best.
  - **Their own link or code.** Each creator gets a sign-up link or code, ideally with something for their followers (e.g. a first month of Business free), so you can see who brings sign-ups. Store the code on the account.
  - **Labelling.** Under UK rules (ASA and CMA influencer guidance), a free membership given in return for promotion makes the post an advert, so it must be clearly labelled, e.g. "Ad" at the start. Put that in the agreement.
  - **Ask for honesty.** A real post or video showing their map and passport, not a script.

## Database additions (draft)

| Model or field | For |
| --- | --- |
| `User.plan` (`FREE` / `REGULAR` / `PREMIUM`), `planSource` (`STRIPE` / `COMPLIMENTARY`), `planEndsAt` | Tiers, complimentary memberships |
| `Subscription` (Stripe ids, status, renewal date) | Payments |
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

Ad and Travel Desk clicks go into the existing `AppEvent` table. The per-country cap counts existing `Photo` rows.

## Decisions in SITE-DESIGN.md this changes

When each part is built, update these sections there:
- **Pages:** country pages and a Pricing page join the indexed, pre-rendered pages and the sitemap.
- **Photos:**
  - Economy keeps a 2,400 px JPEG print copy instead of the original;
  - "the original is always kept" becomes Business and First Class only.

  It's still three files per photo.
- **Storage use and future paid tiers:** becomes the three tiers, from launch.
- **Privacy rules:**
  - ad cards on Economy maps, and fewer for non-paying viewers of Business maps, as plain links with no ad scripts;
  - the Travel Desk;
  - the referrer policy.
- **Removed from the template:** Stripe comes back.
- **Home, About and FAQ copy:** the pitch above.

## Phases

| Phase | What | Why this order |
| --- | --- | --- |
| 0. Finish the port | SITE-DESIGN.md's open items: run everything for real, the domain, the brand assets | Nothing above works until the base does |
| 1. Launch | <ul><li>the pitch copy and a Pricing page</li><li>the three tiers with Stripe, the print copy and complimentary memberships</li><li>First Class videos</li><li>ad cards and the Travel Desk</li><li>slideshows</li><li>the passport, with the landmark expansion</li><li>site badges and personal goals</li><li>the first ~20 country pages</li><li>influencer outreach</li></ul> | <ul><li>The tier rules must exist from day one.</li><li>Videos are First Class's main draw.</li><li>Memberships, cards and the Travel Desk are the income.</li><li>The passport and slideshows are the headline features.</li><li>Country pages start the slow SEO clock and help affiliate applications.</li></ul> |
| 2. After launch | <ul><li>print link and download</li><li>monthly themes</li><li>friends challenges</li><li>more country pages</li></ul> | Each builds on the launch features; friends challenges need people already using the site |
| 3. Later | <ul><li>"Where to go in <month>" pages</li><li>ordering prints and photobooks through the site, with the First Class discount</li><li>climate tables</li><li>per-traveller badges</li><li>video transcoding if needed</li><li>Infrequent Access storage for originals</li></ul> | More work, more risk, or waiting on demand |

## Open decisions

Proposed values, to confirm or change (all in the tiers constants file):
- **Photos per country:** 30, 200 and 1,000.
- **Ad rates:** a card every 12 photos on Economy maps, and every 24 for non-paying viewers of Business maps.
- **People who can add photos to a map:** 2, 6 and unlimited.
- **Maps per account:** up to 3.
- **Video limits:** 3 minutes, 500 MB, 20 per country.
- **Storage safety nets:** 50 GB and 200 GB.

Still to decide:
- **First Class extras:** which extra map styles and passport covers.
- **Influencer terms:** how long a complimentary membership lasts, what's asked in return, and the followers' offer.
- **Partners:** which affiliate partners and which print partner.
- **First country pages:** which 20 countries come first.
- **Themes:** who writes the year of monthly themes.
- **VAT:** whether to handle VAT yourself or use a merchant of record; ask an accountant.

## Risks

- **Small affiliate income at first.** Traffic has to come from the country pages, and SEO takes months.
- **Affiliate programmes may turn down a new site.** Apply once the first country pages are live.
- **The no-tracking promise is part of the pitch.** Adding an ad network script later would need a consent banner and would break that promise, so revisit the pitch before ever doing it.
- **Writing culture and seasons for ~200 countries is a lot of work,** and errors are public. Publish in checked batches, each page with a "last checked" date.
- **Some browsers won't play iPhone (HEVC) videos,** and videos are First Class's main draw (see Videos).
- **Unlabelled influencer posts** are the site's problem as well as theirs. Make labelling part of every agreement.
- **VAT on EU sales** applies from the first sale. Sort it out before taking EU payments.
- **Friends challenges show counts to other people.** Keep them opt-in, counts only.

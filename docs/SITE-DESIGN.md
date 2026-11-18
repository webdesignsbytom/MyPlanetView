# My Planet View: site design

How the site is built and why. Update this file whenever a decision changes. The database is [`server/prisma/schema.prisma`](../server/prisma/schema.prisma).

Last updated: 15 November 2026.

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
| Home, About, FAQ, Pricing, Contact, Privacy, Terms | Login, sign-up, password reset, email verification, the maps, trips, shared views, account, admin |

The SEO playbook (`documents/SEO-PLAYBOOK.md`) applies to the indexed pages:
- titles of 60 characters or fewer;
- descriptions of 120–156 characters, in whole sentences;
- every page's content in the pre-rendered HTML;
- the sitemap lists only the pages above.

Analytics never runs on a share page, because the share code is in the address.

**Planned:** public country pages (`/countries/<slug>`), indexed and in the sitemap. See [FEATURE-PLAN.md](FEATURE-PLAN.md#country-pages-culture-and-seasons).

## Look

The look comes from my_planet, the newer version of the old site: a 1950s travel poster.

**Travel paperwork** (agreed 14 Nov 2026, starting from the boarding-pass login page). Every surface is a piece of vintage travel paperwork. No heavy black borders anywhere; edges are thin saddle brown.

| Surface | Paperwork |
| --- | --- |
| Forms (login, sign-up, contact) | Boarding pass (`TravelTicket` + `TicketStub`) |
| A country, and the country list (16 Nov 2026) | Boarding pass centred over the map (`CountryTicket`): a country's poster on the stub to the left, always, with a status stamp; the name on the parchment header |
| Other panels over the map (settings, stats, trips, sharing) | Paper panel: aged parchment header, cream body, perforated divider, stamp close button |
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
- **Navigation:** parchment with a brown edge, the camera logo, and red poster buttons in the travel face, with the current page inverted. A bar on every page; on the home page a column from `lg` up. "Countries" (the guides) follows Home once a guide is published, as in the footer (16 Nov 2026). On short windows (a laptop's browser page is often 600 to 700 px tall) the column's logo, spacing and buttons shrink in two steps (below 860 and 680 px tall) so every link fits; below about 520 px it stops sticking and scrolls with the page. The Admin menu opens beside the column and upward, as its button sits near the foot.
- **Footer:** the same parchment, brown edge and travel-face headings.
- **Components:** every piece is its own component, one per file. Pages follow the template's `PageHeader` + `MainContainer` pattern.
- **The map** is the existing SVG world map, and only that. There is no Google Maps, MapLibre or other real-world map.
  - Two map styles: Animated sea and Old Map. Each style switches the theme tokens through a `data-map-style` attribute instead of hardcoded classes. Jupiter Clouds and Galaxy, from my_planet, were taken out on 16 Nov 2026 (the user's wish); a profile that saved one opens as the animated sea.
  - **my_planet's extra options:**
    - show / hide the countries you have and haven't been to (a hidden group fades back);
    - a red map banner with the travellers' names;
    - a **Detailed** map type (names, grid lines and landmark pins at every zoom);
    - the sun and the moon on the map, each over the place where it's overhead right now (16 Nov 2026; they used to slide across the screen by the hour), moving with the map and redrawn each minute;
    - wavy lines drifting over the animated sea (paused when the tab is hidden, off for reduced motion).

    my_planet's "detailed" map image is a different projection, so it's only the picker's preview, never a background.
  - **The map is a Robinson projection** (measured 14 Nov 2026 against known coastlines; within about 2 units on a map 2000 wide):
    - x = 987.1 + 5.681 × X(lat) × longitude;
    - y = 502 − 518.6 × Y(lat), negative south of the equator;
    - X and Y are Robinson's standard 5° tables.

    Antarctica runs straight across the bottom like a printed map's (16 Nov 2026): from 58°S the parallels widen smoothly until, from 66°S, they reach the map's sides, so its edges aren't curved; north of 58°S the map is plain Robinson. (A fully rectangular projection, Miller's, was tried and looked worse.)

    So any real position (a landmark, a photo's GPS) can be placed on the map exactly. The equator is at y = 502 and the countries end at about y = 857. Antarctica (Natural Earth, with its ice shelves) fills the bottom down to the South Pole line at 1020.6, and the North Pole line is at -16.6. The map ends exactly at the pole lines and always fills the screen, with no sea beyond its edges (16 Nov 2026). It opens with the North Pole at the top: on a wide screen at the scale it always had, Antarctica a pan away; on a less wide one, pole to pole with the sides a pan away. So the new places never make the world smaller.
  - **Special places** (16 Nov 2026): Antarctica and the four poles (North, Magnetic North, South, Magnetic South) can be marked like countries, but they aren't countries: they have their own count ("Special places n of 5"), a visited one wears a gold expedition stamp instead of the star, and Antarctica and the South Pole make the seventh continent. Antarctica is drawn in an ice colour in every map style; the poles are compass roses inside the map's edges. The magnetic poles move tens of kilometres a year, so their pins follow NOAA's World Magnetic Model and are moved each January, and a photo is never placed at one from its GPS. A map setting, on by default, hides Antarctica and the two South Poles for people who'd rather have the room.
  - **The UK's nations** (16 Nov 2026, the user's decisions): a map can show the UK as England, Scotland, Wales and Northern Ireland, on by default for new maps (18 Nov 2026, the user's wish; it was off until then, and older maps keep their choice). It's per map, not per person, because it changes which country a visit, photo, trip stop or moment belongs to, and everyone on a shared map has to see the same data; the owner chooses it on the welcome page and in Settings, "This map". On a split map each nation is a country in every count ("England and Scotland" is two), and the British Isles badge asks for all four and Ireland. Turning it on moves what has a location (a photo's GPS, a landmark) to its nation and leaves the rest in the UK, "nation not chosen": the UK's ticket asks which nations its old mark means, and the photos wait under "Unplaced photos". Turning it off merges them back, losing nothing: each thing remembers its nation, so turning it on again puts it back. The nations' shapes are the map's own UK shape cut along Natural Earth's real borders (`images/src/tools/uk-nations.mjs`), so the coast doesn't change; England and Scotland show the UK's two posters, Wales and Northern Ireland the placeholder card until they have their own. Travel offers and the country guide stay the UK's.
  - **Regions** (18 Nov 2026, the user's wish): Bali, the Galápagos Islands, Goa, Hawaii, New Caledonia and Tasmania are places in their own right on every map, though each is part of a country (New Caledonia was a country on the map until then; the user: it's France's). Each has its own visit and note, poster, hover card ("Region of Indonesia", then how the map stands with Indonesia) and ticket (its status, first visit, note, the landmarks inside it, and a button to its country's ticket, where its photos and moments are). It's drawn in its country's colour, with its own star once visited, a little smaller than a country's; Goa, too small for a shape, is a dot. A region is never counted as a country or a special place and opens no continent: it has its own count ("Regions n of 6"), and marking one visited marks its country visited too. Photos, trips, moments and landmarks stay the country's, and a photo's GPS finds the country, so nothing about a country's gallery changes. The country list has them under their own heading. Adding one is a row in both country lists, its country and box in `regionPlaces.js`, and a re-run of the outline tool.
  - **Country pins** are the centre of each country's largest shape. Micro-states with no shape are pinned from their real position.
  - **Where the shapes come from.** The old map was hand-copied from simplemaps.com's free world SVG (MIT licence), with mistakes:
    - Belarus didn't draw (a stray quote mark);
    - Chile had only its southern island, twice;
    - Eswatini was listed twice;
    - many paths ended in stray letters.

    Since 18 Nov 2026 (the user's wish: the traced outlines were rough) every country's outline comes from Natural Earth's 1:10m data (public domain), projected as the map projects and simplified to about 2.7 times the old map's detail, each shared border once so neighbours meet exactly, land borders finer than coasts so a photo by a border lands on the right side (images/src/tools/country-outlines.mjs). Zoomed in (from zoom 4), the places in view are drawn from a second, detailed set of outlines, about a pixel from Natural Earth's at the closest zoom (18 Nov 2026, the user's wish: islands such as the Falklands looked jagged close up): one file per place, 2.7 MB in all, fetched only for what's on screen. Where Natural Earth draws the border on the ground differently, the map keeps its old answers (Crimea is Ukraine's, the Golan Syria's, the Old City of Jerusalem Palestine's, and so on: CLAUDE.md). Andorra, Gibraltar, Liechtenstein, Monaco, San Marino, Singapore and the Vatican have no shape and are drawn as a dot at their pin.
  - **Grid lines.** The old latitude/longitude lines were drawn as a straight even grid. On a Robinson map they're redrawn from the projection.
- **Country posters:**
  - The posters cover 170 countries: the user's adventure posters (16 Nov 2026, 117 countries so far, more coming; `images/src/tools/country-posters.mjs`) and my_planet's for the rest (`client/src/utils/map/posterData.js`). They show in the hover box (when you have no photos from there) and, always, on the stub of a country's ticket (whether you've been or not).
  - They live in the public bucket, not the client build: `visitCountryPosters/<name>-800.avif` with an 800 px WebP fallback (`<name>-800.webp`), loaded from `VITE_MEDIA_CDN`. The repo's `media/` folder holds the same files to upload, and serves them in development when `VITE_MEDIA_CDN` isn't set.
  - One size only: 800 px is sharp on retina screens at the sizes posters are shown (the hover box and the 15rem stub), and 400 px looked soft. They're cached for good, so a replaced poster gets a new name.
  - The 57 countries without a poster get a placeholder card with their name in the travel face, never another country's poster.
- **Backgrounds:** the home artwork, the map styles' backgrounds and the "detailed" preview are image sets too.

## Accounts

- **Sign-in:** better-auth with email and password. Roles are `USER`, `ADMIN` and `DEVELOPER`; admin pages check the role on the server.
- **Age.** Accounts are for people aged 13 and over; 13 to 17 year olds need a parent's or guardian's permission, so teenagers can be editors on a family map. Sign-up's terms box, unticked, also confirms the age (16 Nov 2026). Younger children are travellers without a login. The terms' "Children on a map" section and the privacy policy's "Children" section say so.
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
   - make a thumbnail (~400 px) and a display size (~1600 px), and on an Economy map a 2,400 px JPEG print copy instead of uploading the original (the original never leaves the device).

   Re-encoding removes the EXIF from those two files, location included. Resizing in the browser also keeps Vercel's work, and its cost, low.
2. **Upload:** each file goes straight to the **private** bucket through a presigned URL, never through Vercel.
3. **Confirm:** the API checks each file's real size in R2 (the template's confirm-upload step). It then records a `MediaItem` per file, plus the `Photo` and its `PhotoVariant`s.
4. **Country:** the photo's country comes from its GPS position, using an offline lookup against country borders, not a paid API. That marks the country as visited. Without GPS, or with a position in no country (a photo taken at sea), the country the uploader chose is used. A photo left with no country isn't lost: the map's "Unplaced photos" list shows it until someone gives it one.
5. **Landmarks:** landmarks within their match radius are suggested, and the user confirms them.

### Why three files per photo

| File | Typical size | Used for | Location data |
| --- | --- | --- | --- |
| Original (Business and First Class) | 3–8 MB | Owner and editors download it; landmark matching | Kept |
| Print copy (Economy, ~2,400 px JPEG) | ~1 MB | Owner and editors download it; prints up to about A4 | Removed |
| Display (~1600 px) | ~300–500 KB | Opening a photo | Removed |
| Thumbnail (~400 px) | ~30–60 KB | Grids, trip covers | Removed |

- **Speed.** A grid of 50 photos is about 2 MB of thumbnails, against about 250 MB of originals.
- **Privacy.** An original carries GPS precise to a few metres. A viewer who downloads a photo taken at someone's home would have their address.
- **Compatibility.** The copies are in formats every browser shows.
- **No HEIC** (decided 15 Nov 2026). iPhones save HEIC, but an iPhone sends a JPEG when a photo is picked in a browser, and Safari on a Mac does too when the file picker doesn't list HEIC. Only a HEIC file copied to a computer and uploaded from Chrome, Edge or Firefox would need converting, which took a 1.3 MB library whose worker the CSP blocks. So the uploader takes JPEG, PNG and WebP, and a HEIC file gets a message saying to save it as a JPEG first, or add it from the iPhone. The server refuses HEIC for every size.
- **Cost.** The copies add roughly 10% to storage. Resizing on request instead (Cloudflare or Vercel image services) bills per transformation and gets complicated with private files.

### Viewing

- **Signed URLs:** files are served through short-lived signed URLs, so removing someone's access really cuts it off.
- **Viewers** get the thumbnail and display sizes only. They never get hidden photos or GPS coordinates.
- **The best copy** (the original on Business and First Class, the print copy on Economy) can be downloaded by the owner and editors only: "Download original" or "Download print copy". A map's plan is its owner's, whoever uploaded the photo.
- **Print or download** (16 Nov 2026; docs/API.md "Downloads"): editors download a country's, a trip's or the whole map's best copies as one zip, made in the browser from the signed links, so the server moves no bytes and costs nothing (R2 charges nothing for downloads). Never through a share link, never videos. The dialog says originals still hold where each photo was taken. Under the download, the print partner's link, imported like any travel offer (kind `PRINTS`, placement `PRINT`), so choosing a printer needs no code.

### Videos (First Class)

- **Kept by Cloudflare Stream, not R2** (16 Nov 2026), because every video must play in every browser: Stream converts each one (an iPhone's HEVC included) and serves it as HLS. The browser sends the file straight to Stream, resumably, so a dropped phone connection carries on where it stopped.
- **Its location is taken out in the browser** before it's sent, and Stream's copies keep no metadata. A video has no position; the uploader chooses its country.
- **"Preparing…" until it's converted:** its editors see the tile and a card saying so, and the page checks again by itself. Viewers never see a video that isn't ready.
- **No download:** Stream keeps no original file, so a video plays but can't be downloaded (nor through "Download my data").

### Gallery order

Editors drag photos into the order they want, in every gallery: a country's on the map, the unplaced photos, and a trip's.

- **Two orders per photo:** its place in its country's gallery and its place in its trip's (`Photo.countryPosition`, `Photo.tripPosition`). The same photo can be first on the trip and last in its country.
- **New photos go first,** as the lists were newest-first before; the migration kept every gallery's old order. A photo moved to another country or trip goes first there.
- **Moving one photo writes one row.** Positions are numbers with gaps, and a moved photo takes the halfway point between its new neighbours. Only when two neighbours have no room left between them (after dozens of moves into the same gap) is the gallery renumbered, in the same transaction.
- **Who:** a country's order belongs to the map (its editors); a trip's to the trip (a trip-only editor too). Viewers see the order, without the hidden photos.
- **In the browser:** "Rearrange photos" above a gallery switches it to dragging: the mouse, a press and hold on a touch screen (a quick swipe still scrolls), or the keyboard (Space, the arrow keys, Space; a screen reader hears each step). The list moves at once and saves behind it; if the save fails, the list is loaded again. The drag code (dnd-kit, about 16 kB gzipped) loads only then.
- **The whole map's list** (the photo album) stays newest upload first.

## The passport

A book on the poster frame. The cover follows the map owner's plan (16 Nov 2026) and is styled as a real passport (the user's wish, the same day: the first, flat version didn't read as a passport): pebbled leather with foil stamping, the site's name, a raised crest (a compass rose over a globe in a laurel wreath), "Passport" in a book serif, the map's name as a personalised line, its class and the electronic passport's mark at the foot, and a hinge crease by the spine. Economy is burgundy with gold foil, Business navy with silver and a blind-pressed frame, First Class black with gold, a double foil frame and gilt page edges (fixed colours: `cover-*`, `foil-*`). On wide screens the closed passport is one page wide, in the middle. Opening it, it slides to the right-hand side and the cover lifts on the spine, showing only the right-hand page beneath, as a real passport does (the first version showed the whole open spread round the turning cover); pages turn the same way, one sheet at a time. Inside, the cover's leather shows round the pages, a fold shades the middle of each spread, and the running head is split across the two pages. The inside pages are cream paper with a faint printed pattern, a running head and page numbers, bound by a deep-red spine. A visa page is a spread on wide screens: the country, its entry or residence stamp and the dotted outlines still to collect on the left; the stamps on the right. Stamps are SVG rubber stamps in four shapes (circle, oval, rectangle, pennant triangle), tilted −10° to 10° and inked in theme tokens (`colour6`, `colour7`, `colour9`, `status-good`), all hashed from the landmark's id. The name is set on a curve and the photo sits inside; UNESCO sites carry a small temple pictogram (not UNESCO's emblem). Pages turn round the spine on desktop, slide and swipe on phones, and fade with reduced motion. Every stamp is a button that opens its photo.

On the map, landmark pins come in by zoom: about 200 across the whole world, every one of the 1,332 from zoom 12, each country's best-known first. The landmarks stamped in the map's passport are gold and a little bigger (16 Nov 2026), and show whenever pins show at all, as they're the map's own; the map key adds "Stamped landmark" once the map has one.

## Slideshows

A show plays over the page as a modal in the paperwork look: a parchment stage with the photo on its white border, the caption strip (place, confirmed landmarks, the day taken, the caption) and the toolbar's rubber stamps. It starts playing, oldest taken first; Shuffle starts it again in a new random order (a new seed, so the server pages the same order). The whole-map show puts the country's poster up as a title card whenever the country changes. In date order, the map's dated moments ("Got engaged at the Eiffel Tower") come between the photos as diary cards, each where its day falls, up long enough to read (6 seconds at least); a shuffled show has none, as they'd lose their place. Captions are read out only when the viewer moves the show by hand. The screen stays awake while it plays. With reduced motion there's no fade and no slow zoom, just a cut to the next photo. No music.

## Badges and goals

Badges are luggage stickers on a suitcase: an earned one is stuck on, tilted, with a tick and the date it was earned; one not yet earned is a dashed outline with how far along it is, so the words carry the state as well as the colour. Goals sit above the suitcase as paper tags with a progress bar, the numbers, the deadline and the places still to go. Progress shows on the map as a luggage tag under the title (the unmet goal nearest done), which a viewer can hide. A new badge or a reached goal gets one short, polite note at the top of the map that goes by itself after ten seconds; it never blocks the map. On phones the toolbar keeps eight stamps: the stats and the badges open from their tags.

**Monthly photo themes** (16 Nov 2026; docs/API.md "Photo themes") sit between the goals and the suitcase: this month's theme as a noticeboard card (the month, the title in the travel face, its line, how many of the map's photos are in), with "Choose photos" for editors and "Open the album", then last months' albums as links. An album is a dialog of the photos the map entered, newest first. The photo viewer says which themes a photo is in, and editors enter it in this month's from there. No future theme shows, and there's no public gallery: an album is seen only by those who see the map.

**Friends challenges** (16 Nov 2026; docs/API.md "Friends challenges") have their own pages, linked from the nav: `/challenges` lists yours with your count and starts a new one; a challenge's page is its leaderboard (ordinal ranks in the travel face, "(you)" on a red-edged row, a chequered flag for whoever reached the target), the join link to copy, the map that counts for you, and for the starter its changes and deleting it. The join link opens a race ticket (the sign-in pages' boarding pass) saying what it counts, when, and who started it. Others only ever see names and counts.

## Plans and limits

Built on 16 Nov 2026 (FEATURE-PLAN.md, "Tiers" and "Maps", has the reasons; docs/API.md, "Plans and billing" and "Map limits", the rules).

- **Three plans:** Economy (free), Business (£4.99 a month, £49 a year) and First Class (£8.99, £89), paid through Stripe Checkout, with Stripe's billing portal for the card, invoices and cancelling. Admins can give complimentary memberships for a set time. Names, prices and limits live in one constants file on each side (`plans.js`), so renaming a plan never touches the database.
- **A map's plan is its owner's,** for everything: photos per country (30, 200, 1,000, every uploader together), originals or a print copy, and the storage safety net (50 GB and 200 GB per map).
- **One map is included;** each extra map is £3.99 a month (£5.99 on First Class). An extra map that isn't paid for is locked: viewable, shareable and editable, but it takes no new photos. Nothing is ever deleted for lack of payment.
- **People:** up to 10 editors per map and 20 people per trip, on every plan; viewers and share links are unlimited.
- **Transfers and leaving:** an owner can make someone else the owner (an admin can do it for them); a transferred map that finds no free slot gets 60 days' grace. Deleting an account asks what happens to each map and to the photos on other people's maps.
- **Usage is measured per file** (`MediaItem.bytes`), and counts against the map, so editors share its allowance.
- **Downgrades never delete anything:** originals already kept stay, and a country over the new limit keeps its photos but takes no more.
- **Cost:** R2 charges for storage and operations, not for downloads. Storage is the line to watch.
- **The Pricing page** (`/pricing`, indexed) sells the map and the look, not storage. Claims about features not built yet are marked `soon` in `client/src/utils/data/pricingData.js` and must be live, or removed, before launch.
- **Influencer codes.**
  - Each creator gets a code (3–24 letters and digits, stored upper case) and a link, `/sign-up?code=CODE`. A code from a link on any page is kept for the visit, so it's still filled in when the person reaches sign-up.
  - The form checks the code as it's typed and says what it gives: "SAMTRAVELS: your first month of Business or First Class is free. Choose one on your account page once your email is verified. Stripe asks for a card, and nothing is charged for 30 days." A code that can't be used says "That code isn't valid. Check it, or sign up without one.", and the person can sign up with the field cleared.
  - **The offer is the same for every code** (decided 16 Nov 2026): the first month free on the paid plan the follower chooses, as a 30-day Stripe trial on their first paid Checkout, **with a card**. A card up front means free months go to people willing to pay, and Stripe charges when the month ends unless they cancel. Checkout needs a verified address, so throwaway sign-ups get nothing. On the account page the plans then read "Start a free month of Business", and during the month "Free until <date>. Your first payment is then, unless you cancel before."
  - **The creator** gets two years free: a 24-month complimentary membership given from the admin users page (its default).
  - Admins make codes at `/admin/promo-codes`, with a label only they see and optional limits on uses and a last day. They see each code's sign-ups, verified accounts, free months started and paying accounts. A code is turned off rather than deleted, and never renamed, because it's in people's posts; accounts that signed up with it keep their free month.
  - A creator given a free membership in return must label the post as an ad (ASA and CMA influencer guidance).
- **Travel offers admin** (`/admin/offers`). Offers mostly arrive as partner files, so the page leads with the import: matched by key, offers not in the file left alone, a field left out back to its default; it shows which keys are new and which will update before sending, and lists any problems per offer in plain words. Export writes the same shape for offline editing. Each offer is a paper slip with its state in words and 30 days of clicks (numbers per placement and daily bars, never colour alone). Turning an offer off keeps its counts; deleting asks first and says they go too.

## Travel offers

Partner offers are our own cards, never a third party's script. The client fetches every live offer once (`GET /offers`) and chooses in the browser, so nothing about the viewer leaves to choose them.
- **Choosing:** a planned trip with future dates (its destination), then the country being viewed, then the country of the photos around the slot, then general offers; within the group by weight, the same for the same slot every time.
- **Where cards show:** country and trip galleries, after every `ads.every` photos (12 on Economy maps, 24 on Business maps for viewers who don't pay; none for paying viewers or on First Class maps); one on a slideshow's end card; two on each country guide, for everyone. Never while rearranging, in pickers, the passport, account pages, sign-in or sign-up.
- **The Travel Desk** opens only when pressed, on every plan, from trips, the country panel and the guides: a brochure rack with the label "Partner offers. We may earn a commission if you book, at no cost to you.", when to go from the guide's month strip, then offers by kind.
- **Links** go through `/go/:offerId`, which counts offer × day × placement and nothing else; on a planned trip they carry the first stop's place and the trip's dates. Each is labelled "Ad" and opens in a new tab with `rel="sponsored noopener"` and no referrer.
- **Disclosure:** the terms ("Travel offers"), the privacy policy ("Travel offers and affiliate links") and the FAQ ("Why are there travel offers, and do they track me?") say all of this.

## Privacy rules

- Everything is private by default.
- GPS coordinates are shown only to the owner and editors. They are never inside a file a viewer can open.
- Share pages are `noindex`, and analytics doesn't run on them.
- Economy maps show travel offer cards to everyone viewing them, and Business maps show fewer to non-paying viewers ("Travel offers", above). They're plain links with no ad scripts or tracking. Paying members never see them, and a Travel Desk button opens offers on request. See [FEATURE-PLAN.md](FEATURE-PLAN.md#ads-by-tier).
- **A copy of your data, free on every plan** ("Download my data" on the account page; the UK GDPR's rights of access and portability): one JSON file with the account, every map you own and its photos (each with a week-long link to its best copy), and your photos on other people's maps. Other people appear by name only, never by email address, apart from the invites you sent.
- Deleting an account deletes that person's uploads. A map with other editors is handed to one of them first, or the deletion is refused, so nobody loses photos with someone else's account.

## Database

- **The schema:** see [`schema.prisma`](../server/prisma/schema.prisma) (Prisma 7.10.1), with nine migrations so far. The old database only held fake seed data, so the site starts on a fresh database with a new seed. No old data or passwords are carried over. Reviewed before the Phase 1 features in [DATABASE-REVIEW.md](DATABASE-REVIEW.md).
- **Kept from the template:** the better-auth tables, `Profile`, `MediaItem`, `AvatarMediaItem`, a trimmed `ContactForm`, `AppEvent`, and `RateLimit` (from NextDummy).
- **New:**
  - `Country` and `Landmark` (seeded);
  - `TravelMap` (with its group type), `Traveller`, `MapMember`, `Trip`, `TripTraveller`, `TripMember`, `TripStop` and `ShareInvite`;
  - `CountryVisit`;
  - `Photo`, `PhotoVariant` and `PhotoLandmark`;
  - `TripMap`, `Moment`, `MomentTraveller` and `MomentPhoto`;
  - the plans: `Subscription`, `PlanGrant`, `StripeEvent`, `PromoCode`;
  - the passport, badges and goals: `LandmarkCover`, `BadgeAward`, `Goal`.
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

- **Not yet tried for real: R2 and the app against the real API.** The API has run end to end against local Postgres (`npm run test:integration`), and the local database, `myplanetview`, is migrated and seeded. Uploads to R2, signed photo URLs and the browser app talking to the real server haven't been tried; the app has only run in mock mode.
- **Test database.** There's one local database, `myplanetview`, and no separate `_test` or shadow copy (one shadow database is shared by every project). The integration tests still refuse any database whose name doesn't end in `_test`, so that guard has to change before they can run against it.
- **The domain name.** The API, share and media subdomains hang off it. `myplanetview.com` is the intended domain (not registered yet), already in the client and server constants.
- **Landmark coordinates.** All 177 landmarks were checked against Wikidata (14–15 Nov 2026), and each entry names its Wikidata item. For ranges and trails the point is a place travellers photograph (the file's header lists them; the ranges are named after it, e.g. "Pamir (Lake Karakul)"), since a photo is matched by distance.
- **GA4 setting.** In the GA4 property, turn off "page changes based on browser history events". Otherwise a tag loaded earlier can record a share or invite address after an in-app navigation.
- **Who has access.** Editors and viewers can't yet see who else has access: `GET …/sharing` is owner-only, so they see only their own role and a "leave" button.
- **Coarse borders.** A photo taken near a border can be placed in the neighbouring country, because the map's shapes are coarse (Victoria Falls, Kaesong and the Western Wall do). Users can correct the country.
- **Missing shapes.** Andorra, Gibraltar, Liechtenstein, Monaco, San Marino, Singapore and the Vatican are drawn as dots; Bioko and six small Greek islands off Turkey have no shape. The lookups place photos in all of these with circles around known positions. About 575 smaller islands look up correctly but aren't drawn (Euboea, Funen, Lombok, Zanzibar…). A few territories have no entry and leave a photo "Unplaced" (South Georgia, Saint Helena, Pitcairn, the Cook Islands…).
- **Brand assets.** The logo, the passport crest, favicons, app icons and the share image are all made from `my-planet-view-logo.png` by `node images/src/tools/brand-assets.mjs` (16 Nov 2026). The logo carries the name, so the wordmark is the image alone; at favicon sizes only its compass star is legible, so the favicons are the star and the app icons the whole logo on parchment.
- **Client env examples.** `client/.env.development.example` and `client/.env.production.example` still list keys nothing reads. Keep only `VITE_API_URL`, `VITE_MEDIA_CDN` and `VITE_ANALYTICS_ID`.
- **iPhone uploads.** Check on a real iPhone that a photo picked in Safari and in Chrome arrives as a JPEG with its date. Reports say iPhone browsers strip GPS from photos picked in the browser since iOS 16.4; if so, those photos get their country from the uploader's choice and no landmark suggestions.

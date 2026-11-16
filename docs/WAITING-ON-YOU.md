# Waiting on you

Decisions and checks only you can make. Nothing here blocks the build: each item says what the code does until you decide. When you've answered one, tell Claude and it moves the answer into the right doc and deletes it from here.

Started 16 Nov 2026.

## 1. Proofread the 20 country guides

**What this is:** the site will have a public guide page per country (good for Google). The first 20 are written as drafts. Each has an overview, when to go (a rating for every month, and for big countries a strip per region), culture and festivals, phrases, and quick facts (money, plugs, driving side, time, emergency number). They're hidden from the live site until you approve them.

**What you do:** run `npm run dev` in `client/`, open `/countries/<name>` and read each as a traveller would. Drafts show a "Draft, not published" banner. The 20: spain, france, italy, portugal, greece, turkey, ireland, netherlands, germany, croatia, iceland, united-states, canada, mexico, morocco, egypt, japan, thailand, australia, new-zealand.

**What to tell Claude:** whether the page layout works (or what to change), and any fact you know is wrong. A page goes live when its file (`client/src/content/countries/<code>.json`) says `"status": "checked"` with the date in `lastChecked`; tell Claude which ones you've passed and it sets them.

**Facts worth your eye, least sure first in each country:**
- **Canada:** British Columbia stopped changing its clocks in March 2026 and now stays on UTC−7 all year (the page is written around that); drinking ages; Moraine Lake's shuttle season.
- **Turkey:** whether 177 (forest fires) has been folded into 112; Kırkpınar wrestling "usually late June or early July"; Şeb-i Arus "usually 7–17 December".
- **Croatia:** the Sunday shop-opening rule (16 Sundays a year since 2023, under review); Italian "official in parts of Istria"; Wikidata's fire and ambulance numbers look wrong, so the page gives 193 and 194 (noted in the file).
- **Thailand:** the plug line (mostly sockets taking Types A and C, with B, F and O also found; Type O, three round pins, is the national standard and Wikidata lacks it); the alcohol ban on Buddhist holy days; the limits on Yi Peng lantern releases in Chiang Mai.
- **Mexico:** sargassum seaweed timing on the Caribbean coast; tipping 10–15%; the Guelaguetza "usually the two Mondays after 16 July".
- **Egypt:** "restaurant bills often include a service charge"; drones taken at the airport without a permit; some Nile cruises stopping from May to September.
- **Netherlands:** coffeeshops turning away foreign visitors in some border towns, and Amsterdam's ban on smoking cannabis in the street in the red-light district; Keukenhof "usually mid-March to mid-May".
- **Germany:** Rhein in Flammen dates; Oktoberfest's last day (the first Sunday of October, or 3 October).
- **Ireland:** 999 "just as widely used" as 112; Lisdoonvarna's matchmaking festival "usually all of September"; Skellig Michael landings "mid-May to September".
- **France:** Nice Carnival timing; pools wanting close-fitting trunks; Corsica's winter closures.
- **Italy:** Rome's bans on sitting on the Spanish Steps and wading in fountains; paper tickets to stamp on regional trains; Vatican Museums closed on Sundays except the last of the month.
- **Portugal:** motorway tolls left out on purpose (the rules changed in 2025); Madeira's flower festival "usually April or May".
- **Greece:** "service is usually included" (tipping); sites closing on the main Easter days; Samaria Gorge "usually May to October".
- **Australia:** box jellyfish season (about November to May); Sunday and card surcharges; Vivid Sydney "late May to mid-June".
- **New Zealand:** marae customs (dress, shoes, tables); camping limited to self-contained vehicles in many places; the Māori pronunciations.
- **Morocco:** the emergency number "112 from a mobile", and its mains voltage (Wikidata also lists 127 V; the page says 220 V).
- **USA:** the language line ("no federal law names one; a 2025 executive order designated English; Spanish widely spoken"); the six time zones of the 50 states (Wikidata leaves out Hawaii's); Yosemite's Tioga Road and Glacier's Going-to-the-Sun Road opening dates.
- **Spain:** La Tomatina's ticket cap; Barcelona's swimwear fines.
- **Iceland and Morocco:** festival timing (Iceland Airwaves "usually early November", Þjóðhátíð "first weekend of August", Gnaoua "usually June"); Toubkal needing a guide.
- **Everywhere:** the pronunciation guides; Ramadan and Eid dates for 2027 (Turkey, Egypt, Morocco: "February into March", "in May"), which move about 11 days a year and need updating; and the month ratings, which are judgement calls. "Avoid" months are only on regional strips except in Japan (August), Morocco (July, August) and Egypt (June to August).

**Until then:** no country page is built or listed anywhere on the live site.

## 2. Draw about 575 more small islands?

These islands already work: a photo taken on Zanzibar is placed in Tanzania. But the map doesn't draw them, so you see sea where the island is. Examples: Euboea (Greece), Funen (Denmark), Lombok (Indonesia), Zanzibar.

- **Yes:** they appear on the map. The map file grows by about 69 KB, about 20 KB once compressed.
- **No:** they stay invisible but still work.

**Until then:** not drawn.

## 3. Business decisions still open

These were open in `docs/FEATURE-PLAN.md` ("Open decisions"). Each is set in code to a safe default, so nothing waits on them.

| Decision | Example | Until you decide |
| --- | --- | --- |
| **First Class extras:** which extra map styles and passport covers | First Class gets a "Night sky" passport cover and a "Vintage atlas" map style | The passport has one cover for everyone |
| **Affiliate and print partners** | Booking.com for hotels, GetYourGuide for tours, a photobook printer | The cards and the Travel Desk are built and show **example offers** in development (fictional "Example Stays", "Example Tours"… with example.com links, `server/prisma/seed/data/offers.example.json`). Once you join partners, put their links in a file of the same shape and import it on the admin offers page (or `npm run db:offers -- <file>`). Production has no offers until then, so no cards show. |
| **Who writes the monthly photo themes** | "Worst weather" in January, "Street food" in February… | Themes are phase 2; nothing built |
| **VAT:** handle it yourself, or pay a merchant of record such as Paddle | Paddle takes about 5% but files EU VAT for you | Stripe, prices include VAT; ask an accountant before launch |
| **The proposed limits:** photos per country 30/200/1,000; ad cards every 12 photos (every 24 for viewers of Business maps); videos 3 minutes, 500 MB, 20 per country; storage safety nets 50 GB and 200 GB | | Built with these numbers (`server/src/utils/constants/plans.js`) |

## 4. Sample videos for the First Class demo account

The seed has one account per plan (`user@gmail.com` Economy, `business@gmail.com` Business, `firstclass@gmail.com` First Class; all `12345678`). The First Class one is meant to have real videos, but Claude can't download files from here. Four NASA space station time-lapses are chosen (public domain in the US; check the page's Terms of Use): download a small MP4 of each from <https://eol.jsc.nasa.gov/BeyondThePhotography/CrewEarthObservationsVideos/> into `seed-videos/<folder>/video.mp4` (`seed-videos/README.md` lists the titles and folders), then run `npx prisma db seed`.

**Until then:** the seed skips them with a message; everything else works.

## 5. What a travel offer link tells the partner

When someone clicks an offer card or a Travel Desk offer **on a planned trip**, the link carries the trip's first stop and its dates, so the partner's page opens on the right search. Example: "Hotels in Japan" on the trip "Japan in spring" opens the partner's site at Tokyo, 1–14 April. That's what makes the offer useful, and the privacy policy says so. Nothing else is sent: no name, no map, no photos, and not the page the click came from.

- **Keep it:** as built.
- **Don't send the place and dates:** the links go to the partner's general page for that country.

**Until then:** the place and dates are sent.

## 6. Before launch (already in LAUNCH-CHECKLIST.md)

Listed here so nothing is missed. The details are in `docs/LAUNCH-CHECKLIST.md`.

- The terms need payment wording (renewal, cancelling, refunds, extra maps, unpaid maps, complimentary memberships, and a promo code's free month: a card is taken and it renews as a paid plan after 30 days unless cancelled). Today they still say the site is free.
- Stripe: an account, products and prices, and the `STRIPE_*` keys.
- The Pricing page's `soon` claims are each built, or removed.
- On your own computer, after this week's changes: `npm install` in `server/` and `client/`, then `npx prisma migrate dev` and `npm run db:reference` in `server/` (this also moves the Old City of Jerusalem and the Western Wall to Palestine). On a database loaded before 16 Nov, first run `UPDATE "landmark" SET "wikidataId"='Q42725548' WHERE "wikidataId"='Q4526'` (the Sundarbans moved to Bangladesh's own site).

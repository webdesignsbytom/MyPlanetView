# Waiting on you

Decisions and checks only you can make. Nothing here blocks the build: each item says what the code does until you decide. When you've answered one, tell Claude and it moves the answer into the right doc and deletes it from here.

Started 16 Nov 2026.

## 1. Proofread the next 20 country guides

**What this is:** the second batch of public country guides, written as drafts on 16 Nov in the same format as the first 20 (which you passed and are now published): United Kingdom, Belgium, Austria, Czechia, Poland, Hungary, Denmark, Norway, Sweden, Finland, Malta, Cyprus, India, Indonesia, South Korea, China, South Africa, Kenya, Brazil and Argentina (the popular countries that already have a poster). They're hidden from the live site until you pass them.

**What you do:** run `npm run dev` in `client/`, open `/countries/<name>` (e.g. `/countries/united-kingdom`) and read each as a traveller would.

**What to tell Claude:** which ones you pass (it sets `"status": "checked"` and the date), and any fact you know is wrong.

**Facts worth your eye, least sure first in each country:**
- **United Kingdom:** the languages line calls Gaelic, Scots, Irish, Ulster Scots and Cornish "recognised" (the Scottish Languages Act 2025 may have made Gaelic and Scots official in Scotland); NHS 111 in England, Scotland and Wales but not Northern Ireland; tipping 10–12.5%; midges worst June to August on the west coast; the Welsh and Gaelic pronunciations.
- **Belgium:** Ommegang "usually two evenings in early July"; the Flower Carpet in even-numbered years; mussels about July to April; Brussels hotels cheaper at weekends; Sunday opening.
- **Austria:** Slovene, Croatian and Hungarian official in parts of Carinthia and Burgenland (not from Wikidata); the Alps "around two-thirds" of the country; the ski season; November rated "avoid" in the Alps (lifts and huts shut between seasons).
- **Czechia:** July and August rated "good", not "best", because of Prague's crowds (a judgement call); paper tickets to stamp in Prague; big shops shut by law on some holidays; the most beer per person; the ř and ň pronunciations.
- **Poland:** Silesian not official (the 2024 bill was vetoed: check for later changes); "a handful of trading Sundays"; Auschwitz free on your own, guided tours paid, booking online; jaywalking fines; Chopin recitals in Łazienki Park on summer Sundays; saying "dziękuję" as you pay means "keep the change".
- **Hungary:** Budapest Wine Festival "usually in September"; the light show on St Stephen's Basilica at the Christmas market; telling the waiter the total instead of leaving a tip on the table. Sziget and the Gellért baths are left out on purpose (2026 plans unclear).
- **Denmark:** Aarhus Festuge late August to early September; "several hundred islands"; stegt flæsk "often called the national dish"; plugs C, E, F and K.
- **Norway:** supermarket beer until 8 pm on weekdays and 6 pm on Saturdays (the national limit; some towns stop earlier); the right to roam (150 m from houses, two nights) and the fire ban 15 April to 15 September; Pepperkakebyen in Bergen; Svalbard keeping the same time.
- **Sweden:** Medieval Week in Visby "usually early August"; lobster season from late September; the Jokkmokk market in early February; May rated "avoid" in Lapland (the thaw); the pronunciations.
- **Finland:** "nearly 188,000 lakes"; alcohol sold 9 am to 9 pm; two candles in each window on Independence Day; May "avoid" in Lapland; the midnight sun and polar night dates.
- **Malta:** Notte Bianca "usually one night in early October"; no stiletto heels in St John's Co-Cathedral; small shops closing after lunch; the Maltese pronunciations.
- **Cyprus:** about the Republic only; the island's division since 1974, the UN buffer zone and the crossing points are described neutrally. 230–240 V (Wikidata says 240 V, noted); hire cars' red plates and their limits on crossing north; snow on Mount Olympus January to March; Limassol Carnival timing.
- **India:** the older emergency numbers (100, 101, 102/108) still working beside 112; the monsoon dates; Ladakh's roads open about June to October; the regional month ratings, especially Tamil Nadu (November "avoid") and Ladakh (five "avoid" months).
- **Indonesia:** the emergency numbers 110, 113 and 119 (not in Wikidata, noted); Rinjani closed to climbers early in the year; Sumatra driest June to August; Raja Ampat calmest October to April; Lebaran "usually in February or March in the late 2020s"; 230 V (Wikidata also lists 127 V, noted).
- **South Korea:** the 1330 Korea Travel Hotline (not in Wikidata, noted); the festival timings (Jinhae cherry blossom, Boryeong Mud Festival, Busan film festival); cherry blossom late March in the south, early April in Seoul; restaurants that won't seat one diner.
- **China:** the pinyin tone letters (ǎ, ǐ, ǒ, ǔ) and the characters show in a fallback font (the site's Poppins doesn't have them; Japan's page is the same); the Tibet permit rules; Alipay and WeChat Pay taking foreign cards; roaming data from a home SIM not blocked; international driving permits not recognised; Harbin's festival late December into February at around −20°C.
- **South Africa:** the emergency numbers 10111 and 10177 added (Wikidata has only 112); the plug wording (Type M, Type N in newer buildings); festival timings (Minstrel Carnival around 2 January, Hermanus whales late September or early October, the Durban July); the stamp says "Mzansi" (the popular name): you may prefer "South Africa".
- **Kenya:** the Lamu Cultural Festival "usually in November" (least sure); the plastic bag ban and bags taken from luggage on arrival; about 15 kg in a soft bag on small safari planes; no off-road driving in the Mara; M-Pesa with a local SIM.
- **Brazil:** 127 V or 220 V "depending on the city"; Pix usually needing a Brazilian bank account; Parintins "usually the last weekend of June"; the Pantanal strip's January and February "avoid"; summer time ended in 2019 (Wikidata still lists it).
- **Argentina:** 107 for an ambulance added and 117 left out (Wikidata doesn't say what it is); payment advice kept general (the exchange rules keep changing); Guaraní official in Corrientes since 2004; Tango BA "usually in August"; Patagonia's June to August "avoid".
- **Everywhere:** the month ratings are judgement calls; the pronunciation guides.

**Until then:** none of these 20 is built or listed on the live site.

**Also to read: the twelve "Where to go in <month>" pages** (built 16 Nov). Each has a short introduction of its own (`client/src/content/months/<month>.json`); the countries under it come from the guides you've passed, so they need no extra reading. Open `/where-to-go/january` and the rest in `npm run dev` (the month buttons at the foot of each page go through the year). Tell Claude which months to pass. A passed month goes live with the next build, since the 20 published guides already give every month enough countries. Until then no month page is built.

## 2. Draw about 575 more small islands?

These islands already work: a photo taken on Zanzibar is placed in Tanzania. But the map doesn't draw them, so you see sea where the island is. Examples: Euboea (Greece), Funen (Denmark), Lombok (Indonesia), Zanzibar.

- **Yes:** they appear on the map. The map file grows by about 69 KB, about 20 KB once compressed.
- **No:** they stay invisible but still work.

**Until then:** not drawn.

## 3. Business decisions still open

These were open in `docs/FEATURE-PLAN.md` ("Open decisions"). Each is set in code to a safe default, so nothing waits on them.

| Decision | Example | Until you decide |
| --- | --- | --- |
| **First Class's extra map styles:** which ones (the passport covers are decided: one per plan, built 16 Nov) | A "Vintage atlas" and a "Night sky" style only First Class maps can pick | First Class has the four styles everyone has; the Pricing page marks "Extra map styles" soon |
| **Affiliate and print partners** | Booking.com for hotels, GetYourGuide for tours, a photobook printer | The cards and the Travel Desk are built and show **example offers** in development (fictional "Example Stays", "Example Tours"… with example.com links, `server/prisma/seed/data/offers.example.json`). Once you join partners, put their links in a file of the same shape and import it on the admin offers page (or `npm run db:offers -- <file>`). Production has no offers until then, so no cards show. The print partner goes in the same file, with `"kind": "PRINTS"` and `"placements": ["PRINT"]` (see `example-prints`): it then shows under "Print or download". Until then that dialog says any photo printer takes the files. |
| **Who writes the monthly photo themes** | "Worst weather" in January, "Street food" in February… | Built on 16 Nov. Development shows an example year (`server/prisma/seed/themes.js`: Doors, Worst weather, Street food, Lost…; use any of them). Production has none until they're written on the admin page (`/admin/themes`, which lists the months still empty); until then the map's badges panel says there's no theme this month. |
| **Friends challenges: invite by email too?** | Tom types Jo's address and Jo gets an email with the join link (as sharing a map does) | Link only (built 16 Nov): people copy the challenge's link and send it however they like. Email invites would add a template and the same daily caps as sharing. |
| **VAT:** handle it yourself, or pay a merchant of record such as Paddle | Paddle takes about 5% but files EU VAT for you | Stripe, prices include VAT; ask an accountant before launch |

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
- The Pricing page's `soon` claims are each built, or removed. One is left: First Class's extra map styles (your choice, section 3).
- On your own computer, after this week's changes: `npm install` in `server/` and `client/`, then `npx prisma migrate dev` and `npm run db:reference` in `server/` (this also moves the Old City of Jerusalem and the Western Wall to Palestine). On a database loaded before 16 Nov, first run `UPDATE "landmark" SET "wikidataId"='Q42725548' WHERE "wikidataId"='Q4526'` (the Sundarbans moved to Bangladesh's own site).

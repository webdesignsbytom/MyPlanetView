# Waiting on you

Decisions and checks only you can make. Nothing here blocks the build: each item says what the code does until you decide. When you've answered one, tell Claude and it moves the answer into the right doc and deletes it from here.

Started 16 Nov 2026.

## 1. Proofread five country guides

**What this is:** the site will have a public guide page per country (good for Google). Five are written as drafts: Spain, Japan, Iceland, the USA and Morocco. Each has an overview, when to go (a rating for every month), culture and festivals, and quick facts (money, plugs, emergency number, phrases). They're hidden from the live site until you approve them.

**What you do:** run `npm run dev` in `client/`, open `/countries/spain`, `/countries/japan`, `/countries/iceland`, `/countries/united-states` and `/countries/morocco`, and read them as a traveller would. Drafts show a "Draft, not published" banner.

**What to tell Claude:** whether the page layout works (or what to change), and any fact you know is wrong. Then the other 15 of the first 20 get written the same way (France, Italy, Portugal, Greece, Turkey, Ireland, Netherlands, Germany, Croatia, Canada, Mexico, Egypt, Thailand, Australia, New Zealand). The files are `client/src/content/countries/*.json`, with `status: 'draft'`.

**Facts worth your eye, least sure first:**
- Morocco's emergency number "112 from a mobile", and its mains voltage (Wikidata also lists 127 V; the page says 220 V).
- The US language line: "no federal law names one; a 2025 executive order designated English; Spanish widely spoken".
- The US time zones: written as the six zones of the 50 states (Wikidata leaves out Hawaii's).
- Ramadan and Eid al-Adha 2027 ("February into March", "in May"): calculated, and need updating every year.
- La Tomatina's ticket cap; Barcelona's swimwear fines; Toubkal needing a guide.
- Festival timing: Gnaoua "usually June", Iceland Airwaves "usually early November", Þjóðhátíð "first weekend of August".
- Yosemite's Tioga Road and Glacier's Going-to-the-Sun Road opening dates.
- The pronunciation guides, Icelandic and Moroccan Arabic especially.
- The month ratings are judgement calls: Japan's August and Morocco's July and August are "avoid"; Spain and Iceland have no "avoid" month.

**Until then:** no country page is built or listed anywhere on the live site.

## 2. The creator agreement

**What this is:** what a creator must do to earn their two free years. A draft is in `documents/CREATOR-AGREEMENT.md`, written to send to a creator.

**What you do:** read it and fill in the blanks. The draft suggests:
- one post or video showing their own map, within 60 days;
- with their code or link, kept up for at least 12 months;
- labelled "Ad" at the start;
- describing the followers' offer honestly (a card is needed, and it renews after 30 days).

Also confirm that creators get First Class (the draft says so), and have a lawyer look at it before the first one goes out.

**Until then:** nothing waits on it. Codes and memberships work already; the agreement is what you send before giving a creator their membership.

## 3. Draw about 575 more small islands?

These islands already work: a photo taken on Zanzibar is placed in Tanzania. But the map doesn't draw them, so you see sea where the island is. Examples: Euboea (Greece), Funen (Denmark), Lombok (Indonesia), Zanzibar.

- **Yes:** they appear on the map. The map file grows by about 69 KB, about 20 KB once compressed.
- **No:** they stay invisible but still work.

**Until then:** not drawn.

## 4. Business decisions still open

These were open in `docs/FEATURE-PLAN.md` ("Open decisions"). Each is set in code to a safe default, so nothing waits on them.

| Decision | Example | Until you decide |
| --- | --- | --- |
| **First Class extras:** which extra map styles and passport covers | First Class gets a "Night sky" passport cover and a "Vintage atlas" map style | The passport has one cover for everyone |
| **Affiliate and print partners** | Booking.com for hotels, GetYourGuide for tours, a photobook printer | The cards and the Travel Desk are built and show **example offers** in development (fictional "Example Stays", "Example Tours"… with example.com links, `server/prisma/seed/data/offers.example.json`). Once you join partners, put their links in a file of the same shape and import it on the admin offers page (or `npm run db:offers -- <file>`). Production has no offers until then, so no cards show. |
| **Who writes the monthly photo themes** | "Worst weather" in January, "Street food" in February… | Themes are phase 2; nothing built |
| **VAT:** handle it yourself, or pay a merchant of record such as Paddle | Paddle takes about 5% but files EU VAT for you | Stripe, prices include VAT; ask an accountant before launch |
| **The proposed limits:** photos per country 30/200/1,000; ad cards every 12 photos (every 24 for viewers of Business maps); videos 3 minutes, 500 MB, 20 per country; storage safety nets 50 GB and 200 GB | | Built with these numbers (`server/src/utils/constants/plans.js`) |

## 5. Before launch (already in LAUNCH-CHECKLIST.md)

Listed here so nothing is missed. The details are in `docs/LAUNCH-CHECKLIST.md`.

- The terms need payment wording (renewal, cancelling, refunds, extra maps, unpaid maps, complimentary memberships, and a promo code's free month: a card is taken and it renews as a paid plan after 30 days unless cancelled). Today they still say the site is free.
- Stripe: an account, products and prices, and the `STRIPE_*` keys.
- The Pricing page's `soon` claims are each built, or removed.
- On your own computer, after this week's changes: `npm install` in `server/` and `client/`, then `npx prisma migrate dev` and `npm run db:reference` in `server/` (this also moves the Old City of Jerusalem and the Western Wall to Palestine). On a database loaded before 16 Nov, first run `UPDATE "landmark" SET "wikidataId"='Q42725548' WHERE "wikidataId"='Q4526'` (the Sundarbans moved to Bangladesh's own site).

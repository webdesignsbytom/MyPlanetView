# Pre-launch checklist

Work through this before My Planet View goes live. Items marked **[block]** stop the launch until they're done. The reasons behind the SEO items are in `documents/SEO-PLAYBOOK.md`: the rules in section 3, its own launch checklist in section 4.1, and section 6.22 for a pre-rendered site like this one.

## 1. Identity and content

- [ ] **[block]** Register `myplanetview.com` (not registered yet). It is already the domain in the client and server constants; use the bare domain, with `www.` redirecting to it.
  - `client/src/utils/constants/constants.js`: `FULL_BUSINESS_URL`, `SHORT_BUSINESS_URL`, `DISPLAY_BUSINESS_URL`, `CompanyEmailAddress`.
  - `server/src/utils/constants/siteConstants.js`: `BusinessUrl`, which must be the same host (`server/tests/siteUrl.test.js` checks it).
- [ ] **[block]** The operator details in `constants.js` (`OperatorName`, director, address lines) are the ones you want published. The legal page and the structured data print them.
- [ ] **[block]** The travel font's licence allows web use on a public site. `client/src/assets/fonts/TravelFont/SFComicScript-Bold.ttf` (SF Comic Script, ShyFonts) came from the old my_planet site with no licence file. Check it, buy a licence, or swap the face in `styles/fonts.css`. It also ships as a 46 KB TTF; convert it to woff2 once it's cleared.
- [ ] **[block]** The posters and backgrounds from my_planet (`media/visitCountryPosters/`, `client/src/assets/images/pages/home/`, `map-styles/`, `brand/logo-*`) are yours to publish: AI-generated or licensed. 57 countries still have no poster and show a placeholder card (`utils/map/posterData.js` lists the ones that do).
- [ ] **[block]** Replace ByteToast's brand assets (the camera logo from my_planet is in `client/src/assets/images/brand/` and is what the navbar uses):
  - `client/public/brand/logo.png`;
  - `client/public/brand/og-default.jpg` (1200 × 630, the share image);
  - everything in `client/public/favicon/` (ico, svg, 96 px, apple-touch, and the 192 and 512 manifest icons), plus a maskable 512 px icon for the installable app (`docs/FEATURE-PLAN.md`, "Installable app").
- [ ] **[block]** The legal text (`client/src/utils/data/termsData.js`) has been reviewed by you, or someone qualified. It's a plain-English draft covering R2 storage, GPS kept only on originals, analytics only after consent, account deletion, the shared-map hand-over, and children (accounts from 13; 13 to 17 with a parent's or guardian's permission; an owner adding an under-18 editor confirms that permission).
- [ ] **[block]** The ICO's Children's Code (Age Appropriate Design Code) self-assessment is done, since teenagers can have accounts and be editors: private by default, photo locations shown only to editors, no nudging, no profiling. Record the outcome next to the legal text. See `docs/FEATURE-PLAN.md`, "Children and editors".
- [x] **[block]** Every landmark in `server/prisma/seed/data/landmarks.js` is checked against Wikidata, each with its `// Wikidata Q…` item: 161 on 14 Nov 2026, the last 16 (Badaling, Malabo Cathedral, Fort George, Copán, Petra, Tien Shan, Ohrid, Timbuktu, Aïr and Ténéré, Kokoda Track, Trinidad, La Soufrière, Papaseʻea, Alhambra, Pamir, Old Sanaa) on 15 Nov. `client/src/dev/mock/data/landmarks.js` is a fresh copy.
  - Where one point can't describe the place, the file's header names a stand-in that travellers photograph, and the two ranges are named after theirs: "Tien Shan (Ala-Archa)" (15 km) and "Pamir (Lake Karakul)" (30 km). Kokoda Track is centred on Efogi, half-way, with 35 km reaching both trailheads. Papaseʻea's Wikidata item has no coordinate, so its point is OpenStreetMap's. Re-copy the file to the mock after any change.
- [ ] The magnetic poles' pins (`QN`, `QS` in both country lists) are this year's positions from NOAA's World Magnetic Model; they were set to 2025's on 15 Nov 2026. Repeat every January.
- [ ] `client/src/utils/constants/links.js` holds real profile URLs, or stays empty (an empty URL hides the link).
- [ ] Every claim on the home, about, FAQ and **Pricing** pages matches what the app actually does. The Pricing page's claims marked `soon: true` in `client/src/utils/data/pricingData.js` (ads, the Travel Desk, videos, extra styles and covers, passport, slideshows, challenges, country guides, "a copy of all your data") are each built, or removed.
- [ ] **[block]** The terms (`client/src/utils/data/termsData.js`) cover payments before they go live: renewal, cancelling at the end of the period, refunds, extra maps, what happens to an unpaid map, complimentary memberships, and a promo code's free month (a card is taken, and it renews as a paid plan after 30 days unless cancelled first). Today they still say the site is free.
- [ ] Each indexable page's description says what the page answers, with a fact from the page. The build checks length and uniqueness, not wording.

## 2. Storage (Cloudflare R2)

- [ ] **[block]** Two buckets for My Planet View, not shared with another site:
  - a public one (country posters, avatars, contact images), served from a **custom domain**. `r2.dev` addresses are rate-limited and meant for development;
  - a private one (travel photos).
- [ ] **[block]** The country posters are uploaded to the public bucket: the contents of the repo's `media/` folder, keeping its paths, so each poster's key is `visitCountryPosters/<name>-800.avif` (and `.webp`). The site no longer bundles them, so without this every poster is a broken image.
- [ ] **[block]** CORS on the private bucket allows `PUT` with `Content-Type` from the site's origin (`node ./src/services/s3/setPrivateBucketCors.js` from `server/`; it prints bucket details, so run it yourself). Check the public bucket too (`checkBucketCors.js`).
- [ ] **[block]** The CSP in `client/public/.htaccess` names the real hosts. It still has the template's placeholders (`api.client.com`, `nbg1.your-objectstorage.com`). It needs:
  - `connect-src`: the API, and the R2 endpoint the browser `PUT`s to;
  - `img-src`: the public media domain and the R2 endpoint the signed photo URLs point at.

  Without these, uploads and photos are blocked.
- [ ] `STORAGE_PUBLIC_HOST` (server) and `VITE_MEDIA_CDN` (client) are the public bucket's custom domain.

## 3. Server, database and email (Vercel)

- [ ] **[block]** Production env on Vercel has every key in `server/.env.example`:
  - `NODE_ENV=production`;
  - `DATABASE_URL` = the provider's **pooled**, transaction-mode URL (Neon's `-pooler` host, Supabase's pooler on port 6543): every Vercel instance opens its own connections. `DIRECT_DATABASE_URL` = the direct URL, used only by `prisma migrate`. `DB_POOL_MAX` = 5 (the default) unless the provider's limits say otherwise;
  - `BETTER_AUTH_URL` = the API's public URL, plus a fresh `BETTER_AUTH_SECRET`;
  - `FRONTEND_ORIGIN` = the bare domain;
  - `CRON_SECRET`;
  - `IS_PRODUCTION_DATABASE=true`;
  - `STORAGE_*` and `STORAGE_PRIVATE_*`.
- [ ] **[block]** The API is on a subdomain of the site (`api.<domain>`), so the login cookie is same-site.
- [ ] **[block]** `npx prisma migrate deploy` against production, with `IS_PRODUCTION_DATABASE=true` set so the seed can never run there. Never seed production. Then `npm run db:reference` (in `server/`) to load the countries and landmarks: it creates or updates rows and never deletes, so it's safe there. Run it again whenever `prisma/seed/data/` changes.
- [ ] A real admin account exists, promoted on the database user. Sign-up only makes `USER`.
- [ ] **[block]** Email: myplanetview.com is verified in Resend (its DNS records added), `EMAIL_FROM` is an address on it and `RESEND_API_KEY` is set in Vercel. Then one verification email, one password reset, one share invite and one contact-form notification each arrive in your own inbox.
- [ ] `npm test` passes in `server/`.
- [ ] **[block]** Payments (Stripe), tried end to end in **test mode** first, then repeated in live mode:
  - **Products and prices** in GBP, matching `server/src/utils/constants/plans.js`: Business £4.99 a month and £49 a year; First Class £8.99 and £89; an extra map £3.99 and £39 (Economy and Business owners), and £5.99 and £59 (First Class owners). Each price's id goes in its `STRIPE_PRICE_*` key (`server/.env.example` lists them), set in Vercel with `STRIPE_SECRET_KEY`.
  - **The webhook** points at `https://api.<domain>/api/billing/webhook`, with the `checkout.session.completed` and `customer.subscription.created`, `.updated` and `.deleted` events. Its signing secret goes in `STRIPE_WEBHOOK_SECRET` Pick the API version the server's `stripe` package (23.1.0) was built for, `2026-10-28.endive`.
  - **The customer portal** is set up in Stripe's dashboard: update the payment method, see invoices, cancel at the end of the period.
  - **VAT** is decided with an accountant (FEATURE-PLAN.md, "Payments"): Stripe Tax, prices including VAT, or a merchant of record.
  - **One full round:**
    1. Pay for Business with a test card.
    2. Add an extra map.
    3. Switch to yearly.
    4. Cancel in the portal.
    5. Check that the maps lock (viewable, no new photos) and nothing is deleted.
- [ ] **Travel offers:** you've joined the partners you want (Booking.com, GetYourGuide, Skyscanner, an eSIM and an insurer, or an aggregator such as Travelpayouts), checked each one's terms allow our own cards and plain links, and imported a real offers file (the admin's offers page, or `npm run db:offers -- <file>` in `server/`; the format is in docs/API.md, "Travel offers"). Without offers no card shows, which is safe. Then click one card of each kind on the live site: it lands on the partner with the destination and dates filled where the link has them, and the admin page counts the click.
- [ ] The affiliate disclosure is in the Privacy and Terms text and the FAQ, and each card says **Ad** (UK CAP Code).

## 4. Client build and hosting (InMotion / cPanel)

- [ ] **[block]** The client env files have no `NODE_ENV`, and `client/.env.development.example` and `client/.env.production.example` keep only the keys the code reads: `VITE_API_URL`, `VITE_MEDIA_CDN`, `VITE_ANALYTICS_ID`. Remove the YouTube, Spotify, Sentry, refresh-token and PayPal keys.
- [ ] **[block]** `npm run build` passes: `check:meta`, `check:house-rules`, pre-render and `check-seo`.
- [ ] **[block]** Upload everything in `client/dist/`, including `.htaccess`, `404.html` and `app-shell.html`. `www.` and `http://` redirect to the bare domain with a 301 (`.htaccess` does it).
- [ ] **[block]** Every subdomain opens over `https://` with a padlock: `api.`, `www.`, and cPanel's `mail.`, `webmail.` and `cpanel.` (InMotion's AutoSSL normally covers them). `.htaccess` sends HSTS with `includeSubDomains`, so once a browser has seen the site it refuses plain `http://` on every subdomain for a year.
- [ ] **[block]** After deploying, `npm run check:seo -- --live https://<domain>` passes (from `client/`). It checks that:
  - every sitemap URL answers 200 with its own head tags;
  - unknown URLs 404;
  - redirects work;
  - robots.txt names the sitemap;
  - the search, AI and link-preview bots get a 200.
- [ ] The app pages (`/map`, `/maps/…`, `/trips/…`, `/shared/…`, `/invite/…`, `/welcome`) load from a direct link (the app shell), and they aren't in the sitemap.
- [ ] Lighthouse on mobile, median of three runs, on each public page: SEO 100, accessibility 95 or more, CLS near 0.

## 5. The app, on real devices

Test signed out, as a brand-new account, and on a phone in portrait:

- [ ] Sign up → verify → onboarding (solo, couple, family; travellers) → reset password → change email → delete account. The account with shared maps hands them to an editor.
- [ ] Map: pan and zoom with a mouse, a trackpad, one finger and two fingers; all four styles; the settings save and come back after signing in on another device.
- [ ] Countries: mark visited, lived and want to go from the map and the country list; the stats add up.
- [ ] Uploads: JPEG and PNG; photos from an iPhone (in Safari and in Chrome) arrive as JPEGs, and a `.heic` file from a computer gets the "save it as a JPEG" message; a photo with GPS lands in the right country with landmark suggestions (reports say iPhone browsers strip GPS from photos picked in the browser since iOS 16.4: check whether it survives); one without GPS asks for a country; the original downloads, and the copies carry no location data.
- [ ] Trips: create, add and reorder stops, mark completed (its countries become visited), photos into a trip.
- [ ] Passport, slideshows, badges and goals: confirm a photo's landmark and see its stamp in the passport (turn pages with a mouse, the arrow keys and a swipe); landmark pins show and stay round in Safari as well as Chrome; a slideshow keeps the phone's screen awake and plays full screen; a new badge's note appears once.
- [ ] A promo code: sign up from `/sign-up?code=<CODE>`, verify the address, and the account page offers a free month; Checkout (Stripe test mode) asks for a card and shows 30 days free; back on the account page it says "Free until <date>"; the admin's promo codes page counts the sign-up and the free month.
- [ ] Sharing:
  - add a viewer and an editor by email, both existing users and a new address (the invite turns into access after sign-up and verification);
  - "Anyone with the link" on and off;
  - reset link (old links stop working);
  - a trip shared on its own;
  - viewers never see hidden photos, GPS or originals.
- [ ] Link previews: a shared link pasted into WhatsApp or iMessage shows a sensible preview.

## 6. Measurement, before launch day

- [ ] Google Search Console: Domain property verified, `sitemap.xml` submitted.
- [ ] Bing Webmaster Tools: imported from Search Console, sitemap submitted.
- [ ] **[block]** GA4: `VITE_ANALYTICS_ID` is set; analytics starts only after cookie consent (accept and decline once each). In the property, "page changes based on browser history events" is **off**, so share and invite addresses are never recorded.
- [ ] The privacy policy names the cookies and analytics the site actually uses (`COOKIE_CONSENT_STYLE` is `'banner'`).
- [ ] Launch-day baseline recorded: indexed pages, Lighthouse scores, brand searches. Search Console checked weekly for the first two months.
- [ ] A plan for the first outside links, and the brand name searched to see what else owns the results.

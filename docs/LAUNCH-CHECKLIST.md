# Pre-launch checklist

Work through this before My Planet View goes live. Items marked **[block]** stop the launch until they're done. The reasons behind the SEO items are in `documents/SEO-PLAYBOOK.md`: the rules in section 3, its own launch checklist in section 4.1, and section 6.22 for a pre-rendered site like this one.

## 1. Identity and content

- [ ] **[block]** Register `myplanetview.com` (not registered yet). It is already the domain in the client and server constants; use the bare domain, with `www.` redirecting to it.
  - `client/src/utils/constants/constants.js`: `FULL_BUSINESS_URL`, `SHORT_BUSINESS_URL`, `DISPLAY_BUSINESS_URL`, `CompanyEmailAddress`.
  - `server/src/utils/constants/siteConstants.js`: `BusinessUrl`, which must be the same host (`server/tests/siteUrl.test.js` checks it).
- [ ] **[block]** The operator details in `constants.js` (`OperatorName`, director, address lines) are the ones you want published. The legal page and the structured data print them.
- [ ] **[block]** The travel font's licence allows web use on a public site. `client/src/assets/fonts/TravelFont/SFComicScript-Bold.ttf` (SF Comic Script, ShyFonts) came from the old my_planet site with no licence file. Check it, buy a licence, or swap the face in `styles/fonts.css`. It also ships as a 46 KB TTF; convert it to woff2 once it's cleared.
- [ ] **[block]** The posters and backgrounds from my_planet (`media/visitCountryPosters/`, `client/src/assets/images/pages/home/`, `map-styles/`) and the new logo, `my-planet-view-logo.png` (with everything made from it: `client/src/assets/images/brand/`, `client/public/brand/`, `client/public/favicon/`), are yours to publish: AI-generated or licensed. Every one of the 243 places has a poster (`utils/map/posterData.js`; checked 26 Nov 2026).
- [x] **[block]** Replace ByteToast's brand assets: done 16 Nov 2026 with the new logo. `node images/src/tools/brand-assets.mjs` made the wordmark, the passport crest, `client/public/brand/logo.png` (emails, structured data), `og-default.jpg` (1200 × 630) and all of `client/public/favicon/`, plus a maskable 512 px icon in the manifest. Check the share image in a link preview once the site is live.
- [ ] **[block]** The legal text (`client/src/utils/data/termsData.js`) has been reviewed by you, or someone qualified. It's a plain-English draft covering R2 storage, GPS kept only on originals, analytics only after consent, account deletion, the shared-map hand-over, and children (accounts from 13; 13 to 17 with a parent's or guardian's permission; an owner adding an under-18 editor confirms that permission).
- [ ] **[block]** The ICO's Children's Code (Age Appropriate Design Code) self-assessment is done, since teenagers can have accounts and be editors: private by default, photo locations shown only to editors, no nudging, no profiling. Record the outcome next to the legal text. See `docs/FEATURE-PLAN.md`, "Children and editors".
- [x] **[block]** Every landmark in `server/prisma/seed/data/landmarks.js` is checked against Wikidata, each with its `// Wikidata Q…` item: 161 on 14 Nov 2026, the last 16 (Badaling, Malabo Cathedral, Fort George, Copán, Petra, Tien Shan, Ohrid, Timbuktu, Aïr and Ténéré, Kokoda Track, Trinidad, La Soufrière, Papaseʻea, Alhambra, Pamir, Old Sanaa) on 15 Nov. `client/src/dev/mock/data/landmarks.js` is a fresh copy.
  - Where one point can't describe the place, the file's header names a stand-in that travellers photograph, and the two ranges are named after theirs: "Tien Shan (Ala-Archa)" (15 km) and "Pamir (Lake Karakul)" (30 km). Kokoda Track is centred on Efogi, half-way, with 35 km reaching both trailheads. Papaseʻea's Wikidata item has no coordinate, so its point is OpenStreetMap's. Re-copy the file to the mock after any change.
- [ ] The magnetic poles' pins (`QN`, `QS` in both country lists) are this year's positions from NOAA's World Magnetic Model; they were set to 2025's on 15 Nov 2026. Repeat every January. From the January after `MAGNETIC_POLES_YEAR`, the admin overview says so under "To do" and the admins get an email once a year (26 Nov 2026).
- [ ] Photo themes: on the live site's `/admin/themes`, press "Fill the empty months" (a suggested theme for each month of the coming year), then change any you'd like. Without it the badges panel says there's no theme this month.
- [ ] `client/src/utils/constants/links.js` holds real profile URLs, or stays empty (an empty URL hides the link).
- [ ] Every claim on the home, about, FAQ and **Pricing** pages matches what the app actually does. Any claim marked `soon: true` in `client/src/utils/data/pricingData.js` (none since 21 Nov 2026, when First Class's "extra map styles" gave way to every map's own design) is built, or removed.
- [ ] **[block]** The payment terms (`client/src/utils/data/termsData.js`, drafted 16 Nov 2026: plans and prices, renewing and cancelling, "14 days to change your mind", changing plan, free memberships and promo codes, and Stripe in the privacy policy) have been reviewed by you or someone qualified before payments go live.
- [ ] **[block]** Stripe is set up as the terms say: the customer portal cancels **at the end of the billing period** (not at once), and Stripe's emails about **upcoming renewals** are on (the terms promise a reminder before a yearly plan renews). Failed payments: the retry schedule ends in "cancel the subscription".
- [ ] Check whether the UK's new subscription rules (Digital Markets, Competition and Consumers Act 2024: renewal reminders, and a fresh cooling-off period when a free trial turns paid and at yearly renewals) are in force at launch, and whether the terms or Stripe settings need more. The 14-day full refund already covers the first payment.
- [ ] Each indexable page's description says what the page answers, with a fact from the page. The build checks length and uniqueness, not wording.

## 2. Storage (Cloudflare R2)

- [ ] **[block]** Two buckets for My Planet View, not shared with another site:
  - a public one (country posters, avatars, contact images), served from a **custom domain**. `r2.dev` addresses are rate-limited and meant for development;
  - a private one (travel photos).
- [ ] **[block]** The country posters are uploaded to the public bucket: the contents of the repo's `media/` folder, keeping its paths, so each poster's key is `visitCountryPosters/<name>-800.avif` (and `.webp`). The site no longer bundles them, so without this every poster is a broken image. `npm run media:upload` (in `server/`) sends both folders, only the files the bucket lacks.
- [ ] **[block]** The landmark photos are uploaded to the public bucket beside the posters: `media/landmarkPhotos/` (2,662 files, about 79 MB: `<slug>-<width>.avif` and `.webp`) as `landmarkPhotos/`. Without them every landmark card shows its icon instead of a photo. Their credits are in `client/src/utils/map/landmarkPhotos.js`.
- [ ] **[block]** CORS on the private bucket allows `PUT` with `Content-Type`, and `GET` ("Print or download" reads each photo with `fetch()` to zip it; the script allows both), from the site's origin (`node ./src/services/s3/setPrivateBucketCors.js` from `server/`; it prints bucket details, so run it yourself). Check the public bucket too (`checkBucketCors.js`).
- [ ] **[block]** The CSP in `client/public/.htaccess` (and `client/netlify.toml`) names the real hosts. Since 17 Nov 2026 it names the API (`my-planet-view.vercel.app`) and Cloudflare's whole `*.r2.dev`, `*.eu.r2.cloudflarestorage.com` and `*.cloudflarestream.com`; since 26 Nov 2026 Google Analytics' hosts as Google's CSP guide lists them. At launch:
  - `connect-src`: the API on `api.<domain>`, and the R2 endpoint the browser `PUT`s to (narrowed from the whole domain);
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
  - `STORAGE_*` and `STORAGE_PRIVATE_*`;
  - `MEMORY_EMAILS_PER_DAY`: the most "On this day" and "Welcome home" emails a day, both together (60 when empty). Keep it below the Resend plan's daily limit, so sign-up and password emails always have room: the free plan allows about 100 a day, so on it leave 60 or less; on a paid plan raise it.
- [ ] **[block]** The API is on a subdomain of the site (`api.<domain>`), so the login cookie is same-site.
- [ ] **[block]** `npx prisma migrate deploy` against production, with `IS_PRODUCTION_DATABASE=true` set so the seed can never run there. Never seed production. Then `npm run db:reference` (in `server/`) to load the countries and landmarks: it creates or updates rows and never deletes, so it's safe there. Run it again whenever `prisma/seed/data/` changes.
- [ ] A real admin account exists, promoted on the database user. Sign-up only makes `USER`.
- [ ] **[block]** Email: myplanetview.com is verified in Resend (its DNS records added), `EMAIL_FROM` is an address on it and `RESEND_API_KEY` is set in Vercel. Then one verification email, one password reset, one share invite and one contact-form notification each arrive in your own inbox.
- [ ] Your own admin account is verified and active: the daily jobs email the admins when one fails (26 Nov 2026). After the first day live, the admin dashboard's "Daily jobs" shows both as "Ran fine".
- [ ] `npm test` passes in `server/`.
- [ ] **[block]** Payments (Stripe), tried end to end in **test mode** first, then repeated in live mode:
  - **Products and prices** in GBP, matching `server/src/utils/constants/plans.js`: Business £4.99 a month and £49 a year; First Class £9.99 and £99; an extra map £3.99 and £39 (Economy and Business owners), and £5.99 and £59 (First Class owners). Each price's id goes in its `STRIPE_PRICE_*` key (`server/.env.example` lists them), set in Vercel with `STRIPE_SECRET_KEY`.
  - **The webhook** points at `https://api.<domain>/api/billing/webhook`, with the `checkout.session.completed`, `customer.subscription.created`, `.updated` and `.deleted`, and `charge.refunded` (gifts: a refunded gift stops working; docs/API.md "Gifts") events. Its signing secret goes in `STRIPE_WEBHOOK_SECRET` Pick the API version the server's `stripe` package (23.1.0) was built for, `2026-10-28.endive`.
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
- [ ] **[block] Videos (Cloudflare Stream):** Stream is enabled on the Cloudflare account (the one with the R2 buckets), and the server env has `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_STREAM_API_TOKEN` (Stream: Edit) and `CLOUDFLARE_STREAM_CUSTOMER_CODE`; `node src/services/stream/createSigningKey.js` (in `server/`) has made the signing key and its two values are set; `node src/services/stream/setWebhook.js https://<api host>/api/videos/stream-webhook` has set the webhook and `CLOUDFLARE_STREAM_WEBHOOK_SECRET` is set. Then, as a First Class account, upload one video from an iPhone and one from Android: each shows "Processing…", then plays in Safari, Chrome and Firefox. Check the Stream bill's first month.

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
- [ ] "Download my data" (account page): the file downloads on a phone and a computer, holds every map you own with its photos, and a photo's link in it opens the original (or an Economy map's print copy).
- [ ] **Installable app:** the real icons are in `client/public/favicon/` (192 and 512 px, plus a maskable 512 px one added to the manifest in `vite.config.js` with `purpose: 'maskable'`). On Android (Chrome) "Install app" appears and the installed app opens without the browser bar; on an iPhone "Add to Home Screen" works and signing in holds (it needs the API on `api.<domain>`). After a deploy, the installed app picks up the new version on its next start. Open the installed app once online and wait a minute, then turn flight mode on: the map says "You're offline", and the public pages (home, FAQ, pricing, a country guide you never opened) still open.

## 6. Measurement, before launch day

- [ ] Google Search Console: Domain property verified, `sitemap.xml` submitted.
- [ ] Bing Webmaster Tools: imported from Search Console, sitemap submitted.
- [ ] **[block]** IndexNow (26 Nov 2026): once the site is live on its domain, `npm run indexnow -- --all` from `client/` (every page, once), then check Bing Webmaster Tools' IndexNow page shows them. After that the weekly GitHub Action ("IndexNow", Mondays) sends the pages changed in the week; after a deploy that changes pages, run it by hand from the Actions tab or `npm run indexnow`.
- [ ] **[block]** GA4: `VITE_ANALYTICS_ID` is set; analytics starts only after cookie consent (accept and decline once each). In the property, "page changes based on browser history events" is **off**, so share and invite addresses are never recorded.
- [ ] The privacy policy names the cookies and analytics the site actually uses (`COOKIE_CONSENT_STYLE` is `'banner'`), and the events it counts (1.4.0, 26 Nov 2026).
- [ ] In GA4, mark `sign_up` and `purchase` as key events, and check in Realtime that `sign_up`, `mark_country`, `upload_photos`, `share`, `begin_checkout` and `purchase` arrive after accepting analytics, and nothing after declining (`client/src/utils/analytics/events.js`).
- [ ] Launch-day baseline recorded: indexed pages, Lighthouse scores, brand searches. Search Console checked weekly for the first two months.
- [ ] A plan for the first outside links, and the brand name searched to see what else owns the results.

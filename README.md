# My Planet View

A private travel map of the world. People mark the countries they've been to, add photos from their trips (matched to landmarks from each photo's location), plan new trips, and share a map or a single trip with friends, Google Docs style. A map can be for a solo traveller, a couple or a family.

- **client/**: React 19 + Vite + Tailwind 4. The public pages (home, about, FAQ, contact, legal) are pre-rendered at build; the map app runs in the browser. Hosted on InMotion (cPanel).
- **server/**: Express 5 API with Prisma 7 (Postgres), better-auth accounts, Cloudflare R2 storage (a public and a private bucket) and SMTP email. Hosted on Vercel.
- **docs/** (repository root): `SITE-DESIGN.md` (decisions and reasons) and `API.md` (the travel API contract).

## Set up

1. **Env files.** Fill these in yourself; the variable names are listed below.
   - **Client:** copy `client/.env.development.example` and `client/.env.production.example` without the `.example`. The client reads only `VITE_API_URL`, `VITE_MEDIA_CDN` and `VITE_ANALYTICS_ID`. Don't put `NODE_ENV` in them: a `NODE_ENV=development` line makes the build fail.
   - **Server:** copy `server/.env.example` to `server/.env`. It needs:
     - `DATABASE_URL`, `DIRECT_DATABASE_URL`, `SHADOW_DATABASE_URL`, `DB_POOL_MAX`;
     - `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`;
     - `FRONTEND_ORIGIN` (comma-separated);
     - `CRON_SECRET` and `IS_PRODUCTION_DATABASE`;
     - `EMAIL_HOST` and `EMAIL_PORT`, plus `USER_ADMIN_*`, `USER_VERIFY_*`, `USER_RESET_*`, `CONTACT_ADMIN_*` and `CONTACT_ADMIN_RECIEVER_EMAIL`;
     - `STORAGE_*` (the public bucket) and `STORAGE_PRIVATE_*` (the photos bucket; each falls back to its `STORAGE_*` twin).

     Then run `npm run env:check` in `server/`. It lists missing keys by name, never values.
2. **Database** (a Postgres you own), from `server/`:
   ```bash
   npm install
   npx prisma migrate dev     # creates the tables
   npx prisma db seed         # countries, landmarks, demo accounts and a demo couple's map (wipes every table)
   ```
   The seed refuses to run when `IS_PRODUCTION_DATABASE=true`. Demo logins: `user@gmail.com`, `tom@gmail.com` (admin) and `dev@gmail.com`, all with password `12345678`.
3. **Run it:**
   ```bash
   cd client && npm run dev   # site on :5173, signed in as a test user, no server needed
   ```
   The first time on a machine, run `npx playwright install chromium` in `client/`; pre-rendering and the e2e tests need it.

   **Mock mode is the default in development.**
   - `npm run dev` runs the site with no API at all. You're signed in as a test user, and a demo couple's map, trips, photos and shares are answered in the browser (saved in localStorage).
   - The "Mock mode" tab on the left edge switches role (user, admin, developer), resets the demo data, and has **Use real API**. `?mockRole=ADMIN` works too.
   - Open `/invite/demo-invite` to try accepting an invite.
   - None of it is in production builds.

   **Against the real API:**
   1. Start the server: `cd server && npm run dev` (API on :4000).
   2. Add `?api=real` to the site's address, or press **Use real API** on the Mock mode tab. The choice is remembered in that browser.
   3. To go back, add `?api=mock`.

   `npm run dev:mock` always forces mock mode.

## Commands

**client/**

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server on :5173, in mock mode unless you've chosen `?api=real` |
| `npm run dev:mock` | Always mock mode: signed in as a test user, the API answered in the browser from demo data |
| `npm run build` | Checks page meta and the house rules, builds, pre-renders the public pages, writes the sitemap and robots.txt, then runs the SEO check |
| `npm run preview` | Serves `dist/` the way the host will |
| `npm run lint` | ESLint |
| `npm run check:meta` | Page titles and descriptions within the limits |
| `npm run check:house-rules` | No literal colours in components (tokens only); counts flex and vertical-margin use |
| `npm run check:seo -- --live https://<domain>` | SEO and HTTP checks against the deployed site |
| `npm run test:e2e` | Playwright tests against the built site (build first) |
| `npm run lighthouse` | Lighthouse on every public page (build first) |
| `npm run knip` | Unused files and exports (a report, not a gate) |

**server/**

| Command | What it does |
| --- | --- |
| `npm run dev` | API with restart on change |
| `npm start` | API without watching |
| `npm test` | Vitest unit tests (no database) |
| `npm run test:integration` | The API end to end against a real Postgres. Needs `DATABASE_URL` pointing at a migrated database whose name ends in `_test` (e.g. `DATABASE_URL=postgresql://…/projectworld_test npm run test:integration`); it refuses any other. Creates its own users and deletes only them. S3 and email are mocked. |
| `npm run env:check` | Compares `.env` against `.env.example`, by key name only |
| `npm run media:cleanup` | Deletes uploads nothing uses |
| `npm run db:reference` | Creates or updates the countries and landmarks without deleting anything (the way to load them on production) |

**images/**: `npm install`, then `npm run img:gen` turns the pictures in `src/raw-images` into `<name>-<width>.{avif,webp,jpg}` sets for `client/src/assets/images/`.

## Deploying

- **Storage: Cloudflare R2.**
  - Create two buckets for My Planet View: a public one (avatars, contact images) and a private one (travel photos, only ever served through signed URLs).
  - Give the public bucket a custom domain (`r2.dev` addresses are rate-limited and meant for development). Set it as `STORAGE_PUBLIC_HOST` on the server and `VITE_MEDIA_CDN` on the client.
  - Browsers upload photos straight to the private bucket, so it needs CORS for the site's origin. Run `node ./src/services/s3/setPrivateBucketCors.js` from `server/` (it prints bucket details, so run it yourself).
- **API → Vercel.**
  - Set the env vars from `server/.env.example`, with `NODE_ENV=production` and `IS_PRODUCTION_DATABASE=true`.
  - Run `npx prisma migrate deploy` against the production database, then `npm run db:reference` to load the countries and landmarks (it never deletes anything). Never seed it.
  - Serve the API from a subdomain of the site (`api.<domain>`), so the login cookie is same-site.
  - `vercel.json` runs the daily clean-up cron (`CRON_SECRET`).
- **Client → InMotion (cPanel).**
  - Run `npm run build` locally, then upload everything in `client/dist/`, including `.htaccess`, `404.html` and `app-shell.html`.
  - Before the first build, put the real API and storage hosts in the CSP in `client/public/.htaccess`.
- **After deploying:** run `npm run check:seo -- --live https://<domain>`, and work through `LAUNCH-CHECKLIST.md`.

## More

- `CLAUDE.md`: how the code is put together.
- `FEATURES.md`: what each feature touches.
- `LAUNCH-CHECKLIST.md`: before the site goes live.
- `docs/SITE-DESIGN.md` and `docs/API.md` at the repository root.
- `documents/SEO-PLAYBOOK.md`: the SEO rules.
- `server/README.md`: uploads and bucket CORS.

# Site info

My Planet View

## The site

| | My Planet View |
| --- | --- |
| Subject | A private travel map of the world: countries visited, trip photos matched to landmarks, trip planning, Google Docs-style sharing. For a solo traveller, a couple or a family |
| Live at | Not yet. The intended domain `myplanetview.com` (not registered yet) is in `client/src/utils/constants/constants.js` and `server/src/utils/constants/siteConstants.js` |
| Operator | Byte Toast Studio (`OperatorName` in `constants.js`) |
| Dev ports | Client 5173 (`npm run dev`), 4173 for a test build (`npm run preview`, e2e), 4174 Lighthouse, 4175 pre-render. Server 4000 |
| Hosts | Client on InMotion (cPanel) through `.htaccess`. API on Vercel. Files on Cloudflare R2 (a public and a private bucket) |
| Stack | Vite 7 + React 19, pre-rendered at build, React Router 7, Tailwind 4. Express 5 API, Prisma 7 + Postgres, better-auth 1.4.13 |
| Decisions | `docs/SITE-DESIGN.md` and `docs/API.md` at the repository root |

**Two halves.** `client/` is the site visitors see. `server/` is the API it calls over HTTP (`VITE_API_URL`). They deploy separately, to different hosts.

**Four zones**, each with its own guard:

| Zone | Pages | Guard |
| --- | --- | --- |
| Public | Home, about, FAQ, contact, legal | None. Indexed and pre-rendered |
| Share links | `/shared/:code`, `/invite/:token` | None. A secret code in the address; never indexed, no analytics |
| The app | `/map`, `/maps/:mapId`, `/trips/:tripId`, `/welcome`, `/account` | `AuthenticateUser` |
| Admin | `/admin`, `/admin/contact-forms`, `/admin/users`; the audit log `/admin/events` | `AuthenticateAdmin`; the audit log `AuthenticateDeveloper` |

**Site roles** are `USER` (anybody who signs up), `ADMIN` and `DEVELOPER`. Sign-up only makes a `USER`; the seed or a database edit makes the others.

**Map roles** are separate: `OWNER`, `EDITOR` and `VIEWER` on a map or a trip. See `docs/API.md`, "Access".

## Statuses

| What | Column | Values | What moves it on |
| --- | --- | --- | --- |
| A country on a map | `CountryVisit.status` | `VISITED`, `LIVED`, `WANT_TO_GO` | The country list or panel; a photo with GPS (`source: PHOTO`); a completed trip (`source: TRIP`) |
| A trip | `Trip.status` | `PLANNED`, `ACTIVE`, `COMPLETED` | The trip page. Completing it marks its stops' countries visited |
| General access to a map or trip | `linkAccess` | `RESTRICTED`, `ANYONE_WITH_LINK` | The share dialog (owner only). "Reset link" replaces `shareCode` |
| A landmark on a photo | `PhotoLandmark.confirmed` | `false` (a GPS suggestion), `true` | The photo viewer: confirm, add or remove |
| A photo | `Photo.hidden` | `false`, `true` | The photo viewer. Hidden photos are never sent to viewers |
| An invite | `ShareInvite.acceptedAt`, `.expiresAt` | Pending, accepted or expired (14 days) | Signing up and verifying the invited address, or the invite link |
| An account | `User.role`, `.isActive`, `.emailVerified` | | Admin users page; email verification |
| An upload | `MediaItem.bytes` | Null until the file's real size is confirmed | Confirm-upload; unconfirmed uploads are cleaned up after 24 h |
| An audit log entry | `AppEvent.status` | `OPEN`, `ACKNOWLEDGED`, `RESOLVED`, `IGNORED` | The audit log page |

# Security baseline

The attacks this site defends against, the defence as it is implemented here, and
the test in `test/unit/` that keeps it in place.

Most of the tests are static assertions over the source rather than behavioural
tests. An assertion over every file matching a pattern covers routes and actions
that have not been written yet, which is where a missed check is most likely to
appear. [How the tests work](#how-the-tests-work) covers what that means when
adding or changing one.

---

## Summary

| # | Attack | Defence | Enforced by |
| --- | --- | --- | --- |
| 1 | SQL injection | Prisma parameterises every query; no raw escape hatches | `security.test.js` |
| 2 | Reading another user's records (IDOR) | Every query on user-owned data is scoped by the session user id | `security.test.js` |
| 3 | Confirming a record exists | 404, never 403, on someone else's record | `security.test.js` |
| 4 | Admin area reachable by users | `getAdminUser` on every admin route, page and action | `security.test.js`, `securitySurface.test.js` |
| 5 | Making yourself an admin | `role` is `input: false` in Better Auth | `security.test.js` |
| 6 | Stale privileges | The role is read from the database, not the session | `security.test.js` |
| 7 | Credential stuffing | Auth POSTs rate limited, counters in Postgres | `authRateLimit.test.js` |
| 8 | Password spraying and targeted brute force | Two keys: per IP and per email | `authRateLimit.test.js` |
| 9 | Forged webhooks | Every webhook proves its sender and fails closed | `securitySurface.test.js` |
| 10 | Leaking a secret through comparison timing | Constant-time comparison | `securitySurface.test.js` |
| 11 | Open redirect after sign-in | `next` kept only when it resolves to this site's origin | `securitySurface.test.js` |
| 12 | Secrets in the JavaScript bundle | Nothing private behind `NEXT_PUBLIC_` | `securitySurface.test.js` |
| 13 | XSS | Framework escaping; raw HTML only for generated data | `securitySurface.test.js` |
| 14 | Mass assignment | Fields named one at a time; no spread of input | `securitySurface.test.js`, `security.test.js` |
| 15 | Changing the id in a request | Identity comes from the session cookie only | `security.test.js` |
| 16 | Locking a user out through the limiter | Only failed sign-ins count; success clears the counter | `authRateLimit.test.js` |
| 17 | Injected script tag, clickjacking, `<base>` rewriting | Security headers and a CSP | `headersAndLimits.test.js` |
| 18 | Rate limits that silently do nothing | Shared counters, and a limiter on every write | `headersAndLimits.test.js`, `writeRouteLimits.test.js`, `security.test.js` |
| 19 | A vulnerable framework under correct code | Version floors and a production audit | `dependencies.test.js` |
| 20 | Unbounded free text | Length ceilings on contact, profile and newsletter input; none on the checkout address | Review |
| 21 | CSRF | SameSite cookies, trusted origins, Server Action origin check | Review |
| 22 | Executable uploads | Content-type allow-lists with no SVG, HTML, XML or script | `uploadTypes.test.js` |

---

## The detail

### 1. SQL injection

Prisma sends the statement and the values to the database separately, so a value
can never be parsed as SQL. `'; DROP TABLE users; --` typed into a form is stored
as that literal string.

The exposure is the raw escape hatches, and there are three:

1. **`$queryRawUnsafe` / `$executeRawUnsafe`** take a string. They can be used
   safely with positional parameters, but the safe use is rare and the unsafe use
   is total.
2. **`Prisma.raw()`** works *inside* a tagged template, so this looks like the
   safe form and is a straight injection:

   ```js
   prisma.$queryRaw`SELECT * FROM "User" WHERE name = ${Prisma.raw(input)}`
   ```

3. **A hand-made object that mimics `TemplateStringsArray`.** `$queryRaw` tells
   safe from unsafe by the *shape* of its argument, and JavaScript allows that
   shape to be faked. Rare enough not to test for, but it means "only the tagged
   template is used" is not by itself a guarantee.

`security.test.js` fails on `$queryRawUnsafe`, `$executeRawUnsafe` and
`Prisma.raw(` anywhere under `src/` or `prisma/`. The tagged `$queryRaw`
template is parameterised and allowed.

### 2 and 3. Reading another user's records

Every route that takes an id from the URL or the body is a place where the
ownership check can be forgotten, and the bug is invisible in review because the
happy path works. Two checks are needed, and they are not the same:

```js
const userId = session?.user?.id;
if (!userId) return unauthorised();          // 1. signed in
const order = await prisma.order.findFirst({
  where: { id, userId },                     // 2. owned by the caller
});
```

Signed-in-only is the common half-fix: every account can then read every record.
`src/app/account/orders/[id]/page.jsx` is the pattern: it redirects an anonymous
caller to sign in, then queries with `{ id, userId }`.

A page a guest must reach without a session cannot scope by user, so it scopes by a
signed token instead. The checkout success page shows an order only to the
signed-in account that placed it, or to whoever holds the access token the checkout
redirect carries: an HMAC of the order id with `BETTER_AUTH_SECRET`
(`src/lib/store/orderAccess.js`), compared in constant time. The order id on its
own shows nothing. `checkoutSuccess.test.jsx` covers each case.

**Return 404, not 403.** A 403 says "this exists but is not yours", which turns
the endpoint into an oracle for testing whether an id is real. 404 says nothing.

`security.test.js` enumerates every API route with an `[id]` segment, and every
route that reads an id from the request body, outside the admin, auth, store,
checkout and webhook trees. Each must read the session, use `userId` in the
query, and never answer a per-record 403. Because `userId` always appears where
the session is read, the test strips those lines first and then requires
`userId` to still be present, and it checks each exported handler on its own.

### 4. The admin area

`getAdminUser(headers)` in `src/lib/adminAuth.js` is the single gate. Admin
Server Actions reach it through `requireAdmin()`. Two mistakes it guards against:

- **Gating the API and forgetting the pages.** A page renders server-side with its
  data already in it, so an ungated admin page leaks as much as an ungated API.
- **Checking the session instead of the role.** On an admin route, signed-in-only
  means every account is an admin.

`security.test.js` asserts every route under `src/app/api/admin/` calls
`getAdminUser`, and every non-public action calls `getAdminUser`, `requireAdmin`
or `getSession`. `securitySurface.test.js` asserts every page under
`src/app/admin/` does the same. All three enumerate the filesystem, so a new
route, page or action is covered from the moment it exists.

**There is always an admin.** The last admin cannot be demoted or deleted from the
admin users page, and cannot delete their own account from `/account`: Better
Auth's delete hook refuses with `LAST_ADMIN`, reading the role from the database.
Both use `otherAdminCount` in `src/lib/admins.js`. `accountDeletion.test.js`
covers the hook.

### 5 and 6. Privilege escalation

`role` is an additional field on the Better Auth user model. Without
`input: false`, the sign-up endpoint would accept `{"role":"ADMIN"}`:

```js
user: { additionalFields: {
  role: { type: 'string', defaultValue: ROLES.USER, input: false },
} }
```

Removing `input: false` produces no error and no warning, so `security.test.js`
reads `src/lib/auth.js` and asserts it literally, along with the `USER` default.

`getAdminUser` reads the role from the database, not the session token, so a
demoted admin loses access on their next request. The test that proves it:

```js
getSession.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } }); // session says admin
findUnique.mockResolvedValue({ id: 'u1', role: 'USER' });            // database says user
expect(await getAdminUser(headers)).toBeNull();
```

### 7 and 8. Rate limiting sign-in

**The attack is credential stuffing**: email and password pairs leaked from
another site, tried against this one. Volume is the whole attack, so making
volume expensive defeats it.

**Counters live in Postgres.** On serverless hosting each request can land on a
different instance, so a `Map` of counters is per instance and an attacker gets a
fresh allowance on every one. Better Auth's built-in limiter is enabled in
`src/lib/auth.js`, but it stores counts in memory by default. The limit that
holds across instances is `withAuthRateLimit` in `src/lib/authRateLimit.js`,
which wraps every POST to `/api/auth/*` and counts in the `RateLimit` table with
one atomic upsert:

```js
await prisma.rateLimit.upsert({
  where: { key },
  create: { key, count: 1, resetAt },
  update: { count: { increment: 1 } },   // atomic, not read-then-write
});
```

**Everything is limited by default, and exemptions are named.** Every auth path
pays `BASELINE_AUTH_LIMIT` (30 a minute per IP) unless a tighter rule in
`AUTH_LIMITS` matches, longest prefix winning. A new Better Auth endpoint arrives
protected.

**`/get-session` and `/sign-out` are exempt.** `/get-session` is not an abuse
surface: it presents the caller's own cookie and returns their own session. It
fires on every page load and accepts POST as well as GET, so limiting it would
sign out people who are browsing normally.

**Two keys, because they catch different attacks.** Per IP catches password
spraying: one common password against many accounts from one place. Per email
(`EMAIL_LIMIT`, 5 failures per 15 minutes) catches a targeted brute force: many
passwords against one account. Neither covers the other. Sign-in is loose per IP
(20 a minute), because a school or an office is one address, and the per-email
rule does the real work. The address is lower-cased before keying, so casing
cannot buy a fresh allowance.

**Fail open.** If the database is unreachable, the request is allowed. A
database blip must not become "nobody can sign in".

**Say nothing in the 429.** No attempts remaining, no hint about whether the
account exists, no hint about which rule applied.

`authRateLimit.test.js` asserts the exemptions, the default, both keys, the
atomic increment, fail-open, the lower-casing and the silent response.

### 9 and 10. Webhooks

Webhook routes are unauthenticated by necessity, and they are the routes that
mark orders paid, shipped and refunded. A forged POST is a free order.

| Route | Sender proof |
| --- | --- |
| `api/checkout/stripe/webhook` | `stripe.webhooks.constructEvent(raw, signature, STRIPE_WEBHOOK_SECRET)` on the raw body |
| `api/checkout/paypal/webhook` | `verifyPaypalWebhook`, which verifies through PayPal's API against `PAYPAL_WEBHOOK_ID` |
| `api/checkout/printful/webhook` | A long random token in the URL (`PRINTFUL_WEBHOOK_TOKEN`), compared with `timingSafeEqual` |
| `api/webhooks/resend` | A shared secret header (`RESEND_WEBHOOK_SECRET`), compared in constant time |

**Fail closed when the secret is unset.** A missing environment variable must
not turn into "anyone can mark any order shipped".

**Compare secrets in constant time.** `===` returns as soon as two characters
differ, so response time leaks the secret one character at a time:

```js
if (got.length !== expected.length) return false;   // length is not the secret
return timingSafeEqual(Buffer.from(got), Buffer.from(expected));
```

**Replays are harmless, so failures are retried.** Confirming payment is a single
`updateMany` claimed only while `paidAt` is null, so only one delivery sends the
receipt. Sending to Printful is claimed the same way, on a `paid` order with no
`fulfilledAt` and no `printfulOrderId`, so a capture route and a webhook racing on
one order send it once, and a refunded order is never sent. Refunds are
deduplicated per refund reference. Because every step is safe to repeat, the
Stripe and PayPal webhooks answer 500 when their handler throws, and the provider
retries; a 200 there would leave a paid order `pending` for the abandoned-order
sweep. `orderFulfilment.test.js` covers the race, the refunded order and the sweep.

`securitySurface.test.js` asserts every webhook route contains a sender check,
that every `if (!secret)` guard returns a refusal rather than continuing, and
that the Printful route calls `timingSafeEqual(` and compares no secret with
`===`.

### 11. Open redirect

A link to this site's login page carrying `?next=https://evil.example` would
let a phishing page borrow the site's credibility: the victim signs in on the
real domain and is then handed to the attacker.

Both sign-in pages pass `next` through `safeRedirectPath` in
`src/lib/safeRedirectPath.js`, which resolves it the way a browser would and keeps
it only when the origin is unchanged:

```js
const url = new URL(raw, RESOLVE_AGAINST_ORIGIN);
if (url.origin !== RESOLVE_AGAINST_ORIGIN) return fallback;
```

String checks are not enough. `//evil.example` is protocol-relative, and
`/\evil.example` or `/<tab>/evil.example` start with a single slash yet reach
another site, because browsers read a backslash as a slash and drop tabs and
newlines. `securitySurface.test.js` runs each of those through the helper and
asserts both pages use it.

### 12. Secrets in the bundle

Anything named `NEXT_PUBLIC_*` is inlined into the JavaScript every visitor
downloads, at build time. `securitySurface.test.js` fails on any `NEXT_PUBLIC_`
name that looks like a credential (`SECRET`, `PRIVATE`, `PASSWORD`, `_TOKEN`,
`WEBHOOK`), and on any `'use client'` file that reads a non-public environment
variable.

### 13. XSS

React escapes everything it renders, so the only way to put raw HTML on a page is
`dangerouslySetInnerHTML`. Here it carries only `JSON.stringify` output (JSON-LD)
and module-level constants (the theme script). Blog posts are Markdown rendered
by `react-markdown`, which does not render embedded HTML.
`securitySurface.test.js` asserts every `__html:` value is one of those two forms.

The dangerous case is HTML whose content came from a user. If that is ever
needed, it goes through a maintained sanitiser, never a regex, and the CSP
(item 17) stops being an adequate backstop.

### 14. Mass assignment

```js
await prisma.user.update({ where: { id }, data: { ...body } });  // never
```

Spreading input into a write lets a caller post `{"role":"ADMIN"}` or
`{"userId":"someone-else"}` and have the ORM persist it. Every write names the
fields it accepts. `securitySurface.test.js` fails on a route that spreads any
request-derived value into `data:`, including the inline
`data: { ...(await request.json()) }`. `security.test.js` fails on an action
that spreads its input into `data:`.

### 15. Changing the id in a request

Over HTTPS nobody can read or alter a request in flight. The real attack needs no
interception: an ordinary signed-in user opens devtools, changes an id in their
*own* request, and sends it. The defence is a rule about trust, not transport:

> The session cookie is the only thing that says **who the caller is**.
> Every other id in the request says only **what they are asking for**.

A route may take a *record* id from the URL. It never takes a *user* id from the
URL, the query string or the body, and a write never takes the owner from the
payload. `security.test.js` fails on any Server Action that accepts a `userId`
argument, and the ownership checks in item 2 cover the routes.

### 16. Locking somebody out through the limiter

Per-email limiting hands an attacker a way to keep a named person out of their
own account by failing sign-in for them. Two rules reduce that to a nuisance:

- **Count failures only.** The counter is checked before the handler runs and
  incremented only when the handler rejects, so a correct password never spends
  an attempt.
- **Clear on success.** A user who signs in starts clean.

`authRateLimit.test.js` asserts both.

### 17. Response headers and the CSP

`next.config.mjs` sets six headers on every response: `X-Content-Type-Options`,
`X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`,
`Strict-Transport-Security` (production only, since on localhost it forces an
HTTPS upgrade) and `Content-Security-Policy`.

`script-src` carries `'unsafe-inline'`. The theme script in the root layout must
run before first paint, and Next's own hydration scripts change every build, so a
hash list cannot keep up. A per-request nonce would remove the need, but reading
a nonce opts every page into dynamic rendering, and this site's pages are
statically generated. What the policy still enforces:

- `object-src 'none'` blocks plugin and object embeds outright.
- `base-uri 'self'` stops an injected `<base>` rewriting every relative URL.
- `form-action 'self'` stops an injected form posting a password elsewhere.
- `frame-ancestors 'self'` stops clickjacking, and is stronger than
  `X-Frame-Options`.
- A named `script-src` still blocks `<script src="https://evil.example">`.

What it does not stop is an injected *inline* script, which holds only while
nothing renders user-supplied HTML (item 13). In development only,
`'unsafe-eval'` is added so React can rebuild server stack traces in the error
overlay; it is never written into the policy list itself.

`headersAndLimits.test.js` asserts each header, each directive above, that the
production header carries no `'unsafe-eval'` while the development one does, and
that `script-src` is never opened with `https:` or `*`.

A CSP that is too strict does not error on the server: it silently blocks a
script or stylesheet. After changing the policy, load the pages in a browser and
check the console for violations. A new third-party script, frame or API origin
is added to the matching directive.

### 18. Rate limits that silently do nothing

An in-memory limiter on serverless hosting still returns `{ ok: true }` and still
passes its tests, while counting per instance. `src/lib/rateLimit.js` exports
both an in-memory `rateLimit` and the Postgres-backed `rateLimitShared`; only the
shared one is used by routes and actions.

Three ways a limiter goes missing, each with its own assertion:

- **The wrong implementation.** `headersAndLimits.test.js` fails on any route or
  action that calls the in-memory `rateLimit(`, and on any `rateLimitShared` call
  that is not awaited. An un-awaited call returns a Promise, `promise.ok` is
  `undefined`, and the check either refuses everybody or nobody.
- **No limiter at all.** `writeRouteLimits.test.js` requires every non-admin,
  non-webhook API route that writes to call a shared limiter or appear in its
  `EXEMPT` list with a written reason. Exemptions must name a route that exists
  and still needs one. `security.test.js` requires every public Server Action
  (the `PUBLIC` set) to call `rateLimitShared`, except `setShopCurrency`, which
  only writes a cookie on the caller's own browser.
- **A limiter hidden in a helper.** A helper in `src/lib` that meters on a
  route's behalf makes the route look correct. `writeRouteLimits.test.js` scans
  `src/lib` for the in-memory limiter, and requires any exported `*Limit*` helper
  that uses `rateLimitShared` to be async.

Limits are defined in `src/lib/constants/rateLimitConstants.js`.

### 19. The framework under correct code

Every other item guards code written here. This one guards the far larger amount
of code that was not. Dependency risk is invisible: no test fails and no page
breaks when a pinned version acquires an advisory.

`dependencies.test.js` holds a version floor for `next` (16.3.8) and
`better-auth` (1.6.22), each with the advisory IDs it protects against in its
`why` string. It asserts three things, because each fails differently:

1. **The declared range is at or above the floor**, so a lockfile refresh cannot
   resolve to a vulnerable version.
2. **The installed version is too**, so a stale lockfile is caught.
3. **The range is caret or tilde, not exact**, so patch releases arrive.

`npm audit` is not run inside the unit suite: it needs the network, and its
answer changes without the repo changing. `npm run audit:prod`
(`npm audit --omit=dev --audit-level=high`) reports only what reaches
production; build and test tooling is excluded. `--omit=dev` still walks
devDependencies' transitive trees, so check what pulls a flagged package in
before treating it as live.

Two development-only entries stay in the full `npm audit`:

- `@tailwindcss/typography` pins a vulnerable `postcss-selector-parser` 6.x.
  `overrides` in `package.json` forces 7.1.6, which compiles `globals.css`
  byte for byte the same. Remove the override once the plugin ships its own fix.
- `braces` ≤3.0.3, reached through `eslint-config-next` → `fast-glob` →
  `micromatch`, has no fixed release. It only ever reads the project's own lint
  globs. npm's suggested fix, downgrading `eslint-config-next` to 14.x, is wrong.

### 20. Unbounded free text

The rate limiter caps how often somebody can post, not how much. A `TEXT` or
`Json` column has no length of its own.

| Input | Ceiling |
| --- | --- |
| Contact form | Zod `.max()` on every field, `src/lib/actions/contact.js` |
| Profile name | `sanitizeText(..., { maxLength: 80 })`, `src/lib/actions/account.js` |
| Newsletter email | `sanitizeEmail`, 320 characters |
| Checkout address | None. `toPrintfulRecipient` in `src/lib/store/checkout.js` trims each field without bounding it, and the order stores the address as JSON |
| Blog posts | Written only by admins |

A new text input gets a ceiling in the same change. Truncating is preferable to
rejecting, so somebody who has typed something long does not lose it. The length
bound is the security control; stripping markup is a separate decision, and is
unnecessary where nothing renders the text as HTML.

### 21. CSRF

Three layers, all on by default:

- **Better Auth session cookies are `SameSite=Lax`**, so a cross-site form post
  does not carry them.
- **Better Auth checks the Origin** of each request against `trustedOrigins`:
  `BETTER_AUTH_URL`, `NEXT_PUBLIC_SITE_URL` and `FRONTEND_ORIGIN`.
- **Next.js compares a Server Action's Origin header to its Host** and aborts the
  request when they differ.

Two one-line changes would switch this off: `sameSite: 'none'` in the Better
Auth cookie options, or a wildcard in `trustedOrigins`. `src/lib/auth.js` sets
neither.

### 22. Executable uploads

Uploads go to S3-compatible storage through presigned URLs minted by admin-only
actions. `src/services/s3/mediaService.js` validates every upload's key prefix
and content type against `MEDIA_CONFIG`. An SVG is an XML document that can carry
`<script>`, so the image list is raster only (PNG, JPEG, WebP, GIF), and no list
accepts HTML, XML or a script type. `uploadTypes.test.js` asserts all three.

---

## Not covered

- **New advisories.** Item 19 holds floors against known advisories. Only a
  scheduled `npm run audit:prod` finds the ones published later.
- **Denial of service.** Rate limiting slows credential stuffing; it is not DDoS
  protection. That belongs at the CDN.
- **The host**: TLS termination, WAF, DDoS. These are the platform's defaults.
- **Penetration testing.** The tests prove a pattern is present in the source,
  not that a running system resists a determined attacker.
- **Two-factor authentication.** Not offered.
- **Email enumeration on sign-up.** With `requireEmailVerification` off, Better
  Auth answers a duplicate registration with "user already exists", which
  confirms the address has an account. Forgotten-password does not leak this:
  Better Auth answers success for an unknown address, and
  `ForgotPasswordClient.jsx` shows the same confirmation whatever the outcome. To
  check the sign-up surface, register an address, try it again, and try one never
  used; compare status code, body and response time.
- **Secrets in logs.** Error paths are reviewed by hand for tokens, sessions and
  passwords.

---

## How the tests work

**Comments are stripped first**, so a comment naming a banned pattern cannot
fail a test, and a comment mentioning a required one cannot pass it.

**Checks run per handler where it matters.** A route file can export several
handlers. A file-level check lets one handler's correct code satisfy the
assertion for another handler that lacks it, so the ownership checks split the
file on its exported handlers and test each one.

**A detector that finds nothing is tested against fixed samples.** A regex that
silently matches nothing looks identical to one that finds nothing wrong. Where a
site can legitimately have zero matches, as with body-supplied ids, the test
asserts the detector recognises known samples instead of asserting matches
exist. Where the site does have matches, the test asserts the list is not empty
before checking it.

**Every assertion must be able to fail.** When adding or changing one, break the
code it guards on purpose, confirm the test goes red, and put the code back. A
security test that cannot fail reads like a guarantee and provides none.

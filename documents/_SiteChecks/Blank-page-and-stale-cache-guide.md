# Blank page and stale cache: check and fix guide

Two problems that broke miss-dahlia.com in November 2026 and can affect any site built the same way. Work through this per site: check the code, fix it, deploy safely, then test on each device type.

| Problem | What visitors see | Sites at risk | Fix |
| --- | --- | --- | --- |
| 1. Blocked storage crashes the site | Page flashes up, then goes blank or black | Any site that reads `localStorage` or `sessionStorage` outside a `try`/`catch` | Route every storage call through a safe helper |
| 2. Stale cached pages after an upload | Page text shows but nothing works: no menu, forms, popups or login | Sites on InMotion/cPanel with the NGINX cache, deployed by uploading files and deleting old ones | Clear the cache; upload without deleting old assets |

## Problem 1: blocked storage crashes the site

### Who sees it

Visitors who block cookies and site data. Any read of `localStorage` or `sessionStorage` then throws a `SecurityError`. If nothing catches it, React unmounts the app and the page goes blank.

- **Chrome (desktop and Android):** on-device site data blocked, for all sites or just this one
- **Firefox:** Enhanced Tracking Protection set to Custom with "All cookies" blocked
- **Safari (iPhone, iPad, Mac):** "Block All Cookies" switched on

Private or incognito windows don't trigger it: modern browsers allow storage there. That's why it works for you and fails for a few visitors.

### Check a site's code

Run this in the site's front-end folder (`client/` on the older sites, the project root on the Next.js ones):

```bash
grep -rnE "localStorage|sessionStorage" src --include=*.js --include=*.jsx --include=*.ts --include=*.tsx
```

A hit is **safe** when it sits inside `try { ... } catch`. Anything else needs fixing. Look hardest at code that runs on page load: `App.js`/`App.jsx`, auth or user context providers, consent or age-gate popups, and API clients that read a token.

```js
// Unsafe: crashes the whole site when storage is blocked
const cookie = localStorage.getItem('CookiePolicy');

// Safe
let cookie = null;
try {
  cookie = localStorage.getItem('CookiePolicy');
} catch {
  // storage blocked
}
```

To check every site at once, run `audit-storage.cjs` from this folder and point it at the folder that holds the sites:

```bash
node audit-storage.cjs "C:\Users\User\Documents\WorkTop\General Customer"
```

It lists each unprotected call by file and line, and the sites that are already safe. As of 10 November 2026, every site in `General Customer` and both templates pass. Run it again after starting a new site or adding storage code.

Most sites share the same template files, so these are the usual places to look:

| File | When it runs | What breaks when storage is blocked |
| --- | --- | --- |
| `App.jsx` / `App.js` (cookie consent check) | Page load | The whole page goes blank |
| `auth/AuthProvider.jsx`, `context/UserContext.jsx`, `utils/user/LoggedInUser.jsx` | Page load | The whole page goes blank |
| `utils/user/token.js(x)`, `api/client.js` | Wherever the login token is read | Logins and API requests fail; the page goes blank if it happens during load |
| `AgeGateModal.jsx`, `CookieConsentBar.jsx`, `CookieConsentModal.jsx` | A button click | Enter or Accept does nothing, so the popup can't be closed |
| `CreateBlogPostForm.jsx`, `EditBlogPostForm.jsx` and other admin pages | Admin pages only | That admin feature fails |

### Fix

1. Add this helper to the site, for example as `src/utils/functions/safeStorage.js`:

    ```js
    // Browsers that block site data throw a SecurityError as soon as storage is
    // touched. Every storage call goes through these so that can't crash the site.

    export function getStoredItem(key, type = 'localStorage') {
      try {
        return window[type].getItem(key);
      } catch {
        return null;
      }
    }

    export function setStoredItem(key, value, type = 'localStorage') {
      try {
        window[type].setItem(key, value);
      } catch {
        // Storage blocked or full: the value only lasts for this page view.
      }
    }

    export function removeStoredItem(key, type = 'localStorage') {
      try {
        window[type].removeItem(key);
      } catch {
        // Storage blocked: nothing was stored, so nothing to remove.
      }
    }
    ```

    For a TypeScript site, save it as `safeStorage.ts` and type the arguments: `key: string, type: 'localStorage' | 'sessionStorage' = 'localStorage'`. It also works during server rendering in Next.js, because the missing `window` is caught too.

2. Replace every direct call:

    | Before | After |
    | --- | --- |
    | `localStorage.getItem(k)` | `getStoredItem(k)` |
    | `localStorage.setItem(k, v)` | `setStoredItem(k, v)` |
    | `localStorage.removeItem(k)` | `removeStoredItem(k)` |
    | `sessionStorage.getItem(k)` | `getStoredItem(k, 'sessionStorage')` |

3. Leave storage code inside an inline `<script>` string (such as a Next.js theme script) alone if it's already wrapped in `try`/`catch`.

4. Re-run the `grep` above. The only hits left should be in `safeStorage.js` and in code you've confirmed is inside a `try`.

**What changes for those visitors:** the site works, but nothing is remembered between page loads. Cookie and age popups appear on every visit, and anything that keeps a login token in storage won't stay logged in. That's expected when someone blocks storage.

## Problem 2: stale cached pages after an upload

### Why it happens

InMotion puts an NGINX cache in front of cPanel sites. It saves a copy of each page, with a separate copy for each browser version (`Vary: User-Agent`). A Vite or React build gives its script files new names on every build, such as `index-OJTFWvAK.js`. If you delete the old `assets` folder when uploading, any copy saved before the upload still points at the deleted script. That browser gets the page text and none of the code.

This doesn't affect front ends hosted on Vercel. Each Vercel deployment keeps its own files.

### Check whether a site uses the cache

InMotion refuses plain `curl` requests with "406 Not Acceptable", so always send a browser user agent:

```bash
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'
curl -s -D - -o /dev/null -A "$UA" https://example.com/ | grep -i x-proxy-cache
```

`X-Proxy-Cache: HIT` or `MISS` means the cache is on.

### Check for stale pages

This fetches a page as several browsers and checks that every script it points to exists. Any `404` line means a stale copy:

```bash
SITE=https://example.com
for UA in \
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36' \
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:145.0) Gecko/20100101 Firefox/145.0' \
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1' \
  'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36'; do
  for p in / /contact; do
    for js in $(curl -s --compressed -A "$UA" "$SITE$p" | grep -oE '/assets/[A-Za-z0-9_.-]+\.js' | sort -u); do
      curl -s -o /dev/null --compressed -A "$UA" -w "%{http_code} $p $js\n" "$SITE$js"
    done
  done
done | sort | uniq -c
```

### Fix now

In cPanel, search for "NGINX" (it may be called NGINX Manager or Cache Manager) and clear the cache for the domain. Then run the check again.

### Deploy routine that avoids it

1. Build the site (`npm run build`).
2. Upload the contents of `dist/` (or `build/`), overwriting the HTML files. **Don't delete the old files in `assets/`.** New ones have different names, so nothing clashes, and any stale page can still find its scripts.
3. Clear the NGINX cache in cPanel.
4. Run the checks in the next section.
5. Every few weeks, delete asset files older than the last two uploads.

## Testing on different devices

### Automated: check-site.mjs

`check-site.mjs` in this folder loads pages as four devices, each normally and with storage blocked:

- **Desktop Chrome**
- **Android phone:** Chrome with Pixel 5 screen and touch
- **Desktop Firefox:** using Firefox's real "block all cookies" setting
- **iPhone:** WebKit, the Safari engine, with iPhone 13 screen and touch

A run fails on a JavaScript error, a missing script or stylesheet, or a blank page. A screenshot of every run goes to `screenshots/`.

```bash
cd "_SiteChecks"
npm init -y && npm i playwright @babel/parser && npx playwright install chromium firefox webkit   # once
node check-site.mjs https://example.com https://example.com/contact
```

Example output:

```
https://miss-dahlia.com/miss-dahlia
  PASS  Desktop Chrome (storage normal)
  PASS  Desktop Chrome (storage blocked)
  FAIL  Desktop Firefox (storage normal)    404 /assets/index-OJTFWvAK.js
```

A `404 /assets/...js` failure is Problem 2. A `JS error` that appears only with storage blocked is Problem 1. Firefox and Safari word it "The operation is insecure"; Chrome says "Access is denied for this document".

Emulation is close but not identical to real devices. WebKit on Windows is not the exact Safari build on an iPhone, so spot-check on a real phone before calling a site done.

### Real devices

| Device | Block storage to test Problem 1 | See errors |
| --- | --- | --- |
| Chrome on Windows or Mac | Open `chrome://settings/content/siteData`, add the site under "Not allowed to save data" | F12, Console tab |
| Firefox | `about:preferences#privacy` → Enhanced Tracking Protection → Custom → Cookies: "All cookies" | F12, Console tab |
| Safari on Mac | Safari → Settings → Privacy → "Block all cookies" | Turn on Settings → Advanced → "Show features for web developers", then Develop → Show Web Inspector |
| iPhone or iPad | Settings → Apps → Safari → "Block All Cookies" (on iOS 17 and older: Settings → Safari) | Needs a Mac: turn on Settings → Safari → Advanced → Web Inspector, plug the phone in, then use Safari's Develop menu on the Mac |
| Android Chrome | Chrome → ⋮ → Settings → Site settings → block on-device site data (the name varies by Chrome version) | Turn on USB debugging in Developer options, plug into the PC, open `chrome://inspect` in desktop Chrome |

Undo the setting after testing, or other sites will misbehave on that device.

No Mac or spare phones? BrowserStack Live and LambdaTest run real iPhones and Android phones in your browser and have free trials. Chrome's device toolbar (Ctrl+Shift+M in DevTools) only changes the screen size: it's still Chrome, so it's no test for Safari.

### Beyond the device

- **Network:** if a visitor sees a "site blocked" page or "can't be reached", test the same phone on Wi-Fi and on mobile data. Mobile networks and broadband parental controls often block adult sites until the account holder verifies their age; most UK mobile networks switch this on by default. Code can't fix this.
- **Country:** [check-host.net](https://check-host.net) → HTTP check loads the site from about 20 countries. One failing location can be a broken test server: check it against another site before blaming yours.

## Per-site checklist

- [ ] Run `audit-storage.cjs` (or `grep` the front end) and fix any unprotected storage calls
- [ ] Build and upload without deleting old `assets/`, then clear the NGINX cache (InMotion sites)
- [ ] Run `check-site.mjs` on the home page, the contact page and one other main page
- [ ] Spot-check on a real iPhone with "Block All Cookies" on

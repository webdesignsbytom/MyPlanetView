# SEO

Search and AI search for Project World. The rules are in [`documents/SEO-PLAYBOOK.md`](../SEO-PLAYBOOK.md). This folder holds what goes with them.

| Path | What it is |
| --- | --- |
| [`../SEO-PLAYBOOK.md`](../SEO-PLAYBOOK.md) | **The rules.** The twelve that matter most (section 1), how the engines behave (2), every rule with an ID (3), the checklists (4), traps (5), how to build each piece (6), the tools (7), the evidence (8) and the sources (9). Copied from DummyFullstack's, the main copy for Vite and React sites, on 24 November 2026 |
| [`archive/SEO-PLAYBOOK-2026-10-08.md`](archive/SEO-PLAYBOOK-2026-10-08.md) | The previous version. Anything citing "Part 1" or "Part 2" by section number means this one |

## Where the rules come from

This site is built with Vite and React, so this copy is refreshed from the main copy for those sites, DummyFullstack's (`Dummys/DummyFullstack/documents/SEO-PLAYBOOK.md`). The main copy for Next.js sites is NextDummy's (`Dummys/NextDummy/docs/SEO-PLAYBOOK.md`). Most lessons are learned on Memento's live sites and on WorkerSEO. When this project learns something about search, add it to DummyFullstack's copy as a rule with an ID and its evidence, and to NextDummy's unless it depends on the stack, then copy DummyFullstack's here again. Do not edit this copy on its own.

The Memento record is not kept in this repository. It lives in the Memento project, under `docs/seo/`:
- the 12 November 2026 review (the best worked example);
- the tracker from August;
- the change log format;
- the weekly check's output;
- the measuring tools, and the code behind each fix.

The playbook names those files with Memento's own paths.

## Where Project World stands

Project World is a client-rendered app whose public pages are pre-rendered at build (playbook **section 6.22**). Only five pages are indexed: home, about, FAQ, contact and legal. Everything a user makes (maps, trips, photos, share links) is private, never indexed, and disallowed in robots.txt. `CLAUDE.md` describes how this is built.

Already built in:
- Every public page pre-rendered (R1, R4; `client/scripts/prerender.mjs`), with the app pages served the app shell and unknown URLs a real 404.
- `check-meta` and `check-seo` failing the build on a missing or duplicate title, description or canonical, a description outside 120 to 156 characters (M2), structured data that isn't on the page (M4, M5), and internal links to pages that don't exist (U3). `--live` checks the deployed site: 404s, `www.` and `http://` redirects (U1), and a 200 for the search, AI and link-preview crawlers (A3).
- Analytics only after consent, and never on share or invite pages, whose addresses carry secrets.

Not built yet:
- **X3.** `client/src/utils/analytics/initGA.js` sends `page_view` with a `page_path`, but GA4 still fills `page_location` from the address bar. Keep only the campaign tags in it. Memento Astra's `src/lib/analyticsLocation.js` shows how.
- **X8.** No conversion events beyond the page view and Web Vitals. The obvious ones:
  - an account created;
  - onboarding finished;
  - a first photo uploaded;
  - a map or trip shared;
  - a contact form sent.

  Follow the rules in Memento Astra's `src/lib/analyticsEvents.js`: nothing before consent, only listed fields, nothing containing `@`, never a share code.
- **A2.** No IndexNow. On cPanel, run it after each upload (Memento Astra's `src/lib/seo/indexNow.js` and `scripts/indexNow.mjs`).

Before launch, check **C1 to C9** (pages with something of their own; claims that match what the app does), **S1 and S2** (only the five public pages in the sitemap, with true dates), **L3** (no followed link into sign-in pages) and **A1 to A3**. The launch checklist is playbook **section 4.1**, and `LAUNCH-CHECKLIST.md` at the project root; section 4.2 of the playbook is the checklist for every deploy.

## At launch: access and tools

1. **Search Console.** Add the domain property. To read it by script, add the service account from `C:\Users\User\.secrets\memento-seo.json` (its `client_email`) as a Restricted user. Keys never go in a repository.
2. **Google Analytics 4.** A new property, consent-gated, campaign tags kept on `page_location`. Turn off "page changes based on browser history events" (Project World's share addresses must never be recorded).
3. **Bing Webmaster Tools** (A1). Import from Search Console.
4. **IndexNow** (A2). A key file at the site root and a ping after each deploy.
5. **The tools.** Copy the measuring tools from Memento's `scripts/seo/` to `scripts/seo/` here and change their site lists (playbook section 7 says what each is for). Any tool that needs a token from an env file is run by the owner, never Claude.

## How a review runs

The method is shown in full in Memento's 12 November 2026 report:
- **One dated report per review session**, `documents/seo/reports/<date>.md`, never appended to an older one.
- **Every SEO change is logged before it ships**, in `documents/seo/data/changes.json`, with the baseline it will be judged against and the date it went live.
- **Raw pulls go in dated folders**, `documents/seo/data/<date>/`. Decide before the first whether they're committed or gitignored.
- **Compare like with like.** The same weeks before and after. Search Console's last three days are incomplete. Analytics counts only visitors who accept cookies, so read it as direction.
- **After a deploy:** check the pages from outside, send IndexNow, resubmit the sitemap, and request indexing for the pages that matter.

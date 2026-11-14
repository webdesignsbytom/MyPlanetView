# SEO and AI search playbook

The rules for building a website that Google, Bing and AI assistants such as
ChatGPT can find, read, trust and send people to, and for keeping it that way
after launch. Any site, any stack. Where a rule depends on the stack (most
examples are Next.js on Vercel) it says so, and the principle still holds.

**For Claude on another project.** Read sections 1 to 5 before any SEO work or
before a launch. Then run the checklist in section 4 on the project in front of
you. Rules marked **[block]** stop a launch until they pass. Each rule has an ID
(`R2`, `S1`...): cite it in commits, reviews and reports, so anyone can look up
why a thing was done. Section 6 shows how to build each piece; section 8 is the
evidence the rules come from.

**For Tom.** Hand this file to any Claude working on a site of yours. It saves
relearning, the hard way, what search engines expect.

**Where it comes from.** Three live sites (Memento Astra, Arcana and Somnia,
astrology, tarot and dreams, Next.js on Vercel), launched August 2026, which
lost almost all of their Google visibility within weeks while Bing and ChatGPT
kept sending visitors. Every number in it was measured on those sites, and
every outside fact was checked against the engines' own documentation on the
date given in section 9. A rule that was later proved wrong is corrected in
place and recorded in the changelog at the end; nothing is quietly dropped.

| Section | What it is |
| --- | --- |
| [1. The twelve that matter most](#1-the-twelve-that-matter-most) | Read this if you read nothing else |
| [2. What the engines actually do](#2-what-the-engines-actually-do) | How Google, Bing and ChatGPT behaved towards new sites, measured |
| [3. The rules](#3-the-rules) | Every rule, by area, each with why and how to check it |
| [4. Checklists](#4-checklists) | Before launch, every deploy, the monitoring schedule, and what to do when traffic drops |
| [5. Measuring traps](#5-measuring-traps) | Readings that were wrong at least once, and how not to repeat them |
| [6. How to build it](#6-how-to-build-it) | The implementation: titles, canonicals, share images, structured data, sitemaps, rendering, breadcrumbs and the rest, with code and the trap in each |
| [7. Tools and scripts](#7-tools-and-scripts) | How to measure all of the above, by script, without paid tools |
| [8. The evidence](#8-the-evidence-memento-august-to-november-2026) | What happened on the Memento sites, and which rule each event produced |
| [9. Sources](#9-sources) | The documentation each outside fact rests on, with the date it was checked |
| [Changelog](#changelog) | What changed in this file, and why |

---

## 1. The twelve that matter most

1. **The content must be in the HTML the server sends, in reading order.**
   Not only text: forms and tools too. The major AI crawlers were measured not
   to run JavaScript, and Bing runs it unreliably. Check with `curl`, not a
   browser. (R1 to R7)
2. **Index only pages that have something of their own.** Google judges a site
   as a whole. Thousands of pages from one template, with a name swapped in,
   decide the verdict for every other page. (C1 to C4)
3. **A new domain launches small.** Its strongest few hundred pages, not ten
   thousand. Google gives a new site a fortnight of trial exposure and then
   judges it. (C4)
4. **Links from other sites are the biggest lever, and nothing on the site
   replaces them.** Plan where the first ones come from before launch. (B1)
5. **The sitemap lists only pages you want to be judged on**, and its
   `lastmod` dates are true. A sitemap whose every page claims to have changed
   today teaches Google to ignore the dates. (S1, S2)
6. **Every internal link points at the final address.** No link through a
   redirect, none into a login page, none into internal search results; moves
   are permanent redirects. (U2, U3, L3)
7. **Titles to 60 characters; descriptions 120 to 156, in whole sentences,
   unique, with the page's subject and a real fact from the page.** (M1, M2)
8. **Set up Bing and IndexNow, and let the AI crawlers in.** Bing kept indexing
   these sites while Google dropped them, and ChatGPT sent more visitors than
   Google did. (A1 to A3)
9. **Measure from day one, by script, and actually look.** A weekly pull with
   an alert. A collapse went unnoticed for five weeks once, and a ChatGPT drop
   for three. (X1, O3)
10. **Tag every link you control with `utm_` parameters, and make sure
    analytics can read them.** Stripping the query string for privacy is right;
    stripping the campaign tags with it blinds you. (X3, X4)
11. **A release is not finished until it is checked from outside.** Data in
    production, every sitemap URL answering 200, every tool's form in the HTML.
    Tests passing and the page looking right in a browser proved nothing,
    twice. (O1, O2)
12. **No penalty does not mean no problem.** When Google drops a site with no
    manual action and no technical fault, it has judged the site. On-page fixes
    cannot help until Google re-reads the pages, and it re-reads slowly once it
    has lost interest. (section 2)

---

## 2. What the engines actually do

Measured on three new sites from August to November 2026. Read this before
deciding what to build: it explains why the rules in section 3 exist.

### Google

- **A new site gets a trial.** Googlebot crawled Astra at up to 12,000 pages a
  day in its second week, and Google showed all three sites for about two weeks
  (up to 19,000 impressions a week on one). Ranking well in that window
  predicts nothing: pages ranked on their titles alone, because nobody else
  targets an exact query like "[name] birth chart".
- **Then it judges the whole site at once.** All three sites lost about 99% of
  their impressions between 30 August and 2 September, within four days of
  each other, with no manual action and no technical fault. Google rates a site
  as a whole and applies the rating to every page (section 9: helpful content
  folded into core ranking, March 2024).
- **It keeps pages indexed but stops showing them, then removes them.** Astra
  still had about 8,000 pages indexed through September and October while
  earning a handful of impressions a week. On about 24 October all three sites
  lost almost all their indexed pages in one step (Astra 299 left, Arcana 91,
  Somnia 38), mostly **without Google re-reading them**: most of the removed
  pages had last been crawled in August.
- **It stops crawling.** Crawl stats fell from 12,000 requests a day to almost
  none in early September and stayed there. The server was healthy throughout
  (99% answered 200, 242 ms average). A firewall block looks different: it
  shows as errors in crawl stats.
- **So it cannot see your fixes.** Two months of improvements (new writing on
  1,260 pages, rewritten descriptions, unlocked content) were invisible to
  Google: it had fetched 1 of 20 sampled improved pages. Google cannot judge a
  version of a page it has not fetched, so improvements count only once it
  has. Its own guidance says changes "can take effect in a few days" or take
  "several months", that you do not necessarily have to wait for a core
  update, and that after a few months with no change the next core update may
  be the point to look (section 9).
- **What it will do on request.** "Request indexing" in URL Inspection has "a
  daily limit" that Google does not publish; about 10 to 12 a day per property
  was observed. The URL Inspection API only reads (2,000 a day per property).
  The Indexing API is for job postings and livestreams only. A sitemap
  resubmission prompts a re-read of the sitemap, not of the pages.
- **What reliably brings it back** is outside evidence that people value the
  site: links from other sites, brand searches, real visits. And time: core
  updates, which re-weigh sites broadly, come every few months and take about
  two weeks to roll out (11 to 18 days in 2025 and 2026).

### Bing

- **Bing judges independently, and did not drop these sites.** Over the same
  weeks Bing's index of Astra grew from 9,808 to 13,389 pages, its daily crawl
  roughly quadrupled once IndexNow was in, and impressions rose to about 800 a
  week before levelling.
- **Bing's own warnings are worth reading**: it flagged meta descriptions under
  about 100 characters and asks for 150 to 160, and it reported missing
  IndexNow.
- **Bing matters beyond Bing.** ChatGPT search uses third-party search
  providers, Bing among them, alongside its own crawler; Microsoft's Copilot is
  Bing's own. Bing says `lastmod` "remains a key signal" for AI search and
  recommends IndexNow (section 9).

### ChatGPT and other AI assistants

- **It can be the largest source of visitors, and it is invisible in Search
  Console.** ChatGPT sent Astra more visitors than Google did in every month
  from September, nearly all to one free tool (`/astrocartography`).
- **It is volatile, and its changes are its own.** 40 to 70 visitors a day for
  a fortnight in October, then almost none from 23:00 UTC on 22 October, with
  the site unchanged for 19 hours either side and nothing blocked. The same
  week, Microsoft's AI kept citing the same site 20 to 60 times a day. One AI
  assistant changing its answers says nothing about the others. Watch each one
  weekly, by landing page, and do not let one page carry the traffic.
- **It sends people to tools and specific answers**, and tags its links with
  `utm_source=chatgpt.com`; its app often sends no referrer, so without the tag
  the visit looks "direct".
- **AI crawlers read the server HTML.** A 2024 measurement found none of the
  major AI crawlers (GPTBot, ClaudeBot, PerplexityBot) rendering JavaScript;
  Google says only that "not all bots can run JavaScript". Whatever is not in
  the HTML should be assumed not to exist for them (section 9).

---

## 3. The rules

Each rule: what to do, why (with the evidence in section 8), and how to check
it. **[block]** means it must pass before launch.

### 3.1 Content and the shape of the site (C)

**C1. Index only pages that have content of their own. [block]** A page that
exists because a database row exists is not a reason for Google to index it.
Keep it live if it is useful to visitors, hold it out of the index (C3, A4)
until it has writing or data specific to it, and grow the indexed set as the
site earns trust. *Why:* 13,000 celebrity pages from one template, 91% of
Astra, decided Google's view of the whole site (8.3). *Check:* C2, plus the
median words of main content per family.

**C2. Measure template similarity on rendered pages before launch, and after
any template change. [block]** For each family of pages built from one
template: a dozen random pages, main content only, the share of each page's
5-word phrases that appear on at least half the others. Under about 30% is a
normal consistent layout; over about 50% on a family of thousands is a scaled
content risk, whatever its pages rank for in week one. *Check:* section 7,
similarity.

**C3. When pages must be hidden, choose who they are hidden from.** `noindex`
hides from every engine. A Google-only `noindex` (`<meta name="googlebot"
content="noindex, follow">` beside `robots: index, follow`) keeps them in Bing,
and through Bing in ChatGPT search, while Google judges the site without them.
Keep `follow`, so links through them still count. (6.4)

**C4. A new domain launches with its strongest few hundred pages. [block]**
Not all of them. Get links and mentions, then widen. *Why:* 17,500 mostly
template pages on three unlinked new domains were trialled and dropped (8.3).

**C5. Help text belongs on one page, not on every page.** Captions explaining
how to read a chart, table or tool are identical on every instance. Give the
shared component a switch and link to one explainer. *Why:* 200 identical words
on 13,000 pages were most of what made them alike.

**C6. Write it yourself, from facts.** Rewording one source sentence by
sentence (Wikipedia especially) is "rewriting content from other sources with
little added value" under Google's spam policies. Facts about real people come
from verified data and are inserted, never generated; generated text may word a
sentence around facts it is given, and must not add any. Check output against
the data by script.

**C7. Show who wrote it and what it rests on.** Real bylines (a team section
with a bio per person and `Person` markup), "Reviewed by" only on pages that
person actually reviewed, with the date. Sources on any research claim, drawn
from one verified list and tested. Label tradition as tradition and research
as research. An editorial policy page. For health, money or safety subjects
this outranks every technical rule. (6.12)

**C8. The site's claims about itself must match what it does.** Read every
"how it works", "about", FAQ and description against the live behaviour.
*Why:* a page promised a tool dropped the Ascendant without a birth time; it
did not.

**C9. Every feature you link to works end to end, signed out and as a brand new
account.** An empty state on a live feature is a bug report until proven
otherwise. Never point a link, post or email at a page that cannot hold the
visitor.

**C10. A listing page earns a place in the index only with writing of its
own.** Topic and tag pages are `noindex, follow` unless they have an
introduction and content beyond the list. Pages 2 and later of a list keep
their own canonical (U5) and, if they are noindexed, every item they list must
also be reachable another way (the sitemap and links from related pages),
because a page left `noindex` for long may stop having its links followed.
Filter and sort combinations stay out of the crawl altogether (6.19). *Why:*
every topic and page URL on two blogs together had zero clicks; a site judged
thin should not add list pages.

**C11. Render stored text through one formatter everywhere.** If content can
carry Markdown, every place that shows it uses the same renderer, or visitors
see the asterisks.

### 3.2 Rendering and crawlability (R)

**R1. Every public page's content is in the server HTML, in reading order.
[block]** Text, headings, links, and the forms of tools. *Check:* `curl` the
page with a crawler's user agent and look for the content between `<main>` and
`<footer>`; for tools, count the `<input>`s there (section 7, tool forms).
Not a browser, which runs the JavaScript and hides the problem.

**R2. Do not make indexable content depend on browser-only reads during
render.** In Next.js, `useSearchParams` on a statically rendered page makes
everything up to the nearest `Suspense` boundary render in the browser only
(Next's own documentation). Read the address in an effect (`window.location`)
if only behaviour depends on it, or use the page's `searchParams` prop if the
content does (which makes the route dynamic). *Why:* two of Astra's main tools
shipped with no form in their HTML for three weeks (8.6).

**R3. No `Suspense` boundary around indexable content unless something in it
really suspends, and never `fallback={null}` around content.** A boundary whose
content takes time is sent after the rest of the page, as a hidden block that a
script moves into place; a crawler reading the HTML in order meets the
placeholder first. *Check:* R1.

**R4. If view source is an empty `<div>`, pre-render every URL. [block]** A
site that renders in the browser sends every crawler the home page's title and
an empty body. Google renders it eventually; previews, most of Bing and the AI
crawlers do not. (6.22)

**R5. Googlebot is a signed-out visitor. [block]** Test every gated page signed
out, with the production flags. An access check that only runs for signed-in
users fails closed for everyone else, Google included. *Why:* three lessons
served an empty "Premium" panel to Google for two months while paywalls were
off.

**R6. Keep each page's HTML well under 2 MB.** Googlebot reads only the first
2 MB of uncompressed HTML; anything after is not seen. Large inline data
(serialised props, inline SVG, embedded JSON) counts. *Check:* the size of the
`curl` response for the heaviest template.

**R7. The raw HTML and the rendered page agree on the signals.** The status
code, `robots` meta, canonical and title are the same before and after
JavaScript runs. A `noindex` in the raw HTML can stop Google rendering the page
at all, so a script that later removes it does nothing; a page that answers
non-200 may not be rendered; a canonical that changes on render is a
conflicting signal.

### 3.3 Addresses, canonicals and redirects (U)

**U1. One host per site.** Redirect the hosting provider's own address
(`*.vercel.app`, `*.netlify.app`) to the real domain, matched on that exact
host so previews still work. Pick www or bare, and one trailing-slash
convention. Delete old deployments on providers you have left.

**U2. One address per page, and moves are permanent.** If a page can be reached
at two paths, redirect one to the other with a permanent redirect (301 or 308).
In Next.js that is `permanentRedirect()`, not `redirect()`, which answers 307
(temporary) and tells crawlers to keep the old address on file.

**U3. Internal links point at the final address. [block]** Never through a
redirect, never to a 404. Build every link to a kind of thing through one
helper that knows where that kind lives (`pathFor(item)`, `blogHref()`,
`recordPath(slug, category)`), never by hand in a template. *Check:* the sweep
(section 7): internal links answering anything but 200 should be zero, except
deliberate `nofollow` ones.

**U4. Retire a URL with a permanent redirect to its successor, children
included (`/old/:path*`), or let it answer an honest 404 if nothing replaces it
and nothing links to it.** A missing page returns status 404, not 200 with an
apology (a soft 404).

**U5. Every listing state has a deliberate decision.** Each page of a list is
its own canonical, never page 1 (Google). Filter and sort combinations are kept
out of the crawl (robots.txt or `#` fragments), which Google prefers to
canonicals for them. Search results are `noindex, follow`. And send one signal
per page: a canonical pointing elsewhere *or* a `noindex`, not both, which
Google has called contradictory. (6.19)

**U6. Check Google's chosen canonical, not just yours.** URL Inspection shows
both; a page where Google chose another address is a duplicate you did not know
about.

### 3.4 Titles, descriptions, share images and structured data (M)

**M1. Titles up to 60 characters, unique, saying what the page is.** The brand
goes on the end only if it fits.

**M2. Descriptions 120 to 156 characters, in whole sentences. [block]** Never
cut with an ellipsis. Unique. The page's subject, in the words people search,
in the first 100 characters, and a real fact from the page (a date, a count,
the item's own property). Template families at 50% similarity or below. A unit
test runs every template over every row of its data and fails on any of it.
(6.1)

**M3. Every page has a share image.** In Next.js, a page that declares
`openGraph` without `images` loses the inherited image silently; spread a
default into every `openGraph` and test for it. (6.3)

**M4. Structured data describes only what is visible, and only what is true.**
`Organization` and `WebSite` sitewide; one type per page that matches it; dates
as real ISO strings; product prices that match the page; no invented ratings,
reviews or FAQs. Shipping and return policies can be set once for the whole
shop in Search Console, which then takes precedence over markup. FAQ rich
results ended on 7 May 2026 and the sitelinks search box in November 2024, so
neither `FAQPage` nor `SearchAction` earns anything in Google now. Centralise
the builders. (6.4)

**M5. Breadcrumbs: one list builds the visible trail and its data; every crumb
above the page is a real page, named one way everywhere.** (6.23)

**M6. One `h1`; one `main`, in the root layout; headings in order; a skip link
that works.** (6.5)

### 3.5 Sitemaps and robots.txt (S)

**S1. The sitemap lists only pages you want to be judged on. [block]** Every
URL in it answers 200, is indexable and is its own canonical. A page you hide
from Google comes out of the sitemap, unless Google is actively crawling the
site (crawl stats show it) and you want it to re-read the page soon to see the
tag; take it out as soon as Search Console shows the tag seen. *Why:* listing
13,740 Google-noindexed pages kept pointing Google at the template it had
judged the site on, and with Google no longer crawling, it never came to see
the tag anyway (8.5). Hidden pages stay reachable through links, which Bing
follows.

**S2. `lastmod` is the date the page's content last changed. [block]** Never
the time the sitemap was built, and never `now` as a default. Pages that truly
change daily (a daily horoscope, a live feed) say `now`; database rows carry
their own `updatedAt`; everything else carries one fixed date for the last
site-wide content change, moved forward only when such a change ships. Google
uses `lastmod` only when it is "consistently and verifiably" accurate; Bing
calls it "a key signal" for AI search; both ignore `changefreq` and
`priority`. *Check:* count the distinct dates per child sitemap (section 7);
"today" on everything is the failure.

**S3. Split the sitemap by section, submit every child, and never let it
fail.** Search Console reports coverage per child, which is how you see which
kind of page is rejected. Drop empty sections from the index (an empty child is
an error). Every read falls back to an empty list rather than throwing.

**S4. Build the sitemap from the same source as the routes, with the same
guards.** If a page needs data to exist, the sitemap entry and the links to it
use the same "does the data exist" check, so a missing release step degrades
to absent rather than to 404s Google is told about.

**S5. robots.txt allows the site, disallows only private paths (the API),
allows any share-image endpoint, and declares the sitemap.** Keeping a page out
of the index is the page's own `noindex`, not robots.txt: a blocked page can
still be indexed from links, without its content.

### 3.6 Internal links (L)

**L1. No orphans, and hubs linked from their children.** Every indexable page
is reachable by a followed link; each section index is linked from its own
records, not only the other way round.

**L2. Articles are linked from the pages they explain, and link back.** A post
reachable only through the blog index is an orphan in all but name.

**L3. Never send a followed link into a login-only page or an internal search
results page.** Mark such links `rel="nofollow"` (readers lose nothing), and
decide it once where links are made (the shared link and Markdown components),
so content written later is covered. *Why:* Google spent its few November
visits to one site on search-results pages linked from 1,640 dream pages (8.6).

**L4. Anchor text names the destination.** "Read more" tells an engine
nothing. Related links are computed from real relationships, not maintained by
hand.

### 3.7 Links from outside, and the name (B)

**B1. Plan the first outside links before launch.** Communities, directories,
social profiles, partners, press: named places, pointing at specific pages, not
only the home page. Links from your own other sites count for little.

**B2. Do not stack network patterns.** Several new sites from one owner, on one
template, launched together, linking to each other from every page, each with a
followed "Website by" credit, are each normal and together look like a network.
Builder credits are `rel="nofollow"`; sister-site links are one small block.

**B3. Choose a name people can find, and track brand search from day one.** A
name that is a common phrase ("memento astra") returns other things for years;
one that is not ("memento somnia") resolved within weeks.

### 3.8 Bing, ChatGPT and other AI search (A)

**A1. Set up Bing Webmaster Tools on day one.** Import from Search Console (no
code), submit the sitemaps, store an API key outside the repository (it is not
read-only and covers every site on the account; call only `Get` methods).

**A2. Set up IndexNow.** A key file at `/<key>.txt`; a ping to
`api.indexnow.org` whenever content is saved (after the response, never
blocking the save, only from the live deployment); a command that sends the
pages whose `lastmod` changed; every page once after the first deploy. Record
the accepted count the API returns, not the number you meant to send. IndexNow
reaches Bing, Yandex, Seznam, Naver and Yep; Google does not take part, so for
Google the sitemap and its `lastmod` are the channel. **Run it automatically**
(a scheduled task, or a step after each production deploy): a command that
relies on someone remembering it went unrun for a month on three sites, through
a data push and a deploy. Check what was received in Bing Webmaster Tools'
IndexNow page. Automate it only once `lastmod` is honest (S2), or every run
resends pages that merely claim to have changed.

**A3. Let the crawlers in, and prove it from outside. [block]** `bingbot`,
`OAI-SearchBot`, `ChatGPT-User`, `GPTBot`, `ClaudeBot` and `PerplexityBot` get
a 200 from the live site and are not blocked by robots.txt, a firewall or a CDN
default (some CDNs now block AI crawlers by default). OpenAI's are independent
of each other: `OAI-SearchBot` puts pages in ChatGPT search, `GPTBot` collects
training data (block it if you like, never `OAI-SearchBot`), and
`ChatGPT-User` fetches a page when a person asks, where robots.txt "may not
apply". *Check:* `curl` with each user agent; the engines' own tools (Bing URL
Inspection).

**A4. Need to hide pages from Google only? Use the `googlebot` meta (C3).**
Bing and the AI crawlers keep them.

**A5. Make AI traffic measurable.** Your links in AI answers arrive with
`utm_source=chatgpt.com` or a referrer such as `chatgpt.com`,
`copilot.microsoft.com`, `perplexity.ai`, `gemini.google.com`. Keep those tags
(X3), report them as their own source, and watch them weekly by landing page.
GA4 has an "AI Assistant" default channel for these (it does not include
Google's own AI Overviews or AI Mode, which arrive as Google search); Search
Console has a generative AI performance report for Google's side; Bing
Webmaster Tools' AI Performance report counts citations by Microsoft's
Copilots and partners, by query and page. Citations are not clicks (one site
had about 1,900 citations and 9 visits from Copilot in the same weeks), but
they show whether you are in the answers at all.

**A6. There is no special markup for AI answers.** Server HTML (R1), clear
answers in the text, real structured data and a page that works are what is
read. Google's own guide says you need no machine-readable files, AI text
files or special markup for its AI features, and that Google Search does not
use `llms.txt`; keeping one for other services is harmless.

**A7. Do not opt out of Google's AI features by accident.** Search Console's
"Search generative AI" setting (since August 2026) removes a site from AI
Overviews, AI Mode and Discover's AI features. It is not a ranking signal for
ordinary results, but it is a door closed; leave it alone unless you mean it.

### 3.9 Analytics and measurement (X)

**X1. Measurement exists before launch. [block]** Search Console as a domain
property, the sitemap index and every child submitted. A read-only service
account and a script that saves a dated snapshot (Search Console keeps 16
months; your files are the long record). Bing the same (A1). A baseline on
launch day: sitemap counts, Lighthouse, brand search. GA4's campaign
attribution and AI Assistant channel working (X3, A5).

**X2. Analytics is not the traffic number.** Consent-gated analytics counted
about one visitor in eight here. Use Search Console and Bing for search counts,
analytics for proportions, sources and behaviour.

**X3. If you strip the query string from analytics for privacy, let the
campaign tags through. [block]** Dropping parameters is right (quiz answers and
dates of birth had been reaching Google Analytics as page addresses). But GA4
reads campaigns from the page address, so dropping `utm_source`, `utm_medium`,
`utm_campaign`, `utm_content` and `utm_term` turns every tagged visit into
"direct". Allow those five, drop everything else, and test both halves. (6.21)

**X4. Tag every link you control.** Social bios and posts, emails, partner
links: `utm_source=<platform>&utm_medium=social&utm_campaign=<bio|post|...>`.
Untagged app traffic arrives with no referrer.

**X5. Cookieless analytics counts scrapers.** A browser-running scraper is a
"visitor" to tools like Vercel Web Analytics: 85% of one site's reported
visitors were one-page desktop Chrome hits in bursts from a few countries.
Read the device mix; on a mobile-heavy audience, mobile visitors are the human
count.

**X6. Log every change with its date, in a form a script can read, and
snapshot before you change anything.** Commit messages must say what changed;
"save" made a timeline unrebuildable. Compare changed pages against unchanged
ones, inside ranking position bands, and withhold a verdict below about 1,000
impressions per group. On a small site, do not plan changes as experiments you
cannot read: make them because they are right. (7.4)

**X7. Each review gets its own dated report, and the readings actually
happen.** A schedule nobody keeps is no schedule (O3).

**X8. Send the moments that matter as analytics events, from launch.**
Page views say where visitors came from; only events say which source brought
accounts and money. At least: account created, newsletter or lead, the main
tool used, a result saved, checkout started, and an order paid (with its value
and currency, counted only once the payment is confirmed and once per order).
One helper sends them all: nothing before consent, only the fields listed for
each event, nothing containing `@`. Say so in the privacy policy, in the same
release. *Why:* one site gained 25 accounts in a fortnight and nothing could
show where from (8.6). *Check:* each event in the analytics Realtime view
after a test visit with a `utm_` tag; mark the account, lead and purchase
events as key events. In GA4 (checked 12 November 2026) a key event is marked
with the star on Admin, Data display, Events, and only for an event already
received; there is no longer a way to add one by name in advance. `purchase`
is a key event by default. So send one test of each event straight after the
release, then star them.

### 3.10 Releases and operations (O)

**O1. A release is not finished until its data is in production. [block]** If
pages read from a table, the release includes the step that fills it on
production, and someone confirms a live page shows the data. "Deployed" is
about code.

**O2. Check every deploy from outside.** Every sitemap URL (not a sample) and
every internal link; one page per template in view source (`h1`, canonical,
description, `article:` dates, JSON-LD); every tool's form in the HTML; the
live robots.txt. Then resubmit the sitemaps and send IndexNow. (4.2)

**O3. Look every week, automatically, and alert on a fall.** A scheduled pull
of impressions and clicks by day for Google and Bing, sessions by source for
analytics, with an alert when a week falls by more than half. A full reading
every two weeks. *Why:* a Google collapse was found five weeks late, and a
ChatGPT collapse three weeks late, both by people who meant to look.

**O4. Content kept in seed files needs a sync command.** Match by slug, show the
differences, write only with a flag, never touch rows the seed does not own.

**O5. Audit a section by script, against what a crawler receives.** Tags,
structured data, headings, body links and every link target. A browser shows
none of the faults that matter here.

**O6. Speed: measure per page type, median of three, and find the one heavy
thing.** Lighthouse mobile. A page that is slow because of one component is
fixed by deferring that component, not by general tuning. (6.13)

**O7. Anything a page fetches from another company's API while it renders is
cached once for the whole deployment, not per server instance.** Crawlers and
scrapers arrive in bursts across many pages; a host like Vercel answers a burst
with many fresh instances, and an in-memory cache in each starts empty. One
site's shop rail priced 63 products per fresh instance and hit its supplier's
limit 440 times in a week. Use the framework's shared cache (in Next.js
without Cache Components, `unstable_cache` with a `revalidate`), never cache a
refresh the supplier mostly refused, and never let anything that charges money
read the cached copy.

**O8. A test gate only protects production if production goes through it.**
A check set to run on pull requests into `main` never runs when `main` is
updated by pushing or fast-forwarding. Send every production release through
the gate, and make the gate build what the host builds: install, database
seeded from nothing, lint, tests and the production build, in a clean clone
with no local env files and a throwaway database. *Why:* Memento's check was
added on 21 October and first ran on 12 November, three releases later; it
failed before reaching the tests, because its seed step had never worked. A
build that fails on the host still costs its build minutes. *Check:* the
release's pull request shows the check passing on the exact commit deployed.

---

## 4. Checklists

### 4.1 Before launch

Copy into the project and tick. **[block]** items stop a launch.

**Content and shape**
- [ ] **[block]** Template similarity measured on rendered pages for every family over about 50 pages; nothing indexed above about 50% (C2).
- [ ] **[block]** Pages without content of their own held out of the index (C1, C3); indexed count proportionate to a new domain (C4).
- [ ] Shared help text on one page (C5); no single-source paraphrase; facts about people from data (C6).
- [ ] Bylines, team page, sources, editorial policy in place (C7).
- [ ] Every claim the site makes about itself checked against what it does (C8).
- [ ] Every feature you will promote used end to end, signed out and as a new account (C9).
- [ ] Listing, tag, filter and search pages `noindex, follow` unless written (C10).

**Rendering**
- [ ] **[block]** `curl` of one page per template shows its own title, description, canonical, `h1`, body text and, for tools, the form, between `<main>` and `<footer>`; the HTML is under 2 MB; status, robots and canonical agree before and after JavaScript (R1 to R3, R6, R7).
- [ ] **[block]** If view source is an empty `<div>`, every URL pre-rendered (R4).
- [ ] **[block]** Every gated page fetched signed out with production flags (R5).

**Addresses and links**
- [ ] **[block]** Every sitemap URL answers 200; every internal link answers 200 or is deliberately `nofollow` (U3, S1).
- [ ] Provider hosts redirect to the real domain; one host, one slash convention (U1).
- [ ] Moves are permanent redirects; a missing page returns 404 (U2, U4).
- [ ] No followed links into login pages or search results (L3); no orphans (L1).

**Metadata**
- [ ] **[block]** Titles to 60; descriptions 120 to 156, whole sentences, unique, tested over every row (M1, M2).
- [ ] Every page has a share image, tested (M3).
- [ ] Structured data validated (Rich Results Test, Schema Markup Validator); deliberate warnings written down with the reason (M4, 5.2).
- [ ] Breadcrumbs per 6.23 (M5); one `h1`, one `main` (M6).

**Sitemaps and robots**
- [ ] **[block]** Sitemap lists only pages to be judged on; `lastmod` true, not "today" everywhere (S1, S2).
- [ ] Split by section; empty sections dropped; never throws (S3, S4).
- [ ] robots.txt allows the site and the share-image endpoint, declares the sitemap (S5).

**Engines and measurement**
- [ ] **[block]** Search Console domain property, sitemap index and children submitted; snapshot script and baseline in place (X1).
- [ ] **[block]** Bing Webmaster Tools set up; IndexNow live and the first full send done (A1, A2).
- [ ] **[block]** The six crawlers answered 200 from the live site (A3).
- [ ] **[block]** Analytics keeps the five `utm_` tags and drops every other parameter, tested (X3).
- [ ] **[block]** Account, lead, main tool, save, checkout and paid-order events sent after consent, with no personal data, seen in Realtime; the privacy policy says so (X8).
- [ ] Links you control are tagged (X4); AI sources reported separately (A5).
- [ ] A weekly scheduled check with an alert exists and has run once (O3).
- [ ] An SEO change log started (X6); a plan for the first outside links, with named places (B1).
- [ ] Brand name searched; builder credits `nofollow`; sister-site links one small block (B2, B3).
- [ ] Lighthouse mobile, median of three, one page per template; SEO 100, CLS near 0 (O6).

### 4.2 Every deploy

1. Production data steps run, and one live page per changed feature looked at (O1).
2. Full sweep: every sitemap URL and every internal link (section 7). Nothing new that is not 200.
3. The tool-forms check: every tool page's form between `<main>` and `<footer>` (R1).
4. View source on one page per changed template: `h1`, canonical, description, share image, structured data, `article:` dates.
5. The sitemaps' `lastmod` spread (S2): no child newly "today" on everything.
6. Analytics: open a page with `?utm_source=test&utm_medium=social`, accept cookies, see it in GA4 Realtime (X3).
7. Resubmit the sitemap indexes in Search Console and Bing; send IndexNow, keep the accepted counts (A2).
8. Add the change to the change log, with the date it went live (X6).

### 4.3 The monitoring schedule

| When | What |
| --- | --- |
| Weekly, scheduled | Impressions and clicks by day (Google, Bing); sessions by source and landing page; an alert on any week down by half; AI sources by landing page (O3, A5) |
| Every two weeks | A full reading in its own dated report: snapshot pull, Page indexing (screen), crawl stats (screen), a random 20 URLs per sitemap section through URL Inspection, the sweep (X7) |
| Monthly | Lighthouse per page type; brand search; Bing's recommendations; backlinks in both consoles |
| After a Google core update completes (about two weeks after it starts; Google's Search Status Dashboard) | A full reading; compare Page indexing and impressions with the reading before it |

### 4.4 When traffic drops: the diagnosis order

1. **Is it real?** Confirm with a second source (analytics, the other engine).
2. **A penalty?** Search Console, Manual actions and Security issues.
3. **A technical fault?** Crawl stats (responses, host status); robots.txt; a stray `noindex` or `X-Robots-Tag` (fetch with the crawler's user agent); URL Inspection on the top pages (fetched, allowed, canonical).
4. **Indexing:** Page indexing, read with the report's own "Last update" date; which reasons grew; the chart's indexed series by date.
5. **An update?** Google's Search Status Dashboard for the dates.
6. **What changed?** The change log and the deploys for the week before (X6).
7. **Which pages?** A random 20 per sitemap section through URL Inspection: indexed, crawled not indexed, unknown, and the last crawl date.
8. **Why those?** Similarity per family (C2); median words per family.
9. **Anything broken?** The full sweep.
10. **For AI traffic:** landing pages by day, then by hour against the deploy times (5.1, trap 17); the page's live HTML as the AI crawler gets it (R1); robots.txt, firewall and CDN for the AI user agents (A3); whether the other assistants still cite the site (Bing's AI Performance report), which tells you whether it is one assistant's change or yours.

Steps 1 to 5 decide whether it is a penalty, a fault, or a judgement. Steps 6
to 9 find what the judgement is about.

---

## 5. Measuring traps

Each of these produced a wrong reading at least once.

### 5.1 The traps

1. **A sample misses concentrated failures.** 120 dead URLs in a section of
   13,120 is under 1%; an eight-URL sample almost never hits one. Sweep
   everything.
2. **React streams content to the end of the HTML.** A `Suspense` boundary's
   content can arrive after the footer inside `<div hidden id="S:0">`, with
   `<template id="B:0">` where it belongs. Skip those blocks when counting
   `h1`s (or the raw HTML shows two), but search the whole response before
   calling content absent. Both mistakes were made here.
3. **One Lighthouse run is noise.** Up to 18 points between runs. Median of
   three, mobile, simulated throttling, and record the machine.
4. **Search Console's Page indexing report lags, and can stall and then catch
   up in one step.** Read its "Last update" date first, and confirm with URL
   Inspection before believing a sudden change.
5. **The Search Console API cannot see Page indexing counts, crawl stats or
   Manual actions.** Read those screens (by hand, or with a browser-driving
   assistant).
6. **Bing's query and page reports return the top rows only.** About 100 a
   week, not totals; use the traffic report for totals, and never sum the rows
   as if complete.
7. **Cookieless analytics counts scrapers** (X5). Read the device mix.
8. **Consent-gated analytics undercounts** (X2), and grepping the HTML for the
   tag proves nothing.
9. **Web search APIs are not Google.** Fine for "who ranks for this" and for
   comparing your own runs; never for your Google positions.
10. **Decode HTML entities before measuring titles and descriptions**, and
    count descriptions ending in "…" as failures: a truncating helper makes
    every description look in range.
11. **Your threshold is not the engine's.** Open the engine's own list of URLs
    before explaining a warning away.
12. **Parse each sitemap entry on its own.** A pattern run over the whole file
    can read one entry's `loc` with the next entry's fields.
13. **A stale local server or build invents site-wide defects.** Measure the
    live site; if a finding is catastrophic, measure again before believing it.
14. **Supplier-fed sections move on their own.** A shop sitemap read live from
    a print supplier changes count with no deploy.
15. **Look at the pages, not just the numbers.** Screenshots found two live
    bugs no crawl had: raw Markdown and an empty community.
16. **Check each analytics property receives only its own site** (GA4's
    `hostName` dimension), before blaming low numbers on traffic.
17. **Check the hour before blaming a deploy.** A fall that shows up "the day
    after a deploy" in daily figures can start before it. ChatGPT's visits to
    one site were blamed on a deploy for most of a day; hourly visitor counts
    showed the fall came 19 hours earlier, with no deploy in between. Line the
    hourly series up against the deploy times before calling it a cause.

### 5.2 Warnings that are correct to leave

Search Console and Bing will keep reporting these. Acting on them makes things
worse.

- **`shippingRate` missing** when postage is quoted live at checkout. A flat
  rate the checkout then contradicts is worse.
- **`review` or `aggregateRating` missing** when there are no reviews. Invented
  reviews are a manual-action risk.
- **"Excluded by noindex"** rising, when you noindexed on purpose.
- **404s for URLs you retired** that nothing links to.
- **"Alternative page with proper canonical tag"**: the canonical working.
- **"Page with redirect"** for the `http://` and non-canonical host versions of
  your pages: the redirect working.

### 5.3 Things you will be tempted to add, and should not

- **`hreflang`** on a single-language site.
- **`rel="next"` and `rel="prev"`**: Google stopped using them in 2019.
- **A keywords meta tag**: ignored for over fifteen years.
- **`changefreq` and `priority` in the sitemap** as if they mattered: ignored.
  `lastmod` is the field that is read, which is why it has to be true (S2).
- **The Indexing API for ordinary pages**: it is for job postings and
  livestreams only.
- **Markup for a rating, price or FAQ that is not on the page**: a
  manual-action risk, not a missed opportunity.
- **`llms.txt` as an SEO measure**: not used by Google (A6).
- **`SearchAction` for a sitelinks search box**: Google retired the box on 21
  November 2024. Existing markup is harmless; `WebSite` markup still names the
  site.
- **`FAQPage` for a rich result**: FAQ results ended on 7 May 2026. Mark up a
  real, visible FAQ only if you want to describe it.
- **Canonicals or `nofollow` to tame filter URLs**: Google calls them "less
  effective in the long term" than keeping the combinations out of the crawl.
- **Anything that interferes with the back button**: "back button hijacking"
  has been a spam policy since April 2026.
- **A separate mobile site, or AMP.**
- **An RSS feed nobody asked for.**

---

## 6. How to build it

How each piece is built, with the code shape and the trap that makes it go
wrong quietly. Written for Next.js App Router (React server components); the
principles transfer to any stack, the exact calls will not. Section 3 says
what must be true; this section says how to make it true.

Doing everything here was necessary and was not sufficient: the Memento sites
had nearly all of it in place when Google dropped them (section 8). Content and
site shape (3.1) decide more than any technical item.

### How to use this section

Work down the checklist. Each numbered section below explains the rule, shows
the shape of the fix, and names the trap that makes it go wrong quietly.

**The order matters.** 6.1 to 6.6 are worth more than everything after them,
because they are the ones search engines actually read. 6.15 and 6.16 are how
you stop the rest rotting. 6.17 to 6.21 are small, easy to get wrong, and
invisible when they are.

| # | Area | The one-line version |
| --- | --- | --- |
| 6.1 | Title and description | Titles to 60 characters; descriptions 120 to 156 in whole sentences, unique, search term first |
| 6.2 | Canonical URL | Every page declares one, and one URL renders each page |
| 6.3 | Share images | Declaring `openGraph` without `images` silently kills the inherited one |
| 6.4 | Structured data | Organization and WebSite sitewide, the right type per page, nothing that is not visible |
| 6.5 | Headings and landmarks | One `h1`, no skipped levels, one `main`, a working skip link |
| 6.6 | Sitemaps | Only pages you want judged on, split by section, empty ones dropped, `lastmod` true |
| 6.7 | robots.txt | Allow the site, disallow the API, point at the sitemap |
| 6.8 | Internal linking | No orphans, and hubs linked from their own children |
| 6.9 | Images | Real dimensions, honest `alt`, and a decorative image says so |
| 6.10 | ARIA | Only where HTML cannot say it, and never a name that lies |
| 6.11 | Duplicate and thin content | One URL per page, and no page that exists only to exist |
| 6.12 | Content quality | Sources, dates, and a named position beat volume |
| 6.13 | Core Web Vitals | Measure the page, not the component |
| 6.14 | Copy rules | Whatever house style is, enforce it on the RENDERED page |
| 6.15 | An automated content audit | The whole of the above, run against the built site |
| 6.16 | Tests that hold it | Assertions on shape, so a new page cannot skip the rules |
| 6.17 | The document shell | `lang`, viewport, theme colour, icons, manifest |
| 6.18 | Rendering and crawlability | Content and forms in the server HTML, in reading order |
| 6.19 | Pagination, filters and search | Each page of a list its own canonical; filters out of the crawl; search `noindex` |
| 6.20 | 404s and redirects | A real 404 status, and a permanent redirect for every URL you retire |
| 6.21 | Analytics and consent | Consent first; drop the query string but keep the `utm_` tags |
| 6.22 | Client-rendered sites | If view-source is an empty `<div>`, only Google can read you: pre-render every URL |
| 6.23 | Breadcrumbs | One list builds the trail and its data; every crumb above the page is a real page, with one name everywhere |

---

### 6.1 Title and description

**Titles: up to 60 characters. Descriptions: 120 to 156.** Beyond the top end
they are truncated in results, and a truncated title is worse than a shorter one
because the useful half is usually at the end.

**The description range, and where it comes from** (checked 4 October 2026):

| Source | Says |
| --- | --- |
| Google | No limit; the snippet "is truncated ... as needed, typically to fit the device width". Roughly 155 to 160 characters show on desktop, about 120 on mobile. Descriptions must be unique, not "identical or similar" across pages; programmatic ones are "encouraged" for large database sites if "human-readable and diverse"; no keyword lists |
| Bing | "Aim for a length of 150-160 characters." Flags anything under about 100 as too short |
| Yoast | Too short under 120, too long over 156 |

So: **120 to 156, with the page's subject and the words people search in the
first 100.** Google rewrites about two thirds of descriptions with its own text
(Ahrefs 2020: 62.78%; Portent 2020: 68 to 71%), so a description earns its keep
on the searches where it is shown, and on Bing, which shows them more often.

Do not interpolate and hope. Use a helper that enforces the limit and makes a
sensible choice when the brand does not fit:

```js
export const MAX_TITLE = 60;
export const MIN_DESCRIPTION = 120;
export const MAX_DESCRIPTION = 156;

export function metaTitle(pageTitle, brand) {
  const title = String(pageTitle || '').trim();
  if (!brand) return truncate(title, MAX_TITLE);

  const suffix = ` | ${brand}`;
  if (title.length + suffix.length <= MAX_TITLE) return `${title}${suffix}`;

  // Too long with the brand. Keep the full page title if it fits alone: a
  // complete specific title beats a truncated one with a brand stuck on it.
  if (title.length <= MAX_TITLE) return title;

  return truncate(title, MAX_TITLE);
}
```

**Never truncate a description.** Cutting long text at the limit with "..."
makes every description *measure* in range while the search result shows half a
sentence. On the Memento sites that hid about 2,600 broken descriptions. Build
each one from whole sentences that fit, offering several versions longest first
and taking the first in range (`fitDescription`). Truncation is for titles, on a
word boundary, never a hard slice.

**Make templates carry real per-page data.** A template that only swaps the
name ("The Fool in a love reading. What it says about connection...") is
unique and still "similar" in Google's terms. Measure it: for each family, the
share of each description's 3-word phrases that appear in at least half of the
family. Keep indexable families at 50% or below by putting the page's own facts
in: the card's own meaning, the sign's dates, the person's star sign, the
month's count of good days.

**Every page needs its own, and a test that proves it.** A template that renders
800 pages from one data file will happily give all 800 the same description if
nobody checks. Run every template over every row of its real data in a unit
test and fail on: outside 120 to 156, an ellipsis, a dash, a duplicate, the
subject missing from the first 100 characters, a family over 50% similar. The
Memento versions are `test/unit/metaDescriptions.test.js` on each site.

**Write descriptions, do not just slice them.** A description assembled from the
first 155 characters of the body reads like a machine wrote it, because one did.
The description is ad copy for a result page: say what the page answers, in the
words people search (check Search Console's queries for the page), with a fact
from the page. Composing from the page's own whole sentences is fine; slicing is
not.

---

### 6.2 Canonical URL

Every page declares one:

```js
export const metadata = {
  alternates: { canonical: '/dream-meanings/teeth' },
};
```

Relative is fine when `metadataBase` is set (see 6.3). Set `metadataBase`
once in the root layout from an environment variable, so the same code is
correct on localhost, on a preview deployment and on the real domain with no
rebuild:

```js
metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || SITE_URL),
```

**One URL must render each page.** If a record can be reached at two paths,
redirect one to the other rather than serving both. A duplicate that resolves is
worse than a 404, because it splits ranking between two addresses:

```js
import { permanentRedirect } from 'next/navigation';

// An archive entry reached through the generic list is sent to its own wing
// rather than rendered twice. Permanent, because the move is.
if (entry.category === 'creature') permanentRedirect(creaturePath(entry.slug));
```

**`redirect()` in Next.js answers 307, temporary.** A temporary redirect tells
crawlers the old address is still the real one. For a page that has moved for
good use `permanentRedirect()` (308), or `permanent: true` in the config's
`redirects()`. Fifteen links on one site went through a 307 because the
default is the temporary one (U2).

---

### 6.3 Share images, and the trap that costs you all of them

**This is the highest-value paragraph in the document.**

In Next.js, a page that declares an `openGraph` object **without** an `images`
key does not inherit the site-wide image. It gets **no** `og:image` at all.
Nothing errors, nothing warns, and the page looks fine until somebody shares it
and gets a bare grey card.

On one of these sites that had silently cost about a thousand pages their share
image. It re-arms every time somebody adds a page and writes `openGraph:` to set
a custom title.

Two defences, and use both:

**a. Always spread a default.**

```js
export const DEFAULT_OG = {
  type: 'website',
  siteName: CompanyName,
  images: [{ url: '/og.png', width: 1200, height: 630, alt: '…' }],
};

export const metadata = {
  openGraph: { ...DEFAULT_OG, title, description, url: path },
};
```

**b. Assert it.** A test that walks every page file, finds every `openGraph`
block, and fails when one has no `images` and no spread default. See 6.16.

**Sizes.** 1200 by 630 for `og:image`. Twitter uses the same file with
`card: 'summary_large_image'`.

**Generated cards.** If you generate share images per page (Next's `ImageResponse`,
which uses Satori under the hood), know that **Satori does not implement
`object-fit`**. It stretches any image whose declared width and height differ
from the real file, and there is no error: you only see it by looking at the
output. It caused three separate distortion bugs here. Always pass the real
intrinsic dimensions.

Build the URL with `URLSearchParams`, not template interpolation, or a title
containing an ampersand truncates the query string.

---

### 6.4 Structured data

Use JSON-LD in a `<script type="application/ld+json">`. Not microdata.

**Sitewide, in the root layout:**

- `Organization`: name, url, logo, `sameAs` for real social profiles, and
  `contactPoint` if you have a real one. Do not invent profiles; an unregistered
  handle in `sameAs` is a broken claim.
- `WebSite`, with `name` (and `alternateName` if the site has a short name):
  Google uses it for the site name shown in results. `SearchAction` no longer
  produces anything in Google (the sitelinks search box ended in November
  2024); harmless if present.

**Per page, one type that matches what the page is:**

| Page | Type |
| --- | --- |
| An article or a reference entry | `Article` |
| A list or index page | `CollectionPage` with an `ItemList` |
| A page with a real FAQ | `FAQPage`. Google stopped showing FAQ results on 7 May 2026, so this only describes the page now; never add one for the rich result |
| A calculator or tool | `WebApplication` with `offers` price 0 |
| A product | `Product` with `offers`, and real availability |
| Anything else | `WebPage` |

**Rules that matter more than the choice of type:**

- **Only mark up what is visible.** `FAQPage` markup with no visible question
  and answer is a manual-action risk. Assert this: parse the rendered page,
  check each JSON-LD question appears in the text.
- **Breadcrumbs: one `BreadcrumbList` per visible trail, built from the same
  list as the trail.** An accidental second one (a component and the page both
  emitting it) lets Google pick the trail you did not mean. Section 23 has the
  full rules.
- **`sameAs` on entities.** Linking a person or work to its Wikipedia or Wikidata
  entry ties your page to the right node in the knowledge graph, which is a real
  ranking signal for "\<name\> \<thing\>" queries.
- **Dates.** `datePublished` and `dateModified` on articles, and they must be
  true. See 6.6 on lying with dates.
- **Pass dates to the framework as strings.** A database returns a Date object.
  Handed straight to Next's `openGraph.publishedTime`, it rendered
  `article:published_time` as "[object Object]" on every article on three
  sites. The JSON-LD beside it was fine, because `JSON.stringify` converts a
  Date by itself, which is why nothing looked wrong. Convert with
  `toISOString()` in one helper, test the helper, and read the `article:` tags
  in view source once per template.

**If you sell anything, `Product` is not enough on its own.** Google's merchant
listing result wants the delivery and returns terms in the markup, and without
them the product is eligible for far less:

```js
offers: {
  '@type': 'Offer',
  price, priceCurrency,                    // must match the displayed price
  availability: 'https://schema.org/InStock',
  priceValidUntil,
  shippingDetails: {
    '@type': 'OfferShippingDetails',
    shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'GB' },
    deliveryTime: { '@type': 'ShippingDeliveryTime', /* handling + transit */ },
  },
  hasMerchantReturnPolicy: {
    '@type': 'MerchantReturnPolicy',
    applicableCountry: 'GB',
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: 30,
  },
}
```

**The price in the markup must be the price on the page.** On a multi-currency
site that means the structured data has to follow the same currency the visitor
is being shown, and `priceCurrency` has to follow with it. A markup price that
disagrees with the rendered one is a mismatch, and it is the single most common
reason a merchant listing gets pulled.

**Do not mark up reviews you do not have.** `aggregateRating` with invented or
self-supplied numbers is a manual action, not a ranking risk.

**Shipping and returns can be set once for the whole shop.** Search Console
(and Merchant Center) accept account-level shipping and return policies, as
does `Organization` markup (`hasShippingService`, `hasMerchantReturnPolicy`).
Where they disagree Google uses Search Console's. Setting them there is simpler
than repeating them on every `Offer`, and is the only honest option when
postage is quoted live at checkout (5.2).

Centralise the builders so a page cannot invent a shape:

```js
export function articleJsonLd({ headline, description, path, image,
  datePublished, dateModified, articleSection, keywords, sources }) { … }
export function collectionPageJsonLd({ name, description, path, items }) { … }
export function faqJsonLd(items, canonical) { … }
```

---

### 6.5 Headings, landmarks and semantic HTML

**One `h1` per page**, and it should say what the page is. No skipped levels:
an `h2` followed by an `h4` is a broken outline for anybody navigating by
heading, which is how most screen reader users navigate.

**Landmarks.** Exactly one `<main>`, and one `<header>`, `<nav>`, `<footer>`.
Give a second `<nav>` on the same page an `aria-label` so they can be told apart.

**Hoist `<main>` into the root layout.** If each page renders its own, the ones
that forget have no landmark and the skip link goes nowhere. This was wrong on
most of one site's archive, the whole journal, the store, the cart and the legal
pages, all at once, because it was every page's job and most pages forgot.

```jsx
<main id="main-content" tabIndex={-1} className="…">
  {children}
</main>
```

`tabIndex={-1}` is load-bearing. A bare `<main>` cannot hold focus, so after the
skip link the next Tab returns to the top of the nav: the reader lands looking at
the content but still tabbing through the menu they just skipped.

**Use the element that means it.** `<button>` for an action, `<a>` for a
destination, `<ol>` for an ordered list, `<time datetime>` for a date, `<table>`
for tabular data with real `<th scope>`. A `<div onClick>` is not a button: it is
not focusable, does not fire on Enter, and announces as nothing.

---

### 6.6 Sitemaps

**List only the pages you want to be judged on (S1).** Every URL answers 200,
is indexable and is its own canonical. A page you hide from Google comes out:
listing it keeps asking Google to look at what you decided it should not judge
you by. The exception is brief: if Google is actively crawling the site (crawl
stats show it) and you want it to re-read a newly hidden page soon, list it
until Search Console shows the tag seen. If crawling has stopped, listing does
nothing (section 8.5). Make the rule a condition in the builder, the same one
the page uses, so each page joins the sitemap the day it qualifies:

```js
// Only figures with writing of their own. The rest stay live and linked.
...slugs.filter((slug) => written.has(slug)).map((slug) =>
  entry(`${SITE_URL}/people/${slug}`, { lastModified: written.get(slug) }),
),
```

**Split into named sections.** One file listing every URL works, but Search
Console reports coverage **per sitemap**, so one file gives you one number and no
way to tell "the reference section is indexed and the blog is not" from "nothing
is indexed". Splitting changes nothing about ranking; it changes what you can
see, which is the point.

A sensible split: `core`, `reference`, `blog`, `products`, plus whatever large
generated section the site has.

**Drop empty sections from the index.** A child sitemap containing an empty
`<urlset>` is reported as an error and records zero discovered pages. This is
the trap: the section is only empty **in relation to a database**, so it is full
on every developer machine and empty on a fresh deployment. Filter the index by
what actually has entries.

**Tell the truth with `lastmod` (S2).** It is tempting to stamp `now` on
everything because the sitemap regenerates hourly. Do not: a site whose every
page claims to have changed an hour ago teaches the engines the field is
worthless, and they then ignore it for the pages where it **is** true.

```js
const now = new Date();
// The last site-wide content change, not a build date. Move it forward when a
// change of that size ships, and only then.
const CONTENT_REVISED = new Date('2026-10-05T00:00:00.000Z');

// Content that genuinely moves gets `now`; rows carry their own updatedAt;
// everything else gets CONTENT_REVISED. Never `?? now` as the default.
const stamp = (pages) => pages.map((p) => ({ ...p, lastModified: p.lastModified ?? CONTENT_REVISED }));
```

Three ways this went wrong here: a default of `?? now` stamped "today" on 1,865
pages of one site; 375 calendar pages carried `now` because they read today's
date (only to bound the valid years, so their content never changed); and a
fixed date left at launch day told Google nothing had changed since August when
every page's description had. A date after the engine's last visit is how it
learns there is something new to read, so it has to be true to be worth
anything. Test it: count the distinct dates per child sitemap.

**Every read falls back to an empty list rather than throwing.** A sitemap that
500s because one query failed is worse than one missing a section: engines treat
a broken sitemap as a signal about the whole site.

**Generate it from the data, not by hand.** A page cannot appear in the sitemap
without existing if the sitemap is built by mapping over the same source the
routes are.

---

### 6.7 robots.txt

```js
export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: ['/', '/api/og'], disallow: ['/api/'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
```

Disallow the API, but **allow the share-image endpoint** if you generate cards
from one, or crawlers cannot fetch the image they are told to use.

Pages that should not be indexed say so themselves, in their own metadata, not
in robots.txt:

```js
robots: { index: false, follow: false }
```

Use that for private areas, working documents and anything gated. `Disallow` in
robots.txt does not remove a page from the index; it only stops it being
crawled, and an uncrawled page can still rank on inbound links alone.

---

### 6.8 Internal linking

**Orphans are pages nothing links to.** They are indexable, they are in the
sitemap, and no crawler path reaches them. Enumerate them and fix them: an
orphan is either worth linking or worth deleting.

**Link hubs from their children, not only children from their hubs.** A common
and invisible failure: a section index has zero inbound content links because
every record links straight past it to a sibling leaf. The hub then looks
unimportant to a crawler despite being the page you want ranking.

**Anchor text carries meaning.** "Read more" tells an engine nothing. Name the
destination.

**Related links should be computed, not hand-maintained**, or they rot. Derive
them from real relationships in the data.

**Articles need links from the pages they explain, not only from the blog.** On
one site, no page outside the blog named a single article: every post was
reachable only through the blog index, so nothing told a crawler that the sleep
paralysis article belonged with the sleep paralysis page. On the other two, six
and four articles were in the same state. Put a short "further reading" block on
each reference page naming the two or three articles that explain it, keep the
page to article pairs in one data file, and test that every slug exists and that
every article is named somewhere. Blog posts link the other way too: a post
about a sign links to that sign's reference page, its ruling planet and the
famous charts for it, not only to other posts.

**Never send a followed link to a page that needs a login, or to internal
search results (L3).** A crawler and a signed-out reader both get the login
page, and a search results page can never be indexed; either way the crawl is
spent on nothing. Link the public page that describes the feature where you
can; where the button must stay (a "record this dream" button), give it
`rel="nofollow"`. Decide it once where links are made, so content written later
is covered:

```jsx
// In the shared Markdown renderer: links into the private area are nofollow.
const signInOnly = (href = '') => href.startsWith(`${JOURNAL_URL}/`);
function MarkdownLink({ href, title, children }) {
  return <a href={href} title={title} rel={signInOnly(href) ? 'nofollow' : undefined}>{children}</a>;
}
```

**Every link to a kind of thing goes through that kind's helper (U3).** A
template that builds `/blog?tag=${tag}` by hand keeps working after the address
moves, through a redirect, and nothing reports it. One `blogHref(page, tag)`,
one `recordPath(slug, category)`, used everywhere, and a test that the
hand-built pattern does not appear. The sweep (section 7) is what finds the
ones that slip through.

---

### 6.9 Images

- Use the framework's image component so sizes, formats and lazy loading are
  handled. In Next that is `next/image` with `remotePatterns` configured per
  host.
- **Always give real width and height** (or `fill` with a sized parent). Without
  them the page reflows as images load, which is a Cumulative Layout Shift hit.
- **`alt` describes the image, not the file.** If the image is decorative and the
  surrounding text already says what it is, use `alt=""` and `aria-hidden="true"`.
  Announcing a decorative image is worse than skipping it.
- Beware alt text that makes a claim the page does not. A picture captioned as
  a particular thing in `alt` asserts that thing.
- **Never lazy load the image at the top of an article.** The cover above the
  fold is usually the page's Largest Contentful Paint element, and
  `loading="lazy"` holds back the very paint it decides. Give it real width and
  height and `fetchPriority="high"`; keep lazy loading for images further down.
- **A generated image goes stale when its source changes.** Covers rendered from
  SVG carried their title as text. A pass that removed dashes edited the SVGs and
  never re-rendered the PNGs, which are the files the site serves, so one cover
  showed the old title, dash included, for two months. Re-render whenever the
  source changes, or compare the two files' dates in a check.
- **Redirects can shadow a public folder.** A rewrite or redirect on `/cards/:path*`
  will swallow `/cards/*.png` sitting in the public directory, 404-ing every
  image while every build stays green. If images vanish, check the redirects
  before the files.

---

### 6.10 ARIA

**The first rule is not to use it.** Native HTML carries the semantics already,
and a wrong ARIA attribute is worse than none because it overrides what the
browser would have said correctly.

Where it is genuinely needed:

- **An icon-only control needs a name.** A link containing only an SVG announces
  as "link" and nothing else. Give it `aria-label` and `title`, and mark the icon
  `aria-hidden="true"` so the name is not read twice.
- **A group of controls that share one label.** Prefer `<fieldset>` with
  `<legend>`. But note a real layout constraint: a rendered `<legend>` is not a
  grid item, so inside a CSS-grid fieldset it is lifted out of the grid and the
  remaining children are laid out instead. Where that breaks alignment, a `<div
  role="group" aria-label="…">` is the equivalent and behaves like an ordinary
  grid container.
- **`aria-describedby`** to tie a hint or an error to its input.
- **`role="alert"`** on a validation message so it is announced when it appears.
- **Focus must be visible.** Never remove the outline without replacing it with
  something at least as clear.
- **`prefers-reduced-motion`** honoured on every animation and smooth scroll.

**Colour contrast:** 4.5:1 for body text, 3:1 for large text and for
non-text UI. Decide the threshold once and record it, or every review reopens
the argument.

**A brand-coloured button needs a contrast-checked ink colour.** Raising the
accent's saturation once made white text unreadable on every filled button
across three sites. Use a token whose whole job is "readable on the brand
colour", not a literal white.

---

### 6.11 Duplicate and thin content

**Duplicates:** one URL per page, enforced by redirect (6.2). Watch for
pagination, filters and sort orders creating variants; canonical them to the
base page.

**Thin and near-duplicate pages are the bigger risk**, because generating them
feels productive. If a template can produce ten thousand pages from a data table,
it will, and most of them will say almost the same thing.

The test to apply before generating a page cluster: **does this page say
something the neighbouring page does not?** If a "darker purple" page and a
"purple" page differ only in the adjective, they are one page.

**Auto-generated combination pages are the classic case.** Two-item pairings from
a set of 78 give 3,003 pages. Publishing all of them is scaled content abuse
under Google's spam policies, and **the penalty lands on the domain, not on the
offending pages.** The defensible version:

- Compose any pair on demand so a visitor who lands on one gets something real.
- Mark them `noindex`.
- Promote to the sitemap only the ones with genuine authored content.

The line between "a useful long tail" and "a doorway farm" is exactly the amount
of human writing per page.

---

### 6.12 Content quality and E-E-A-T

For anything health, money or safety adjacent, this outranks every technical item
above. Sleep, mental health, medical, legal and financial content is judged on
who wrote it and what it rests on.

- **Name the source.** A claim from a study cites the study. A claim from
  tradition says it is tradition. Do not flatten the two into one confident
  voice: that is exactly what a generated page does, and it is what the reader
  cannot tell apart without help.
- **Label the kind of claim** per section, not per page: research, theory,
  tradition, folklore. A sleep-laboratory finding and a piece of Victorian lore
  can both be on the page and must not read as the same thing.
- **Say what you do not know.** A page that admits the research is thin is more
  trustworthy than one that fills the gap, and it is the one thing a generated
  competitor will never do.
- **Articles that report research end with their sources.** Draw them from the
  same verified source list the rest of the site cites, give each one a line
  saying what it is cited for, and test that every cited title is in that list.
  An invented reference is worse than none, and a test is the only thing that
  stops one arriving in an article written months later.
- **Dates and provenance.** Who wrote it, against what, and when it last changed.
- **A byline names real people, and a review line names a real review.** These
  sites ran for months with every article bylined "Admin" and no author shown.
  The fix: a team section on the about page with a short bio per person, each
  with its own anchor and `Person` markup; "By the team" under every article,
  linked to it; and "Reviewed by" only on articles that person has actually
  read, with the date, from a list a test checks. Never credit someone with an
  article they did not write, and never add experience to a bio that the person
  did not give: both are false statements about a real person.
- **An editorial policy page** stating how content is written, which sources are
  used, and what the site will not claim.
- **A disclaimer where it belongs**, between the content and the sources, not
  buried in a footer.

---

### 6.13 Core Web Vitals

**Measure the page, not the component.** The useful diagnostic is a table of
every page type against its score, because the pattern is almost always one
heavy thing on some pages:

| Page | Heavy chunk | Whole-page JS | Lighthouse |
| --- | --- | --- | --- |
| A page with the 3D panel | 9,539 ms | 10.6 s | 48 |
| A page mounting it twice | 13,274 ms | 14.0 s | 53 |
| Any page without it | none | 1.4 to 3.4 s | 94 to 97 |

That table is worth more than any general advice: everything under 85 mounted
one component, and nothing else correlated.

Specific traps found here:

- **A dynamic import does not defer a component that mounts immediately.**
  `dynamic(() => …, { ssr: false })` fires when the component mounts, and it
  mounts as soon as the page renders. Every visitor pays for it whether or not
  they look at it.
- **Container query units in an inherited custom property.** A `100cqw` value
  inherited down a tree cost about 6.5 seconds on one page. Using `100vw`
  fixed it. Also note that a page which is **bimodal** (sometimes fast, sometimes
  slow) makes single measurements lie: interleave runs of the old and new code.
- **Ad slots that reserve no space** shift the layout when they resolve. Reserve
  the height before the ad loads or accept a CLS penalty on every page carrying
  one.
- **Fonts:** self-host (`next/font`) rather than a third-party stylesheet, and
  always declare a real fallback stack.

---

### 6.14 Copy rules

Whatever the house style is, **enforce it on the rendered page**, not the source.
Content arrives from a database, a generator and a CMS as well as from files, and
a rule checked only in the repository misses three of those four.

The rule here is no em or en dashes in site text, which is a voice decision
rather than an SEO one. Roughly seven thousand were removed in one pass. It
re-arms with every new generator, so the assertion runs against rendered HTML.

---

### 6.15 An automated content audit

This is the piece that makes everything above stick. Crawl the built site and
check the rendered HTML. Ours runs as `npm run check:content` and reports:

1. **Dashes**, house style, on rendered output.
2. **Near-duplicate pages**: similarity over a threshold, flagged as pairs.
3. **Meta uniqueness**: missing or duplicated titles and descriptions.
4. **Unresolved internal links**: every `href` resolves to a real route.
5. **Orphans**: indexable pages nothing links to.
6. **FAQ markup with no visible question or answer.**
7. **Breadcrumbs**: data only where a trail is visible, the same names in the
   same order, no accidental second list, no `#` in any `item` (6.23).
8. **Raw palette colours**: hard-coded hex that will not follow the theme.

**Run it against the built output, not the dev server.** A stale build produces
site-wide phantom findings. Two real gotchas: it needs the production build
manifest to exist, and a bundler that caches broken routes will serve a stale
page long after the source is fixed. If a finding makes no sense, delete the
build directory before debugging the page.

---

### 6.16 Tests that hold the line

An audit tells you the state today. Tests stop the next page breaking the rules.
Assert on the **shape** of the source so the rules apply to pages nobody has
written yet:

- Every page exporting `openGraph` also has `images` or spreads the default.
- Every page has a canonical.
- Titles are within the limit; descriptions are within the limit.
- No page emits a `BreadcrumbList` it does not show, or a second one by
  accident.
- Every section name used in a breadcrumb comes from one map, so an address
  cannot be named two ways (6.23).
- Every route in the sitemap builder comes from the same source as the routes.
- Rendered text carries no forbidden characters.

Guards added after real failures, worth copying as they are:

| Test | Holds | Rule |
| --- | --- | --- |
| Each tool's whole import tree has no `useSearchParams(`, and no tool page wraps its tool in `Suspense` | The forms stay in the server HTML | R2, R3 |
| The sitemap builder, run on fixture data, leaves out a page without its own content and dates the rest by their `updatedAt` | The sitemap lists only pages to be judged on | S1, S2 |
| The core sitemap, built for real, gives a fixed-content page a date that is not today, and a daily page today | `lastmod` stays true | S2 |
| The analytics location helper keeps the five `utm_` tags in a fixed order and drops every other parameter; the snippet uses it | Campaigns reach analytics; nothing private does | X3 |
| A Markdown link into the private area renders `rel="nofollow"`, a public one does not | No crawl spent on login pages | L3 |
| No template builds a listing address by hand (`?tag=${`) | Links stay off redirects | U3 |

Each was checked the way this section asks: put the old code back, see the
test fail, restore the fix.

**Mutation-test every one of them.** Break the thing on purpose, confirm the test
fails, put it back. Writing sixteen such mutations against a security suite here
found **seven assertions that were inert** and had been green since the day they
were written. Two lessons transfer directly:

- A regex that silently matches nothing looks identical to a regex that finds
  nothing wrong.
- File-level checks are usually too coarse. A file often exports several
  handlers or several pages, and a rule broken in one leaves the others'
  correct code satisfying the assertion.

---

### 6.17 The document shell

Small, set once, and invisible when wrong.

- **`<html lang>`.** Required for screen readers to pick a voice and for
  translation. Use the specific tag if the spelling matters: `en-GB` and
  `en-US` differ in every "colour" on the page.
- **Viewport.** `width=device-width, initial-scale=1`. Never
  `user-scalable=no` or `maximum-scale=1`: it removes pinch zoom for everybody
  and fails WCAG 1.4.4.
- **`themeColor`.** Give it two entries keyed to `prefers-color-scheme`, so the
  browser chrome follows the page instead of sitting black behind a light
  document. A meta tag cannot read a stored theme preference, so it keys off the
  OS setting: that is the one place the two can disagree, and the cost is a strip
  of address bar.
- **Icons.** An `icon.svg` and an `apple-icon.png`. In Next, files at those
  names in the app directory are wired up automatically.
- **A web app manifest** with name, short name, start URL, display, theme and
  background colours, and icons including a `maskable` purpose. Point it at a
  real logo: the manifest icon and the JSON-LD `Organization.logo` are what a
  search engine may show beside the site, and they drift from the favicon
  without anybody noticing.

### 6.18 Rendering and crawlability

**The question for every page: what does a reader that runs no JavaScript get,
in order?** AI crawlers and link previews run none; Bing runs it unreliably;
Google runs it later. The server's HTML is the page for most of them (R1).

A piece of content can reach that HTML in three ways, and only the first is
safe:

| What the HTML holds | What causes it | Who sees the content |
| --- | --- | --- |
| **In place**, where it is on screen | A server component, or a client component that renders the same markup on the server | Everyone |
| **After the footer**, in `<div hidden id="S:0">`, with `<template id="B:0">` where it belongs, moved into place by an inline script | A `Suspense` boundary whose content was sent separately: it suspended, or it was large enough for React to send it on its own | Google and any reader that runs the script; a reader that takes the HTML in order, or skips hidden elements, meets an empty slot |
| **Not at all** | A client-side rendering bail-out: `useSearchParams` in a statically rendered route (everything up to the nearest `Suspense` renders in the browser only); `dynamic(..., { ssr: false })`; a component that returns `null` until mounted; content built in an effect | Only a reader that runs JavaScript |

On one site in October 2026 the birth chart and death chart tools were in the
third row (they called `useSearchParams` to restore a saved chart), and the map
and wedding tools in the second (a `Suspense` added "because the tool reads the
URL", which it did not). Every test passed and every page looked right in a
browser.

**The rules that follow from it:**

- **Read the address without `useSearchParams` when only behaviour depends on
  it.** Restoring a saved item from `?id=` or a shared one from `?date=` can
  happen after mount:

  ```js
  // Read once after mount, so the form itself prerenders.
  const [searchParams, setSearchParams] = useState(null);
  useEffect(() => {
    setSearchParams(new URLSearchParams(window.location.search));
  }, []);
  const chartId = searchParams?.get('id') || null;
  ```

  If the *content* depends on the parameters, read the page's `searchParams`
  prop on the server instead, which makes the route dynamic, or give each state
  its own path that can be prerendered.
- **No `Suspense` round indexable content unless something in it really
  suspends, and never `fallback={null}`.** When a boundary is genuinely needed
  (a widget reading `localStorage`, a payment frame), its fallback renders the
  same server markup the content will have, the empty form with its labels, so
  the HTML is right either way. A duplicate of a whole list as the fallback is
  the opposite mistake: the page then holds it twice.
- **`ssr: false` only for things with no text a reader needs**: a 3D panel, a
  canvas chart whose numbers are also in a table on the page.
- **Guard it with a test that walks each tool's imports** for
  `useSearchParams(` and fails on a `Suspense` round the tool in its page
  (Memento's `toolPagesServerRender.test.js`), and **check the live HTML on
  every deploy** (`toolforms.py`, section 7).

**How to check, and the trap in checking.** `curl` the page with a crawler's
user agent and look between `<main>` and `<footer>`. When counting headings,
skip `div hidden id="S:*"` or you will count streamed content twice; when
asking "is this content present at all", search the whole response, hidden
blocks included, or you will report content missing that is only misplaced.
Both mistakes were made here (5.1, trap 2).

The same reasoning applies to anything that renders only after an effect,
`IntersectionObserver` content, and infinite scroll with no paged URLs under
it: if it is not in the server HTML, it is not on the page for most readers.

### 6.19 Pagination, filters and search

Any state reachable by a URL parameter needs a decision, and the wrong one is
not to make it. Google's guidance, checked 12 November 2026, and what it means
in practice:

**Pagination: each page of a list is its own canonical.** Google: "Don't use
the first page of a paginated sequence as the canonical page. Instead, give
each page its own canonical URL."

```js
// /blog/browse?page=3 names itself, so the articles it lists stay reachable.
alternates: { canonical: blogHref(page, tag) }
```

Pointing every page at page 1 tells the engine pages 2 onward do not exist, and
the items only linked from them go with them. `rel="next"` and `rel="prev"` are
not used by Google and are not worth adding.

**Topic and tag pages: indexable only with writing of their own (C10).** A
topic page that is the blog's title plus a list of one or two articles is a
near copy of those articles. Give each a title of its own, and keep it
`noindex, follow` unless it has an introduction and content beyond the list.
Memento's blogs measured every topic and page URL together at zero clicks, and
keep them all `noindex, follow` on a separate route, with every article in the
sitemap and linked from the pages it explains, so nothing depends on a
noindexed list to be found. That matters: a page left `noindex` for long may
eventually stop having its links followed.

**One signal per page.** A `noindex` *or* a canonical pointing elsewhere, not
both. Google does not recommend `noindex` as a way to steer canonical choice,
and has called the pair contradictory, generally following the canonical.

**Filters and sorts: keep the combinations out of the crawl.** Google's
faceted navigation guidance, for URLs you do not need indexed: block them in
robots.txt, or put the state in a URL fragment (`#`), which crawlers ignore.
It calls canonicals and `nofollow` "generally less effective in the long term"
for this. For the few filter pages you do want indexed: one parameter order,
`&` separators, and a real 404 for empty or nonsensical combinations. On a
small site a `noindex, follow` filter view does no harm; on a large catalogue
the number of combinations is what eats the crawl.

**Search results: `noindex, follow`, and no followed links into them (L3).**
Generated on demand, different for every query, never worth indexing. Linking
them from content pages spends the crawl on them: Googlebot spent its few
visits to one site in November 2026 on search pages that 1,640 dream pages
linked to.

**The sitelinks search box is gone.** Google stopped showing it on 21 November
2024. `SearchAction` markup does no harm and needs no removing, but adds
nothing in Google; Bing does not document using it.

### 6.20 404s and redirects

**A missing page must return HTTP 404**, not 200 with an apology on it. A "soft
404" gets indexed and dilutes the site. In Next, `notFound()` from a page and a
`not-found.js` file do this correctly; hand-rolling a "not found" component
inside a normal page does not.

**Make the 404 useful.** Links to the main sections, and the site search if there
is one. It is a real landing page: people arrive there from old links.

**Every URL you retire gets a permanent redirect.** When a section is renamed,
carry the children across with a wildcard rather than redirecting the index and
orphaning everything under it:

```js
{ source: '/charts', destination: '/celebrity-charts', permanent: true },
// :path* carries the 182 individual figures across too.
{ source: '/charts/:path*', destination: '/celebrity-charts/:path*', permanent: true },
```

`permanent: true` is a 308 (or 301). A temporary redirect (302, 307) tells
search engines the old address is still the one to keep, so use it only for a
move that really is temporary.

**Pick one host and one trailing-slash convention** and redirect the other, or
every page has two addresses. Decide www or bare, http or https, and be
consistent in `SITE_URL`, the sitemap, canonicals and the manifest.

One warning specific to Next: **`trailingSlash: true` breaks catch-all API
routes.** It makes Next 308 an API call to a trailing-slash path that the auth
router cannot match, which reads as a 404 on sign-in and is a horrible thing to
debug. Leave it off.

### 6.21 Analytics and consent

- **Load the tag after consent, not before.** In the EU and UK, analytics
  cookies need consent first. Use Consent Mode with `analytics_storage` denied
  by default and granted on acceptance.
- **The consent banner must not shift the layout.** A banner that appears after
  first paint and pushes content down is a Cumulative Layout Shift hit on every
  page. Overlay it, or reserve its space.
- **Nothing in the measurement should block rendering.**
- **Check what the tag sends.** A URL containing a token, an email, an order
  reference or a quiz answer ends up in a third party's logs. Report the path
  and drop the query string by default, so a parameter added later is safe
  without anybody remembering.
- **But let the campaign tags through (X3).** GA4 reads `utm_source`,
  `utm_medium` and `utm_campaign` from the page address. Drop them with the
  rest and every tagged link (social posts, emails, ChatGPT's own
  `utm_source=chatgpt.com`) arrives as "direct". An allow list, tested both
  ways:

  ```js
  export const CAMPAIGN_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

  export function analyticsPageLocation(href) {
    const url = new URL(href);
    const kept = new URLSearchParams();
    for (const name of CAMPAIGN_PARAMS) {
      const value = url.searchParams.get(name);
      if (value) kept.set(name, value);
    }
    const query = kept.toString();
    return `${url.origin}${url.pathname}${query ? `?${query}` : ''}`;
  }

  // gtag('config', ID, { page_location: analyticsPageLocation(location.href) })
  ```
- **Tag every link you control (X4)** and check one in the analytics Realtime
  view after each deploy that touches analytics.

### 6.22 Client-rendered sites (React on Vite, and similar)

Everything above assumes the server sends finished HTML, as Next.js does. Many
sites do not: a React app built with Vite (or Create React App) sends the same
`index.html` for every URL, with an empty `<div id="root">` and the home page's
title and description, then JavaScript builds the page and swaps the head tags
in the browser (`react-head`, `react-helmet`).

**Who sees what.**

| Reader | Runs the JavaScript? | What it sees on a client-rendered site |
| --- | --- | --- |
| Google | Yes, in a second, slower wave | The real page, eventually |
| Bing | Sometimes, unreliably | Often the empty shell |
| Facebook, LinkedIn, WhatsApp, Slack, X previews | No | The home page's title, description and image for every URL |
| AI crawlers (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot) | Generally no | An empty page |

**How to tell in ten seconds:**
`curl -s https://example.com/some-page | grep -o '<title>[^<]*'`. If every page
returns the same title and the body is one empty `<div>`, the site is
client-rendered.

**The fix: pre-render every URL at build time.** The build renders each page
once and saves it as its own file, `dist/<route>/index.html`. A static host
serves it directly (Apache's `DirectoryIndex` maps `/about` to
`dist/about/index.html` with no rewrite rule), the crawler gets finished HTML
with that page's own head tags, and React takes over in the browser. No server
is needed, so cPanel or any static host keeps working.

**Option A, recommended when you are reworking the site anyway: React Router 7
framework mode.** Turn server rendering off and list the URLs to pre-render.
React renders each one to HTML inside the build, with no browser involved.

- Generate the URL list from the route table plus every data-driven page (blog
  posts and portfolio items held in arrays), so a new post is pre-rendered and
  added to the sitemap automatically.
- Give each route a `meta` export for its title, description and canonical.
  That replaces `react-head` and removes the duplicate-title class of bug,
  because one function owns each page's head.
- Use `hydrateRoot`, not `createRoot`, so React adopts the pre-rendered HTML
  instead of replacing it, and keep render output deterministic (no
  `Date.now()` or random values during render) so hydration matches.
- Effort: a few days, mostly restructuring how routes are declared; the
  components stay as they are.

**Option B, quickest: a post-build headless prerender script.** This is what
the Princess Rose site does (`client/scripts/prerender.mjs`, run from
`postbuild`):

1. `vite build` produces the normal SPA.
2. A critical-CSS step inlines above-the-fold styles into `dist/index.html`
   first. Order matters: pre-render after it, so every generated page inherits
   the inlined styles.
3. The script starts `vite preview`, opens each public route in headless
   Chromium (Playwright), waits for the main landmark, and saves the rendered
   HTML to `dist/<route>/index.html`.
4. It visits a deliberately unrouted path to capture the real 404 page as
   `dist/404.html`, which Apache serves through `ErrorDocument` with a real 404
   status instead of a 200 shell (a soft 404).
5. A sitemap script runs last, from the same route list.

It needs almost no change to the app, about a day of work. The costs: a browser
at build time, slower builds, a fallback for pages whose lazy media keeps the
network busy (wait for `load` if `networkidle` times out), and **it captures
whatever the head tags already say, bugs included**.

**Option C: move to Next.js.** Server rendering or static generation built in,
as on the Memento sites. The best long-term setup and the biggest job; more
than a site of a few dozen pages needs.

**Not enough on its own: injecting meta tags per route on a server.** It fixes
link previews but the body is still empty to every crawler that does not run
JavaScript.

**Fix these before pre-rendering, or the build will freeze them into every
page.** All found on the ByteToast site on 4 October 2026:

- **Two `<title>` tags.** A static `<title>` in `index.html` without the
  `data-default` marker the head library removes, plus the page's own title.
- **Fallback tags deleted on load.** The static defaults are removed when the
  app starts, so a crawler without JavaScript sees only the generic defaults,
  and one with JavaScript sees them disappear.
- **Canonicals pointing at a route that does not exist** (`/portfolio/<slug>`
  when the real route is `/portfolio/item/<slug>`). Google treats a canonical to
  a dead URL as a reason to distrust the page.
- **The description read from the wrong field.** Blog posts used `subject`, a
  category label like "Offer", as the meta description. Use a real
  `description` field of 120 to 156 characters (6.1).
- **Structured data built from fields that do not exist.** `datePublished`
  fell back to the moment of rendering, so every post claimed to be published
  today; the author fell back to the company; `og:image` pointed at a file that
  was not there.
- **A sitemap from a hand-written list.** Only the fixed pages, none of the
  blog posts or portfolio items, plus a route that no longer existed.
- **Imports that differ only in capital letters** (`Constants.js` against
  `constants.js`). They work on Windows and fail on a Linux build server.
- **Declared image sizes that do not match the files** (6.9).

**Done means:** for every public URL, `curl` returns its own title,
description, canonical, `h1` and body text; the sitemap lists every
data-driven page; an unknown URL returns a 404 status with the real 404 page;
and the `.htaccess` sends only real routes to `index.html`.

---

### 6.23 Breadcrumbs

Researched 8 October 2026 from Google's and Bing's own documentation,
schema.org, the W3C's accessibility guidance and Nielsen Norman Group's
usability research. The sources are listed at the end of this section. Where
they disagree, the rule says so.

A breadcrumb is two things built from one list: the trail a visitor sees at the
top of the page (`Dream meanings / Actions / Dreaming about falling`), and a
`BreadcrumbList` in the structured data that tells search engines the same
thing.

#### What it gets you, and what it does not

| Where | Effect |
| --- | --- |
| Google, desktop | The trail replaces the address under your result: `example.com › Dream meanings › Actions` instead of `example.com › dream-meanings › falling` |
| Google, mobile | **Nothing, since 23 January 2025.** Mobile results show the domain only, because the trail "gets cut off on smaller screens". Google says markup needs no change |
| Internal links | The visible trail's links are crawled and "treated as normal links" (Google's Mueller and Illyes). This is the larger benefit: every page links up to its section, so each hub is linked from all its children (6.8) |
| Ranking | None directly. Google has never called the markup a ranking factor |
| AI answers | None. Google: "there's no special schema.org markup you need to add" for its AI features |
| Bing | Supports the markup and reads JSON-LD, but does not document how it displays it. Its results were showing a path built from the URL when checked |

Without the markup Google builds a path from the words in the URL anyway. So
the markup's job is to put your words in the result instead of your slugs, and
the visible trail's job is the links and the visitor.

Breadcrumbs have survived every round of Google retiring rich results,
including FAQ results, which were removed completely on 7 May 2026.

#### The rules

1. **Every page below a section index has a trail. The home page never does.**
   A trail needs at least two items to count (Google), and the home page has
   nothing above it. On a flat site, one or two levels deep, breadcrumbs add
   little and can be left out (NN/g).

2. **Home is optional. Decide once, and do the same on every page.** Google:
   "It is not required to include a breadcrumb ListItem for the top level path
   (your site's domain or host name), nor for the page itself." NN/g recommends
   starting with Home, and also says a Home link in both the header and the trail
   duplicates it: "one or the other is fine."
   - **With Home** (`Home / Blog / Post`): the pattern most visitors expect, and
     one-level pages (`/blog`, `/about`) can carry a trail too.
   - **Without Home** (`Blog / Post`): shorter trails, and no second home link
     next to the logo. A section index then has a trail of one, which is below
     Google's minimum, so it carries none.

   On a new site with no reason to choose, include Home. The Memento sites leave
   it out (decided 16 August 2026, because the logo links home on every page).

3. **The last crumb is the current page, as plain text with
   `aria-current="page"`.** NN/g and the W3C's WCAG test both say it should not
   be a link: a link to where you already are is a dead control that a keyboard
   user still has to tab past. The W3C's ARIA example does link it. Both pass,
   and plain text is the better of the two. In the data, the last item may leave
   out its URL (Google then uses the page's own address); including it is also
   correct.

4. **Every crumb above the current page links to a real, indexable page.** It
   answers 200 at that exact address (no redirect), it is not `noindex`, and its
   URL has no `#fragment`. To a search engine a fragment is the same page, so
   `Lucid dreaming (/lucid-dreaming) > Techniques (/lucid-dreaming#techniques)`
   names one page twice. If a grouping has no page of its own, leave it out of
   the trail and show it on the page instead, as a label above the heading. The
   simple test: every crumb above the current page is a URL in the sitemap.

5. **Follow the site's structure, with one fixed path per page.** Not the
   visitor's history, and not necessarily the URL. Google recommends
   "breadcrumbs that represent a typical user path to a page, instead of
   mirroring the URL structure", and does not read site structure from URLs at
   all. A page that belongs in two sections still gets one trail. NN/g: pick the
   canonical path, and "don't attempt to personalize the breadcrumb trail."

6. **Name each crumb the way its page names itself, and the same way
   everywhere.** Use the section's own heading or menu label, kept short and in
   the site's normal capitalisation. One address, one name: these are the words
   the result shows, and a section called "The Nocturnal Bestiary" on one page
   and "Dream Creatures" on the next reads as two places. The current page's
   crumb is its `h1`, or a short form of it. Keep section names in one place in
   the code, and test that no address appears under two names. (This rule is
   ours rather than a source's. It comes from finding a section named two or
   three ways on each Memento site, and 349 dream entries named one way on their
   own page and another on their children's.)

7. **Build both halves from one list.** Google: "Don't mark up content that is
   not visible to readers of the page." Bing: "Markup must accurately reflect
   visible content." Data with no visible trail breaks the guideline. The
   penalty is losing the rich result rather than ranking, but this drift happens
   on its own whenever the two halves are written separately. Here it reached 47
   pages before one component replaced them (August 2026).

8. **One `BreadcrumbList` for each trail the page shows. For almost every site
   that is one.** Google allows several when a page really is reached by several
   paths and the page shows all of them. NN/g advises against showing more than
   one ("they will confuse users"). The real fault is an accidental second
   list, usually a component and the page both emitting one. Google treats the
   two as alternative paths and picks whichever suits the query, so the trail in
   the result may not be the one you meant. *Until 8 October 2026 this playbook
   said "two is worse than none". No source supports that, and it is
   corrected here.*

9. **The data: two or more items, numbered from 1, with absolute URLs, as
   JSON-LD in the server-rendered HTML.** Each item is a `ListItem` with
   `position`, `name` and `item`, in an `itemListElement` list. Use the
   canonical absolute address in `item`. Every one of Google's examples does,
   and validators report relative ones. Google accepts JSON-LD, microdata and
   RDFa, and recommends JSON-LD.

   ```json
   {
     "@context": "https://schema.org",
     "@type": "BreadcrumbList",
     "itemListElement": [
       { "@type": "ListItem", "position": 1, "name": "Dream meanings", "item": "https://www.example.com/dream-meanings" },
       { "@type": "ListItem", "position": 2, "name": "Actions", "item": "https://www.example.com/dream-meanings/category/actions" },
       { "@type": "ListItem", "position": 3, "name": "Dreaming about falling", "item": "https://www.example.com/dream-meanings/falling" }
     ]
   }
   ```

10. **The visible markup: a labelled `nav`, an ordered list, and silent
    separators.**

    ```html
    <nav aria-label="Breadcrumb">
      <ol>
        <li><a href="/dream-meanings">Dream meanings</a></li>
        <li><span aria-hidden="true">/</span> <a href="/dream-meanings/category/actions">Actions</a></li>
        <li><span aria-hidden="true">/</span> <span aria-current="page">Dreaming about falling</span></li>
      </ol>
    </nav>
    ```

    The label is "Breadcrumb", not "Breadcrumb navigation", because a screen
    reader already announces the word "navigation". Separators are drawn in CSS
    or marked `aria-hidden`, so nobody hears "slash" between every step. If the
    page has another `nav`, give each a different label.

11. **Put it in the same place on every page: under the header, above the
    `h1`.** Placement makes no difference to search ("the placement doesn't
    matter for SEO", Mueller). It matters because visitors look for it in one
    place.

12. **Keep it to one line on a phone where you can, and never hide a crumb.**
    NN/g: a trail that wraps is harder to read and to tap. Let the current
    page's name give way first, shortening to an ellipsis, since the `h1` just
    below says it in full; in CSS, give its list item `flex: 1` with a small
    minimum width (8 characters) and `text-overflow: ellipsis` on its text. Do
    not hide crumbs on small screens: Google reads pages at phone width, so a
    crumb hidden there is data describing something invisible. If the links
    above the page are too long for one line on their own, let them wrap.

13. **None on error pages, and no need on `noindex` ones.** Data on a
    `noindex` page earns nothing, but it does no harm either. A shared header
    that also renders on a noindexed filter view needs no special case.

14. **Check it three ways, then automate it.** Before launch: Google's Rich
    Results Test on one page per template (is it eligible?), and the Schema
    Markup Validator (is it valid schema.org?). After launch: the Breadcrumbs
    report in Search Console, which covers the whole site. In the content audit
    (6.15) and the tests (6.16), assert that:
    - a page carries a `BreadcrumbList` only if it shows a visible trail, and
      the visible names equal the data names, in the same order;
    - no page has a second list by accident;
    - every `item` is absolute, on the canonical host, with no `#`;
    - every crumb above the current page is a URL in the sitemap;
    - no address appears under two names anywhere on the site;
    - every page below a section index has a trail.

#### The shape of the component

One component takes one list and emits both halves, so they cannot disagree:

```jsx
export default function Breadcrumbs({ items = [] }) {
  const trail = items.filter((c) => c && c.name);
  if (trail.length < 2) return null; // Google's minimum

  const absolute = (href) => (/^https?:\/\//.test(href) ? href : `${SITE_URL}${href}`);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((c, i) => ({
      '@type': 'ListItem', position: i + 1, name: c.name, item: absolute(c.href),
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Breadcrumb">
        <ol>
          {trail.map((c, i) => (
            <li key={c.href}>
              {i > 0 && <span aria-hidden="true">/</span>}
              {i === trail.length - 1
                ? <span aria-current="page">{c.name}</span>
                : <Link href={c.href}>{c.name}</Link>}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
```

Pages pass the section and themselves, with section names taken from one map
rather than typed out on each page:

```jsx
<Breadcrumbs items={[SECTIONS.dreamMeanings, { name: entry.title, href: entryPath(entry.slug) }]} />
```

The Memento version is `src/components/ui/Breadcrumbs.jsx`, identical on all
three sites. `python scripts/seo/breadcrumbs.py` audits a live site against
every rule above (6.7).

#### What went wrong here, so you can skip it

- **Hand-written trails and data drifted apart.** Ten pages showed a trail with
  no data, and 37 had data with no visible trail. Each was correct the day it
  was written. One component that builds both from one list fixed it for good.
- **Fragment crumbs.** Somnia's lessons had a middle crumb such as
  `Induction techniques` pointing at `/lucid-dreaming#track-techniques`,
  because the lesson groupings deliberately have no pages of their own (14 thin
  pages were judged worse). That was the right call for the pages and the wrong
  one for the trail: the grouping belongs on the page as a label, not in the
  trail.
- **One address, two names.** `/dream-creatures` was "The Nocturnal Bestiary"
  in some trails and "Dream Creatures" in others, and Astra's celebrity section
  was "Celebrity Charts" in one template and "Celebrity charts" in the next.
  Each page was written on its own, from its own idea of the section's name.
- **A rule nobody checked.** "Two lists are worse than none" sat in this
  playbook for two months as fact. It sounded plausible, and Google's own page
  says the opposite.

#### Sources

| Source | Address |
| --- | --- |
| Google, Breadcrumb structured data (updated 8 Sep 2026) | <https://developers.google.com/search/docs/appearance/structured-data/breadcrumb> |
| Google, General structured data guidelines | <https://developers.google.com/search/docs/appearance/structured-data/sd-policies> |
| Google, breadcrumbs removed from mobile results (23 Jan 2025) | <https://developers.google.com/search/blog/2025/01/simplifying-breadcrumbs> |
| Google, ecommerce site structure | <https://developers.google.com/search/docs/specialty/ecommerce/help-google-understand-your-ecommerce-site-structure> |
| Google, AI features and your website | <https://developers.google.com/search/docs/fundamentals/ai-optimization-guide> |
| schema.org, BreadcrumbList | <https://schema.org/BreadcrumbList> |
| Bing, structured data | <https://www.bing.com/webmasters/help/marking-up-your-site-with-structured-data-3a93e731> |
| Bing Webmaster Guidelines | <https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a> |
| W3C, ARIA breadcrumb pattern and example | <https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/> |
| W3C, WCAG technique G65 | <https://www.w3.org/WAI/WCAG22/Techniques/general/G65> |
| Nielsen Norman Group, Breadcrumbs: 11 design guidelines | <https://www.nngroup.com/articles/breadcrumbs/> |
| John Mueller (Google) on placement, via Search Engine Roundtable, 2021 | <https://www.seroundtable.com/google-breadcrumb-placement-seo-31308.html> |

Not settled by any primary source: how Bing displays a trail, whether Google
accepts relative URLs in `item`, and what to do on paginated or filtered views
(ours: the same trail as the unfiltered page, and no special case).

---

### 6.24 The order to do this in, on a site that has none of it

0. **View source on three pages and read what is actually there.** If the
   content is not in the HTML, nothing below this line matters, and every audit
   you run afterwards will measure the wrong document. Section 18. If the
   body is one empty `<div>` (a site that renders in the browser), pre-render
   it first: 6.22.
1. **Set `metadataBase`, and a default OG object.** Then fix every page that
   declares `openGraph` without `images`. This alone usually recovers more than
   everything else combined.
2. **Give every page a unique title, description and canonical**, including each
   page of a paginated list.
3. **Add Organization and WebSite JSON-LD sitewide**, then the right per-page
   type and a breadcrumb trail (6.23) for your three or four biggest
   templates.
4. **Fix the heading outline and the landmarks.** One `h1`, one `main`, a skip
   link that works.
5. **Build the sitemap from the data**, split it, and drop empty sections.
6. **Write robots.txt**, allowing the share-image endpoint.
7. **Check the 404 returns 404**, and that every URL the site has ever retired
   has a permanent redirect, children included.
8. **Find the orphans** and either link or delete them.
9. **Fix the shell**: `lang`, viewport, theme colour, icons, manifest. Half an
   hour, once.
10. **Run a Lighthouse pass per page type** and look for the one heavy component.
11. **Set up the other engines and the measuring**: Search Console and Bing
    with every sitemap submitted, IndexNow with a first full send, the six
    crawlers answering 200 (A3), analytics keeping the `utm_` tags (X3), and a
    scheduled weekly pull with an alert (O3).
12. **Then** the audit script, and **then** the tests.

Steps 0 to 2 are most of the value. Everything after step 6 is protecting it,
and step 11 is how you find out whether any of it worked.

---

## 7. Tools and scripts

Everything here runs without paid tools: Node or Python, standard library
only. The reference versions are in `Memento/scripts/seo/`; copy and adapt the
site list and property ids. Keys live outside every repository.

### 7.1 Access

- **Google.** A Google Cloud service account with the Search Console API and
  the Analytics Data API enabled. Add it to each Search Console property (it
  needs only read access; the scripts ask for the two read-only scopes) and as
  Viewer on each GA4 property. Keep the JSON key outside every repository
  (`~/.secrets/`). Node's own `crypto` signs the token, so no Google library is
  needed (`google.mjs`).
- **Bing.** Webmaster Tools, Settings, API access. One key for every site on
  the account, not read-only: call only `Get` methods (`bing.mjs`). Bing
  registers sites by their apex address (`https://example.com/`).
- **The screens the APIs cannot reach** (Page indexing, crawl stats, Manual
  actions, Request indexing, Bing's AI performance): by hand, or with a
  browser-driving assistant (Claude in Chrome) working in the owner's signed-in
  browser.
- **Usage counts** (accounts, orders, sign-ups): a read-only, counts-only admin
  endpoint behind its own token (`stats.mjs`). Never rows, never names.

### 7.2 The regular reading

| Script | Does | When |
| --- | --- | --- |
| `pull.mjs` | Search Console since launch by date, query, page, country, device, page by date, page and query, plus sitemap status; GA4 totals, channels, sources, campaigns, landing pages, pages, countries, devices, events, sessions by date and source; Bing traffic, top queries and pages, crawl stats, links. Raw JSON in a dated folder | Weekly (summary) and every review |
| `stats.mjs` | The usage counts | Every review |
| `weekly.mjs` | The scheduled check (O3): Google (finalised days only) and Bing impressions and clicks, analytics visits and AI visits, this week against last; sitemap errors; and the week's IndexNow send (A2), skipped for any site whose content sitemaps still claim "today" on most pages (S2). Writes `data/weekly/<date>.md`; a Windows notification only on a fall below half, a rise to double, or a failed run (a check that fails silently looks like a quiet week). Run by Windows Task Scheduler, Mondays 09:00, catching up if the PC was off. `--no-notify` to test, `--test-notify` to check notifications reach you | Weekly, automatically |
| `aiwatch.mjs [days]` | Visits from AI assistants by day and landing page (GA4's AI Assistant channel plus any source named after an assistant, since some land in "Unassigned"), "direct" visits on the same pages beside them (assistant apps can drop the referrer and tags), and a warning for any of the last three days below 40% of the week before | Daily for two weeks after any change to a page AI sends people to, then weekly (A5, O3) |
| `dashboard.py` | Turns a pull into the numbers dashboard's data | After every pull |
| `inspect-sections.mjs 20` | URL Inspection on 20 random URLs per child sitemap: indexed, crawled not indexed, unknown, last crawl date | Every review. Quota 2,000 a day per property |
| `inspect.mjs 15` | URL Inspection on the top pages by impressions plus the home page | Every review |

For a "before and after" a review also wants the same window either side of
the last reading, queried directly (Search Console `searchAnalytics.query` and
a GA4 `runReport` with two date ranges); keep the result beside the pull.

### 7.3 Checking the site itself

| Script | Does |
| --- | --- |
| `sweep.py` | Every sitemap URL without following redirects (status, `Location`, `robots`, `googlebot`, `X-Robots-Tag`, canonical), then every followed internal link on those pages. Anything not 200 is reported with how many pages link to it |
| `toolforms.py` | Each tool page fetched as an AI crawler: form inputs between `<main>` and `<footer>`, against inputs anywhere. "Missing" and "after the footer" are both failures (R1) |
| `blog.py --links` | Every article: status, robots, title and description length, canonical, share tags, `article:` dates, Article and BreadcrumbList data, headings, word count, body links and every link target |
| `descriptions.py [--same-as <folder>]` | Every live meta description and its length; `--same-as` re-reads exactly the URLs of an earlier scan, for a page by page before and after |
| `similarity.py <sitemap> [regex]` | Template similarity per family (C2): a dozen random pages, `<main>` only, with scripts, styles, SVG and React's hidden streaming blocks removed; 5-word shingles; median pairwise Jaccard, and the median share of each page's shingles found on at least half the others ("shared text") |
| `breadcrumbs.py` | Every page against the breadcrumb rules in 6.23 |
| `release-check.sh <Site> <db> <port>` | Before a production merge (O8): a fresh clone of the branch (no env files), a throwaway Postgres, then install, seed from nothing, lint, the whole suite, the production build, and the built site started and checked by `release-smoke.py`. The setup for the throwaway database is in its header |
| `release-smoke.py <Site> <url>` | Key pages per site (any 5xx fails, a 404 warns), the tool forms in the server HTML (R1), every sitemap and a random sample of its URLs. Run against the local build and again against the live site after the deploy |
| Sitemap date spread | For each child sitemap, the number of distinct `lastmod` dates and how many say today (S2). A few lines of any language; parse each `<url>` block on its own (5.1, trap 12) |
| Crawler access | `curl -s -o /dev/null -w '%{http_code}' -A '<user agent>' <url>` for each of the six crawlers in A3, on the home page and one tool |
| Lighthouse | `npx lighthouse <url> --form-factor=mobile --throttling-method=simulate`, three times, median. On Windows its Chrome teardown can exit non-zero after writing the report; harmless |

### 7.4 Measuring a change

1. **Log it** in `changes.json`: an id, the sites, the date it went live, which
   pages it touched (a path pattern, or "every page whose description
   changed"), what it should do, the metric, and when to check.
2. **Snapshot before.** For descriptions, `descriptions.py` saves every live
   one; after the deploy, `--same-as` re-reads the same pages.
3. **Compare** (`compare.mjs <id>`): 28 days before the deploy against 28 days
   after a settling period, changed pages against unchanged ones, click-through
   rate inside position bands (1 to 3, 4 to 10, 11 to 20, 21 and over).
   Changed against unchanged separates the change from everything else moving
   at the same time; position bands, because rate depends on ranking far more
   than on wording.
4. **Withhold a verdict** below about 1,000 impressions per group per window,
   and write the result down whatever it says.

Two limits found in use: Bing's page and query reports are top rows only, so
Bing comparisons see a fraction of the traffic; and a scan that sampled one
family leaves the rest of that family out of both groups.

### 7.5 Cookieless analytics (Vercel Web Analytics and similar)

Useful because it counts every visitor, consent or not; misleading for the same
reason, because scrapers that run a browser count too (X5). Read it by route
and device together, and by referrer; bursts of one-page desktop visits with no
referrer on templated pages are scrapers. Breakdowns by `utm_` parameter can
need a paid tier, so campaign measurement stays in the main analytics (X3).

### 7.6 Screenshots of live pages

For a portfolio, or just to look (5.1, trap 15): drive the installed Chrome
(Puppeteer with `puppeteer-core`) at 1440 wide; decline the cookie banner;
skip any intro animation; scroll the whole page once so lazy images load; then
capture. Look at every image: a screenshot faithfully records a bug.

---

## 8. The evidence: Memento, August to November 2026

Three sites, Memento Astra (astrology), Arcana (tarot) and Somnia (dreams),
Next.js on Vercel, one owner, one template, launched in August 2026. Raw data
is in `Memento/docs/seo/data/<date>/`; each reading is in
`Memento/docs/seo/reports/` (from 12 November) or `SEO-TRACKER.md` (before).

### 8.1 Timeline

| Date (2026) | What happened | Rules it produced |
| --- | --- | --- |
| 11 to 18 Aug | Sitemaps submitted; impressions start within days; Googlebot crawls Astra at up to 12,000 pages a day | |
| 23 Aug | Astra release: 120 hub pages and a data refresh. Code deployed, **the data step never run on production**: 120 sitemap URLs answering 404, 120 broken links on the gallery, for six weeks | O1, S4 |
| 23 to 30 Aug | Peak: about 19,000 impressions a week on Astra, 8,000 on Arcana, 5,600 on Somnia | |
| 29 to 30 Aug | Deploy on all three, including a **followed "Website by" credit on every page** | B2 |
| 30 Aug to 2 Sep | **All three lose about 99% of Google impressions in four days.** No manual action, no fault | C1 to C4 |
| Sep | Googlebot crawling falls to almost nothing. Search Console emails about the 404s, unread | O3 |
| 4 to 5 Oct | First look in six weeks. Cause found (8.3). Fixes: Google-only noindex on 13,000 template pages, captions removed, builder credit `nofollow`, provider hosts redirected, every description rewritten, blog pass, bylines, IndexNow | C3, C5, M2, B2, U1, A2 |
| 10 to 18 Oct | 1,260 celebrity pages given 300 to 500 words each of original writing, and released back to Google | C1, C6 |
| 10 Oct | Cookieless analytics added: 85% of its "visitors" turn out to be scrapers | X5 |
| 9 to 22 Oct | **ChatGPT sends Astra 40 to 70 visitors a day**, nearly all to one free tool; registered users go from 18 to 43 | A5 |
| 22 Oct, 23:00 UTC | **ChatGPT visits fall from 7 to 15 an hour to 1 to 3**, and stay there. No deploy between 21 Oct 00:53 and 23 Oct 18:31; nothing blocked; Microsoft's AI keeps citing the site. A change on ChatGPT's side | A5, 5.1 trap 17 |
| 23 Oct | Speed and cost deploy on all three: four tool pages made static; **two lose their form from the HTML** (`useSearchParams`), two have it moved after the footer (`Suspense`); analytics stops reporting query strings, **campaign tags included**; topic and search pages split onto `noindex` routes. First blamed for the ChatGPT fall, which the hourly data showed came 19 hours earlier | R1 to R3, X3, C10 |
| about 24 Oct | **Google removes nearly every indexed page on all three sites** in one step (Astra about 8,000 to 299), mostly without re-crawling them | Section 2 |
| 10 Nov | Google's November 2026 core update begins | |
| 12 Nov | Second full reading. Found: the forms, the campaign tags, `lastmod` "today" on 1,865 pages of one site, links through redirects and into search results. Fixed in code the same day | R2, X3, S1, S2, U3, L3 |

### 8.2 What was ruled out

Every check in 4.4, steps 1 to 5, came back clean in October and again in
November: the drop was real (analytics agreed), no manual action or security
issue, robots.txt open, no stray `noindex`, every inspected page fetchable with
Google's canonical matching ours, crawl stats healthy, no confirmed update on
the dates. What that leaves is an algorithmic judgement about each site.

### 8.3 The causes, most confident first

1. **Thirteen thousand pages of one template (Astra). High confidence.** A
   one-line bio, a table of placements, and about 200 words of chart
   instructions identical on every page. Measured on the live site:

   | Family | Pages | Shared text |
   | --- | --- | --- |
   | **Astra celebrity** | **13,000** | **69%** |
   | Astra houses | 180 | 46% |
   | Arcana card | 78 | 32% |
   | Astra aspects | 162 | 29% |
   | Astra good-day | 320 | 25% |
   | Somnia dream meaning | 1,546 | 14% |
   | Arcana question | 624 | 11% |
   | Arcana combination | 448 | 2% |

   At 91% of the site, the template was the site to a site-level assessment.
   It was also the best-ranked section during the trial (average position
   11.5), because exact-name queries have no competition: early rankings
   predicted nothing. Removing the captions took it to 41%; a written summary
   takes a page to about 21%.
2. **New domains, no outside links, thousands of pages at once (all three).
   Likely.** No site had a single link from anywhere, and nobody searched for
   them by name. The only explanation found for Arcana and Somnia, whose
   content was distinct.
3. **A followed builder credit on every page of three linked sites. Possible.**
   Added the day before the drop; Google's link spam policy names "widely
   distributed links in the footers or templates of various sites". Not
   proven; removing it cost nothing.
4. **Contributing:** the release whose data never reached production (O1);
   content withheld from signed-out visitors (R5); provider-host duplicates
   (U1); links built for the wrong kind of page (U3).
5. **Not causes:** old-URL 404s (under 0.5% of past impressions), merchant
   warnings left deliberately (5.2), and page speed (the slowest template was
   the best ranked).

### 8.4 Descriptions: what "passing a 160 cap" hid

Measured on 4 October across all three sites, which had all passed a 160
character limit:

| Problem | How many |
| --- | --- |
| Under 120 characters | 168 under 100, 728 at 100 to 119 |
| Cut mid-sentence with "…" by a truncating helper, so measured in range | about 2,600 |
| Template families where only a name changes | daily horoscopes 96% alike, card topics 88%, wedding months 85% |
| The searched words missing | "earthquake dream meaning" with no "earthquake"; "<name> star sign" (20% of celebrity searches) never answered |
| Simply wrong | shops describing products they do not sell |

After the rewrite (M2): families at 8 to 43% similar instead of 85 to 96%, and
the share of top pages whose description carried their top query's words went
from 37 to 58 of 60 on one site. The before and after experiment could not be
read on these volumes (7.4).

### 8.5 The sitemap that kept pointing at the problem

From 4 October the 13,740 unwritten celebrity pages stayed in the sitemap,
dated the day their Google-only `noindex` went on, so that Google would
re-crawl them and see it. By 9 November Google had seen it on 598. It had
stopped crawling the site, so the listing did nothing except keep the template
in front of it; meanwhile it dropped the old copies from its index anyway. On
12 November the sitemap was cut to the 1,260 written pages and 120 hubs. Rule
S1 replaces the old advice to keep noindexed pages listed until seen.

### 8.6 Found on 12 November, and what each taught

| Finding | Rule |
| --- | --- |
| `/birth-chart` and `/death-chart` had no form in their HTML at all: their tools read the address with `useSearchParams`, which on a static page renders the whole tool in the browser only | R2 |
| `/astrocartography` and `/wedding-chart` sent their forms after the footer in a hidden block, because of a `Suspense` boundary added "because the tool reads the URL", which it did not | R3 |
| Analytics had dropped the whole query string for privacy (rightly), and with it every `utm_` tag, so the social campaign and ChatGPT's tagged visits would have arrived as "direct" | X3 |
| One site's sitemap stamped "today" on every page without its own date (1,865), another on 375 calendar pages that never change | S2 |
| 372 dream pages linked internal search results through a redirect; Googlebot spent its few November visits on those searches | U3, L3 |
| 15 links went through a temporary (307) redirect, because the framework's default redirect is temporary | U2 |
| Blog tag links were built by hand with an old address, though a helper existed | U3 |
| The first check of the tool forms stripped React's hidden blocks and reported the form missing everywhere; it was missing on two pages, misplaced on two | 5.1, trap 2 |
| A cookieless analytics product reported 17,000 visitors in six weeks; 85% were scrapers | X5 |

### 8.7 Numbers worth keeping

| | Astra | Arcana | Somnia |
| --- | --- | --- | --- |
| Google impressions, week of 24 Aug (peak) | 18,698 | 8,179 | 5,639 |
| Google impressions, week of 2 Nov | 3 | 0 | 2 |
| Google indexed pages, Sep to mid Oct | about 8,000 | about 400 to 750 | about 750 to 1,400 |
| Google indexed pages, 9 Nov | 299 | 91 | 38 |
| Bing indexed pages, 3 Oct then 3 Nov | 9,808 then 13,389 | 690 then 1,049 | 873 then 1,154 |
| Bing impressions, 5 weeks to 4 Oct then 5 weeks to 11 Nov | 2,327 then 3,966 | 292 then 580 | 56 then 115 |
| Outside links (Google and Bing) | 0 | 0 | 0 |
| Analytics visits from ChatGPT, Sep / Oct / Nov to the 11th | 240 / 524 / 4 | 54 / 32 / 16 | 4 / 4 / 0 |
| Share of visitors counted by consent-gated analytics | about 1 in 8 | similar | similar |

---

## 9. Sources

Every outside fact in this file, the page it rests on, and what was found there.
Checked on **12 November 2026** unless the row says otherwise. Search guidance
changes; when a rule here matters to a decision, open the source again rather
than trusting the date. The breadcrumb sources are listed with 6.23.

### Google: crawling, indexing, ranking

| Fact | Source |
| --- | --- |
| `lastmod` used only when "consistently and verifiably" accurate; `changefreq` and `priority` ignored | <https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap> |
| Each page of a paginated list is its own canonical, never page 1 | <https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading> |
| `noindex` not recommended for steering canonical choice | <https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls> |
| `noindex` with a canonical elsewhere called "very contradictory" (John Mueller, 2018; secondary source) | <https://www.seroundtable.com/google-noindex-rel-canonical-confusion-26079.html> |
| Filter and sort URLs: robots.txt or URL fragments; canonical and `nofollow` "less effective in the long term" | <https://developers.google.com/crawling/docs/faceted-navigation>, <https://developers.google.com/search/blog/2024/12/crawling-december-faceted-nav> |
| A canonical change can stay clustered for up to two weeks | <https://developers.google.com/search/docs/crawling-indexing/canonicalization-troubleshooting> |
| Indexing API only for `JobPosting` or `BroadcastEvent` embedded in a `VideoObject` | <https://developers.google.com/search/apis/indexing-api/v3/quickstart> |
| URL Inspection API: 2,000 a day and 600 a minute per site | <https://developers.google.com/webmaster-tools/limits> |
| Request indexing has "a daily limit", not published | <https://support.google.com/webmasters/answer/9012289> |
| robots.txt `noindex` unsupported since 1 September 2019; a disallowed URL can still be indexed from links | <https://developers.google.com/search/blog/2019/07/a-note-on-unsupported-rules-in-robotstxt>, <https://developers.google.com/search/docs/crawling-indexing/robots/intro> |
| `nofollow`, `sponsored`, `ugc` are hints | <https://developers.google.com/search/blog/2019/09/evolving-nofollow-new-ways-to-identify> |
| Googlebot reads the first 2 MB of uncompressed HTML | <https://developers.google.com/search/docs/crawling-indexing/googlebot> |
| JavaScript: a `noindex` in the raw HTML may stop rendering; non-200 pages may not be rendered; keep canonicals the same before and after rendering; "not all bots can run JavaScript" | <https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics> |
| Scaled content abuse: "many pages are generated for the primary purpose of manipulating search rankings", "no matter how it's created" | <https://developers.google.com/search/docs/essentials/spam-policies>, <https://developers.google.com/search/blog/2024/03/core-update-spam-policies> |
| Helpful content became part of core ranking in March 2024; "site-wide signals and classifiers are also used" | <https://developers.google.com/search/docs/appearance/ranking-systems-guide> |
| Core updates: changes "can take effect in a few days" or "several months"; no need to wait for a core update to see improvements | <https://developers.google.com/search/docs/appearance/core-updates> |
| November 2026 core update began 10 November, "up to 2 weeks"; recent ones took 11 to 18 days | <https://status.search.google.com/incidents/WLxcJyC6jMWMfryxsKMc> |
| Site reputation abuse enforcement changed in the EEA (August 2026); back button hijacking a spam policy (April 2026); spam policies cover generative AI responses (May 2026) | <https://developers.google.com/search/blog/2026/08/update-site-reputation-policy>, <https://developers.google.com/search/updates> |

### Google: appearance, structured data, AI

| Fact | Source |
| --- | --- |
| Meta descriptions: no length limit, truncated to the device, snippet "primarily created from the page content" | <https://developers.google.com/search/docs/appearance/snippet> |
| Titles truncated "to fit the device width" | <https://developers.google.com/search/docs/appearance/title-link> |
| FAQ rich results limited to government and health sites (August 2023), then ended on 7 May 2026 | <https://developers.google.com/search/blog/2023/08/howto-faq-changes>, <https://developers.google.com/search/updates> |
| Sitelinks search box ended 21 November 2024; markup need not be removed; `WebSite` still names the site | <https://developers.google.com/search/blog/2024/10/sitelinks-search-box> |
| Breadcrumbs gone from mobile results, January 2025 | <https://developers.google.com/search/blog/2025/01/simplifying-breadcrumbs> |
| Shipping and return policies at account level; Search Console's version wins on conflict | <https://developers.google.com/search/docs/appearance/structured-data/shipping-policy>, <https://developers.google.com/search/docs/appearance/structured-data/return-policy> |
| No special files, markup or `llms.txt` needed for Google's AI features | <https://developers.google.com/search/docs/fundamentals/ai-optimization-guide> |
| "Search generative AI" opt-out setting (August 2026); generative AI performance report | <https://support.google.com/webmasters/answer/16908024>, <https://support.google.com/webmasters/answer/16984139> |
| Core Web Vitals: LCP 2.5 s, INP 200 ms, CLS 0.1 at the 75th percentile; INP replaced FID 12 March 2024 | <https://web.dev/articles/vitals>, <https://web.dev/blog/inp-cwv-march-12> |

### Google Analytics

| Fact | Source |
| --- | --- |
| Campaigns are read from parameters in the page address ("document location") | <https://support.google.com/analytics/answer/11242841> |
| `campaign_source` and the like in the config override `utm_` parameters | <https://developers.google.com/analytics/devguides/collection/ga4/reference/config> |
| The "AI Assistant" default channel (ChatGPT, Gemini, Copilot and others; not AI Overviews) | <https://support.google.com/analytics/answer/9756891> |

### Bing, IndexNow, OpenAI and others

| Fact | Source |
| --- | --- |
| Bing: `lastmod` "remains a key signal" for AI search; `changefreq` and `priority` ignored; IndexNow recommended (July 2025) | <https://blogs.bing.com/webmaster/2025/7/Keeping-Content-Discoverable-with-Sitemaps-in-AI-Powered-Search/> |
| Bing's structured data support | <https://www.bing.com/webmasters/help/marking-up-your-site-with-structured-data-3a93e731> |
| Bing's description warnings (flags under about 100 characters, asks 150 to 160) | Bing Webmaster Tools' own recommendations, read 4 October 2026 |
| IndexNow participants: Bing, Naver, Seznam, Yandex, Yep; not Google | <https://www.indexnow.org/>, <https://www.indexnow.org/searchengines.json> |
| OpenAI's crawlers (`OAI-SearchBot`, `GPTBot`, `ChatGPT-User`, `OAI-AdsBot`), each controlled separately; `ChatGPT-User` may not follow robots.txt | <https://developers.openai.com/api/docs/bots> |
| ChatGPT search uses third-party search providers, Bing named among them (read through search snippets; the help centre refused automated fetches) | <https://help.openai.com/en/articles/9237897-chatgpt-search>, <https://help.openai.com/en/articles/10093903-chatgpt-search-for-enterprise-and-edu> |
| None of the major AI crawlers rendered JavaScript (Vercel and MERJ, December 2024; a vendor study, not a statement by the AI companies) | <https://vercel.com/blog/the-rise-of-the-ai-crawler> |
| Google rewrites about two thirds of descriptions (Ahrefs 2020: 62.78%; Portent 2020: 68 to 71%). Not re-checked on 12 November | Ahrefs and Portent studies, 2020 |

### Next.js (16.3)

| Fact | Source |
| --- | --- |
| `useSearchParams` in a prerendered route renders up to the nearest `Suspense` in the browser only | `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-search-params.md` |
| `permanentRedirect()` answers 308; `redirect()` answers 307 | `.../04-functions/permanentRedirect.md` and `redirect.md` in the same folder |

---

## Changelog

| Date | Change |
| --- | --- |
| 12 Nov 2026 | **Restructured for use on any site**: the rules first, with IDs, then checklists, build reference, tools, evidence and sources. **Added** section 2 (how the engines behaved, August to November), rules R2, R3, R6, R7, U2, U3, L3, A5 to A7, X3, X5, the deploy and monitoring checklists, traps 2, 4, 6, 7 and 12, and section 9. **Replaced** "keep newly noindexed pages in the sitemap until Google has seen the tag" with S1: Google had stopped crawling, so it never came to see it. **Replaced** "topic pages `noindex` below three articles" with C10 and "filters canonical to the base page" with Google's faceted navigation guidance (6.19). **Corrected** the `SearchAction` and FAQ advice (6.4, 6.19), the claim that recovery waits for a core update (section 2), and 6.18, which said `fallback={null}` leaves the crawler an empty page (the content is usually sent, after the footer; `useSearchParams` is what removes it). Every outside fact re-checked. The previous version is `docs/seo/archive/SEO-PLAYBOOK-2026-10-08.md`. Later the same day: the ChatGPT fall re-dated to 23:00 UTC on 22 October from hourly data, which cleared the 23 October deploy; trap 17 added; Bing's AI Performance report added to A5 and 4.4; rule O7 (shared cache for third-party calls during render), rule X8 (conversion events) and the `weekly.mjs` and `aiwatch.mjs` tools added; IndexNow automated in `weekly.mjs`. At the deploy: rule O8 (a test gate protects production only if releases pass through it) and, in X8, how GA4 now marks key events; `release-check.sh` and `release-smoke.py` added to 7.3 |
| 8 Oct 2026 | Breadcrumbs researched from Google's, Bing's and the W3C's own pages (6.23); "two breadcrumb lists are worse than none" corrected |
| 4 to 5 Oct 2026 | First version, written after the September drop: Part 1 (the drop, 32 rules, the pre-launch checklist) and Part 2 (how to build it) |

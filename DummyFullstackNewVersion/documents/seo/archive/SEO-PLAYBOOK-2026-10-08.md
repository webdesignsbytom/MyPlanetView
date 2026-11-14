# SEO playbook

How to build a site's SEO properly, how not to lose Google once it is live, and
how to measure whether a change worked. Written from three live sites (the
Memento astrology, tarot and dreams sites, Next.js on Vercel) in August to
October 2026, but almost nothing in it is specific to them.

**For Claude on another project:** read this whole file before launch or before
any SEO work. Then work through the pre-launch checklist in **Part 1, section
8** on the project in front of you; items marked **[block]** should stop a
launch. Part 2 explains how to build each piece the checklist asks for.

| Part | What it is |
| --- | --- |
| **Part 1. Losing Google, and how not to** | What happened when three new sites lost 99% of their Google visibility in four days: the causes, the fixes, 32 rules, the pre-launch checklist (section 8), meta description rules (section 13) and measuring a change over time (section 14) |
| **Part 2. How to build the SEO** | The 23 areas every site needs (titles and descriptions, canonicals, share images, structured data, sitemaps, breadcrumbs and so on), each with the rule, the code shape and the trap that makes it go wrong quietly. Section 22 is for sites that render in the browser (React on Vite and similar) |

Section numbers restart in each part: "section 8" inside Part 1 means Part 1's
section 8.

---

## Part 1. Losing Google, and how not to

What happened when three new sites lost almost all of their Google search
visibility within four days, what caused it, what was fixed, and the checks
that would have prevented it.

**Written for:** Claude working on any other web project, before launch or
before any SEO work, and for Tom. Read it once end to end, then work through
the checklist in section 8 on the project in front of you. Nothing in the
checklist is specific to astrology, tarot or dreams.

**Source:** the Memento sites (Astra, Arcana, Somnia), Next.js on Vercel,
investigated 3 to 4 October 2026. Every number below was measured, not
estimated. The raw data is in `Memento/docs/seo/data/2026-10-04/` and the
running record is `Memento/docs/seo/SEO-TRACKER.md`.

---

### 1. The short version

- Three new sites launched in August 2026 with about 17,500 pages between them
  and **no links from any other website**.
- Google showed them for about two weeks (a trial every new site gets), then
  between **30 August and 2 September** cut their visibility by about 99%.
  A month later it had not come back.
- There was **no penalty and no technical fault.** Google could fetch every
  page; it decided the sites were not worth showing.
- The clearest cause: on Astra, **13,000 of its 14,300 pages were one template**
  that shared 69% of its text from page to page. Google rates a site as a
  whole, so a template that big decides the rating for everything.
- Contributing: a **followed "Website by" link** to the studio added to every
  page of all three sites the day before the drop; a release whose **data
  never reached production**, leaving 120 dead pages in the sitemap and 120
  broken links on a hub page; and **duplicate copies** of each site on hosting
  addresses.
- Nobody looked at Search Console for **six weeks**, so a collapse that began
  on 30 August was found on 4 October.

---

### 2. Timeline

| Date (2026) | What happened |
| --- | --- |
| 11 Aug | Astra's sitemap submitted. First impressions the same day |
| 16 to 18 Aug | Somnia and Arcana start receiving impressions |
| 17 to 21 Aug | Googlebot crawls Astra at up to 12,000 pages a day |
| 18 to 21 Aug | Google's August spam update. The sites grew that week, so it was not this |
| 23 Aug | Astra release: 120 "who has this placement" hub pages, a celebrity data refresh, summaries. Code deployed, **data steps never run on production** |
| 23 to 30 Aug | Peak: about 19,000 impressions a week on Astra, 8,000 on Arcana, 5,600 on Somnia |
| 29 to 30 Aug | Deploy on all three: auth rate limiting, checkout changes, and a **followed "Website by ByteToast Studio" link on every page** |
| 30 to 31 Aug | **Astra collapses**: 2,867 impressions on 29 Aug, 93 on 31 Aug |
| 1 to 2 Sep | **Arcana and Somnia collapse**: 1,084 to 2, and 1,020 to 0 within two days |
| Sep | Googlebot crawling falls to almost zero. Search Console emails about 404s (7 and 17 Sep) and one "duplicate, Google chose different canonical" (7 Sep) |
| 12 to 26 Sep | Google core update. No recovery |
| 4 Oct | First look at Search Console since 21 August. Investigation, fixes |

The sites had been live for different lengths of time when they fell (Astra 19
days, Somnia 16, Arcana 14), yet they fell within the same four days. A new-site
trial ending on its own would have staggered the drops by age. Falling together
on the calendar points at a shared trigger, which is why the shared deploy of 29
to 30 August is taken seriously below.

---

### 3. What was ruled out, and how

Work through these in this order whenever visibility drops. Each took minutes.

| Check | How | Result here |
| --- | --- | --- |
| Is the drop real, or a Search Console reporting glitch? | Compare with analytics from a separate source (GA4 organic sessions) | Real. Google organic sessions on Astra went 31, 1, 2, 2, 0 by week |
| Manual action (a human penalty)? | Search Console, Security & Manual actions, Manual actions | None on all three |
| Security issue (hacked, malware)? | Same section, Security issues | None |
| robots.txt blocking Google? | Fetch `/robots.txt` | No. Everything allowed except `/api/` |
| Stray `noindex`? | Fetch pages, check `<meta name="robots">` and the `X-Robots-Tag` header, including with a Googlebot user agent | None on any sampled page |
| Can Google fetch the pages? | URL Inspection (API or screen) on the top pages | Every page fetched, indexing allowed, Google's canonical matched ours |
| Server errors or blocking (firewall, bot protection, rate limits)? | Search Console, Settings, Crawl stats: "By response" and "Host status" | 99% answered 200, host status "No problems". A firewall blocking Googlebot would show here and nowhere else |
| A confirmed Google update? | Google Search Status Dashboard and SEO news for the dates | None matched the drop dates |

**What that left:** an algorithmic judgement about the sites. The signature was
that many pages were **still indexed but no longer shown**, and Googlebot
stopped visiting. Removing pages one by one looks different: those pages leave
the index. This was Google deciding, at site level, that these sites were not
worth surfacing.

---

### 4. The causes, most confident first

#### 4.1 Thirteen thousand pages of one template (Astra). High confidence

Each celebrity page was a one-sentence bio, a table of ten planet positions,
the chart graphics, and about 200 words of instructions printed identically on
every page ("The Ascendant is on the left...", "Where several planets sit
within a few degrees...", "Charts are computed from..."). The rest was template
sentences with the name swapped.

Measured on the live site, twelve random pages per family, main content only:

| Page family | Pages | Text shared with the rest of the family |
| --- | --- | --- |
| **Astra celebrity** | **13,000** | **69%** |
| Astra houses | 180 | 46% |
| Arcana card | 78 | 32% |
| Astra aspects | 162 | 29% |
| Astra good-day | 320 | 25% |
| Somnia dream meaning | 1,546 | 14% |
| Arcana question | 624 | 11% |
| Arcana combination | 448 | 2% |

That is what Google's scaled content policy describes: many pages produced to
a pattern, with little value added to each. At 91% of the site, the template
*was* the site as far as a site-level assessment is concerned.

**Why it fooled us:** before the drop the celebrity pages were the
best-performing section on any of the three sites (average position 11.5 against
40 to 90 elsewhere; "yayoi kusama birth chart" at position 5). An exact query
like "[name] birth chart" has almost no competition, so during the trial each
page ranked on its title alone. Ranking well in the first fortnight says
nothing about how Google will judge the site once it looks at the whole.

#### 4.2 New domains, no outside links, thousands of pages at once (all three). Likely

None of the three had a single link from another website, and nobody searched
Google for any of them by name (Astra 0 brand searches, Somnia 1). Google had
no outside evidence that anybody valued them, against 17,500 pages asking to be
indexed. This is the most common reason new programmatic sites are trialled and
then dropped, and it is the only explanation found for Arcana and Somnia, whose
content was distinct.

**Honest gap:** for Arcana and Somnia no content cause was found. If they
recover after the fixes below without new content, the shared trigger in 4.3 was
the more likely cause; if they recover only once links arrive, it was this.

#### 4.3 A followed "Website by" credit on every page of three linked sites. Possible

Added on 29 August to every page of all three sites as a normal (followed)
link to the studio's own site. All three dropped within four days: Astra first,
the other two a day and a half later, which fits Google noticing the change as
it recrawled each site. Google's link spam policy
names "widely distributed links in the footers or templates of various sites"
as an example of a link scheme. Not proven to be the cause; it was the only
SEO-relevant change shared by all three in the window, and removing it costs
nothing. Now `rel="nofollow"`.

The three sites also link to each other from every page ("More from Memento").
That is normal for sister sites under one brand and was left as it is, but on a
new launch it is one more pattern worth not stacking on top of the others.

#### 4.4 A release whose data never reached production (Astra). Contributing

The 23 August release added 120 hub pages whose content comes from a database
index. The code deployed; the step that builds the index was never run against
the production database. Each hub calls `notFound()` when the index is empty,
so for six weeks:

- the sitemap listed **120 URLs that returned 404**,
- the gallery page linked to **all 120 dead pages**,
- Wikipedia summaries for 14,800 figures, nationalities, and 2,000 new figures
  existed in the seed and nowhere on the live site.

Search Console reported it ("Not found (404)" rising from 1 to 87, an email on
7 September) and nobody was reading it. A sample of eight URLs per sitemap
section, which is how the site had been checked, missed all 120: they were 120
URLs inside a sitemap of 13,120.

#### 4.5 Duplicate copies of each site (all three). Minor

- Each Vercel project served the whole site, indexable, at
  `<project>.vercel.app` as well as the real domain. The canonical tag pointed at
  the real domain, which usually works, but it is a second copy.
- Old Netlify deployments (since deleted) had served copies too. For one Arcana
  page Google chose the Netlify address as the canonical over the real domain.

Neither caused the drop. Both are now closed (redirect, deletion).

#### 4.6 Content withheld from signed-out visitors, so from Google (Arcana). Contributing

Found by the full sweep on 4 October. Arcana's lesson page worked out "does this
visitor have premium?" only for signed-in users, so for anyone signed out the
answer stayed `false`, and every lesson flagged premium was **locked**: the page
served a "This lesson is part of Premium" panel and no lesson body, while
paywalls were switched off and nothing was meant to be gated. Googlebot is
always signed out, so Google saw three empty lessons with a link to a page that
returns 404 (`/premium`). Somnia's identical page was written correctly (it only
locks when paywalls are on), which is how the bug stood out.

#### 4.7 Links built for the wrong kind of page (Astra). Minor

Four pages built a `/planets/<key>` link for every chart body, including the
four that live under `/points/` (Chiron, the two lunar nodes, Lilith). Every
aspect page involving one of them linked to a 404. Fixed with one helper,
`bodyPath(key)`, that knows which is which.

#### 4.8 Things that were not causes

- **404s for old URLs** (`/charts/*` renamed to `/celebrity-charts/*`, sold-out
  shop products, one deleted blog post): under 0.5% of past impressions, and
  correctly redirected or gone.
- **Merchant listing warnings** (missing `shippingRate`, `aggregateRating`,
  `review`): non-critical, and deliberately left. Inventing a shipping rate or
  reviews would be worse. See section 9.
- **Page speed.** Astra's 3D chart pages score 51 to 60 on mobile Lighthouse,
  but the slowest template was also the best-ranked one before the drop, and
  every page scored SEO 100 and CLS 0. Speed is worth fixing; it did not do
  this.

---

### 5. What was fixed

| Fix | Sites | Status on 4 Oct |
| --- | --- | --- |
| Celebrity figure pages tell **Google only** not to index them (`<meta name="googlebot" content="noindex, follow">`); plain `robots` stays `index, follow`, so Bing, and ChatGPT search through Bing, keep them. One switch, `figureIndexedByGoogle()` | Astra | In code, awaiting push |
| Figure URLs kept in the sitemap, dated the day the tag went on, so Google recrawls them and sees it. Remove from the sitemap once Search Console shows the noindex processed | Astra | In code |
| ~200 words of identical chart instructions removed from the figure template; one link to the method page instead | Astra | In code |
| Hub pages are only linked and only listed in the sitemap when their data exists (`placementIndexReady()`) | Astra | In code |
| "Website by" credit made `nofollow` | all three | In code |
| `<project>.vercel.app` 308-redirects to the real domain, matched on that exact host so preview deployments are untouched | all three | In code |
| Lesson pages ask "premium?" for every visitor, so nothing locks while paywalls are off (three lessons had been empty for Google) | Arcana | In code |
| Planet and point links go through `bodyPath()`; four 404 targets gone | Astra | In code |
| Dead sitemap submission removed, new one submitted in Search Console | Somnia | Done |
| Every meta description rewritten to 120 to 156 characters in whole sentences, then a second pass for similarity and search words, with guard tests (Part 1 section 13) | all three | In code |
| Chart tools withhold the Ascendant, Midheaven, houses and angle points when no birth time is given, as the site's own `/no-ai` page promised; the page says why where they used to be | Astra | In code |
| Shared dreams get the public address (`shareSlug`) they were never given, so sharing works and `/community` can fill; old ones backfilled on first view | Somnia | In code |
| Card meanings rendered through the site's Markdown component, so `**bold**` stops printing as asterisks; a wrong "roughly a third" corrected to "about one day in five" | Arcana | In code |
| Blog pass (5 October): article dates fixed in the share tags, covers no longer lazy loaded, topic pages given their own titles and thin ones noindexed, every article linked from the reference pages it explains, research posts given sources, login links and one false claim removed (Part 2, sections 4, 8, 9, 12 and 19) | all three | In code; article text needs the sync after the push |

Still to do:

- Load the missing production data (push the figures, build the placement
  index), which brings the 120 hubs back.
- Real, figure-specific writing for the celebrity pages, then let each figure
  back into Google as it gets it.
- External links: the social campaign, outreach, anything that gets other sites
  to point at specific pages.
- Patience. Site-level judgements are re-run slowly, often around core updates.
  Recovery is measured in months.

---

### 6. The rules this produced

Each rule is the lesson, why it matters, and how to check it.

#### Content at scale

**6.1 Measure template similarity before launch, on rendered pages.** For every
page family that comes from one template, take a dozen random pages, strip the
nav and footer, and measure how much text each shares with the others (5-word
shingles, method in section 10). Under about 30% is a normal consistent layout.
Over about 50% on a family of thousands is a scaled content risk, whatever the
page titles rank for in week one.

**6.2 Help text belongs on one page, not on every page.** Captions explaining
how to read a chart, a table or a tool are the same on every instance. Two
hundred words of them on 13,000 pages was most of what made those pages
identical. Give the shared component a switch (`guide={false}`) and link to one
explainer.

**6.3 Index only pages that have something of their own.** A page that exists
because a row exists in a database is not a reason for Google to index it. Keep
it live for visitors if it is useful, but index it only when it has content
specific to it. Grow the indexed set as the site earns trust, rather than
launching with all of it.

**6.4 When you must hide pages from Google, hide them from Google only.**
`robots: { index: true, follow: true, googleBot: { index: false, follow: true } }`
in Next.js metadata writes a separate `<meta name="googlebot">`. Bing, which
also feeds ChatGPT search, keeps indexing. `follow` keeps Google walking the
links to the rest of the site.

**6.5 Keep newly noindexed pages in the sitemap until Google has seen the tag.**
Removing them at the same time leaves Google with no reason to recrawl, and at a
low crawl rate the old indexed copies can sit there for months. Date them
honestly (the day the tag went on) and remove them once Search Console's
"Excluded by noindex" count has caught up.

**6.6 Rewording one source is not new content.** Facts belong to nobody, and
writing them in your own words from several sources is fine. Paraphrasing a
single article sentence by sentence (Wikipedia especially) is what Google's
scaled content policy calls "rewriting content from other sources with little
added value", and a rewrite of Wikipedia text is still an adaptation under its
licence.

**6.7 Never let generated text state a fact about a real person.** Dates,
places, relationships and claims come from verified data and are inserted, not
written. A model may word a sentence around facts it is given; it must not add
any. Check the output against the data automatically.

#### Launch shape

**6.8 Do not launch thousands of pages on a domain nobody links to.** Launch
the strongest few hundred, get links and mentions, then widen. Plan where the
first links come from (communities, directories, social, partners, press)
before launch, not after.

**6.9 Track brand search from day one.** If the site's name collides with a
common phrase, nobody can find it by name and Google gets no signal that people
look for it. Choose the name with that in mind, or plan for it.

**6.10 Do not stack patterns.** Several new sites launched together, by one
owner, on one template, linking to each other from every page, with a sitewide
credit to the builder, are each normal on their own. Together they look like a
network. Stagger launches and keep sitewide links to a minimum.

#### Links

**6.11 "Website by" credits are `nofollow`.** A followed credit repeated on
every page of a client site is the textbook footer link scheme. Branded anchor
text does not change that.

#### Deploys and data

**6.12 A release is not done until its data is in production.** If a feature's
pages read from a table, the release checklist includes the step that fills
that table on production, and someone confirms a live page shows the data.
"Deployed" means the code; it says nothing about the database.

**6.13 Pages that depend on data must disappear from links and sitemaps when
the data is missing.** Guard the links and the sitemap entries with the same
"does the data exist" check the page uses, so a missing step degrades to absent
rather than to 404s Google is told about.

**6.14 After every deploy, fetch every sitemap URL, not a sample.** Status
codes only (HEAD is enough), plus a crawl of the internal links on the pages
fetched. Sampling eight per section missed 120 dead URLs in a section of
13,120. For very large sections, fetch every URL of every *kind* (each route
pattern) and a large random sample of the rest.

**6.15 Googlebot is a signed-out visitor. Test every gated page signed out,
with the flags as they are in production.** Any "does this visitor have
access" check that only runs for signed-in users fails closed for everybody
else, and that includes Google. Compute access for everyone, and let the access
function decide what a null user gets.

**6.16 One helper per kind of link.** When two kinds of thing share a list
(planets and points, products and bundles), a single `pathFor(item)` that knows
the difference prevents a family of 404s. A full link sweep is what catches the
ones that slip through.

**6.17 Do not send crawlers into sign-in walls by the hundred.** Somnia links
to `/dream-journal/new?entry=...` from 460 public pages, and every one redirects
to the login page. Harmless to visitors, but it spends Google's crawl on
redirects. Point such buttons at a public page, or mark them `rel="nofollow"`.

#### Hosts and canonicals

**6.18 One host per site.** Redirect the hosting provider's own address
(`*.vercel.app`, `*.netlify.app`) to the real domain, on the exact host so
previews still work. Delete old deployments on providers you have left.

**6.19 Check Google's chosen canonical, not just yours.** URL Inspection shows
both. A page where Google picked another URL tells you it sees a duplicate you
did not know about.

#### Monitoring

**6.20 Read Search Console weekly, automatically.** The drop began on 30 August
and was found on 4 October. A weekly pull of impressions by day, with an alert
when a week falls by more than half, would have caught it within days. The
emails Search Console sent (404s on 7 September) were the warning, unread.

**6.21 Keep an SEO change log with dates.** Every commit here was titled
"save", so the timeline had to be rebuilt from diffs. When a drop happens, the
first question is "what changed that week", and the log is the answer.

**6.22 Analytics is not the traffic number.** A consent-gated GA4 counted about
one visitor in eight (Search Console reported 360 Google clicks to Astra; GA saw
44). Use Search Console for search traffic, GA for proportions and behaviour.
GA also showed ChatGPT, not Google, was the largest source: check referrers for
AI assistants, because that traffic is invisible in Search Console.

#### Promises, features and the other engines

**6.23 Check the site's own promises against what it does.** Astra's `/no-ai`
page said "leave the birth time blank and watch what disappears", and its birth
chart page said it "drops the Ascendant rather than assuming noon". The tool
actually cast for midday and still showed the Ascendant and twelve houses. A
claim like that is both a trust signal Google weighs and the first thing a
sceptical visitor tests. Read every "how it works", "about", "no AI" and FAQ
claim, and every description, against the live behaviour.

**6.24 Before promoting a feature, use it end to end as a new user.** Somnia's
dream community was chosen for a promotional post. Live, it was empty, and the
reason was a bug: sharing a dream never created the address it is listed by,
so nothing anyone shared could ever appear. The seeded demo dreams had their
addresses typed by hand, which hid the bug until the demo data was removed
before launch. An empty state on a live feature is a bug report until proven
otherwise.

**6.25 Render stored text through the same formatter everywhere.** Arcana's
card meanings contain Markdown. Three pages printed them in a plain paragraph,
so visitors saw `**A retreat under this card has a purpose and an end**` with
the asterisks. No test caught it; a screenshot did. If content can carry
formatting, every place that shows it goes through the one renderer.

**6.26 Declared image sizes must match the files.** ByteToast's blog thumbnails
declared 1600 by 1200 and were really 800 by 800 squares, so the browser
reserved the wrong shape and the page shifted as they loaded. Read the real
dimensions from the file when you add an image, never copy them from the last
entry.

**6.27 Links from your own sites count for little; earn other people's.** A
portfolio or a blog on the developer's own studio site linking to the project
is natural and safe, but Google discounts links between sites with one owner.
Their real value is as content other people share: a post about how a feature
was built belongs in developer communities and topic forums, and those links
are independent. When writing them: the portfolio piece is the technical case
study, the blog post is the story of one feature, they share no paragraphs or
images, the link goes to the feature page rather than the home page, and the
link text is descriptive and varied.

**6.28 Never send a link to a page that cannot hold the visitor.** Check the
destination is live, populated and working before a post, an email or a social
post points at it. A link to an empty page wastes the link and teaches the
reader not to click the next one.

**6.29 Set up Bing, and let the AI crawlers in.** Bing never dropped these
sites while Google did, and Bing feeds ChatGPT search, which sent more visitors
than Google. Import the sites into Bing Webmaster Tools from Search Console
(no code needed), store an API key for reporting, and set up IndexNow, which
tells Bing the moment a page changes instead of waiting weeks for a crawl: a
key file at `/<key>.txt`, a POST to `api.indexnow.org` whenever content is
saved (after the response, never blocking the save, and only from the live
deployment), and a command that sends the pages whose sitemap `lastmod`
changed. Send every page once, after the first deploy. Check that `bingbot`, `OAI-SearchBot`, `GPTBot`,
`ClaudeBot` and `PerplexityBot` all get a 200 from the live site and are not
blocked by robots.txt or a firewall. Bing's query data also shows long,
conversational searches, the shape AI assistants send when they look things up.

Set up IndexNow on all sites 
   A key file on each site, then the site tells Bing the moment a page is
   added or changed, so Bing recrawls it in minutes instead of weeks. Bing
   also feeds ChatGPT search. Ask Claude to build.

**6.30 If view-source is an empty `<div>`, only Google can read the site.** A
site that renders in the browser sends crawlers an empty page with the home
page's title and description. Google runs the JavaScript eventually; social
previews, most of Bing and the AI crawlers do not. Pre-render every URL at build
time (Part 2, section 22).

**6.31 A seed edit is not a live edit.** The articles were written in seed
files, and the only command that carried the seed to a database dropped every
table first: right for development, impossible on a live site with users. So
every correction to a live article was pasted into the admin by hand, one field
at a time, and a rewrite of twenty articles was a morning of pasting. Give
seeded content a sync command from day one: match by slug, list what differs
with the first changed lines, write only with a flag, and never touch rows the
seed does not own.

**6.32 Audit a section by script, against what a crawler receives.** Read every
URL in the section's sitemap without following redirects and check the tags,
the structured data, the headings, the body links and every link target. The
blog check on these sites found `article:published_time` printing
"[object Object]" on all 68 articles, and links into login pages, neither of
which a browser shows and neither of which any test caught.

---

### 7. Measuring traps

Each of these produced a wrong reading at least once.

1. **Sampling misses concentrated failures.** 120 dead URLs in 13,120 is under
   1%, so an eight-URL sample will almost never hit one. Sweep everything.
2. **Raw HTML shows two `h1`s on pages with a Suspense boundary.** React streams
   the resolved content inside `<div hidden id="S:0">` to replace the fallback.
   The rendered page has one. Skip `div hidden id="S:*"` when counting.
3. **One Lighthouse run is noise.** Scores swung by up to 18 points between
   runs. Take the median of three, mobile, simulated throttling.
4. **The Page indexing report lags the Overview** and carries its own "Last
   update" date. Read that first.
5. **The Search Console API cannot see Manual actions or the Page indexing
   counts.** Those need the screen. URL Inspection through the API has a quota
   of 2,000 a day per property.
6. **Web search APIs are not Google.** Useful for "who ranks for this", not for
   your own positions. Search Console is the authority for those.
7. **GA is consent-gated**, so grepping HTML for the tag proves nothing, and its
   totals undercount.
8. **Decode HTML entities before measuring title and description lengths.**
9. **A stale local server invents site-wide defects.** Measure the live site.
10. **Shop sitemaps that read live from a supplier move on their own.** A change
    in their count is never evidence of anything.
11. **Your threshold is not the search engine's.** A check for descriptions
    under 70 characters found none, and the conclusion drawn was that Bing's
    "too short" warning must be about other pages. Bing flags under about 100
    and wants 150 to 160; the 19 pages it listed were all in the sitemaps.
    Open the engine's own list of URLs before explaining a warning away.
12. **A truncating helper makes everything look in range.** A description
    helper that cuts at 155 with "…" turned thousands of over-long descriptions
    into "155, in range": about 2,600 across the three sites, cut mid-sentence.
    Count descriptions ending in "…" as failures, and build descriptions from
    whole sentences that fit rather than cutting one that does not.
13. **Look at the pages, not just the numbers.** Taking screenshots for a
    portfolio found two live bugs no test or crawl had caught: raw Markdown on
    a card page and an empty community. A crawl measures what a page declares;
    only looking shows what a visitor sees.
14. **Check each analytics property receives only its own site.** Tiny numbers
    can mean a misconfigured tag or just low traffic. GA4's `hostName`
    dimension answers it in one query; on Somnia it confirmed low traffic, not
    a fault.
---

### 8. Pre-launch checklist

Copy into the project and tick off. Items marked **[block]** should stop a
launch until done.

#### Content

- [ ] **[block]** Template similarity measured on rendered pages for every
      family over ~50 pages (section 10). No family over ~50% shared text that
      is meant to be indexed.
- [ ] Shared help text and captions moved off templated pages onto one page.
- [ ] Every indexed page has content specific to it, not just data in a
      template. Pages without it are `noindex` (or Google-only `noindex`), kept
      live if useful to visitors.
- [ ] Thin families identified (median main-content words) and either deepened
      or held out of the index.
- [ ] No text paraphrased from a single source. Facts about real people come
      from verified data.
- [ ] Every claim the site makes about itself (about, how it works, FAQ, "no
      AI", descriptions) checked against what it actually does.
- [ ] Stored text that can carry formatting is rendered through one formatter
      everywhere it appears.
- [ ] **[block]** Every meta description 120 to 156 characters, in whole
      sentences, never cut with an ellipsis, unique, with the page's subject and
      its searched words in the first 100 characters. Indexable template
      families at 50% or below similarity (section 13). A unit test runs every
      template over every row of its data and enforces all of it.

#### Launch shape and links

- [ ] **[block]** Indexed page count is proportionate: a new domain with no
      links launches with its strongest pages, not all of them.
- [ ] A plan for the first external links exists, with named places.
- [ ] "Website by" credits are `rel="nofollow"`.
- [ ] Sitewide links to sister sites kept to one small block, or deferred.
- [ ] Brand name checked against existing search results.
- [ ] Every feature you will promote used end to end as a signed-out visitor
      and as a brand new account; no empty states on anything you link to.
- [ ] Promotional posts and portfolio pieces about the site are distinct from
      each other and link to a feature page with varied, descriptive text.

#### Technical

- [ ] **[block]** Every sitemap URL returns 200 (full sweep, section 10).
- [ ] **[block]** Every internal link on those pages returns 200 or a single
      redirect.
- [ ] No sitemap URL carries `noindex` unless deliberately (and then only
      temporarily, rule 6.5).
- [ ] Every page's canonical is itself (or deliberately another page).
- [ ] The provider's own host (`*.vercel.app` etc.) redirects to the real
      domain. Old deployments elsewhere deleted.
- [ ] `robots.txt` allows the site, disallows only private paths, declares the
      sitemap.
- [ ] Pages that depend on database content are guarded: no links or sitemap
      entries when the data is absent.
- [ ] **[block]** Every page with gated content fetched signed out, with the
      production flags: nothing locked that is meant to be free.
- [ ] Production data loaded for every feature, and one live page per feature
      checked by eye.
- [ ] Lighthouse mobile, median of three, on one page per template. SEO 100,
      CLS near 0.
- [ ] **[block]** If the site renders in the browser: every public URL is
      pre-rendered, and `curl` of each shows its own title, description,
      canonical, `h1` and body text (Part 2, section 22).
- [ ] Declared image width and height match the real files.
- [ ] View source on one article: `article:published_time` is a date, the cover
      image is not `loading="lazy"`, and the JSON-LD dates are real.
- [ ] Every article is linked from at least one page outside the blog, and no
      article links to a page that needs a login.
- [ ] Topic and tag pages have titles of their own; ones with fewer than three
      articles are `noindex, follow`.
- [ ] Structured data validated; warnings you will deliberately leave are
      written down with the reason.
- [ ] Breadcrumbs (Part 2, section 23): every page below a section index shows
      a trail with matching data; every crumb above the current page is a
      sitemap URL with no `#`; no address appears under two names.

#### Measurement in place before launch

- [ ] Search Console verified (domain property), sitemaps submitted, including
      each child sitemap separately for per-section counts.
- [ ] A service account with read-only access to Search Console and GA4, and a
      script that pulls a dated snapshot (section 10).
- [ ] A weekly check of impressions by day, with a threshold that triggers a
      look.
- [ ] An SEO change log started, dated, kept with the project, in a form a
      script can read (section 14).
- [ ] A "before" snapshot of anything you are about to change (descriptions,
      titles, templates), so the after can be compared page by page.
- [ ] Baseline recorded on launch day: sitemap counts, Lighthouse, brand search.
- [ ] Bing Webmaster Tools set up (import from Search Console), sitemaps
      submitted there, an API key stored outside the repo.
- [ ] `bingbot`, `OAI-SearchBot`, `GPTBot`, `ClaudeBot` and `PerplexityBot` all
      get a 200 from the live site.

---

### 9. Warnings that are correct to leave

Search Console will keep emailing about these. Acting on them makes things worse.

- **`shippingRate` missing** when postage is quoted live at checkout. A
  published flat rate that the checkout then contradicts is worse.
- **`review` / `aggregateRating` missing** when there are no reviews. Marking
  up reviews that do not exist can earn a manual action.
- **"Excluded by noindex"** rising, when you noindexed on purpose.
- **404s for URLs you retired**, when nothing links to them. A 404 is the honest
  answer and Google drops them.
- **"Alternative page with proper canonical tag"**: the canonical working.

---

### 10. Tools and methods

The Memento versions live in `Memento/scripts/seo/`: Node or Python, standard library only, nothing to install.

**Google access.** A Google Cloud service account
(`IAM & Admin, Service Accounts`), with the Search Console API and the
Analytics Data API enabled, its JSON key kept outside every repo, added as a
**Restricted** user on each Search Console property and **Viewer** on each GA4
property. Node's built-in `crypto` can sign the JWT, so no Google library is
needed (`scripts/seo/google.mjs`).

**Snapshot.** `node scripts/seo/pull.mjs` saves Search Console by date, query,
page, country, device and page-by-date, plus sitemaps, and GA4 totals, channels,
sources, landing pages, pages, countries, devices and events, as raw JSON in a
dated folder. Search Console keeps only 16 months; the files are the long
record.

**Indexing by section.** `node scripts/seo/inspect-sections.mjs 20` inspects 20
random URLs from each child sitemap and reports indexed, crawled-not-indexed,
and unknown per section. This is what showed which families Google rejected.

**Similarity.** `python scripts/seo/similarity.py <child-sitemap-url> [url-regex]`. For each family: fetch a dozen random pages, take `<main>`,
drop `<script>`, `<style>`, `<svg>` and React's hidden streaming block, lower
case, split into words, build the set of 5-word shingles per page. Report the
median pairwise Jaccard, and the median share of each page's shingles that
appear on at least half the other pages ("shared text"). The second number is
the easier one to explain.

**Sweep.** `python scripts/seo/sweep.py`. Fetch every sitemap URL without following redirects; record status,
`Location`, `robots`, `googlebot`, `X-Robots-Tag` and canonical; collect every
internal `href` from those pages, then HEAD each one not already fetched.
Report anything that is not a 200.

**Speed.** `npx lighthouse <url> --form-factor=mobile --throttling-method=simulate`
three times per URL, median. On Windows, Lighthouse's Chrome teardown can exit
non-zero after the report is written; that is harmless.

**Bing.** Bing Webmaster Tools, Settings, API access, API Key. The key is not
read-only and covers every site on the account, so keep it outside every repo
and call only the `Get` methods (`GetRankAndTrafficStats`, `GetQueryStats`,
`GetPageStats`, `GetCrawlStats`, `GetLinkCounts`). Bing registers sites by
their apex address (`https://example.com/`). `scripts/seo/bing.mjs`, pulled by
`pull.mjs` beside Google.

**Breadcrumbs.** `python scripts/seo/breadcrumbs.py [site]` reads every page in
the live sitemaps and reports, per site: pages with data but no visible trail,
trails whose names differ from their data, a second list, `#` or relative
URLs, crumbs above the current page that are not sitemap URLs, addresses named
two ways, and which page families have no trail. The rules are Part 2, section
23.

**Descriptions.** `python scripts/seo/descriptions.py` reads every live meta
description; `--same-as <earlier folder>` re-reads exactly the same URLs, for a
page-by-page before and after.

**Before and after.** `node scripts/seo/compare.mjs <change-id>` reads a change
from `docs/seo/data/changes.json` (section 14).

**Blog audit.** `python scripts/seo/blog.py [--links]` reads every article in
each blog sitemap and checks status, robots, title length, description length,
canonical, `og:image`, `og:type`, the Article and BreadcrumbList data, one
`h1`, heading count, word count, body links to the site's own pages, image alts
and dashes; `--links` also fetches every link in every article body. Writes
`blog.json` into the day's data folder.

**Screenshots of live pages** (for a portfolio, or just to look). Puppeteer
(`puppeteer-core` driving the installed Chrome) at a 1440 wide viewport. Decline
the cookie banner first (click its "No thanks" button, or set the consent key
in `localStorage`), skip any intro animation (a `sessionStorage` flag, or a
click), scroll the full page once so lazy images load, then capture. Convert
with Sharp to AVIF, WebP and JPG at the widths the destination site expects.
Look at every image before using it: a screenshot will faithfully record a bug.

---

### 11. If it happens anyway: the diagnosis order

1. Confirm it is real with a second source (analytics, not Search Console).
2. Manual actions and Security issues.
3. Crawl stats: responses and host status.
4. URL Inspection on the top pages: fetch, robots, indexing allowed, canonical.
5. Page indexing: which reasons grew, read with the report's own date.
6. Google's update history for the dates.
7. The change log for the week before: deploys, data, links, hosts.
8. Indexing by section, to see which families were rejected.
9. Similarity by family, to see which families are templates.
10. A full sweep for dead URLs and broken links.

Steps 1 to 6 decide whether it is a penalty, a technical fault or a judgement.
Steps 7 to 10 find what the judgement is about.

---

### 12. The full sweep, 4 October 2026, for reference

What a full sweep looks like, and the baseline to compare the next one with.

| Site | Sitemap URLs fetched | Not 200 | Internal links checked | Broken |
| --- | --- | --- | --- | --- |
| Astra | 1,595 (every URL except the 13,000 figures, plus 300 of those at random) | 120, the placement hubs | 531 | 4 (`/planets/<point>`) |
| Arcana | 1,399 (all) | 0 | 34 not already in the sitemap | 1 (`/premium`, from the locked lessons) |
| Somnia | 1,874 (all) | 0 | 906 | 0 (460 redirect to sign in) |

No sitemap URL on any site carried a `noindex`, and every canonical pointed at
its own page.

---

### 13. Meta descriptions: the rules, and how they went wrong

Set on 4 October 2026 after measuring all three sites. Detail and the code
pattern are in Part 2, section 1.

**The range: 120 to 156 characters.**

| Source | Says |
| --- | --- |
| Google | No limit; truncated to fit the device (about 155 to 160 on desktop, about 120 on mobile). Unique per page, not "identical or similar"; programmatic is "encouraged" for large database sites if "human-readable and diverse"; no keyword lists |
| Bing | Aim for 150 to 160; anything under about 100 is flagged too short |
| Yoast | Too short under 120, too long over 156 |

Google shows its own text instead of the description about two thirds of the
time (Ahrefs 2020: 62.78%; Portent 2020: 68 to 71%). A description still
matters: on the searches where it is shown, and on Bing.

**What the measurement found on three sites that had all "passed" a 160 cap:**

| Problem | How many | Why it hid |
| --- | --- | --- |
| Under 120 | 168 under 100, 728 at 100 to 119 | A minimum was never set |
| Cut mid-sentence with "..." | about 2,600 | The helper truncated at 155, so every one measured in range |
| Template that only swaps a name | daily horoscopes 96% alike, card topics 88%, wedding months 85%... | Unique checks only catch exact duplicates |
| The searched words missing | e.g. "earthquake dream meaning" on a page whose description never says earthquake; "<name> star sign" (20% of celebrity searches) never answered | Nobody compared descriptions with Search Console queries |
| Wrong | two shops listing products they do not sell; a tarot contact page about "charts"; "the the Moon retrograde" | Nobody read them |

**The rules that came out of it:**

1. 120 to 156, whole sentences, never an ellipsis. Offer several versions,
   longest first, take the first that fits.
2. The page's subject, in the words people search, in the first 100
   characters. Check the page's top queries in Search Console.
3. Put a real fact from the page in: a date, a count, the card's own meaning,
   the person's star sign. That is what keeps a family under 50% similar.
4. Accurate to the page, and only what the page says.
5. A unit test over every row of every template, failing on all of the above.
6. Admin-typed descriptions bypass the templates; keep them in range by hand
   or validate the admin field.

**What the second pass changed, as numbers.** Families at 85 to 96% similar
came down to 8 to 43%, by putting the page's own facts in (the sign's dates and
ruler, the card's meaning for that topic, the month's computed good days, the
person's zodiac sign). The share of top pages whose description carried the
words of their top Search Console query went from 37 of 60 to 58 of 60 (Astra),
49 to 54 of 60 (Arcana) and 49 to 75 of 80 (Somnia). The method that found
both problems: export every description the code produces, measure each family,
and set each page beside its own queries.

---

### 14. Measuring a change over time

A change is only an improvement if a later reading shows it. On sites with
little traffic and a collapse in the middle, that takes care, not just a
before-and-after of clicks.

**Every change goes in a machine-readable log** (`docs/seo/data/changes.json`):
an id, the sites, the date it went live, which pages it touched, what it is
expected to do, the metric, and when to check. Commit messages like "save" make
this impossible to rebuild later.

**Snapshot before you change anything.** For descriptions:
`python scripts/seo/descriptions.py` saves every live description; after the
deploy, `--same-as <before folder>` re-reads exactly the same pages so the two
can be compared page by page. For other changes, the regular
`node scripts/seo/pull.mjs` snapshot is the before.

**Compare changed pages against unchanged ones, inside position bands.**
`node scripts/seo/compare.mjs <change-id>` takes the 28 days before the deploy
and 28 days after a settling period, splits pages into touched and untouched,
and compares click-through rate within position bands (1 to 3, 4 to 10, 11 to
20, 21+). Why both:

- **Changed against unchanged** separates the change from everything else
  happening at the same time (a Google recovery lifts every page).
- **Within position bands** because CTR depends on ranking far more than on
  wording; a page that moved from position 15 to 5 gains clicks whatever its
  description says.

**Do not read small numbers.** The script withholds a verdict until each group
has 1,000 impressions in each window. Below that, record the figures and wait.

**Check on a schedule, and write the result down** in the tracker under the
change, whatever it says. A change that did nothing is worth knowing.

---

## Part 2. How to build the SEO

Everything three live Next.js sites do for search, sharing, structure and
accessibility, written so it can be handed to somebody working on a different
site and applied end to end.

Written from the Memento sites (astrology, tarot, dreams) in August 2026, but
almost none of it is Memento-specific. Where something depends on the stack it
says so.

**Read Part 1 as well.** This part is how the SEO is built; Part 1 is what
happened when all of it was in place and the sites still dropped out of Google
in September 2026, and the pre-launch checklist that came out of it. Doing
everything here is necessary and was not sufficient.

**Stack assumed:** Next.js App Router, React server components, Tailwind. The
principles transfer to any framework; the exact API calls will not.

---

### How to use this on another site

Work down the checklist. Each numbered section below explains the rule, shows
the shape of the fix, and names the trap that makes it go wrong quietly.

**The order matters.** Items 1 to 6 are worth more than everything after them,
because they are the ones search engines actually read. Items 15 and 16 are how
you stop the rest rotting. Items 17 to 21 are small, easy to get wrong, and
invisible when they are.

| # | Area | The one-line version |
| --- | --- | --- |
| 1 | Title and description | Titles to 60 characters; descriptions 120 to 156 in whole sentences, unique, search term first |
| 2 | Canonical URL | Every page declares one, and one URL renders each page |
| 3 | Share images | Declaring `openGraph` without `images` silently kills the inherited one |
| 4 | Structured data | Organization and WebSite sitewide, the right type per page, nothing that is not visible |
| 5 | Headings and landmarks | One `h1`, no skipped levels, one `main`, a working skip link |
| 6 | Sitemaps | Split by section, drop empty ones, tell the truth about `lastmod` |
| 7 | robots.txt | Allow the site, disallow the API, point at the sitemap |
| 8 | Internal linking | No orphans, and hubs linked from their own children |
| 9 | Images | Real dimensions, honest `alt`, and a decorative image says so |
| 10 | ARIA | Only where HTML cannot say it, and never a name that lies |
| 11 | Duplicate and thin content | One URL per page, and no page that exists only to exist |
| 12 | Content quality | Sources, dates, and a named position beat volume |
| 13 | Core Web Vitals | Measure the page, not the component |
| 14 | Copy rules | Whatever house style is, enforce it on the RENDERED page |
| 15 | An automated content audit | The whole of the above, run against the built site |
| 16 | Tests that hold it | Assertions on shape, so a new page cannot skip the rules |
| 17 | The document shell | `lang`, viewport, theme colour, icons, manifest |
| 18 | Rendering and crawlability | If a crawler sees the fallback, the page is the fallback |
| 19 | Pagination, filters and search | Each state gets its own canonical, or none of them rank |
| 20 | 404s and redirects | A real 404 status, and a permanent redirect for every URL you retire |
| 21 | Analytics and consent | Measure without breaking the page or the law |
| 22 | Client-rendered sites | If view-source is an empty `<div>`, only Google can read you: pre-render every URL |
| 23 | Breadcrumbs | One list builds the trail and its data; every crumb above the page is a real page, with one name everywhere |

---

### 1. Title and description

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

### 2. Canonical URL

Every page declares one:

```js
export const metadata = {
  alternates: { canonical: '/dream-meanings/teeth' },
};
```

Relative is fine when `metadataBase` is set (see item 3). Set `metadataBase`
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
// An archive entry reached through the generic list is redirected to its own
// wing rather than rendered twice.
if (entry.category === 'creature') redirect(creaturePath(entry.slug));
```

---

### 3. Share images, and the trap that costs you all of them

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
block, and fails when one has no `images` and no spread default. See item 16.

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

### 4. Structured data

Use JSON-LD in a `<script type="application/ld+json">`. Not microdata.

**Sitewide, in the root layout:**

- `Organization`: name, url, logo, `sameAs` for real social profiles, and
  `contactPoint` if you have a real one. Do not invent profiles; an unregistered
  handle in `sameAs` is a broken claim.
- `WebSite`, with `potentialAction` `SearchAction` if the site has a search.

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
  true. See item 6 on lying with dates.
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

Centralise the builders so a page cannot invent a shape:

```js
export function articleJsonLd({ headline, description, path, image,
  datePublished, dateModified, articleSection, keywords, sources }) { … }
export function collectionPageJsonLd({ name, description, path, items }) { … }
export function faqJsonLd(items, canonical) { … }
```

---

### 5. Headings, landmarks and semantic HTML

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

### 6. Sitemaps

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

**Tell the truth with `lastmod`.** It is tempting to stamp `now` on everything
because the sitemap regenerates hourly. Do not: a site whose every page claims to
have changed an hour ago teaches Google the field is worthless, and it then
ignores it for the pages where it **is** true, which are the ones you care about.

```js
const now = new Date();
const EVERGREEN = new Date('2026-08-14T00:00:00.000Z');
// Content that genuinely moves gets `now`. Evergreen reference gets a fixed
// build date. The blog gets its real updatedAt.
```

**Every read falls back to an empty list rather than throwing.** A sitemap that
500s because one query failed is worse than one missing a section: engines treat
a broken sitemap as a signal about the whole site.

**Generate it from the data, not by hand.** A page cannot appear in the sitemap
without existing if the sitemap is built by mapping over the same source the
routes are.

---

### 7. robots.txt

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

### 8. Internal linking

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

**Never link to a page that needs a login.** A crawler and a signed out reader
both get the login page, and the link spends its weight on a redirect. Link the
public page that describes the feature, and name the feature in the text.

---

### 9. Images

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

### 10. ARIA

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

### 11. Duplicate and thin content

**Duplicates:** one URL per page, enforced by redirect (item 2). Watch for
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

### 12. Content quality and E-E-A-T

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

### 13. Core Web Vitals

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

### 14. Copy rules

Whatever the house style is, **enforce it on the rendered page**, not the source.
Content arrives from a database, a generator and a CMS as well as from files, and
a rule checked only in the repository misses three of those four.

The rule here is no em or en dashes in site text, which is a voice decision
rather than an SEO one. Roughly seven thousand were removed in one pass. It
re-arms with every new generator, so the assertion runs against rendered HTML.

---

### 15. An automated content audit

This is the piece that makes everything above stick. Crawl the built site and
check the rendered HTML. Ours runs as `npm run check:content` and reports:

1. **Dashes**, house style, on rendered output.
2. **Near-duplicate pages**: similarity over a threshold, flagged as pairs.
3. **Meta uniqueness**: missing or duplicated titles and descriptions.
4. **Unresolved internal links**: every `href` resolves to a real route.
5. **Orphans**: indexable pages nothing links to.
6. **FAQ markup with no visible question or answer.**
7. **Breadcrumbs**: data only where a trail is visible, the same names in the
   same order, no accidental second list, no `#` in any `item` (section 23).
8. **Raw palette colours**: hard-coded hex that will not follow the theme.

**Run it against the built output, not the dev server.** A stale build produces
site-wide phantom findings. Two real gotchas: it needs the production build
manifest to exist, and a bundler that caches broken routes will serve a stale
page long after the source is fixed. If a finding makes no sense, delete the
build directory before debugging the page.

---

### 16. Tests that hold the line

An audit tells you the state today. Tests stop the next page breaking the rules.
Assert on the **shape** of the source so the rules apply to pages nobody has
written yet:

- Every page exporting `openGraph` also has `images` or spreads the default.
- Every page has a canonical.
- Titles are within the limit; descriptions are within the limit.
- No page emits a `BreadcrumbList` it does not show, or a second one by
  accident.
- Every section name used in a breadcrumb comes from one map, so an address
  cannot be named two ways (section 23).
- Every route in the sitemap builder comes from the same source as the routes.
- Rendered text carries no forbidden characters.

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

### 17. The document shell

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

### 18. Rendering and crawlability

**The question to ask of every page: what does a crawler that runs no JavaScript
see?** Server-rendered output is what gets indexed.

**The trap that cost us a whole section: `<Suspense fallback={…}>`.** A crawler
that does not wait for the boundary to resolve sees the FALLBACK. So:

- `fallback={null}` around a list means the crawler sees an empty page.
- A duplicate of the full list as the fallback is worse: now the page contains
  the same content twice.

Our blog index had a Suspense boundary around the list because the component read
the URL on the client. Once the server read the URL instead, there was nothing
left to suspend on, and the boundary and its fallback both came out. Every
article is now crawlable through the `?page=` links.

Rule of thumb: **Suspense is for something genuinely client-only** (a widget
reading `localStorage`, a payment iframe). It is not for content you want
indexed. If content is inside a boundary, either the fallback must contain the
same links, or the content must move to the server.

Same reasoning applies to anything that renders only after an effect,
`IntersectionObserver` content, and infinite scroll with no paged URLs
underneath it.

### 19. Pagination, filters and search

Any state reachable by a URL parameter needs a canonical decision, and the wrong
one is not to make it.

**Give each page of a list its own canonical**, pointing at itself:

```js
// Both params are read here, so /blog?page=3 gets its own canonical rather
// than every page claiming to be page 1.
alternates: { canonical: blogHref(page, tag, q) }
```

Pointing every page at page 1 tells the engine pages 2 onward do not exist, and
the articles only linked from them go with it. (`rel="next"` and `rel="prev"`
are no longer used by Google and are not worth adding.)

**Filter and sort parameters are different.** They usually produce a subset of an
existing page, so canonical them to the unfiltered page, or the same items rank
against themselves under a dozen addresses.

**Tag and topic pages need a title of their own, and an index rule for the thin
ones.** Every topic page on these blogs carried the blog's own title, and most
held one or two articles (31 of 41 tags on one site held exactly one), so each
was a near copy of the article it listed. Title each one after its topic, and
make it `noindex, follow` below three articles: still crawlable, so the links
count, but not competing with the articles themselves.

**A search results page should be `noindex, follow`.** It is generated on
demand, its content changes with the query, and an indexed search page is a
classic thin-content problem. `follow` keeps the links crawlable.

**If the site has a real search**, declare it so an engine can offer it:

```json
"potentialAction": {
  "@type": "SearchAction",
  "target": "https://example.com/search?q={search_term_string}",
  "query-input": "required name=search_term_string"
}
```

### 20. 404s and redirects

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

`permanent: true` is a 308 (or 301): it passes ranking. A temporary redirect
does not.

**Pick one host and one trailing-slash convention** and redirect the other, or
every page has two addresses. Decide www or bare, http or https, and be
consistent in `SITE_URL`, the sitemap, canonicals and the manifest.

One warning specific to Next: **`trailingSlash: true` breaks catch-all API
routes.** It makes Next 308 an API call to a trailing-slash path that the auth
router cannot match, which reads as a 404 on sign-in and is a horrible thing to
debug. Leave it off.

### 21. Analytics and consent

- **Load the tag after consent, not before.** In the EU and UK, analytics
  cookies need consent first. Use Consent Mode with `analytics_storage` denied
  by default and granted on acceptance.
- **The consent banner must not shift the layout.** A banner that appears after
  first paint and pushes content down is a Cumulative Layout Shift hit on every
  page. Overlay it, or reserve its space.
- **Nothing in the measurement should block rendering.**
- **Check what the tag sends.** A URL containing a token, an email or an order
  reference ends up in a third party's logs. Strip identifiers from the paths
  you report.

### 22. Client-rendered sites (React on Vite, and similar)

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
  `description` field of 120 to 156 characters (Part 2, section 1).
- **Structured data built from fields that do not exist.** `datePublished`
  fell back to the moment of rendering, so every post claimed to be published
  today; the author fell back to the company; `og:image` pointed at a file that
  was not there.
- **A sitemap from a hand-written list.** Only the fixed pages, none of the
  blog posts or portfolio items, plus a route that no longer existed.
- **Imports that differ only in capital letters** (`Constants.js` against
  `constants.js`). They work on Windows and fail on a Linux build server.
- **Declared image sizes that do not match the files** (Part 1, rule 6.26).

**Done means:** for every public URL, `curl` returns its own title,
description, canonical, `h1` and body text; the sitemap lists every
data-driven page; an unknown URL returns a 404 status with the real 404 page;
and the `.htaccess` sends only real routes to `index.html`.

---

### 23. Breadcrumbs

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
| Internal links | The visible trail's links are crawled and "treated as normal links" (Google's Mueller and Illyes). This is the larger benefit: every page links up to its section, so each hub is linked from all its children (item 8) |
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
    (item 15) and the tests (item 16), assert that:
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
every rule above (section 10 of Part 1).

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

### Things you will be tempted to add, and probably should not

Worth stating, because an audit tool will flag every one of these as missing and
they are all wrong for most sites.

- **`hreflang`.** Only for a site that genuinely has the same page in more than
  one language or region. On a single-language site it is noise, and a
  self-referencing `alternates.languages` block that points at itself is worse
  than nothing.
- **An RSS feed**, unless somebody asked for one. It is a maintenance surface
  with a real cost and close to no SEO value; it is a reader feature, so add it
  when a reader wants it.
- **`rel="next"` and `rel="prev"`.** Google stopped using them in 2019.
- **Keywords meta.** Ignored since 2009.
- **A separate mobile URL, or AMP.** Both are dead.
- **`changeFrequency` and `priority` in the sitemap.** Both are hints nobody
  acts on. `lastmod` is the one field that is read, which is exactly why it has
  to be true.
- **Marking up a rating, a price or an FAQ that is not on the page.** Every one
  of these is a manual-action risk rather than a missed opportunity, so the
  downside is not symmetrical.

---

### The order to do this in, on a site that has none of it

0. **View source on three pages and read what is actually there.** If the
   content is not in the HTML, nothing below this line matters, and every audit
   you run afterwards will measure the wrong document. Section 18. If the
   body is one empty `<div>` (a site that renders in the browser), pre-render
   it first: section 22.
1. **Set `metadataBase`, and a default OG object.** Then fix every page that
   declares `openGraph` without `images`. This alone usually recovers more than
   everything else combined.
2. **Give every page a unique title, description and canonical**, including each
   page of a paginated list.
3. **Add Organization and WebSite JSON-LD sitewide**, then the right per-page
   type and a breadcrumb trail (section 23) for your three or four biggest
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
11. **Then** the audit script, and **then** the tests.

Steps 0 to 2 are most of the value. Everything after step 6 is protecting it.

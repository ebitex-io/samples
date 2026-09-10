# Northwind Coffee

A speciality coffee roaster's website — a catalogue, brew guides, store list and wholesale enquiry
form — built on [ebitex](https://ebitex.io) Content.

It is a **static site**: Vite, React and TypeScript, talking to the Content Delivery API from the
browser with `@ebitex/content-sdk`. There is no server of our own anywhere in it. That is a real
choice rather than a simplification — a content-driven marketing site is mostly cacheable reads, and
a static bundle on a CDN is the cheapest, fastest and least breakable way to serve those. The price
is that a crawler which does not run JavaScript sees only the shell, which is why a server-rendered
sibling sample is planned.

**Every page on this site is resolved from the CMS.** There is exactly one route in the whole app,
matching everything, and what lives at a path is a question only the CMS answers. Publishing a page
makes it live; no code changes and nothing is redeployed.

## What it teaches

| Area | Where to look |
|---|---|
| The whole loop: Contract → Component → Template → Experience node → renderer | `content-model/model.mjs`, `src/presentations/page.tsx` |
| One route, every page — CMS-resolved routing with no page routes at all | `src/App.tsx`, `src/pages/ContentPage.tsx` |
| Renderer-by-convention: file name *is* the Template's external id | `src/lib/content.ts`, `src/presentations/` |
| A whole content model as readable data | `content-model/model.mjs` |
| Modifiers: mandatory, localizable, enumerable, personalizable | `content-model/model.mjs`, the `coffee` Contract |
| Blobs, and why alt text belongs on a Contract | `src/components/CmsImage.tsx` |
| Inline versus referenced content | `content-model/values.mjs` |
| Taxonomy: closed sets read live, not frozen | `src/components/CategoryTags.tsx` |
| Streams: a page whose content is a query | `content-model/model.mjs`, `src/components/CoffeeIndex.tsx` |
| Real facets — counts computed against the other active filters | `src/components/CoffeeIndex.tsx` |
| Published paths from a listing, instead of guessed URLs | `src/lib/originPaths.ts` |
| RichText with an embedded figure | `content-model/model.mjs`, `src/presentations/figure.tsx` |
| A query versus an authored list, and when each is right | `src/presentations/guide-index.tsx` |
| Embedding an ebitex Form — the suite over its own public surface | `src/presentations/form-embed.tsx` |
| Site chrome as content, addressed by external id | `src/lib/siteChrome.ts`, `src/components/NavLinks.tsx` |
| A sitemap built at deploy time, and why the SDK ships no route | `scripts/sitemap.mjs` |
| Browser-safe versus server-side keys, and what `VITE_` decides | `scripts/sitemap.mjs`, README step 4 |

More arrives with each tutorial step; this table grows with it.

## Prerequisites

- **Node 20 or newer.**
- **An ebitex organization you control.** Not one of ours — there is no shared demo organization,
  by design. You import the content into your own, which is what makes it something you can change.
- **Content must be enabled for your organization.** Content is currently in Early Access behind the
  `app.content` flag. If Content shows as "Coming soon" in Hub, that is what is missing — ask us to
  enable it, and nothing below will work until it is.
- **A Pro allowance.** A new organization gets a **14-day Pro trial**, and that is the window this
  tutorial is written for. See "Which parts fit Starter" below for what happens after it.

## 1. Seed the content

The site has nothing to render until the content model and the content exist in your organization.
Import a bundle from [`seed/`](seed/) through **Content → Configure → Transfer → Import**.

Bundles are named for the tutorial step they match. On `main`, import the highest-numbered one; on a
step tag, import the highest-numbered bundle at or *below* your step:

| Bundle | Import it if you are on |
|---|---|
| `seed/step-03.zip` | `step-01` … `step-06` |
| `seed/step-07.zip` | `step-07` … `step-08` |
| `seed/step-09.zip` | `step-09` … `step-12` |
| `seed/step-13.zip` | `step-13` … (the whole foundation arc) |

Choose **Fresh identity** when the import screen offers it. That is what rewrites every id — and
every reference between them — so the content becomes genuinely yours rather than a copy carrying
another organization's identifiers.

Importing gives every entity fresh identity in your organization. It is your content from that
moment on — rename a Contract, add a field, break something and fix it.

**Then publish it.** An import writes drafts; nothing is delivered until it is published. Publish the
site root and each page from Composer, and publish `site-header` and `site-footer` from the Component
library — those two belong to no page, so no page's publish reaches them.
## 2. Configure

```bash
cp .env.example .env
```

| Variable | Where to get it |
|---|---|
| `VITE_CONTENT_DELIVERY_KEY` | Content → Settings → API Keys, in your own organization |
| `VITE_CONTENT_API_BASE_URL` | Optional. Leave unset unless you are pointing at a non-production API |
| `VITE_CONTENT_SITE_ID` | Optional. Content → Configure → Sites. Saves the SDK one discovery request |

**On the key.** A delivery key is read-only, and for local development an unrestricted one is fine.
A deployed static site is different: the key ships inside the JavaScript bundle where anyone can
read it, so a deployed copy should use a **browser-safe** key restricted to its own origins. Step 13
of the tutorial covers this properly, and the sample deliberately does not gloss over it.

## 3. Run

```bash
npm install
npm run dev
```

If you see "No delivery key configured", `.env` is missing or empty — that page is telling you so on
purpose rather than showing a 404.

## 4. Deploy

```bash
npm run build
```

That produces `dist/`, which any static host will serve. The sample deliberately does not name one:
they all work, and picking a favourite would read as an advertisement rather than as help.

Two things your host does need to be told.

**An SPA rewrite: `/*` → `/index.html`.** Every path on this site is served by the same
`index.html`, because the CMS decides what lives where. Without the rewrite, `/coffees` is a 404
from the host before the app ever runs — the single most common way a static deployment of a
CMS-driven site goes wrong.

**Two different keys.** The one in `VITE_CONTENT_DELIVERY_KEY` ships inside the JavaScript bundle,
where anyone can read it. That is unavoidable for a static site and is why ebitex has **browser-safe
keys**: a key restricted to your own origins is safe to publish, and an unrestricted one is not.
Create one in Content → Settings → API Keys with your site's origins filled in.

The sitemap is generated at build time by `scripts/sitemap.mjs` and needs the *other* kind — a
server-side key, in `CONTENT_DELIVERY_KEY` with no `VITE_` prefix. That prefix is precisely what
decides whether a value reaches the browser. A browser-safe key cannot be used from a build step at
all: it is restricted by `Origin`, Node sends no `Origin` header, and the request is refused with
`origin_denied`. That refusal is the mechanism working, not a misconfiguration.

## Which parts fit Starter

No Content *capability* is restricted by tier. Localization, personalization, contextual values,
workflow, Adapters and streams are available on every plan — there is no feature flag and no quota
key for any of them. What a plan buys is **scale and environments**:

| | Starter | Pro |
|---|---|---|
| Experience nodes | **10** | 200 |
| Components | 50 | 200 |
| Sites | 1 | 3 |
| Authoring / delivery environments | **1 / 1** | 3 / 5 |
| Categories | 100 | 5,000 |
| Blob storage | 1.5 GB | 15 GB |
| Delivery requests / day | 6,000 | 60,000 |

**A Starter organization stops at step 07.** This site is 17 Experience nodes and Starter allows
10. Steps 01–06 build seven of them and fit comfortably; step 07 fills out the catalogue and
crosses the limit three pages in, with a plain refusal naming the quota:

```
403 quota_exceeded — content.max_experience_nodes
This organization has reached its plan's Experience node limit (10). Upgrade to create more.
```

That is not a problem the sample designs around — it is the demonstration. You meet the ceiling
while building something entirely reasonable, which says more than a pricing table does.

The tutorial assumes the **14-day Pro trial** a new organization gets, which is the window it is
written for and comfortably enough for the whole series. Step 19 is the one step that genuinely
needs Pro afterwards, because it uses a second authoring environment and Starter has exactly one.

## Following the tutorial

The [tutorial series](https://ebitex.io/blog) builds this site from an empty organization, one step
at a time, explaining why at each point. Every step is a tag:

```bash
git checkout northwind-coffee/step-07
```

At any step tag the sample builds, typechecks, and runs against an organization seeded with the
nearest bundle at or before that step. It is **not** always visually complete — a step that adds a
Contract before the code that renders it is a legitimate step, and the post says so when that is
where you are.

## Structure

```
src/
  App.tsx              the whole route table: one catch-all
  pages/ContentPage.tsx  resolves the current path against the CMS
  presentations/       one file per Template; the file name is the Template's external id
  lib/content.ts       the only place configuration is read and the SDK client is built
  lib/cmsTypes.ts      the delivered shapes, in TypeScript (hand-written until step 14)
assets/                every image this repo ships, and the script that generates them
content-model/         the content model as data. Internal tooling: read it, do not run it
seed/                  portable export bundles, one per checkpoint step
```

`content-model/` and `seed/` are two routes to the same place. The bundles are the fast path — import
one and the model exists. The script is the *legible* path: the entire model in one readable file,
which you can diff between step tags to see exactly what each step added. It authenticates against
the authoring API with a browser session cookie, which is not a supported integration path, so the
tutorial never asks you to run it.

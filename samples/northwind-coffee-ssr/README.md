# Northwind Coffee (server-rendered)

The same speciality coffee roaster as [`northwind-coffee`](../northwind-coffee), with a server in
front of it.

This is a **Next.js App Router** site consuming `@ebitex/content-sdk`. It is deliberately the same
site, the same content model and the same seed bundles as the static sample — so the pair is one
readable diff about *how you consume Content*, not two unrelated projects. Read the static one
first if you have not: it teaches the content model, and this one assumes it.

A server is not the better choice. It is a different one, with a different set of trade-offs, and
both are fully supported. What it buys and what it costs is the whole subject below.

## What it teaches

| Area | Where to look |
|---|---|
| Resolving on the server, hydrating in the browser | `app/[[...path]]/page.tsx`, `app/content-root.tsx` |
| **Keeping the delivery key off the browser** | `lib/content.ts` (`import 'server-only'`) |
| One client for the life of the process — and why a module-level `const` is not one | `lib/content.ts` |
| Personalization that travels with the request | `lib/buyerType.ts`, `lib/visitor.ts` |
| Links without a second query (`referencePaths`) | `presentations/card.tsx`, `components/OriginCard.tsx` |
| Your own API in front of the CMS, and when you need one | `app/api/coffees/route.ts` |
| Serving a sitemap per request | `app/sitemap.xml/route.ts` |
| **A `<head>` a crawler receives**, with its title from the CMS | `app/[[...path]]/page.tsx`, `lib/pageMetadata.ts` |
| Structured data, social tags, canonical URLs, `robots.txt` | `lib/pageMetadata.ts`, `app/robots.ts` |
| How a publish reaches a long-running server | `app/api/revalidate/route.ts` |
| Live preview, which needs nothing server-side | `app/content-root.tsx` |

## What differs from the static sample

Everything else is a straight port — the renderers are the same files.

| | `northwind-coffee` | this sample |
|---|---|---|
| Delivery key | browser-safe, **ships in the bundle** | server-side only, never sent to the browser |
| Client lifetime | one per tab | one per **process** |
| Renderers registered by | `renderersFromGlob(import.meta.glob(…))` | a static map (`lib/renderers.ts`) |
| Buyer type | `localStorage` | a cookie, read while resolving |
| Not found / redirect | a component / a client navigation | a real `404` / a real `308` |
| Sitemap | generated at build time | served per request |
| `<title>` and `<meta description>` | written by an effect, after the HTML | in the HTML, written before it |

The first row is the one that matters. A static site has no choice but to publish its key — which
is why ebitex has [browser-safe keys](https://ebitex.io) restricted to your own origins. A server
does have a choice, and this sample takes it.

The cost arrives immediately: a browser that cannot hold a key cannot query the Delivery API
either, so the coffee browser talks to `app/api/coffees/route.ts` instead. **A private key means
your interactive queries go through your own API.** Note it is one route, not four — three of the
four calls the static sample makes from the browser are *links*, and a link's address already
arrives with the content (`referencePaths`).

## Prerequisites

- Node 22 or newer
- An ebitex organization you control. A free one is enough — nothing here is tier-gated.

## 1. Seed the content

This sample uses the **static sample's** content. Import
[`../northwind-coffee/seed/final.zip`](../northwind-coffee/seed/final.zip) through
Content → Configure → Transfer, in your own organization. If you already ran `northwind-coffee`,
you are done — point this sample at the same organization.

## 2. Configure

    cp .env.example .env.local

| Variable | Where to get it |
|---|---|
| `CONTENT_DELIVERY_KEY` | Content → Configure → Delivery. **Leave it unrestricted** — it never reaches a browser, and an origin-restricted key would be refused here, because a server sends no `Origin`. |
| `CONTENT_SITE_ID` | Content → Configure → Sites. Required: the API infers the site from a request's hostname, and this server's hostname is the app's, not the site's. |
| `SITE_ORIGIN` | This site's own public origin (`https://northwind.example`) — **not** the API's. It makes canonical links, `og:image` and the sitemap reference in `robots.txt` absolute, which all three have to be. Required, because `app/robots.ts` is handed no request to derive one from. |
| `NEXT_PUBLIC_FORMS_ORG_SLUG` | Your organization's slug, for the embedded contact form. |

Note which variables carry `NEXT_PUBLIC_` and which do not. The prefix means "inline this into the
browser bundle", so it is on the two values that build an iframe `src` and deliberately not on the
key. That naming *is* the boundary — there is no other mechanism keeping the key server-side except
`import 'server-only'` in `lib/content.ts`, which turns a mistake into a build error.

## 3. Run

    npm install
    npm run dev

## How a publish reaches this site

Not by itself, and this is worth knowing before you wonder why an edit has not appeared.

The SDK caches resolved content in memory, bounded by entry count with **no expiry**. In a browser
tab that is invisible — the tab closes. In a server process it means a small site never evicts
anything and never sees a publish at all. It is not stale for a while; it is stale until the
process restarts.

`POST /api/revalidate` clears it. Point a webhook at it, or call it from your deploy. It clears
*both* caches — the SDK's and Next's — because clearing either one alone looks like it works and
does not.

## What goes into `<head>`, and where each value comes from

A server-rendered site should put its title and description in the HTML, not write them from an
effect once the browser has already been handed the page. This sample does, and the split between
what the CMS supplies and what the app supplies is the part worth reading.

**The title comes from the CMS.** A Contract declares which of its own fields is its title
(`titleFieldPath` in `content-model/model.mjs`); Content resolves that at publish, freezes it, and
returns it on `GET /path`. So `generateMetadata` reads `result.title` and this app contains no map
from a page to its heading at all — a new kind of page needs no change here. `result.titleSource`
says which step of the ladder answered: `content` for an authored title, `name` for the node's own
editor label, which is the floor when nothing in the Contract chain declares one.

Two things follow that are easy to trip over:

- **A `titleFieldPath` is frozen at publish.** Declaring one changes nothing a reader sees until the
  affected pages are republished. If you add one and the title does not move, that is the expected
  order of events, not a broken deploy.
- The title member is **optional** on the SDK type, because it can genuinely be absent — against an
  older origin, or on a result built locally rather than fetched. Write `result.title ?? fallback`.

**Everything else comes from `lib/pageMetadata.ts`** — the description, the social image and the
JSON-LD — because nothing in the CMS declares those. That file is one pure function keyed by
*Contract*, not by Template: a description is a property of what the content **is**, not of how it
is presented, so two Templates over one Contract describe a page the same way. An unrecognised
Contract simply returns nothing, so a new Template renders a page that describes itself less rather
than a page that breaks.

It is a plain function rather than a hook for a reason worth internalising: `generateMetadata` runs
*before* the render tree exists. That is exactly what lets it write a `<head>` a crawler receives,
and exactly why the `useDocumentMeta` effect this replaced never could.

**Both resolves of a page cost one request.** `generateMetadata` and the page component each call
`resolveLocation`, and the SDK's request cache collapses them — but only because they pass identical
options, which is why `lib/resolveOptions.ts` exists and why nothing else builds them. The locale
and the personalization context are part of the cache key, so a caller that passes a slightly
different context is not an error and not a visible bug; it is silently two requests per page. If
you change this, **count the requests** rather than reading the code and agreeing with it.

### Checking any of this

Read the HTML, never the status code and never the browser:

    curl -s http://localhost:3000/coffees/ethiopia-guji | grep -oE '<title>[^<]*</title>|<meta name="description"[^>]*>'

And when checking whether something is *rendered*, strip the `<script>` tags first. Next ships the
React payload inside them, so a plain `grep` over the whole response finds text that is only data
for the browser — reporting a page as rendered when its body is empty, which is the exact failure
worth testing for.

Two places in this sample where that distinction bites: `app/not-found.tsx` and `app/error.tsx` are
**client-rendered** by Next, so their bodies really are empty in the HTML no matter what they
contain. That is fine and is the reason each file says so in a comment — Next marks a 404
`noindex`, so the one page whose body a crawler should not read is the one page whose body is not
there. The **status codes** are real either way, and that is the claim this sample actually makes.

## What is cached, and what is not

Worth stating rather than leaving to inference, because "bounded by cache TTL rather than by deploy
cadence" is one of the things a server is supposed to buy.

| Response | Posture | Why |
|---|---|---|
| Every HTML page | **Not cached** | Each one reads a cookie (`resolveOptionsFor`) to resolve personalized content, so it is per-visitor by construction. A shared cache must not hold it, and Next marks it dynamic for that reason. |
| `/sitemap.xml` and its shards | `public, max-age=300, stale-while-revalidate=3600` | Identical for every visitor, and a crawler is not in a hurry. `stale-while-revalidate` means a publish shows up on the next crawl rather than the one after it. |
| `/api/coffees` | Not cached | It carries the visitor's filters; the expensive part is already cached upstream in the Delivery API's own response cache, and a second TTL here would add a second staleness window for nothing. |

The uncached HTML is the honest cost of reading a cookie while resolving. A site that does **not**
personalize can cache its pages at the edge and should — that is a decision about the site rather
than about this SDK, and it is the one knob to reach for first if these pages ever need to be
cheaper.

Note what is *not* on the list: nothing here is invalidated by a publish. Freshness comes from the
pages not being cached at all, plus the Delivery API's own purge-on-publish behind them. See
`app/api/revalidate/route.ts` for the one thing this site does hold onto.

## Following the tutorial

Steps are tagged `northwind-coffee-ssr/step-NN`. The series is on
[ebitex.io/blog](https://ebitex.io/blog). This sample has far fewer steps than the static one on
purpose: the content model is already built and already taught, and what is left to explain is the
consumption model.

Every step runs against the same `final.zip` seed — there are no per-step bundles here, for the
same reason.

## Structure

    app/
      [[...path]]/page.tsx   the server component: resolves a path, renders the chrome around it
      content-root.tsx       the 'use client' boundary — where the renderer map lives
      api/coffees/route.ts   this site's own API, for the one genuinely dynamic query
      api/revalidate/route.ts  how a publish gets in
      sitemap.xml/route.ts   the same pure function the static sample calls from a build script
      robots.ts              the only place the sitemap is advertised
      not-found.tsx          the page behind the real 404
      error.tsx              the page behind a Delivery API outage, deliberately self-sufficient
    middleware.ts            routes sitemap shard URLs onto the one sitemap route
    lib/
      content.ts             the one place a client is built
      buyerType.ts           the context bag, shared by the server that reads it and the control that sets it
      renderers.ts           external id → component, as a plain map
      pageMetadata.ts        what each Contract means to a crawler: description, image, JSON-LD
      resolveOptions.ts      the options both resolves of a page share, so the two cost one request
      catalogue.ts           what the browser, this site's API and the page all have to agree on
      catalogueQuery.ts      the catalogue query itself — server-only, one implementation for two callers
      catalogueSeed.tsx      carries the server's first page of results down to the grid
      sitemapPaths.ts        where sitemap shards live, defined once for the index and the routing
    presentations/           one file per Template — ported unchanged from the static sample
    components/              the site's own components

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
    lib/
      content.ts             the one place a client is built, and the only server-only module
      buyerType.ts           the context bag, shared by the server that reads it and the control that sets it
      renderers.ts           external id → component, as a plain map
    presentations/           one file per Template — ported unchanged from the static sample
    components/              the site's own components

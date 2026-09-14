import { NextResponse, type NextRequest } from 'next/server'

import { shardFromPath } from '@/lib/sitemapPaths'

/**
 * Serves sitemap shards from real root-level URLs.
 *
 * (This file used to have a second job: reading the locale prefix off every request and putting it
 * in an `x-locale` request header, because the root layout could see no URL and had to be told
 * which language to declare in `<html lang>`. That job is gone. The layout now lives in the
 * catch-all segment, where it receives the route's params, and it takes the locale from the
 * server's own answer to `GET /path` -- see `app/[[...path]]/layout.tsx`. So nothing in this app
 * parses a locale out of a URL any more, which was the point.)
 *
 * ---- Why this is needed at all ----
 *
 * A sitemap may only contain URLs **at or below its own location**, so shards have to live at the
 * root: one served from `/sitemaps/1.xml` could not list `/about`. But `app/[[...path]]/page.tsx`
 * claims every root path as a *page*, so there is nowhere to add a root-level dynamic route
 * handler for `/sitemap-1.xml`. Rewriting it onto the one sitemap route is the way through.
 *
 * ---- Why middleware and not `rewrites()` in next.config ----
 *
 * Two things went wrong with the config version, both silently, and both worth knowing because
 * neither shows up until a crawler follows the index:
 *
 *   1. A bare array returned from `rewrites()` is `afterFiles`, which runs *after* routing has
 *      looked for a page. The catch-all matches everything, so the rewrite never fired and every
 *      shard 404'd. `beforeFiles` fixes that much.
 *   2. `source: '/sitemap-:shard.xml'` then matched but captured **nothing** — the handler saw an
 *      empty `shard` and answered with the index instead of a shard, with a 200 and the right
 *      content type. A param immediately followed by a literal `.xml` is not a shape this version's
 *      path matcher handles the way it reads.
 *
 * A plain regular expression over `pathname` has neither problem and is easier to check — and it
 * lives in `lib/sitemapPaths.ts`, beside the function that builds the same paths, because the index
 * and the routing have to agree or the index advertises URLs this app does not serve.
 *
 * That is the trade: a path-pattern DSL is shorter until it is wrong, and every one of its failures
 * here was a 200 with the right content type and the wrong document.
 *
 * Northwind has 22 URLs and produces one document, so nothing here fires today. It is wired up
 * because the day it matters is the day a crawler quietly stops.
 */
export function middleware(request: NextRequest) {
  if (shardFromPath(request.nextUrl.pathname) === null) {
    return NextResponse.next()
  }

  // Only the *route* needs changing. The shard number is read back from the original pathname by
  // the handler rather than passed along as a query parameter, because a rewritten request still
  // carries its original URL in `request.url` — so a parameter set here never arrives, which is a
  // silent 200 serving the index in place of a shard rather than an error anyone would notice.
  const url = request.nextUrl.clone()
  url.pathname = '/sitemap.xml'
  return NextResponse.rewrite(url)
}

/**
 * Deliberately no `config.matcher`.
 *
 * A matcher would scope this to sitemap URLs and save a function call on every other request — but
 * a matcher is written in the same path-pattern DSL that already failed twice above, and
 * `'/sitemap-:shard*'` silently matched nothing, so every shard 404'd. The regular expression at the
 * top is the filter, and a non-match returns `NextResponse.next()` before anything else happens.
 *
 * The cost is one regex test per request. The thing it buys is that the filter and the rewrite are
 * the same expression, in one place, in a language with no version-dependent surprises. (With the
 * locale header gone, nothing else needs every request any more, so a matcher is *possible* again —
 * but the DSL's failure mode has not changed, so neither has the decision.)
 */

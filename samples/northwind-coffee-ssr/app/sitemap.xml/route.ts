import { buildSitemapDocuments } from '@ebitex/content-sdk/sitemap'
import { content } from '@/lib/content'
import { shardFromPath, shardPath } from '@/lib/sitemapPaths'
import { DEFAULT_LOCALE, LOCALES, TRANSLATED_PATHS } from '@/lib/locales'

/**
 * `/sitemap.xml`, served per request.
 *
 * This is the same capability the static sample produces at build time, and deliberately the same
 * *surface*: `getSitemap()` for the data and `buildSitemapDocuments` for the XML. The SDK ships no
 * route or handler for this on purpose (spec 544) — serving is hosting, and hosting is the one
 * thing an SDK cannot know about. So the plumbing is this file here, and different plumbing in
 * `scripts/sitemap.mjs` over in the static sample.
 *
 * Reading the two side by side is the whole argument for that decision: the capability is
 * identical, only the plumbing differs, and neither model had to wait for an adapter written for
 * the other one's stack.
 *
 * What a server adds is freshness. The static sample's sitemap is a build artifact, so a page
 * published after the last deploy is missing from it until the next one. This is generated per
 * request, so it is never older than its cache headers.
 *
 * ---- Why `buildSitemapDocuments` and not `buildSitemapXml` ----
 *
 * A sitemap is capped at 50,000 URLs *and* 50 MB. `buildSitemapXml` returns one document and throws
 * past either cap, which this handler previously did not catch — a site that outgrew a single file
 * got a 500 with no explanation. `buildSitemapDocuments` splits it across an index plus shards
 * instead, and below the caps returns a single document byte-identical to what the other function
 * would have produced, so there is nothing to give up by calling it first (spec 699).
 *
 * Northwind has 22 URLs and will not shard. The point of writing it this way anyway is that the
 * page it breaks on is not one anybody sees coming: the byte cap arrives at about 3,100 pages once
 * a site has ten locales, because every URL then carries the full set of alternates.
 *
 * ---- Where the shards live ----
 *
 * At the root, as `/sitemap-1.xml`, `/sitemap-2.xml`, … — the SDK's own defaults, because a sitemap
 * may only contain URLs **at or below its own location** and one served from `/sitemaps/` could not
 * list `/about`.
 *
 * ---- Why `localeUrl` returns `undefined` for most pages ----
 *
 * Supplying `localeUrl` at all is what makes the sitemap carry `hreflang`. It composes nothing: this
 * site is configured `pathPrefix` in Content, so every `path` and `localeSlots` entry `getSitemap()`
 * returns already carries its prefix, and the mapping is the identity -- prefixing again would give
 * `/fr/fr/...`. What is left for `localeUrl` is the decision, and the interesting half is the
 * refusal.
 *
 * `getSitemap()` reports a French path for **every** page, because a locale slot materializes for
 * every node once any node carries a localized slug. Those URLs are real and they work — they serve
 * the French locale, falling back to English copy where nobody has translated it. Advertising them
 * as `hreflang="fr"` would be telling a crawler a French reader will find French there, which for
 * most of this site is not true.
 *
 * Only the consumer can tell the difference, which is why the SDK lets one say so: return
 * `undefined` and that alternate is dropped. A page left with a single alternate declares none at
 * all rather than linking to itself. `lib/locales.ts` holds the list, and this is the only surface
 * that makes the claim — the page's own `<head>` declares none, and says why.
 *
 * Getting them *served* from there is this app's problem rather than the SDK's, and is a rewrite in
 * `next.config.ts`: `app/[[...path]]/page.tsx` already claims every root path as a page, so there is
 * nowhere to add a root-level dynamic route handler. See that file for the approach that looked
 * simpler and silently does not work.
 */
export async function GET(request: Request) {
  if (!content) {
    return new Response('not configured', { status: 503 })
  }

  const site = process.env.CONTENT_SITE_ID
  if (!site) {
    // The API infers the site from a request's own hostname, and this request's hostname is this
    // app's, not the site's. A build step has the same problem and solves it the same way.
    return new Response('CONTENT_SITE_ID is required to build a sitemap', { status: 503 })
  }

  const url = new URL(request.url)
  // The origin the URLs should carry. Behind a proxy this is the forwarded host, not the socket's.
  const origin = process.env.SITE_ORIGIN ?? url.origin

  const result = await content.delivery.getSitemap({ site })

  // Membership is already decided server-side: live pages with a real path, no redirects, no
  // payload-less structural nodes. `exclude` is for decisions about *this deployment* rather than
  // about the content — a staging-only section, say. Northwind has none.
  const documents = buildSitemapDocuments(result, {
    origin,
    shardPath,
    // `node.path`, not `path`. The first argument is the address for *that locale* -- for
    // `/coffees`, which has a French slug, the French call arrives with `/fr/cafes`. The question
    // being asked is about the page, so it keys on the node's own default path, which carries no
    // prefix here (the default locale is bare). Keying on `path` would silently drop exactly the
    // pages that are translated enough to have earned a French address.
    localeUrl: (path, locale, node) => {
      // A slot this site has no UI for. Emitting an English URL under its hreflang would be worse
      // than emitting nothing, and the CMS's locale tree is free to grow ahead of this app.
      const known = LOCALES.find((l) => l.code === locale)
      if (known === undefined) return undefined

      if (known.code === DEFAULT_LOCALE) return path

      return TRANSLATED_PATHS.has(node.path) ? path : undefined
    },
  })

  // One document below the caps, so an unsharded site never looks up anything: `documents[0]` is
  // the index when there are shards and the whole sitemap when there are not, which is exactly why
  // both cases are served by one route with no branch on "did we shard".
  // Read from the *path*, not from a query parameter. A middleware rewrite leaves `request.url`
  // carrying the URL that was actually requested, so anything the rewrite adds to the destination
  // never arrives here — and the symptom is this handler quietly serving the index instead of the
  // shard, with a 200 and the right content type.
  const shard = shardFromPath(url.pathname)
  const document = shard === null ? documents[0] : documents.find((candidate) => candidate.path === shardPath(Number(shard)))

  if (!document) {
    return new Response('not found', { status: 404 })
  }

  return new Response(document.xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      // A crawler is not in a hurry and this is not cheap to generate, so let a shared cache hold
      // it. `stale-while-revalidate` means a publish shows up on the next crawl rather than the
      // one after it, without anyone waiting.
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
    },
  })
}

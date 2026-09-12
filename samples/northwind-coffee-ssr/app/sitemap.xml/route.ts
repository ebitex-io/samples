import { buildSitemapXml } from '@ebitex/content-sdk/sitemap'
import { content } from '@/lib/content'

/**
 * `/sitemap.xml`, served per request.
 *
 * This is the same capability the static sample produces at build time, and deliberately the same
 * *surface*: `getSitemap()` for the data and `buildSitemapXml` for the XML. The SDK ships no route,
 * handler or CLI for this on purpose (spec 544) — serving is hosting, and hosting is the one thing
 * an SDK cannot know about. So the plumbing is thirty lines here, and thirty different lines in
 * `scripts/sitemap.mjs` over in the static sample.
 *
 * Reading the two side by side is the whole argument for that decision: the capability is
 * identical, only the plumbing differs, and neither model had to wait for an adapter written for
 * the other one's stack.
 *
 * What a server adds is freshness. The static sample's sitemap is a build artifact, so a page
 * published after the last deploy is missing from it until the next one. This is generated per
 * request, so it is never older than its cache headers.
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

  // The origin the URLs should carry. Behind a proxy this is the forwarded host, not the socket's.
  const origin = process.env.SITE_ORIGIN ?? new URL(request.url).origin

  const result = await content.delivery.getSitemap({ site })

  // Membership is already decided server-side: live pages with a real path, no redirects, no
  // payload-less structural nodes. `exclude` is for decisions about *this deployment* rather than
  // about the content — a staging-only section, say. Northwind has none.
  const xml = buildSitemapXml(result, { origin })

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      // A crawler is not in a hurry and this is not cheap to generate, so let a shared cache hold
      // it. `stale-while-revalidate` means a publish shows up on the next crawl rather than the
      // one after it, without anyone waiting.
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
    },
  })
}

import type { MetadataRoute } from 'next'

/**
 * `/robots.txt`, and the only place `/sitemap.xml` is advertised.
 *
 * A sitemap nothing points at is a sitemap a crawler has to guess the URL of. This is the pointer,
 * and it is the reason the file exists at all -- the `allow` rule below is what a crawler assumes
 * anyway.
 *
 * `/api/` is disallowed because it is this site's own BFF (see `app/api/coffees/route.ts`): the
 * data it returns is already in the pages a crawler should be reading, so indexing it would be the
 * same content twice, once without any of its markup.
 *
 * ---- Why the origin is configuration rather than derived ----
 *
 * A sitemap reference has to be absolute. Next hands this function no request, so unlike
 * `app/sitemap.xml/route.ts` -- which falls back to the requesting URL's own origin -- there is
 * nothing here to derive one from. `SITE_ORIGIN` is therefore required, and its absence is
 * explicit: no `sitemap` line at all, rather than a relative URL that no crawler will resolve and
 * nothing will report.
 *
 * That variable is the *site's* public origin, not the API's. Behind a proxy the two differ from
 * the socket's host as well, which is the same trap the sitemap route's own comment names.
 */
export default function robots(): MetadataRoute.Robots {
  const origin = process.env.SITE_ORIGIN

  return {
    rules: { userAgent: '*', allow: '/', disallow: '/api/' },
    ...(origin ? { sitemap: new URL('/sitemap.xml', origin).toString() } : {}),
  }
}

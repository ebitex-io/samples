import { NextResponse } from 'next/server'
import { content } from '@/lib/content'
import { COFFEE_STREAM as STREAM } from '@/lib/streams'

/**
 * The coffee browse query, as this site's own endpoint rather than the CMS's.
 *
 * ---- Why this file exists ----
 *
 * The static sample's grid calls the Delivery API straight from the browser, which is correct
 * there: its key is browser-safe (origin-restricted) and ships in the bundle on purpose. This
 * sample's key is server-side only, so a client component cannot hold one -- and that is not a
 * detail to work around, it is the trade. **Once your key is private, anything interactive goes
 * through your own API rather than the CMS's.**
 *
 * What you get back for the inconvenience is a seam you own: the browser now talks to an endpoint
 * you can cache, rate-limit, log, or change the shape of without touching the CMS. This handler
 * uses that immediately -- the grid needs a page of results and two facet counts, which the static
 * sample fetches as three parallel requests from the browser. Here they are one round trip,
 * because a server can fan out on the client's behalf.
 *
 * It stays *thin* on purpose. It forwards filters and returns what the SDK returned; it does not
 * reshape the data, because a BFF that starts transforming content is a second content model.
 */
export async function GET(request: Request) {
  if (!content) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 })
  }

  const url = new URL(request.url)
  const locale = url.searchParams.get('locale') ?? undefined
  const cursor = url.searchParams.get('cursor') ?? undefined
  const limit = Number(url.searchParams.get('limit') ?? 12)

  // Only the filters this stream declares. An allow-list rather than a passthrough: the browser
  // does not get to name arbitrary filter keys on a server-side credential.
  const filters: Record<string, string> = {}
  for (const key of ['roast', 'origin', 'q']) {
    const value = url.searchParams.get(key)
    if (value) filters[key] = value
  }

  try {
    // A `cursor` request is paging an existing result, and its facet counts have not changed --
    // so "load more" costs one query rather than three.
    if (cursor) {
      const page = await content.delivery.queryStream(STREAM, { filters, limit, cursor, locale })
      return NextResponse.json({ items: page.items, nextCursor: page.nextCursor ?? null })
    }

    const [page, roast, origin] = await Promise.all([
      content.delivery.queryStream(STREAM, { filters, limit, locale }),
      content.delivery.getStreamFacet(STREAM, 'roast', { filters, locale }),
      content.delivery.getStreamFacet(STREAM, 'origin', { filters, locale }),
    ])

    return NextResponse.json({
      items: page.items,
      nextCursor: page.nextCursor ?? null,
      facets: { roast: roast.values, origin: origin.values },
    })
  } catch (error) {
    console.error('coffee browse failed', error)
    return NextResponse.json({ error: 'query_failed' }, { status: 502 })
  }
}

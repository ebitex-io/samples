import { NextResponse } from 'next/server'
import { content } from '@/lib/content'
import { catalogueFiltersFrom, PAGE_SIZE } from '@/lib/catalogue'
import { fetchCataloguePage } from '@/lib/catalogueQuery'

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
 * you can cache, rate-limit, log, or change the shape of without touching the CMS.
 *
 * It stays *thin* on purpose. It forwards filters and returns what the SDK returned; it does not
 * reshape the data, because a BFF that starts transforming content is a second content model.
 *
 * ---- What it is no longer the only caller of ----
 *
 * The query itself moved to `lib/catalogueQuery.ts` when the server started rendering the grid's
 * first page. This handler answers *changes* to the filters; the page answers the first question
 * before any HTML is sent. Two implementations of "a page of coffees" would show up as the grid
 * replacing its own contents on hydration, so there is one.
 */
export async function GET(request: Request) {
  if (!content) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 })
  }

  const url = new URL(request.url)
  const locale = url.searchParams.get('locale') ?? undefined
  const cursor = url.searchParams.get('cursor') ?? undefined
  const limit = Number(url.searchParams.get('limit') ?? PAGE_SIZE)
  const filters = catalogueFiltersFrom(url.searchParams)

  try {
    const page = await fetchCataloguePage({ filters, locale, cursor, limit })

    // `facets` is absent for a cursor request and is passed through as absent, not as an empty
    // pair — the grid keeps the counts it already has rather than blanking its own chips.
    return NextResponse.json({
      items: page.items,
      nextCursor: page.nextCursor,
      ...(page.facets ? { facets: page.facets } : {}),
    })
  } catch (error) {
    console.error('coffee browse failed', error)
    return NextResponse.json({ error: 'query_failed' }, { status: 502 })
  }
}

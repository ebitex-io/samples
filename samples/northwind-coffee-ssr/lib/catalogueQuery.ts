import 'server-only'

import { content } from '@/lib/content'
import { COFFEE_STREAM as STREAM } from '@/lib/streams'
import { PAGE_SIZE, type CatalogueFilters, type CataloguePage } from '@/lib/catalogue'

/**
 * The catalogue query itself, run with this site's server-side delivery key.
 *
 * ---- Why it is a function and not just the route handler ----
 *
 * It has two callers that want the same answer at different moments: `app/api/coffees/route.ts`,
 * when the browser changes a filter, and `app/[[...path]]/page.tsx`, for the first page of results
 * before any HTML is sent. Those two producing *different* results — a different page size, a
 * different filter allow-list — would show up as the grid visibly replacing its own contents on
 * hydration, which is worse than not server-rendering it at all.
 *
 * ---- The fan-out, and when it is skipped ----
 *
 * A first request needs a page of results and two facet counts. The static sample makes those as
 * three parallel requests from the browser; here they are one round trip, because a server can fan
 * out on the client's behalf. A `cursor` request is paging an existing result and its facet counts
 * cannot have changed, so "load more" costs one query rather than three.
 */
export async function fetchCataloguePage(options: {
  filters: CatalogueFilters
  locale?: string
  cursor?: string
  limit?: number
}): Promise<CataloguePage> {
  if (!content) {
    throw new Error('content client is not configured')
  }

  const { filters, locale, cursor } = options
  const limit = options.limit ?? PAGE_SIZE

  if (cursor) {
    const page = await content.delivery.queryStream(STREAM, { filters, limit, cursor, locale })
    // `facets` is left absent rather than empty. Paging cannot change the counts, so they are not
    // re-asked — and an empty pair would be a claim that there are none, which would blank the chips.
    return { items: page.items, nextCursor: page.nextCursor ?? null }
  }

  const [page, roast, origin] = await Promise.all([
    content.delivery.queryStream(STREAM, { filters, limit, locale }),
    // Every request carries the *same* active filters. The facets endpoint excludes a facet's own
    // dimension server-side, so asking for roast counts while a roast is selected still returns
    // every roast — which is what lets someone switch selection rather than having to clear first.
    content.delivery.getStreamFacet(STREAM, 'roast', { filters, locale }),
    content.delivery.getStreamFacet(STREAM, 'origin', { filters, locale }),
  ])

  return {
    items: page.items,
    nextCursor: page.nextCursor ?? null,
    facets: { roast: roast.values, origin: origin.values },
  }
}

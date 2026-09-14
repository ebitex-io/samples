import type { ComponentListItem, StreamFacetValue } from '@ebitex/content-sdk'

/**
 * The parts of the catalogue query that both sides have to agree on.
 *
 * There are three sides now, not two: the browser (`components/CoffeeGrid.tsx`), this site's own
 * endpoint (`app/api/coffees/route.ts`), and — since the server started rendering the first page —
 * the page itself (`app/[[...path]]/page.tsx`). Anything all three need is here, and nothing here
 * touches the SDK or the network, so a client component can import it.
 *
 * The server-only half is `lib/catalogueQuery.ts`.
 */

/** How many coffees a page of results holds. Shared so the server's first page is the same size the client would have asked for. */
export const PAGE_SIZE = 12

/**
 * The filters this stream declares, named once.
 *
 * An allow-list rather than a passthrough, and it is load-bearing in two different places for two
 * different reasons: the endpoint uses it so the browser cannot name arbitrary filter keys on a
 * server-side credential, and the page uses it so a query string carrying anything else still
 * produces the same seed the client would have asked for.
 */
export const CATALOGUE_FILTER_KEYS = ['roast', 'origin', 'q'] as const

export type CatalogueFilters = Record<string, string>

export interface CatalogueFacets {
  roast: StreamFacetValue[]
  origin: StreamFacetValue[]
}

export interface CataloguePage {
  items: ComponentListItem[]
  nextCursor: string | null
  /**
   * Absent on a cursor request, which is not the same as empty: paging cannot change the counts, so
   * they are not re-asked. An empty pair would blank the chips, so absence has to be representable.
   */
  facets?: CatalogueFacets
}

/** What the server prefetched, and the question it answers — see `catalogueSignature`. */
export interface CatalogueSeed {
  items: ComponentListItem[]
  nextCursor: string | null
  facets: CatalogueFacets
  signature: string
}

/** The declared filters present in a query string, whatever else it carries. */
export function catalogueFiltersFrom(
  query: Record<string, string | string[] | undefined> | URLSearchParams,
): CatalogueFilters {
  const read = (key: string): string | undefined => {
    if (query instanceof URLSearchParams) return query.get(key) ?? undefined
    const value = query[key]
    return Array.isArray(value) ? value[0] : value
  }

  const filters: CatalogueFilters = {}
  for (const key of CATALOGUE_FILTER_KEYS) {
    const value = read(key)
    if (value) filters[key] = value
  }

  return filters
}

/**
 * A stable string naming one catalogue question: these filters, this locale.
 *
 * This exists so the grid can answer *"do I already have data for what is being asked right now?"*
 * rather than *"did I just mount?"*. The distinction is the whole reason the server's work is not
 * thrown away: a first-render flag stops being true one render later, and an effect keyed on the
 * filters would then re-fetch and discard the prefetched page — visibly, as a flash of loading on
 * a page that had already rendered its results.
 *
 * Keys are sorted so two spellings of one question are one string.
 */
export function catalogueSignature(filters: CatalogueFilters, locale: string): string {
  const entries = Object.entries(filters).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  return JSON.stringify([entries, locale])
}

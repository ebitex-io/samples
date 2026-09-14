import type { NavigationResult } from '@ebitex/content-sdk'

/** One language the reader can switch to, and where the current page lives in it. */
export interface LocaleAlternate {
  code: string
  label: string
  href: string
}

/** The addresses the site chrome needs for the current page, all composed by the server. */
export interface PageAddresses {
  /** The front page, in the current page's locale -- `/` in English, `/fr` in French. */
  home: string
  /** The current page in every language this app offers, as the switcher links to it. */
  alternates: LocaleAlternate[]
}

/** What the chrome renders when the addresses could not be read: a working home link, no switcher. */
export const FALLBACK_ADDRESSES: PageAddresses = { home: '/', alternates: [] }

/**
 * Turns one navigation read per locale into the chrome's addresses.
 *
 * ---- Why the switcher needs the server at all ----
 *
 * "The same page, in French" is not something this app can compose. A page with a localized slug
 * lives at `/fr/cafes`, and `/fr/coffees` is not a slow path or a redirect to it -- it is a 404,
 * because once a node carries a French slug its English one is not an address in the French slot.
 * So each locale's address is *asked for*: `GET /nodes` anchored on the page's node id, once per
 * locale, which answers with that locale's path already in this site's URL space (prefixed).
 *
 * Anchored by **id**, not by path, because an id carries no locale and so is the one anchor that
 * can be asked about in any of them. A path anchor under this site is an address: the server reads
 * the locale off it, and refuses a second one beside it.
 *
 * Pure, so it is tested directly; `./pageAddressesQuery.ts` does the fetching.
 */
export function toPageAddresses(
  current: string,
  answers: ReadonlyArray<{ code: string; label: string; result: NavigationResult | undefined }>,
): PageAddresses {
  const alternates = answers.flatMap(({ code, label, result }) => {
    if (result === undefined) return []
    // The page itself where it has a path in that locale, else that locale's front page: a reader
    // who asked for French should land somewhere French rather than nowhere.
    const href = selfPath(result) ?? rootPath(result)
    return href === null ? [] : [{ code, label, href }]
  })

  const mine = answers.find((answer) => answer.code === current)?.result
  const home = (mine === undefined ? null : rootPath(mine)) ?? '/'

  return { home, alternates }
}

function selfPath(result: NavigationResult): string | null {
  return result.nodes.find((node) => node.nodeId === result.anchorNodeId)?.path ?? null
}

function rootPath(result: NavigationResult): string | null {
  return result.nodes.find((node) => node.depth === 0)?.path ?? null
}

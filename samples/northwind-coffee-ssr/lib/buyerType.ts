/**
 * Who the reader is buying for, and how this site tells the CMS about it.
 *
 * Northwind sells two ways -- a bag at a time to people at home, and by the sack to cafés -- and
 * those readers want different things from the same page. The site reports one fact, `buyerType`;
 * the CMS owns what it *means*, in an Audience ("Trade buyers" is the rule `buyerType equals
 * trade`) that lives in Settings rather than in this file. Widening who counts as a trade buyer is
 * a change to the Audience, on already-published pages, with nothing redeployed here.
 *
 * ---- Why a cookie, and not `localStorage` ----
 *
 * The static sample keeps this in `localStorage`, which is correct there: the browser resolves the
 * page, so the browser's own storage is in the right place at the right time.
 *
 * On a server it is in the wrong place at the wrong time. The page is resolved before any script
 * runs, and `localStorage` is unreadable from the server -- so the first paint would be the
 * default for everybody, corrected only after hydration. That is a visible flash of the wrong
 * words, and for a crawler it is simply the wrong page.
 *
 * A cookie travels *with the request*. The server reads it while resolving, so the very first
 * bytes are already personalized and nothing has to be corrected afterwards. This is the sharpest
 * illustration in the sample of a line the static version could only write in a comment:
 * personalization is a property of the request.
 *
 * No directive, on purpose: the parse is shared by the server component that resolves the page and
 * the client control that changes it, and `'use client'` marks a whole module (see `lib/locales.ts`
 * for where this repository learned that).
 */
export type BuyerType = 'retail' | 'trade'

export const BUYER_COOKIE = 'northwind.buyerType'

/** What the server assumes when the reader has never said. */
export const DEFAULT_BUYER_TYPE: BuyerType = 'retail'

/** A cookie value is arbitrary text from the client; anything but `trade` is the default. */
export function parseBuyerType(value: string | undefined | null): BuyerType {
  return value === 'trade' ? 'trade' : DEFAULT_BUYER_TYPE
}

/**
 * `retail` is sent explicitly rather than omitted. An absent property and a property meaning "not
 * trade" are different things to a predicate, and being explicit means an Audience could later be
 * written for retail readers without every page changing what it sends.
 */
export function contextFor(buyerType: BuyerType): { buyerType: BuyerType } {
  return { buyerType }
}

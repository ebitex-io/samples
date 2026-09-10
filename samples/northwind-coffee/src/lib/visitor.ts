import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react'
import { useSearchParams } from 'react-router'
import type { ContextBag } from '@ebitex/content-sdk'

/**
 * What this site knows about the person reading it, and sends to the CMS as the **context bag**.
 *
 * Northwind sells two ways -- a bag at a time to people at home, and by the sack to cafés -- and
 * those two readers want different things from the same page. So the site sends one property,
 * `buyerType`, and the CMS decides what it means: an Audience named "Trade buyers" is the rule
 * `buyerType equals trade`, and that rule lives in Settings rather than in this file.
 *
 * That split is the point. The site reports **facts it happens to know**; the CMS owns the
 * **meaning**. Widening who counts as a trade buyer -- adding a second property, an order-value
 * threshold, a referrer -- is a change to the Audience, on already-published pages, with nothing
 * redeployed here.
 *
 * ---- On what is *not* here ----
 *
 * There is no tracking, no profile and no identity. The bag is a fact this page already has, sent
 * with a request, used to resolve that request, and gone. `buyerType` is set because someone said
 * so, and cleared because someone said so.
 *
 * A real shop would likely derive it from a signed-in account instead, and the CMS side would be
 * identical -- which is the useful part: personalization is a property of the *request*, so
 * whatever your app knows about a visitor can drive it without the CMS needing to know how you
 * found out.
 */
export type BuyerType = 'retail' | 'trade'

const STORAGE_KEY = 'northwind.buyerType'

// ---- the store ---------------------------------------------------------------------------------
//
// One value, shared by every component that reads it, via `useSyncExternalStore`.
//
// The first version of this file gave each caller its own `useState`, which looks fine and is
// wrong: the switcher in the footer and the page that resolves content are two *different* hook
// instances, so clicking the switcher updated its own copy and localStorage, and the page went on
// resolving against the value it read at mount. The control moved and the words did not.
//
// That is a bug a passing typecheck cannot see and a test with one component cannot see either --
// it needs two consumers on the screen at once, which is to say it needs someone to click it.

let current: BuyerType = read()
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function setBuyerType(next: BuyerType) {
  if (next === current) return
  current = next
  write(next)
  for (const listener of listeners) listener()
}

/**
 * Persisted, because "I buy for a business" is true of a person rather than of a page, and having
 * to say it again on every navigation would be absurd. `?buyer=` overrides and persists, so a link
 * can put someone straight into the trade view -- which is exactly how a wholesale email would.
 */
export function useBuyerType(): [BuyerType, (next: BuyerType) => void] {
  const [params, setParams] = useSearchParams()
  const fromUrl = params.get('buyer')
  const value = useSyncExternalStore(subscribe, () => current)

  useEffect(() => {
    if (fromUrl !== 'trade' && fromUrl !== 'retail') return
    setBuyerType(fromUrl)
    // Consume it: the URL was the delivery mechanism, not the state.
    const next = new URLSearchParams(params)
    next.delete('buyer')
    setParams(next, { replace: true })
  }, [fromUrl, params, setParams])

  return [value, useCallback(setBuyerType, [])]
}

/**
 * The bag itself. Memoized on the value rather than rebuilt per render, because the SDK compares a
 * context by its serialized form to decide whether to re-resolve -- a fresh object every render
 * would still be *equal*, but keeping it stable is cheaper and clearer about intent.
 *
 * `retail` is sent explicitly rather than omitted. An absent property and a property meaning "not
 * trade" are different things to a predicate, and being explicit means an Audience could later be
 * written for retail readers without every page having to change what it sends.
 */
export function useVisitorContext(): ContextBag {
  const [buyerType] = useBuyerType()
  return useMemo(() => ({ buyerType }), [buyerType])
}

function read(): BuyerType {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'trade' ? 'trade' : 'retail'
  } catch {
    // Private browsing, or storage disabled. Retail is the right answer for almost everybody, and
    // a site that threw here would be broken for a reason nobody could see.
    return 'retail'
  }
}

function write(value: BuyerType) {
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // Nothing to do, and nothing worth telling the reader about.
  }
}

'use client'

import { useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { BUYER_COOKIE, parseBuyerType, type BuyerType } from '@/lib/buyerType'

/**
 * The client half of `lib/buyerType.ts`: reading the current value in the browser, and changing it.
 *
 * The static sample needs a `useSyncExternalStore` here, so that the switcher in the footer and the
 * page resolving content agree about a value held in `localStorage`. None of that machinery is
 * needed now, and its absence is the point: **the server already resolved the page against this
 * value**, so there is no second consumer in the browser to keep in step. Setting it is a cookie
 * write plus `router.refresh()`, which asks the server to render again with the new request.
 */
export function useBuyerType(): [BuyerType, (next: BuyerType) => void] {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  // Read from the same place the server read it, so the control cannot disagree with the page.
  const current = parseBuyerType(readCookie(BUYER_COOKIE))

  const set = useCallback(
    (next: BuyerType) => {
      document.cookie = `${BUYER_COOKIE}=${next}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`
      // Not a state update: the words on the page are decided by the server, so the way to change
      // them is to ask for the page again. `refresh()` re-runs the server render for the current
      // URL and reconciles it into the existing tree -- no full navigation, no lost scroll.
      router.refresh()
    },
    [router],
  )

  // `?buyer=` still works as a delivery mechanism for a wholesale email, and is consumed on
  // arrival: the URL carried the instruction, it was never the state.
  const fromUrl = params.get('buyer')
  if (typeof document !== 'undefined' && (fromUrl === 'trade' || fromUrl === 'retail') && fromUrl !== current) {
    document.cookie = `${BUYER_COOKIE}=${fromUrl}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`
    const next = new URLSearchParams(params.toString())
    next.delete('buyer')
    const query = next.toString()
    router.replace(`${pathname}${query ? `?${query}` : ''}`)
  }

  return [current, set]
}

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  return document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${name}=`))
    ?.slice(name.length + 1)
}

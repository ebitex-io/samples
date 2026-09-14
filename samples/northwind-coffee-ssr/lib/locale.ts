'use client'

import { useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { DEFAULT_LOCALE, localePath, splitLocale, type LocaleCode } from '@/lib/locales'

/** The client-side half of locale handling: the hooks. The data and the two pure path functions
 * live in `./locales`, which has no `'use client'` directive so a server component can use them too. */

/**
 * The locale the current URL names.
 *
 * Reads the **pathname**, which is what makes this work in any client component without a prop
 * threaded to it: the locale is part of the address, so anything that can see the address can see
 * the locale. Under the previous `?lang=` scheme this read `useSearchParams()`, which opted every
 * caller into a deopt to client-side rendering that a pathname read does not carry.
 */
export function useLocale(): LocaleCode {
  return splitLocale(usePathname()).locale
}

/**
 * Where a CMS path is served, in the locale currently being read.
 *
 * Every same-site `<Link>` inside the client subtree goes through this. A link that skips it does
 * not break -- it silently drops the reader back into English, which is worse than breaking,
 * because nothing reports it. Server components do the same thing by calling `localePath` with the
 * locale they already resolved.
 */
export function useLocalePath(): (path: string) => string {
  const locale = useLocale()
  return useCallback((path: string) => localePath(path, locale), [locale])
}

/**
 * Switches language while staying on the current page.
 *
 * `replace` rather than a push, so the back button goes back a *page* rather than unwinding a
 * language change nobody thinks of as navigation.
 *
 * The query string is carried across unchanged -- it holds this app's own view state (`?roast=`,
 * `?origin=`, `?q=`) and switching language should not also clear the reader's filters. Under the
 * previous scheme the locale lived in there too, and this function had to edit it; now it only has
 * to leave it alone.
 */
export function useSetLocale(): (code: LocaleCode) => void {
  const router = useRouter()
  const pathname = usePathname()
  const search = useSearchParams()

  return useCallback(
    (code: LocaleCode) => {
      const query = search.toString()
      const { path } = splitLocale(pathname)
      router.replace(`${localePath(path, code)}${query ? `?${query}` : ''}`)
    },
    [router, pathname, search],
  )
}

/** Re-exported so a client component needs one import rather than two. */
export { DEFAULT_LOCALE }

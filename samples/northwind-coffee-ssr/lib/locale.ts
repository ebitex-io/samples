'use client'

import { useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { DEFAULT_LOCALE, LOCALES, type LocaleCode } from '@/lib/locales'

/** The client-side half of locale handling: the hooks. The data lives in `./locales`, which has
 * no `'use client'` directive so a server component can use it too. */

/** The `?lang=` value when it names a locale this site offers, and the default otherwise. */
export function useLocale(): LocaleCode {
  const params = useSearchParams()
  const requested = params.get('lang')
  return LOCALES.some((l) => l.code === requested) ? (requested as LocaleCode) : DEFAULT_LOCALE
}

/**
 * Switches language while staying on the current page.
 *
 * `replace` rather than a push, so the back button goes back a *page* rather than unwinding a
 * language change nobody thinks of as navigation.
 */
export function useSetLocale(): (code: LocaleCode) => void {
  const router = useRouter()
  const pathname = usePathname()
  const search = useSearchParams()

  return useCallback(
    (code: LocaleCode) => {
      const params = new URLSearchParams(search.toString())
      if (code === DEFAULT_LOCALE) params.delete('lang')
      else params.set('lang', code)
      const query = params.toString()
      router.replace(`${pathname}${query ? `?${query}` : ''}`)
    },
    [router, pathname, search],
  )
}

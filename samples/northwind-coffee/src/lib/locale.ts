import { useCallback } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'

/**
 * Which language the visitor is reading.
 *
 * The SDK picks a locale on its own -- it matches `navigator.languages` against the organization's
 * locale tree -- and for most sites that is the right and only behaviour you need. This site adds a
 * switcher on top of it, so a reader can *choose*, and a chosen language has to beat a browser
 * setting or the control does nothing.
 *
 * It lives in the query string rather than in `localStorage` for one reason: a link someone sends
 * you should open in the language they were reading. Nothing else about the URL changes -- there is
 * no `/fr/` path prefix here, because the CMS resolves a path per locale slot and every page in
 * this site keeps its English slug. A site that wanted localized URLs would translate the slugs on
 * its Experience nodes and route on the prefix instead; the content model would be identical.
 */
export const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
] as const

export type LocaleCode = (typeof LOCALES)[number]['code']

export const DEFAULT_LOCALE: LocaleCode = 'en'

/** The `?lang=` value when it names a locale this site offers, and the default otherwise. */
export function useLocale(): LocaleCode {
  const [params] = useSearchParams()
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
  const navigate = useNavigate()
  const { pathname, search } = useLocation()

  return useCallback(
    (code: LocaleCode) => {
      const params = new URLSearchParams(search)
      if (code === DEFAULT_LOCALE) params.delete('lang')
      else params.set('lang', code)
      const query = params.toString()
      navigate(`${pathname}${query ? `?${query}` : ''}`, { replace: true })
    },
    [navigate, pathname, search],
  )
}

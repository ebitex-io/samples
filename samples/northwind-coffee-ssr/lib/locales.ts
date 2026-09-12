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

/**
 * The `?lang=` value when it names a locale this site offers, and the default otherwise.
 *
 * Deliberately a plain function in a module with **no** `'use client'` directive, so the server
 * component that resolves the page can call it. That directive marks a whole *module* as a client
 * boundary -- not just its components -- so a constant exported from one reaches a server component
 * as an opaque client reference rather than as its value. This file learned that the hard way:
 * `LOCALES.some is not a function`, at request time, from a server render. Data and hooks belong in
 * separate modules, and this is the seam.
 */
export function localeFrom(value: string | string[] | undefined): LocaleCode {
  const code = Array.isArray(value) ? value[0] : value
  return LOCALES.some((l) => l.code === code) ? (code as LocaleCode) : DEFAULT_LOCALE
}

/**
 * Which language the visitor is reading.
 *
 * The SDK picks a locale on its own -- it matches `navigator.languages` against the organization's
 * locale tree -- and for most sites that is the right and only behaviour you need. This site adds a
 * switcher on top of it, so a reader can *choose*, and a chosen language has to beat a browser
 * setting or the control does nothing.
 *
 * It lives in the **path**, as a `/fr` prefix, rather than in a query parameter or `localStorage`.
 * Three things follow from that one choice, and they are the reason it is worth the routing:
 *
 *   - a link someone sends you opens in the language they were reading;
 *   - `<html lang>` can be correct, because the locale is part of the route (a Next root layout
 *     receives no `searchParams`, so under a `?lang=` scheme it structurally cannot be);
 *   - each language has one address, so `hreflang` and `canonical` have something to name.
 *
 * The CMS resolves a path per locale slot, so a page whose Experience node carries a French slug is
 * served at its French address -- `/fr/cafes` -- and one that does not keeps its English slug under
 * the prefix, at `/fr/guides`. Both are real, and the second is the ordinary case for a site partway
 * through translating.
 */
export const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
] as const

export type LocaleCode = (typeof LOCALES)[number]['code']

export const DEFAULT_LOCALE: LocaleCode = 'en'

/**
 * The pages that genuinely have a French version, by their CMS path.
 *
 * ---- Why this list has to exist, and has to be here ----
 *
 * The CMS cannot answer this, on purpose. `getSitemap()` reports a `localeSlots` entry for a page
 * when its path *materializes* in that slot -- and a slot materializes for **every** node the
 * moment **any** node in the site carries a localized slug, since a slug resolves override-else-
 * default. So `/fr/guides` is a real, working URL that serves the French locale, and what it serves
 * is English copy, because nobody has translated that page.
 *
 * That is not a gap in the API. A page is routinely translated while keeping its slug, so slug
 * ownership was never a translation signal, and reporting it as one would be an authoritative-
 * sounding answer to a question the data cannot answer. Nothing in Content records whether content
 * has been translated.
 *
 * Which leaves exactly one party who knows: you. `hreflang` is a claim that a reader in that
 * language will find their language there, and advertising a page that falls back to English earns
 * a worse result than advertising nothing. So this list is short and hand-maintained, and read by
 * the one place that declares alternates: `app/sitemap.xml/route.ts`. (The page's own `<head>`
 * declares none, and that file says why.)
 *
 * A bigger site would derive it rather than type it: a category on the Experience node, a field on
 * the Contract, a convention in the slug. All of those are content decisions, which is the point --
 * the question belongs in your model, not in ours.
 */
export const TRANSLATED_PATHS = new Set(['/', '/coffees', '/coffees/ethiopia-guji'])

/**
 * Everything below is a plain function in a module with **no** `'use client'` directive, so the
 * server component that resolves the page can call it. That directive marks a whole *module* as a
 * client boundary -- not just its components -- so a constant exported from one reaches a server
 * component as an opaque client reference rather than as its value. This file learned that the hard
 * way: `LOCALES.some is not a function`, at request time, from a server render. Data and hooks
 * belong in separate modules, and this is the seam.
 */

/** The value when it names a locale this site offers, and the default otherwise. */
export function localeFrom(value: string | string[] | undefined): LocaleCode {
  const code = Array.isArray(value) ? value[0] : value
  return LOCALES.some((l) => l.code === code) ? (code as LocaleCode) : DEFAULT_LOCALE
}

/**
 * Splits a request path into the locale it names and the path the CMS should be asked for.
 *
 * The default locale carries **no** prefix: `/about`, not `/en/about`. One page, one address --
 * serving the same content at two URLs is the problem `canonical` exists to clean up after, and not
 * creating it is cheaper than annotating it.
 */
export function splitLocale(pathname: string): { locale: LocaleCode; path: string } {
  const [, first = '', ...rest] = pathname.split('/')
  const matched = LOCALES.find((l) => l.code === first && l.code !== DEFAULT_LOCALE)

  if (matched === undefined) {
    return { locale: DEFAULT_LOCALE, path: pathname === '' ? '/' : pathname }
  }

  return { locale: matched.code, path: '/' + rest.join('/') }
}

/**
 * The inverse: where a CMS path is served for a given locale.
 *
 * Every same-site link on this site goes through here, which is the only way a prefix scheme stays
 * correct. A link that forgets it does not break -- it quietly drops the reader back into English,
 * which is worse, because nothing reports it.
 */
export function localePath(path: string, locale: LocaleCode): string {
  if (locale === DEFAULT_LOCALE) return path

  return path === '/' ? `/${locale}` : `/${locale}${path}`
}

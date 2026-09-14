/**
 * The languages this site offers, and the one list only this app can know.
 *
 * ---- Where the locale comes from now ----
 *
 * The address. This site is configured `pathPrefix` in Content (Sites -> Manage -> Locale
 * addressing, with `prefixDefaultLocale` off), so `/fr/cafes` is French and `/cafes` is English --
 * and it is the **server** that reads the prefix. The page hands the request path to
 * `resolveLocation` exactly as it arrived, and `GET /path` answers with the locale it resolved
 * (`result.locale`) and a path that already carries its prefix. Every address the API hands back --
 * a page's own path, a redirect's target, a navigation link's `url`, a reference's `paths` -- is
 * already in this site's URL space.
 *
 * Which is why there is no `splitLocale` or `localePath` here any more. This file used to hold
 * both, and every same-site link on the site went through one of them: a link that forgot quietly
 * dropped a French reader into English, and nothing reported it. Once the server composes the
 * addresses there is nothing left for this app to prefix or strip, so there is nothing left to
 * forget -- and an app that kept doing it would now produce `/fr/fr/...`.
 *
 * What stays is what the server cannot tell us: which languages this app has UI for, and which
 * pages are actually translated.
 */
export const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
] as const

export type LocaleCode = (typeof LOCALES)[number]['code']

/**
 * The organization's root locale -- the one an unprefixed address like `/about` is in. Used only
 * as a fallback: when the CMS is unreachable, or a page does not exist and so no resolve reported
 * a locale.
 */
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
 * has been translated -- and moving the locale into the address server-side (spec 712) changed
 * where addresses are composed, not this.
 *
 * Which leaves exactly one party who knows: you. `hreflang` is a claim that a reader in that
 * language will find their language there, and advertising a page that falls back to English earns
 * a worse result than advertising nothing. So this list is short and hand-maintained, and read by
 * the one place that declares alternates: `app/sitemap.xml/route.ts`. (The page's own `<head>`
 * declares none, and `app/[[...path]]/page.tsx` says why.)
 *
 * Keyed by each page's *default* path, which carries no prefix (the default locale is bare here),
 * so it reads the same whichever locale is asking.
 *
 * A bigger site would derive it rather than type it: a category on the Experience node, a field on
 * the Contract, a convention in the slug. All of those are content decisions, which is the point --
 * the question belongs in your model, not in ours.
 */
export const TRANSLATED_PATHS = new Set(['/', '/coffees', '/coffees/ethiopia-guji'])

/*
 * This module has **no** `'use client'` directive, deliberately, and must keep it that way: server
 * components read these constants. That directive marks a whole *module* as a client boundary --
 * not just its components -- so a constant exported from one reaches a server component as an
 * opaque client reference rather than as its value. This file learned that the hard way:
 * `LOCALES.some is not a function`, at request time, from a server render. The client half of
 * locale handling lives in `./localeContext.tsx`, and is a context the server fills in.
 */

'use client'

// Rendered inside the site chrome, which the *server* component renders so it arrives with the
// document. That makes this the boundary: it reads the query string and the locale context, and a
// component a server component renders directly must declare its own directive.
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { useLocale } from '@/lib/localeContext'
import type { LocaleAlternate } from '@/lib/pageAddresses'

/**
 * Choose a language -- and stay on the same page.
 *
 * ---- Where the links come from ----
 *
 * The server. Each one is this page's own address in that locale, read from `GET /nodes` by the
 * page (`lib/pageAddressesQuery.ts`) and handed down, so switching from `/coffees` lands on
 * `/fr/cafes` rather than on `/fr/coffees` -- which would be a 404, because once a page has a French
 * slug its English one is not an address in French at all. Composing the link here is the thing
 * that cannot be done correctly, which is why this component no longer does any of it.
 *
 * Which one is active is the server's answer too: the locale the page resolved in, through
 * `useLocale()`, rather than something read back off the URL.
 *
 * ---- What it adds ----
 *
 * The query string, carried across unchanged -- it holds this app's own view state (`?roast=`,
 * `?origin=`, `?q=`), and switching language should not also clear the reader's filters. And
 * `replace` rather than a push, so the back button goes back a *page* rather than unwinding a
 * language change nobody thinks of as navigation.
 *
 * Real links rather than buttons, now that each language has an address to name: they work with
 * no JavaScript, and a reader can open the other language in a new tab.
 *
 * Most of this site is deliberately untranslated, so switching to French and walking around is the
 * quickest way to see the fallback working -- the header, the front page, the catalogue and one
 * coffee are in French; everything else falls back to English, which is a perfectly ordinary state
 * for a site partway through translating.
 */
export function LocaleSwitcher({ alternates }: { alternates: LocaleAlternate[] }) {
  const current = useLocale()
  const query = useSearchParams().toString()

  // One language is not a choice. This is also what renders when the addresses could not be read.
  if (alternates.length < 2) return null

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Language">
      {alternates.map((locale) => {
        const active = locale.code === current
        return (
          <Link
            key={locale.code}
            href={`${locale.href}${query ? `?${query}` : ''}`}
            replace
            hrefLang={locale.code}
            lang={locale.code}
            aria-current={active ? 'true' : undefined}
            className={
              active
                ? 'rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent'
                : 'rounded-full px-3 py-1 text-sm text-ink-muted hover:text-ink'
            }
          >
            {locale.label}
          </Link>
        )
      })}
    </div>
  )
}

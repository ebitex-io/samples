'use client'

// Rendered inside the site chrome, which the *server* component renders so it arrives with
// the document. That makes this the boundary: it uses useLocale/useSetLocale, and a component a server
// component renders directly must declare its own directive — being imported by a client
// component is what puts a file in the client graph, and the chrome no longer is one.
import { useLocale, useSetLocale } from '@/lib/locale'
import { LOCALES } from '@/lib/locales'

/**
 * Choose a language.
 *
 * Two languages, so two buttons -- a `<select>` would be the right answer at five or six, and this
 * is not. Either way the interesting part is what it does *not* do: it changes one value, and every
 * page, every renderer and every Contract is unchanged by the switch. What arrives from the CMS is
 * simply the French value where one exists and the English one where it does not.
 *
 * Most of this site is deliberately untranslated, so switching to French and walking around is the
 * quickest way to see the fallback working -- the header, the front page, the catalogue and one
 * coffee are in French; everything else falls back to English, which is a perfectly ordinary state
 * for a site partway through translating.
 */
export function LocaleSwitcher() {
  const current = useLocale()
  const setLocale = useSetLocale()

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Language">
      {LOCALES.map((locale) => {
        const active = locale.code === current
        return (
          <button
            key={locale.code}
            type="button"
            onClick={() => setLocale(locale.code)}
            aria-current={active ? 'true' : undefined}
            className={
              active
                ? 'rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent'
                : 'rounded-full px-3 py-1 text-sm text-ink-muted hover:text-ink'
            }
          >
            {locale.label}
          </button>
        )
      })}
    </div>
  )
}

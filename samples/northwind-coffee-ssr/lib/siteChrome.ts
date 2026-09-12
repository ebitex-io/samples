import 'server-only'
import type { ComponentValue } from '@ebitex/content-sdk'

import { content } from '@/lib/content'
import type { HeaderContent, FooterContent } from '@/types/content'

/**
 * The header and footer, fetched from the CMS.
 *
 * Two things here are worth noticing.
 *
 * They are addressed by **external id** -- `site-header`, not a Guid -- so there is nothing to
 * configure per organization or per environment. Import the seed bundle into your own
 * organization and this keeps working, even though every id inside it was rewritten.
 *
 * And they are Components with no Experience node: published, delivered, and living at no path at
 * all. Not everything published is a page.
 *
 * Fetched once per browser session and shared, because the chrome is the same on every page and
 * re-requesting it on each navigation would be a request per click for content that never varies.
 */
const HEADER_ID = 'site-header'
const FOOTER_ID = 'site-footer'

export interface SiteChrome {
  header: HeaderContent | null
  footer: FooterContent | null
}

/**
 * Keyed by locale, because the chrome is translated and a memo that ignored that would serve
 * whichever language happened to be asked for first.
 *
 * The static sample resolves this in a `useEffect`, so its header and footer appear a moment after
 * the page does. Here it is awaited in the server render, which is the whole point: chrome that
 * arrives with the document rather than after it. The memo now spans the *process* rather than a
 * tab, so it is shared across every visitor -- safe, because chrome carries no personalization,
 * and worth knowing because it is the same change of meaning the client's own cache undergoes
 * (docs/content-sdk.md §7).
 */
const inFlight = new Map<string, Promise<SiteChrome>>()

export function loadSiteChrome(locale: string): Promise<SiteChrome> {
  if (!content) return Promise.resolve({ header: null, footer: null })
  let pending = inFlight.get(locale)
  if (!pending) {
    pending = Promise.all([
      resolve<HeaderContent>(HEADER_ID, locale),
      resolve<FooterContent>(FOOTER_ID, locale),
    ]).then(([header, footer]) => ({ header, footer }))
    inFlight.set(locale, pending)
  }
  return pending
}

/**
 * Each half falls back independently. A header that has not been published yet, or whose shape has
 * drifted, leaves the hard-coded fallback in place rather than blanking the site's navigation --
 * chrome is the one thing that must never disappear, because without it there is no way to
 * navigate to the page that would explain what went wrong.
 */
async function resolve<T>(externalId: string, locale: string): Promise<T | null> {
  if (!content) return null
  try {
    const expanded = await content.resolveReference({ provider: 'core', key: externalId }, { locale })
    const value = expanded as ComponentValue<T>
    return value.content ?? null
  } catch {
    return null
  }
}


import { useEffect, useState } from 'react'
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

let inFlight: Promise<SiteChrome> | undefined

export function loadSiteChrome(): Promise<SiteChrome> {
  if (!content) return Promise.resolve({ header: null, footer: null })
  inFlight ??= Promise.all([
    resolve<HeaderContent>(HEADER_ID),
    resolve<FooterContent>(FOOTER_ID),
  ]).then(([header, footer]) => ({ header, footer }))
  return inFlight
}

/**
 * Each half falls back independently. A header that has not been published yet, or whose shape has
 * drifted, leaves the hard-coded fallback in place rather than blanking the site's navigation --
 * chrome is the one thing that must never disappear, because without it there is no way to
 * navigate to the page that would explain what went wrong.
 */
async function resolve<T>(externalId: string): Promise<T | null> {
  if (!content) return null
  try {
    const expanded = await content.resolveReference({ provider: 'core', key: externalId })
    const value = expanded as ComponentValue<T>
    return value.content ?? null
  } catch {
    return null
  }
}

export function useSiteChrome(): SiteChrome {
  const [chrome, setChrome] = useState<SiteChrome>({ header: null, footer: null })

  useEffect(() => {
    let live = true
    loadSiteChrome().then((value) => live && setChrome(value))
    return () => {
      live = false
    }
  }, [])

  return chrome
}

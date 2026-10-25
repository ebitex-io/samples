import { createContentClient, type ContentClient } from '@ebitex/content-sdk'
import { renderersFromGlob } from '@ebitex/content-sdk/react'

/**
 * The one place this app reads its configuration and builds a Content client. `null` when no key
 * is configured, which is the normal state of a fresh clone: every consumer shows the setup page
 * rather than a 404, because "not configured yet" and "that page does not exist" are different
 * messages.
 */
const deliveryKey = import.meta.env.VITE_CONTENT_DELIVERY_KEY

export const content: ContentClient | null = deliveryKey
  ? createContentClient({
      apiKey: deliveryKey,
      baseUrl: import.meta.env.VITE_CONTENT_API_BASE_URL,
      site: import.meta.env.VITE_CONTENT_SITE_ID || undefined,
      cache: { persist: true },
    })
  : null

/**
 * Only the page is a registered Template renderer (`presentations/kit-page.tsx` renders the Template
 * `kit-page`). A page's sections are Component references, not Presentation envelopes, so they are
 * dispatched by their Contract in `kit/Section.tsx` instead.
 */
export const renderers = renderersFromGlob(import.meta.glob(['../presentations/*.tsx', '!../presentations/*.test.tsx']))

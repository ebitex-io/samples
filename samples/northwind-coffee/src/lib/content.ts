import { createContentClient, type ContentClient } from '@ebitex/content-sdk'
import { renderersFromGlob } from '@ebitex/content-sdk/react'

/**
 * The one place this app reads its configuration, and the one place it builds a
 * Content client.
 *
 * The delivery key ships inside the browser bundle -- that is unavoidable for a
 * static site, and it is why ebitex has browser-safe keys: a key restricted to
 * your own origins is safe to publish, and an unrestricted one is not. See the
 * README, step 3.
 */
const deliveryKey = import.meta.env.VITE_CONTENT_DELIVERY_KEY
const siteId = import.meta.env.VITE_CONTENT_SITE_ID

/**
 * `null` when no key is configured, which is the normal state of a fresh clone.
 * Every consumer checks for it and shows the setup page rather than a 404 --
 * "you have not configured this yet" is a different message from "that page
 * does not exist", and conflating them wastes the reader's afternoon.
 */
export const content: ContentClient | null = deliveryKey
  ? createContentClient({
      apiKey: deliveryKey,
      baseUrl: import.meta.env.VITE_CONTENT_API_BASE_URL,
      // Omitted, both resolve themselves: the site from the sole published one
      // (or the one whose hosts match this hostname), the locale from the
      // browser's own languages against the organization's locale tree.
      site: siteId || undefined,
      // A repeat visit paints from localStorage while the network resolve runs.
      cache: { persist: true },
    })
  : null

/**
 * Renderers are registered by convention: the file name is the Template's
 * external id, and the module's default export renders it. `hero.tsx` renders
 * the Template whose external id is `hero`, and nothing has to be wired up.
 *
 * The negative pattern matters -- without it, `page.test.tsx` would be bundled
 * and registered as a Template called `page.test`.
 */
export const renderers = renderersFromGlob(
  import.meta.glob(['../presentations/*.tsx', '!../presentations/*.test.tsx']),
)

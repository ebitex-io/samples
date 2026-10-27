import { createContentClient, type ContentClient } from '@ebitex/content-sdk'
import { ebitexRenderers } from '@ebitex/starter-kit-react/react'

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
 * The kit's one Template renderer. Add Templates of your own beside it (`{ ...ebitexRenderers(), 'my-template': MyTemplate }`), or replace the
 * entry to draw every experience yourself.
 */
export const renderers = ebitexRenderers()

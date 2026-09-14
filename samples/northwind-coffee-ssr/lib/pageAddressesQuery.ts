import 'server-only'

import { content } from '@/lib/content'
import { LOCALES } from '@/lib/locales'
import { FALLBACK_ADDRESSES, toPageAddresses, type PageAddresses } from '@/lib/pageAddresses'

/**
 * The current page's address in every locale this app offers, and the front page in the current
 * one -- read from the CMS, never composed here. See `./pageAddresses.ts` for why they cannot be.
 *
 * One `GET /nodes` per locale, in parallel, each asking for the anchor and its ancestors: the
 * anchor's own path is the switcher's link, and the depth-0 ancestor is the front page. With no
 * `nodeId` (the 404 page, which resolved no node) the anchor is the site root, so every locale gets
 * its front page.
 *
 * These go through the low-level client, which has no cache, so they are real requests on every
 * page render -- two, for two locales, in parallel with nothing else waiting on them but the
 * chrome. That is the honest price of a switcher that lands on the same page: the address is the
 * server's to compose, so it is the server's to be asked.
 *
 * Every failure degrades rather than throws. This is chrome, and chrome is the one thing that must
 * never take a page down: a locale that cannot be read simply drops out of the switcher, and a
 * lookup that cannot run at all leaves a plain `/` home link.
 */
export async function pageAddressesFor(
  locale: string,
  options: { nodeId?: string; siteRootNodeId?: string } = {},
): Promise<PageAddresses> {
  const client = content
  if (!client) return FALLBACK_ADDRESSES

  try {
    const site = options.siteRootNodeId ?? (await client.resolveSite()).rootNodeId
    const answers = await Promise.all(
      LOCALES.map(async ({ code, label }) => {
        try {
          const result = await client.delivery.listNodes({
            site,
            from: options.nodeId,
            include: ['ancestors', 'self'],
            // Legal here, and only because the anchor is a node id, which carries no locale of its
            // own. A path anchor would be an address, and the server would refuse this beside it.
            locale: code,
          })
          return { code, label, result }
        } catch {
          return { code, label, result: undefined }
        }
      }),
    )

    return toPageAddresses(locale, answers)
  } catch {
    return FALLBACK_ADDRESSES
  }
}

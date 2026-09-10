import { content } from '@/lib/content'

/**
 * Where each origin's page lives.
 *
 * Step 05 deliberately left the coffee page unable to link to its origin, because nothing there
 * knew the origin's URL and building one from its name would have been a guess. This is the
 * answer: ask the Delivery API which published node each origin is bound to.
 *
 * `paths: true` is the whole trick -- a listing can return, per item, the published path of every
 * node whose payload binds that Component by reference. The path is a fact the CMS owns, so moving
 * an origin's page updates every link to it with nothing rebuilt.
 *
 * Fetched once per browser session and shared, because it is the same answer for every coffee.
 */
let inFlight: Promise<Map<string, string>> | undefined

export function loadOriginPaths(): Promise<Map<string, string>> {
  if (!content) return Promise.resolve(new Map())
  inFlight ??= content.delivery
    .listComponents({ contract: 'origin', paths: true, limit: 100 })
    .then((page) => {
      const map = new Map<string, string>()
      for (const item of page.items) {
        const path = item.paths?.[0]?.path
        if (path) map.set(item.key, path)
      }
      return map
    })
    .catch(() => new Map<string, string>())
  return inFlight
}

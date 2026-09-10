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
/**
 * Keyed by locale. Every slug on this site is the same in both languages, so both keys hold the
 * same answer today -- but a published path is materialized *per locale slot*, so a site that
 * translated its slugs would get genuinely different maps here, and a memo that ignored locale
 * would send French readers to English URLs. Cheap to be right about; expensive to discover later.
 */
const inFlight = new Map<string, Promise<Map<string, string>>>()

export function loadOriginPaths(locale: string): Promise<Map<string, string>> {
  if (!content) return Promise.resolve(new Map())
  let pending = inFlight.get(locale)
  if (!pending) {
    pending = content.delivery
      .listComponents({ contract: 'origin', paths: true, limit: 100, locale })
      .then((page) => {
        const map = new Map<string, string>()
        for (const item of page.items) {
          const path = item.paths?.[0]?.path
          if (path) map.set(item.key, path)
        }
        return map
      })
      .catch(() => new Map<string, string>())
    inFlight.set(locale, pending)
  }
  return pending
}

import 'server-only'
import { createContentClient, sharedContentClient, type ContentClient } from '@ebitex/content-sdk'

/**
 * The one place this app builds a Content client -- and unlike the static sample's `src/lib/content.ts`,
 * it is a *server* module. `import 'server-only'` makes that a build error rather than a convention:
 * if any client component ever imports this file, the build fails instead of quietly shipping the
 * delivery key to the browser.
 *
 * That is the headline difference between the two samples. A static site has no choice but to publish
 * its key, which is why ebitex has browser-safe (origin-restricted) keys at all. A server does have a
 * choice, so this key is unrestricted and stays here.
 *
 * ---- One client for the life of the process -- and a `const` is not how you get one ----
 *
 * It carries the in-memory cache every request shares. Sharing is safe: the personalization context
 * bag is part of every cache key, so two visitors with different bags can never be served each
 * other's content (docs/content-sdk.md §7).
 *
 * A module-level `const` is **not** one instance here, which is the trap. Next evaluates a server
 * component's graph and a route handler's graph separately, so this module is instantiated twice
 * and each copy gets its own cache. Measured directly: a random id exported from this file read
 * `lpf90s` from the page and `zu4ajc` from `/api/revalidate` in the same server. The consequence is
 * not academic -- `content.invalidate()` called in a route handler clears a cache no page is using,
 * reports success, and changes nothing.
 *
 * `sharedContentClient` is the SDK's answer to exactly that: it pins the instance to a registry on
 * `globalThis`, which is the only kind of pin that survives the module being evaluated twice. This
 * sample used to hand-roll those six lines, and the helper exists because the lines were never the
 * hard part -- knowing you need them is, since the failure reports success.
 */
const deliveryKey = process.env.CONTENT_DELIVERY_KEY

const diagnostics = globalThis as unknown as { ebitexContentId?: string }

function create(): ContentClient | null {
  // Inside the factory on purpose. The factory runs at most once per process, so the id is minted
  // exactly when the client is -- which is what makes "same id" mean "same client" rather than
  // merely "same global". Pinned independently it could agree while the client did not, and the
  // whole point of the value is that it cannot.
  diagnostics.ebitexContentId ??= Math.random().toString(36).slice(2, 8)
  if (!deliveryKey) return null
  return createContentClient({
    apiKey: deliveryKey,
    baseUrl: process.env.CONTENT_API_BASE_URL,
    site: process.env.CONTENT_SITE_ID || undefined,
    // Spec 565. Every reference descriptor in a delivered document carries its target's own
    // published path(s), so a renderer that links to another page reads the answer off the value it
    // already has. The static sample instead fetches a whole-contract listing in a `useEffect`,
    // which works in a browser and renders *nothing* server-side, because no effect runs during a
    // server render. Set once at construction, never per call: the resolved shape is part of the
    // cache key.
    referencePaths: true,
    // Deliberately NOT `cache: { persist: true }`. That layer is localStorage-backed and simply
    // inert in Node; naming it here would imply it does something.
  })
}

// The helper stores presence rather than truthiness, so a genuinely unconfigured site (a `null`
// client) is cached as the answer instead of retried on every request.
export const content: ContentClient | null = sharedContentClient(create)

/**
 * Proves the pin works. Read from a page and from a route handler this must be the same value;
 * before the pin it was not, which is the whole reason it is exported at all.
 */
export const INSTANCE_ID = diagnostics.ebitexContentId ?? 'unset'

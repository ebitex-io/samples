import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { content, INSTANCE_ID } from '@/lib/content'

/**
 * How a publish reaches this site.
 *
 * ---- Why anything is needed at all ----
 *
 * The SDK's in-memory cache is an LRU bounded by entry count with **no TTL** — `maxEntries`
 * defaults to 50 and nothing expires. That is right for a browser tab, which is short-lived. A
 * server is not: one client instance serves every request for the life of the process, so a site
 * with fewer than 50 distinct cache keys never evicts anything and **never sees a publish**.
 *
 * Measured on this sample rather than assumed: with the content edited and published, the Delivery
 * API served the new title immediately while this app went on serving the old one across repeated
 * reloads, indefinitely. The page was not stale for a while — it was stale for good.
 *
 * ---- Two caches, and which one owns what ----
 *
 * There are two, and they are not aware of each other. `content.invalidate()` clears the SDK's, so
 * the next resolve really asks the Delivery API. `revalidatePath('/', 'layout')` clears Next's own
 * render cache, so the next request really re-renders. Clearing one and not the other looks like
 * it works and does not: the SDK would fetch fresh content that Next never asks it for, or Next
 * would re-render using content the SDK still has cached.
 *
 * Point a Content webhook at this route, or call it from your deploy. It is deliberately trivial —
 * the interesting part is that it exists at all, and that it clears **both**.
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET
  if (secret && request.headers.get('x-revalidate-secret') !== secret) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  content?.invalidate()
  revalidatePath('/', 'layout')

  // `instance` is diagnostics worth keeping: if two calls ever report different values, the
  // `globalThis` pin in lib/content.ts has stopped working and this route is clearing a cache no
  // page uses — which is exactly the failure it was written to fix, and it reports success while
  // doing nothing.
  return NextResponse.json({ revalidated: true, instance: INSTANCE_ID, at: new Date().toISOString() })
}

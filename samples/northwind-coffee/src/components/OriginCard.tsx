import { Resolve } from '@ebitex/content-sdk/react'

import type { CoffeeContent, OriginContent } from '@/lib/cmsTypes'

/**
 * The origin summary on a coffee page.
 *
 * `origin` is a *reference*, so the coffee's own document holds only a pointer and the Delivery
 * API expands it. `<Resolve>` renders the expanded content when it is there, and renders nothing
 * when it is not -- an origin that has been unpublished, say. The coffee page still works without
 * it, which is the behaviour to design for: a reference is a promise about identity, never a
 * guarantee about availability.
 *
 * There is deliberately no link to the origin's own page yet. Nothing here knows that page's URL,
 * and guessing one from the origin's name would be exactly the mistake the experience-link field
 * exists to prevent. Step 08 introduces the query that answers it properly, and the link lands
 * then rather than as a string built out of hope.
 */
export function OriginCard({ origin }: { origin: CoffeeContent['origin'] }) {
  if (!origin) return null

  return (
    <Resolve value={origin} fallback={() => null}>
      {(content: OriginContent) => (
        <aside className="mt-10 rounded-2xl border border-line bg-sunken p-6">
          <p className="font-mono text-xs tracking-widest text-ink-muted uppercase">Origin</p>
          <h2 className="mt-2 font-display text-2xl text-ink">{content.name}</h2>
          {content.altitude ? (
            <p className="mt-1 text-sm text-ink-muted">Grown at {content.altitude}</p>
          ) : null}
        </aside>
      )}
    </Resolve>
  )
}

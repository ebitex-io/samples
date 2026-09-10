import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Resolve } from '@ebitex/content-sdk/react'

import type { Coffee, Origin } from '@/types/content'
import { useLocale } from '@/lib/locale'
import { loadOriginPaths } from '@/lib/originPaths'

/**
 * The origin summary on a coffee page.
 *
 * `origin` is a *reference*, so the coffee's own document holds only a pointer and the Delivery
 * API expands it. `<Resolve>` renders the expanded content when it is there, and renders nothing
 * when it is not -- an origin that has been unpublished, say. The coffee page still works without
 * it, which is the behaviour to design for: a reference is a promise about identity, never a
 * guarantee about availability.
 *
 * The link to the origin's own page is not built from its name -- it is looked up. `loadOriginPaths`
 * asks the Delivery API which published node each origin is bound to, so the URL is a fact the CMS
 * owns rather than a string built out of hope. An origin with no published page simply gets no
 * link, which is the same honest degradation as everything else here.
 *
 * `content.note` is where step 15 shows up, and the interesting thing is that nothing here reflects
 * it. It is an ordinary field read off an ordinary document -- but it is declared *contextual*, so
 * the coffee that owns this binding supplied its own value for it and the Delivery API overlaid
 * that onto the shared Origin before handing it over. Open two Ethiopian coffees and the same
 * Component says two different things; open Ethiopia's own page and it says a third, because
 * nothing overrode it there.
 */
export function OriginCard({ origin }: { origin: Coffee['origin'] }) {
  const locale = useLocale()
  const [paths, setPaths] = useState<Map<string, string>>()
  useEffect(() => {
    let live = true
    loadOriginPaths(locale).then((map) => live && setPaths(map))
    return () => {
      live = false
    }
  }, [locale])

  if (!origin) return null
  const path = origin.key ? paths?.get(origin.key) : undefined

  return (
    <Resolve value={origin} fallback={() => null}>
      {(content: Origin) => (
        <aside className="mt-10 rounded-2xl border border-line bg-sunken p-6">
          <p className="font-mono text-xs tracking-widest text-ink-muted uppercase">Origin</p>
          <h2 className="mt-2 font-display text-2xl text-ink">{content.name}</h2>
          {content.altitude ? (
            <p className="mt-1 text-sm text-ink-muted">Grown at {content.altitude}</p>
          ) : null}
          {content.note ? <p className="mt-3 text-ink-muted">{content.note}</p> : null}
          {path ? (
            <p className="mt-4">
              <Link to={path} className="text-accent underline underline-offset-4">
                More about {content.name}
              </Link>
            </p>
          ) : null}
        </aside>
      )}
    </Resolve>
  )
}

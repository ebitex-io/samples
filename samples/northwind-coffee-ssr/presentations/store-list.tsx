import { Resolve, RichText } from '@ebitex/content-sdk/react'
import type { PresentationRenderer } from '@ebitex/content-sdk/react'

import type { Store, StoreList } from '@/types/content'
import { useDocumentMeta } from '@/lib/meta'

/**
 * The `store-list` Template. The smallest page on the site, and the one that shows how little a
 * repeating collection needs: a Contract for the thing, a Contract for the page that holds them,
 * and a list.
 *
 * The stores are inline, because nothing points at a store and no store has a page of its own.
 * The same call as `guide-step`, reached for the same reason.
 */
const StoreListSection: PresentationRenderer<StoreList> = ({ component }) => {
  const { heading, intro, stores } = component.content
  useDocumentMeta(heading)

  return (
    <div className="mx-auto max-w-4xl px-6 py-14">
      <h1 className="font-display text-4xl text-ink sm:text-5xl">{heading}</h1>
      {intro ? (
        <div className="mt-4 max-w-2xl text-lg text-ink-muted">
          <RichText fragments={intro} />
        </div>
      ) : null}

      <ul className="mt-10 grid gap-6 sm:grid-cols-2">
        {stores?.map((store, index) => (
          <Resolve key={index} value={store}>
            {(s: Store) => (
              <li className="rounded-2xl border border-line bg-raised p-6">
                <h2 className="font-display text-2xl text-ink">{s.name}</h2>
                {s.address?.length ? (
                  <address className="mt-3 text-ink-muted not-italic">
                    {s.address.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </address>
                ) : null}
                {s.hours?.length ? (
                  <ul className="mt-4 text-sm text-ink-muted">
                    {s.hours.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                ) : null}
                <p className="mt-4 flex flex-wrap gap-4 text-sm">
                  {s.phone ? (
                    <a href={`tel:${s.phone.replace(/\s/g, '')}`} className="text-accent">
                      {s.phone}
                    </a>
                  ) : null}
                  {s.map?.url ? (
                    <a
                      href={s.map.url}
                      className="text-accent underline underline-offset-4"
                      rel="noreferrer"
                      target="_blank"
                    >
                      Map
                    </a>
                  ) : null}
                </p>
              </li>
            )}
          </Resolve>
        ))}
      </ul>
    </div>
  )
}

export default StoreListSection

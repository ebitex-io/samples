import { Resolve, RichText } from '@ebitex/content-sdk/react'
import type { PresentationRenderer } from '@ebitex/content-sdk/react'

import type { Guide, GuideStep } from '@/types/content'
import { useDocumentMeta } from '@/lib/meta'

/**
 * The `guide` Template.
 *
 * The steps are inline `guide-step` values, so they arrive already resolved inside this guide's
 * own document -- no second request, and no entry in the Component library for a step that belongs
 * to exactly one guide. `<Resolve>` unwraps them anyway, so this renderer would be unchanged if
 * that modelling decision ever went the other way.
 */
const GuidePage: PresentationRenderer<Guide> = ({ component }) => {
  const { heading, summary, equipment, 'total-time': totalTime, steps } = component.content
  useDocumentMeta(heading, summary)

  return (
    <article className="mx-auto max-w-3xl px-6 py-14">
      <p className="font-mono text-xs tracking-widest text-ink-muted uppercase">Brew guide</p>
      <h1 className="mt-3 font-display text-4xl text-ink sm:text-5xl">{heading}</h1>
      {summary ? <p className="mt-4 text-xl text-ink-muted">{summary}</p> : null}

      {equipment?.length || totalTime ? (
        <dl className="mt-8 grid gap-4 rounded-2xl border border-line bg-sunken p-6 sm:grid-cols-2">
          {equipment?.length ? (
            <div>
              <dt className="font-mono text-xs tracking-widest text-ink-muted uppercase">
                You will need
              </dt>
              <dd className="mt-2 text-ink">{equipment.join(', ')}</dd>
            </div>
          ) : null}
          {totalTime ? (
            <div>
              <dt className="font-mono text-xs tracking-widest text-ink-muted uppercase">
                Total time
              </dt>
              <dd className="mt-2 text-ink">{totalTime}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      <ol className="mt-12 space-y-12">
        {steps?.map((step, index) => (
          <Resolve key={index} value={step}>
            {(stepContent: GuideStep) => (
              <li className="grid gap-4 sm:grid-cols-[3rem_1fr]">
                <span
                  aria-hidden
                  className="font-display text-3xl text-accent/60 tabular-nums sm:text-right"
                >
                  {index + 1}
                </span>
                <div>
                  {stepContent.heading ? (
                    <h2 className="font-display text-2xl text-ink">{stepContent.heading}</h2>
                  ) : null}
                  {stepContent.body ? (
                    <div className="mt-3 text-ink-muted">
                      <RichText fragments={stepContent.body} />
                    </div>
                  ) : null}
                </div>
              </li>
            )}
          </Resolve>
        ))}
      </ol>
    </article>
  )
}

export default GuidePage

import { RichText } from '@ebitex/content-sdk/react'
import type { PresentationRenderer } from '@ebitex/content-sdk/react'

import { CtaLink } from '@/components/CtaLink'
import type { StatementContent } from '@/lib/cmsTypes'

/** The `prose` Template, over the same `statement` Contract that `hero.tsx` renders. */
const Prose: PresentationRenderer<StatementContent> = ({ component }) => {
  const { heading, standfirst, body, cta, 'cta-label': ctaLabel } = component.content

  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <h2 className="font-display text-3xl text-ink">{heading}</h2>
      {standfirst ? <p className="mt-3 text-lg text-ink-muted">{standfirst}</p> : null}
      {body ? (
        <div className="mt-5 text-ink-muted">
          <RichText fragments={body} />
        </div>
      ) : null}
      {cta && ctaLabel ? (
        <p className="mt-6">
          <CtaLink link={cta} label={ctaLabel} variant="quiet" />
        </p>
      ) : null}
    </section>
  )
}

export default Prose

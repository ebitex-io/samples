import { RichText } from '@ebitex/content-sdk/react'
import type { PresentationRenderer } from '@ebitex/content-sdk/react'

import { CtaLink } from '@/components/CtaLink'
import type { StatementContent } from '@/lib/cmsTypes'

/**
 * The `hero` Template, over the `statement` Contract.
 *
 * `prose.tsx` renders the very same Contract differently. Neither knows about the other, and an
 * author moves a section between them by changing which Template a section names -- there is no
 * migration, because the content did not change, only its presentation.
 */
const Hero: PresentationRenderer<StatementContent> = ({ component }) => {
  const { heading, standfirst, body, cta, 'cta-label': ctaLabel } = component.content

  return (
    <section className="border-b border-line bg-sunken">
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="font-display text-4xl leading-tight text-ink sm:text-6xl">{heading}</h1>
        {standfirst ? (
          <p className="mx-auto mt-5 max-w-xl text-xl text-ink-muted">{standfirst}</p>
        ) : null}
        {body ? (
          <div className="mx-auto mt-6 max-w-xl text-ink-muted">
            <RichText fragments={body} />
          </div>
        ) : null}
        {cta && ctaLabel ? (
          <p className="mt-8">
            <CtaLink link={cta} label={ctaLabel} />
          </p>
        ) : null}
      </div>
    </section>
  )
}

export default Hero

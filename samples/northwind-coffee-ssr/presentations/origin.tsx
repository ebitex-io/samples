import { RichText, Resolve } from '@ebitex/content-sdk/react'
import type { PresentationRenderer } from '@ebitex/content-sdk/react'

import { CmsImage } from '@/components/CmsImage'
import type { Image, Origin } from '@/types/content'
import { useDocumentMeta } from '@/lib/meta'

/**
 * The `origin` Template. One page per producing country, shared by every coffee from it.
 *
 * `note` is the same contextual field the Origin card on a coffee page renders. Nothing overrides
 * it here -- an Experience node binds the Origin with no contextual values of its own -- so what
 * appears is the value written on the Origin itself. That is what "contextual" means in practice:
 * a default that belongs to the thing, and an override that belongs to one place it is used.
 */
const OriginPage: PresentationRenderer<Origin> = ({ component }) => {
  const { name, country, altitude, summary, image, note } = component.content
  useDocumentMeta(name, country)

  return (
    <article>
      <div className="border-b border-line bg-sunken">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <p className="font-mono text-xs tracking-widest text-ink-muted uppercase">Origin</p>
          <h1 className="mt-3 font-display text-4xl text-ink sm:text-5xl">{name}</h1>
          {note ? <p className="mt-4 max-w-2xl text-lg text-ink-muted">{note}</p> : null}
          {altitude ? <p className="mt-3 text-ink-muted">Grown at {altitude}</p> : null}
        </div>
      </div>

      <div className="mx-auto grid max-w-4xl gap-10 px-6 py-14 md:grid-cols-[2fr_1fr]">
        {summary ? (
          <div className="text-ink-muted">
            <RichText fragments={summary} />
          </div>
        ) : null}
        <Resolve value={image}>
          {(content: Image) => (
            <CmsImage
              file={content.file}
              alt={content.alt}
              className="w-full rounded-2xl border border-line"
            />
          )}
        </Resolve>
      </div>
    </article>
  )
}

export default OriginPage

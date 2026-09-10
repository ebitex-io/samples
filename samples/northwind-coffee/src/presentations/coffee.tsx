import { RichText, Resolve } from '@ebitex/content-sdk/react'
import type { PresentationRenderer } from '@ebitex/content-sdk/react'

import { CmsImage } from '@/components/CmsImage'
import type { CoffeeContent, ImageContent } from '@/lib/cmsTypes'
import { formatPrice, formatWeight } from '@/lib/format'
import { useDocumentMeta } from '@/lib/meta'

/**
 * The `coffee` Template.
 *
 * Two things here are worth reading closely.
 *
 * `tasting-notes` is an ordinary short-text field with the enumerable modifier set, so it arrives
 * as an array of strings. Cardinality is a modifier, never a separate field type -- the same field
 * definition holds one value or twenty.
 *
 * `image` is written inline, so its content is already here and `<Resolve>` returns immediately.
 * Written as a reference instead, the very same code would fetch it. That is the point of
 * `<Resolve>`: the renderer does not need to know which decision the model made.
 */
const Coffee: PresentationRenderer<CoffeeContent> = ({ component }) => {
  const {
    name,
    producer,
    description,
    'tasting-notes': tastingNotes,
    price,
    'weight-grams': weight,
    image,
  } = component.content

  useDocumentMeta(name, tastingNotes?.join(', '))

  return (
    <article className="mx-auto grid max-w-5xl gap-12 px-6 py-16 md:grid-cols-2">
      <div className="overflow-hidden rounded-2xl border border-line bg-sunken">
        <Resolve value={image}>
          {(content: ImageContent) => (
            <CmsImage
              file={content.file}
              alt={content.alt}
              loading="eager"
              className="aspect-4/3 w-full object-cover"
            />
          )}
        </Resolve>
      </div>

      <div>
        <h1 className="font-display text-4xl leading-tight text-ink">{name}</h1>
        {producer ? <p className="mt-2 text-ink-muted">{producer}</p> : null}

        {tastingNotes?.length ? (
          <ul className="mt-6 flex flex-wrap gap-2">
            {tastingNotes.map((note) => (
              <li
                key={note}
                className="rounded-full border border-line px-3 py-1 text-sm text-ink-muted"
              >
                {note}
              </li>
            ))}
          </ul>
        ) : null}

        {price !== undefined ? (
          <p className="mt-6 text-2xl text-ink">
            {formatPrice(price)}
            {weight !== undefined ? (
              <span className="ml-2 text-base text-ink-muted">{formatWeight(weight)}</span>
            ) : null}
          </p>
        ) : null}

        {description ? (
          <div className="mt-6 text-ink-muted">
            <RichText fragments={description} />
          </div>
        ) : null}
      </div>
    </article>
  )
}

export default Coffee

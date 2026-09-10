import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Resolve } from '@ebitex/content-sdk/react'
import type { PresentationRenderer } from '@ebitex/content-sdk/react'

import { CmsImage } from '@/components/CmsImage'
import { useLocale } from '@/lib/locale'
import { loadPublishedPaths } from '@/lib/publishedPaths'
import type { Card, Image } from '@/types/content'

/**
 * The `card` Template.
 *
 * Worth noticing what this file does **not** contain: the word coffee. It renders a `Card` -- a
 * heading, a line of small print, a picture -- and that is all it knows. The cross-sell rail on the
 * front page is filled with coffees, mapped into cards by an Adapter on the server, and this
 * renderer cannot tell the difference and does not need to.
 *
 * That is the whole argument for Adapters over the two obvious alternatives. Putting card fields on
 * `coffee` would let a presentation dictate the shape of the content, and those fields would be
 * meaningless on the coffee's own page. Writing a card-shaped copy of every coffee would go stale
 * the first time somebody corrected a name. Here there is one coffee, one card Template, and a
 * mapping between them.
 *
 * The link is the one thing the mapping does not supply, and deliberately: a coffee has no URL
 * field, because a URL is a fact the CMS owns rather than content someone types. The binding still
 * points at the coffee -- an Adapter changes the *shape* delivered, never the identity -- so
 * `component.key` is the coffee's own id, and `loadPublishedPaths` turns that into the page it is
 * published at. A card whose subject has no published page simply is not a link.
 */
const CardTile: PresentationRenderer<Card> = ({ component }) => {
  const { heading, standfirst, image } = component.content
  const locale = useLocale()
  const [paths, setPaths] = useState<Map<string, string>>()

  useEffect(() => {
    let live = true
    loadPublishedPaths('coffee', locale).then((map) => live && setPaths(map))
    return () => {
      live = false
    }
  }, [locale])

  const key = 'key' in component ? component.key : undefined
  const path = key ? paths?.get(key) : undefined

  const body = (
    <>
      <Resolve value={image}>
        {(content: Image) => (
          <CmsImage
            file={content.file}
            alt={content.alt}
            className="aspect-[4/3] w-full rounded-xl border border-line object-cover"
          />
        )}
      </Resolve>
      <h3 className="mt-4 font-display text-xl text-ink">{heading}</h3>
      {standfirst ? <p className="mt-1 text-sm text-ink-muted">{standfirst}</p> : null}
    </>
  )

  return path ? (
    <Link to={path} className="group block">
      {body}
    </Link>
  ) : (
    <div>{body}</div>
  )
}

export default CardTile

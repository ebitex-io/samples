import { SiteLink } from '@/components/SiteLink'
import { pathForSite } from '@ebitex/content-sdk'
import { Resolve } from '@ebitex/content-sdk/react'
import type { PresentationRenderer } from '@ebitex/content-sdk/react'

import { CmsImage } from '@/components/CmsImage'
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
 * points at the coffee -- an Adapter changes the *shape* delivered, never the identity -- so the
 * delivered descriptor carries the coffee's own published path. A card whose subject has no
 * published page simply is not a link.
 */
const CardTile: PresentationRenderer<Card> = ({ component }) => {
  const { heading, standfirst, image } = component.content
  // Spec 665/565. The static sample resolves this in a `useEffect`, by fetching a whole-contract
  // listing and looking `component.key` up in it. That is correct in a browser and renders an
  // unlinked card server-side, because no effect runs during a server render — so a crawler sees
  // text where the link should be. The answer is already in the document: `paths` on the binding
  // itself, asked for once via the client's `referencePaths` option. Note this binding is
  // Adapter-mapped and the path still arrives — an Adapter changes the shape delivered, never the
  // identity.
  const path = 'paths' in component ? pathForSite(component.paths) : undefined

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
    <SiteLink href={path} className="group block">
      {body}
    </SiteLink>
  ) : (
    <div>{body}</div>
  )
}

export default CardTile

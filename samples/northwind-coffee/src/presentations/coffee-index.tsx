import { RichText } from '@ebitex/content-sdk/react'
import type { PresentationRenderer } from '@ebitex/content-sdk/react'

import { CoffeeIndex } from '@/components/CoffeeIndex'
import type { CoffeeIndexContent } from '@/lib/cmsTypes'
import { useDocumentMeta } from '@/lib/meta'

/**
 * The `coffee-index` Template.
 *
 * The Contract holds a heading and an introduction and nothing else. The grid below them is a
 * *query* -- authored nowhere, and correct the moment a coffee is published. Authoring a list of
 * links to every coffee would be a list somebody has to remember to update.
 */
const CoffeeIndexPage: PresentationRenderer<CoffeeIndexContent> = ({ component }) => {
  const { heading, intro } = component.content
  useDocumentMeta(heading)

  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <h1 className="font-display text-4xl text-ink sm:text-5xl">{heading}</h1>
      {intro ? (
        <div className="mt-4 max-w-2xl text-lg text-ink-muted">
          <RichText fragments={intro} />
        </div>
      ) : null}
      <div className="mt-10">
        <CoffeeIndex />
      </div>
    </div>
  )
}

export default CoffeeIndexPage

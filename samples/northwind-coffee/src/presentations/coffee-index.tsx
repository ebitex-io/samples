import { RichText } from '@ebitex/content-sdk/react'
import type { PresentationRenderer } from '@ebitex/content-sdk/react'

import { CoffeeGrid } from '@/components/CoffeeGrid'
import type { CoffeeIndex } from '@/types/content'
import { useDocumentMeta } from '@/lib/meta'

/**
 * The `coffee-index` Template.
 *
 * The Contract holds a heading and an introduction and nothing else. The grid below them is a
 * *query* -- authored nowhere, and correct the moment a coffee is published. Authoring a list of
 * links to every coffee would be a list somebody has to remember to update.
 */
const CoffeeIndexPage: PresentationRenderer<CoffeeIndex> = ({ component }) => {
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
        <CoffeeGrid />
      </div>
    </div>
  )
}

export default CoffeeIndexPage

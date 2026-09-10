import { PresentationList, RichText } from '@ebitex/content-sdk/react'
import type { PresentationRenderer } from '@ebitex/content-sdk/react'

import type { PageContent } from '@/lib/cmsTypes'
import { useDocumentMeta } from '@/lib/meta'

/**
 * The `page` Template.
 *
 * A renderer is an ordinary React component. The SDK finds it by this file's name -- `page.tsx`
 * renders the Template whose external id is `page` -- and hands it the resolved content of
 * whatever Component is bound at that node.
 *
 * A page can have a body, or a list of sections, or both, and this renderer does not care which.
 * `<PresentationList>` dispatches every section to its own Template's renderer, so adding a new
 * kind of section later is a new file in this directory and no change at all to this one.
 */
const Page: PresentationRenderer<PageContent> = ({ component }) => {
  const { title, description, body, sections } = component.content
  useDocumentMeta(title, description)

  // A page assembled purely out of sections lets its hero carry the heading, so repeating the
  // title above it would be a duplicate <h1> on every composed page.
  const hasSections = (sections?.length ?? 0) > 0

  return (
    <article>
      {hasSections ? null : (
        <header className="mx-auto max-w-3xl px-6 pt-20">
          <h1 className="font-display text-4xl leading-tight text-ink sm:text-5xl">{title}</h1>
          {description ? <p className="mt-4 text-xl text-ink-muted">{description}</p> : null}
        </header>
      )}
      {body ? (
        <div className="mx-auto max-w-3xl px-6 py-10 text-ink-muted">
          <RichText fragments={body} />
        </div>
      ) : null}
      <PresentationList items={sections} />
    </article>
  )
}

export default Page

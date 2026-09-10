import type { RichTextValue } from '@ebitex/content-sdk'
import { RichText } from '@ebitex/content-sdk/react'
import type { PresentationRenderer } from '@ebitex/content-sdk/react'

import { useDocumentMeta } from '@/lib/meta'

/**
 * The `page` Template.
 *
 * A renderer is an ordinary React component. The SDK finds it by this file's
 * name -- `page.tsx` renders the Template whose external id is `page` -- and
 * hands it the resolved content of whatever Component is bound at that node.
 *
 * `component.content` is keyed by the Contract's field external ids, so the
 * shape below is the Contract, restated in TypeScript. Keeping that mirror
 * true by hand is exactly the chore the generated types remove later on.
 */
interface PageContent {
  title: string
  description?: string
  body?: RichTextValue
}

const Page: PresentationRenderer<PageContent> = ({ component }) => {
  const { title, description, body } = component.content
  useDocumentMeta(title, description)

  return (
    <article className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="font-display text-4xl leading-tight text-ink sm:text-5xl">{title}</h1>
      {description ? <p className="mt-4 text-xl text-ink-muted">{description}</p> : null}
      {body ? (
        <div className="mt-10 text-ink-muted">
          <RichText fragments={body} />
        </div>
      ) : null}
    </article>
  )
}

export default Page

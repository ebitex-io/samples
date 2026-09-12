import Link from 'next/link'
import { pathForSite } from '@ebitex/content-sdk'
import { Resolve, RichText } from '@ebitex/content-sdk/react'
import type { PresentationRenderer } from '@ebitex/content-sdk/react'

import type { Guide, GuideIndex } from '@/types/content'
import { useDocumentMeta } from '@/lib/meta'

/**
 * The `guide-index` Template.
 *
 * `/coffees` is a query; this is an authored list, and the difference is deliberate. A catalogue
 * should be complete and maintain itself -- publish a coffee and it appears. A set of guides is
 * editorial: someone decides which three a beginner should read and in what order, and that
 * decision is content rather than something to infer.
 */
const GuideIndexPage: PresentationRenderer<GuideIndex> = ({ component }) => {
  const { heading, intro, guides } = component.content
  useDocumentMeta(heading)

  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <h1 className="font-display text-4xl text-ink sm:text-5xl">{heading}</h1>
      {intro ? (
        <div className="mt-4 text-lg text-ink-muted">
          <RichText fragments={intro} />
        </div>
      ) : null}

      <ul className="mt-10 divide-y divide-line border-y border-line">
        {guides?.map((guide, index) => (
          <Resolve key={index} value={guide} fallback={() => null}>
            {(g: Guide) => <GuideRow guide={g} path={pathForSite(guide.paths)} />}
          </Resolve>
        ))}
      </ul>
    </div>
  )
}

function GuideRow({ guide, path }: { guide: Guide; path: string | undefined }) {
  const body = (
    <>
      <h2 className="font-display text-2xl text-ink">{guide.heading}</h2>
      {guide.summary ? <p className="mt-1 text-ink-muted">{guide.summary}</p> : null}
      {guide['total-time'] ? (
        <p className="mt-2 text-sm text-ink-muted">{guide['total-time']}</p>
      ) : null}
    </>
  )

  return (
    <li className="py-6">
      {path ? (
        <Link href={path} className="block hover:text-accent">
          {body}
        </Link>
      ) : (
        body
      )}
    </li>
  )
}


export default GuideIndexPage

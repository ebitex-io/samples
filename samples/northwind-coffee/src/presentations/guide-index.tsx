import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Resolve, RichText } from '@ebitex/content-sdk/react'
import type { PresentationRenderer } from '@ebitex/content-sdk/react'

import { content as client } from '@/lib/content'
import type { GuideContent, GuideIndexContent } from '@/lib/cmsTypes'
import { useDocumentMeta } from '@/lib/meta'

/**
 * The `guide-index` Template.
 *
 * `/coffees` is a query; this is an authored list, and the difference is deliberate. A catalogue
 * should be complete and maintain itself -- publish a coffee and it appears. A set of guides is
 * editorial: someone decides which three a beginner should read and in what order, and that
 * decision is content rather than something to infer.
 */
const GuideIndex: PresentationRenderer<GuideIndexContent> = ({ component }) => {
  const { heading, intro, guides } = component.content
  const paths = useGuidePaths()
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
            {(g: GuideContent) => (
              <GuideRow guide={g} path={guide.key ? paths?.get(guide.key) : undefined} />
            )}
          </Resolve>
        ))}
      </ul>
    </div>
  )
}

function GuideRow({ guide, path }: { guide: GuideContent; path: string | undefined }) {
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
        <Link to={path} className="block hover:text-accent">
          {body}
        </Link>
      ) : (
        body
      )}
    </li>
  )
}

/** The published path of each guide, from the same `include=paths` listing the coffee page uses. */
function useGuidePaths() {
  const [paths, setPaths] = useState<Map<string, string>>()

  useEffect(() => {
    if (!client) return
    let live = true
    client.delivery
      .listComponents({ contract: 'guide', paths: true, limit: 100 })
      .then((page) => {
        if (!live) return
        const map = new Map<string, string>()
        for (const item of page.items) {
          const itemPath = item.paths?.[0]?.path
          if (itemPath) map.set(item.key, itemPath)
        }
        setPaths(map)
      })
      .catch(() => setPaths(new Map()))
    return () => {
      live = false
    }
  }, [])

  return paths
}

export default GuideIndex

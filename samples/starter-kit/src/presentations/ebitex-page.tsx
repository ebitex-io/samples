import type { ComponentValue } from '@ebitex/content-sdk'
import type { PresentationRenderer } from '@ebitex/content-sdk/react'
import { useEffect } from 'react'

import type { HeroContent } from '@/kit/blocks'
import { Frame, Section } from '@/kit/Section'
import { text } from '@/lib/vocab'

/** What the `ebitex-experience` Contract delivers for a page: the `ebitex-seo` fields, an inline hero and the sections. */
interface PageContent {
  metaTitle?: string
  metaDescription?: string
  noIndex?: boolean
  hero?: { content: HeroContent } & Record<string, unknown>
  sections?: ReadonlyArray<ComponentValue | null>
}

/**
 * The `ebitex-page` Template, over any Contract that inherits `ebitex-experience`.
 *
 * The hero is an *inline* value, so it is part of this page and arrives ready; the sections are
 * references, each dispatched by its Contract in `<Section>`. Adding a section kind to the kit is a
 * case in that switch and nothing here.
 */
const KitPage: PresentationRenderer<PageContent> = ({ component }) => {
  const { metaTitle, metaDescription, noIndex, hero, sections } = component.content
  useDocumentMeta(text(metaTitle), text(metaDescription), noIndex === true)

  return (
    <main>
      {hero ? (
        <Frame content={hero.content as unknown as Record<string, unknown>}>
          <Section value={hero as unknown as ComponentValue} nested />
        </Frame>
      ) : null}
      {(sections ?? []).map((section, index) => (
        <Section key={index} value={section} />
      ))}
    </main>
  )
}

/** The `ebitex-seo` fields written to the document, for a crawler that runs JavaScript. */
function useDocumentMeta(title: string | undefined, description: string | undefined, noIndex: boolean) {
  useEffect(() => {
    if (title) document.title = title
  }, [title])

  useEffect(() => {
    const set = (name: string, value: string | undefined) => {
      let tag = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
      if (value === undefined) {
        tag?.remove()
        return
      }
      if (!tag) {
        tag = document.createElement('meta')
        tag.name = name
        document.head.appendChild(tag)
      }
      tag.content = value
    }
    set('description', description)
    set('robots', noIndex ? 'noindex' : undefined)
  }, [description, noIndex])
}

export default KitPage

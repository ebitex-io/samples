import type { ComponentValue } from '@ebitex/content-sdk'
import type { PresentationRenderer } from '@ebitex/content-sdk/react'
import { useEffect } from 'react'

import type { HeroContent } from '@/kit/blocks'
import { Frame, Section } from '@/kit/Section'
import { pick, text, THEMES } from '@/lib/vocab'

/** What the `ebitex-experience` Contract delivers: the `ebitex-seo` fields, the theme, an inline hero and the sections. */
interface ExperienceContent {
  /** A theme category descriptor (the Delivery API sends the key in `path`). */
  theme?: unknown
  metaTitle?: string
  metaDescription?: string
  noIndex?: boolean
  hero?: { content: HeroContent } & Record<string, unknown>
  sections?: ReadonlyArray<ComponentValue | null>
}

/**
 * The `ebitex-experience-template` Template, over any Contract that inherits `ebitex-experience`.
 *
 * The experience's **theme** is a category the author chose; it is written as `data-kit-theme` on the wrapper, and index.css turns it into
 * tokens for everything inside. A theme this renderer does not know falls back to `default`.
 *
 * The hero is an *inline* value, so it is part of this experience and arrives ready; the sections are
 * references, each dispatched by its Contract in `<Section>`. Adding a section kind to the kit is a
 * case in that switch and nothing here.
 */
const KitExperience: PresentationRenderer<ExperienceContent> = ({ component }) => {
  const { theme, metaTitle, metaDescription, noIndex, hero, sections } = component.content
  useDocumentMeta(text(metaTitle), text(metaDescription), noIndex === true)

  return (
    <main data-kit-theme={pick(theme, THEMES)} className="bg-surface text-ink">
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

export default KitExperience

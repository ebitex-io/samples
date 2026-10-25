import type { ComponentValue } from '@ebitex/content-sdk'
import { useResolvedComponent } from '@ebitex/content-sdk/react'

import { Accordion, Grid, Tabs, type ContainerContent } from '@/kit/containers'
import { Banner, Card, Cta, Feature, Hero, MediaBlock, RichTextBlock } from '@/kit/blocks'
import { BACKGROUNDS, pick, text, WIDTH_CLASS, WIDTHS } from '@/lib/vocab'

/**
 * One section of a page, or one item inside a Tabs, Accordion or Grid.
 *
 * A page's sections are Component *references*, so the value says which Contract it is (`contract.externalId`)
 * and the Template is not part of it: this switch is the dispatch. A section the kit does not know
 * (an author's own Contract inheriting `kit-presentation`) renders nothing and says so in the DOM, so
 * a page never breaks on content a newer kit or a tenant added.
 *
 * `useResolvedComponent` is the SDK's gate for a value that may still be a bare reference: a page
 * resolved deeply enough arrives expanded, and one that was not is fetched here, so a section is
 * never silently hollow.
 *
 * `nested` is a section placed inside a container: the container owns the spacing, width and
 * background, so the item draws only itself.
 */
export function Section({ value, nested = false }: { value: ComponentValue | null | undefined; nested?: boolean }) {
  const resolution = useResolvedComponent(value)
  if (resolution.status === 'loading') return <div aria-hidden className="h-24 animate-pulse rounded-xl bg-muted" />
  if (resolution.status !== 'ready') return null

  const resolved = resolution.value
  const content = resolved.content as Record<string, unknown>
  const contract = resolved.contract?.externalId ?? ''
  const body = renderBody(contract, content)
  if (!body) {
    return <div data-kit-unknown={contract || 'unknown'} hidden />
  }
  return nested ? <>{body}</> : <Frame content={content}>{body}</Frame>
}

function renderBody(contract: string, content: Record<string, unknown>) {
  switch (contract) {
    case 'kit-hero':
      return <Hero content={content as never} />
    case 'kit-rich-text':
      return <RichTextBlock content={content as never} />
    case 'kit-media':
      return <MediaBlock content={content as never} />
    case 'kit-card':
      return <Card content={content as never} />
    case 'kit-feature':
      return <Feature content={content as never} />
    case 'kit-banner':
      return <Banner content={content as never} />
    case 'kit-cta':
      return <Cta content={content as never} />
    case 'kit-tabs':
      return <Tabs content={content as unknown as ContainerContent} />
    case 'kit-accordion':
      return <Accordion content={content as unknown as ContainerContent} />
    case 'kit-grid':
      return <Grid content={content as unknown as ContainerContent} />
    default:
      return null
  }
}

/** The page-level frame every top-level section gets: anchor, background, and a width. */
export function Frame({ content, children }: { content: Record<string, unknown>; children: React.ReactNode }) {
  const width = pick(content.width, WIDTHS)
  const background = pick(content.background, BACKGROUNDS)
  const anchor = text(content.anchor)
  const surface = background === 'muted' ? 'bg-muted' : background === 'accent' ? 'bg-accent-soft' : ''

  return (
    <section id={anchor} className={`${surface} scroll-mt-20 px-6 py-12 sm:py-16`}>
      <div className={`mx-auto ${WIDTH_CLASS[width]}`}>{children}</div>
    </section>
  )
}

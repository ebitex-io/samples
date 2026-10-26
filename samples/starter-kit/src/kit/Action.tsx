import { Link } from 'react-router'
import type { LinkValue } from '@ebitex/content-sdk'

import { ACTION_STYLES, pick, text, type ActionStyle } from '@/lib/vocab'

/** What the `ebitex-action` Contract delivers inline. */
export interface ActionContent {
  label?: string
  href?: LinkValue
  style?: string
}

/** The address of a link field, or `undefined` when its target page is not published (a link to nothing is worse than no link). */
export function hrefOf(link: LinkValue | undefined): string | undefined {
  if (!link) return undefined
  const suffix = `${link.query ?? ''}${link.anchor ?? ''}`
  return link.url ? `${link.url}${suffix}` : undefined
}

const STYLES: Record<ActionStyle, string> = {
  primary: 'bg-accent text-accent-ink hover:opacity-90',
  secondary: 'border border-line bg-raised text-ink hover:bg-muted',
  link: 'text-accent underline underline-offset-4',
}

/**
 * One `ebitex-action` value. `fallbackStyle` is what the placing section wants when the author left the
 * style empty (a hero's second button reads as secondary without anyone saying so).
 */
export function Action({ action, fallbackStyle = 'primary' }: { action: { content: ActionContent } | undefined; fallbackStyle?: ActionStyle }) {
  const content = action?.content
  const label = text(content?.label)
  const href = hrefOf(content?.href)
  if (!label || !href) return null

  const style = content?.style ? pick(content.style, ACTION_STYLES) : fallbackStyle
  const className = `inline-flex items-center text-sm font-medium transition ${style === 'link' ? '' : 'rounded-full px-5 py-2.5'} ${STYLES[style]}`

  return href.startsWith('/') ? (
    <Link to={href} className={className}>
      {label}
    </Link>
  ) : (
    <a href={href} className={className}>
      {label}
    </a>
  )
}

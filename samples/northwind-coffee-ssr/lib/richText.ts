import type { RichTextValue } from '@ebitex/content-sdk'

/**
 * Plain prose from a RichText value, for somewhere that cannot take markup.
 *
 * A delivered RichText value is an ordered array of fragments -- markdown, plus embedded
 * Presentations and references. `<RichText>` renders the lot; a `<meta>` tag cannot, so this takes
 * the first markdown fragment and reduces it to a sentence or two of text.
 *
 * The first fragment rather than all of them, deliberately. A description is a teaser, not a
 * summary of the whole page, and concatenating every fragment would run an embedded card's heading
 * into the sentence before it.
 *
 * It never renders markdown. The markup is *stripped*, which is a different and much smaller job:
 * a meta description is read by machines and shown as one line, so a link's text belongs in it and
 * a link's URL does not.
 */
export function plainTextFrom(value: RichTextValue | undefined, maxLength = 160): string | undefined {
  const first = value?.find((f) => f.kind === 'markdown')
  if (!first || first.kind !== 'markdown') return undefined
  const text = stripMarkdown(first.markdown)
  return text ? truncateOnWord(text, maxLength) : undefined
}

/**
 * Enough CommonMark to get readable prose out, and no more.
 *
 * Not a parser, and not trying to be one -- the dialect is pinned (CommonMark plus GFM tables and
 * strikethrough, never raw HTML), and what reaches a description is the opening paragraph of
 * authored copy. The failure mode of doing too little here is a stray character in a meta tag; the
 * failure mode of pulling in a parser is a markdown implementation in the browser bundle of every
 * page, to produce one line of text.
 */
function stripMarkdown(markdown: string): string {
  return markdown
    // Fenced code blocks, whole. Their contents are not prose.
    .replace(/```[\s\S]*?```/g, ' ')
    // Embed tokens: structural placeholders, never words a reader wants.
    .replace(/\{\{[^}]*\}\}/g, ' ')
    // Images before links, so an image's alt text does not survive as a bare word.
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    // A link keeps its text and loses its target.
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    // Emphasis, strong, strikethrough, inline code.
    .replace(/(\*\*|__|~~|[*_`])/g, '')
    // Leading block markers: headings, quotes, list bullets, ordered list numbers.
    .replace(/^[ \t]*(#{1,6}|>|[-*+]|\d+\.)[ \t]+/gm, '')
    // Thematic breaks and table pipes.
    .replace(/^[ \t]*([-*_])\s*\1\s*\1[-*_\s]*$/gm, ' ')
    .replace(/\|/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Cuts at the last whole word that fits, and only then adds an ellipsis. */
function truncateOnWord(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  const cut = text.slice(0, maxLength)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}

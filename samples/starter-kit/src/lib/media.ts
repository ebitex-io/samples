/**
 * Reads what a renderer needs from a delivered media value: an asset from the Ebitex Assets library, told apart by
 * `contract.externalId` (`ebitex-image`, `ebitex-video`, `ebitex-document`), whose `file` carries its own URL and dimensions.
 * Anything that is not a video or a document is read as an image.
 */
export type Media =
  | { kind: 'image'; url: string; alt: string; width?: number; height?: number }
  | { kind: 'video'; src: string; name: string; poster?: string; captions?: string }
  | { kind: 'document'; url: string; name: string; extension?: string; sizeBytes?: number }

export interface MediaValueLike {
  contract?: { externalId?: string | null } | null
  content?: unknown
}

type Doc = Record<string, unknown> & { file?: Record<string, unknown> }

/** A number the browser can use: positive and finite, never `0` or a stray string. */
const positive = (value: unknown): number | undefined => (typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined)

const text = (value: unknown): string | undefined => (typeof value === 'string' && value ? value : undefined)

/** The extension a visitor would recognise, from the URL path. */
function extensionOf(url: string): string | undefined {
  const match = /\.([a-z0-9]{1,5})$/i.exec(url.split(/[?#]/)[0] ?? '')
  return match ? match[1].toUpperCase() : undefined
}

/** Reads an image, video or document value, or `null` when there is nothing to show. */
export function readMedia(value: MediaValueLike | null | undefined): Media | null {
  const content = value?.content as Doc | undefined
  const file = content?.file
  const url = text(file?.url)
  if (!content || !url) return null

  switch (value?.contract?.externalId) {
    case 'ebitex-video':
      return { kind: 'video', src: url, name: text(content.name) ?? '', poster: text(file?.posterUrl), captions: text(file?.captionsUrl) }
    case 'ebitex-document':
      return { kind: 'document', url, name: text(content.name) ?? 'Download', extension: extensionOf(url), sizeBytes: positive(file?.sizeBytes) }
    default:
      return { kind: 'image', url, alt: text(content.alt) ?? '', width: positive(file?.width), height: positive(file?.height) }
  }
}

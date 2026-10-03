/**
 * Reads what a renderer needs from a delivered media value, whichever of the two shapes an image
 * field can hold (ebitex-io/monorepo#1059):
 *
 * - the sample's own `image` Contract: `file` is a Blob, alt text is `alt`, and there are no
 *   dimensions (a Blob Image elsewhere may carry `alt-text` and a top-level `width`/`height`);
 * - an asset from the Ebitex Assets library, told apart by `contract.externalId`
 *   (`ebitex-image`, `ebitex-video`, `ebitex-document`), whose `file` carries its own dimensions.
 *
 * Anything that is not an `ebitex-video` or `ebitex-document` is read as an image, so a page that
 * only ever held the sample's own image is unchanged.
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
const positive = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined

const text = (value: unknown): string | undefined => (typeof value === 'string' && value ? value : undefined)

const EXTENSION_BY_TYPE: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'application/vnd.ms-powerpoint': 'PPT',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
  'application/zip': 'ZIP',
  'text/plain': 'TXT',
  'text/csv': 'CSV',
}

/** The extension a visitor would recognise: the URL path's own, else one known for the content type. */
export function documentExtension(url: string, contentType?: string): string | undefined {
  const path = url.split(/[?#]/)[0] ?? ''
  const match = /\.([a-z0-9]{1,5})$/i.exec(path)
  if (match) return match[1].toUpperCase()
  return contentType ? EXTENSION_BY_TYPE[contentType.split(';')[0].trim().toLowerCase()] : undefined
}

/** `482113` becomes `471 KB`; empty for a missing or non-positive size. */
export function formatFileSize(bytes: number | undefined): string {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes <= 0) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  const rounded = unit === 0 || value >= 10 ? Math.round(value).toString() : value.toFixed(1).replace(/\.0$/, '')
  return `${rounded} ${units[unit]}`
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
      return {
        kind: 'document',
        url,
        name: text(content.name) ?? 'Download',
        extension: documentExtension(url, text(file?.contentType)),
        sizeBytes: positive(file?.sizeBytes),
      }
    case 'ebitex-image':
      // An asset keeps its pixel size inside `file`; nothing is read from the top level.
      return { kind: 'image', url, alt: text(content.alt) ?? '', width: positive(file?.width), height: positive(file?.height) }
    default:
      return { kind: 'image', url, alt: text(content.alt) ?? text(content['alt-text']) ?? '', width: positive(content.width), height: positive(content.height) }
  }
}

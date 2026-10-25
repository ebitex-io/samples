import type { BlobValue } from '@ebitex/content-sdk'

const ASPECTS = ['auto', '16:9', '4:3', '1:1', '3:2'] as const
const ASPECT_CLASS: Record<(typeof ASPECTS)[number], string> = {
  auto: '',
  '16:9': 'aspect-video',
  '4:3': 'aspect-[4/3]',
  '1:1': 'aspect-square',
  '3:2': 'aspect-[3/2]',
}

/**
 * A blob field's file: an image, or a video with controls. `alt` is the author's text; an image with
 * none is treated as decoration (an empty alt) rather than given a made-up description.
 */
export function Media({ blob, alt, aspect, className = '' }: { blob: BlobValue | undefined; alt?: string; aspect?: unknown; className?: string }) {
  if (!blob?.url) return null

  const ratio = ASPECTS.includes(aspect as (typeof ASPECTS)[number]) ? (aspect as (typeof ASPECTS)[number]) : 'auto'
  const shape = `${ASPECT_CLASS[ratio]} ${ratio === 'auto' ? 'h-auto' : 'h-full object-cover'} w-full`

  return blob.contentType.startsWith('video/') ? (
    <video src={blob.url} controls preload="metadata" className={`${shape} rounded-xl ${className}`} />
  ) : (
    <img src={blob.url} alt={alt ?? ''} loading="lazy" className={`${shape} rounded-xl ${className}`} />
  )
}

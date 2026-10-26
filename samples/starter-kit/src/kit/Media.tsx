import type { ComponentValue } from '@ebitex/content-sdk'
import { useResolvedComponent } from '@ebitex/content-sdk/react'

import { readMedia, type Media as MediaFile } from '@/lib/media'
import { ASPECT_CLASS, pick, ASPECTS } from '@/lib/vocab'

interface MediaProps {
  /** A reference to an asset in the Assets library, as a media field holds it; empty when none is chosen. */
  value: ComponentValue | null | undefined
  /** The author's alternative text. An image with none is treated as decoration (an empty alt) rather than given a made-up description. */
  alt?: string
  /** The aspect-ratio category the placing edge chose; the media fills that shape. */
  aspect?: unknown
  /** The shape of the placeholder (and of the media when no aspect was chosen), as a token key from the aspect-ratio group. */
  fallbackAspect?: (typeof ASPECTS)[number]
  className?: string
}

/**
 * One media field: an image, video or document from the Assets library (`ebitex-image`, `ebitex-video`, `ebitex-document`), told apart by
 * its Contract. A field with nothing chosen draws a labelled placeholder of the same shape, so the layout holds and a person can see
 * where media goes; it is `aria-hidden`, because it says nothing to a reader.
 */
export function Media({ value, alt, aspect, fallbackAspect = 'wide', className = '' }: MediaProps) {
  const resolution = useResolvedComponent(value ?? null)
  const ratio = pick(aspect ?? fallbackAspect, ASPECTS)
  const shape = `${ASPECT_CLASS[ratio]} ${ratio === 'auto' ? 'h-auto' : 'h-full object-cover'} w-full`

  if (!value) return <Placeholder ratio={ratio} className={className} />
  if (resolution.status === 'loading') return <div aria-hidden className={`${ASPECT_CLASS[ratio === 'auto' ? 'wide' : ratio]} w-full animate-pulse rounded-xl bg-muted ${className}`} />
  if (resolution.status !== 'ready') return <Placeholder ratio={ratio} className={className} />

  const media: MediaFile | null = readMedia(resolution.value as never)
  if (!media) return <Placeholder ratio={ratio} className={className} />

  switch (media.kind) {
    case 'video':
      return (
        <video src={media.src} poster={media.poster} controls preload="metadata" className={`${shape} rounded-xl ${className}`}>
          {media.captions ? <track kind="captions" src={media.captions} default /> : null}
        </video>
      )
    case 'document':
      return (
        <a href={media.url} className={`inline-flex items-center gap-2 rounded-xl border border-line bg-raised px-4 py-3 text-sm font-medium text-accent ${className}`}>
          {media.name}
          {media.extension ? <span className="text-ink-muted">{media.extension}</span> : null}
        </a>
      )
    default:
      return <img src={media.url} alt={alt ?? media.alt} width={media.width} height={media.height} loading="lazy" className={`${shape} rounded-xl ${className}`} />
  }
}

function Placeholder({ ratio, className }: { ratio: (typeof ASPECTS)[number]; className: string }) {
  return (
    <div
      aria-hidden
      data-kit-placeholder="media"
      className={`${ASPECT_CLASS[ratio === 'auto' ? 'wide' : ratio]} flex w-full items-center justify-center rounded-xl border border-dashed border-line bg-muted text-sm text-ink-muted ${className}`}
    >
      Choose media in Assets
    </div>
  )
}

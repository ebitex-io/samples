'use client'

import { useEffect, useRef } from 'react'

import { formatFileSize, readMedia, type Media, type MediaValueLike } from '@/lib/media'

/**
 * Renders a bound media value: an image, or an asset from the Ebitex Assets library (a video or a
 * document). `readMedia` does the shape-switching, so this stays markup.
 *
 * There is deliberately nothing clever for images: no host-specific rewriting, no transform
 * service, no CDN assumptions. Those belong to whoever owns the host. Width and height are set
 * only when the value has them, so the browser can reserve the space and nothing is invented.
 */
export function CmsMedia({
  value,
  className,
  loading = 'lazy',
}: {
  value: MediaValueLike | null | undefined
  className?: string
  loading?: 'lazy' | 'eager'
}) {
  const media = readMedia(value)
  if (!media) return null
  if (media.kind === 'video') return <CmsVideo video={media} className={className} />
  if (media.kind === 'document') return <CmsDocument document={media} />
  return <img src={media.url} alt={media.alt} width={media.width} height={media.height} loading={loading} className={className} />
}

/**
 * An HTML5 player for an Assets video. The delivered URL is an HLS manifest: Safari and iOS play it
 * in a `<video>` directly; every other browser gets hls.js, imported on demand so a page with no
 * video never downloads it.
 */
function CmsVideo({ video, className }: { video: Extract<Media, { kind: 'video' }>; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    if (element.canPlayType('application/vnd.apple.mpegurl')) {
      element.src = video.src
      return
    }
    let destroy: (() => void) | undefined
    let cancelled = false
    void import('hls.js').then(({ default: Hls }) => {
      if (cancelled || !Hls.isSupported()) return
      const hls = new Hls()
      hls.loadSource(video.src)
      hls.attachMedia(element)
      destroy = () => hls.destroy()
    })
    return () => {
      cancelled = true
      destroy?.()
    }
  }, [video.src])

  return (
    <video ref={ref} controls playsInline preload="metadata" poster={video.poster} aria-label={video.name || undefined} className={className}>
      {video.captions ? <track kind="captions" src={video.captions} default /> : null}
    </video>
  )
}

/** A download call to action: the name, then extension and size when known. */
function CmsDocument({ document }: { document: Extract<Media, { kind: 'document' }> }) {
  const details = [document.extension, formatFileSize(document.sizeBytes)].filter(Boolean).join(' · ')
  return (
    <a href={document.url} download className="flex items-center justify-between gap-4 rounded-xl border border-line bg-sunken p-4 hover:text-accent">
      <span className="min-w-0">
        <span className="block truncate font-medium text-ink">{document.name}</span>
        {details ? <span className="block text-sm text-ink-muted">{details}</span> : null}
      </span>
      <span className="shrink-0 text-sm font-medium">Download</span>
    </a>
  )
}

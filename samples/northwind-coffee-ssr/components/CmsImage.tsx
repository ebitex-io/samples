import type { BlobValue } from '@ebitex/content-sdk'

/**
 * Renders a Blob field.
 *
 * A delivered Blob value carries a public `url` -- resolved at publish time, served from wherever
 * the organization's public blob store lives. There is deliberately nothing clever here: no
 * host-specific rewriting, no transform service, no CDN assumptions. Those belong to whoever owns
 * the host, and a sample that baked in one company's CDN would silently do nothing for everyone
 * else's blobs.
 *
 * `alt` is required by the type, which is the payoff for making it mandatory on the Contract:
 * an image with no description cannot be authored, so it cannot be rendered.
 */
export function CmsImage({
  file,
  alt,
  className,
  loading = 'lazy',
}: {
  file: BlobValue | undefined
  alt: string
  className?: string
  loading?: 'lazy' | 'eager'
}) {
  if (!file?.url) return null
  return (
    <img
      src={file.url}
      alt={alt}
      loading={loading}
      className={className}
    />
  )
}

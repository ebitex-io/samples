import Link from 'next/link'
import type { LinkValue } from '@ebitex/content-sdk'

/**
 * Renders a `link` field.
 *
 * A link value is a discriminated envelope: an `external` arm carrying a URL, and an `experience`
 * arm naming another page in this site, whose URL the Delivery API resolves for us at request
 * time. That is the reason to prefer the experience arm where you can -- the URL is never stored,
 * so moving the target page never leaves a stale link behind.
 *
 * A same-site URL is routed client-side rather than reloading the whole application. It is used as
 * delivered: the server composed it in this site's URL space, so a French page's link already reads
 * `/fr/...` and there is nothing to add to it.
 */
export function CtaLink({
  link,
  label,
  variant = 'solid',
}: {
  link: LinkValue
  label: string
  variant?: 'solid' | 'quiet'
}) {
  const href = urlFor(link)
  if (!href) return null

  const className =
    variant === 'solid'
      ? 'inline-block rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-ink'
      : 'text-accent underline underline-offset-4'

  return href.startsWith('/') ? (
    <Link href={href} className={className}>
      {label}
    </Link>
  ) : (
    <a href={href} className={className}>
      {label}
    </a>
  )
}

function urlFor(link: LinkValue): string | undefined {
  const suffix = `${link.query ?? ''}${link.anchor ?? ''}`
  if (link.kind === 'external') return link.url ? `${link.url}${suffix}` : undefined
  // The experience arm: `url` is resolved and delivered, and is null when the target page is not
  // published. Rendering nothing is the honest answer -- a link to a page that does not exist is
  // worse than no link.
  return link.url ? `${link.url}${suffix}` : undefined
}

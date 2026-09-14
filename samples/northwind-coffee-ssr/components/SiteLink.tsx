'use client'

import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'

import { useLocalePath } from '@/lib/locale'

/**
 * A link to another page on this site, in the language currently being read.
 *
 * ---- Why every same-site link goes through one component ----
 *
 * Locales live in the path here, so a link to `/guides` written as `/guides` is a link to the
 * *English* page — whoever was reading French is now reading English, with no error, no warning and
 * nothing in any test to notice it. That failure mode is the entire argument for this file: there
 * is one place to get it right, and `grep "next/link"` is a complete audit of the ones that skipped
 * it.
 *
 * A `href` that is not same-site (anything not starting with `/`) is passed through untouched, so
 * this is safe to use at a call site that renders either.
 *
 * ---- Why it is a client component ----
 *
 * It reads the locale from the pathname, which needs a hook. Most of this site's links are already
 * inside `app/content-root.tsx`'s client boundary and so cost nothing extra; the site chrome is
 * server-rendered and its links become small client islands, which is a real if modest price. The
 * alternative is threading a locale prop through every renderer, and a prop that has to be passed
 * everywhere is a prop that will eventually not be — which is the bug this exists to prevent,
 * reintroduced one layer up.
 */
export function SiteLink({
  href,
  children,
  ...rest
}: { href: string; children: ReactNode } & Omit<ComponentProps<typeof Link>, 'href' | 'children'>) {
  const localePath = useLocalePath()

  if (!href.startsWith('/')) {
    return (
      <a href={href} {...(rest as ComponentProps<'a'>)}>
        {children}
      </a>
    )
  }

  return (
    <Link href={localePath(href)} {...rest}>
      {children}
    </Link>
  )
}

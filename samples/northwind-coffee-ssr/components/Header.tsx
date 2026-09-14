'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { LocaleSwitcher } from '@/components/LocaleSwitcher'
import { NavLinks, type NavItem } from '@/components/NavLinks'
import type { LocaleAlternate } from '@/lib/pageAddresses'
import type { HeaderContent } from '@/types/content'

/**
 * The site header.
 *
 * Its navigation came from a plain array in this file until step 12. Every page the site gained
 * needed a line added here, a commit and a deploy, for a change that had nothing to do with code.
 * Now it comes from a Component in the CMS, and adding a page is an authoring task.
 *
 * The array survives as a **fallback**, and that is deliberate rather than tidiness left undone.
 * If the header Component has not been published, or its shape has drifted, the site keeps a
 * working navigation. Chrome is the one thing that must never disappear: without it there is no
 * way to reach the page that would explain what went wrong.
 *
 * The fallback's addresses are English ones, and stay that way on a French page. That is the one
 * place on the site a French reader can be dropped into English, and it is accepted rather than
 * patched: the alternative is this app composing `/fr/...` itself, which is exactly the rule the
 * server now owns. The CMS's own links arrive already addressed for the page's locale.
 */
const FALLBACK_LINKS: NavItem[] = [
  { to: '/coffees', label: 'Coffees' },
  { to: '/guides', label: 'Brew guides' },
  { to: '/stores', label: 'Find us' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Wholesale' },
]

export function Header({
  content,
  home = '/',
  alternates = [],
}: {
  content?: HeaderContent | null
  /** The front page in the current locale, as the server addressed it (`/`, or `/fr`). */
  home?: string
  /** This page in every locale the site offers -- see `lib/pageAddresses.ts`. */
  alternates?: LocaleAlternate[]
}) {
  // Compared as they are. `item.to` is a Link field's `url`, which the server composed in this
  // site's URL space -- `/fr/cafes` on a French page -- and the pathname is the same space, so the
  // two are directly comparable. This used to strip the prefix off the pathname first, because the
  // links carried none; the one place that asymmetry lived was a place every nav item could be
  // silently inactive in French.
  const pathname = usePathname()
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link href={home} className="font-display text-xl tracking-tight text-ink">
          Northwind Coffee
        </Link>
        <div className="flex flex-wrap items-center gap-6">
          <nav aria-label="Main">
            <ul className="flex flex-wrap items-center gap-6 text-sm">
              <NavLinks links={content?.links} fallback={FALLBACK_LINKS}>
                {(item) => (
                  <Link
                    href={item.to}
                    // react-router's NavLink hands its className an `isActive` flag. next/link has
                    // no such callback, so the active check is `usePathname()` — the same question,
                    // asked directly.
                    className={pathname === item.to ? 'text-ink' : 'text-ink-muted hover:text-ink'}
                  >
                    {item.label}
                  </Link>
                )}
              </NavLinks>
            </ul>
          </nav>
          <LocaleSwitcher alternates={alternates} />
        </div>
      </div>
    </header>
  )
}

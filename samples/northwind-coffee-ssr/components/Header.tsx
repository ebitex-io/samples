'use client'

import { SiteLink } from '@/components/SiteLink'
import { usePathname } from 'next/navigation'
import { splitLocale } from '@/lib/locales'

import { LocaleSwitcher } from '@/components/LocaleSwitcher'
import { NavLinks, type NavItem } from '@/components/NavLinks'
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
 */
const FALLBACK_LINKS: NavItem[] = [
  { to: '/coffees', label: 'Coffees' },
  { to: '/guides', label: 'Brew guides' },
  { to: '/stores', label: 'Find us' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Wholesale' },
]

export function Header({ content }: { content?: HeaderContent | null }) {
  // The locale prefix is stripped before comparing, because `item.to` is a CMS path and carries
  // none. Without this every nav item is inactive in French -- a silent, purely visual failure, and
  // exactly the class of bug a path-prefix scheme scatters around a codebase.
  const { path: pathname } = splitLocale(usePathname())
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <SiteLink href="/" className="font-display text-xl tracking-tight text-ink">
          Northwind Coffee
        </SiteLink>
        <div className="flex flex-wrap items-center gap-6">
          <nav aria-label="Main">
            <ul className="flex flex-wrap items-center gap-6 text-sm">
              <NavLinks links={content?.links} fallback={FALLBACK_LINKS}>
                {(item) => (
                  <SiteLink
                    href={item.to}
                    // react-router's NavLink hands its className an `isActive` flag. next/link has
                    // no such callback, so the active check is `usePathname()` — the same question,
                    // asked directly, with the locale prefix taken off first (see above).
                    className={pathname === item.to ? 'text-ink' : 'text-ink-muted hover:text-ink'}
                  >
                    {item.label}
                  </SiteLink>
                )}
              </NavLinks>
            </ul>
          </nav>
          <LocaleSwitcher />
        </div>
      </div>
    </header>
  )
}

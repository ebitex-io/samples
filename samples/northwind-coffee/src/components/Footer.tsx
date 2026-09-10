import { Link } from 'react-router'

import { NavLinks, type NavItem } from '@/components/NavLinks'
import type { FooterContent } from '@/lib/cmsTypes'

/** The site footer. Same migration as the header, and the same fallback for the same reason. */
const FALLBACK_LINKS: NavItem[] = [
  { to: '/coffees', label: 'Coffees' },
  { to: '/guides', label: 'Brew guides' },
  { to: '/stores', label: 'Find us' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Wholesale' },
]

const FALLBACK_TAGLINE = 'Roasted on the north coast. Posted out the same week.'

export function Footer({ content }: { content?: FooterContent | null }) {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-lg text-ink">Northwind Coffee</p>
          <p className="mt-1 text-sm text-ink-muted">{content?.tagline ?? FALLBACK_TAGLINE}</p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-5 text-sm text-ink-muted">
            <NavLinks links={content?.links} fallback={FALLBACK_LINKS}>
              {(item) => (
                <Link to={item.to} className="hover:text-ink">
                  {item.label}
                </Link>
              )}
            </NavLinks>
          </ul>
        </nav>
      </div>
    </footer>
  )
}

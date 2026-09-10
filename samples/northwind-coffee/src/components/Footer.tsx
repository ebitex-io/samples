import { Link } from 'react-router'

/** The site footer. Hard-coded for the same reason as the header, and migrated in the same step. */
const FOOTER_LINKS = [
  { to: '/coffees', label: 'Coffees' },
  { to: '/guides', label: 'Brew guides' },
  { to: '/stores', label: 'Find us' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Wholesale' },
]

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-lg text-ink">Northwind Coffee</p>
          <p className="mt-1 text-sm text-ink-muted">
            Roasted on the north coast. Posted out the same week.
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-5 text-sm text-ink-muted">
            {FOOTER_LINKS.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="hover:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  )
}

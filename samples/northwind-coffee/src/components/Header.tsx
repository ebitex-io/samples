import { Link, NavLink } from 'react-router'

/**
 * The site header.
 *
 * The navigation is a plain array, in code. That is a deliberate starting point rather than an
 * oversight: it is where almost every site actually begins, and it is honest about the cost --
 * every page the site gains from here needs a line added to this file, a commit, and a deploy,
 * for a change that has nothing to do with code.
 *
 * Step 12 moves this into the CMS, and the diff at that step is the argument for doing it.
 */
const NAV_LINKS = [
  { to: '/coffees', label: 'Coffees' },
  { to: '/guides', label: 'Brew guides' },
  { to: '/stores', label: 'Find us' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Wholesale' },
]

export function Header() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link to="/" className="font-display text-xl tracking-tight text-ink">
          Northwind Coffee
        </Link>
        <nav aria-label="Main">
          <ul className="flex items-center gap-6 text-sm">
            {NAV_LINKS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    isActive ? 'text-ink' : 'text-ink-muted hover:text-ink'
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  )
}

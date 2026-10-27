import { Link } from 'react-router'
import type { EbitexLink, EbitexOptions } from '@ebitex/starter-kit-react/react'

/** Client-side navigation for an address on this site; anything else is a plain anchor. */
export const RouterLink: EbitexLink = ({ href, children, ...rest }) =>
  href.startsWith('/') ? (
    <Link to={href} {...rest}>
      {children}
    </Link>
  ) : (
    <a href={href} {...rest}>
      {children}
    </a>
  )

/**
 * Everything this site changes about the kit, and nothing else. Today that is how links navigate. To redraw one section, add it to `sections`,
 * keyed by the Contract's external id:
 *
 *   sections: { 'ebitex-cta': MyCallToAction }
 *
 * To change a colour, redefine a `--ebitex-*` token in `index.css`. To own the whole renderer, run `npx starter-kit-eject src/kit` and import
 * from the copy instead of the package.
 */
export const ebitexOptions: EbitexOptions = { link: RouterLink }

import type { ReactNode } from 'react'
import type { ComponentValue } from '@ebitex/content-sdk'

import type { NavLinkContent } from '@/lib/cmsTypes'

export interface NavItem {
  to: string
  label: string
}

/**
 * Turns the CMS's navigation links into plain `{ to, label }` items, falling back to a hard-coded
 * list when there is no published header to read.
 *
 * A CMS link stores the target node's *identity*, and the Delivery API resolves its current path
 * per request. An entry whose target has been unpublished comes back with `url: null` and is
 * dropped -- a navigation item that goes nowhere is worse than one fewer item.
 */
export function NavLinks({
  links,
  fallback,
  children,
}: {
  links: ComponentValue<NavLinkContent>[] | undefined
  fallback: NavItem[]
  children: (item: NavItem) => ReactNode
}) {
  const items = toItems(links) ?? fallback

  return (
    <>
      {items.map((item) => (
        <li key={`${item.to}:${item.label}`}>{children(item)}</li>
      ))}
    </>
  )
}

function toItems(links: ComponentValue<NavLinkContent>[] | undefined): NavItem[] | undefined {
  if (!links?.length) return undefined

  const items = links.flatMap((link) => {
    const content = link.content
    const url = content?.link?.url
    return content && url ? [{ to: url, label: content.label }] : []
  })

  // An entirely unresolvable navigation is the same situation as no navigation at all.
  return items.length > 0 ? items : undefined
}

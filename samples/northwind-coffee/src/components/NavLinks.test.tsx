import { render, screen } from '@testing-library/react'
import { MemoryRouter, Link } from 'react-router'
import { describe, expect, it } from 'vitest'

import { NavLinks, type NavItem } from '@/components/NavLinks'
import type { NavLinkContent } from '@/lib/cmsTypes'

const FALLBACK: NavItem[] = [{ to: '/about', label: 'About' }]

function renderNav(links: Parameters<typeof NavLinks>[0]['links']) {
  render(
    <MemoryRouter>
      <ul>
        <NavLinks links={links} fallback={FALLBACK}>
          {(item) => <Link to={item.to}>{item.label}</Link>}
        </NavLinks>
      </ul>
    </MemoryRouter>,
  )
}

const cmsLink = (label: string, url: string | null) => ({
  provider: 'core',
  key: label,
  content: {
    label,
    link: { kind: 'experience' as const, target: { provider: 'core', key: 'n' }, url, resolved: url !== null },
  } satisfies NavLinkContent,
})

describe('NavLinks', () => {
  it('renders the CMS links when they resolve', () => {
    renderNav([cmsLink('Coffees', '/coffees'), cmsLink('About', '/about')])
    expect(screen.getByRole('link', { name: 'Coffees' })).toHaveAttribute('href', '/coffees')
    expect(screen.getAllByRole('link')).toHaveLength(2)
  })

  it('drops a link whose target is unpublished', () => {
    // The Delivery API answers `url: null` rather than failing. A navigation item that goes
    // nowhere is worse than one fewer item.
    renderNav([cmsLink('Coffees', '/coffees'), cmsLink('Gone', null)])
    expect(screen.getAllByRole('link')).toHaveLength(1)
    expect(screen.queryByText('Gone')).not.toBeInTheDocument()
  })

  it('falls back when there is no published chrome', () => {
    renderNav(undefined)
    expect(screen.getByRole('link', { name: 'About' })).toBeInTheDocument()
  })

  it('falls back when every CMS link is unresolvable', () => {
    // Chrome is the one thing that must never disappear: without it there is no way to reach the
    // page that would explain what went wrong.
    renderNav([cmsLink('Gone', null)])
    expect(screen.getByRole('link', { name: 'About' })).toBeInTheDocument()
  })
})

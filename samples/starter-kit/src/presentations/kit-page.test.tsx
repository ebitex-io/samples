import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { ContentProvider, Experience } from '@ebitex/content-sdk/react'
import type { ExperienceResult } from '@ebitex/content-sdk'
import { describe, expect, it } from 'vitest'

import { Markdown } from '@/components/Markdown'
import KitPage from '@/presentations/kit-page'
import delivery from '@/test/fixtures/home-delivery.json'

/**
 * `home-delivery.json` is a real answer from the Delivery API for the demo page (captured with
 * `resolveLocation`, nothing edited but the host name). A renderer proved only on a hand-written
 * fixture can pass while rendering a hollow page against the real thing, so these tests read what
 * the server actually sends: references already expanded, contextual values overlaid, localized
 * values collapsed, links resolved.
 */
function renderHome(result: unknown = delivery) {
  return render(
    <MemoryRouter>
      <ContentProvider renderers={{ 'kit-page': KitPage }} markdown={Markdown}>
        <Experience result={result as ExperienceResult} />
      </ContentProvider>
    </MemoryRouter>,
  )
}

describe('the kit page, rendered from a real delivery response', () => {
  it('draws the inline hero with its heading, lead and both actions', () => {
    renderHome()
    expect(screen.getByRole('heading', { level: 1, name: 'Build a site from a kit that already works' })).toBeInTheDocument()
    expect(screen.getByText(/ten ready presentations/)).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Get started' }).length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: 'Read the docs' })).toHaveAttribute('href', 'https://developers.ebitex.io')
  })

  it('draws the same banner twice with two different tones, chosen where it is placed', () => {
    renderHome()
    const banners = screen.getAllByText(/The starter kit is here\./)
    expect(banners).toHaveLength(2)
    expect(banners[0].closest('[role]')).toHaveAttribute('role', 'status')
    expect(banners[1].closest('[role]')).toHaveAttribute('role', 'alert')
  })

  it('draws rich text, features in a grid, cards with one emphasised, and a call to action', () => {
    renderHome()
    expect(screen.getByRole('heading', { name: 'Built from reusable parts' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Fast to start' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Safe to update' })).toBeInTheDocument()
    const sections = screen.getByRole('heading', { name: 'Sections' }).closest('article')!
    const pages = screen.getByRole('heading', { name: 'Pages' }).closest('article')!
    expect(sections.className).toContain('border-accent')
    expect(pages.className).not.toContain('border-accent')
    expect(screen.getByRole('heading', { name: 'Start from a good place' })).toBeInTheDocument()
  })

  it('draws the media figure with its alternative text and caption', () => {
    renderHome()
    expect(screen.getByRole('img', { name: /abstract illustration/ })).toHaveAttribute('src')
    expect(screen.getByText('A page is a list of sections.')).toBeInTheDocument()
  })

  it('labels tabs and accordion items from the placing edge, and opens the one marked open', async () => {
    const user = userEvent.setup()
    renderHome()
    const tabs = screen.getAllByRole('tab')
    expect(tabs.map((t) => t.textContent)).toEqual(['Overview', 'Details'])
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    await user.click(tabs[1])
    expect(screen.getByText(/draws all ten presentations/)).toBeVisible()

    const first = screen.getByRole('button', { name: 'Can I reuse one section in many places?' })
    const second = screen.getByRole('button', { name: 'How do I change something the kit provides?' })
    expect(first).toHaveAttribute('aria-expanded', 'true')
    expect(second).toHaveAttribute('aria-expanded', 'false')
    await user.click(second)
    expect(second).toHaveAttribute('aria-expanded', 'true')
    expect(within(screen.getByRole('region', { name: /How do I change something/ })).getByText(/Duplicate the item/)).toBeInTheDocument()
  })

  it('gives a section its anchor and never leaves a section hollow', () => {
    const { container } = renderHome()
    expect(container.querySelector('#features')).not.toBeNull()
    expect(container.querySelector('#faq')).not.toBeNull()
    expect(container.querySelector('[data-kit-unknown]')).toBeNull()
  })

  it('draws a section it does not know as nothing, and says so in the DOM', () => {
    const copy = structuredClone(delivery) as unknown as { presentation: { component: { content: { sections: Array<{ contract: { externalId: string } }> } } } }
    copy.presentation.component.content.sections[0].contract.externalId = 'tenant-own-contract'
    const { container } = renderHome(copy)
    expect(container.querySelector('[data-kit-unknown="tenant-own-contract"]')).not.toBeNull()
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })
})

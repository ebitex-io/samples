import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { ContentProvider, Experience } from '@ebitex/content-sdk/react'
import type { ExperienceResult } from '@ebitex/content-sdk'
import { KitMarkdown, KitProvider } from '@ebitex/starter-kit-react/react'
import { describe, expect, it } from 'vitest'

import { kitOptions } from '@/lib/kit'
import { renderers } from '@/lib/content'
import delivery from '@/test/fixtures/home-delivery.json'

/**
 * `home-delivery.json` is a real answer from the Delivery API for the demo experience the starter kit installs (captured from a production
 * organization, with one Assets image chosen for the media section). The package's own tests read the same file; this one proves the site's wiring.
 */
function renderHome(options = kitOptions) {
  return render(
    <MemoryRouter>
      <KitProvider {...options}>
        <ContentProvider renderers={renderers} markdown={KitMarkdown}>
          <Experience result={delivery as unknown as ExperienceResult} />
        </ContentProvider>
      </KitProvider>
    </MemoryRouter>,
  )
}

describe('the starter kit site', () => {
  it('draws the installed demo through the published renderer, theme included', () => {
    const { container } = renderHome()

    expect(screen.getByRole('heading', { level: 1, name: 'Start from a site that already works' })).toBeInTheDocument()
    expect(container.querySelector('main')).toHaveAttribute('data-kit-theme', 'default')
    expect(screen.getByRole('img', { name: 'A gradient picture from Assets' })).toBeInTheDocument()
  })

  it('navigates this site\'s own addresses without a page load, and sends other addresses to the browser', () => {
    const copy = structuredClone(delivery) as unknown as { presentation: { component: { content: { hero: { content: { primaryAction: { content: { href: { url: string } } } } } } } } }
    copy.presentation.component.content.hero.content.primaryAction.content.href.url = '/pricing'
    render(
      <MemoryRouter>
        <KitProvider {...kitOptions}>
          <ContentProvider renderers={renderers} markdown={KitMarkdown}>
            <Experience result={copy as unknown as ExperienceResult} />
          </ContentProvider>
        </KitProvider>
      </MemoryRouter>,
    )

    expect(screen.getAllByRole('link', { name: 'Get started' })[0]).toHaveAttribute('href', '/pricing')
    expect(screen.getAllByRole('link', { name: 'Read the docs' })[0]).toHaveAttribute('href', 'https://developers.ebitex.io')
  })
})

import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { ContentProvider, Experience } from '@ebitex/content-sdk/react'
import type { ContentClient, ExperienceResult } from '@ebitex/content-sdk'
import { EbitexMarkdown, EbitexProvider } from '@ebitex/starter-kit-react/react'
import { describe, expect, it } from 'vitest'

import { ebitexOptions } from '@/lib/ebitex'
import { renderers } from '@/lib/content'
import delivery from '@/test/fixtures/home-delivery.json'
import chrome from '@/test/fixtures/site-chrome-delivery.json'

/**
 * `home-delivery.json` is a real answer from the Delivery API for the demo experience the starter kit installs (installed into a database, published through
 * the real jobs and read back through the real endpoint). The package's own tests read the same file; this one proves the site's wiring.
 */
// The SDK wraps a path result with the site it came from and the resolve strategy it asked for; the server sends neither.
const asExperience = (result: unknown) =>
  ({ ...(result as { nodeId: string }), site: { rootNodeId: (result as { nodeId: string }).nodeId, name: 'ebitex demo', hosts: [], deliveryEnvironmentId: 'delivery' }, strategy: { strategy: 'full', depth: 10 } }) as unknown as ExperienceResult

function renderHome(options = ebitexOptions) {
  return render(
    <MemoryRouter>
      <EbitexProvider {...options}>
        <ContentProvider renderers={renderers} markdown={EbitexMarkdown}>
          <Experience result={asExperience(delivery)} />
        </ContentProvider>
      </EbitexProvider>
    </MemoryRouter>,
  )
}

describe('the starter kit site', () => {
  it('draws the installed demo through the published renderer, theme included', () => {
    const { container } = renderHome()

    expect(screen.getByRole('heading', { level: 1, name: 'Start from a site that already works' })).toBeInTheDocument()
    expect(container.querySelector('main')).toHaveAttribute('data-ebitex-theme', 'default')
    expect(screen.getByText('Choose media in Assets')).toBeInTheDocument()
  })

  it('navigates this site\'s own addresses without a page load, and sends other addresses to the browser', () => {
    const copy = structuredClone(delivery) as unknown as { presentation: { component: { content: { hero: { component: { content: Record<string, { content: { href: { url: string } } }> } } } } } }
    copy.presentation.component.content.hero.component.content['primary-action'].content.href.url = '/pricing'
    render(
      <MemoryRouter>
        <EbitexProvider {...ebitexOptions}>
          <ContentProvider renderers={renderers} markdown={EbitexMarkdown}>
            <Experience result={asExperience(copy)} />
          </ContentProvider>
        </EbitexProvider>
      </MemoryRouter>,
    )

    expect(screen.getAllByRole('link', { name: 'Get started' })[0]).toHaveAttribute('href', '/pricing')
    expect(screen.getAllByRole('link', { name: 'Read the docs' })[0]).toHaveAttribute('href', 'https://developers.ebitex.io')
  })

  it("draws the site header and footer around the page when the Site chrome Component is published, through this site's own links", async () => {
    // `site-chrome-delivery.json` is the real answer for the kit's demo Site chrome, read by its external id the way the kit reads it.
    const client = { resolveReference: async () => structuredClone(chrome), peekReference: () => undefined } as unknown as ContentClient
    render(
      <MemoryRouter>
        <EbitexProvider {...ebitexOptions} client={client}>
          <ContentProvider renderers={renderers} markdown={EbitexMarkdown}>
            <Experience result={asExperience(delivery)} />
          </ContentProvider>
        </EbitexProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('banner')).toHaveTextContent('ebitex starter kit')
    expect(await screen.findByRole('contentinfo')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'ebitex starter kit' })).toHaveAttribute('href', '/')
  })
})

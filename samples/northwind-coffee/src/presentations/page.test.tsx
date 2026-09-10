import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Page from '@/presentations/page'
import { renderInProvider } from '@/test/renderInProvider'

/**
 * A renderer is an ordinary component, so it tests like one -- no network, no organization, no
 * key. The fixture is the delivered shape: a document keyed by the Contract's field external ids.
 *
 * The second test is the one worth having. Every field except `title` is optional, so a renderer
 * that assumes a field is present breaks on the first page an author leaves it off -- and that
 * page is always in production rather than in a test.
 */
describe('the page Template', () => {
  it('renders the title, summary and body', () => {
    renderInProvider(
      <Page
        template={{ id: 't', externalId: 'page', version: 1 }}
        settings={{}}
        component={{
          provider: 'core',
          key: 'c',
          content: {
            title: 'A small roastery',
            description: 'Roasted on a Tuesday.',
            body: [{ kind: 'markdown', markdown: 'We started in **2016**.' }],
          },
        }}
      />,
    )

    expect(screen.getByRole('heading', { name: 'A small roastery' })).toBeInTheDocument()
    expect(screen.getByText('Roasted on a Tuesday.')).toBeInTheDocument()
    expect(screen.getByText('2016')).toBeInTheDocument()
  })

  it('renders with every optional field absent', () => {
    renderInProvider(
      <Page
        template={{ id: 't', externalId: 'page', version: 1 }}
        settings={{}}
        component={{ provider: 'core', key: 'c', content: { title: 'Just a title' } }}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Just a title' })).toBeInTheDocument()
  })
})

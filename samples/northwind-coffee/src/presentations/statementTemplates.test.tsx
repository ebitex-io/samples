import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Hero from '@/presentations/hero'
import Prose from '@/presentations/prose'
import type { Statement } from '@/types/content'
import { renderInProvider } from '@/test/renderInProvider'

/**
 * `hero` and `prose` render the same Contract, which is the point of having both, so they are
 * tested against the same fixture. If one of them ever needs a field the other does not, that is
 * a signal the Contract has drifted into being two content types wearing one name.
 */
const statement: Statement = {
  heading: 'Coffee worth the wait',
  standfirst: 'Four farms. Two roast days a week.',
  body: [{ kind: 'markdown', markdown: 'We are a small roastery.' }],
  cta: { kind: 'external', url: 'https://example.com/shop', resolved: true },
  'cta-label': 'Shop',
}

function renderStatement(
  Renderer: typeof Hero | typeof Prose,
  content: Statement = statement,
) {
  renderInProvider(
    <Renderer
      template={{ id: 't', externalId: 'hero', version: 1 }}
      settings={{}}
      component={{ provider: 'core', key: 'c', content }}
    />,
  )
}

describe.each([
  ['hero', Hero],
  ['prose', Prose],
] as const)('the %s Template', (_name, Renderer) => {
  it('renders every field', () => {
    renderStatement(Renderer)
    expect(screen.getByRole('heading', { name: 'Coffee worth the wait' })).toBeInTheDocument()
    expect(screen.getByText('Four farms. Two roast days a week.')).toBeInTheDocument()
    expect(screen.getByText('We are a small roastery.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Shop' })).toHaveAttribute(
      'href',
      'https://example.com/shop',
    )
  })

  it('renders a finished-looking block with only the mandatory heading', () => {
    renderStatement(Renderer, { heading: 'Just a heading' })
    expect(screen.getByRole('heading', { name: 'Just a heading' })).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('renders no link when the target page is unpublished', () => {
    // The experience arm delivers `url: null` rather than failing, so a link to a page that has
    // been unpublished must simply not render. This is the case most likely to reach production.
    renderStatement(Renderer, {
      heading: 'Heading',
      cta: { kind: 'experience', target: { provider: 'core', key: 'n' }, url: null, resolved: false },
      'cta-label': 'Nowhere',
    })
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})

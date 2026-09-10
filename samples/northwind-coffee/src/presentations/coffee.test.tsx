import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Coffee from '@/presentations/coffee'
import type { CoffeeContent } from '@/lib/cmsTypes'
import { renderInProvider } from '@/test/renderInProvider'

const image: CoffeeContent['image'] = {
  provider: 'core',
  key: 'img',
  content: {
    file: { blobId: 'b', contentType: 'image/svg+xml', sizeBytes: 1, url: 'https://cdn.test/b.svg' },
    alt: 'An abstract pattern.',
  },
}

function renderCoffee(content: CoffeeContent) {
  renderInProvider(
    <Coffee
      template={{ id: 't', externalId: 'coffee', version: 1 }}
      settings={{}}
      component={{ provider: 'core', key: 'c', content }}
    />,
  )
}

describe('the coffee Template', () => {
  it('renders the name, producer, notes, price and image', () => {
    renderCoffee({
      name: 'Ethiopia Guji',
      producer: 'Kayon Mountain Farm',
      'tasting-notes': ['Peach', 'Bergamot'],
      price: 14.5,
      'weight-grams': 250,
      image,
    })

    expect(screen.getByRole('heading', { name: 'Ethiopia Guji' })).toBeInTheDocument()
    expect(screen.getByText('Kayon Mountain Farm')).toBeInTheDocument()
    expect(screen.getByText('Peach')).toBeInTheDocument()
    expect(screen.getByText('£14.50')).toBeInTheDocument()
    expect(screen.getByAltText('An abstract pattern.')).toHaveAttribute(
      'src',
      'https://cdn.test/b.svg',
    )
  })

  it('renders with only the mandatory name', () => {
    // Everything but `name` is optional on the Contract, so this is a state an author can reach
    // on the very first coffee they add -- and it must look unfinished, not broken.
    renderCoffee({ name: 'Just a name' })
    expect(screen.getByRole('heading', { name: 'Just a name' })).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})

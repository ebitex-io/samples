import { describe, expect, it } from 'vitest'
import type { PresentationEnvelope, RichTextValue } from '@ebitex/content-sdk'

import { metadataFor } from './pageMetadata'
import { plainTextFrom } from './richText'

/** The delivered shape, with only the members this map actually reads. */
function envelope(contractExternalId: string, content: unknown): PresentationEnvelope {
  return {
    template: { id: 't', externalId: contractExternalId, version: 1 },
    settings: {},
    component: {
      provider: 'core',
      key: 'k',
      contract: { id: 'c', externalId: contractExternalId, version: 1 },
      content,
    },
  } as unknown as PresentationEnvelope
}

const md = (markdown: string): RichTextValue => [{ kind: 'markdown', markdown }]

const image = (url: string, alt: string) => ({
  provider: 'core',
  key: 'img',
  contract: { id: 'ci', externalId: 'image', version: 1 },
  content: { file: { url, contentType: 'image/jpeg', sizeBytes: 1 }, alt },
})

describe('metadataFor', () => {
  it('reads a page description straight off the field the model calls the meta description', () => {
    const m = metadataFor(envelope('page', { title: 'About', description: 'A small roastery.' }))
    expect(m.description).toBe('A small roastery.')
    expect(m.jsonLd).toMatchObject({ '@type': 'WebPage', name: 'About' })
  })

  it('describes a coffee as a Product, with the app currency and no invented one', () => {
    const m = metadataFor(
      envelope('coffee', {
        name: 'Ethiopia Guji',
        producer: 'Shakiso',
        description: md('A **washed** Guji, dried on raised beds.'),
        price: 19.5,
        'weight-grams': 250,
        image: image('https://cdn.example/guji.jpg', 'A bag of Ethiopia Guji'),
      }),
    )
    expect(m.description).toBe('A washed Guji, dried on raised beds.')
    expect(m.image).toEqual({ url: 'https://cdn.example/guji.jpg', alt: 'A bag of Ethiopia Guji' })
    expect(m.jsonLd).toMatchObject({
      '@type': 'Product',
      name: 'Ethiopia Guji',
      offers: { '@type': 'Offer', price: '19.50', priceCurrency: 'GBP' },
    })
  })

  // schema.org's `totalTime` is typed. The content's is free text, so anything it cannot be read as
  // is omitted rather than emitted in a shape that reads plausibly and is invalid.
  it.each([
    ['4 minutes', 'PT4M'],
    ['1 hour 30 mins', 'PT1H30M'],
    ['PT4M', 'PT4M'],
  ])('converts a total time of %s to %s', (authored, expected) => {
    const m = metadataFor(envelope('guide', { heading: 'G', 'total-time': authored }))
    expect(m.jsonLd).toMatchObject({ totalTime: expected })
  })

  it.each(['about a quarter of an hour', 'overnight', ''])(
    'omits totalTime entirely for %j rather than emitting an invalid duration',
    (authored) => {
      const m = metadataFor(envelope('guide', { heading: 'G', 'total-time': authored }))
      expect(m.jsonLd).not.toHaveProperty('totalTime')
    },
  )

  it('omits offers entirely when a coffee carries no price, rather than emitting a null one', () => {
    const m = metadataFor(envelope('coffee', { name: 'Unpriced' }))
    expect(m.jsonLd).not.toHaveProperty('offers')
    expect(m.jsonLd).not.toHaveProperty('image')
  })

  it('describes a guide as a HowTo, one step per authored step', () => {
    const m = metadataFor(
      envelope('guide', {
        heading: 'Pour-over',
        summary: 'How we brew it.',
        'total-time': 'PT4M',
        equipment: ['A V60', 'Filter papers'],
        steps: [
          { content: { heading: 'Rinse', body: md('Rinse the paper.') } },
          { content: { heading: 'Bloom', body: md('Add 60g of water.') } },
        ],
      }),
    )
    expect(m.description).toBe('How we brew it.')
    expect(m.jsonLd).toMatchObject({ '@type': 'HowTo', totalTime: 'PT4M' })
    expect((m.jsonLd as { step: unknown[] }).step).toHaveLength(2)
    expect((m.jsonLd as { step: { position: number; name: string }[] }).step[1]).toMatchObject({
      position: 2,
      name: 'Bloom',
    })
  })

  // The row that is a correction rather than a port: the deleted `useDocumentMeta` call passed
  // `country`, so /origins/ethiopia described itself as the single word "Ethiopia" while `summary`
  // had held real prose all along.
  it('describes an origin from its summary, never from its country', () => {
    const m = metadataFor(
      envelope('origin', {
        name: 'Ethiopia',
        country: 'Ethiopia',
        summary: md('The birthplace of coffee, and still the most various.'),
      }),
    )
    expect(m.description).toBe('The birthplace of coffee, and still the most various.')
    expect(m.description).not.toBe('Ethiopia')
  })

  // The three pages whose body is a list passed no description at all.
  it.each(['coffee-index', 'guide-index', 'store-list'])('gives %s a description from its intro', (contract) => {
    const m = metadataFor(envelope(contract, { heading: 'Heading', intro: md('An introduction.') }))
    expect(m.description).toBe('An introduction.')
    expect(m.jsonLd).toMatchObject({ '@type': 'CollectionPage', name: 'Heading' })
  })

  // A Contract added tomorrow must render, not break. Describing itself less is the right failure.
  it('returns nothing for an unrecognised Contract, and never throws', () => {
    expect(metadataFor(envelope('something-new', { whatever: 1 }))).toEqual({})
    expect(metadataFor(undefined)).toEqual({})
  })
})

describe('plainTextFrom', () => {
  it('strips markup rather than rendering it', () => {
    expect(plainTextFrom(md('A [linked](https://example.com) word, **bold** and `code`.'))).toBe(
      'A linked word, bold and code.',
    )
  })

  it('drops embed tokens, fenced code and images', () => {
    expect(plainTextFrom(md('Before {{embed:abc}} after.'))).toBe('Before after.')
    expect(plainTextFrom(md('Text.\n\n```js\nconst x = 1\n```'))).toBe('Text.')
    expect(plainTextFrom(md('![alt text](a.png) Words.'))).toBe('Words.')
  })

  it('drops leading block markers', () => {
    expect(plainTextFrom(md('## A heading\n\nAnd a line.'))).toBe('A heading And a line.')
    expect(plainTextFrom(md('- one\n- two'))).toBe('one two')
  })

  it('truncates on a word boundary', () => {
    const out = plainTextFrom(md('word '.repeat(60)), 40)!
    expect(out.length).toBeLessThanOrEqual(41)
    expect(out.endsWith('…')).toBe(true)
    expect(out).not.toMatch(/wor…$/)
  })

  it('reads the first markdown fragment only, and nothing from a non-markdown value', () => {
    expect(plainTextFrom([{ kind: 'markdown', markdown: 'One.' }, { kind: 'markdown', markdown: 'Two.' }])).toBe('One.')
    expect(plainTextFrom(undefined)).toBeUndefined()
    expect(plainTextFrom([])).toBeUndefined()
  })
})
